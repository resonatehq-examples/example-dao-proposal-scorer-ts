"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
/**
 * Calculate the final weighted score for a proposal
 *
 * Scoring Formula:
 * - Base vote value = 1
 * - Reputation multiplier = reputation_score / 50 (0.02x to 2.0x)
 * - Time decay = max(0.5, 1 - (time_since_creation / 7_days))
 * - Final vote weight = base * reputation_multiplier * time_decay
 * - Final score = sum(yes_weights) - sum(no_weights)
 */
async function calculateScore(ctx, votes, reputations, eligibility, proposalCreatedAt) {
    console.log(`🧮 Calculating final score...`);
    let weightedYesScore = 0;
    let weightedNoScore = 0;
    let yesVotes = 0;
    let noVotes = 0;
    let eligibleVotes = 0;
    const SEVEN_DAYS = 7 * 24 * 60 * 60;
    for (const vote of votes) {
        // Skip ineligible voters
        if (!eligibility.get(vote.voter)) {
            continue;
        }
        eligibleVotes++;
        // Get reputation (default to 50 if not found)
        const reputation = reputations.get(vote.voter);
        const reputationScore = reputation?.score || 50;
        // Calculate reputation multiplier (0.02x to 2.0x)
        const reputationMultiplier = reputationScore / 50;
        // Calculate time decay (votes closer to proposal creation count more)
        const timeSinceCreation = vote.timestamp - proposalCreatedAt;
        const timeDecay = Math.max(0.5, 1 - (timeSinceCreation / SEVEN_DAYS));
        // Final weight
        const weight = 1 * reputationMultiplier * timeDecay;
        // Add to appropriate total
        if (vote.support) {
            weightedYesScore += weight;
            yesVotes++;
        }
        else {
            weightedNoScore += weight;
            noVotes++;
        }
    }
    // Net score (can be negative if more weighted "no" votes)
    const netScore = weightedYesScore - weightedNoScore;
    // Scale to integer (multiply by 100 to preserve 2 decimal places)
    const finalScore = Math.round(netScore * 100);
    console.log(`✅ Final Score: ${finalScore / 100}`);
    console.log(`   Yes: ${yesVotes} votes (weighted: ${weightedYesScore.toFixed(2)})`);
    console.log(`   No: ${noVotes} votes (weighted: ${weightedNoScore.toFixed(2)})`);
    console.log(`   Eligible: ${eligibleVotes}/${votes.length}`);
    return {
        finalScore,
        breakdown: {
            totalVotes: eligibleVotes,
            yesVotes,
            noVotes,
            weightedYesScore,
            weightedNoScore,
            netScore,
        },
    };
}
