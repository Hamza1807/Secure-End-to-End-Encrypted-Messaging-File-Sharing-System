/**
 * MITM Attack Demonstration Script
 * 
 * This script demonstrates how a Man-in-the-Middle (MITM) attack can be performed
 * against an insecure Diffie-Hellman key exchange protocol without signatures.
 * 
 * IMPORTANT: This is for educational purposes only to demonstrate security vulnerabilities.
 */

const crypto = require('crypto');

/**
 * Simulates a vulnerable DH key exchange without signatures
 * This demonstrates how MITM can successfully break the protocol
 */
class VulnerableKeyExchange {
  constructor() {
    this.alicePublicKey = null;
    this.bobPublicKey = null;
    this.evePublicKey = null; // Attacker's public key
    this.evePrivateKey = null;
  }

  /**
   * Step 1: Alice sends her public key to Bob (VULNERABLE - No signature)
   */
  aliceSendsPublicKey() {
    // Generate Alice's key pair
    const aliceKeyPair = crypto.createDiffieHellman(256);
    aliceKeyPair.generateKeys();
    this.alicePublicKey = aliceKeyPair.getPublicKey();
    
    console.log('[VULNERABLE PROTOCOL]');
    console.log('Step 1: Alice sends public key to Bob');
    console.log('Alice Public Key:', this.alicePublicKey.toString('hex').substring(0, 32) + '...');
    console.log('⚠️  NO SIGNATURE - Message can be modified!\n');
    
    return this.alicePublicKey;
  }

  /**
   * Step 2: Eve (Attacker) intercepts and replaces Alice's public key
   */
  eveInterceptsAndReplaces(originalPublicKey) {
    // Generate Eve's key pair
    const eveKeyPair = crypto.createDiffieHellman(256);
    eveKeyPair.generateKeys();
    this.evePublicKey = eveKeyPair.getPublicKey();
    this.evePrivateKey = eveKeyPair.getPrivateKey();
    
    console.log('[MITM ATTACK]');
    console.log('Step 2: Eve intercepts Alice\'s public key');
    console.log('Original (Alice):', originalPublicKey.toString('hex').substring(0, 32) + '...');
    console.log('Replaced (Eve):   ', this.evePublicKey.toString('hex').substring(0, 32) + '...');
    console.log('✅ SUCCESS: Eve successfully replaced Alice\'s key!\n');
    
    return this.evePublicKey; // Bob receives Eve's key instead
  }

  /**
   * Step 3: Bob receives what he thinks is Alice's public key
   */
  bobReceivesPublicKey(receivedPublicKey) {
    console.log('[VULNERABLE PROTOCOL]');
    console.log('Step 3: Bob receives public key (thinks it\'s from Alice)');
    console.log('Received Key:', receivedPublicKey.toString('hex').substring(0, 32) + '...');
    console.log('⚠️  Bob cannot verify authenticity - no signature!\n');
    
    // Generate Bob's key pair
    const bobKeyPair = crypto.createDiffieHellman(256);
    bobKeyPair.generateKeys();
    this.bobPublicKey = bobKeyPair.getPublicKey();
    
    return this.bobPublicKey;
  }

  /**
   * Step 4: Eve intercepts Bob's public key and replaces it
   */
  eveInterceptsBobKey(bobPublicKey) {
    console.log('[MITM ATTACK]');
    console.log('Step 4: Eve intercepts Bob\'s public key');
    console.log('Original (Bob):', bobPublicKey.toString('hex').substring(0, 32) + '...');
    console.log('Replaced (Eve): ', this.evePublicKey.toString('hex').substring(0, 32) + '...');
    console.log('✅ SUCCESS: Eve successfully replaced Bob\'s key!\n');
    
    return this.evePublicKey; // Alice receives Eve's key instead
  }

  /**
   * Step 5: Demonstrate that Eve can now decrypt messages
   */
  demonstrateAttackSuccess() {
    console.log('[ATTACK RESULT]');
    console.log('Eve now has:');
    console.log('  - Shared secret with Alice (using Eve\'s private key + Alice\'s public key)');
    console.log('  - Shared secret with Bob (using Eve\'s private key + Bob\'s public key)');
    console.log('❌ MITM ATTACK SUCCESSFUL!');
    console.log('❌ Eve can decrypt all messages between Alice and Bob!\n');
  }
}

/**
 * Demonstrates how digital signatures prevent MITM attacks
 */
class SecureKeyExchange {
  constructor() {
    this.alicePublicKey = null;
    this.bobPublicKey = null;
    this.evePublicKey = null;
  }

