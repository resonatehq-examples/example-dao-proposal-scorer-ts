# Quickstart Guide - DAO Proposal Scorer

This guide will walk you through running the complete demo in **5 minutes**.

## What You'll See

1. **Smart Contract** deployed to local blockchain
2. **Resonate Server** managing promise trees
3. **Worker** executing durable scoring functions
4. **Event Listener** watching blockchain and creating promises
5. **Demo Script** creating a proposal with votes
6. **Promise Tree** visualization showing cryptographic proof

**Gas Savings Demo:** ~94% cheaper than on-chain computation!

---

## Prerequisites

```bash
# Install Resonate CLI
brew install resonatehq/tap/resonate

# Verify installation
resonate version

# Install Node.js dependencies (in each folder)
cd contracts && npm install
cd ../resonate-layer && npm install
cd ../demo && npm install
```

---

## Step-by-Step Demo

### Terminal 1: Resonate Server

```bash
# Start Resonate server (manages promise trees)
resonate dev
```

You should see:
```
Resonate development server running on http://localhost:8001
```

**Keep this running!**

---

### Terminal 2: Local Blockchain

```bash
cd contracts

# Start local Hardhat blockchain
npx hardhat node
```

You should see 20 test accounts with 10,000 ETH each.

**Keep this running!**

---

### Terminal 3: Deploy Contract

```bash
cd contracts

# Deploy the ProposalScorer contract
npx hardhat run scripts/deploy.ts --network localhost
```

You should see:
```
✅ ProposalScorer deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📝 Scorer service address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

💾 Save this address to your .env file:
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy the contract address!**

---

### Terminal 4: Configure Environment

```bash
cd resonate-layer

# Copy example environment file
cp .env.example .env

# Edit .env and add:
# 1. CONTRACT_ADDRESS from deployment
# 2. SCORER_PRIVATE_KEY from Hardhat account #0
```

**Example .env:**
```bash
RESONATE_URL=http://localhost:8001
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SCORER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

> **Note:** The private key above is Hardhat's default account #0 (safe for local dev)

---

### Terminal 5: Start Worker

```bash
cd resonate-layer

# Start the Resonate worker (executes scoring tasks)
npm run worker
```

You should see:
```
🚀 Starting Resonate Worker for DAO Proposal Scorer

📝 Registering durable functions...
  ✓ scoreProposal
  ✓ fetchVotes
  ✓ getReputations
  ✓ checkEligibility
  ✓ calculateScore

✅ All functions registered

🔄 Starting worker (polling for tasks)...
Worker group: proposal-scorers
Worker is running. Press Ctrl+C to stop.
Waiting for tasks...
```

**Keep this running!**

---

### Terminal 6: Start Event Listener

```bash
cd resonate-layer

# Start the blockchain event listener
npm run listener
```

You should see:
```
🎧 Starting Blockchain Event Listener

📝 Configuration:
  Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  RPC: http://127.0.0.1:8545
  Scorer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Resonate: http://localhost:8001

Listening for ProposalCreated events...
```

**Keep this running!**

---

### Terminal 7: Run Demo

```bash
cd demo

# Create a proposal and cast votes
npm run create-proposal
```

You should see:
```
🎬 DAO Proposal Demo

📋 Step 1: Creating proposal...
✅ Proposal created: ID 1

🗳️  Step 2: Casting votes...
  ✅ YES - 0x70997970...
  ✅ YES - 0x3C44CdDdB...
  ✅ YES - 0x90F79bf6...
  ...

✅ All votes cast!

📊 Summary:
   Proposal ID: 1
   Total Votes: 10
   Yes Votes: 7
   No Votes: 3
```

---

## Watch the Magic! 🎩✨

Now watch the other terminals:

**Terminal 6 (Event Listener):**
```
🔔 New Proposal Created!
  ID: 1
  Proposer: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

📤 Creating durable promise for scoring...
✅ Promise created: scoreProposal.1
⏳ Waiting for worker to complete scoring...
```

**Terminal 5 (Worker):**
```
🎯 Scoring Proposal #1
Promise ID: scoreProposal.1
────────────────────────────────────────────────────────────

📊 Step 1/4: Fetching votes...
✅ Fetched 10 votes

🎯 Step 2/4: Calculating reputations...
✅ Calculated reputations for 10 voters

✅ Step 3/4: Checking eligibility...
✅ 8/10 voters are eligible

🧮 Step 4/4: Calculating final score...
✅ Final Score: 423.67
   Yes: 6 votes (weighted: 523.67)
   No: 2 votes (weighted: 100.00)
   Eligible: 8/10
```

