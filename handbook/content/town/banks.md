---
title: Banks
summary: Deposit gold, move money with a letter of credit, and understand the shared online account before borrowing.
stage: town
order: 30
gate: none
tags: [bank, gold, loans, letter of credit]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Online, every branch accesses one Bank of the Empire account.
> - Deposit spare gold before travel; carried coins add weight and are exposed to the risks of adventuring.
> - A letter of credit costs a 1% commission and is lighter than carrying its value in coins.
> - An online loan is limited to 1,000 gold per character level, and default or an existing loan blocks new borrowing empire-wide.

## Your account

Use any bank branch to deposit or withdraw. Offline, accounts are regional. Online, all branches use one Empire account, and gold already held in regional accounts folds into it when you join. Loan records and due dates stay tied to the region where they were taken. A default there blocks new borrowing at every branch; the Empire can collect what is owed from the shared account and other regional deposits.

Deposits draw from your purse first, then from a [wagon](../feet/wagons-and-hauling.md) if needed. A withdrawal can be refused if you lack the balance or cannot carry the coins. Gold has weight, so a large withdrawal can burden you even when the account can cover it.

## Letters of credit

A letter of credit carries a stated face value without coin weight. The bank charges 1% above that value when issuing it, and the minimum is 100 gold. You can use eligible letters to pay for purchases, fines and [market](../feet/money-and-markets.md) transactions. Deposit a letter to turn its full face value back into account gold; the bank deposits all letters you carry together.

## Loans

Online loans use the Empire's shared cap: up to 1,000 gold per character level. You can hold only one active loan across the Empire, and a default or an existing loan standing prevents another. Interest of 10% is added when the loan is made, so early repayment does not remove it. The term is one game year. If a loan becomes overdue, the bank takes what it can from the account before the remainder defaults.

> [!warning] Borrow with a repayment plan
> The game charges the interest up front and checks repayment against the game calendar. Missing the due date can affect your account and [legal standing](the-law.md).

## Common mistakes

- **Withdrawing your whole balance before a trip.** Carried coins have weight and face the online [death penalty](../hold/dying-online.md); a death costs one tenth of the gold you carry, while bank gold and letters of credit are untouched. Withdraw only what you will spend.
- **Borrowing up to the full 1,000 gold per character level without a repayment plan.** The 10% interest is added when the loan is made, so early repayment does not remove it, and a default blocks new borrowing empire-wide.

## Next

- [Taverns and rooms](taverns-and-rooms.md)
- [The law](the-law.md)

- [Safe storage](../gear/safe-storage.md)
## Sources

- `src/systems/banking.js`: `EMPIRE_ACCOUNT_REGION`, `foldEmpireAccounts`, `withdrawGold`, `withdrawLetter`, `calculateMaxBankLoan`, `borrowLoan`, `settleOverdueLoan`
- `src/systems/inventory.js`: `GOLD_PIECE_WEIGHT_KG`, letter-of-credit item
- `src/systems/roleplayRealism/rrRealism.js`: `rrLoanMaxPerLevel`
- `src/systems/online/onlineLane.js`: Roleplay & Realism loan setting online
- Research: `handbook/research/T1.md` (banks)
