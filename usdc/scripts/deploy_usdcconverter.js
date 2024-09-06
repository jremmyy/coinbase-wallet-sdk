const hre = require("hardhat");

async function main() {
  const USDCConverter = await hre.ethers.getContractFactory("USDCConverter");

  // USDC token address on Base mainnet
  const usdcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Uniswap V3 SwapRouter address on Base mainnet
  const uniswapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

  console.log("Deploying USDCConverter...");
  const usdcConverter = await USDCConverter.deploy(
    usdcTokenAddress,
    uniswapRouterAddress
  );

  console.log("Waiting for deployment...");
  await usdcConverter.waitForDeployment();

  console.log("USDCConverter deployed to:", await usdcConverter.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
