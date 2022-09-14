import { HardhatUserConfig } from 'hardhat/config';

import '@nomicfoundation/hardhat-toolbox';

import './src/plugin';

export default <HardhatUserConfig> {
  solidity: "0.8.9",
  warnings: {
    'Ignored.sol': 'off',
    'contracts/IgnoredLicense.sol': { 'license': 'off' },
    'contracts/IgnoredPragma.sol': { 'pragma-solidity': false },
  },
  typechain: {
    dontOverrideCompile: true,
  },
};
