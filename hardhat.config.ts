import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: { enabled: true, runs: 200 }
		}
	},
	networks: Object.assign(
		{
			localhost: { url: "http://127.0.0.1:8545" }
		},
		PRIVATE_KEY
			? { custom: { url: RPC_URL, accounts: [PRIVATE_KEY] } }
			: {}
	),
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY || ""
	}
};

export default config;

