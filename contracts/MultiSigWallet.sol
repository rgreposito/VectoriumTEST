// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MultiSigWallet {
	struct Proposal {
		address to;
		uint256 value;
		bytes data;
		uint256 approvals;
		bool executed;
		uint8 riskScore; // 0 low, 1 medium, 2 high (from off-chain AI)
		address proposer;
		uint256 createdAt;
	}

	event Deposit(address indexed sender, uint256 amount);
	event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address to, uint256 value, uint8 riskScore);
	event Approved(address indexed owner, uint256 indexed proposalId);
	event Revoked(address indexed owner, uint256 indexed proposalId);
	event Executed(uint256 indexed proposalId, bytes result);
	event OwnerAdded(address indexed owner);
	event OwnerRemoved(address indexed owner);
	event ThresholdUpdated(uint256 threshold);

	address[] public owners;
	mapping(address => bool) public isOwner;
	uint256 public threshold;

	Proposal[] public proposals;
	mapping(uint256 => mapping(address => bool)) public approvedBy;

	modifier onlyOwner() {
		require(isOwner[msg.sender], "not owner");
		_;
	}

	constructor(address[] memory initialOwners, uint256 initialThreshold) payable {
		require(initialOwners.length > 0, "owners required");
		require(initialThreshold > 0 && initialThreshold <= initialOwners.length, "bad threshold");
		for (uint256 i = 0; i < initialOwners.length; i++) {
			address owner = initialOwners[i];
			require(owner != address(0), "zero owner");
			require(!isOwner[owner], "owner not unique");
			isOwner[owner] = true;
			owners.push(owner);
		}
		threshold = initialThreshold;
	}

	receive() external payable {
		emit Deposit(msg.sender, msg.value);
	}

	function getOwners() external view returns (address[] memory) {
		return owners;
	}

	function proposalCount() external view returns (uint256) {
		return proposals.length;
	}

	function propose(address to, uint256 value, bytes calldata data, uint8 riskScore) external onlyOwner returns (uint256 proposalId) {
		require(to != address(0), "to zero");
		require(riskScore <= 2, "bad risk");
		Proposal memory p = Proposal({
			to: to,
			value: value,
			data: data,
			approvals: 0,
			executed: false,
			riskScore: riskScore,
			proposer: msg.sender,
			createdAt: block.timestamp
		});
		proposals.push(p);
		proposalId = proposals.length - 1;
		emit ProposalCreated(proposalId, msg.sender, to, value, riskScore);
	}

	function approve(uint256 proposalId) external onlyOwner {
		require(proposalId < proposals.length, "bad id");
		Proposal storage p = proposals[proposalId];
		require(!p.executed, "executed");
		require(!approvedBy[proposalId][msg.sender], "already");
		approvedBy[proposalId][msg.sender] = true;
		p.approvals += 1;
		emit Approved(msg.sender, proposalId);
	}

	function revoke(uint256 proposalId) external onlyOwner {
		require(proposalId < proposals.length, "bad id");
		Proposal storage p = proposals[proposalId];
		require(!p.executed, "executed");
		require(approvedBy[proposalId][msg.sender], "not approved");
		approvedBy[proposalId][msg.sender] = false;
		p.approvals -= 1;
		emit Revoked(msg.sender, proposalId);
	}

	function execute(uint256 proposalId) external onlyOwner returns (bytes memory result) {
		require(proposalId < proposals.length, "bad id");
		Proposal storage p = proposals[proposalId];
		require(!p.executed, "executed");
		require(p.approvals >= threshold, "not enough approvals");
		p.executed = true;
		(bool ok, bytes memory res) = p.to.call{value: p.value}(p.data);
		require(ok, "call failed");
		emit Executed(proposalId, res);
		return res;
	}

	// Governance changes executed via multi-sig itself
	function addOwner(address newOwner) external {
		require(msg.sender == address(this), "only via multisig");
		require(newOwner != address(0), "zero");
		require(!isOwner[newOwner], "exists");
		isOwner[newOwner] = true;
		owners.push(newOwner);
		if (threshold == 0) {
			threshold = 1;
		}
		emit OwnerAdded(newOwner);
	}

	function removeOwner(address ownerToRemove) external {
		require(msg.sender == address(this), "only via multisig");
		require(isOwner[ownerToRemove], "not owner");
		isOwner[ownerToRemove] = false;
		// remove from array
		for (uint256 i = 0; i < owners.length; i++) {
			if (owners[i] == ownerToRemove) {
				owners[i] = owners[owners.length - 1];
				owners.pop();
				break;
			}
		}
		if (threshold > owners.length) {
			threshold = owners.length;
			emit ThresholdUpdated(threshold);
		}
		emit OwnerRemoved(ownerToRemove);
	}

	function updateThreshold(uint256 newThreshold) external {
		require(msg.sender == address(this), "only via multisig");
		require(newThreshold > 0 && newThreshold <= owners.length, "bad threshold");
		threshold = newThreshold;
		emit ThresholdUpdated(newThreshold);
	}
}