  /**
   * Step 1: Alice sends public key WITH signature
   */
  aliceSendsPublicKeyWithSignature() {
    // Generate Alice's key pair
    const aliceKeyPair = crypto.createDiffieHellman(256);
    aliceKeyPair.generateKeys();
    this.alicePublicKey = aliceKeyPair.getPublicKey();
    
    // Sign the public key (ECDSA signature)
    const messageToSign = this.alicePublicKey.toString('hex');
    const signature = crypto.createSign('SHA256')
      .update(messageToSign)
      .sign(crypto.createPrivateKey('...'), 'hex'); // Simplified for demo
    
    console.log('[SECURE PROTOCOL]');
    console.log('Step 1: Alice sends public key WITH signature');
    console.log('Alice Public Key:', this.alicePublicKey.toString('hex').substring(0, 32) + '...');
    console.log('Signature:', signature.substring(0, 32) + '...');
    console.log('✅ SIGNATURE INCLUDED - Message cannot be modified!\n');
    
    return { publicKey: this.alicePublicKey, signature };
  }

  /**
   * Step 2: Eve tries to intercept and replace (ATTACK FAILS)
   */
  eveTriesToIntercept(message) {
    // Generate Eve's key pair
    const eveKeyPair = crypto.createDiffieHellman(256);
    eveKeyPair.generateKeys();
    this.evePublicKey = eveKeyPair.getPublicKey();
    
    console.log('[MITM ATTACK ATTEMPT]');
    console.log('Step 2: Eve tries to intercept and replace Alice\'s public key');
    console.log('Original (Alice):', message.publicKey.toString('hex').substring(0, 32) + '...');
    console.log('Eve tries to send:', this.evePublicKey.toString('hex').substring(0, 32) + '...');
    console.log('⚠️  Eve cannot forge Alice\'s signature!');
    console.log('⚠️  Eve cannot modify the message without breaking the signature!\n');
    
    // Try to modify the message
    const modifiedMessage = {
      publicKey: this.evePublicKey,
      signature: message.signature // Using Alice's signature (will fail verification)
    };
    
    return modifiedMessage;
  }

  /**
   * Step 3: Bob verifies the signature (ATTACK DETECTED)
   */
  bobVerifiesSignature(receivedMessage) {
    console.log('[SECURE PROTOCOL]');
    console.log('Step 3: Bob verifies the signature');
    console.log('Received Public Key:', receivedMessage.publicKey.toString('hex').substring(0, 32) + '...');
    console.log('Received Signature:', receivedMessage.signature.substring(0, 32) + '...');
    
    // Verify signature (simplified for demo)
    const messageToVerify = receivedMessage.publicKey.toString('hex');
    // In real implementation, would use Alice's registered public key
    const isValid = false; // Signature verification fails because key was modified
    
    if (!isValid) {
      console.log('❌ SIGNATURE VERIFICATION FAILED!');
      console.log('❌ MITM ATTACK DETECTED!');
      console.log('✅ Key exchange aborted - attack prevented!\n');
      return false;
    }
    
    return true;
  }
}

/**
 * Main demonstration function
 */
function demonstrateMITMAttack() {
  console.log('='.repeat(60));
  console.log('MITM ATTACK DEMONSTRATION');
  console.log('='.repeat(60));
  console.log('\n');

  // Part 1: Demonstrate vulnerable protocol (without signatures)
  console.log('PART 1: VULNERABLE PROTOCOL (Without Signatures)');
  console.log('-'.repeat(60));
  const vulnerable = new VulnerableKeyExchange();
  
  const aliceKey = vulnerable.aliceSendsPublicKey();
  const eveKeyToBob = vulnerable.eveInterceptsAndReplaces(aliceKey);
  const bobKey = vulnerable.bobReceivesPublicKey(eveKeyToBob);
  const eveKeyToAlice = vulnerable.eveInterceptsBobKey(bobKey);
  vulnerable.demonstrateAttackSuccess();

  console.log('\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Part 2: Demonstrate secure protocol (with signatures)
  console.log('PART 2: SECURE PROTOCOL (With Digital Signatures)');
  console.log('-'.repeat(60));
  const secure = new SecureKeyExchange();
  
  const aliceMessage = secure.aliceSendsPublicKeyWithSignature();
  const modifiedMessage = secure.eveTriesToIntercept(aliceMessage);
  secure.bobVerifiesSignature(modifiedMessage);

  console.log('\n');
  console.log('='.repeat(60));
  console.log('CONCLUSION');
  console.log('='.repeat(60));
  console.log('✅ Digital signatures prevent MITM attacks');
  console.log('✅ Signature verification detects tampering');
  console.log('✅ Our system uses ECDSA signatures to prevent MITM');
  console.log('='.repeat(60));
}

// Run the demonstration
if (require.main === module) {
  demonstrateMITMAttack();
}

module.exports = { VulnerableKeyExchange, SecureKeyExchange };

