# 🌐 Blockchain-Based Supply Chain Management DApp

## 📘 Project Overview

This is a **Blockchain-based Supply Chain Management System** built to demonstrate how blockchain can bring **transparency, security, and traceability** to product movement across a supply chain.

The system involves four main stakeholders:
- 🧑‍🌾 **Producer** - Creates products, manages consumer quotations, and initiates the supply chain
- 🚚 **Supplier** - Receives and transports products
- 🏪 **Retailer** - Manages inventory, fulfills quotations, and sells products to consumers
- 👤 **Consumer** - Requests products, purchases from inventory, and tracks purchases

Each participant interacts with the blockchain through a decentralized web application (DApp) built using **React** and **Solidity**, ensuring every transaction is securely recorded on the blockchain with complete timestamp tracking.

---

## 🎯 Project Objective

To create a DApp that tracks a product's journey from production to consumption using blockchain technology, ensuring:
- **Transparency** between all stakeholders
- **Elimination** of fake or tampered goods
- **Immutable** transaction records
- **Role-based access control** for secure operations

---

## 🧩 Stakeholders and Functionalities

### 🧑‍🌾 Producer
**Main Role:** The producer creates the product and starts its blockchain record.

**Functionalities:**
1. **Add Product** – Add new product details (name, description, quantity) with product templates
2. **Manage Quotations** – View, approve, or reject consumer quotation requests
3. **Batch Approval** – Approve multiple quotations for the same product with a single production batch
4. **Send to Supplier** – Transfer product to supplier and update blockchain record
5. **View Product Status** – Check where the product is currently in the supply chain

---

### 🚚 Supplier
**Main Role:** The supplier receives products and delivers them to the retailer.

**Functionalities:**
1. **Receive Product** – Accept product from producer and confirm receipt
2. **Update Shipping Info** – Update delivery status (e.g., "in transit", "delivered")
3. **Send to Retailer** – Transfer the product to retailer and record the update on the blockchain

---

### 🏪 Retailer
**Main Role:** The retailer sells the product to consumers.

**Functionalities:**
1. **Receive Product** – Mark product as received from supplier
2. **Add to Store** – List products as available for sale
3. **View Store Products** – See all products currently in your store with quantities
4. **Fulfill Quotations** – Fulfill approved consumer quotations from products
5. **Manage Surplus Inventory** – View and sell unallocated products
6. **Sell to Consumer** – Transfer product ownership to the consumer (supports partial quantity sales)

---

### 👤 Consumer
**Main Role:** The consumer buys and verifies the authenticity of the product.

**Functionalities:**
1. **Browse Products** – Search and browse available products with autocomplete suggestions
2. **Create Quotation Requests** – Request products that aren't available (with product templates)
3. **View My Quotations** – Track status of quotation requests (Pending, Approved, Rejected, Fulfilled)
4. **Purchase from Surplus** – Buy directly from available inventory
5. **View My Purchases** – See all purchased products with quantities
6. **Acknowledge Purchase** – Confirm receipt of purchased products
7. **View Product Details** – View complete product timeline and blockchain record

---

### 👑 Owner (Admin)
**Main Role:** The owner manages the system and registers stakeholders.

**Functionalities:**
1. **Register Stakeholders** – Register producers, suppliers, retailers, and consumers
2. **Add/Remove Owners** – Manage admin accounts
3. **System Administration** – Oversee the supply chain system

---

## 🧱 Tech Stack

### ⚙️ Backend (Blockchain + Smart Contract)
- **Solidity 0.8.19** – Smart contract programming language
- **Hardhat 2.22** – Development environment, testing framework, and deployment tool
- **TypeScript** – For type-safe development
- **Ethers.js v5** – JavaScript library for interacting with Ethereum
- **Hardhat Ethers Plugin** – Integration of Ethers.js with Hardhat
- **dotenv** – Environment variable management

### 🖥️ Frontend (DApp Interface)
- **React.js 18** – User interface framework
- **TypeScript** – Type-safe frontend development
- **Tailwind CSS** – Modern and responsive UI styling
- **Ethers.js v6** – Connect frontend with blockchain smart contract
- **React Router** – Client-side routing
- **Chakra UI** – Component library
- **Zustand** – State management

---

## 🚀 Quick Start

