import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

import { generateIdentityKeyPair, exportIdentityPublicKeyBase64 } from "./crypto/keyGeneration";
import { storePrivateKey, loadPrivateKey } from "./crypto/keyStorage";
import {
  generateEphemeralECDH,
  exportECDHPublicKeyBase64,
  importECDHPublicKeyBase64,
  deriveSessionKey,
} from "./crypto/ephemeralKx";
import { encryptJson, decryptJson } from "./crypto/aesGcm";
import {
  fetchPeerPublicKeyB64,
  importIdentityPublicKey,
  signBody,
  verifyBody,
} from "./crypto/identityKeys";

const socket = io("http://localhost:4000");

const publicKeyCache = {}; // username -> CryptoKey
const sessionState = {}; 
// { sessionId: { role, peer, ourEphemeral, sessionKey, nonceA, nonceB, confirmed } }

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function isFreshTimestamp(ts) {
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return false;
  return Math.abs(Date.now() - t) <= MAX_CLOCK_SKEW_MS;
}

async function getVerifyKeyForUser(username) {
  if (publicKeyCache[username]) return publicKeyCache[username];
  const b64 = await fetchPeerPublicKeyB64(username);
  const key = await importIdentityPublicKey(b64);
  publicKeyCache[username] = key;
  return key;
}

