import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";

import "./src";

export default <HardhatUserConfig> {
  solidity: "0.8.9",
  typechain: {
    dontOverrideCompile: true,
  },
  warnings: {
    ignoreFiles: [
      'contracts/Ignored.sol',
    ],
  },
};
