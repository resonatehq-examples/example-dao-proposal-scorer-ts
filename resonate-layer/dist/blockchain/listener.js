"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
const CryptoResonate_1 = require("../crypto/CryptoResonate");
dotenv_1.default.config();
/**
 * Blockchain Event Listener with Cryptographic Proofs
 *
 * This process:
 * 1. Watches the blockchain for ProposalCreated events
 * 2. Creates durable promises for scoring (CLIENT role)
 * 3. Waits for worker to execute and return result
 * 4. Extracts merkle proof from promise tree
 * 5. Posts result + cryptographic proof back to blockchain
 *
 * NEW: Uses CryptoResonate to extract merkle proofs.
 * This is the CLIENT side - it creates work but doesn't execute it.
 * The worker process (worker.ts) is the EXECUTOR side.
 */
async function main() {
    console.log('🎧 Starting Blockchain Event Listener with Crypto Proofs\n');
    // Initialize CryptoResonate client (as CLIENT, not worker)
    // Crypto enabled to access merkle proof generation
    const resonate = new CryptoResonate_1.CryptoResonate({
        url: process.env.RESONATE_URL || 'http://localhost:8001',
        crypto: {
            enabled: false, // Client doesn't need to sign, just extract proofs
        },
    });
    // Connect to blockchain
    const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS environment variable not set');
    }
    // Setup wallet for posting results
    const privateKey = process.env.SCORER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('SCORER_PRIVATE_KEY environment variable not set');
    }
    const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
    const contractAbi = [
        'event ProposalCreated(uint256 indexed proposalId, bytes32 contentHash, address proposer)',
        'function submitScore(uint256 proposalId, uint256 score, bytes32 proofHash) external',
    ];
    const contract = new ethers_1.ethers.Contract(contractAddress, contractAbi, wallet);
    console.log('📝 Configuration:');
    console.log(`  Contract: ${contractAddress}`);
    console.log(`  RPC: ${process.env.RPC_URL || 'http://127.0.0.1:8545'}`);
    console.log(`  Scorer: ${wallet.address}`);
    console.log(`  Resonate: ${process.env.RESONATE_URL || 'http://localhost:8001'}`);
    console.log('\n' + '─'.repeat(60));
    console.log('Listening for ProposalCreated events...');
    console.log('─'.repeat(60) + '\n');
    // Listen for ProposalCreated events
    contract.on('ProposalCreated', async (proposalId, contentHash, proposer, event) => {
        try {
            console.log(`\n🔔 New Proposal Created!`);
            console.log(`  ID: ${proposalId}`);
            console.log(`  Proposer: ${proposer}`);
            console.log(`  Content Hash: ${contentHash}`);
            console.log('\n📤 Creating durable promise for scoring...');
            const promiseId = `scoreProposal.${proposalId}`;
            // Call the worker via RPC (this routes to the "proposal-scorers" worker group)
            console.log(`✅ Calling worker to score proposal...`);
            console.log('⏳ Waiting for worker to complete scoring...\n');
            const result = await resonate.rpc(promiseId, 'scoreProposal', Number(proposalId), resonate.options({ target: 'poll://any@proposal-scorers' }) // Routes to workers!
            );
            console.log('\n📥 Scoring complete! Result received:');
            console.log('  Raw result:', JSON.stringify(result, null, 2));
            console.log(`  Final Score: ${result?.finalScore ? result.finalScore / 100 : 'N/A'}`);
            console.log(`  Total Votes: ${result?.breakdown?.totalVotes || 'N/A'}`);
            console.log(`  Yes Votes: ${result?.breakdown?.yesVotes || 'N/A'}`);
            console.log(`  No Votes: ${result?.breakdown?.noVotes || 'N/A'}`);
            // Get merkle proof from promise tree
            console.log('\n🔐 Extracting merkle proof from promise tree...');
            const proofHash = await getMerkleRoot(resonate, promiseId);
            console.log(`  Merkle Root: ${proofHash}`);
            // Post result to blockchain
            console.log('\n📤 Posting result to blockchain...');
            const tx = await contract.submitScore(proposalId, result.finalScore, proofHash);
            console.log(`  Transaction: ${tx.hash}`);
            console.log('  ⏳ Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log(`\n✅ Score posted on-chain!`);
            console.log(`  Block: ${receipt.blockNumber}`);
            console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
            console.log('\n' + '─'.repeat(60));
            console.log('Listening for next proposal...');
            console.log('─'.repeat(60) + '\n');
        }
        catch (error) {
            console.error('\n❌ Error handling proposal:', error);
            console.error('Continuing to listen...\n');
        }
    });
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down listener...');
        process.exit(0);
    });
}
/**
 * Get merkle root from promise tree commitments
 *
 * This builds a proper merkle tree from all cryptographic commitments
 * in the promise tree and returns the merkle root.
 */
async function getMerkleRoot(resonate, promiseId) {
    try {
        // Build merkle tree from all commitments in the promise tree
        const merkleRoot = await resonate.getMerkleRoot(promiseId);
        console.log('\n📊 Merkle Tree Details:');
        const tree = await resonate.buildMerkleTree(promiseId);
        console.log(`  Tree Size: ${tree.getSize()} promises`);
        console.log(`  Tree Depth: ${tree.getDepth()} levels`);
        console.log(`  Merkle Root: ${merkleRoot.slice(0, 16)}...`);
        // Log all commitments for verification
        const commitments = await resonate.getTreeCommitments(promiseId);
        console.log(`\n🔐 Commitments (${commitments.size} total):`);
        for (const [id, commitment] of commitments) {
            console.log(`  ${id}:`);
            console.log(`    Function: ${commitment.functionName}`);
            console.log(`    Input:  ${commitment.inputHash.slice(0, 16)}...`);
            console.log(`    Output: ${commitment.outputHash.slice(0, 16)}...`);
            console.log(`    Signed: ${commitment.signature?.slice(0, 16)}...`);
        }
        return `0x${merkleRoot}`;
    }
    catch (error) {
        console.error('Error building merkle tree:', error);
        throw error;
    }
}
main().catch((error) => {
    console.error('💥 Fatal error in listener:', error);
    process.exit(1);
});
