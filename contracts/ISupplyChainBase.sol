// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * @title SupplyChainBase Interface
 * @dev Base contract storing product data and common tracking functions
 */
interface ISupplyChainBase {
    /// @notice Get details of a product by its ID
    /// @param _id Product ID
    /// @return id Product ID
    /// @return name Product name
    /// @return producer Producer address
    /// @return supplier Supplier address
    /// @return retailer Retailer address
    /// @return consumer Consumer address
    /// @return stageName Current stage name
    function getProduct(uint _id) external view 
        returns (
            uint id,
            string memory name,
            address producer,
            address supplier,
            address retailer,
            address consumer,
            string memory stageName
        );
}
