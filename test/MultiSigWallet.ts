import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", () => {
	it("deploys and executes a simple transfer with 2 approvals", async () => {
		const [ownerA, ownerB, ownerC, recipient] = await ethers.getSigners();
		const Factory = await ethers.getContractFactory("MultiSigWallet");
		const wallet = await Factory.deploy([ownerA.address, ownerB.address, ownerC.address], 2);
		await wallet.waitForDeployment();

		// fund wallet
		await ownerA.sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1.0") });

		// propose transfer 0.5 ETH
		const to = recipient.address;
		const value = ethers.parseEther("0.5");
		const data = "0x";
		const tx = await wallet.connect(ownerA).propose(to, value, data, 0);
		const receipt = await tx.wait();
		const proposalId = (await wallet.proposalCount()) - 1n;

		await wallet.connect(ownerA).approve(proposalId);
		await wallet.connect(ownerB).approve(proposalId);

		const before = await ethers.provider.getBalance(recipient.address);
		await wallet.connect(ownerA).execute(proposalId);
		const after = await ethers.provider.getBalance(recipient.address);
		expect(after - before).to.equal(value);
	});

	it("can add an owner via self call", async () => {
		const [ownerA, ownerB, ownerC, newOwner] = await ethers.getSigners();
		const Factory = await ethers.getContractFactory("MultiSigWallet");
		const wallet = await Factory.deploy([ownerA.address, ownerB.address, ownerC.address], 2);
		await wallet.waitForDeployment();

		const iface = new ethers.Interface(["function addOwner(address newOwner)"]);
		const data = iface.encodeFunctionData("addOwner", [newOwner.address]);
		const tx = await wallet.connect(ownerA).propose(await wallet.getAddress(), 0, data, 1);
		await tx.wait();
		const proposalId = (await wallet.proposalCount()) - 1n;
		await wallet.connect(ownerA).approve(proposalId);
		await wallet.connect(ownerB).approve(proposalId);
		await wallet.execute(proposalId);

		const owners = await wallet.getOwners();
		expect(owners).to.include(newOwner.address);
	});
});

