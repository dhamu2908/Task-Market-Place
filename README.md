Task Market Place is a decentralized platform designed to facilitate the transparent creation and fulfillment of tasks and bounties using smart contracts on the Hedera network, with a React-based frontend.

This project leverages smart contracts to enable secure, trustless, and transparent interactions between clients and freelancers.

🚀 Overview
At the core of the platform is a Hedera smart contract that allows:

Clients to post tasks with associated rewards and deadlines.

Freelancers to claim, submit, and complete tasks.

State management for every task including creation, claiming, submission, approval, cancellation, and expiration.

The contract also implements:

A basic reputation system for both clients and freelancers.

A decentralized judicial review system for dispute resolution.

🔑 Key Features
✅ Task Lifecycle Management
Task creation, claiming, submission, approval, cancellation, and expiration handled on-chain.

🔒 Escrowed Payments
Rewards are securely locked in the contract and only disbursed upon successful task completion and approval.

🌟 Reputation System
Tracks the performance history of clients and freelancers to encourage reliability and consistent performance.

⚖️ Judicial Review System
Rejected submissions can be appealed.

A fixed panel of judges vote on disputes to resolve conflicts fairly and transparently.

💻 Frontend Integration
Built using React, the frontend enables seamless interaction with the Hedera smart contract.

🌐 Tech Stack
Smart Contracts: Solidity (Hedera-compatible)

Frontend: React, Ethers.js (or Hedera SDK)

Blockchain: Hedera Hashgraph
