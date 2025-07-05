// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ComplexCounter
 * @author ERC7730 Example
 * @notice A comprehensive counter contract with advanced features
 * @dev This contract demonstrates various Solidity features for ERC7730 JSON generation
 * @custom:version 1.0.0
 */
contract ComplexCounter {
    /// @dev Maximum value the counter can reach
    uint256 public constant MAX_COUNT = 10000;
    
    /// @dev Minimum value the counter can reach
    uint256 public constant MIN_COUNT = 0;
    
    /// @notice The current counter value
    /// @dev This is the main state variable that tracks the counter
    uint256 public count;
    
    /// @notice The contract owner who has special privileges
    /// @dev Only the owner can reset the counter and set limits
    address public owner;
    
    /// @notice Whether the counter is currently paused
    /// @dev When paused, increment and decrement operations are disabled
    bool public paused;
    
    /// @notice Custom limit set by the owner (if any)
    /// @dev If set to 0, uses MAX_COUNT as the limit
    uint256 public customLimit;
    
    /// @notice Tracks the number of times each address has interacted with the contract
    /// @dev Mapping from address to interaction count
    mapping(address => uint256) public userInteractions;
    
    /// @notice Stores the last operation performed
    /// @dev Used to track the history of operations
    struct LastOperation {
        string operationType;
        uint256 amount;
        address performer;
        uint256 timestamp;
    }
    
    /// @notice The last operation performed on the counter
    LastOperation public lastOperation;
    
    /**
     * @notice Emitted when the counter is incremented
     * @param by The amount the counter was incremented by
     * @param newValue The new counter value after increment
     * @param performer The address that performed the increment
     */
    event Increment(uint256 indexed by, uint256 newValue, address indexed performer);
    
    /**
     * @notice Emitted when the counter is decremented
     * @param by The amount the counter was decremented by
     * @param newValue The new counter value after decrement
     * @param performer The address that performed the decrement
     */
    event Decrement(uint256 indexed by, uint256 newValue, address indexed performer);
    
    /**
     * @notice Emitted when the counter is reset
     * @param resetBy The address that reset the counter
     * @param previousValue The value before reset
     */
    event Reset(address indexed resetBy, uint256 previousValue);
    
    /**
     * @notice Emitted when the contract is paused or unpaused
     * @param isPaused Whether the contract is now paused
     * @param changedBy The address that changed the pause state
     */
    event PauseStateChanged(bool isPaused, address indexed changedBy);
    
    /**
     * @notice Emitted when the custom limit is updated
     * @param newLimit The new custom limit value
     * @param setBy The address that set the new limit
     */
    event CustomLimitSet(uint256 newLimit, address indexed setBy);
    
    /**
     * @notice Emitted when ownership is transferred
     * @param previousOwner The previous owner address
     * @param newOwner The new owner address
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    /// @dev Thrown when trying to increment beyond the maximum allowed value
    error CounterOverflow(uint256 currentValue, uint256 attemptedIncrease, uint256 maxAllowed);
    
    /// @dev Thrown when trying to decrement below the minimum allowed value
    error CounterUnderflow(uint256 currentValue, uint256 attemptedDecrease, uint256 minAllowed);
    
    /// @dev Thrown when the contract is paused
    error ContractPaused();
    
    /// @dev Thrown when caller is not the owner
    error NotOwner(address caller, address owner);
    
    /// @dev Thrown when trying to increment or decrement by zero
    error InvalidAmount(uint256 amount);
    
    /**
     * @notice Modifier to check if the caller is the owner
     * @dev Reverts with NotOwner error if the caller is not the owner
     */
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(msg.sender, owner);
        }
        _;
    }
    
    /**
     * @notice Modifier to check if the contract is not paused
     * @dev Reverts with ContractPaused error if the contract is paused
     */
    modifier whenNotPaused() {
        if (paused) {
            revert ContractPaused();
        }
        _;
    }
    
    /**
     * @notice Constructor to initialize the counter contract
     * @dev Sets the deployer as the owner and initializes the counter to 0
     */
    constructor() {
        owner = msg.sender;
        count = 0;
        paused = false;
        customLimit = 0; // 0 means use MAX_COUNT
        
        lastOperation = LastOperation({
            operationType: "deploy",
            amount: 0,
            performer: msg.sender,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @notice Increments the counter by 1
     * @dev Increases the counter by 1 and emits an Increment event
     * @dev Reverts if the contract is paused or if increment would exceed limits
     */
    function inc() public whenNotPaused {
        _increment(1);
    }
    
    /**
     * @notice Increments the counter by a specific amount
     * @param by The amount to increment the counter by
     * @dev Increases the counter by the specified amount and emits an Increment event
     * @dev Reverts if the contract is paused, amount is 0, or increment would exceed limits
     */
    function incBy(uint256 by) public whenNotPaused {
        if (by == 0) {
            revert InvalidAmount(by);
        }
        _increment(by);
    }
    
    /**
     * @notice Decrements the counter by 1
     * @dev Decreases the counter by 1 and emits a Decrement event
     * @dev Reverts if the contract is paused or if decrement would go below minimum
     */
    function dec() public whenNotPaused {
        _decrement(1);
    }
    
    /**
     * @notice Decrements the counter by a specific amount
     * @param by The amount to decrement the counter by
     * @dev Decreases the counter by the specified amount and emits a Decrement event
     * @dev Reverts if the contract is paused, amount is 0, or decrement would go below minimum
     */
    function decBy(uint256 by) public whenNotPaused {
        if (by == 0) {
            revert InvalidAmount(by);
        }
        _decrement(by);
    }
    
    /**
     * @notice Resets the counter to 0 (only owner)
     * @dev Sets the counter back to 0 and emits a Reset event
     * @dev Only the contract owner can call this function
     */
    function reset() public onlyOwner {
        uint256 previousValue = count;
        count = 0;
        
        lastOperation = LastOperation({
            operationType: "reset",
            amount: previousValue,
            performer: msg.sender,
            timestamp: block.timestamp
        });
        
        emit Reset(msg.sender, previousValue);
    }
    
    /**
     * @notice Pauses or unpauses the contract (only owner)
     * @param _paused Whether to pause or unpause the contract
     * @dev Toggles the pause state and emits a PauseStateChanged event
     * @dev Only the contract owner can call this function
     */
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit PauseStateChanged(_paused, msg.sender);
    }
    
    /**
     * @notice Sets a custom limit for the counter (only owner)
     * @param _customLimit The new custom limit (0 to use MAX_COUNT)
     * @dev Sets a custom upper limit for the counter
     * @dev Only the contract owner can call this function
     */
    function setCustomLimit(uint256 _customLimit) public onlyOwner {
        customLimit = _customLimit;
        emit CustomLimitSet(_customLimit, msg.sender);
    }
    
    /**
     * @notice Transfers ownership of the contract (only owner)
     * @param newOwner The address of the new owner
     * @dev Transfers ownership to a new address and emits OwnershipTransferred event
     * @dev Only the current owner can call this function
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    /**
     * @notice Gets the current effective limit for the counter
     * @return The current limit (either customLimit or MAX_COUNT)
     * @dev Returns the custom limit if set, otherwise returns MAX_COUNT
     */
    function getCurrentLimit() public view returns (uint256) {
        return customLimit == 0 ? MAX_COUNT : customLimit;
    }
    
    /**
     * @notice Gets the number of interactions for a specific user
     * @param user The address to check interactions for
     * @return The number of times the user has interacted with the contract
     */
    function getUserInteractions(address user) public view returns (uint256) {
        return userInteractions[user];
    }
    
    /**
     * @notice Gets the last operation details
     * @return operationType The type of the last operation
     * @return amount The amount involved in the last operation
     * @return performer The address that performed the last operation
     * @return timestamp The timestamp of the last operation
     */
    function getLastOperation() public view returns (string memory operationType, uint256 amount, address performer, uint256 timestamp) {
        return (lastOperation.operationType, lastOperation.amount, lastOperation.performer, lastOperation.timestamp);
    }
    
    /**
     * @notice Internal function to handle incrementing
     * @param by The amount to increment by
     * @dev Handles the increment logic with bounds checking and event emission
     */
    function _increment(uint256 by) internal {
        uint256 currentLimit = getCurrentLimit();
        
        if (count + by > currentLimit) {
            revert CounterOverflow(count, by, currentLimit);
        }
        
        count += by;
        userInteractions[msg.sender]++;
        
        lastOperation = LastOperation({
            operationType: "increment",
            amount: by,
            performer: msg.sender,
            timestamp: block.timestamp
        });
        
        emit Increment(by, count, msg.sender);
    }
    
    /**
     * @notice Internal function to handle decrementing
     * @param by The amount to decrement by
     * @dev Handles the decrement logic with bounds checking and event emission
     */
    function _decrement(uint256 by) internal {
        if (count < by) {
            revert CounterUnderflow(count, by, MIN_COUNT);
        }
        
        count -= by;
        userInteractions[msg.sender]++;
        
        lastOperation = LastOperation({
            operationType: "decrement",
            amount: by,
            performer: msg.sender,
            timestamp: block.timestamp
        });
        
        emit Decrement(by, count, msg.sender);
    }
}
