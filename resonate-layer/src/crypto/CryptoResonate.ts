/**
 * CryptoResonate: Cryptographic wrapper for Resonate SDK
 * 
 * This wraps the standard Resonate SDK to add:
 * 1. Input/output hashing for every function execution
 * 2. Cryptographic commitments (signed hashes)
 * 3. Merkle tree generation from promise trees
 * 4. Verification without re-execution
 * 
 * Key Design: We wrap registered functions to intercept execution,
 * NOT the SDK internals. This keeps changes minimal and maintainable.
 */

import { Resonate, type Context } from '@resonatehq/sdk';
import crypto from 'crypto';
import type { Commitment, CryptoResonateOptions } from './types';
import { hashObject, sign, canonicalJSON } from './utils';
import { PromiseMerkleTree } from './merkle';

export class CryptoResonate extends Resonate {
  private commitments: Map<string, Commitment> = new Map();
  private privateKey: string = '';
  private publicKey: string = '';
  private enableCrypto: boolean;
  
  constructor(options: CryptoResonateOptions) {
    // Pass standard options to parent Resonate
    super({
      url: options.url,
      group: options.group,
      pid: options.pid,
      ttl: options.ttl,
      token: options.token,
      verbose: options.verbose,
    });
    
    // Crypto-specific options
    this.enableCrypto = options.crypto?.enabled ?? false;
    
    if (this.enableCrypto) {
      // In production, load from secure storage
      // For demo, generate ephemeral keys
      this.privateKey = options.crypto?.workerKey || this.generatePrivateKey();
      this.publicKey = this.derivePublicKey(this.privateKey);
      
      console.log(`🔐 CryptoResonate initialized`);
      console.log(`   Worker Public Key: ${this.publicKey.slice(0, 16)}...`);
    }
  }
  
  /**
   * Override register() to wrap functions with crypto commitment generation
   */
  register(funcOrName: any, funcOrOpts?: any, opts?: any): any {
    // If crypto is disabled, register normally
    if (!this.enableCrypto) {
      return super.register(funcOrName, funcOrOpts, opts);
    }
    
    let func: any;
    let name: string;
    let version: number | undefined;
    
    // Parse overloaded arguments
    if (typeof funcOrName === 'string') {
      name = funcOrName;
      func = funcOrOpts;
      version = opts?.version;
    } else {
      func = funcOrName;
      name = func.name;
      if (funcOrOpts && typeof funcOrOpts === 'object' && 'version' in funcOrOpts) {
        version = funcOrOpts.version;
      }
    }
    
    // Wrap the function with crypto commitment generation
    const wrappedFunc = this.wrapWithCrypto(func, name);
    
    // Register the wrapped function with parent
    if (typeof funcOrName === 'string') {
      return super.register(name, wrappedFunc, { version });
    } else {
      // When registering by reference, we need to preserve the name
      Object.defineProperty(wrappedFunc, 'name', { value: name });
      return super.register(wrappedFunc, funcOrOpts, opts);
    }
  }
  
  /**
   * Wrap a function to generate cryptographic commitments
   */
  private wrapWithCrypto<F extends (...args: any[]) => any>(
    func: F,
    name: string
  ): F {
    const self = this;
    
    // Check if function is a generator
    const isGenerator = func.constructor.name === 'GeneratorFunction';
    
    if (isGenerator) {
      // Wrap generator function
      const wrapper = function*(ctx: Context, ...args: any[]): any {
        const promiseId = ctx.id;
        
        console.log(`\n🔒 Crypto Execution: ${name}`);
        console.log(`   Promise ID: ${promiseId}`);
        
        // 1. Hash inputs
        const inputHash = hashObject({ func: name, args });
        console.log(`   Input Hash: ${inputHash.slice(0, 16)}...`);
        
        // 2. Execute original function
        const startTime = Date.now();
        const result = yield* (func as any)(ctx, ...args);
        const executionTime = Date.now() - startTime;
        console.log(`   Executed in ${executionTime}ms`);
        
        // 3. Hash output
        const outputHash = hashObject(result);
        console.log(`   Output Hash: ${outputHash.slice(0, 16)}...`);
        
        // 4. Create commitment
        const commitment: Commitment = {
          promiseId,
          functionName: name,
          inputHash,
          outputHash,
          timestamp: Date.now(),
          workerKey: self.publicKey,
        };
        
        // 5. Sign commitment
        const commitmentHash = hashObject(commitment);
        const signature = sign(commitmentHash, self.privateKey);
        
        const signedCommitment: Commitment = {
          ...commitment,
          signature,
        };
        
        console.log(`   Commitment: ${commitmentHash.slice(0, 16)}...`);
        console.log(`   Signed: ${signature.slice(0, 16)}...`);
        
        // 6. Store commitment
        self.commitments.set(promiseId, signedCommitment);
        
        return result;
      };
      
      // Preserve function name for registry
      Object.defineProperty(wrapper, 'name', { value: name });
      
      return wrapper as F;
    } else {
      // Wrap async function
      const wrapper = async function(ctx: Context, ...args: any[]) {
        const promiseId = ctx.id;
        
        console.log(`\n🔒 Crypto Execution: ${name}`);
        console.log(`   Promise ID: ${promiseId}`);
        
        // 1. Hash inputs
        const inputHash = hashObject({ func: name, args });
        console.log(`   Input Hash: ${inputHash.slice(0, 16)}...`);
        
        // 2. Execute original function
        const startTime = Date.now();
        const result = await func(ctx, ...args);
        const executionTime = Date.now() - startTime;
        console.log(`   Executed in ${executionTime}ms`);
        
        // 3. Hash output
        const outputHash = hashObject(result);
        console.log(`   Output Hash: ${outputHash.slice(0, 16)}...`);
        
        // 4. Create commitment
        const commitment: Commitment = {
          promiseId,
          functionName: name,
          inputHash,
          outputHash,
          timestamp: Date.now(),
          workerKey: self.publicKey,
        };
        
        // 5. Sign commitment
        const commitmentHash = hashObject(commitment);
        const signature = sign(commitmentHash, self.privateKey);
        
        const signedCommitment: Commitment = {
          ...commitment,
          signature,
        };
        
        console.log(`   Commitment: ${commitmentHash.slice(0, 16)}...`);
        console.log(`   Signed: ${signature.slice(0, 16)}...`);
        
        // 6. Store commitment
        self.commitments.set(promiseId, signedCommitment);
        
        return result;
      };
      
      // Preserve function name for registry
      Object.defineProperty(wrapper, 'name', { value: name });
      
      return wrapper as F;
    }
  }
  
