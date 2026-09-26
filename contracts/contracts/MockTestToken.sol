// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockTestToken
 * @notice ERC-20 test token ("OpenWorks Test HSK" / "tHSK") for local testing and HSK testnet simulations.
 */
contract MockTestToken is ERC20, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        // Mint 1,000,000 initial test tokens to the deployer / initial owner
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Mint test tokens to any address for test and simulation purposes
     * @param to Recipient address
     * @param amount Token amount to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
