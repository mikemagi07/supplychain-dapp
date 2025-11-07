// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ISupplyChainBase.sol";

/**
 * @title Producer Interface
 * @dev Handles adding new products and sending them to suppliers
 */
interface IProducer is ISupplyChainBase {
    /// @notice Registers a producer address
    /// @param _addr Address of the producer
    function registerProducer(address _addr) external;

    /// @notice Adds a new product to the blockchain
    /// @param _name Name of the product
    function addProduct(string memory _name) external;

    /// @notice Sends product to a supplier
    /// @param _id Product ID
    /// @param _supplier Address of the supplier
    function sendToSupplier(uint _id, address _supplier) external;
}
