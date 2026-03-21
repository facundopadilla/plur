# plr-contracts

Smart contracts for Plur — ERC-20 credit token on Avalanche C-Chain.

## Overview

`PLRToken` is the on-chain representation of Plur "credits". Users never interact with it directly — the Django backend acts as a custodial intermediary (minting when users buy credits, burning when they spend them).

## Setup

```bash
npm install
cp .env.example .env
# Fill in your DEPLOYER_PRIVATE_KEY and BACKEND_WALLET_ADDRESS
```

## Commands

```bash
npm run compile      # Compile Solidity contracts
npm run test         # Run all tests
npm run coverage     # Generate coverage report
npm run deploy:fuji  # Deploy to Avalanche Fuji testnet
```

## Deploy to Fuji Testnet

1. Fund your deployer wallet with AVAX at https://faucet.avax.network/
2. Set env vars in `.env`:
   ```
   DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
   BACKEND_WALLET_ADDRESS=0x_your_backend_signer_wallet
   ```
3. Deploy:
   ```bash
   npm run deploy:fuji
   ```
4. Copy the printed address and verify:
   ```bash
   npx hardhat verify --network fuji <PLR_TOKEN_ADDRESS> <DEPLOYER_ADDRESS> <BACKEND_WALLET_ADDRESS>
   ```

## Contract Addresses

| Contract | Network | Address | Explorer |
|----------|---------|---------|---------|
| PLRToken | Fuji Testnet | 0x159a6f159edaCD4b36947fD54B4BaDD87598de29 | https://testnet.snowtrace.io/address/0x159a6f159edaCD4b36947fD54B4BaDD87598de29#code |

## Test Coverage

All 24 tests pass covering:

| Case | Description |
|------|-------------|
| T08 | Custodial burn — BURNER_ROLE burns without `approve()` |
| T09 | Anti-duplicate referenceId — same ID reverts on second use |
| T10 | ERC20Pausable — `pause()` blocks mint/burn, `unpause()` restores |
| T11 | MAX_MINT_PER_TX — minting over 1M PLR in one tx reverts |

## Architecture

- **Custodial model**: backend holds MINTER_ROLE + BURNER_ROLE — no allowances needed
- **Idempotency**: `referenceId` (bytes32 hash of Django tx ID) prevents double-mint/double-burn
- **Emergency stop**: PAUSER_ROLE can halt all transfers via `pause()`
- **Per-tx cap**: MAX_MINT_PER_TX = 1,000,000 PLR protects against bugs
- **EVM**: Compiled for Cancun (required by OpenZeppelin 5.x `Bytes.sol`)
