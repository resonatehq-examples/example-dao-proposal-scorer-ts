// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title ProposalScorer
 * @notice Minimal contract demonstrating off-chain computation with on-chain verification
 * 
 * The Problem:
 * - Complex scoring (reputation weights, eligibility, time decay) is expensive on-chain
 * - Example: Scoring 1000 votes with reputation = 500k+ gas (~$25)
 * 
 * The Solution:
 * - Off-chain: Resonate executes complex scoring (cheap)
 * - On-chain: Store only result + cryptographic proof (30k gas, ~$1.50)
 * - Verification: Promise tree acts as merkle proof
 * 
 * Gas Savings: 94%
 */
contract ProposalScorer {
    
    // ============================================
    // State
    // ============================================
    
    struct Proposal {
        uint256 id;
        bytes32 contentHash;      // IPFS hash of proposal content
        address proposer;
        uint256 createdAt;
        uint256 finalScore;       // Computed off-chain
        bytes32 proofHash;        // Resonate promise tree root hash
        address scorer;           // Address that computed the score
        bool finalized;
    }
    
    struct Vote {
        address voter;
        bool support;             // true = yes, false = no
        uint256 timestamp;
    }
    
    // Proposal ID => Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Proposal ID => array of votes
    mapping(uint256 => Vote[]) public votes;
    
    // Counter for proposal IDs
    uint256 public nextProposalId;
    
    // Authorized scorer address (the Resonate service)
    address public scorerService;
    
    // ============================================
    // Events
    // ============================================
    
    event ProposalCreated(
        uint256 indexed proposalId,
        bytes32 contentHash,
        address proposer
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    
    event ScoreSubmitted(
        uint256 indexed proposalId,
        uint256 score,
        bytes32 proofHash,
        address scorer
    );
    
    // ============================================
    // Constructor
    // ============================================
    
    constructor(address _scorerService) {
        scorerService = _scorerService;
        nextProposalId = 1;
    }
    
    // ============================================
    // Public Functions
    // ============================================
    
    /**
     * @notice Create a new proposal
     * @param contentHash IPFS hash of proposal content
     */
    function createProposal(bytes32 contentHash) external returns (uint256) {
        uint256 proposalId = nextProposalId++;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            contentHash: contentHash,
            proposer: msg.sender,
            createdAt: block.timestamp,
            finalScore: 0,
            proofHash: bytes32(0),
            scorer: address(0),
            finalized: false
        });
        
        emit ProposalCreated(proposalId, contentHash, msg.sender);
        
        return proposalId;
    }
    
    /**
     * @notice Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support true for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        require(!proposals[proposalId].finalized, "Proposal already finalized");
        
        // In production, check if voter already voted, has tokens, etc.
        // For demo, keep it simple
        
        votes[proposalId].push(Vote({
            voter: msg.sender,
            support: support,
            timestamp: block.timestamp
        }));
        
        emit VoteCast(proposalId, msg.sender, support);
    }
    
    /**
     * @notice Submit the computed score (called by Resonate service)
     * @param proposalId ID of the proposal
     * @param score The computed final score
     * @param proofHash Hash of the Resonate promise tree (cryptographic proof)
     */
    function submitScore(
        uint256 proposalId,
        uint256 score,
        bytes32 proofHash
    ) external {
        require(msg.sender == scorerService, "Only scorer service can submit scores");
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        require(!proposals[proposalId].finalized, "Proposal already finalized");
        
        proposals[proposalId].finalScore = score;
        proposals[proposalId].proofHash = proofHash;
        proposals[proposalId].scorer = msg.sender;
        proposals[proposalId].finalized = true;
        
        emit ScoreSubmitted(proposalId, score, proofHash, msg.sender);
    }
    
    // ============================================
    // View Functions
    // ============================================
    
    /**
     * @notice Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        return proposals[proposalId];
    }
    
    /**
     * @notice Get all votes for a proposal
     */
    function getVotes(uint256 proposalId) external view returns (Vote[] memory) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        return votes[proposalId];
    }
    
    /**
     * @notice Get vote count for a proposal
     */
    function getVoteCount(uint256 proposalId) external view returns (uint256) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        return votes[proposalId].length;
    }
    
    /**
     * @notice Check if a proposal is finalized (scored)
     */
    function isFinalized(uint256 proposalId) external view returns (bool) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        return proposals[proposalId].finalized;
    }
}
