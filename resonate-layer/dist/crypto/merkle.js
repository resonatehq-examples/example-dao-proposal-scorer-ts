"use strict";
/**
 * Merkle Tree implementation for promise commitments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseMerkleTree = void 0;
const utils_1 = require("./utils");
class PromiseMerkleTree {
    commitments;
    leaves; // promiseId -> leaf hash
    tree = []; // Merkle tree layers
    root = '';
    constructor(commitments) {
        this.commitments = commitments;
        this.leaves = new Map();
        this.build();
    }
    build() {
        if (this.commitments.size === 0) {
            this.root = '';
            return;
        }
        // 1. Create leaf hashes from commitments
        const leafHashes = [];
        const promiseIds = [];
        for (const [promiseId, commitment] of this.commitments) {
            // Leaf = hash of the commitment
            const leafHash = (0, utils_1.hashObject)(commitment);
            this.leaves.set(promiseId, leafHash);
            leafHashes.push(leafHash);
            promiseIds.push(promiseId);
        }
        // 2. Build merkle tree bottom-up
        this.tree = [leafHashes];
        let currentLayer = leafHashes;
        while (currentLayer.length > 1) {
            const nextLayer = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
                const parent = (0, utils_1.combineHashes)(left, right);
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
    getRoot() {
        return this.root;
    }
    /**
     * Get merkle proof for a specific promise
     * Returns the sibling hashes needed to verify the leaf
     */
    getProof(promiseId) {
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
        const proof = [];
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
    static verify(leafHash, proof, root) {
        let currentHash = leafHash;
        for (const siblingHash of proof) {
            currentHash = (0, utils_1.combineHashes)(currentHash, siblingHash);
        }
        return currentHash === root;
    }
    /**
     * Get all leaves in the tree
     */
    getLeaves() {
        return new Map(this.leaves);
    }
    /**
     * Get tree depth
     */
    getDepth() {
        return this.tree.length;
    }
    /**
     * Get total number of leaves
     */
    getSize() {
        return this.leaves.size;
    }
}
exports.PromiseMerkleTree = PromiseMerkleTree;
