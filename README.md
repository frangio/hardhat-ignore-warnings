# hardhat-ignore-warnings

This plugin adds ways to ignore Solidity warnings, and a way to turn remaining warnings into errors.

Actual compilation errors will not be silenced by the plugin.

For warning ids refer to [`error-codes.ts`](./src/error-codes.ts).

### Inline comments

```solidity
// solc-ignore-next-line unused-param
function bar(uint x) public {
```

### Configuration

In order to ignore warnings or promote to errors across the entire project or in entire files, the plugin can be configured in your Hardhat config file.

The config is an object that maps glob patterns to warning rules. These rules will be applied to files matched by the glob pattern. More specific patterns override the rules of less specific ones.

A warning can be set to `'off'`, `'error'` (promote to error), or `'warn'` (the default), as well as `false` (meaning `'off'`) and `true` (meaning the local default, or `'warn'` if none is set).

The special id `default` can be used to apply a setting to all warnings at once.

```javascript
warnings: {
  // make every warning an error:
  '*': 'error',

  // equivalently:
  '*': {
    default: 'error',
  },

  // add an exception for a particular warning id:
  '*': {
    'code-size': 'warn',
    default: 'error',
  },

  // turn off all warnings under a directory:
  'contracts/test/**/*': {
    default: 'off',
  },
}
```
