// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IFriendtechSharesV1 {
    function sharesBalance(address sharesSubject, address holder) external view returns (uint256);
    function sharesSupply(address sharesSubject) external view returns (uint256);
    function getPrice(uint256 supply, uint256 amount) external pure returns (uint256);
    function getBuyPrice(address sharesSubject, uint256 amount) external view returns (uint256);
    function getSellPrice(address sharesSubject, uint256 amount) external view returns (uint256);
    function getBuyPriceAfterFee(address sharesSubject, uint256 amount) external view returns (uint256);
    function getSellPriceAfterFee(address sharesSubject, uint256 amount) external view returns (uint256);
    function buyShares(address sharesSubject, uint256 amount) external payable;
    function sellShares(address sharesSubject, uint256 amount) external;
}

contract ShareBuyer {
    address private immutable deployer;
    IFriendtechSharesV1 public constant friendtechSharesV1 = IFriendtechSharesV1(0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4);

    constructor() {
        deployer = msg.sender;
    }

    // Buy and hold shares
    function buyShares(address subject, uint256 amount) external payable {
        // Don't care about caller

        // Fetch price
        uint256 totalCost = friendtechSharesV1.getBuyPriceAfterFee(subject, amount);
        require(msg.value >= totalCost, "Not enough eth");

        // Buy the shares
        friendtechSharesV1.buyShares{value: totalCost}(subject, amount);

        // Refund unspent ETH
        uint256 refund = msg.value - totalCost;
        if (refund > 0) {
            msg.sender.call{value: refund}("");
        }
    }

    // Sell shares and send eth back
    function sellShares(address subject, uint256 amount) external {
        require(msg.sender == deployer, "Only deployer can sell shares");

        // Sell shares
        friendtechSharesV1.sellShares(subject, amount);

        // Send back eth
        uint256 proceeds = address(this).balance;
        msg.sender.call{value: proceeds}("");
    }

    // In case of accidental direct eth send & no shares to sell
    function withdrawManual() external {
        require(msg.sender == deployer, "Only deployer can withdraw");

        // Send back eth
        uint256 proceeds = address(this).balance;
        msg.sender.call{value: proceeds}("");
    }
}