const hre = require("hardhat");

async function main() {
  const USDCConverter = await hre.ethers.getContractFactory("USDCConverter");

  const usdcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base

  console.log("Deploying USDCConverter...");
  const usdcConverter = await USDCConverter.deploy(usdcTokenAddress);

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
