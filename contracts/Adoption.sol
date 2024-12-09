pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;

    // Adopting a pet
    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);

        adopters[petId] = msg.sender;

        return petId;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

}


contract SendMeEther {
    
    string public functionCalled;
    
    //constructor of the contract SendMeEther
    constructor() public {
	functionCalled = "constructor";
    }

    //function allowing an ether payment to the contract address
    function receiveEther() external payable {
	functionCalled = "receiveEther";
    }

    //fallback function allowing an ether payment to the contract address 
    function() external payable {
	functionCalled = "fallback";
    }

} 


contract LeaveComment {
    
    string public functionCalled;
    
    //constructor of the contract LeaveComment
    constructor() public {
	functionCalled = "constructor";
    }

    //function allowing an ether payment to the contract address
    function leaveComment() external payable {
	functionCalled = "leaveComment";
    }

    //fallback function allowing an ether payment to the contract address 
    function() external payable {
	functionCalled = "fallback";
    }

} 