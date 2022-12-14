# hardhat-ignore-warnings

This plugin adds ways to ignore Solidity warnings, and a way to turn remaining warnings into errors.

Actual compilation errors will not be silenced by the plugin.

## Quickstart

You can turn off all Solidity warnings by installing the plugin and configuring it as follows.

```diff
 // hardhat.config.js

+require('hardhat-ignore-warnings');

 module.exports = {
+  warnings: 'off',
 };
```

## Customization

You can be more selective about the warnings that should be ignored and those that shouldn't.

### Inline Comments

If you want to ignore a warning in a particular line without setting rules for the entire project, you can use inline comments.

```solidity
// solc-ignore-next-line unused-param
function bar(uint x) public {
```

### Configuration

In order to ignore warnings or promote to errors across the entire project or in entire files, the plugin accepts more detailed configuration.

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

### Warning IDs

Both inline comments and detailed configuration use the following set of names to identify warnings.

- `unreachable`: "Unreachable code."
- `unused-param`: "Unused function parameter. Remove or comment out the variable name to silence this warning."
- `unused-var`: "Unused local variable."
- `unused-call-retval`: "Return value of low-level calls not used."
- `code-size`: "Contract code size is _N_ bytes and exceeds 24576 bytes (a limit introduced in Spurious Dragon). This contract may not be deployable on Mainnet. Consider enabling the optimizer (with a low "runs" value!), turning off revert strings, or using libraries."
- `shadowing`: "This declaration shadows an existing declaration."
- `shadowing-builtin`: "This declaration shadows a builtin symbol."
- `shadowing-opcode`: "Variable is shadowed in inline assembly by an instruction of the same name."
- `func-mutability`: "Function state mutability can be restricted to pure/view."
- `license`: "SPDX license identifier not provided in source file. Before publishing, consider adding a comment containing "SPDX-License-Identifier: <SPDX-License>" to each source file. Use "SPDX-License-Identifier: UNLICENSED" for non-open-source code. Please see https://spdx.org for more information."
- `pragma-solidity`: "Source file does not specify required compiler version!"
- `missing-receive`: "This contract has a payable fallback function, but no receive ether function. Consider adding a receive ether function." -- To ignore this warning with a comment, it must be placed before the contract definition.
