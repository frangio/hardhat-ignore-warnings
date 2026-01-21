import { minimatch } from 'minimatch';
import { IntervalTree } from 'node-interval-tree';
import { analyze } from 'solidity-comments';
import { getErrorCode } from './error-codes.js';
import type { WarningConfig, FileRules, WarningRule } from './type-extensions.d.ts';

class RangeTree {
  tree: IntervalTree<{ low: number, high: number, code: number }> = new IntervalTree();

  insert(low: number, high: number, code: number): boolean {
    return this.tree.insert({ low, high, code })
  }

  search(low: number, high: number): number[] {
    return this.tree.search(low, high).map(r => r.code);
  }
}

const defaultRule: NormalizedWarningRule = 'warn';

type NormalizedWarningRule = WarningRule & string;

type NormalizedFileRules = {
  [e in number]?: NormalizedWarningRule;
} & {
  default?: NormalizedWarningRule;
};

type SortedFileRules = {
  pattern: string;
  rules: NormalizedFileRules;
}[];

interface SourceLocation {
  file: string;
  start: number;
  end: number;
}

interface IgnoreRange {
  start: number;
  end: number;
  code: number;
}

export class WarningClassifier {
  private rules: SortedFileRules;
  private ignoreRanges: Record<string, RangeTree> = {};

  constructor(config: WarningConfig) {
    this.rules = sortFileRules(config);
  }

  getWarningRule(errorCode: number | undefined, sourceLocation: SourceLocation): NormalizedWarningRule {
    const { file, start } = sourceLocation;
    const ignored = errorCode !== undefined && this.ignoreRanges[file]?.search(start, start).includes(errorCode);
    if (ignored) {
      return 'off';
    }
    // Strip 'project/' prefix that Hardhat v3 adds to paths
    const normalizedFile = file.replace(/^project\//, '');
    for (const rule of this.rules) {
      if (minimatch(normalizedFile, rule.pattern, { matchBase: true })) {
        const r = (errorCode !== undefined && rule.rules[errorCode]) || rule.rules.default;
        if (r) return r;
      }
    }
    return defaultRule;
  }

  reprocessFile(file: string, contents: string) {
    const ranges: IgnoreRange[] = [];

    const { comments } = analyze(contents);
    const buf = Buffer.from(contents, 'utf8');

    for (const c of comments) {
      const t = c.text.replace(/^\/\/\s+/, '');
      const m = t.match(/^solc-ignore-next-line (.*)/);
      if (m) {
        const ids = m[1]!.trim().split(/\s+/);
        const lineEnd = buf.toString('utf8', c.end, c.end + 2);
        const start = c.end + (lineEnd === '\r\n' ? 2 : 1);
        const nextNewline = buf.indexOf('\n', start);
        const end = nextNewline >= 0 ? nextNewline : buf.length;
        for (const id of ids) {
          const code = getErrorCode(id);
          ranges.push({ start, end, code });
        }
      }
    }

    if (ranges.length === 0) {
      delete this.ignoreRanges[file];
    } else {
      const tree = this.ignoreRanges[file] = new RangeTree();
      for (const { start, end, code } of ranges) {
        tree.insert(start, end, code);
      }
    }
  }
}

const normalizeWarningRule =
  (r?: WarningRule, def: NormalizedWarningRule = 'warn') => r === true ? def : r === false ? 'off' : r;

function normalizeFileRules(rules: WarningRule | FileRules) {
  if (typeof rules === 'object') {
    const def = normalizeWarningRule(rules.default);
    const res: NormalizedFileRules = {};
    for (const [id, r] of Object.entries(rules)) {
      const code = id === 'default' ? id : getErrorCode(id);
      res[code] = normalizeWarningRule(r, def);
    }
    return res;
  } else {
    return {
      default: normalizeWarningRule(rules),
    };
  }
}

function sortFileRules(config: WarningConfig): SortedFileRules {
  const rules = Object.entries(config).map(([pattern, rules]) => ({ pattern, rules: normalizeFileRules(rules) }));
  rules.sort((a, b) => (
    minimatch(a.pattern, b.pattern, { matchBase: true })
    ? -1
    : minimatch(b.pattern, a.pattern, { matchBase: true })
    ? +1
    :  0
  ));
  return rules;
}