### 1️⃣ Prerequisites
- **Node.js** (v18 or higher) and **npm**
- **MetaMask** browser extension (optional, for MetaMask wallet mode)

### 2️⃣ Clone the Repository
```bash
git clone https://github.com/mikemagi07/supplychain-dapp.git
cd supplychain-dapp
```

### 3️⃣ Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4️⃣ Start Development Environment

The easiest way to start everything:

```bash
npm start
```

This single command will:
1. Start Hardhat local blockchain node
2. Wait for node to be ready
3. Compile and deploy contracts
4. Fund MetaMask accounts (if configured)
5. Start React frontend

The frontend will open at `http://localhost:3000`

---

## 📜 Available Scripts

### Root Directory Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start full development environment (Hardhat node + frontend) |
| `npm run compile` | Compile Solidity contracts |
| `npm test` | Run test suite |
| `npm run clean` | Clean artifacts and cache |
| `npm run node` | Start local Hardhat node only |
| `npm run deploy:localhost` | Compile and deploy contracts to localhost |
| `npm run start:frontend` | Start React frontend only |

### Frontend Scripts

Navigate to `frontend/` directory:

| Command | Description |
|---------|-------------|
| `npm start` | Start React development server |
| `npm run build` | Build for production |
| `npm test` | Run frontend tests |

---

## 🔧 Configuration

### MetaMask Accounts Setup

The system supports automatic funding and role assignment for MetaMask accounts. Default addresses are configured in `scripts/config/metamask-addresses.js`.

#### Option 1: Use Default Addresses
The system will automatically use default addresses if `METAMASK_ADDRESSES` is not set.

#### Option 2: Set Custom Addresses

**PowerShell (Windows):**
```powershell
$env:METAMASK_ADDRESSES="0x...,0x...,0x..."
```

**Bash (Linux/Mac):**
```bash
export METAMASK_ADDRESSES="0x...,0x...,0x..."
```

#### Option 3: Use Setup Scripts

**PowerShell:**
```powershell
.\scripts\setup-metamask-accounts.ps1
```

**Bash:**
```bash
source scripts/setup-metamask-accounts.sh
```

#### Custom Role Assignment

You can customize role assignments using the `METAMASK_ROLES` environment variable:

```bash
export METAMASK_ROLES="owner:0x...|producer:0x...,0x...|supplier:0x...,0x...|retailer:0x...,0x..."
```

**Default Assignment** (if not specified):
- 1st address → Owner
- 2nd-3rd addresses → Producers
- 4th-5th addresses → Suppliers
- 6th-7th addresses → Retailers
- Remaining → Consumers (unassigned)

#### Funding Amount

Set custom funding amount (default: 100 ETH):

```bash
export FUND_AMOUNT="200"  # Fund each account with 200 ETH
```

---

## 📜 Smart Contracts

### Contract Structure

The project implements a complete supply chain contract:

- **`SupplyChain.sol`** – Main contract implementing the full supply chain logic
  - Role-based access control (Owner, Producer, Supplier, Retailer)
  - Product lifecycle management
  - Event emission for all state changes
  - Multi-owner support

### Interface Contracts

The project defines interface contracts for each stakeholder:

- **`ISupplyChainBase`** – Base interface with common product tracking functions
- **`IProducer`** – Interface for producer operations
- **`ISupplier`** – Interface for supplier operations
- **`IRetailer`** – Interface for retailer operations
- **`IConsumer`** – Interface for consumer operations

### Product Status Flow

```
Created → SentToSupplier → ReceivedBySupplier → SentToRetailer → 
ReceivedByRetailer → AvailableForSale → SoldToConsumer
```

### Product Lifecycle with Timestamps

Each step in the product lifecycle is timestamped for complete audit trail:
- **Created** – Product creation timestamp
- **Sent to Supplier** – When producer sends to supplier
- **Received by Supplier** – When supplier receives
- **Sent to Retailer** – When supplier sends to retailer
- **Received by Retailer** – When retailer receives
- **Added to Store** – When product becomes available for sale
- **Sold to Consumer** – When product is fully sold

### Quotation System Flow

```
Consumer Request → Producer Approval → Product Creation → 
Retailer Fulfillment → Consumer Purchase
```

- Consumers can request products via quotations
- Producers can batch approve multiple quotations
- Products can fulfill multiple quotations simultaneously
- Surplus inventory available for direct purchase

---

## 🔐 Key Features

