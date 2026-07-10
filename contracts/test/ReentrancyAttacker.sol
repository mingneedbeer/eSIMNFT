// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../ESIMNFT.sol";

contract ReentrancyAttacker {
    ESIMNFT public esim;
    uint256 public tokenId;
    bool public activatedDuringCallback;

    constructor(ESIMNFT _esim) {
        esim = _esim;
    }

    function onERC721Received(address, address, uint256 _tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        tokenId = _tokenId;
        // Try to activate during the mint callback
        try esim.activate(_tokenId) {
            activatedDuringCallback = true;
        } catch {
            activatedDuringCallback = false;
        }
        return this.onERC721Received.selector;
    }

    function getPlan() external view returns (ESIMNFT.ESIMPlan memory) {
        return esim.getPlan(tokenId);
    }
}
