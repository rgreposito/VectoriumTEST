## Vectorium Technical Assignment – Assignment 1: Multi‑Signature Wallet with AI Risk Detection

This repository contains a Solidity multi‑signature wallet, a TypeScript AI risk scoring module, Hardhat setup with tests, and a minimal React/TypeScript frontend scaffold (to be added) for interacting with the contract.

### Structure
- `contracts/` – Solidity sources
- `test/` – Hardhat tests (TypeScript)
- `scripts/` – Deployment and utility scripts
- `ai/` – AI risk scoring module (TypeScript)
- `frontend/` – React/TypeScript app (will be added)

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Environment
Create `.env` in the repo root:
```bash
RPC_URL="https://rpc.your-network"
PRIVATE_KEY="0xabc..."
```

### Compile and Test
```bash
npx hardhat compile
npx hardhat test
```

### Deploy
```bash
npx hardhat run scripts/deploy.ts --network <networkName>
```

### AI Risk Scoring
The AI module provides a basic heuristic risk score and label. Example usage:
```bash
npx ts-node ai/riskScorer.ts --value 1.2 --txCount 3 --hour 2 --toNew true --contract false
```

### Notes
- Proposals include an optional `riskScore` provided off‑chain by the AI module and emitted on creation to aid UIs and policy engines.
- Execution still requires the configured multi‑signature threshold.

### License
MIT