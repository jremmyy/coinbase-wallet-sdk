// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract USDCConverter {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    mapping(address => bool) public hasAgreed;
    uint256 public constant FIXED_RATE = 1800; // 1 ETH = 1800 USDC (example rate)

    event TermsAgreed(address user);
    event Converted(address user, uint256 ethAmount, uint256 usdcAmount);
    event ConversionFailed(address user, uint256 ethAmount, string reason);

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    function agreeToTerms() external {
        hasAgreed[msg.sender] = true;
        emit TermsAgreed(msg.sender);
    }

    function convertETHtoUSDC() external payable {
        require(hasAgreed[msg.sender], "User has not agreed to terms");
        require(msg.value > 0, "Must send ETH to convert");

        uint256 usdcAmount = (msg.value * FIXED_RATE) / 1 ether;
        require(usdcToken.balanceOf(address(this)) >= usdcAmount, "Insufficient USDC balance in contract");

        bool success = usdcToken.transfer(msg.sender, usdcAmount);
        if (success) {
            emit Converted(msg.sender, msg.value, usdcAmount);
        } else {
            emit ConversionFailed(msg.sender, msg.value, "USDC transfer failed");
            payable(msg.sender).transfer(msg.value); // Return ETH to user
        }
    }

    function checkAgreement(address user) external view returns (bool) {
        return hasAgreed[user];
    }

    // Function to withdraw any ETH sent to this contract (for contract owner)
    function withdrawETH() external {
        // Add appropriate access control here
        payable(msg.sender).transfer(address(this).balance);
    }

    // Function to withdraw any USDC from this contract (for contract owner)
    function withdrawUSDC(uint256 amount) external {
        // Add appropriate access control here
        usdcToken.transfer(msg.sender, amount);
    }
}