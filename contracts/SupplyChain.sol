// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    // Enum for product status
    enum ProductStatus {
        Created,
        SentToSupplier,
        ReceivedBySupplier,
        SentToRetailer,
        ReceivedByRetailer,
        AvailableForSale,
        SoldToConsumer
    }

    // Enum for quotation status
    enum QuotationStatus {
        Pending,
        Approved,
        Rejected,
        Fulfilled
    }

    // Quotation structure
    struct Quotation {
        uint256 id;
        address consumer;
        string productName;
        string description;
        uint256 requestedQuantity;
        uint256 createdAt;
        QuotationStatus status;
        uint256 productId; // Linked product after approval (0 if not approved)
    }

    // Product structure
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 totalQuantity;      // Total quantity produced
        uint256 availableQuantity;  // Available for sale (after fulfilling quotations)
        uint256 createdAt;
        address producer;
        address supplier;
        address retailer;
        address consumer;           // For direct sales (non-quotation)
        ProductStatus status;
        string shippingInfo;
        uint256[] quotationIds;     // Quotations this product fulfills
        bool isFromQuotation;        // True if created from quotation approval
    }

    // Mapping to store products
    mapping(uint256 => Product) public products;
    mapping(address => bool) public producers;
    mapping(address => bool) public suppliers;
    mapping(address => bool) public retailers;

    // Quotation mappings
    mapping(uint256 => Quotation) public quotations;
    mapping(address => uint256[]) public consumerQuotations; // Consumer address => quotation IDs
    uint256 public quotationCount;

    uint256 public productCount;
    // Multi-owner support: any address marked true is treated as an owner/admin
    mapping(address => bool) public owners;

    // Events
    event ProductCreated(uint256 indexed productId, string name, address producer);
    event ProductSentToSupplier(uint256 indexed productId, address supplier);
    event ProductReceivedBySupplier(uint256 indexed productId);
    event ShippingInfoUpdated(uint256 indexed productId, string shippingInfo);
    event ProductSentToRetailer(uint256 indexed productId, address retailer);
    event ProductReceivedByRetailer(uint256 indexed productId);
    event ProductAddedToStore(uint256 indexed productId);
    event ProductSoldToConsumer(uint256 indexed productId, address consumer);
    
    // Quotation events
    event QuotationCreated(uint256 indexed quotationId, address indexed consumer, string productName, uint256 requestedQuantity);
    event QuotationApproved(uint256 indexed quotationId, uint256 indexed productId, address indexed producer);
    event QuotationRejected(uint256 indexed quotationId, address indexed producer);
    event QuotationFulfilled(uint256 indexed quotationId, uint256 indexed productId, address indexed consumer);
    event QuotationsBatchApproved(uint256[] quotationIds, uint256 indexed productId, address indexed producer);
    
    // Consumer acknowledgment event
    event PurchaseAcknowledged(uint256 indexed productId, address indexed consumer);
    
    // Registration events
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ProducerRegistered(address indexed producer);
    event SupplierRegistered(address indexed supplier);
    event RetailerRegistered(address indexed retailer);

    modifier onlyOwner() {
        require(owners[msg.sender], "Only owner can perform this action");
        _;
    }

    modifier onlyProducer() {
        require(producers[msg.sender], "Only producer can perform this action");
        _;
    }

    modifier onlySupplier() {
        require(suppliers[msg.sender], "Only supplier can perform this action");
        _;
    }

    modifier onlyRetailer() {
        require(retailers[msg.sender], "Only retailer can perform this action");
        _;
    }

    constructor() {
        // Deployer becomes the initial owner
        owners[msg.sender] = true;
    }

    // --- Owner management (multi-owner admin) ---

    /// @notice Grant owner/admin rights to a new address.
    /// @dev Callable only by an existing owner.
    function addOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner address");
        owners[_newOwner] = true;
        emit OwnerAdded(_newOwner);
    }

    /// @notice Revoke owner/admin rights from an address.
    /// @dev Callable only by an existing owner.
    function removeOwner(address _ownerToRemove) external onlyOwner {
        require(_ownerToRemove != address(0), "Invalid owner address");
        require(_ownerToRemove != msg.sender, "Owner cannot remove self");
        owners[_ownerToRemove] = false;
        emit OwnerRemoved(_ownerToRemove);
    }

    // Owner functions to register stakeholders
    function registerProducer(address _producer) public onlyOwner {
        producers[_producer] = true;
        emit ProducerRegistered(_producer);
    }

    function registerSupplier(address _supplier) public onlyOwner {
        suppliers[_supplier] = true;
        emit SupplierRegistered(_supplier);
    }

    function registerRetailer(address _retailer) public onlyOwner {
        retailers[_retailer] = true;
        emit RetailerRegistered(_retailer);
    }

    // Producer functions
    function addProduct(
        string memory _name,
        string memory _description,
        uint256 _quantity
    ) public onlyProducer returns (uint256) {
        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: _name,
            description: _description,
            totalQuantity: _quantity,
            availableQuantity: _quantity,
            createdAt: block.timestamp,
            producer: msg.sender,
            supplier: address(0),
            retailer: address(0),
            consumer: address(0),
            status: ProductStatus.Created,
            shippingInfo: "",
            quotationIds: new uint256[](0),
            isFromQuotation: false
        });

        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }

    function sendToSupplier(uint256 _productId, address _supplier) public onlyProducer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].producer == msg.sender, "You are not the producer of this product");
        require(products[_productId].status == ProductStatus.Created, "Product must be in Created status");
        require(suppliers[_supplier], "Invalid supplier address");

        products[_productId].supplier = _supplier;
        products[_productId].status = ProductStatus.SentToSupplier;

        emit ProductSentToSupplier(_productId, _supplier);
    }

    // Supplier functions
    function receiveProduct(uint256 _productId) public onlySupplier {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].supplier == msg.sender, "You are not the supplier of this product");
        require(products[_productId].status == ProductStatus.SentToSupplier, "Product must be sent to supplier first");

        products[_productId].status = ProductStatus.ReceivedBySupplier;

        emit ProductReceivedBySupplier(_productId);
    }

    function updateShippingInfo(uint256 _productId, string memory _shippingInfo) public onlySupplier {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].supplier == msg.sender, "You are not the supplier of this product");
        require(
            products[_productId].status == ProductStatus.ReceivedBySupplier ||
            products[_productId].status == ProductStatus.SentToRetailer,
            "Invalid product status"
        );

        products[_productId].shippingInfo = _shippingInfo;

        emit ShippingInfoUpdated(_productId, _shippingInfo);
    }

    function sendToRetailer(uint256 _productId, address _retailer) public onlySupplier {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].supplier == msg.sender, "You are not the supplier of this product");
        require(products[_productId].status == ProductStatus.ReceivedBySupplier, "Product must be received by supplier first");
        require(retailers[_retailer], "Invalid retailer address");

        products[_productId].retailer = _retailer;
        products[_productId].status = ProductStatus.SentToRetailer;

        emit ProductSentToRetailer(_productId, _retailer);
    }

    // Retailer functions
    function receiveProductFromSupplier(uint256 _productId) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.SentToRetailer, "Product must be sent to retailer first");

        products[_productId].status = ProductStatus.ReceivedByRetailer;

        emit ProductReceivedByRetailer(_productId);
    }

    function addToStore(uint256 _productId) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.ReceivedByRetailer, "Product must be received by retailer first");

        products[_productId].status = ProductStatus.AvailableForSale;

        emit ProductAddedToStore(_productId);
    }

    // Mapping to track consumer acknowledgments
    mapping(uint256 => mapping(address => bool)) public consumerAcknowledgments; // productId => consumer => acknowledged
    mapping(uint256 => mapping(address => uint256)) public salesRecords; // productId => consumer => quantity sold

    function sellToConsumer(uint256 _productId, address _consumer, uint256 _quantity) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.AvailableForSale, "Product must be available for sale");
        require(products[_productId].availableQuantity >= _quantity, "Insufficient available quantity");
        require(_quantity > 0, "Quantity must be greater than 0");

        products[_productId].availableQuantity -= _quantity;
        products[_productId].consumer = _consumer; // Track last consumer (for backward compatibility)
        
        // Record the sale
        salesRecords[_productId][_consumer] += _quantity;
        consumerAcknowledgments[_productId][_consumer] = false; // Not yet acknowledged

        // If all quantity is sold, mark as sold
        if (products[_productId].availableQuantity == 0) {
            products[_productId].status = ProductStatus.SoldToConsumer;
        }

        emit ProductSoldToConsumer(_productId, _consumer);
    }

    // Backward compatibility - sells entire available quantity
    function sellToConsumerLegacy(uint256 _productId, address _consumer) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.AvailableForSale, "Product must be available for sale");

        uint256 quantity = products[_productId].availableQuantity;
        products[_productId].availableQuantity = 0;
        products[_productId].consumer = _consumer;
        products[_productId].status = ProductStatus.SoldToConsumer;
        
        salesRecords[_productId][_consumer] = quantity;
        consumerAcknowledgments[_productId][_consumer] = false;

        emit ProductSoldToConsumer(_productId, _consumer);
    }

    // View functions
    function getProduct(uint256 _productId) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 quantity,
        uint256 createdAt,
        address producer,
        address supplier,
        address retailer,
        address consumer,
        ProductStatus status,
        string memory shippingInfo
    ) {
        Product memory product = products[_productId];
        return (
            product.id,
            product.name,
            product.description,
            product.totalQuantity, // Return totalQuantity for backward compatibility
            product.createdAt,
            product.producer,
            product.supplier,
            product.retailer,
            product.consumer,
            product.status,
            product.shippingInfo
        );
    }

    function getProductStatus(uint256 _productId) public view returns (ProductStatus) {
        require(products[_productId].id != 0, "Product does not exist");
        return products[_productId].status;
    }

    // ============ QUOTATION FUNCTIONS ============

    // Consumer functions
    /// @notice Create a quotation request for a product
    /// @param _productName Name of the product requested
    /// @param _description Description of the product
    /// @param _requestedQuantity Quantity requested
    function createQuotation(
        string memory _productName,
        string memory _description,
        uint256 _requestedQuantity
    ) public returns (uint256) {
        require(_requestedQuantity > 0, "Requested quantity must be greater than 0");
        require(bytes(_productName).length > 0, "Product name cannot be empty");

        quotationCount++;
        quotations[quotationCount] = Quotation({
            id: quotationCount,
            consumer: msg.sender,
            productName: _productName,
            description: _description,
            requestedQuantity: _requestedQuantity,
            createdAt: block.timestamp,
            status: QuotationStatus.Pending,
            productId: 0
        });

        consumerQuotations[msg.sender].push(quotationCount);

        emit QuotationCreated(quotationCount, msg.sender, _productName, _requestedQuantity);
        return quotationCount;
    }

    // Producer functions
    /// @notice Approve multiple quotations and create a product batch
    /// @param _quotationIds Array of quotation IDs to approve
    /// @param _totalQuantity Total quantity to produce (must be >= sum of requested quantities)
    function approveQuotations(
        uint256[] memory _quotationIds,
        uint256 _totalQuantity
    ) public onlyProducer returns (uint256) {
        require(_quotationIds.length > 0, "Must approve at least one quotation");
        require(_totalQuantity > 0, "Total quantity must be greater than 0");

        uint256 totalRequested = 0;
        string memory productName = "";
        string memory description = "";

        // Validate all quotations and calculate total requested
        for (uint256 i = 0; i < _quotationIds.length; i++) {
            uint256 qId = _quotationIds[i];
            require(quotations[qId].id != 0, "Quotation does not exist");
            require(quotations[qId].status == QuotationStatus.Pending, "Quotation must be pending");
            
            totalRequested += quotations[qId].requestedQuantity;
            
            // Use first quotation's details for product
            if (i == 0) {
                productName = quotations[qId].productName;
                description = quotations[qId].description;
            } else {
                // Verify all quotations are for the same product type
                require(
                    keccak256(bytes(quotations[qId].productName)) == keccak256(bytes(productName)),
                    "All quotations must be for the same product"
                );
            }
        }

        require(_totalQuantity >= totalRequested, "Total quantity must be >= sum of requested quantities");

        // Create product
        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: productName,
            description: description,
            totalQuantity: _totalQuantity,
            availableQuantity: _totalQuantity,
            createdAt: block.timestamp,
            producer: msg.sender,
            supplier: address(0),
            retailer: address(0),
            consumer: address(0),
            status: ProductStatus.Created,
            shippingInfo: "",
            quotationIds: _quotationIds,
            isFromQuotation: true
        });

        // Update quotation statuses
        for (uint256 i = 0; i < _quotationIds.length; i++) {
            quotations[_quotationIds[i]].status = QuotationStatus.Approved;
            quotations[_quotationIds[i]].productId = productCount;
            emit QuotationApproved(_quotationIds[i], productCount, msg.sender);
        }

        emit QuotationsBatchApproved(_quotationIds, productCount, msg.sender);
        emit ProductCreated(productCount, productName, msg.sender);

        return productCount;
    }

    /// @notice Reject a quotation
    /// @param _quotationId ID of the quotation to reject
    function rejectQuotation(uint256 _quotationId) public onlyProducer {
        require(quotations[_quotationId].id != 0, "Quotation does not exist");
        require(quotations[_quotationId].status == QuotationStatus.Pending, "Quotation must be pending");

        quotations[_quotationId].status = QuotationStatus.Rejected;
        emit QuotationRejected(_quotationId, msg.sender);
    }

    // Retailer functions
    /// @notice Fulfill multiple quotations from a product batch
    /// @param _productId Product ID to fulfill from
    /// @param _quotationIds Array of quotation IDs to fulfill
    function fulfillQuotations(
        uint256 _productId,
        uint256[] memory _quotationIds
    ) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.AvailableForSale, "Product must be available for sale");

        uint256 totalToFulfill = 0;

        // Validate quotations
        for (uint256 i = 0; i < _quotationIds.length; i++) {
            uint256 qId = _quotationIds[i];
            require(quotations[qId].id != 0, "Quotation does not exist");
            require(quotations[qId].status == QuotationStatus.Approved, "Quotation must be approved");
            require(quotations[qId].productId == _productId, "Quotation not linked to this product");
            
            totalToFulfill += quotations[qId].requestedQuantity;
        }

        require(products[_productId].availableQuantity >= totalToFulfill, "Insufficient available quantity");

        // Fulfill quotations
        for (uint256 i = 0; i < _quotationIds.length; i++) {
            uint256 qId = _quotationIds[i];
            quotations[qId].status = QuotationStatus.Fulfilled;
            products[_productId].availableQuantity -= quotations[qId].requestedQuantity;
            emit QuotationFulfilled(qId, _productId, quotations[qId].consumer);
        }

        // If all available quantity is fulfilled, mark product as sold
        if (products[_productId].availableQuantity == 0) {
            // Note: We don't set a single consumer since multiple consumers are involved
            // Status remains AvailableForSale but with 0 available quantity
        }
    }

    /// @notice Purchase directly from surplus inventory (non-quotation purchase)
    /// @param _productId Product ID to purchase from
    /// @param _quantity Quantity to purchase
    function purchaseFromSurplus(
        uint256 _productId,
        uint256 _quantity
    ) public {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].status == ProductStatus.AvailableForSale, "Product must be available for sale");
        require(products[_productId].availableQuantity >= _quantity, "Insufficient available quantity");
        require(_quantity > 0, "Quantity must be greater than 0");

        products[_productId].availableQuantity -= _quantity;
        products[_productId].consumer = msg.sender;

        // Record the sale (same as sellToConsumer)
        salesRecords[_productId][msg.sender] += _quantity;
        consumerAcknowledgments[_productId][msg.sender] = false; // Not yet acknowledged

        // If all quantity is sold, mark as sold
        if (products[_productId].availableQuantity == 0) {
            products[_productId].status = ProductStatus.SoldToConsumer;
        }

        emit ProductSoldToConsumer(_productId, msg.sender);
    }

    // View functions for quotations
    /// @notice Get quotation details
    /// @param _quotationId Quotation ID
    function getQuotation(uint256 _quotationId) public view returns (
        uint256 id,
        address consumer,
        string memory productName,
        string memory description,
        uint256 requestedQuantity,
        uint256 createdAt,
        QuotationStatus status,
        uint256 productId
    ) {
        Quotation memory q = quotations[_quotationId];
        return (
            q.id,
            q.consumer,
            q.productName,
            q.description,
            q.requestedQuantity,
            q.createdAt,
            q.status,
            q.productId
        );
    }

    /// @notice Get all quotations for a consumer
    /// @param _consumer Consumer address
    function getConsumerQuotations(address _consumer) public view returns (uint256[] memory) {
        return consumerQuotations[_consumer];
    }

    /// @notice Get pending quotations (for producers)
    function getPendingQuotations() public view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](quotationCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= quotationCount; i++) {
            if (quotations[i].status == QuotationStatus.Pending) {
                pending[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }

        return result;
    }

    /// @notice Get available products by name (for consumers to browse surplus)
    /// @param _productName Product name to search for
    function getAvailableProductsByName(string memory _productName) public view returns (
        uint256[] memory productIds,
        uint256[] memory availableQuantities
    ) {
        uint256[] memory tempIds = new uint256[](productCount);
        uint256[] memory tempQuantities = new uint256[](productCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= productCount; i++) {
            if (
                products[i].id != 0 &&
                products[i].status == ProductStatus.AvailableForSale &&
                products[i].availableQuantity > 0 &&
                keccak256(bytes(products[i].name)) == keccak256(bytes(_productName))
            ) {
                tempIds[count] = i;
                tempQuantities[count] = products[i].availableQuantity;
                count++;
            }
        }

        // Resize arrays to actual count
        productIds = new uint256[](count);
        availableQuantities = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            productIds[i] = tempIds[i];
            availableQuantities[i] = tempQuantities[i];
        }

        return (productIds, availableQuantities);
    }

    /// @notice Get quotations linked to a product
    /// @param _productId Product ID
    function getProductQuotations(uint256 _productId) public view returns (uint256[] memory) {
        require(products[_productId].id != 0, "Product does not exist");
        return products[_productId].quotationIds;
    }

    /// @notice Get updated product details including new fields
    function getProductExtended(uint256 _productId) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 totalQuantity,
        uint256 availableQuantity,
        uint256 createdAt,
        address producer,
        address supplier,
        address retailer,
        address consumer,
        ProductStatus status,
        string memory shippingInfo,
        uint256[] memory quotationIds,
        bool isFromQuotation
    ) {
        Product storage product = products[_productId];
        id = product.id;
        name = product.name;
        description = product.description;
        totalQuantity = product.totalQuantity;
        availableQuantity = product.availableQuantity;
        createdAt = product.createdAt;
        producer = product.producer;
        supplier = product.supplier;
        retailer = product.retailer;
        consumer = product.consumer;
        status = product.status;
        shippingInfo = product.shippingInfo;
        quotationIds = product.quotationIds;
        isFromQuotation = product.isFromQuotation;
    }

    // Consumer acknowledgment
    /// @notice Consumer acknowledges receipt of purchased product
    /// @param _productId Product ID
    function acknowledgePurchase(uint256 _productId) public {
        require(products[_productId].id != 0, "Product does not exist");
        require(salesRecords[_productId][msg.sender] > 0, "No purchase record found for this product");
        require(!consumerAcknowledgments[_productId][msg.sender], "Purchase already acknowledged");

        consumerAcknowledgments[_productId][msg.sender] = true;
        emit PurchaseAcknowledged(_productId, msg.sender);
    }

    /// @notice Get quantity sold to a specific consumer for a product
    /// @param _productId Product ID
    /// @param _consumer Consumer address
    function getConsumerPurchaseQuantity(uint256 _productId, address _consumer) public view returns (uint256) {
        return salesRecords[_productId][_consumer];
    }

    /// @notice Check if consumer has acknowledged purchase
    /// @param _productId Product ID
    /// @param _consumer Consumer address
    function isPurchaseAcknowledged(uint256 _productId, address _consumer) public view returns (bool) {
        return consumerAcknowledgments[_productId][_consumer];
    }

    /// @notice Get all products in retailer's store (AvailableForSale)
    /// @param _retailer Retailer address
    function getRetailerStoreProducts(address _retailer) public view returns (
        uint256[] memory productIds,
        string[] memory names,
        string[] memory descriptions,
        uint256[] memory totalQuantities,
        uint256[] memory availableQuantities
    ) {
        uint256[] memory tempIds = new uint256[](productCount);
        string[] memory tempNames = new string[](productCount);
        string[] memory tempDescriptions = new string[](productCount);
        uint256[] memory tempTotalQuantities = new uint256[](productCount);
        uint256[] memory tempAvailableQuantities = new uint256[](productCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= productCount; i++) {
            if (
                products[i].id != 0 &&
                products[i].retailer == _retailer &&
                products[i].status == ProductStatus.AvailableForSale &&
                products[i].availableQuantity > 0
            ) {
                tempIds[count] = i;
                tempNames[count] = products[i].name;
                tempDescriptions[count] = products[i].description;
                tempTotalQuantities[count] = products[i].totalQuantity;
                tempAvailableQuantities[count] = products[i].availableQuantity;
                count++;
            }
        }

        // Resize arrays to actual count
        productIds = new uint256[](count);
        names = new string[](count);
        descriptions = new string[](count);
        totalQuantities = new uint256[](count);
        availableQuantities = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            productIds[i] = tempIds[i];
            names[i] = tempNames[i];
            descriptions[i] = tempDescriptions[i];
            totalQuantities[i] = tempTotalQuantities[i];
            availableQuantities[i] = tempAvailableQuantities[i];
        }

        return (productIds, names, descriptions, totalQuantities, availableQuantities);
    }
}

