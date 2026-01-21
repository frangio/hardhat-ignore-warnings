// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import 'hardhat/types/config';
import 'hardhat/types/runtime';

import type { WarningId } from './error-codes.d.ts';

export type WarningRule = boolean | 'warn' | 'error' | 'off';

export type FileRules = {
  [e in WarningId]?: WarningRule;
} & {
  default?: WarningRule;
};

export type WarningConfig = Record<string, WarningRule | FileRules>;

declare module 'hardhat/types/config' {
  export interface HardhatUserConfig {
    warnings?: WarningRule | WarningConfig;
  }

  export interface HardhatConfig {
    warnings: WarningConfig;
  }
}
