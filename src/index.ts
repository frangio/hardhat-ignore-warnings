import { extendConfig, task } from "hardhat/config";

import "./type-extensions";

import {
  TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
} from "hardhat/builtin-tasks/task-names";

import type IntervalTree from "node-interval-tree";
import type { Config } from "./type-extensions";

interface SolcError {
  severity: string;
  errorCode: string;
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
}

interface IgnoreRange {
  start: number;
  end: number;
  code: string;
}

const ranges: Record<string, IntervalTree<string>> = {};

extendConfig((config, userConfig) => {
  const ignore: Config['ignore'] = {};
  for (const [k, v] of Object.entries(userConfig.warnings?.ignore ?? {})) {
    if (Array.isArray(v) || v === true) {
      ignore[k] = v;
    } else if (typeof v === 'object') {
      ignore[k] = Object.keys(v).filter(i => v[i]);
    }
  }
  for (const k of userConfig.warnings?.ignoreFiles ?? []) {
    ignore[k] = true;
  }
  const errors = userConfig.warnings?.errors || [];
  config.warnings = { ignore, errors };
});

task(TASK_COMPILE_SOLIDITY_COMPILE_SOLC, async (args: { input: any }, hre, runSuper) => {
  const { default: IntervalTree } = await import("node-interval-tree");
  const { analyze } = await import("solidity-comments");
  const { getErrorCode } = await import("./error-codes");

  for (const [f, { content }] of Object.entries<{ content: string }>(args.input.sources)) {
    const fileRanges: IgnoreRange[] = [];

    const { comments } = analyze(content);
    const buf = Buffer.from(content, 'utf8');

    for (const c of comments) {
      const t = c.text.replace(/^\/\/\s+/, '');
      const m = t.match(/^solc-ignore-next-line (.*)/);
      if (m) {
        const ids = m[1]!.trim().split(/\s+/);
        const start = c.end + 1;
        const nextNewline = buf.indexOf('\n', start);
        const end = nextNewline >= 0 ? nextNewline : buf.length;
        for (const id of ids) {
          const code = getErrorCode(id);
          fileRanges.push({ start, end, code });
        }
      }
    }

    if (fileRanges.length === 0) {
      delete ranges[f];
    } else {
      const tree = ranges[f] = new IntervalTree();
      for (const { start, end, code } of fileRanges) {
        tree.insert(start, end, code);
      }
    }
  }

  return runSuper(args);
});

task(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, async ({ output, ...params }: { output: any }, hre, runSuper) => {
  const { default: minimatch } = await import('minimatch');
  const { getErrorCode } = await import("./error-codes");

  const config = hre.config.warnings;

  output = {
    ...output,
    errors: output.errors?.flatMap((e: SolcError) => {
      // Make sure not to filter out errors
      if (e.severity !== 'warning' || !e.sourceLocation) {
        return [e];
      }
      const { file, start } = e.sourceLocation;
      const fileRules = Object.entries(config.ignore).filter(([p]) => minimatch(file, p)).map((([_, r]) => r));
      const ignore = (
        fileRules.some(i =>
          i === true ||
          i.find(id => getErrorCode(id) === e.errorCode)
        ) ||
        ranges[file]?.search(start, start).includes(e.errorCode)
      );
      if (ignore) {
        return [];
      } else {
        const makeError =
          config.errors === true ||
          config.errors.some(id => getErrorCode(id) === e.errorCode);
        if (makeError) {
          return [{ ...e, severity: 'error' }];
        } else {
          return [e];
        }
      }
    }),
  };
  return runSuper({ output, ...params });
});
