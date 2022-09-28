import { extendConfig, extendEnvironment, task } from 'hardhat/config';

import './type-extensions';

import {
  TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
} from 'hardhat/builtin-tasks/task-names';

import type { Config } from './type-extensions';
import type { WarningClassifier } from '.';

interface SolcError {
  severity: string;
  errorCode: string;
  sourceLocation?: SourceLocation;
}

interface SourceLocation {
  file: string;
  start: number;
  end: number;
}

interface IgnoreRange {
  start: number;
  end: number;
  code: string;
}

let classifier: WarningClassifier;

extendConfig((config, userConfig) => {
  let warnings = userConfig.warnings ?? {};
  if (typeof warnings !== 'object') {
    warnings = { '*': warnings };
  }
  config.warnings = warnings;
});

task(TASK_COMPILE_SOLIDITY_COMPILE_SOLC, async (args: { input: any }, hre, runSuper) => {
  const { WarningClassifier } = await import('.');
  classifier ??= new WarningClassifier(hre.config.warnings);

  for (const [file, { content }] of Object.entries<{ content: string }>(args.input.sources)) {
    classifier.reprocessFile(file, content);
  }

  return runSuper(args);
});

task(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, async ({ output, ...params }: { output: any }, hre, runSuper) => {
  const { WarningClassifier } = await import('.');
  classifier ??= new WarningClassifier(hre.config.warnings);

  output = {
    ...output,
    errors: output.errors?.flatMap((e: SolcError) => {
      // Make sure not to filter out errors
      if (e.severity !== 'warning' || !e.sourceLocation) {
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

  return runSuper({ output, ...params });
});

function parseInteger(n: string): number {
  if (/^\d+$/.test(n)) {
    return Number(n);
  } else {
    throw new Error(`Expected integer but got '${n}'`)
  }
}
