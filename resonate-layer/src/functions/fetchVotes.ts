import type { Context } from '@resonate/sdk';
import { ethers } from 'ethers';
import type { Vote } from '../types';

/**
 * Fetch all votes for a proposal from the blockchain
 * 
 * This is a durable function - if it fails, Resonate will retry.
 * The result is cached in the promise tree.
 */
export async function fetchVotes(ctx: Context, proposalId: number): Promise<Vote[]> {
  console.log(`📊 Fetching votes for proposal ${proposalId}...`);
  
  // Connect to contract
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    [
      'function getVotes(uint256 proposalId) external view returns (tuple(address voter, bool support, uint256 timestamp)[] memory)'
    ],
    provider
  );
  
  try {
    // Fetch votes from contract
    const votes = await contract.getVotes(proposalId);
    
    // Transform to our Vote type
    const result: Vote[] = votes.map((v: any) => ({
      voter: v.voter,
      support: v.support,
      timestamp: Number(v.timestamp),
    }));
    
    console.log(`✅ Fetched ${result.length} votes`);
    return result;
  } catch (error) {
    console.error('❌ Error fetching votes:', error);
    throw new Error(`Failed to fetch votes for proposal ${proposalId}`);
  }
}
