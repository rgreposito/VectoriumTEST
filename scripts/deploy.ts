import { ethers } from "hardhat";

async function main() {
	const [deployer, ownerB, ownerC] = await ethers.getSigners();
	const owners = [deployer.address, ownerB.address, ownerC.address];
	const threshold = 2;

	const MultiSig = await ethers.getContractFactory("MultiSigWallet");
	const multiSig = await MultiSig.deploy(owners, threshold);
	await multiSig.waitForDeployment();

	console.log("MultiSigWallet deployed to:", await multiSig.getAddress());
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

