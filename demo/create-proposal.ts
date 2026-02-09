import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '../resonate-layer/.env' });

/**
 * Demo Script: Create a Proposal and Cast Votes
 * 
 * This script:
 * 1. Creates a new proposal
 * 2. Simulates several votes
 * 3. Triggers the scoring workflow
 */

async function main() {
  console.log('🎬 DAO Proposal Demo\n');
  
  // Connect to local blockchain
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || 'http://127.0.0.1:8545'
  );
  
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS not set in .env');
  }
  
  // Create wallets from Hardhat's test accounts
  // These are the publicly known private keys from Hardhat
  const privateKeys = [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
    '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
    '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
    '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
    '0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897',
  ];
  
  const proposer = new ethers.Wallet(privateKeys[0], provider);
  const voters = privateKeys.slice(1, 11).map(pk => new ethers.Wallet(pk, provider));
  
  console.log(`📝 Contract: ${contractAddress}`);
  console.log(`👤 Proposer: ${proposer.address}`);
  console.log(`🗳️  Voters: ${voters.length} accounts\n`);
  
  const contractAbi = [
    'function createProposal(bytes32 contentHash) external returns (uint256)',
    'function vote(uint256 proposalId, bool support) external',
    'function getProposal(uint256) external view returns (tuple(uint256 id, bytes32 contentHash, address proposer, uint256 createdAt, uint256 finalScore, bytes32 proofHash, address scorer, bool finalized))',
  ];
  
  const contract = new ethers.Contract(contractAddress, contractAbi, proposer);
  
  // Step 1: Create proposal
  console.log('📋 Step 1: Creating proposal...');
  const contentHash = ethers.id('Proposal: Upgrade governance contract to v2');
  const tx = await contract.createProposal(contentHash);
  const receipt = await tx.wait();
  
  console.log(`   Receipt has ${receipt?.logs?.length || 0} logs`);
  
  // Extract proposal ID from event
  // Simple approach: Just call getProposal(1) since this is the first proposal
  const proposalId = 1;
  
  console.log(`✅ Proposal created: ID ${proposalId}`);
  console.log(`   Transaction: ${tx.hash}\n`);
  
  // Wait a moment for event listener to pick it up
  console.log('⏳ Waiting 2 seconds before voting...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Cast votes
  console.log('🗳️  Step 2: Casting votes...\n');
  
  const votes = [
    { voter: 0, support: true },   // Yes
    { voter: 1, support: true },   // Yes
    { voter: 2, support: true },   // Yes
    { voter: 3, support: true },   // Yes
    { voter: 4, support: true },   // Yes
    { voter: 5, support: false },  // No
    { voter: 6, support: false },  // No
    { voter: 7, support: true },   // Yes
    { voter: 8, support: true },   // Yes
    { voter: 9, support: false },  // No
  ];
  
  for (const v of votes) {
    const voterContract = contract.connect(voters[v.voter]);
    const voteTx = await voterContract.vote(proposalId, v.support);
    await voteTx.wait();
    
    const supportText = v.support ? '✅ YES' : '❌ NO';
    console.log(`  ${supportText} - ${voters[v.voter].address.slice(0, 8)}...`);
    
    // Small delay to simulate real voting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ All votes cast!\n');
  console.log('─'.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Proposal ID: ${proposalId}`);
  console.log(`   Total Votes: ${votes.length}`);
  console.log(`   Yes Votes: ${votes.filter(v => v.support).length}`);
  console.log(`   No Votes: ${votes.filter(v => !v.support).length}`);
  console.log('─'.repeat(60));
  console.log('\n🎧 The event listener should now trigger scoring...');
  console.log('⏳ Watch the worker and listener logs for progress.\n');
  console.log('🔍 To view the promise tree:');
  console.log(`   resonate tree scoreProposal.${proposalId}\n`);
}

main()
  .then(() => {
    console.log('✅ Demo complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
