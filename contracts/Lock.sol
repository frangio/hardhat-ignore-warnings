// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Lock {
    event E();

    function foo() public {
        revert();
        // solc-ignore-next-line unreachable
        emit E();
    }

    // solc-ignore-next-line unused-param
    function bar(uint x) public {
        emit E();
    }
}
