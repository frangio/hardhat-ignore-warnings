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

    function a1() external {
        // solc-ignore-next-line unused-call-retval
        msg.sender.call("");
    }
}

// solc-ignore-next-line missing-receive
contract Payable {
    function f() external {}

    fallback() external payable {}
}
