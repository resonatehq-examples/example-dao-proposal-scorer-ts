/**
 * CryptoResonate Module
 * 
 * Cryptographic extensions for Resonate SDK:
 * - Input/output hashing
 * - Cryptographic commitments
 * - Merkle tree generation
 * - Proof verification
 */

export { CryptoResonate } from './CryptoResonate';
export { PromiseMerkleTree } from './merkle';
export { hashObject, sign, verify, canonicalJSON, combineHashes } from './utils';
export type { Commitment, CryptoResonateOptions, MerkleProof } from './types';
