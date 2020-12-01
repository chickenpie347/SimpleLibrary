App = {
  web3Provider: null,
  contracts: {},

  init: async function() {

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('SimpleLibrary.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with @truffle/contract
    var SimpleLibraryArtifact = data;
    App.contracts.SimpleLibrary = TruffleContract(SimpleLibraryArtifact);

    // Set the provider for our contract
    App.contracts.SimpleLibrary.setProvider(App.web3Provider);

    // Use our contract to retrieve and mark the adopted pets
    return App.getBooks();
    //return App.addBooks();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-borrow', App.handleBorrow);
    $(document).on('click', '.btn-return', App.handleReturn);
    $(document).on('click', '.btn-lend', App.addBooks);

  },

  getBooks: function() {
    var simpleLibraryInstance;

    App.contracts.SimpleLibrary.deployed().then(function(instance) {
      simpleLibraryInstance = instance;
      return simpleLibraryInstance.bookId.call();

      //return simpleLibraryInstance.books.call(0);
    }).then(async function(data) {
      var bookcount = data.c[0];
      var account;
      await web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      account = accounts[0];
      });

      for (i = 0; i < bookcount; i++) {
        var r = await simpleLibraryInstance.books.call(i);
        console.log(JSON.stringify(r));

        var booksRow = $('#booksRow');
        var bookTemplate = $('#bookTemplate');
          bookTemplate.find('.panel-title').text(r[0]);
          bookTemplate.find('img').attr('src', r[2]);//img
          bookTemplate.find('.book-author').text(r[1]);//author
          bookTemplate.find('.book-rental').text(r[4]+" wei"); //rental
          //bookTemplate.find('.book-state').text((r[5]==0?"Available":"Borrowed"));//state
          bookTemplate.find('.btn-borrow').attr('data-id', r[3]);//lender
          bookTemplate.find('.btn-borrow').attr('data-price', r[4]);
          if (parseInt(r[5]) !== 0) {
            bookTemplate.find('.btn-borrow').text('Borrowed').attr('disabled', true);
          }
          else{
            bookTemplate.find('.btn-borrow').text('Borrow').attr('disabled', false);
          }
          if (r[6] == account) {
            bookTemplate.find('.book-state').text('Your Listing');//.removeAttr("style").hide();
            bookTemplate.find('.btn-borrow').hide();
            if(r[7] !== "0x0000000000000000000000000000000000000000"){
            bookTemplate.find('.btn-return').show();
            bookTemplate.find('.btn-return').attr('data-id', r[3]);//lender
            bookTemplate.find('.btn-return').attr('data-price', r[4]);
            }
            else{
              bookTemplate.find('.btn-return').hide();
            }
          }
          else{
            bookTemplate.find('.btn-return').hide();
          }

          booksRow.append(bookTemplate.html());
          
      }

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  addBooks: function() {
    var simpleLibraryInstance;


    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SimpleLibrary.deployed().then(function(instance) {
        simpleLibraryInstance = instance;

              // Execute adopt as a transaction by sending account
        var title = document.getElementById("formtitle").value;
        var author = document.getElementById("formauthor").value;
        var img = document.getElementById("formurl").value;
        var rental = document.getElementById("formdeposit").value;

        // Execute adopt as a transaction by sending account
        return simpleLibraryInstance.addBook(title,author,img,rental, {from: account});
      }).then(function(result) {
        console.log(result)
        location.reload();
        //return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleBorrow: function(event) {
    event.preventDefault();

    var book = parseInt($(event.target).data('id'));
    var price = parseInt($(event.target).data('price'));

    var simpleLibraryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SimpleLibrary.deployed().then(function(instance) {
        simpleLibraryInstance = instance;

        // Execute adopt as a transaction by sending account
        return simpleLibraryInstance.borrowBook(book, {from: account, value:price});
      }).then(function(result) {
            $('.panel-pet').eq(book).find('button').text('Success').attr('disabled', true);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
  handleReturn: function(event) {
    event.preventDefault();

    var book = parseInt($(event.target).data('id'));
    var price = parseInt($(event.target).data('price'));

    var simpleLibraryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SimpleLibrary.deployed().then(function(instance) {
        simpleLibraryInstance = instance;

        // Execute adopt as a transaction by sending account
        return simpleLibraryInstance.returnBook(book, {from: account, value:price});
      }).then(function(result) {
            $('.panel-pet').eq(book).find('button').text('Success').attr('disabled', true);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