### Core Supply Chain Features
- ✅ **Complete Supply Chain Flow** – Producer → Supplier → Retailer → Consumer
- ✅ **Role-Based Access Control** – Secure permissions for each stakeholder
- ✅ **Immutable Records** – All transactions recorded on blockchain
- ✅ **Event Logging** – Comprehensive event system for tracking
- ✅ **Multi-Owner Support** – Multiple admin accounts
- ✅ **Product Timeline Tracking** – Timestamps for each step in the product lifecycle
- ✅ **Consumer Registration** – Owners can register consumers in the system

### Advanced Features
- ✅ **Quotation System** – Consumers request products, producers approve/reject, batch fulfillment
- ✅ **Partial Purchases** – Support for partial quantity sales and purchases
- ✅ **Consumer Acknowledgment** – Consumers can acknowledge receipt of purchased products
- ✅ **Surplus Inventory Management** – Track and sell unallocated products
- ✅ **Product Templates** – Quick product creation using pre-defined templates
- ✅ **Enhanced Search** – Autocomplete, partial matching, and client-side filtering
- ✅ **Inventory Visibility** – View available quantities, total quantities, and sales records

### User Experience
- ✅ **Wallet Mode Persistence** – Remembers wallet preference (MetaMask/Local) across sessions
- ✅ **Smart Error Handling** – Modal pop-ups for transactions, inline validation for forms
- ✅ **Product Row Click Prefilling** – Click anywhere on product row to prefill input fields
- ✅ **Real-time Updates** – Auto-refresh on blockchain events
- ✅ **Responsive Design** – Modern UI with Tailwind CSS

### Technical Features
- ✅ **MetaMask Integration** – Support for both local and MetaMask wallets
- ✅ **Type-Safe Development** – TypeScript throughout
- ✅ **Automated Deployment** – One-command setup
- ✅ **Comprehensive Testing** – Full test suite including quotation system tests

---

## 📁 Project Structure

```
supplychain-dapp/
├── contracts/              # Solidity smart contracts
│   ├── SupplyChain.sol    # Main contract
│   └── I*.sol             # Interface contracts
├── scripts/                # Deployment and utility scripts
│   ├── deploy.js          # Main deployment script
│   ├── start-dev.js       # Development startup script
│   ├── fundMetaMaskAccounts.js
│   └── config/            # Configuration files
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── ProductDetailsModal.tsx  # Product details with timeline
│   │   │   ├── ProductTemplateSelector.tsx  # Product templates
│   │   │   ├── ErrorModal.tsx  # Error/success modals
│   │   │   └── InlineError.tsx  # Inline field validation
│   │   ├── pages/        # Page components
│   │   ├── blockchain/   # Contract integration
│   │   ├── data/         # Data files (product templates)
│   │   └── hooks/        # Custom hooks (useSupplyChainEvents)
│   └── public/
├── test/                   # Test files
├── artifacts/              # Compiled contract artifacts
└── hardhat.config.cjs      # Hardhat configuration
```

---

## 🛠️ Development Scripts

### Essential Scripts (Required)

These scripts are necessary for the application to function:

- **`scripts/deploy.js`** – Deploys contracts to localhost, funds MetaMask accounts, and assigns roles
- **`scripts/start-dev.js`** – Main development startup script
- **`scripts/fundMetaMaskAccounts.js`** – Funds multiple MetaMask accounts with test ETH
- **`scripts/config/metamask-addresses.js`** – Shared configuration for default MetaMask addresses

### Utility Scripts (Optional but Useful)

- **`scripts/fundMetaMaskAccount.js`** – Funds a single MetaMask account (useful for quick testing)
- **`scripts/checkBalance.js`** – Checks the balance of a specific address
- **`scripts/addHardhatNetwork.js`** – Helper functions to add/switch to Hardhat network in MetaMask
- **`scripts/demo.js`** – Demonstrates the complete supply chain flow

### Setup Scripts (Optional)

- **`scripts/setup-metamask-accounts.ps1`** – PowerShell script to set METAMASK_ADDRESSES (Windows)
- **`scripts/setup-metamask-accounts.sh`** – Bash script to set METAMASK_ADDRESSES (Linux/Mac)

---

## 🌐 Network Configuration

### Local Hardhat Network

- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Network Name:** Hardhat Local

### Adding Network to MetaMask

