import { HardhatUserConfig } from 'hardhat/config';

import plugin from './src/plugin.js';

// Skip dependency check
plugin.npmPackage = null;

export default <HardhatUserConfig> {
  solidity: "0.8.9",
  plugins: [plugin],
  warnings: {
    'Ignored.sol': 'off',
    'contracts/IgnoredLicense.sol': { 'license': 'off' },
    'contracts/IgnoredPragma.sol': { 'pragma-solidity': false },
  },
  typechain: {
    dontOverrideCompile: true,
  },
};
