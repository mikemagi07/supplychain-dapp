# System Architecture Diagram - Horizontal Layer View

## Detailed Three-Layer Architecture with Inter-Layer Communication

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                          FRONTEND LAYER                                                                                  │
│                                                    (React + TypeScript + Tailwind)                                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                                         │
│  │  Owner Dashboard │  │Producer Dashboard│  │Supplier Dashboard│  │Retailer Dashboard│  │Consumer Dashboard│                                         │
│  │                  │  │                  │  │                  │  │                  │  │                  │                                         │
│  │ • Register       │  │ • Create Product │  │ • Receive        │  │ • Receive        │  │ • Browse         │                                         │
│  │   Stakeholders   │  │ • Manage         │  │   Products       │  │   Products       │  │   Products       │                                         │
│  │ • Add/Remove     │  │   Quotations     │  │ • Update         │  │ • Add to Store   │  │ • Create         │                                         │
│  │   Owners         │  │ • Send to        │  │   Shipping       │  │ • Fulfill        │  │   Quotations     │                                         │
│  │                  │  │   Supplier       │  │ • Send to        │  │   Quotations     │  │ • Purchase       │                                         │
│  │                  │  │                  │  │   Retailer       │  │ • Sell Products  │  │ • Acknowledge    │                                         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘                                         │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                              SHARED COMPONENTS & UTILITIES                                                                          │ │
│  │                                                                                                                                                     │ │
│  │  • WalletContext (MetaMask/Local)  • AuthContext (Login/Role)  • ProductDetailsModal  • ErrorModal  • ProductTemplateSelector                    │ │
│  │  • AddressSelect  • InlineError  • useSupplyChainEvents (Real-time event listener)                                                                │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                      │
                                                                      │
                    ┌─────────────────────────────────────────────────┼─────────────────────────────────────────────────┐
                    │                                                 │                                                 │
                    │                    ETHERS.JS v6 BRIDGE          │                                                 │
                    │                                                 │                                                 │
                    │  ┌──────────────────────────────────────────────┴──────────────────────────────────────────────┐ │
                    │  │                                                                                              │ │
                    │  │  contract.ts Functions:                                                                      │ │
                    │  │                                                                                              │ │
                    │  │  • getContract(signer) ────────────────────────► Returns contract instance                  │ │
                    │  │  • getLocalSigner(address) ────────────────────► Creates signer for Hardhat account         │ │
                    │  │  • getReadOnlyContract() ──────────────────────► Read-only contract (no transactions)       │ │
                    │  │                                                                                              │ │
                    │  │  Transaction Flow:                                                                           │ │
                    │  │  1. User Action → 2. contract.functionName() → 3. tx.wait() → 4. Event Emitted              │ │
                    │  │                                                                                              │ │
                    │  │  Event Listening:                                                                            │ │
                    │  │  contract.on("EventName", callback) ───────────► Real-time UI updates                       │ │
                    │  │                                                                                              │ │
                    │  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
                    │                                                                                                    │
                    └────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                      │
                                                                      │
                                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                        BLOCKCHAIN LAYER                                                                                  │
│                                              (Ethereum - Hardhat Local Network)                                                                         │
│                                                    Chain ID: 31337                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                              JSON-RPC PROVIDER                                                                                      │ │
│  │                                          http://127.0.0.1:8545                                                                                      │ │
│  │                                                                                                                                                     │ │
│  │  Incoming Requests:                                    Outgoing Responses:                                                                         │ │
│  │  • eth_sendTransaction ──────────────────────────────► Transaction Hash                                                                            │ │
│  │  • eth_call (read-only) ─────────────────────────────► Return Value                                                                                │ │
│  │  • eth_getTransactionReceipt ────────────────────────► Receipt with Events                                                                         │ │
│  │  • eth_getLogs (event queries) ───────────────────────► Event Logs                                                                                 │ │
│  │  • eth_accounts ──────────────────────────────────────► Available Accounts                                                                         │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                              TRANSACTION POOL & MINING                                                                              │ │
│  │                                                                                                                                                     │ │
│  │  1. Receive Transaction → 2. Validate → 3. Add to Pool → 4. Mine Block → 5. Update State → 6. Emit Events                                        │ │
│  │                                                                                                                                                     │ │
│  │  Block Time: ~2-3 seconds (configurable)                                                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                              EVENT EMISSION & LOGGING                                                                               │ │
│  │                                                                                                                                                     │ │
│  │  Events Emitted:                                                                                                                                    │ │
│  │  • ProductCreated, ProductSentToSupplier, ProductReceivedBySupplier, ProductSoldToConsumer                                                         │ │
│  │  • QuotationCreated, QuotationApproved, QuotationRejected, QuotationFulfilled                                                                      │ │
│  │  • ProducerRegistered, SupplierRegistered, RetailerRegistered                                                                                      │ │
│  │                                                                                                                                                     │ │
│  │  Frontend subscribes to these events for real-time updates                                                                                         │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                      │
                                                                      │
                                                    SMART CONTRACT CALLS
                                                                      │
                                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                     SMART CONTRACT LAYER                                                                                 │
