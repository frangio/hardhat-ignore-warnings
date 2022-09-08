import { task } from "hardhat/config";

import {
  TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
} from "hardhat/builtin-tasks/task-names";

import IntervalTree from "node-interval-tree";
import { analyze } from "solidity-comments";

import { errorCodes } from "./error-codes";

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
  rule: string;
}

const ranges: Record<string, IntervalTree<string>> = {};

task(TASK_COMPILE_SOLIDITY_COMPILE_SOLC, async (args: { input: any }, hre, runSuper) => {
  for (const [f, { content }] of Object.entries<{ content: string }>(args.input.sources)) {
    const fileRanges: IgnoreRange[] = [];

    const { comments } = analyze(content);
    const buf = Buffer.from(content, 'utf8');

    for (const c of comments) {
      const t = c.text.replace(/^\/\/\s+/, '');
      const m = t.match(/^solc-ignore-next-line (.*)/);
      if (m) {
        const rules = m[1]!.trim().split(/\s+/);
        const start = c.end + 1;
        const nextNewline = buf.indexOf('\n', start);
        const end = nextNewline >= 0 ? nextNewline : buf.length;
        for (const ruleName of rules) {
          const rule = errorCodes[ruleName] ?? ruleName;
          if (!/^\d+$/.test(rule)) {
            throw new Error(`Invalid error code for solc-ignore (${rule})`)
          }
          fileRanges.push({ start, end, rule });
        }
      }
    }

    if (fileRanges.length === 0) {
      delete ranges[f];
    } else {
      const tree = ranges[f] = new IntervalTree();
      for (const { start, end, rule } of fileRanges) {
        tree.insert(start, end, rule);
      }
    }
  }

  return runSuper(args);
});

task(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, async ({ output, ...params }: { output: any }, hre, runSuper) => {
  output = {
    ...output,
    errors: output.errors?.filter((e: SolcError) => {
      const { file, start } = e.sourceLocation;
      return e.severity !== 'warning' || !ranges[file]?.search(start, start).includes(e.errorCode);
    }),
  };
  return runSuper({ output, ...params });
});
