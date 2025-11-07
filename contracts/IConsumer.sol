// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ISupplyChainBase.sol";

/**
 * @title Consumer Interface
 * @dev Allows consumers to confirm ownership and verify product authenticity
 */
interface IConsumer is ISupplyChainBase {
    /// @notice Registers a consumer address
    /// @param _addr Address of the consumer
    function registerConsumer(address _addr) external;

    /// @notice Confirms ownership of a purchased product
    /// @param _id Product ID
    function confirmOwnership(uint _id) external;

    /// @notice Verifies the product's name and status
    /// @param _id Product ID
    /// @return name Product name
    /// @return status Current stage (e.g., "Sold", "Available")
    function verifyProduct(uint _id) external view returns (string memory name, string memory status);
}
