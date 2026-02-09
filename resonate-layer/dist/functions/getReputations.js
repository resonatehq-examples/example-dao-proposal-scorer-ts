"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReputations = getReputations;
/**
 * Calculate reputation scores for voters
 *
 * In a real DAO, this would:
 * - Query historical voting participation
 * - Check token holdings over time
 * - Calculate reputation based on past behavior
 *
 * For demo: Mock calculation based on address hash
 * (In production, this would be a complex query across multiple contracts/databases)
 */
async function getReputations(ctx, votes) {
    console.log(`🎯 Calculating reputations for ${votes.length} voters...`);
    const reputations = new Map();
    // Simulate expensive reputation calculation
    // (In reality, this would query historical data, token balances, etc.)
    for (const vote of votes) {
        // Mock: Use address hash to generate consistent "reputation"
        const addressHash = vote.voter.toLowerCase();
        const hashValue = parseInt(addressHash.slice(2, 10), 16);
        // Generate reputation score (0-100) based on address
        const score = (hashValue % 100) + 1;
        reputations.set(vote.voter, {
            address: vote.voter,
            score,
            eligible: true, // Will be determined by eligibility check
        });
    }
    console.log(`✅ Calculated reputations for ${reputations.size} voters`);
    return reputations;
}
