"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEligibility = checkEligibility;
/**
 * Check voter eligibility
 *
 * Rules:
 * - Voter must have held tokens for at least 30 days
 * - Voter must have minimum token balance
 * - Voter hasn't been flagged
 *
 * In production: Query token contract for historical balances
 * For demo: Mock check based on timestamp
 */
async function checkEligibility(ctx, votes, proposalCreatedAt) {
    console.log(`✅ Checking eligibility for ${votes.length} voters...`);
    const eligibility = new Map();
    // Simulate expensive eligibility checks
    // (In reality: Query historical blockchain state, token contracts, etc.)
    for (const vote of votes) {
        // Mock: Check if vote was cast within reasonable time
        // (Real: Would check token holding period, minimum balance, etc.)
        const votedWithinTimeWindow = vote.timestamp >= proposalCreatedAt;
        // For demo, make ~90% eligible (addresses ending in 0-8)
        const addressLastDigit = parseInt(vote.voter.slice(-1), 16);
        const meetsTokenRequirement = addressLastDigit <= 13; // 13/16 = ~81%
        const isEligible = votedWithinTimeWindow && meetsTokenRequirement;
        eligibility.set(vote.voter, isEligible);
    }
    const eligibleCount = Array.from(eligibility.values()).filter(e => e).length;
    console.log(`✅ ${eligibleCount}/${votes.length} voters are eligible`);
    return eligibility;
}