│                                                    SupplyChain.sol (Solidity)                                                                           │
│                                                  Deployed at: 0x5FbDB2...                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                   STATE STORAGE                                                                                     │ │
│  │                                                                                                                                                     │ │
│  │  mapping(uint256 => Product) products;                    ◄─── Stores all products                                                                 │ │
│  │  mapping(uint256 => Quotation) quotations;                ◄─── Stores all quotations                                                               │ │
│  │  mapping(address => bool) producers;                      ◄─── Registered producers                                                                │ │
│  │  mapping(address => bool) suppliers;                      ◄─── Registered suppliers                                                                │ │
│  │  mapping(address => bool) retailers;                      ◄─── Registered retailers                                                                │ │
│  │  mapping(address => bool) owners;                         ◄─── Admin accounts                                                                      │ │
│  │  mapping(address => uint256[]) consumerQuotations;        ◄─── Consumer's quotation IDs                                                            │ │
│  │  mapping(uint256 => mapping(address => uint256)) salesRecords;  ◄─── Sales tracking                                                                │ │
│  │  mapping(uint256 => mapping(address => bool)) consumerAcknowledgments;  ◄─── Purchase confirmations                                                │ │
│  │                                                                                                                                                     │ │
│  │  uint256 productCount;                                    ◄─── Total products created                                                              │ │
│  │  uint256 quotationCount;                                  ◄─── Total quotations created                                                            │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                 ACCESS CONTROL MODIFIERS                                                                            │ │
│  │                                                                                                                                                     │ │
│  │  modifier onlyOwner()    { require(owners[msg.sender], "Only owner"); _; }                                                                         │ │
│  │  modifier onlyProducer() { require(producers[msg.sender], "Only producer"); _; }                                                                   │ │
│  │  modifier onlySupplier() { require(suppliers[msg.sender], "Only supplier"); _; }                                                                   │ │
│  │  modifier onlyRetailer() { require(retailers[msg.sender], "Only retailer"); _; }                                                                   │ │
│  │                                                                                                                                                     │ │
│  │  These modifiers enforce role-based access control on all functions                                                                                │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                    CORE FUNCTIONS                                                                                   │ │
│  │                                                                                                                                                     │ │
│  │  OWNER FUNCTIONS:                                                                                                                                   │ │
│  │  • registerProducer(address) ────────────────────► Registers producer address                                                                      │ │
│  │  • registerSupplier(address) ────────────────────► Registers supplier address                                                                      │ │
│  │  • registerRetailer(address) ────────────────────► Registers retailer address                                                                      │ │
│  │  • addOwner(address) ────────────────────────────► Adds new admin                                                                                  │ │
│  │  • removeOwner(address) ─────────────────────────► Removes admin                                                                                   │ │
│  │                                                                                                                                                     │ │
│  │  PRODUCER FUNCTIONS:                                                                                                                                │ │
│  │  • addProduct(name, desc, qty) ──────────────────► Creates new product → Returns productId                                                         │ │
│  │  • approveQuotations(quotationIds[], totalQty) ──► Batch approves quotations → Creates product                                                     │ │
│  │  • rejectQuotation(quotationId) ─────────────────► Rejects quotation request                                                                       │ │
│  │  • sendToSupplier(productId, supplierAddr) ──────► Sends product to supplier                                                                       │ │
│  │                                                                                                                                                     │ │
│  │  SUPPLIER FUNCTIONS:                                                                                                                                │ │
│  │  • receiveProduct(productId) ────────────────────► Confirms receipt from producer                                                                  │ │
│  │  • updateShippingInfo(productId, info) ──────────► Updates tracking information                                                                    │ │
│  │  • sendToRetailer(productId, retailerAddr) ──────► Sends product to retailer                                                                       │ │
│  │                                                                                                                                                     │ │
│  │  RETAILER FUNCTIONS:                                                                                                                                │ │
│  │  • receiveProductFromSupplier(productId) ────────► Confirms receipt from supplier                                                                  │ │
│  │  • addToStore(productId) ────────────────────────► Makes product available for sale                                                                │ │
│  │  • fulfillQuotations(productId, quotationIds[]) ─► Fulfills approved quotations                                                                    │ │
│  │  • sellToConsumer(productId, consumer, qty) ─────► Sells product to consumer                                                                       │ │
│  │                                                                                                                                                     │ │
│  │  CONSUMER FUNCTIONS:                                                                                                                                │ │
│  │  • createQuotation(name, desc, qty) ─────────────► Creates quotation request → Returns quotationId                                                 │ │
│  │  • purchaseFromSurplus(productId, qty) ──────────► Buys from available inventory                                                                   │ │
│  │  • acknowledgePurchase(productId) ────────────────► Confirms receipt of product                                                                     │ │
│  │                                                                                                                                                     │ │
│  │  VIEW FUNCTIONS (Anyone can call):                                                                                                                  │ │
│  │  • getProduct(productId) ────────────────────────► Returns product details                                                                         │ │
│  │  • getQuotation(quotationId) ────────────────────► Returns quotation details                                                                       │ │
│  │  • getPendingQuotations() ───────────────────────► Returns all pending quotations                                                                  │ │
│  │  • getConsumerQuotations(address) ───────────────► Returns consumer's quotations                                                                   │ │
│  │  • getAvailableProductsByName(name) ─────────────► Returns available products                                                                      │ │
│  │  • getRetailerStoreProducts(retailer) ───────────► Returns retailer's inventory                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                  BUSINESS LOGIC                                                                                     │ │
│  │                                                                                                                                                     │ │
│  │  Product Lifecycle Validation:                                                                                                                      │ │
│  │  • Can only send to supplier if status = Created                                                                                                    │ │
│  │  • Can only receive if status = SentToSupplier                                                                                                      │ │
│  │  • Can only sell if status = AvailableForSale                                                                                                       │ │
│  │  • Each transition updates timestamp and emits event                                                                                                │ │
│  │                                                                                                                                                     │ │
│  │  Quotation System Logic:                                                                                                                            │ │
│  │  • Batch approval validates all quotations are for same product                                                                                     │ │
│  │  • Total quantity must be >= sum of requested quantities                                                                                            │ │
│  │  • Links quotations to product via quotationIds array                                                                                               │ │
│  │  • Fulfillment deducts from availableQuantity                                                                                                       │ │
│  │                                                                                                                                                     │ │
│  │  Inventory Management:                                                                                                                              │ │
│  │  • totalQuantity = amount produced (never changes)                                                                                                  │ │
│  │  • availableQuantity = amount still for sale (decreases with sales)                                                                                 │ │
│  │  • Supports partial purchases from multiple consumers                                                                                               │ │
│  │  • Tracks sales per consumer in salesRecords mapping                                                                                                │ │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
                                                        DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

