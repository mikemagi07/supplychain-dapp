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

    // Product structure
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 quantity;
        uint256 createdAt;
        address producer;
        address supplier;
        address retailer;
        address consumer;
        ProductStatus status;
        string shippingInfo;
    }

    // Mapping to store products
    mapping(uint256 => Product) public products;
    mapping(address => bool) public producers;
    mapping(address => bool) public suppliers;
    mapping(address => bool) public retailers;

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
    }

    /// @notice Revoke owner/admin rights from an address.
    /// @dev Callable only by an existing owner.
    function removeOwner(address _ownerToRemove) external onlyOwner {
        require(_ownerToRemove != address(0), "Invalid owner address");
        require(_ownerToRemove != msg.sender, "Owner cannot remove self");
        owners[_ownerToRemove] = false;
    }

    // Owner functions to register stakeholders
    function registerProducer(address _producer) public onlyOwner {
        producers[_producer] = true;
    }

    function registerSupplier(address _supplier) public onlyOwner {
        suppliers[_supplier] = true;
    }

    function registerRetailer(address _retailer) public onlyOwner {
        retailers[_retailer] = true;
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
            quantity: _quantity,
            createdAt: block.timestamp,
            producer: msg.sender,
            supplier: address(0),
            retailer: address(0),
            consumer: address(0),
            status: ProductStatus.Created,
            shippingInfo: ""
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

    function sellToConsumer(uint256 _productId, address _consumer) public onlyRetailer {
        require(products[_productId].id != 0, "Product does not exist");
        require(products[_productId].retailer == msg.sender, "You are not the retailer of this product");
        require(products[_productId].status == ProductStatus.AvailableForSale, "Product must be available for sale");

        products[_productId].consumer = _consumer;
        products[_productId].status = ProductStatus.SoldToConsumer;

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
            product.quantity,
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
}

