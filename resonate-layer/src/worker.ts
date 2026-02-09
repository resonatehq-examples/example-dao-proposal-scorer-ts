import dotenv from 'dotenv';
import { CryptoResonate } from './crypto/CryptoResonate';
import { scoreProposal } from './functions/scoreProposal';
import { fetchVotes } from './functions/fetchVotes';
import { getReputations } from './functions/getReputations';
import { checkEligibility } from './functions/checkEligibility';
import { calculateScore } from './functions/calculateScore';

dotenv.config();

/**
 * Resonate Worker Process with Cryptographic Commitments
 * 
 * This process:
 * 1. Registers all durable functions (wrapped with crypto)
 * 2. Starts polling for tasks
 * 3. Executes tasks when they're claimed
 * 4. Generates cryptographic commitments for each step
 * 5. Posts results back to Resonate server
 * 
 * NEW: Uses CryptoResonate instead of plain Resonate.
 * This adds cryptographic commitments to every function execution.
 */

async function main() {
  console.log('🚀 Starting CryptoResonate Worker for DAO Proposal Scorer\n');
  
  // Initialize CryptoResonate client with crypto enabled
  const resonate = new CryptoResonate({
    url: process.env.RESONATE_URL || 'http://localhost:8001',
    group: 'proposal-scorers', // Worker group name
    crypto: {
      enabled: true,           // Enable cryptographic commitments
      merkleProofs: true,      // Generate merkle proofs
    },
  });
  
  console.log('📝 Registering durable functions...\n');
  
  // Register all functions
  // These MUST be registered before the worker starts polling
  
  // Main orchestration function
  resonate.register('scoreProposal', scoreProposal);
  console.log('  ✓ scoreProposal');
  
  // Sub-functions (each becomes a durable child promise)
  resonate.register('fetchVotes', fetchVotes);
  console.log('  ✓ fetchVotes');
  
  resonate.register('getReputations', getReputations);
  console.log('  ✓ getReputations');
  
  resonate.register('checkEligibility', checkEligibility);
  console.log('  ✓ checkEligibility');
  
  resonate.register('calculateScore', calculateScore);
  console.log('  ✓ calculateScore');
  
  console.log('\n✅ All functions registered\n');
  
  // Worker is now polling automatically
  // The SDK starts polling when functions are registered with a URL
  console.log('🔄 Worker is now polling for tasks...\n');
  console.log('Worker group: proposal-scorers');
  console.log('Resonate URL:', process.env.RESONATE_URL || 'http://localhost:8001');
  console.log('\n' + '─'.repeat(60));
  console.log('Worker is running. Press Ctrl+C to stop.');
  console.log('Waiting for tasks...');
  console.log('─'.repeat(60) + '\n');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down worker gracefully...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down worker gracefully...');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('💥 Fatal error in worker:', error);
  process.exit(1);
});