You can use the helper script in browser console:

```javascript
// Copy contents of scripts/addHardhatNetwork.js to browser console
// Then run:
await addHardhatNetwork()
```

Or manually add:
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

The test suite includes:
- Contract deployment tests
- Role registration tests
- Supply chain flow tests
- MetaMask integration tests
- **Quotation system tests** – Creation, approval, rejection, fulfillment
- **Partial purchase tests** – Multiple consumers, quantity tracking
- **Consumer acknowledgment tests** – Purchase confirmation
- **Retailer store tests** – Store product management
- **Surplus inventory tests** – Direct purchase functionality
- **Consumer registration tests** – Owner can register consumers, access control verification

---

## 📝 Usage Workflow

1. **Start Development Environment**
   ```bash
   npm start
   ```

2. **Access Frontend**
   - Open `http://localhost:3000`
   - Login with a role (Owner, Producer, Supplier, Retailer, or Consumer)

3. **Connect Wallet**
   - Choose between Local wallet (Hardhat accounts) or MetaMask
   - If using MetaMask, ensure it's connected to Hardhat Local network

4. **Use the Application**
   - **Producer:** 
     - Create products (manual or using templates)
     - Manage pending quotations (approve/reject)
     - Batch approve multiple quotations
     - Send products to suppliers
   - **Supplier:** 
     - Receive products from producers
     - Update shipping information
     - Send products to retailers
   - **Retailer:** 
     - Receive products from suppliers
     - Add products to store
     - View store products and surplus inventory
     - Fulfill quotations
     - Sell products to consumers (partial quantities supported)
   - **Consumer:** 
     - Browse and search available products
     - Create quotation requests (using templates)
     - Purchase from surplus inventory
     - View purchase history and acknowledge purchases
     - View complete product timeline
   - **Owner:** Register new stakeholders and manage system

---

## 🔍 Troubleshooting

### Frontend can't connect to contract
- Ensure Hardhat node is running (`npm run node`)
- Check that contracts are deployed (`npm run deploy:localhost`)
- Verify contract address in `frontend/src/blockchain/SupplyChain.json`

### MetaMask connection issues
- Ensure MetaMask is connected to Hardhat Local network (Chain ID: 31337)
- Check that accounts are funded (run deployment script)
- Verify `METAMASK_ADDRESSES` environment variable is set correctly

### Contract deployment fails
- Ensure Hardhat node is running
- Check that accounts have sufficient balance
- Review error messages in console

---

## 🆕 Recent Updates

### v2.0 Features (Latest)
- ✨ **Quotation System** – Consumer requests, producer approvals, batch fulfillment
- ✨ **Partial Purchases** – Support for selling/buying partial quantities
- ✨ **Product Templates** – Quick product creation with pre-defined templates
- ✨ **Enhanced Search** – Autocomplete, partial matching, and smart filtering
- ✨ **Timeline Tracking** – Timestamps for every step in product lifecycle
- ✨ **Consumer Acknowledgment** – Purchase confirmation system
- ✨ **Retailer Store View** – View all products in retailer's store
- ✨ **Error Handling** – Modal pop-ups and inline field validation
- ✨ **Wallet Persistence** – Remembers wallet mode across page refreshes
- ✨ **Product Row Prefilling** – Click product row to auto-fill input fields

### Inventory Management
- Track `totalQuantity` and `availableQuantity` separately
- Support for multiple partial sales to different consumers
- Sales records per consumer per product
- Surplus inventory tracking

### User Experience Improvements
- Real-time product search with suggestions
- Batch loading for better performance
- Improved error messages and validation
- Better visual feedback for all actions

## 🧠 Future Enhancements

- ⏳ Deploy to public testnets (Sepolia, Polygon Mumbai)
- ⏳ Add product images and metadata
- ⏳ Implement QR code scanning for product verification
- ⏳ Add analytics and reporting dashboard
- ⏳ Product categories and advanced filtering
- ⏳ Pagination for large product lists
- ⏳ Export/import product templates

---

## 👨‍💻 Developed By

**Karthikeyan Murugan, Michael Magizhan Sebastian Rajesh, Naman Ahuja, Sudhersan Kunnavakkam Vinchimoor**

CSE 540 – Project 1: Blockchain-Based Supply Chain Provenance System

Built using Hardhat 2, Solidity, TypeScript, React, and Ethereum