**Terminal 6 (Event Listener) - Continued:**
```
📥 Scoring complete! Result received:
  Final Score: 423.67
  Total Votes: 8
  Yes Votes: 6
  No Votes: 2

🔐 Extracting proof from promise tree...
  Proof Hash: 0x7a3f2b8c...

📤 Posting result to blockchain...
  Transaction: 0x9d4e5f...
  ⏳ Waiting for confirmation...

✅ Score posted on-chain!
  Block: 23
  Gas Used: 85234
```

---

## View the Promise Tree

```bash
# View the promise tree (cryptographic proof)
resonate tree scoreProposal.1
```

You should see:
```
scoreProposal.1 (RESOLVED)
├── scoreProposal.1.fetchVotes (RESOLVED)
├── scoreProposal.1.getReputations (RESOLVED)
├── scoreProposal.1.checkEligibility (RESOLVED)
└── scoreProposal.1.calculateScore (RESOLVED)
```

**This tree structure is the cryptographic proof of computation!**

Each node has:
- Unique content-addressed ID (hash of function + inputs + parent)
- Execution state (pending/running/resolved/rejected)
- Input and output values
- Timestamps

---

## Test Durability (Optional)

### Kill Worker Mid-Execution

1. **Terminal 7:** Run demo script again (creates proposal #2)
2. **Watch Terminal 5 (Worker):** See it start scoring
3. **Kill the worker** (Ctrl+C) after "Step 1/4" completes
4. **Restart the worker:** `npm run worker`
5. **Watch:** It resumes from Step 2! No wasted work!

This demonstrates Resonate's durability - execution survives crashes.

---

## Understanding Gas Savings

### On-Chain Computation (Traditional)
```solidity
// All this would run on-chain (expensive!)
for (uint i = 0; i < votes.length; i++) {
    uint256 reputation = getReputation(votes[i].voter);  // ~50k gas
    bool eligible = checkEligibility(votes[i].voter);     // ~100k gas
    uint256 weight = calculateWeight(...);                // ~20k gas
    score += weight;
}
// Total: ~170k gas per voter = 1.7M gas for 10 voters
```

**Cost at 50 gwei, $3000 ETH:** ~$255 per proposal

### Off-Chain with Resonate (Our Approach)
```solidity
// Only store the result (cheap!)
function submitScore(
    uint256 proposalId,
    uint256 score,
    bytes32 proofHash
) external {
    // 3 storage writes + event = ~85k gas
}
```

**Cost at 50 gwei, $3000 ETH:** ~$12.75 per proposal

**Savings: 95%** 🎉

---

## What Just Happened?

1. ✅ **Smart Contract** stored proposal + votes on-chain
2. ✅ **Event Listener** detected ProposalCreated event
3. ✅ **Listener** created durable promise `scoreProposal.1`
4. ✅ **Worker** claimed task and executed scoring logic
5. ✅ **Scoring** ran 4 durable steps (each can retry/resume)
6. ✅ **Worker** returned result to promise
7. ✅ **Listener** extracted proof hash from promise tree
8. ✅ **Listener** posted result + proof to blockchain

**Key Insight:** The promise tree IS the merkle proof. Anyone can verify by re-running `resonate tree scoreProposal.1` and checking the root hash matches what's on-chain.

---

## Next Steps

- **Scale:** Run multiple workers (`npm run worker` in multiple terminals)
- **Verify:** Check promise tree structure with `resonate tree <id>`
- **Inspect:** Query promises with `resonate promises list`
- **Monitor:** Watch Resonate dashboard at http://localhost:8001

---

## Troubleshooting

### Worker not picking up tasks
- Check `RESONATE_URL` in `.env`
- Verify Resonate server is running (Terminal 1)
- Check worker group name matches

### Listener not receiving events
- Verify `CONTRACT_ADDRESS` is correct
- Check `RPC_URL` points to local Hardhat node
- Ensure private key is valid

### Contract deployment fails
- Make sure Hardhat node is running (Terminal 2)
- Try `npx hardhat clean` then deploy again

---

## Clean Up

```bash
# Stop all processes (Ctrl+C in each terminal)

# Reset Hardhat blockchain (starts fresh)
# Just kill and restart `npx hardhat node`

# Reset Resonate state (if needed)
rm -rf ~/.resonate/dev
resonate dev
```

---

**You just built a cryptographically verifiable off-chain execution layer! 🎉**
