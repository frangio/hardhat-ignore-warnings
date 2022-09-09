# hardhat-ignore-warnings

This plugin adds ways to ignore Solidity warnings, and a way to turn remaining warnings into errors.

Actual compilation errors will not be silenced by the plugin.

### Inline comments

```solidity
// solc-ignore-next-line unused-param
function bar(uint x) public {
```

For warning names refer to [`error-codes.ts`](./src/error-codes.ts).

### Whole files

Include in your Hardhat configuration:

```javascript
warnings: {
  ignore: {
    'contracts/test/**/*': ['code-size'],
    // alternatively
    'contracts/test/**/*': { 'code-size': true },

    'contracts/LotsOfWarnings.sol': true,
  },
  // alternatively
  ignoreFiles: ['contracts/LotsOfWarnings.sol'],
}
```

### Warnings as errors

In order to turn the remaining warnings into errors, include in your Hardhat configuration:

```
warnings: {
  errors: true,
  // or list specific warnings
  errors: ['pragma-solidity'];
}
```
