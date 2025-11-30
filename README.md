# 🌐 Blockchain-Based Supply Chain Management DApp

## 📘 Project Overview
This is a **Blockchain-based Supply Chain Management System** built as a **project** to demonstrate how blockchain can bring **transparency, security, and traceability** to product movement across a supply chain.

The system involves four main stakeholders:
- 🧑‍🌾 **Producer**
- 🚚 **Supplier**
- 🏪 **Retailer**
- 👤 **Consumer**

Each participant interacts with the blockchain through a decentralized web application (DApp) built using **React** and **Solidity**, ensuring every transaction is securely recorded on the blockchain.

---

## 🎯 Project Objective
To create a simple DApp that tracks a product’s journey from production to consumption using blockchain technology, ensuring:
- Transparency between all stakeholders  
- Elimination of fake or tampered goods  
- Immutable transaction records  

---

## 🧩 Stakeholders and Functionalities

### 🧑‍🌾 Producer
**Main Role:** The producer creates the product and starts its blockchain record.

**Functionalities:**
1. **Add Product** – Add new product details like name, date, and quantity.  
2. **Send to Supplier** – Transfer product to supplier and update blockchain record.  
3. **View Product Status** – Check where the product is currently in the supply chain.

---

### 🚚 Supplier
**Main Role:** The supplier receives products and delivers them to the retailer.

**Functionalities:**
1. **Receive Product** – Accept product from producer and confirm receipt.  
2. **Update Shipping Info** – Update delivery status (e.g., “in transit”, “delivered”).  
3. **Send to Retailer** – Transfer the product to retailer and record the update on the blockchain.

---

### 🏪 Retailer
**Main Role:** The retailer sells the product to consumers.

**Functionalities:**
1. **Receive Product** – Mark product as received from supplier.  
2. **Add to Store** – List products as available for sale.  
3. **Sell to Consumer** – Transfer product ownership to the consumer.

---

### 👤 Consumer
**Main Role:** The consumer buys and verifies the authenticity of the product.

**Functionalities:**
1. **Check Product Details** – Scan or view the product’s blockchain record.  
2. **Buy Product** – Purchase the product from the retailer.  
3. **Confirm Ownership** – Ownership is updated on blockchain after purchase.

---

## 🧱 Tech Stack

### ⚙️ Backend (Blockchain + Smart Contract)
- **Solidity 0.8.28** – For writing smart contracts  
- **Hardhat 3.0** – Development environment, testing framework, and deployment tool  
- **TypeScript** – For type-safe development  
- **Ethers.js v6** – JavaScript library for interacting with Ethereum  
- **Hardhat Ethers Plugin** – Integration of Ethers.js with Hardhat  
- **dotenv** – Environment variable management  

### 🖥️ Frontend (DApp Interface)
- **React.js** – For building the user interface (planned)  
- **Tailwind CSS** – For modern and responsive UI styling (planned)  
- **Ethers.js** – To connect the frontend with the blockchain smart contract  
- **Node.js + npm** – For running and managing dependencies  

---


## 🚀 How to Run the Project

### 1️⃣ Prerequisites
- Install **Node.js** (v18 or higher) and **npm**

### 2️⃣ Clone the Repository
```bash
git clone https://github.com/mikemagi07/supplychain-dapp.git
cd supplychain-dapp
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ Compile Smart Contracts
```bash
npm run compile
```

This will compile all Solidity contracts in the `contracts/` directory and generate artifacts in `artifacts/`.

### 5️⃣ Run Tests (Optional)
```bash
npm test
```

### 6️⃣ Start Local Hardhat Node (Optional)
To run a local blockchain node for testing:
```bash
npm run node
```

This starts a local Hardhat network on `http://127.0.0.1:8545` with 20 pre-funded accounts.

### 7️⃣ Available Scripts
- `npm run compile` – Compile Solidity contracts
- `npm test` – Run tests
- `npm run clean` – Clean artifacts and cache
- `npm run node` – Start local Hardhat node
- `npm run deploy` - Runs the deploy.js script
---

## 📜 Smart Contracts

The project currently defines **interface contracts** that specify the structure and functions for each stakeholder:

- **ISupplyChainBase** – Base interface with common product tracking functions
- **IProducer** – Interface for producer operations (add product, send to supplier)
- **ISupplier** – Interface for supplier operations (receive, send to retailer)
- **IRetailer** – Interface for retailer operations (receive, sell to consumer)
- **IConsumer** – Interface for consumer operations (verify, confirm ownership)

> **Note:** The concrete implementation contract (`SupplyChain.sol`) is yet to be created. The interfaces define the contract structure that will be implemented.

## 🔐 Key Features
- ✅ Simple role-based flow: Producer → Supplier → Retailer → Consumer  
- ✅ All major actions (add, send, receive, sell) recorded on the blockchain  
- ✅ Type-safe development with TypeScript
- ✅ Secure environment variable management
- ✅ Hardhat 3 development environment with Ethers.js integration
- ✅ Frontend integration ready (React + Ethers.js planned)

---

## 🧠 Future Enhancements (To Do)
- ⏳ Implement concrete `SupplyChain.sol` contract based on the interfaces
- ⏳ Add comprehensive test suite using Hardhat and Mocha
- ⏳ Set up deployment scripts and documentation
- ⏳ Build React frontend with role-based UI  
- ⏳ Implement authentication/role-based UI for better UX  
- ⏳ Deploy the contract to a public testnet like Sepolia or Polygon Mumbai
- ⏳ Implement access control and role management

---

## 🏁 Conclusion
This project demonstrates a straightforward, educational DApp that uses blockchain to make supply chains more transparent and trustworthy. It's intentionally kept simple to suit a college project while remaining extendable for future improvements.

---

### 👨‍💻 Developed By

**Karthikeyan Murugan, Michael Magizhan Sebastian Rajesh, Naman Ahuja, Sudhersan Kunnavakkam Vinchimoor**  
CSE 540 – Project 1: Blockchain-Based Supply Chain Provenance System  
Built using Hardhat 3, Solidity, TypeScript, and Ethereum
