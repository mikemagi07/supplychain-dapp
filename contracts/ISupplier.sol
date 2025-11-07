// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ISupplyChainBase.sol";

/**
 * @title Supplier Interface
 * @dev Manages receiving products from producers and sending to retailers
 */
interface ISupplier is ISupplyChainBase {
    /// @notice Registers a supplier address
    /// @param _addr Address of the supplier
    function registerSupplier(address _addr) external;

    /// @notice Marks product as received from producer
    /// @param _id Product ID
    function receiveProduct(uint _id) external;

    /// @notice Sends product to a retailer
    /// @param _id Product ID
    /// @param _retailer Address of the retailer
    function sendToRetailer(uint _id, address _retailer) external;
}
