require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000,
    },
    // You can keep the other networks if needed
    baseGoerli: {
      url: "https://goerli.base.org",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000,
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000,
    },
  },
};
