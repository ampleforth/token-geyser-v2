// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/drafts/IERC20Permit.sol";

contract MockERC20 is ERC20, IERC20Permit {
    mapping(address => uint256) public override nonces;

    constructor(address recipient, uint256 amount) ERC20("MockERC20", "MockERC20") {
        ERC20._mint(recipient, amount);
    }

    // Hard-coded DOMAIN_SEPARATOR for testing purposes only.
    // In a real implementation, this would be derived from EIP-712 parameters.
    function DOMAIN_SEPARATOR() external pure override returns (bytes32) {
        return 0x00;
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256, // deadline - ignored in mock
        uint8, // v - ignored in mock
        bytes32, // r - ignored in mock
        bytes32 // s - ignored in mock
    ) external override {
        // For testing, ignore signature checks and deadline.
        // Simply set allowance directly.
        _approve(owner, spender, value);
        // Increment nonce as if a successful permit was used.
        nonces[owner]++;
    }
}

contract MockBAL is ERC20 {
    constructor(address recipient, uint256 amount) ERC20("MockBAL", "BAL") {
        ERC20._mint(recipient, amount);
    }
}

contract MockCharmLiqToken is ERC20 {
    address public token0;
    address public token1;

    constructor(address _token0, address _token1) ERC20("MockCharmLP", "MockCharmLP") {
        token0 = _token0;
        token1 = _token1;
    }

    function deposit(
        uint256 amount0,
        uint256 amount1,
        uint256 minAmount0,
        uint256 minAmount1,
        address to
    )
        external
        returns (
            uint256 lpAmt,
            uint256 actual0,
            uint256 actual1
        )
    {
        require(amount0 >= minAmount0, "Insufficient token0");
        require(amount1 >= minAmount1, "Insufficient token1");
        lpAmt = amount0 + amount1;
        _mint(to, lpAmt);
        actual0 = amount0;
        actual1 = amount1;
        IERC20(token0).transferFrom(msg.sender, address(this), actual0);
        IERC20(token1).transferFrom(msg.sender, address(this), actual1);
    }
}
