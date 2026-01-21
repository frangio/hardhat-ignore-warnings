import type { HardhatPlugin } from 'hardhat/types/plugins';
import type { HookContext } from 'hardhat/types/hooks';
import type { HardhatConfig, HardhatUserConfig, SolcConfig, ConfigurationVariableResolver } from 'hardhat/types/config';
import type { RunCompilationJobResult, CompilerInput, CompilerOutput, CompilerOutputError } from 'hardhat/types/solidity';

import type {} from './type-extensions.d.ts';

interface ErrorSourceLocation {
  sourceLocation?: SourceLocation;
}

interface SourceLocation {
  file: string;
  start: number;
  end: number;
}

function parseInteger(n?: string): number | undefined {
  if (n === undefined) {
    return undefined;
  } else if (/^\d+$/.test(n)) {
    return Number(n);
  } else {
    throw new Error(`Expected integer but got '${n}'`)
  }
}

const hardhatIgnoreWarningsPlugin: HardhatPlugin = {
  id: 'hardhat-ignore-warnings',
  npmPackage: 'hardhat-ignore-warnings',
  hookHandlers: {
    config: async () => ({
      default: async () => ({
        async resolveUserConfig(
          userConfig: HardhatUserConfig,
          resolveConfigurationVariable: ConfigurationVariableResolver,
          next: (
            nextUserConfig: HardhatUserConfig,
            nextResolveConfigurationVariable: ConfigurationVariableResolver,
          ) => Promise<HardhatConfig>,
        ): Promise<HardhatConfig> {
          const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
          let warnings = userConfig.warnings ?? {};
          if (typeof warnings !== 'object') {
            warnings = { '*': warnings };
          }
          resolvedConfig.warnings = warnings;
          return resolvedConfig;
        }
      })
    }),

    solidity: async () => {
      const { WarningClassifier } = await import('./index.js');
      return {
        default: async () => ({
          async invokeSolc(
            context: HookContext,
            compiler: RunCompilationJobResult['compiler'],
            solcInput: CompilerInput,
            solcConfig: SolcConfig,
            next: (
              nextContext: HookContext,
              nextCompiler: RunCompilationJobResult['compiler'],
              nextSolcInput: CompilerInput,
              nextSolcConfig: SolcConfig,
            ) => Promise<CompilerOutput>,
          ): Promise<CompilerOutput> {
            const output = await next(context, compiler, solcInput, solcConfig);

            const classifier = new WarningClassifier(context.config.warnings);

            for (const [file, { content }] of Object.entries(solcInput.sources)) {
              classifier.reprocessFile(file, content);
            }

            return {
              ...output,
              errors: output.errors?.flatMap((e: CompilerOutputError & ErrorSourceLocation) => {
                // Make sure not to filter out errors
                if (e.severity !== 'warning' && e.severity !== 'info' || !e.sourceLocation) {
                  return [e];
                }
                const rule = classifier.getWarningRule(parseInteger(e.errorCode), e.sourceLocation);
                if (rule === 'off') {
                  return [];
                } else if (rule === 'error') {
                  return [{ ...e, severity: 'error' }];
                } else {
                  return [e];
                }
              }),
            };
          }
        })
      };
    },
  },
};

export default hardhatIgnoreWarningsPlugin;
