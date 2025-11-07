import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";


export default defineConfig({
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: false,
      },
    },
  },
});
