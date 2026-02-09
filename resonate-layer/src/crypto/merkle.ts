/**
 * Merkle Tree implementation for promise commitments
 */

import { combineHashes, hashObject } from './utils';
import type { Commitment } from './types';

export class PromiseMerkleTree {
  private commitments: Map<string, Commitment>;
  private leaves: Map<string, string>; // promiseId -> leaf hash
  private tree: string[][] = [];      // Merkle tree layers
  private root: string = '';
  
  constructor(commitments: Map<string, Commitment>) {
    this.commitments = commitments;
    this.leaves = new Map();
    this.build();
  }
  
  private build(): void {
    if (this.commitments.size === 0) {
      this.root = '';
      return;
    }
    
    // 1. Create leaf hashes from commitments
    const leafHashes: string[] = [];
    const promiseIds: string[] = [];
    
    for (const [promiseId, commitment] of this.commitments) {
      // Leaf = hash of the commitment
      const leafHash = hashObject(commitment);
      this.leaves.set(promiseId, leafHash);
      leafHashes.push(leafHash);
      promiseIds.push(promiseId);
    }
    
    // 2. Build merkle tree bottom-up
    this.tree = [leafHashes];
    
    let currentLayer = leafHashes;
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        
        const parent = combineHashes(left, right);
        nextLayer.push(parent);
      }
      
      this.tree.push(nextLayer);
      currentLayer = nextLayer;
    }
    
    // 3. Root is the final hash
    this.root = currentLayer[0];
  }
  
  /**
   * Get the merkle root
   */
  getRoot(): string {
    return this.root;
  }
  
  /**
   * Get merkle proof for a specific promise
   * Returns the sibling hashes needed to verify the leaf
   */
  getProof(promiseId: string): string[] {
    const leafHash = this.leaves.get(promiseId);
    if (!leafHash) {
      throw new Error(`No leaf found for promise ${promiseId}`);
    }
    
    // Find index of leaf in bottom layer
    const bottomLayer = this.tree[0];
    let index = bottomLayer.indexOf(leafHash);
    
    if (index === -1) {
      throw new Error(`Leaf hash not found in tree for promise ${promiseId}`);
    }
    
    // Collect sibling hashes up the tree
    const proof: string[] = [];
    
    for (let layer = 0; layer < this.tree.length - 1; layer++) {
      const currentLayer = this.tree[layer];
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
      
      if (siblingIndex < currentLayer.length) {
        proof.push(currentLayer[siblingIndex]);
      }
      
      index = Math.floor(index / 2);
    }
    
    return proof;
  }
  
  /**
   * Verify a merkle proof
   */
  static verify(
    leafHash: string,
    proof: string[],
    root: string
  ): boolean {
    let currentHash = leafHash;
    
    for (const siblingHash of proof) {
      currentHash = combineHashes(currentHash, siblingHash);
    }
    
    return currentHash === root;
  }
  
  /**
   * Get all leaves in the tree
   */
  getLeaves(): Map<string, string> {
    return new Map(this.leaves);
  }
  
  /**
   * Get tree depth
   */
  getDepth(): number {
    return this.tree.length;
  }
  
  /**
   * Get total number of leaves
   */
  getSize(): number {
    return this.leaves.size;
  }
}