function App() {
  const [status, setStatus] = useState("Disconnected");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerStatus, setRegisterStatus] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [peerUsername, setPeerUsername] = useState("");
  const [kxLog, setKxLog] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]); 
  // {direction, from, to, text, ts, seq, iv, ciphertextLength}

  const pushKxLog = (msg) => {
    setKxLog((prev) => [...prev, msg]);
  };

  const addChatMessage = (msg) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterStatus("Registering...");
    try {
      // 1) Generate identity ECDSA keypair
      const idKeyPair = await generateIdentityKeyPair();

      // 2) Store IDENTITY private key locally in IndexedDB
      await storePrivateKey(idKeyPair.privateKey);

      // 3) Export IDENTITY public key to Base64 SPKI
      const publicKeyB64 = await exportIdentityPublicKeyBase64(idKeyPair.publicKey);

      // 4) Send username, password and publicKey to backend
      await axios.post("http://localhost:4000/api/register", {
        username,
        password,
        publicKey: publicKeyB64,        // 🔐 THIS is the identity public key
      });

      setRegisterStatus("User registered + keys created securely ✅");
    } catch (err) {
      console.error("Register error", err);
      setRegisterStatus("Registration failed ❌");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus("Logging in...");
    try {
      const res = await axios.post("http://localhost:4000/api/login", {
        username: loginUsername,
        password: loginPassword,
      });
      setCurrentUser(res.data.username);
      setLoginStatus("Login successful ✅");
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
      setLoginStatus("Login failed ❌ (check username/password)");
    }
  };

  const startKeyExchange = async () => {
    if (!currentUser || !peerUsername) {
      pushKxLog("Need logged-in user and peer username to start KX.");
      return;
    }
    const idPriv = await loadPrivateKey();
    if (!idPriv) {
      pushKxLog("Identity private key not found; cannot start KX.");
      return;
    }
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const nonceA = Math.random().toString(36).slice(2);
    const ephKeyPair = await generateEphemeralECDH();
    const ephemeralPubA = await exportECDHPublicKeyBase64(ephKeyPair.publicKey);
    sessionState[sessionId] = {
      role: "initiator",
      peer: peerUsername,
      ourEphemeral: ephKeyPair,
      sessionKey: null,
      nonceA,
      nonceB: null,
      confirmed: false,
    };
    const body = {
      type: "KX_INIT",
      from: currentUser,
      to: peerUsername,
      sessionId,
      ephemeralPubA,
      nonceA,
      seq: 1,
      ts: now,
    };
    const signature = await signBody(idPriv, body);
    const data = { body, signature };
    socket.emit("kx-init", data);
    pushKxLog(
      `Sent KX_INIT to ${peerUsername} (sessionId=${sessionId}, nonceA=${nonceA})`
    );
  };

  const sendEncryptedMessage = async () => {
    if (!activeSessionId) {
      pushKxLog("No active session for chat.");
      return;
    }
    if (!chatInput.trim()) return;

    const session = sessionState[activeSessionId];
    if (!session || !session.sessionKey) {
      pushKxLog("Session key not available for active session.");
      return;
    }

    const text = chatInput.trim();
    const ts = new Date().toISOString();
    // simple sequence for now – we can later per-session increment
    const seq = Date.now();

    const payload = { text, ts, seq };

    const { ivB64, ciphertextB64 } = await encryptJson(
      session.sessionKey,
      payload
    );

    const msg = {
      from: currentUser,
      to: session.peer,
      sessionId: activeSessionId,
      iv: ivB64,
      ciphertext: ciphertextB64,
      ts,
      seq,
    };

    socket.emit("chat-message-encrypted", msg);

    addChatMessage({
      direction: "out",
      from: currentUser,
      to: session.peer,
      text,
      ts,
      seq,
      iv: ivB64,
      ciphertextLength: ciphertextB64.length,
    });

    pushKxLog(
      `Sent encrypted message seq=${seq} to ${session.peer} (len=${ciphertextB64.length})`
    );

    setChatInput("");
  };

  useEffect(() => {
    socket.on("connect", () => {
      setStatus("Connected ✅");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected ❌");
    });

    socket.on("kx-init", async (data) => {
      const { body, signature } = data;
      const { from, to, sessionId, ephemeralPubA, nonceA, ts } = body;
      // 1) Freshness check
      if (!isFreshTimestamp(ts)) {
        pushKxLog(`KX_INIT from ${from} rejected: stale timestamp`);
        return;
      }
      // 2) Signature verification
      const verifyKey = await getVerifyKeyForUser(from);
      const ok = await verifyBody(verifyKey, body, signature);
      if (!ok) {
        pushKxLog(`KX_INIT from ${from} rejected: signature invalid`);
        return;
      }
      pushKxLog(
        `Received valid KX_INIT from ${from} (sessionId=${sessionId}, nonceA=${nonceA})`
      );
      // 3) Generate our ephemeral ECDH keypair (responder, e.g., bob)
      const ephKeyPairB = await generateEphemeralECDH();
      const ephemeralPubB = await exportECDHPublicKeyBase64(ephKeyPairB.publicKey);
      // 4) Import sender's ECDH public key
      const theirECDHPub = await importECDHPublicKeyBase64(ephemeralPubA);
      // 5) Pick our nonceB
      const nonceB = Math.random().toString(36).slice(2);
      const now = new Date().toISOString();
      // 6) Derive session key (responder side)
      const sessionKey = await deriveSessionKey(ephKeyPairB.privateKey, theirECDHPub, {
        sessionId,
        from,
        to,
        nonceA,
        nonceB,
      });
      // 7) Save session state
      sessionState[sessionId] = {
        role: "responder",
        peer: from,
        ourEphemeral: ephKeyPairB,
        sessionKey,
        nonceA,
        nonceB,
        confirmed: false,
      };
      setActiveSessionId(sessionId);
      pushKxLog(`Responder: session key derived, activeSessionId=${sessionId}`);
      // 8) Build KX_RESPONSE body
      const responseBody = {
        type: "KX_RESPONSE",
        from: to, // me
        to: from,
        sessionId,
        ephemeralPubB,
        nonceA,
        nonceB,
        seq: 2,
        ts: now,
      };
      const idPriv = await loadPrivateKey();
      const responseSignature = await signBody(idPriv, responseBody);
      const responseData = {
        body: responseBody,
        signature: responseSignature,
      };
      socket.emit("kx-response", responseData);
      pushKxLog(
        `Sent KX_RESPONSE to ${from} (sessionId=${sessionId}, nonceB=${nonceB})`
      );
    });

    socket.on("kx-response", async (data) => {
      const { body, signature } = data;
      const { from, to, sessionId, ephemeralPubB, nonceA, nonceB, ts } = body;

      if (!isFreshTimestamp(ts)) {
        pushKxLog(`KX_RESPONSE from ${from} rejected: stale timestamp`);
        return;
      }

      const verifyKey = await getVerifyKeyForUser(from);
      const ok = await verifyBody(verifyKey, body, signature);
      if (!ok) {
        pushKxLog(`KX_RESPONSE from ${from} rejected: signature invalid`);
        return;
      }

      pushKxLog(
        `Received valid KX_RESPONSE from ${from} (sessionId=${sessionId}, nonceB=${nonceB})`
      );

      const session = sessionState[sessionId];
      if (!session || session.role !== "initiator") {
        pushKxLog(`No initiator session found for sessionId=${sessionId}`);
        return;
      }

      // 1) Import responder's ephemeral ECDH public key
      const theirECDHPub = await importECDHPublicKeyBase64(ephemeralPubB);

      // 2) Derive the same session key on initiator side
      const sessionKey = await deriveSessionKey(
        session.ourEphemeral.privateKey,
        theirECDHPub,
        {
          sessionId,
          from: to, // me
          to: from,
          nonceA,
          nonceB,
        }
      );

      session.sessionKey = sessionKey;
      session.nonceB = nonceB;
      session.confirmed = false;
      setActiveSessionId(sessionId);
      pushKxLog(`Initiator: session key derived, activeSessionId=${sessionId}`);

      pushKxLog(
        `Session key established with ${from} ✅ (sessionId=${sessionId})`
      );

      // 3) Send encrypted key confirmation (M3)
      const confirmPayload = {
        type: "KX_CONFIRM",
        sessionId,
        nonceB,   // prove we saw responder's nonce
        seq: 3,
        ts: new Date().toISOString(),
      };
      const { ivB64, ciphertextB64 } = await encryptJson(
        sessionKey,
        confirmPayload
      );
      const confirmMsg = {
        from: currentUser,
        to: from,
        sessionId,
        iv: ivB64,
        ciphertext: ciphertextB64,
      };
      socket.emit("kx-confirm", confirmMsg);
      pushKxLog(`Sent KX_CONFIRM to ${from} (sessionId=${sessionId})`);
    });

    socket.on("kx-confirm", async (data) => {
      const { from, to, sessionId, iv, ciphertext } = data;
      const session = sessionState[sessionId];

      if (!session || !session.sessionKey) {
        pushKxLog(`KX_CONFIRM for unknown session ${sessionId}`);
        return;
      }

      try {
        const payload = await decryptJson(session.sessionKey, iv, ciphertext);

        if (
          payload.type !== "KX_CONFIRM" ||
          payload.sessionId !== sessionId ||
          payload.nonceB !== session.nonceB ||
          payload.seq !== 3 ||
          !isFreshTimestamp(payload.ts)
        ) {
          pushKxLog(`KX_CONFIRM validation failed for sessionId=${sessionId}`);
          return;
        }

        session.confirmed = true;
        pushKxLog(`Session ${sessionId} confirmed with ${from} ✅`);
      } catch (err) {
        console.error("KX_CONFIRM decrypt error:", err);
        pushKxLog(`KX_CONFIRM decryption failed for sessionId=${sessionId}`);
      }
    });

    socket.on("chat-message-encrypted", async (data) => {
      const { from, to, sessionId, iv, ciphertext, ts, seq } = data;

      const session = sessionState[sessionId];
      if (!session || !session.sessionKey) {
        pushKxLog(
          `Received encrypted message for unknown or uninitialized sessionId=${sessionId}`
        );
        return;
      }

      try {
        const payload = await decryptJson(session.sessionKey, iv, ciphertext);

        addChatMessage({
          direction: from === currentUser ? "out" : "in",
          from,
          to,
          text: payload.text,
          ts: payload.ts,
          seq,
          iv,
          ciphertextLength: ciphertext.length,
        });

        pushKxLog(
          `Decrypted message seq=${seq} from ${from}: "${payload.text}"`
        );
      } catch (err) {
        console.error("Decryption error:", err);
        pushKxLog(`Decryption failed for message seq=${seq}`);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("kx-init");
      socket.off("kx-response");
      socket.off("kx-confirm");
      socket.off("chat-message-encrypted");
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      socket.emit("register-user", { username: currentUser });
      console.log("Registered user on socket:", currentUser);
    }
  }, [currentUser]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>Secure E2EE System - Transport Test</h2>
      <p>Socket Status: <strong>{status}</strong></p>

      <div style={{ marginTop: "40px", maxWidth: "400px" }}>
        <h3>Register New User</h3>
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "10px" }}>
            <label>Username</label><br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Password</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        {registerStatus && (
          <p style={{ marginTop: "10px" }}>
            {registerStatus}
          </p>
        )}
      </div>

      <div style={{ marginTop: "40px", maxWidth: "400px" }}>
        <h3>Login</h3>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "10px" }}>
            <label>Username</label><br />
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Password</label><br />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        {loginStatus && (
          <p style={{ marginTop: "10px" }}>{loginStatus}</p>
        )}
        {currentUser && (
          <p style={{ marginTop: "10px" }}>
            Logged in as: <strong>{currentUser}</strong>
          </p>
        )}
      </div>

      <div style={{ marginTop: "40px", maxWidth: "400px" }}>
        <h3>Key Exchange (Skeleton)</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>Peer Username</label><br />
          <input
            type="text"
            value={peerUsername}
            onChange={(e) => setPeerUsername(e.target.value)}
            placeholder="e.g., alice"
          />
        </div>
        <button onClick={startKeyExchange} disabled={!currentUser || !peerUsername}>
          Start Key Exchange
        </button>
        <div style={{ marginTop: "15px" }}>
          <h4>Key Exchange Log</h4>
          <ul>
            {kxLog.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "40px", maxWidth: "600px" }}>
        <h3>Encrypted Chat</h3>

        {activeSessionId ? (
          <p>
            Active session: <code>{activeSessionId}</code>
            <br />
            Peer: <strong>{sessionState[activeSessionId]?.peer}</strong>
          </p>
        ) : (
          <p>No active secure session yet. Run key exchange first.</p>
        )}

        <div style={{ marginBottom: "10px" }}>
          <textarea
            rows={3}
            style={{ width: "100%" }}
            placeholder="Type a message to send encrypted..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={!activeSessionId}
          />
        </div>

        <button
          onClick={sendEncryptedMessage}
          disabled={!activeSessionId || !chatInput.trim()}
        >
          Send Encrypted
        </button>

        <div style={{ marginTop: "20px" }}>
          <h4>Chat Messages (Decrypted View)</h4>
          <ul>
            {chatMessages.map((m, idx) => (
              <li key={idx}>
                [{new Date(m.ts).toLocaleTimeString()}]{" "}
                <strong>{m.direction === "out" ? "You" : m.from}</strong>:{" "}
                {m.text}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Technical View (Cipher Details)</h4>
          <ul>
            {chatMessages.map((m, idx) => (
              <li key={idx}>
                seq={m.seq}, dir={m.direction}, iv={m.iv.slice(0, 12)}..., 
                cipherLen={m.ciphertextLength}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
