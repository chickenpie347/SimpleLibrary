///BigNumber for more accurate numbers
let BN = web3.utils.BN
///Common error catches
let catchRevert = require("./exceptionsHelpers.js").catchRevert
///Contract
var SimpleLibrary = artifacts.require("SimpleLibrary")

contract('SimpleLibrary', function(accounts) {
  /*Owner Account*/
  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]
  const deposit = web3.utils.toBN(2)
  /*Dummy Data for books*/
  const title = "Test"
  const author = "Test Author"
  const img = "https://test"
  const rental = 1

  beforeEach(async () => {
    instance = await SimpleLibrary.new()
  })
  /*Tests Begin*/
  it("owner can pause contract", async () => {
    await instance.pause({from: owner})

    const paused = await instance.paused({from: owner})
    assert.equal(paused, true, 'owner failed to pause')
  });

  it("owner can resume contract", async () => {
    await instance.pause({from: owner})
    await instance.resume({from: owner})

    const resumed = await instance.paused({from: owner})
    assert.equal(resumed, false, 'owner failed to resume')
  });

  it("non-owner can not pause contract", async () => {
    await catchRevert(instance.pause({from: alice}))
  });

  it("non-owner can not resume paused contract", async () => {
    await instance.pause({from: owner})
    await catchRevert(instance.resume({from: alice}))
  });

  it("lenders can add books and event is logged", async() =>{
    let eventEmitted = false;
    const tx = await instance.addBook(title,author,img,rental, {from: alice})
    if (tx.logs[0].event == "LogBookAdded") {
            eventEmitted = true
        }

        assert.equal(eventEmitted, true, 'adding a book should emit Book Add event')
  })

  it("borrowers can borrow books and event is logged", async() =>{
    let eventEmitted = false;
    await instance.addBook(title,author,img,rental, {from: owner})
    const tx = await instance.borrowBook(0, {from: alice, value:2})
    if (tx.logs[0].event == "LogBookBorrowed") {
            eventEmitted = true
        }

        assert.equal(eventEmitted, true, 'borrowing a book should emit Borrow Book event')
  })

  it("lenders can mark book returned and event is logged", async() =>{
    let eventEmitted = false;
    await instance.addBook(title,author,img,rental, {from: owner})
    await instance.borrowBook(0, {from: alice, value:2})
    const tx = await instance.returnBook(0, {from: owner,value:3})
    if (tx.logs[0].event == "LogBookReturned") {
            eventEmitted = true
        }

        assert.equal(eventEmitted, true, 'returning a book should emit Book Return event')
  })

  it("should deduct book rental", async() =>{
    await instance.addBook(title,author,img,rental, {from: owner})
    var aliceBalanceBefore = await web3.eth.getBalance(alice)
    await instance.borrowBook(0, {from: alice, value:2})
    var aliceBalanceAfter = await web3.eth.getBalance(alice)
     assert.isBelow(Number(aliceBalanceAfter), Number(new BN(aliceBalanceBefore).sub(new BN(rental))), "alice's balance should be reduced by more than the price of the book (including gas costs)")
  })

  it("returning book should reimburse rental", async() =>{
    await instance.addBook(title,author,img,rental, {from: owner})
    await instance.borrowBook(0, {from: alice, value:2})
    var aliceBalanceBefore = await web3.eth.getBalance(alice)
    await instance.returnBook(0, {from: owner, value:2})
    var aliceBalanceAfter = await web3.eth.getBalance(alice)
    assert.equal(Number(new BN(aliceBalanceBefore).add(new BN(rental))), Number(new BN(aliceBalanceAfter)), "alice's balance should be increased by the price of the book")
  })

})
