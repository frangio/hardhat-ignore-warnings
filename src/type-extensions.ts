import 'hardhat/types/config';

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