SCENARIO: Consumer creates quotation, Producer approves, Product flows through supply chain

┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│   FRONTEND      │                    │   BLOCKCHAIN    │                    │ SMART CONTRACT  │
│   (Consumer)    │                    │                 │                    │                 │
└────────┬────────┘                    └────────┬────────┘                    └────────┬────────┘
         │                                      │                                      │
         │ 1. Click "Create Quotation"          │                                      │
         │    Fill form: "Laptop", 10 units     │                                      │
         │                                      │                                      │
         │ 2. contract.createQuotation()        │                                      │
         ├─────────────────────────────────────►│                                      │
         │                                      │                                      │
         │                                      │ 3. eth_sendTransaction               │
         │                                      ├─────────────────────────────────────►│
         │                                      │                                      │
         │                                      │                                      │ 4. Execute createQuotation()
         │                                      │                                      │    • Validate inputs
         │                                      │                                      │    • Create quotation struct
         │                                      │                                      │    • Store in mapping
         │                                      │                                      │    • Emit QuotationCreated event
         │                                      │                                      │
         │                                      │ 5. Transaction Receipt + Events      │
         │                                      │◄─────────────────────────────────────┤
         │                                      │                                      │
         │ 6. Event: QuotationCreated           │                                      │
         │◄─────────────────────────────────────┤                                      │
         │                                      │                                      │
         │ 7. UI updates: "Quotation created!"  │                                      │
         │                                      │                                      │
         │                                      │                                      │
