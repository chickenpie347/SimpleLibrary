The Simple Library contract is Pausable, so it implements a circuit breaker by extending Open Zeppelin's Pausable.sol.

An owner is defined which is in control of the Pausable internal functions.

There are additional checks to prevent over-spending on both borrower's and lender's side, all additional funds apart from the deposit of the book are returned to the senders.

Tests thoroughly check for rigidness of Pausable and Admin controls.

Reentrancy and DoS attack vectors have been suppressed through the use of modifiers and transaction ordering.