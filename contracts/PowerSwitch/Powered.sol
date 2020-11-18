// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {IPowerSwitch} from "./PowerSwitch.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

contract Powered is Initializable {
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

    function isOnline() public view returns (bool status) {
        return IPowerSwitch(_powerSwitch).isOnline();
    }

    function isOffline() public view returns (bool status) {
        return IPowerSwitch(_powerSwitch).isOffline();
    }

    function isShutdown() public view returns (bool status) {
        return IPowerSwitch(_powerSwitch).isShutdown();
    }

    function getPowerSwitch() public view returns (address powerSwitch) {
        return _powerSwitch;
    }

    function getPowerController() public view returns (address controller) {
        return IPowerSwitch(_powerSwitch).getPowerController();
    }
}
