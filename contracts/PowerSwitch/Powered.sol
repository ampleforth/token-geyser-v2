// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {IPowerSwitch} from "./PowerSwitch.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

interface IPowered {
    function isOnline() external view returns (bool status);

    function isOffline() external view returns (bool status);

    function isShutdown() external view returns (bool status);

    function getPowerSwitch() external view returns (address powerSwitch);

    function getPowerController() external view returns (address controller);
}

/// @title Powered
/// @notice Helper for calling external PowerSwitch
/// @dev Security contact: dev-support@ampleforth.org
contract Powered is IPowered, Initializable {
    /* storage */

    address private _powerSwitch;

    /* modifiers */

    modifier onlyOnline() {
        require(isOnline(), "Powered: is not online");
        _;
    }

    modifier onlyOffline() {
        require(isOffline(), "Powered: is not offline");
        _;
    }

    modifier notShutdown() {
        require(!isShutdown(), "Powered: is shutdown");
        _;
    }

    modifier onlyShutdown() {
        require(isShutdown(), "Powered: is not shutdown");
        _;
    }

    /* initializer */

    function _setPowerSwitch(address powerSwitch) internal initializer {
        _powerSwitch = powerSwitch;
    }

    /* getter functions */

    function isOnline() public view override returns (bool status) {
        return IPowerSwitch(_powerSwitch).isOnline();
    }

    function isOffline() public view override returns (bool status) {
        return IPowerSwitch(_powerSwitch).isOffline();
    }

    function isShutdown() public view override returns (bool status) {
        return IPowerSwitch(_powerSwitch).isShutdown();
    }

    function getPowerSwitch() public view override returns (address powerSwitch) {
        return _powerSwitch;
    }

    function getPowerController() public view override returns (address controller) {
        return IPowerSwitch(_powerSwitch).getPowerController();
    }
}