┌────────┴────────┐                    ┌────────┴────────┐                    ┌────────┴────────┐
│   FRONTEND      │                    │   BLOCKCHAIN    │                    │ SMART CONTRACT  │
│   (Producer)    │                    │                 │                    │                 │
└────────┬────────┘                    └────────┬────────┘                    └────────┬────────┘
         │                                      │                                      │
         │ 8. View pending quotations           │                                      │
         │    contract.getPendingQuotations()   │                                      │
         ├─────────────────────────────────────►│                                      │
         │                                      │                                      │
         │                                      │ 9. eth_call (read-only)              │
         │                                      ├─────────────────────────────────────►│
         │                                      │                                      │
         │                                      │                                      │ 10. Return quotation IDs
         │                                      │◄─────────────────────────────────────┤
         │                                      │                                      │
         │ 11. Display quotations in dashboard  │                                      │
         │◄─────────────────────────────────────┤                                      │
         │                                      │                                      │
         │ 12. Select quotations [1,2,3]        │                                      │
         │     Enter total qty: 50              │                                      │
         │     Click "Approve"                  │                                      │
         │                                      │                                      │
         │ 13. contract.approveQuotations()     │                                      │
         ├─────────────────────────────────────►│                                      │
         │                                      │                                      │
         │                                      │ 14. eth_sendTransaction              │
         │                                      ├─────────────────────────────────────►│
         │                                      │                                      │
         │                                      │                                      │ 15. Execute approveQuotations()
         │                                      │                                      │     • Validate quotations
         │                                      │                                      │     • Create product
         │                                      │                                      │     • Link quotations
         │                                      │                                      │     • Emit events
         │                                      │                                      │
         │                                      │ 16. Receipt + Events                 │
         │                                      │◄─────────────────────────────────────┤
         │                                      │                                      │
         │ 17. Events: QuotationApproved,       │                                      │
         │            ProductCreated            │                                      │
         │◄─────────────────────────────────────┤                                      │
         │                                      │                                      │
         │ 18. UI updates: "Product created!"   │                                      │
         │                                      │                                      │
         └──────────────────────────────────────┴──────────────────────────────────────┘

[Product then flows through Supplier → Retailer → Consumer with similar transaction patterns]
```

---

## Simplified Visual Summary

```
┌──────────────┐         Ethers.js          ┌──────────────┐      Smart Contract      ┌──────────────┐
│              │      (JavaScript API)       │              │         Calls            │              │
│   FRONTEND   │ ◄─────────────────────────► │  BLOCKCHAIN  │ ◄──────────────────────► │   CONTRACT   │
│              │                             │              │                          │              │
│  React UI    │   • contract.function()     │  Hardhat     │   • Execute function     │  Solidity    │
│  Dashboards  │   • tx.wait()               │  Network     │   • Update state         │  Logic       │
│  Components  │   • contract.on("Event")    │  JSON-RPC    │   • Emit events          │  Storage     │
│              │                             │              │                          │              │
└──────────────┘                             └──────────────┘                          └──────────────┘
```

