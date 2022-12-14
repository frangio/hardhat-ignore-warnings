export const errorCodes = {
  'unreachable': 5740,
  'unused-param': 5667,
  'unused-var': 2072,
  'unused-call-retval': 9302,
  'code-size': 5574,
  'shadowing': 2519,
  'shadowing-builtin': 2319,
  'shadowing-opcode': 8261,
  'func-mutability': 2018,
  'license': 1878,
  'pragma-solidity': 3420,
  'missing-receive': 3628,
} as const;

export type WarningId = number | keyof typeof errorCodes;

export function getErrorCode(id: string): number {
  let code = (errorCodes as Record<string, number>)[id] ?? id;
  if (typeof code === 'string') {
    if (/^\d+$/.test(code)) {
      code = Number(code);
    } else {
      throw new Error(`Invalid error code for solc-ignore (${code})`)
    }
  }
  return code;
}
