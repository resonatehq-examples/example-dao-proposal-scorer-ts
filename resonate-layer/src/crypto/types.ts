/**
 * Type definitions for CryptoResonate
 */

export interface Commitment {
  promiseId: string;
  functionName: string;
  inputHash: string;
  outputHash: string;
  timestamp: number;
  workerKey: string;
  signature?: string;
}

export interface CryptoResonateOptions {
  // Standard Resonate options
  url?: string;
  group?: string;
  pid?: string;
  ttl?: number;
  auth?: { username: string; password: string };
  token?: string;
  verbose?: boolean;
  
  // Crypto-specific options
  crypto?: {
    enabled: boolean;
    workerKey?: string;      // Private key for signing (load from secure storage)
    merkleProofs?: boolean;  // Enable merkle proof generation
  };
}

export interface MerkleProof {
  root: string;
  leaf: string;
  path: string[];
  indices: number[];
}
