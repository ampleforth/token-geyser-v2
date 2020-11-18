// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {Ownable} from "../Access/Ownable.sol";

interface IPowerSwitch {
    function powerOff() external;

    function isOffline() external view returns (bool status);

    function getPowerController() external view returns (address controller);
}

contract PowerSwitch is IPowerSwitch, Ownable {
    bool private _offline;

    event PowerOff();

    constructor(address owner) {
        Ownable._setOwnership(owner);
    }

    function powerOff() external override onlyOwner {
        require(_offline == false, "PowerSwitch: already off");
        _offline = true;
        emit PowerOff();
    }

    function isOffline() external view override returns (bool status) {
        return _offline;
    }

    function getPowerController() external view override returns (address controller) {
        return Ownable.owner();
    }
}
