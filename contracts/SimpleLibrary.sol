// SPDX-License-Identifier: MIT

/// @title Simple Library
/// @author Shaikh Farhan
/// A simple implementation of a zero-fee (gas excl.) P2P book lending/borrowing marketplace.

pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Pausable.sol";

contract SimpleLibrary is Pausable {

  /* Contract Owner */
  address owner;

  /* Variable for tracking total number of books in catalog */
  uint public bookId;

  /* Books Mapping
  */
  mapping (uint => Book) public books;

  /* Book states:
  Available = Ready to Borrow
  Borrowed = With a Borrower
  */
  enum State {
    Available,
    Borrowed
  }


  /* Struct for books
  title, author plain strings
  img to be used for external image URLs to present in UI
  rental is the "deposit" to be paid to borrow the book, this is reimbursed when the book is returned
  */
  struct Book {
    string title;
    string author;
    string img;
    uint bookid;
    uint rental;
    State state;
    address payable lender;
    address payable borrower;
  }

  /* Only log book-related actions: addition, borrow, and returns */
  event LogBookAdded(uint bookid);
  event LogBookBorrowed(uint bookid);
  event LogBookReturned(uint bookid);

  /* isOwner for implementation in most admin functions*/
  modifier isOwner() { require(msg.sender == owner, "Only Owner"); _;}
  modifier verifyCaller (address _address) { require (msg.sender == _address); _;}
  /* Has the user paid enough to cover rental fee? If yes, and if in excess checkValue returns additional value */
  modifier paidEnough(uint _rental) { require(msg.value >= _rental, "Add enough ETH to cover the Rental"); _;}
  modifier checkValue(uint _bookid) {
    _;
    uint _rental = books[_bookid].rental;
    uint amountToRefund = msg.value - _rental;
    books[_bookid].borrower.transfer(amountToRefund);
  }

  /* Mods to check if bookAdded or borrowed */
  modifier bookAdded(uint _bookid) { require(books[_bookid].state == State.Available && books[_bookid].rental != 0); _;}
  modifier borrowed(uint _bookid) { require(books[_bookid].state == State.Borrowed); _;}

  constructor() public {
    /* Initial values */
    owner = msg.sender;
    bookId = 0;
  }

  ///Add Book

  /* Lender sets the rental/deposit fee and supplies supporting data
  Only possible when contract is whenNotPaused
  Emit LogBookAdded */
  function addBook(string memory _title, string memory _author, string memory _img, uint _rental) public whenNotPaused() returns(bool){
    books[bookId] = Book({title: _title, author: _author, img: _img, bookid: bookId, rental: _rental, state: State.Available, lender: msg.sender, borrower: address(0)});
    bookId = bookId + 1;
    emit LogBookAdded(bookId);
    return true;
  }

  ///Borrow Book

  /* Borrower sends payment for borrowing book, excess is returned back to the borrower
  Only possible when contract is whenNotPaused
  Emit LogBookBorrowed */
  function borrowBook (uint bookid)
    public payable whenNotPaused() bookAdded(bookid) paidEnough(books[bookid].rental) checkValue(bookid) {
    require(bookid < bookId, "Book Not Found");
    books[bookid].borrower = msg.sender;
    books[bookid].lender.transfer(books[bookid].rental);
    books[bookid].state = State.Borrowed;
    emit LogBookBorrowed(bookid);
  }

  ///Return Book
  
  /* When the borrower sends the book back to the lender, lender calls this to put it back in catalog with available state
  The initial deposit/rental paid by the borrower is reeimbursed using a similar mechanism to checkValue()
  Emit LogBookReturned */
  function returnBook (uint bookid)
    public payable whenNotPaused() borrowed(bookid) paidEnough(books[bookid].rental) isOwner()
  {
    books[bookid].borrower.transfer(books[bookid].rental);
    uint amountToRefund = msg.value - books[bookid].rental;
    books[bookid].lender.transfer(amountToRefund);
    books[bookid].borrower = address(0);
    books[bookid].state = State.Available;
    emit LogBookReturned(bookid);
  }

  ///Open Zeppelin Pausable implementation, call to internal function limited to owner
  function pause() public isOwner
  {
    _pause();
  }

  ///Open Zeppelin Pausable implementation, call to internal function limited to owner
  function resume() public isOwner
  {
    _unpause();
  }

  ///Get data for a book by bookid
  function fetchBook(uint _bookid) public view returns (string memory title, string memory author, string memory img, uint bookid, uint rental, uint state, address lender, address borrower) {
    title = books[_bookid].title;
    author = books[_bookid].author;
    img = books[_bookid].img;
    bookid = books[_bookid].bookid;
    rental = books[_bookid].rental;
    state = uint(books[_bookid].state);
    lender = books[_bookid].lender;
    borrower = books[_bookid].borrower;
    return (title, author, img, bookid, rental, state, lender, borrower);
  }


  ///Tuple return of all books in catalog for the UI demo, this requires Experimental ABIEncoderV2
  function fetchAllBooks() external view returns (Book[] memory) {
    Book[] memory allbooks = new Book[](bookId);
    for (uint i = 0; i < bookId; i++) {
        allbooks[i] = books[i];
    }
    return allbooks;
  } 

}
