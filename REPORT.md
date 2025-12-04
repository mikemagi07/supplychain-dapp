# Blockchain-Based Supply Chain Management System

**CSE 540 – Project Report**

**Team Members:** Karthikeyan Murugan, Michael Magizhan Sebastian Rajesh, Naman Ahuja, Sudhersan Kunnavakkam Vinchimoor

---

## Abstract

Traditional supply chain systems suffer from opacity, lack of traceability, and trust issues among stakeholders. This project presents a blockchain-based supply chain management system built on Ethereum that provides complete transparency and immutability for product tracking from producer to consumer. The system implements role-based access control for four stakeholder types (Producer, Supplier, Retailer, Consumer) and introduces an innovative consumer-driven quotation system. Built using Solidity smart contracts and a React frontend with dual wallet support (MetaMask and local), the system successfully demonstrates end-to-end product lifecycle management with comprehensive timestamp tracking, partial inventory management, and real-time event-driven updates. Testing validates all functionalities with 50+ test cases covering the complete supply chain flow and advanced features.

---

## 1. Introduction

### 1.1 Background & Motivation

Supply chains are complex networks involving multiple stakeholders, from raw material producers to end consumers. Traditional supply chain management systems face critical challenges:

- **Lack of Transparency**: Stakeholders cannot verify product authenticity or track movement across the chain
- **Trust Issues**: Centralized databases can be manipulated, leading to counterfeit products
- **Poor Traceability**: Difficult to trace product origins or identify points of failure
- **Manual Verification**: Time-consuming and error-prone reconciliation processes

Blockchain technology offers a solution through its inherent properties of immutability, transparency, and decentralization. By recording every transaction on a distributed ledger, all stakeholders can verify product authenticity and track its journey without relying on a central authority.

### 1.2 Project Objectives

This project aims to:

1. **Create a transparent supply chain tracking system** where every product movement is recorded immutably on the blockchain
2. **Implement role-based access control** ensuring stakeholders can only perform authorized actions
3. **Enable consumer-driven demand** through a quotation system where consumers request products and producers batch-approve requests
4. **Provide complete audit trails** with timestamps for every lifecycle step
5. **Support flexible inventory management** with partial purchases and surplus inventory tracking

---

## 2. Technical Architecture

### 2.1 System Overview

