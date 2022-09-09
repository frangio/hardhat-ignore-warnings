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
  sourceLocation: {
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
  config.warnings = { ignore };
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

  const { ignore } = hre.config.warnings;

  output = {
    ...output,
    errors: output.errors?.filter((e: SolcError) => {
      const { file, start } = e.sourceLocation;
      if (e.severity !== 'warning') {
        // Make sure not to filter out errors
        return true;
      } else {
        const rules = Object.entries(ignore).filter(([p]) => minimatch(file, p));
        return !(
          rules.some(([_, i]) =>
            i === true ||
            i.find(id => getErrorCode(id) === e.errorCode)
          ) ||
          ranges[file]?.search(start, start).includes(e.errorCode)
        );
      }
    }),
  };
  return runSuper({ output, ...params });
});
