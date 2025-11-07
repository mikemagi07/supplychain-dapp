// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ISupplyChainBase.sol";

/**
 * @title Retailer Interface
 * @dev Handles receiving products from suppliers and selling to consumers
 */
interface IRetailer is ISupplyChainBase {
    /// @notice Registers a retailer address
    /// @param _addr Address of the retailer
    function registerRetailer(address _addr) external;

    /// @notice Marks product as received from supplier
    /// @param _id Product ID
    function receiveFromSupplier(uint _id) external;

    /// @notice Sells the product to a consumer
    /// @param _id Product ID
    /// @param _consumer Address of the consumer
    function sellToConsumer(uint _id, address _consumer) external;
}
