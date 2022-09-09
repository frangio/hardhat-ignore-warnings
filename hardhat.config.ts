import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";

import "./src";

export default <HardhatUserConfig> {
  solidity: "0.8.9",
  typechain: {
    dontOverrideCompile: true,
  },
  warnings: {
    ignore: {
      'contracts/Ignored.sol': true,
      'contracts/IgnoredLicense.sol': ['license'],
      'contracts/IgnoredPragma.sol': { 'pragma-solidity': true },
    },
  },
};
