import type { Context } from '@resonatehq/sdk';
import { ethers } from 'ethers';
import type { ScoringResult } from '../types';
import { fetchVotes } from './fetchVotes';
import { getReputations } from './getReputations';
import { checkEligibility } from './checkEligibility';
import { calculateScore } from './calculateScore';

/**
 * Main orchestration function for scoring a proposal
 * 
 * This is the root of the promise tree. Each step is a durable child promise.
 * 
 * Promise Tree Structure:
 * scoreProposal.{id}
 * ├── fetchVotes
 * ├── getReputations
 * ├── checkEligibility
 * └── calculateScore
 * 
 * Each child promise:
 * - Is independently executable
 * - Can be retried on failure
 * - Has its result cached
 * - Contributes to the merkle tree proof
 * 
 * This is the KEY PATTERN for Resonate + Blockchain integration:
 * 1. Each step is durable (survives crashes)
 * 2. Each step is verifiable (promise tree = proof)
 * 3. Each step is resumable (no wasted work)
 */
export function* scoreProposal(
  ctx: Context,
  proposalId: number
): Generator<any, ScoringResult, any> {
  console.log(`\n🎯 Scoring Proposal #${proposalId}`);
  console.log(`Promise ID: ${ctx.id}`);
  console.log('─'.repeat(60));
  
  // Get proposal metadata from blockchain
  // Note: In a real implementation, this would be a durable sub-function
  // For now, we'll use a placeholder timestamp
  const proposalCreatedAt = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  // Step 1: Fetch all votes (durable child promise)
  console.log('\n📊 Step 1/4: Fetching votes...');
  const votes = yield* ctx.run(
    fetchVotes,
    proposalId,
    ctx.options({})
  );
  
  // Step 2: Calculate voter reputations (durable child promise)
  console.log('\n🎯 Step 2/4: Calculating reputations...');
  const reputations = yield* ctx.run(
    getReputations,
    votes,
    ctx.options({})
  );
  
  // Step 3: Check voter eligibility (durable child promise)
  console.log('\n✅ Step 3/4: Checking eligibility...');
  const eligibility = yield* ctx.run(
    checkEligibility,
    votes,
    proposalCreatedAt,
    ctx.options({})
  );
  
  // Step 4: Calculate final score (durable child promise)
  console.log('\n🧮 Step 4/4: Calculating final score...');
  const result = yield* ctx.run(
    calculateScore,
    votes,
    reputations,
    eligibility,
    proposalCreatedAt,
    ctx.options({})
  );
  
  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Scoring complete for Proposal #${proposalId}`);
  console.log(`   Final Score: ${result.finalScore / 100}`);
  console.log(`   Promise Tree: Run 'resonate tree scoreProposal.${proposalId}' to view`);
  console.log('─'.repeat(60) + '\n');
  
  return {
    proposalId,
    finalScore: result.finalScore,
    breakdown: result.breakdown,
    proofHash: '', // Will be calculated from promise tree
  };
}
