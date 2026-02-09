/**
 * Type definitions for DAO Proposal Scorer
 */

export interface Vote {
  voter: string;
  support: boolean;
  timestamp: number;
}

export interface VoterReputation {
  address: string;
  score: number;      // Reputation score (0-100)
  eligible: boolean;  // Whether they're eligible to vote
}

export interface ScoringResult {
  proposalId: number;
  finalScore: number;
  breakdown: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    weightedYesScore: number;
    weightedNoScore: number;
    netScore: number;
  };
  proofHash: string;
}

export interface ProposalData {
  id: number;
  contentHash: string;
  proposer: string;
  createdAt: number;
}
