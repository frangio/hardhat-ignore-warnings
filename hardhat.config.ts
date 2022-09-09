import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";

import "./src";

export default <HardhatUserConfig> {
  solidity: "0.8.9",
  warnings: {
    errors: true,
    ignore: {
      'contracts/Ignored.sol': true,
      'contracts/IgnoredLicense.sol': ['license'],
      'contracts/IgnoredPragma.sol': { 'pragma-solidity': true },
    },
  },
  typechain: {
    dontOverrideCompile: true,
  },
};
