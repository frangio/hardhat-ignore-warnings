# hardhat-ignore-warnings

This plugin adds ways to ignore Solidity warnings.

Actual compilation errors will not be silenced by the plugin.

### Inline comments

```solidity
// solc-ignore-next-line unused-param
function bar(uint x) public {
```

For warning names refer to [`error-codes.ts`](./src/error-codes.ts).

### Whole files

Include in your Hardhat configuration.

```javascript
warnings: {
  ignoreFiles: ['contracts/LotsOfWarnings.sol'],
}
```
