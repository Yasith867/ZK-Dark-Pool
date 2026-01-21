# ZK Dark Pool - Private Prediction Market on Aleo

A fully functional, privacy-preserving prediction market powered by zero-knowledge proofs on the Aleo blockchain.

## 🔒 What Makes This Private?

| **Public (On-Chain)** | **Private (Hidden)** |
|----------------------|---------------------|
| Market question | Your bet amount |
| Total pool sizes | Your bet choice (YES/NO) |
| Resolution result | Your identity as bettor |

## 🚀 Quick Start (GitHub Codespace)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/YOUR_USERNAME/zk-dark-pool)

### 1. Deploy Smart Contract
```bash
cd dark_pool_market
export PRIVATE_KEY="your_leo_wallet_private_key"
leo deploy --network testnet --private-key $PRIVATE_KEY
```

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Connect & Trade
- Install [Leo Wallet](https://leo.app)
- Get testnet credits from [faucet.aleo.org](https://faucet.aleo.org)
- Connect wallet and start trading!

## 📁 Project Structure

```
├── dark_pool_market/     # Leo smart contract
│   └── src/main.leo      # ZK prediction market logic
├── frontend/             # React application
│   ├── src/config.js     # Network configuration
│   ├── src/services/     # Aleo blockchain service
│   └── src/pages/        # App pages
└── DEPLOYMENT_GUIDE.md   # Full deployment instructions
```

## 🔧 Smart Contract Functions

| Function | Privacy | Description |
|----------|---------|-------------|
| `create_market` | Public | Create a new prediction market |
| `place_bet` | **Private** | Place encrypted bet (hidden amount & choice) |
| `resolve_market` | Public | Creator sets winning outcome |
| `claim_winnings` | **Private** | Claim via ZK proof (no bet reveal) |

## 🏆 Privacy Buildathon Alignment

- ✅ **Records for Private State** - Bet amounts/choices stored in encrypted records
- ✅ **Mappings for Public State** - Market info/pool totals are transparent
- ✅ **ZK Proofs** - Claim winnings without revealing original bet
- ✅ **Leo Wallet Integration** - Real testnet transactions

## 📚 Resources

- [Aleo Developer Docs](https://developer.aleo.org)
- [Leo Language](https://leo-lang.org)
- [Leo Wallet](https://leo.app)
- [Aleo Testnet Faucet](https://faucet.aleo.org)

## 📄 License

MIT
