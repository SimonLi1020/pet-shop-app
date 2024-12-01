pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;
    uint public adoptionFee = 0.01 ether; // Set the adoption fee

    // Adopting a pet
    function adopt(uint petId) public payable returns (uint) {
        require(petId >= 0 && petId <= 15, "Invalid pet ID"); // Ensure valid pet ID
        require(msg.value >= adoptionFee, "Insufficient Ether sent"); // Ensure payment meets or exceeds the fee
        require(adopters[petId] == address(0), "Pet already adopted"); // Ensure pet is not already adopted

        adopters[petId] = msg.sender;

        return petId;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    // Withdraw funds from the contract (for contract owner)
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw funds");
        address(uint160(owner)).transfer(address(this).balance); // Explicitly cast to payable
    }
}