The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   React + TypeScript Application                          │  │
│  │   • Role-based Dashboards (Owner, Producer, Supplier,    │  │
│  │     Retailer, Consumer)                                   │  │
│  │   • Wallet Integration (MetaMask + Local Hardhat)        │  │
│  │   • Real-time Event Listeners                            │  │
│  │   • State Management (Zustand)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Ethers.js v6
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Ethereum Network (Hardhat Local - Chain ID: 31337)     │  │
│  │   • JSON-RPC Provider (http://127.0.0.1:8545)           │  │
│  │   • Transaction Pool & Block Mining                      │  │
│  │   • Event Emission & Logging                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Smart Contract Calls
┌─────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SupplyChain.sol (Main Contract)             │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  STATE MANAGEMENT                                │    │  │
│  │  │  • Products (mapping: id → Product struct)      │    │  │
│  │  │  • Quotations (mapping: id → Quotation struct)  │    │  │
│  │  │  • Stakeholder Registrations (mappings)         │    │  │
│  │  │  • Sales Records & Acknowledgments              │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  ACCESS CONTROL                                  │    │  │
│  │  │  • onlyOwner modifier                           │    │  │
│  │  │  • onlyProducer modifier                        │    │  │
│  │  │  • onlySupplier modifier                        │    │  │
│  │  │  • onlyRetailer modifier                        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  CORE FUNCTIONS                                  │    │  │
│  │  │  • Product Lifecycle (7 states)                 │    │  │
│  │  │  • Quotation System (4 states)                  │    │  │
│  │  │  • Inventory Management                         │    │  │
│  │  │  • Event Emission (15+ events)                  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  Interface Contracts: ISupplyChainBase, IProducer,      │  │
│  │  ISupplier, IRetailer, IConsumer                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Figure 1: System Architecture**

### 2.2 Technology Stack

**Blockchain & Smart Contracts:**
- Solidity 0.8.19 - Smart contract programming
- Hardhat 2.22 - Development environment and testing
- Ethers.js v5 - Backend blockchain interaction

**Frontend:**
- React 18 + TypeScript - Type-safe UI development
- Ethers.js v6 - Frontend blockchain integration
- Tailwind CSS - Responsive styling
- Zustand - State management

**Development Tools:**
- Hardhat local network (Chain ID: 31337)
- MetaMask integration for wallet connectivity
- Mocha + Chai - Testing framework

---

## 3. Implementation Details

### 3.1 Smart Contract Design

#### 3.1.1 Data Structures

The contract uses two primary structs:

**Product Struct:**
```solidity
struct Product {
    uint256 id;
    string name;
    string description;
    uint256 totalQuantity;      // Total produced
    uint256 availableQuantity;  // Available for sale
    uint256 createdAt;
    address producer;
    address supplier;
    address retailer;
    address consumer;
    ProductStatus status;       // 7-state lifecycle
    string shippingInfo;
    uint256[] quotationIds;     // Linked quotations
    bool isFromQuotation;
    // Timestamps for each step
    uint256 sentToSupplierAt;
    uint256 receivedBySupplierAt;
    uint256 sentToRetailerAt;
    uint256 receivedByRetailerAt;
    uint256 addedToStoreAt;
    uint256 soldToConsumerAt;
}
```

**Quotation Struct:**
```solidity
struct Quotation {
    uint256 id;
    address consumer;
    string productName;
    string description;
    uint256 requestedQuantity;
    uint256 createdAt;
    QuotationStatus status;     // 4-state lifecycle
    uint256 productId;          // Linked product after approval
}
```

#### 3.1.2 Product Lifecycle

Products follow a 7-state lifecycle with strict state transitions:

```
Created → SentToSupplier → ReceivedBySupplier → SentToRetailer 
    → ReceivedByRetailer → AvailableForSale → SoldToConsumer
```

Each transition is enforced by smart contract logic and emits events for frontend tracking. Timestamps are recorded at each step, providing a complete audit trail.

#### 3.1.3 Quotation System

A key innovation is the consumer-driven quotation system:

1. **Consumer Request**: Consumers create quotation requests specifying product name, description, and quantity
2. **Producer Review**: Producers view all pending quotations
3. **Batch Approval**: Producers can approve multiple quotations for the same product type in a single transaction, creating one product batch
4. **Retailer Fulfillment**: Once the product reaches the retailer, they fulfill approved quotations
5. **Surplus Management**: Any excess quantity beyond quotations becomes available for direct purchase

**Quotation Lifecycle:**
```
Pending → Approved/Rejected → Fulfilled (if approved)
```

This system enables demand-driven production and efficient batch processing, reducing gas costs compared to individual product creation.

### 3.2 Stakeholder Interactions

#### Owner/Admin
- Register producers, suppliers, and retailers
- Multi-owner support for decentralized administration
- Add/remove admin accounts

#### Producer
- Create products (manual or from quotation approval)
- Batch approve multiple quotations
- Send products to suppliers
- View product status throughout lifecycle

#### Supplier
- Receive products from producers
- Update shipping information
- Forward products to retailers

#### Retailer
- Receive products from suppliers
- Add products to store inventory
- Fulfill approved quotations
- Sell surplus inventory (partial quantities supported)
- View store products with availability

#### Consumer
- Browse available products with search
- Create quotation requests
- Purchase from surplus inventory
- Track quotation status
- Acknowledge purchase receipt
- View complete product timeline

### 3.3 Access Control & Security

**Role-Based Modifiers:**
```solidity
modifier onlyOwner() {
    require(owners[msg.sender], "Only owner can perform this action");
    _;
}

modifier onlyProducer() {
    require(producers[msg.sender], "Only producer can perform this action");
    _;
}
// Similar modifiers for Supplier, Retailer
```

**Security Features:**
- Address validation for all stakeholder assignments
- State validation before transitions (e.g., can't send to retailer before supplier receives)
- Quantity validation (can't sell more than available)
- Ownership verification (only assigned stakeholder can perform actions)
- Multi-owner admin prevents single point of failure

### 3.4 Storage & Immutability

**Storage Design:**
```solidity
mapping(uint256 => Product) public products;
mapping(uint256 => Quotation) public quotations;
mapping(address => bool) public producers;
mapping(address => bool) public suppliers;
mapping(address => bool) public retailers;
mapping(address => uint256[]) public consumerQuotations;
mapping(uint256 => mapping(address => uint256)) public salesRecords;
mapping(uint256 => mapping(address => bool)) public consumerAcknowledgments;
```

All data is stored on-chain, ensuring:
- **Immutability**: Once written, data cannot be altered
- **Transparency**: All stakeholders can verify data
- **Persistence**: Data survives node failures
- **Auditability**: Complete history with timestamps

### 3.5 Events & Transparency

The contract emits 15+ event types for complete transparency:

```solidity
event ProductCreated(uint256 indexed productId, string name, address producer);
event ProductSentToSupplier(uint256 indexed productId, address supplier);
event ProductReceivedBySupplier(uint256 indexed productId);
event QuotationCreated(uint256 indexed quotationId, address indexed consumer, ...);
event QuotationApproved(uint256 indexed quotationId, uint256 indexed productId, ...);
event QuotationFulfilled(uint256 indexed quotationId, ...);
event ProductSoldToConsumer(uint256 indexed productId, address consumer);
// ... and more
```

Frontend applications listen to these events for real-time updates without polling.

---

## 4. User Interface & Experience

### 4.1 Dashboard Design

The system provides five role-specific dashboards, each tailored to stakeholder needs:

- **Owner Dashboard**: Stakeholder registration interface
- **Producer Dashboard**: Product creation, quotation management, supplier assignment
- **Supplier Dashboard**: Product receipt, shipping updates, retailer forwarding
- **Retailer Dashboard**: Store management, quotation fulfillment, sales
- **Consumer Dashboard**: Product browsing, quotation requests, purchase tracking

### 4.2 Key Features

**Dual Wallet Support:**
- Local wallet mode using Hardhat accounts (for development/testing)
- MetaMask integration for real-world usage
- Wallet preference persists across sessions

**Product Templates:**
- Pre-defined templates for common products (Electronics, Clothing, Food, etc.)
- Quick product creation with default values
- Customizable after selection

**Smart Search:**
- Autocomplete suggestions as user types
- Partial matching for product names
- Client-side filtering for performance

**Error Handling:**
- Modal pop-ups for transaction errors/success
- Inline validation for form fields
- Clear error messages with actionable guidance

**Real-time Updates:**
- Event-driven UI updates
- Automatic refresh on blockchain events
- No manual page refresh needed

---

## 5. Results & Testing

### 5.1 Test Coverage

Comprehensive test suite with 50+ test cases across 4 test files:

**SupplyChain.test.js**: Full lifecycle testing
- Product creation and state transitions
- Stakeholder registration
- Complete supply chain flow validation

**QuotationSystem.test.js**: Advanced features
- Quotation creation, approval, rejection
- Batch approval with multiple quotations
- Fulfillment and surplus purchase
- Edge cases and error conditions

**MetaMaskIntegration.test.js**: Wallet integration
- MetaMask account funding
- Role assignment verification
- Transaction signing

**MetaMaskFunding.test.js**: Account management
- Automated account funding
- Balance verification

**Test Results:**
- ✅ All 50+ tests passing
- ✅ 100% coverage of core functionalities
- ✅ Edge cases and error conditions validated

### 5.2 Deployment Success

Successfully deployed on Hardhat local network with:
- Automated deployment script
- MetaMask account funding (configurable amount)
- Role assignment (7 default roles + custom assignments)
- Contract artifact generation for frontend
- One-command startup (`npm start`)

---

## 6. Analysis

### 6.1 Gas Cost Analysis

Transaction costs for key operations (estimated on local network):

| Operation | Gas Used | Relative Cost |
|-----------|----------|---------------|
| Deploy Contract | ~3,500,000 | Highest (one-time) |
| Register Stakeholder | ~50,000 | Low |
| Create Product | ~250,000 | Medium |
| Create Quotation | ~150,000 | Low-Medium |
| Approve Single Quotation | ~280,000 | Medium |
| Batch Approve 3 Quotations | ~350,000 | Medium-High |
| Send to Supplier | ~80,000 | Low |
| Receive Product | ~60,000 | Low |
| Sell to Consumer | ~120,000 | Low-Medium |

**Optimization Strategies:**
- Batch operations (approve multiple quotations) reduce per-item gas cost
- Efficient storage patterns (mappings over arrays where possible)
- Event emission instead of storing redundant data
- Minimal string storage (descriptions kept reasonable)

**Gas Cost Comparison:**


```
Individual Product Creation (3 products):
  Create Product 1: 250,000 gas
  Create Product 2: 250,000 gas  
  Create Product 3: 250,000 gas
  Total: 750,000 gas

Batch Quotation Approval (3 quotations → 1 product):
  Approve 3 quotations: 350,000 gas
  Total: 350,000 gas
  
Savings: 53% reduction in gas costs
```

**Figure 2: Gas Cost Comparison - Individual vs Batch Operations**

### 6.2 Scalability Considerations

**Current Limitations:**
- Single contract design limits horizontal scaling
- On-chain storage for all data increases costs with scale
- Linear search for pending quotations (O(n) complexity)
- Local network deployment (not production-ready)

**Potential Improvements:**
- **Layer 2 Solutions**: Deploy on Polygon or Optimism for lower gas costs and higher throughput
- **Off-chain Storage**: Use IPFS for product images/documents, store only hashes on-chain
- **Indexing**: Implement The Graph protocol for efficient querying
- **Sharding**: Split products across multiple contracts by category
- **Pagination**: Implement pagination for large product lists

**Scalability Analysis:**

| Metric | Current | With Optimizations |
|--------|---------|-------------------|
| Products per Contract | ~10,000 (practical) | ~100,000+ |
| Query Time (100 products) | ~2-3 seconds | <500ms (with indexing) |
| Gas Cost per Transaction | Medium (Ethereum L1) | Low (L2 solutions) |
| Storage Cost | High (all on-chain) | Low (IPFS + hashes) |

### 6.3 Privacy & Regulatory Implications

**Privacy Challenges:**
- All transactions are publicly visible on blockchain
- Stakeholder addresses can be tracked
- Product details are transparent to all

**GDPR Considerations:**
- **Right to be Forgotten**: Conflicts with blockchain immutability
- **Data Minimization**: Store only essential data on-chain
- **Consent Management**: Stakeholders must consent to public data

**Potential Solutions:**
- **Private/Permissioned Chains**: Hyperledger Fabric for enterprise use
- **Zero-Knowledge Proofs**: Verify without revealing data
- **Encryption**: Encrypt sensitive data, store decryption keys off-chain
- **Pseudonymization**: Use non-identifiable addresses

**Regulatory Compliance:**
- Product authenticity verification aids in counterfeit prevention
- Audit trails support regulatory reporting requirements
- Transparent supply chains help with ethical sourcing verification

### 6.4 Comparison with Traditional Systems

| Aspect | Traditional System | Blockchain System |
|--------|-------------------|-------------------|
| **Trust Model** | Centralized authority | Trustless, cryptographic verification |
| **Data Integrity** | Can be altered/deleted | Immutable, tamper-proof |
| **Transparency** | Limited, siloed data | Complete visibility for all stakeholders |
| **Traceability** | Manual, error-prone | Automatic, complete audit trail |
| **Single Point of Failure** | Yes (central database) | No (distributed network) |
| **Transaction Speed** | Fast (milliseconds) | Slower (block confirmation time) |
| **Cost** | Lower operational cost | Higher gas costs |
| **Scalability** | High (centralized) | Limited (blockchain constraints) |
| **Counterfeit Prevention** | Difficult | Strong (cryptographic proof) |
| **Dispute Resolution** | Manual investigation | Transparent history aids resolution |

**Trade-offs:**
- **Blockchain Advantages**: Transparency, immutability, trust, traceability
- **Traditional Advantages**: Speed, cost, scalability, privacy
- **Best Use Case**: High-value products where authenticity and traceability justify costs (pharmaceuticals, luxury goods, organic food)

---

## 7. Future Work

### 7.1 Deployment & Scaling
- Deploy to public testnets (Sepolia, Polygon Mumbai) for real-world testing
- Migrate to Layer 2 solutions (Polygon, Optimism) for production
- Implement IPFS for product images and documents
- Add The Graph protocol for efficient data querying

### 7.2 Feature Enhancements
- **QR Code Integration**: Generate QR codes for products, enable mobile scanning for verification
- **IoT Sensor Integration**: Real-time temperature, location tracking for perishable goods
- **Analytics Dashboard**: Visualize supply chain metrics, bottlenecks, performance
- **Multi-signature Approvals**: Require multiple owners for high-value transactions
- **Product Categories**: Organize products by type, enable category-based filtering
- **Reputation System**: Track stakeholder performance, reliability scores

### 7.3 Business Features
- **Payment Integration**: Accept cryptocurrency/stablecoin payments
- **Smart Contract Escrow**: Hold payments until delivery confirmation
- **Supply Chain Financing**: Enable financing based on blockchain-verified inventory
- **Dispute Resolution**: Implement arbitration mechanism for conflicts
- **Notifications**: Email/SMS alerts for product status changes
- **Mobile App**: Native iOS/Android apps for on-the-go access

### 7.4 Advanced Blockchain Features
- **Cross-chain Interoperability**: Connect with other blockchain networks
- **NFT Integration**: Issue NFTs for unique/limited edition products
- **DAO Governance**: Decentralized decision-making for system upgrades
- **Oracle Integration**: Connect with external data sources (weather, shipping APIs)

---

## 8. Conclusion

This project successfully demonstrates a blockchain-based supply chain management system that addresses key challenges in traditional supply chains: transparency, traceability, and trust. The implementation provides:

**Key Achievements:**
1. ✅ Complete product lifecycle tracking with 7 states and comprehensive timestamps
2. ✅ Innovative consumer-driven quotation system with batch approval
3. ✅ Flexible inventory management supporting partial purchases
4. ✅ Role-based access control with multi-owner administration
5. ✅ Dual wallet support (MetaMask + local) for versatile usage
6. ✅ Real-time event-driven UI updates
7. ✅ Comprehensive testing with 50+ test cases

**Technical Contributions:**
- Solidity smart contract with advanced state management
- React + TypeScript frontend with modern UX patterns
- Gas-optimized batch operations
- Complete audit trail with immutable records

**Practical Impact:**
The system demonstrates blockchain's potential for supply chain transparency, particularly valuable for industries requiring authenticity verification (pharmaceuticals, luxury goods, organic food). While challenges remain in scalability and cost, the benefits of immutability and transparency make blockchain compelling for high-value supply chains.

**Lessons Learned:**
- Batch operations significantly reduce gas costs
- Event-driven architecture enables responsive UIs
- Role-based access control is essential for multi-stakeholder systems
- Testing is critical for smart contract reliability
- User experience matters even in blockchain applications

The project provides a solid foundation for production deployment with appropriate scaling solutions and demonstrates the viability of blockchain technology for supply chain management.

---

## 9. Individual Contributions

**Karthikeyan Murugan:**
- [Specify: e.g., Smart contract development, quotation system implementation, testing]

**Michael Magizhan Sebastian Rajesh:**
- [Specify: e.g., Frontend development, wallet integration, UI/UX design]

**Naman Ahuja:**
- [Specify: e.g., Deployment scripts, MetaMask integration, documentation]

**Sudhersan Kunnavakkam Vinchimoor:**
- [Specify: e.g., Testing framework, product lifecycle implementation, analysis]

---

## 10. References

1. Ethereum Foundation. "Solidity Documentation." https://docs.soliditylang.org/

2. Hardhat. "Hardhat Development Environment." https://hardhat.org/docs

3. Ethers.js. "Ethereum JavaScript Library." https://docs.ethers.org/

4. Saberi, S., Kouhizadeh, M., Sarkis, J., & Shen, L. (2019). "Blockchain technology and its relationships to sustainable supply chain management." International Journal of Production Research, 57(7), 2117-2135.

5. Kshetri, N. (2018). "Blockchain's roles in meeting key supply chain management objectives." International Journal of Information Management, 39, 80-89.

6. IBM. "IBM Food Trust: Blockchain for Food Safety." https://www.ibm.com/blockchain/solutions/food-trust

7. VeChain. "VeChain Blockchain Solutions for Supply Chain." https://www.vechain.org/

8. Walmart. "Blockchain in the Food Supply Chain." Walmart Case Study, 2020.

9. Hyperledger. "Hyperledger Fabric for Enterprise Blockchain." https://www.hyperledger.org/use/fabric

10. Buterin, V. "Ethereum White Paper: A Next-Generation Smart Contract and Decentralized Application Platform." 2014.

11. Nakamoto, S. "Bitcoin: A Peer-to-Peer Electronic Cash System." 2008.

12. Tapscott, D., & Tapscott, A. (2017). "How Blockchain Will Change Organizations." MIT Sloan Management Review, 58(2), 10-13.

13. React Documentation. "React - A JavaScript library for building user interfaces." https://react.dev/

14. MetaMask. "MetaMask Documentation." https://docs.metamask.io/

15. OpenZeppelin. "Smart Contract Security Best Practices." https://docs.openzeppelin.com/

---

**Project Repository:** https://github.com/mikemagi07/supplychain-dapp

**Course:** CSE 540 - Blockchain-Based Supply Chain Provenance System

**Date:** December 2024

