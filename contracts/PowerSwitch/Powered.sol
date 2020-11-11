// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {IPowerSwitch} from "./PowerSwitch.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

contract Powered is Initializable {
    address private _powerSwitch;

    modifier onlyOnline() {
        require(!isOffline(), "Powered: is offline");
        _;
    }

    modifier onlyOffline() {
        require(isOffline(), "Powered: is online");
        _;
    }

    // initializer
    function _setPowerSwitch(address powerSwitch) internal initializer {
        _powerSwitch = powerSwitch;
    }

    // getters
    function isOffline() public view returns (bool status) {
        return IPowerSwitch(_powerSwitch).isOffline();
    }

    function _getPowerSwitch() internal view returns (address powerSwitch) {
        return _powerSwitch;
    }

    function _getPowerController() internal view returns (address controller) {
        return IPowerSwitch(_powerSwitch).getPowerController();
    }
}
