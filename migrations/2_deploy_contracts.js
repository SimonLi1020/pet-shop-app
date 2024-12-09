var Adoption = artifacts.require("Adoption");
const SendMeEther = artifacts.require("SendMeEther");
const LeaveComment = artifacts.require("LeaveComment");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(SendMeEther);
  const LeaveComment = artifacts.require("LeaveComment");
};
