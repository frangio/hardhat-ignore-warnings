import { lazyObject } from 'hardhat/plugins';
import minimatch from 'minimatch';
import IntervalTree from 'node-interval-tree';
import { analyze } from 'solidity-comments';
import { getErrorCode } from './error-codes';
import { Config, FileRules, WarningRule } from './type-extensions';

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
  code: number;
}

export class WarningClassifier {
  private rules: SortedFileRules;
  private ignoreRanges: Record<string, IntervalTree<number>> = {};

  constructor(private config: Config) {
    this.rules = lazyObject(() => sortFileRules(config));
  }

  getWarningRule(errorCode: number, sourceLocation: SourceLocation): NormalizedWarningRule {
    const { file, start } = sourceLocation;
    const ignored = this.ignoreRanges[file]?.search(start, start).includes(errorCode);
    if (ignored) {
      return 'off';
    }
    for (const rule of this.rules) {
      if (minimatch(file, rule.pattern, { matchBase: true })) {
        const r = rule.rules[errorCode] ?? rule.rules.default;
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
        const start = c.end + 1;
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
      const tree = this.ignoreRanges[file] = new IntervalTree();
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

function sortFileRules(config: Config): SortedFileRules {
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