  /**
   * Get commitment for a specific promise
   */
  getCommitment(promiseId: string): Commitment | undefined {
    return this.commitments.get(promiseId);
  }
  
  /**
   * Get all commitments for a promise tree
   */
  async getTreeCommitments(rootPromiseId: string): Promise<Map<string, Commitment>> {
    const commitments = new Map<string, Commitment>();
    
    // Get root promise
    const rootPromise = await this.promises.get(rootPromiseId);
    if (!rootPromise) {
      throw new Error(`Promise ${rootPromiseId} not found`);
    }
    
    // Get root commitment
    const rootCommitment = this.commitments.get(rootPromiseId);
    if (rootCommitment) {
      commitments.set(rootPromiseId, rootCommitment);
    }
    
    // Recursively get child commitments
    // In the promise tree, children have IDs like: parent.0, parent.1, etc.
    await this.getChildCommitments(rootPromiseId, commitments);
    
    return commitments;
  }
  
  private async getChildCommitments(
    parentId: string,
    commitments: Map<string, Commitment>
  ): Promise<void> {
    // Query for child promises (simplified - in production use proper API)
    // Child promises have pattern: parentId.N where N is sequence number
    for (let i = 0; i < 100; i++) { // Arbitrary limit
      const childId = `${parentId}.${i}`;
      try {
        const childPromise = await this.promises.get(childId);
        if (!childPromise) break;
        
        const childCommitment = this.commitments.get(childId);
        if (childCommitment) {
          commitments.set(childId, childCommitment);
        }
        
        // Recursively get grandchildren
        await this.getChildCommitments(childId, commitments);
      } catch (error) {
        // Child doesn't exist, stop searching
        break;
      }
    }
  }
  
  /**
   * Build merkle tree from promise tree commitments
   */
  async buildMerkleTree(rootPromiseId: string): Promise<PromiseMerkleTree> {
    const commitments = await this.getTreeCommitments(rootPromiseId);
    return new PromiseMerkleTree(commitments);
  }
  
  /**
   * Get merkle root for a promise tree
   */
  async getMerkleRoot(rootPromiseId: string): Promise<string> {
    const tree = await this.buildMerkleTree(rootPromiseId);
    return tree.getRoot();
  }
  
  /**
   * Generate a merkle proof for a specific promise in the tree
   */
  async generateProof(rootPromiseId: string, targetPromiseId: string): Promise<{
    root: string;
    proof: string[];
    commitment: Commitment;
  }> {
    const tree = await this.buildMerkleTree(rootPromiseId);
    const proof = tree.getProof(targetPromiseId);
    const commitment = this.commitments.get(targetPromiseId);
    
    if (!commitment) {
      throw new Error(`No commitment found for ${targetPromiseId}`);
    }
    
    return {
      root: tree.getRoot(),
      proof,
      commitment,
    };
  }
  
  /**
   * Export commitments for external verification
   */
  exportCommitments(): Record<string, Commitment> {
    const exported: Record<string, Commitment> = {};
    for (const [id, commitment] of this.commitments) {
      exported[id] = commitment;
    }
    return exported;
  }
  
  // ==================== Helper Methods ====================
  
  private generatePrivateKey(): string {
    // In production: use proper key generation (Ed25519, ECDSA)
    // For demo: generate random hex string
    return crypto.randomBytes(32).toString('hex');
  }
  
  private derivePublicKey(privateKey: string): string {
    // In production: use proper key derivation
    // For demo: hash the private key
    return crypto.createHash('sha256').update(privateKey).digest('hex');
  }
}
