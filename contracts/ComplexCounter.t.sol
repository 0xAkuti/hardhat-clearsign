// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { ComplexCounter } from "./ComplexCounter.sol";
import { Test } from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract ComplexCounterTest is Test {
    ComplexCounter counter;
    address owner;
    address user1;
    address user2;
                           
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        counter = new ComplexCounter();
    }
    
    function test_InitialValue() public view {
        require(counter.count() == 0, "Initial value should be 0");
        require(counter.owner() == owner, "Owner should be the deployer");
        require(!counter.paused(), "Contract should not be paused initially");
    }
    
    function test_BasicIncrement() public {
        counter.inc();
        require(counter.count() == 1, "Count should be 1 after inc()");
        
        counter.incBy(5);
        require(counter.count() == 6, "Count should be 6 after incBy(5)");
    }
    
    function test_BasicDecrement() public {
        // First increment to have something to decrement
        counter.incBy(10);
        
        counter.dec();
        require(counter.count() == 9, "Count should be 9 after dec()");
        
        counter.decBy(3);
        require(counter.count() == 6, "Count should be 6 after decBy(3)");
    }
    
    function testFuzz_Inc(uint8 x) public {
        vm.assume(x <= 100); // Keep within reasonable bounds
        for (uint8 i = 0; i < x; i++) {
            counter.inc();
        }
        require(counter.count() == x, "Value after calling inc x times should be x");
    }

    function test_IncByZero() public {
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.InvalidAmount.selector, 0));
        counter.incBy(0);
    }
    
    function test_DecByZero() public {
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.InvalidAmount.selector, 0));
        counter.decBy(0);
    }
    
    function test_Underflow() public {
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.CounterUnderflow.selector, 0, 1, 0));
        counter.dec();
    }
    
    function test_Overflow() public {
        // Set a custom limit
        counter.setCustomLimit(5);
        counter.incBy(5);
        
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.CounterOverflow.selector, 5, 1, 5));
        counter.inc();
    }
    
    function test_PauseUnpause() public {
        counter.setPaused(true);
        require(counter.paused(), "Contract should be paused");
        
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.ContractPaused.selector));
        counter.inc();
        
        counter.setPaused(false);
        require(!counter.paused(), "Contract should be unpaused");
        
        counter.inc(); // Should work now
        require(counter.count() == 1, "Count should be 1 after unpausing");
    }
    
    function test_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.NotOwner.selector, user1, owner));
        counter.reset();
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.NotOwner.selector, user1, owner));
        counter.setPaused(true);
    }
    
    function test_Reset() public {
        counter.incBy(42);
        require(counter.count() == 42, "Count should be 42 before reset");
        
        counter.reset();
        require(counter.count() == 0, "Count should be 0 after reset");
    }
    
    function test_CustomLimit() public {
        counter.setCustomLimit(100);
        require(counter.getCurrentLimit() == 100, "Custom limit should be 100");
        
        counter.setCustomLimit(0);
        require(counter.getCurrentLimit() == counter.MAX_COUNT(), "Should use MAX_COUNT when custom limit is 0");
    }
    
    function test_UserInteractions() public {
        vm.prank(user1);
        counter.inc();
        
        vm.prank(user2);
        counter.incBy(5);
        
        require(counter.getUserInteractions(user1) == 1, "User1 should have 1 interaction");
        require(counter.getUserInteractions(user2) == 1, "User2 should have 1 interaction");
    }
    
    function test_LastOperation() public {
        counter.incBy(42);
        
        (string memory operationType, uint256 amount, address performer, uint256 timestamp) = counter.getLastOperation();
        require(keccak256(abi.encodePacked(operationType)) == keccak256(abi.encodePacked("increment")), "Last operation should be increment");
        require(amount == 42, "Amount should be 42");
        require(performer == owner, "Performer should be owner");
        require(timestamp > 0, "Timestamp should be set");
    }
    
    function test_TransferOwnership() public {
        counter.transferOwnership(user1);
        require(counter.owner() == user1, "Owner should be user1");
        
        // Original owner should no longer be able to call owner functions
        vm.expectRevert(abi.encodeWithSelector(ComplexCounter.NotOwner.selector, owner, user1));
        counter.reset();
        
        // New owner should be able to call owner functions
        vm.prank(user1);
        counter.reset();
    }
}