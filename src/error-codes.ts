export const errorCodes: Record<string, string> = {
  'unreachable': '5740',
  'unused-param': '5667',
  'unused-var': '2072',
  'code-size': '5574',
  'shadowing': '2519',
  'func-mutability': '2018',
  'license': '1878',
  'pragma-solidity': '3420',
};

export function getErrorCode(id: string): string {
  const code = errorCodes[id] ?? id;
  if (!/^\d+$/.test(code)) {
    throw new Error(`Invalid error code for solc-ignore (${code})`)
  }
  return code;
}
