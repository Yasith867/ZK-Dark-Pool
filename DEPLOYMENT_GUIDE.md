# ZK Dark Pool - GitHub Codespace Deployment Guide

Complete step-by-step guide to deploy the ZK Dark Pool DApp on GitHub Codespace with real Aleo blockchain integration.

---

## Prerequisites

- GitHub account
- Leo Wallet browser extension ([leo.app](https://leo.app))
- Aleo testnet credits (free from [faucet.aleo.org](https://faucet.aleo.org))

---

## Step 1: Push Code to GitHub

```bash
# Initialize git repo (if not already)
cd D:\Aleo
git init

# Add all files
git add .
git commit -m "ZK Dark Pool - Aleo Prediction Market"

# Create repo on GitHub and push
# Go to github.com/new and create "zk-dark-pool"
git remote add origin https://github.com/YOUR_USERNAME/zk-dark-pool.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create GitHub Codespace

1. Go to your repository on GitHub
2. Click green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**
5. Wait for environment to load (~2-3 minutes)

---

## Step 3: Install Leo CLI in Codespace

```bash
# Install Rust (required for Leo)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Leo CLI
cargo install leo-lang

# Verify installation
leo --version
```

> **Note:** This takes ~5-10 minutes to compile

---

## Step 4: Get Testnet Credits

1. Open Leo Wallet extension in your browser
2. Copy your wallet address (starts with `aleo1...`)
3. Go to [faucet.aleo.org](https://faucet.aleo.org)
4. Paste your address and request credits
5. Wait ~1-2 minutes for credits to arrive

---

## Step 5: Deploy Smart Contract

```bash
# Navigate to Leo program
cd dark_pool_market

# Set your private key (from Leo Wallet)
export PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# Deploy to testnet
leo deploy --network testnet --private-key $PRIVATE_KEY

# Note the transaction ID - verify on aleoscan.io
```

> **Important:** Your private key is in Leo Wallet → Settings → Export Private Key

---

## Step 6: Update Frontend Config

After deployment, update the program ID in the frontend:

```bash
# Edit config.js with deployed program name
cd ../frontend/src
nano config.js
```

Update the `programId` if it changed (usually stays `dark_pool_market.aleo`).

---

## Step 7: Run Frontend in Codespace

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Codespace will show a popup to open the app in browser (port 5173).

---

## Step 8: Test the DApp

1. Click the Codespace popup to open the app
2. Click **"Select Wallet"** → connect Leo Wallet
3. Go to **"Create Market"** → fill form → submit
4. Leo Wallet will popup asking to sign the transaction
5. After signing, check [testnet.aleoscan.io](https://testnet.aleoscan.io) for your transaction

---

## Step 9: Verify on Aleoscan

1. Go to [testnet.aleoscan.io](https://testnet.aleoscan.io)
2. Search for `dark_pool_market.aleo`
3. You should see your deployed program
4. Check "Transactions" tab for your create_market/place_bet calls

---

## Troubleshooting

### "Program not deployed" error
- Make sure Step 5 completed successfully
- Check if you have enough testnet credits (need ~1-2 credits)

### Leo Wallet not connecting
- Make sure you're on HTTPS (Codespace provides this)
- Check that Leo Wallet is set to "Testnet" network

### Transaction failing
- Verify you have testnet credits
- Check the transaction inputs in browser console

---

## Quick Commands Reference

```bash
# Check Leo version
leo --version

# Deploy program
leo deploy --network testnet --private-key $PRIVATE_KEY

# Run frontend
cd frontend && npm run dev

# Check program on-chain
curl https://api.explorer.provable.com/v1/program/dark_pool_market.aleo
```

---

## Project Structure in Codespace

```
zk-dark-pool/
├── dark_pool_market/      # Leo smart contract
│   ├── src/main.leo       # Contract code
│   └── program.json       # Program manifest
├── frontend/              # React app
│   ├── src/
│   │   ├── config.js      # Network config
│   │   ├── services/      # AleoService
│   │   ├── hooks/         # useAleo hook
│   │   ├── components/    # UI components
│   │   └── pages/         # Pages
│   └── package.json
└── README.md
```
