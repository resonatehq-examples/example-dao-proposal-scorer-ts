import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ProposalScorer contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // For demo purposes, use the deployer as the scorer service
  // In production, this would be a dedicated service account
  const scorerServiceAddress = deployer.address;

  // Deploy the contract
  const ProposalScorer = await ethers.getContractFactory("ProposalScorer");
  const proposalScorer = await ProposalScorer.deploy(scorerServiceAddress);

  await proposalScorer.waitForDeployment();

  const address = await proposalScorer.getAddress();
  console.log("✅ ProposalScorer deployed to:", address);
  console.log("📝 Scorer service address:", scorerServiceAddress);
  console.log("\n💾 Save this address to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`SCORER_PRIVATE_KEY=${process.env.PRIVATE_KEY || "your-private-key"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
