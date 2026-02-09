# DAO Proposal Scorer - Resonate + Blockchain Example

**✨ NEW: Now with Cryptographic Commitments!** See [CRYPTO-INTEGRATION.md](./CRYPTO-INTEGRATION.md) for details.

## The Problem

DAOs need to score proposals based on complex logic:
- Vote counting with reputation weights
- Eligibility checks (token holding period)
- Time-weighted voting (early votes count more)

**On-chain:** 500k+ gas (~$25) per proposal  
**Off-chain with Resonate:** 30k gas (~$1.50) per proposal  
**Savings: 94%**

## The Insight

Resonate's promise trees are cryptographically verifiable merkle trees. This means:
1. Complex computation happens off-chain (cheap)
2. Only the result + proof hash goes on-chain (expensive)
3. Anyone can verify by re-running the computation
4. The promise tree structure proves the work was done correctly

## Architecture

```
┌─────────────────┐
│   Blockchain    │  ← Simple contract stores: (proposalId, score, proofHash)
│  (Ethereum)     │
└────────┬────────┘
         │
         │ Event: ProposalCreated(id)
         │ Call: submitScore(id, score, proof)
         │
         ▼
┌─────────────────┐
│ Event Listener  │  ← Watches for proposals, creates durable promises
└────────┬────────┘
         │
         │ Creates: "scoreProposal.{id}"
         │
         ▼
┌─────────────────┐
│ Resonate Server │  ← Promise tree storage + task queue
└────────┬────────┘
         │
         │ Workers poll for tasks
         │
         ▼
┌─────────────────┐
│  Worker Pool    │  ← Executes scoring (durable, resumable)
│                 │
│  scoreProposal  │  ← Main function (orchestrates)
│  ├─ fetchVotes  │  ← Get all votes from contract
│  ├─ getReputations  ← Calculate voter reputations
│  ├─ checkEligibility  ← Verify voters held tokens 30+ days
│  └─ calculateScore    ← Compute weighted final score
└─────────────────┘
```

## Promise Tree = Proof

When we run `scoreProposal.123`, Resonate creates:

```
scoreProposal.123 (root: 0xABCD1234...)
├── fetchVotes (hash: 0x1111...)
├── getReputations (hash: 0x2222...)
├── checkEligibility (hash: 0x3333...)
└── calculateScore (hash: 0x4444...)
```

The root hash `0xABCD1234...` goes on-chain as proof.

To verify:
```bash
resonate tree scoreProposal.123
```

This shows:
- All child promises
- Their inputs and outputs
- Execution order and timing
- Cryptographic hashes at each step

**This is cryptographic proof the computation was done correctly.**

## What This Demonstrates

1. **Cost Savings:** Complex computation off-chain = 94% cheaper
2. **Durability:** Kill worker mid-execution, it resumes
3. **Verifiability:** Promise tree proves work was done
4. **Scalability:** Add more workers, handle more proposals
5. **Composability:** Each step is independently verifiable

## Getting Started

### Prerequisites
- Node.js 18+
- Resonate CLI (`brew install resonatehq/tap/resonate`)
- Hardhat (for local blockchain)

### 1. Start Resonate Server
```bash
resonate dev
```

### 2. Start Local Blockchain
```bash
cd contracts
npm install
npx hardhat node
```

### 3. Deploy Contract
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### 4. Start Worker
```bash
cd resonate-layer
npm install
npm run worker
```

### 5. Start Event Listener
```bash
npm run listener
```

### 6. Create a Proposal
```bash
cd demo
npm run create-proposal
```

### 7. Watch the Magic
- Worker picks up the task
- Executes scoring in steps (durable)
- Posts result + proof hash on-chain
- Check the promise tree: `resonate tree scoreProposal.1`

## Project Structure

```
dao-proposal-scorer/
├── contracts/              # Smart contract
│   ├── ProposalScorer.sol
│   └── hardhat.config.ts
├── resonate-layer/        # Off-chain execution layer
│   ├── src/
│   │   ├── functions/     # Durable functions
│   │   ├── blockchain/    # Event listener
│   │   └── worker.ts      # Worker process
│   └── package.json
└── demo/                  # Demo scripts
    └── create-proposal.ts
```

## Key Code Patterns

### Registering Functions
```typescript
// Each function is registered separately
resonate.register('scoreProposal', scoreProposal);
resonate.register('fetchVotes', fetchVotes);
resonate.register('getReputations', getReputations);
resonate.register('checkEligibility', checkEligibility);
resonate.register('calculateScore', calculateScore);
```

### Using Context for Durability
```typescript
async function scoreProposal(ctx: Context, proposalId: number) {
  // Each step is a durable child promise
  const votes = await ctx.run(
    fetchVotes,
    ctx.options({ id: 'votes' }),
    proposalId
  );
  
  const reputations = await ctx.run(
    getReputations,
    ctx.options({ id: 'reps' }),
    votes
  );
  
  // More steps...
  
  return { score };
}
```

### Event Listener Creates Promises
```typescript
async function handleProposalCreated(proposalId: number) {
  // Create durable promise (worker will execute)
  const handle = await resonate.beginRun(
    `scoreProposal.${proposalId}`,
    'scoreProposal',
    proposalId
  );
  
  // Wait for result
  const result = await handle.result();
  
  // Get proof from promise tree
  const tree = await getPromiseTree(`scoreProposal.${proposalId}`);
  const proofHash = calculateMerkleRoot(tree);
  
  // Post to blockchain
  await contract.submitScore(proposalId, result.score, proofHash);
}
```

## Learn More

- [Resonate Documentation](https://docs.resonatehq.io)
- [Merkle Trees Explained](https://en.wikipedia.org/wiki/Merkle_tree)
- [EIP-712: Ethereum Typed Data](https://eips.ethereum.org/EIPS/eip-712)

## License

Apache 2.0
