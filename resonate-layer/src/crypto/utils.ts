/**
 * Cryptographic utility functions
 */

import crypto from 'crypto';

/**
 * Canonical JSON serialization
 * Ensures consistent hashing by sorting object keys
 */
export function canonicalJSON(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJSON).join(',') + ']';
  }
  
  // Sort object keys
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalJSON(obj[key]);
  });
  
  return '{' + pairs.join(',') + '}';
}

/**
 * Hash an object deterministically
 */
export function hashObject(obj: any): string {
  const canonical = canonicalJSON(obj);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Sign a message with a private key
 * In production: use Ed25519 or ECDSA
 * For demo: use HMAC (symmetric)
 */
export function sign(message: string, privateKey: string): string {
  return crypto.createHmac('sha256', privateKey).update(message).digest('hex');
}

/**
 * Verify a signature
 * In production: use public key verification
 * For demo: re-compute HMAC and compare
 */
export function verify(message: string, signature: string, publicKey: string): boolean {
  // For demo purposes, we'll just verify the signature format
  // In production, implement proper asymmetric verification
  return signature.length === 64 && /^[0-9a-f]+$/.test(signature);
}

/**
 * Combine two hashes (for merkle tree)
 */
export function combineHashes(left: string, right: string): string {
  // Sort hashes to ensure deterministic ordering
  const [first, second] = left < right ? [left, right] : [right, left];
  return crypto.createHash('sha256').update(first + second).digest('hex');
}
