// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract USDCConverter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;
    ISwapRouter public immutable uniswapRouter;
    address public constant WETH9 = 0x4200000000000000000000000000000000000006; // WETH address on Base
    uint24 public constant poolFee = 500; // 0.05% fee tier

    mapping(address => bool) public hasAgreed;

    event TermsAgreed(address indexed user);
    event Converted(address indexed user, uint256 ethAmount, uint256 usdcAmount);
    event ConversionFailed(address indexed user, uint256 ethAmount, string reason);

    constructor(address _usdcToken, address _uniswapRouter) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        require(_uniswapRouter != address(0), "Invalid Uniswap router address");
        usdcToken = IERC20(_usdcToken);
        uniswapRouter = ISwapRouter(_uniswapRouter);
    }

    function agreeToTerms() external {
        hasAgreed[msg.sender] = true;
        emit TermsAgreed(msg.sender);
    }

    function checkAgreement(address user) external view returns (bool) {
        return hasAgreed[user];
    }

    function convertETHtoUSDC() external payable {
        require(hasAgreed[msg.sender], "User has not agreed to terms");
        require(msg.value > 0, "Must send ETH to convert");

        uint256 deadline = block.timestamp + 15 minutes;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: address(usdcToken),
            fee: poolFee,
            recipient: msg.sender,
            deadline: deadline,
            amountIn: msg.value,
            amountOutMinimum: 1, // Set a minimum amount of USDC to receive, adjust as needed
            sqrtPriceLimitX96: 0
        });

        try uniswapRouter.exactInputSingle{value: msg.value}(params) returns (uint256 amountOut) {
            require(amountOut > 0, "Received 0 USDC");
            emit Converted(msg.sender, msg.value, amountOut);
        } catch Error(string memory reason) {
            emit ConversionFailed(msg.sender, msg.value, reason);
            payable(msg.sender).transfer(msg.value); // Return ETH to user
            revert(string(abi.encodePacked("Uniswap swap failed: ", reason)));
        } catch (bytes memory lowLevelData) {
            string memory reason = _getRevertMsg(lowLevelData);
            emit ConversionFailed(msg.sender, msg.value, reason);
            payable(msg.sender).transfer(msg.value); // Return ETH to user
            revert(string(abi.encodePacked("Uniswap swap failed: ", reason)));
        }
    }

    function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
        if (_returnData.length < 68) return "Transaction reverted silently";
        assembly {
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string));
    }

    receive() external payable {}
}