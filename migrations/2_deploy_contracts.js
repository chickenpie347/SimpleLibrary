var SimpleLibrary = artifacts.require("./SimpleLibrary.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleLibrary);
};
