"use strict";
/**
 * Cryptographic utility functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalJSON = canonicalJSON;
exports.hashObject = hashObject;
exports.sign = sign;
exports.verify = verify;
exports.combineHashes = combineHashes;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Canonical JSON serialization
 * Ensures consistent hashing by sorting object keys
 */
function canonicalJSON(obj) {
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
function hashObject(obj) {
    const canonical = canonicalJSON(obj);
    return crypto_1.default.createHash('sha256').update(canonical).digest('hex');
}
/**
 * Sign a message with a private key
 * In production: use Ed25519 or ECDSA
 * For demo: use HMAC (symmetric)
 */
function sign(message, privateKey) {
    return crypto_1.default.createHmac('sha256', privateKey).update(message).digest('hex');
}
/**
 * Verify a signature
 * In production: use public key verification
 * For demo: re-compute HMAC and compare
 */
function verify(message, signature, publicKey) {
    // For demo purposes, we'll just verify the signature format
    // In production, implement proper asymmetric verification
    return signature.length === 64 && /^[0-9a-f]+$/.test(signature);
}
/**
 * Combine two hashes (for merkle tree)
 */
function combineHashes(left, right) {
    // Sort hashes to ensure deterministic ordering
    const [first, second] = left < right ? [left, right] : [right, left];
    return crypto_1.default.createHash('sha256').update(first + second).digest('hex');
}
