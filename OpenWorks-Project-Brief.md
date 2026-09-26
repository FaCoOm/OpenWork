# OpenWorks — Project Brief

**Status:** Proposed hackathon product, 26 September 2026. No live fund, partner repository, deployed contract, or measured public benefit is claimed in this brief.

## 1. Executive brief

**One-sentence pitch:** OpenWorks gives a fixed public-goods fund to a population of bounded agents that compete to find urgent, high-impact issues in approved open-source repositories; accepted fixes leave a traceable evidence trail and trigger a capped, one-time payment to the contributor.

**Core outcome:** A funder can see why one issue received a bounty, a maintainer can confirm that the agreed work was accepted, a contributor can verify payment, and the public can follow the same ticket-to-payment record.

**The product is a grant and bounty allocator.** “Investment” here means spending a predetermined fund on public-benefit work. The prototype does not invest the principal for a financial return, trade assets, or promise a return on donations.

## 2. Why this problem matters

Maintainers have backlogs that mix urgent defects with routine improvements. A limited fund cannot pay for everything. Funders need a defensible way to choose what to support, contributors need clear terms, and observers need to know whether a funded task was actually accepted and paid. Static issue lists and opaque grant committees can make those decisions hard to compare or audit.

OpenWorks tests a narrower proposition: **can an agent improve which approved issue receives a scarce bounty while every funding decision, evidence check, and payment remains inspectable?** The first version focuses on approved open-source repositories. It does not accept municipal repair requests or ask agents to write fixes.

This is a combination with an unresolved originality question, not a claim that agent grants or merged-work rewards are new. [Giveth Causes](https://docs.giveth.io/donation-agents/how-it-works) already uses an AI donation agent to distribute a pooled fund among projects. [Drips Wave](https://docs.drips.network/wave/) already rewards accepted open-source contributions. OpenWorks must demonstrate a useful difference in **cross-ticket discovery, urgency and impact judgment, evolving selection strategies, and an auditable decision-to-payment chain**. A partner maintainer's experience is needed to validate that difference.

## 3. Users and their jobs

| User | Job OpenWorks must help them do |
| --- | --- |
| Fund steward | Set a cause and a fixed spending mandate; inspect what was reserved, paid, returned, or blocked; pause the fund. |
| Repository maintainer | Opt in an open-source repository, mark tickets eligible, confirm whether a submitted fix meets the ticket's acceptance conditions, and flag conflicts. |
| Contributor | Find a funded ticket with clear terms, link an accepted contribution, bind a payout address, and receive a verifiable payment. |
| Public observer or donor | Trace a decision from source issue and stated reasons through evidence, final verdict, and transaction receipt without accessing private credentials. |

## 4. Product concept

### Fixed mandate

A steward deposits a known test-token amount and publishes the approved repositories, purpose, maximum bounty per ticket, maximum spend per round, minimum uncommitted reserve, expiry, permitted verification roles, and pause authority. The agent may choose **which eligible ticket to fund and the amount within these bounds**. The mandate and money limits do not evolve with the agent.

### Maintainer-confirmed ticket intake

OpenWorks gathers open issues from approved repositories and presents them as tickets. It identifies duplicates or incomplete reports, then asks an approved maintainer to mark a ticket eligible. A ticket records its source, affected component, observed failure, acceptance conditions, and any public evidence. Private vulnerability reports are outside the first version.

### Evolutionary multi-agent strategies

A small population of candidate funding agents ranks the same eligible tickets. Each agent has a visible strategy: relative emphasis on urgency, breadth of effect, expected public benefit, feasibility, evidence confidence, and the proposed amount. The strategies begin with different emphases and may mutate one or two weights between evaluation rounds. A current champion makes live funding choices; the others make shadow rankings without spending.

The population is evaluated against a common, labelled replay of prior tickets. Its stated fitness combines agreement with independently supplied urgency and impact judgments, verified resolution outcomes, and budget use. It penalizes unsupported confident claims and spending on tasks that fail their acceptance conditions. Holdout cases are displayed separately from cases used to select a strategy. Sparse or synthetic replay data is labelled as illustrative; it is not evidence that OpenWorks improves real-world funding outcomes. Live learning occurs only as later, independently verified outcomes accumulate. This implements an interpretable selection and mutation pattern without allowing strategy evolution to change custody rules.

### Deterministic policy verdict and payment trace

For each proposed bounty, OpenWorks publishes the ticket, evidence references, strategy version, scores, amount, and reasons. Deterministic rules check repo eligibility, duplicate funding, budget, expiry, and role permissions. An auditable verdict says `ELIGIBLE`, `REVIEW_REQUIRED`, or `BLOCKED`, with the triggered reasons. The model may interpret issue language; it cannot waive a hard rule. This implements an observable rules-and-verdict pattern that deterministically gates reservations before payments.

When a contributor completes the work, a maintainer confirms the accepted pull request and associated payout address. The payment flow checks the confirmation, reserved bounty, and unused ticket identifier, then transfers test tokens once. A public timeline links the ticket, decision, accepted work, confirmation, and transaction. A declined, expired, conflicted, or duplicate claim is visibly blocked or returned according to the mandate.

## 5. End-to-end journey

1. The steward funds OpenWorks and sets the mandate.
2. An approved maintainer opts in a repository and marks specific public tickets eligible.
3. Candidate agents read the same tickets and publish ranked decisions; only the champion can reserve a bounty.
4. Hard policy checks approve the reservation or explain why it was blocked.
5. A contributor resolves the ticket and links the submitted pull request and payout address.
6. The maintainer accepts the work against the ticket's published conditions and confirms the payee; a self-dealing or disputed claim requires separate steward review.
7. A one-time payment is made within the cap, or the reservation expires and returns to the available fund.
8. The observer sees the complete status and the transaction receipt. Later accepted outcomes may inform a new, visibly versioned generation of strategies.

## 6. What the evidence proves

| Evidence | What it can establish | What it cannot establish alone |
| --- | --- | --- |
| Repository issue and pull request | What the repository publicly reported and what code was submitted or merged. | The true urgency or long-term benefit of the fix. |
| Test result | That the recorded checks passed for a particular revision. | That the code has no defects or will remain maintained. |
| Authorized maintainer confirmation | That an identified maintainer accepted a specific fix and payee under stated conditions. | That the maintainer is impartial or every user benefited. |
| On-chain reservation and payment | That the contract enforced its coded spending limits and tokens moved to the recorded address. | That GitHub or any off-chain statement was truthful. |

The chain records commitments, authorization, and settlement. It relies on identified people or services for off-chain facts. The interface must distinguish a **verified payment** from a **verified public impact** claim.

## 7. Hackathon prototype and demonstration

The minimum credible prototype uses one approved example repository, three clearly differentiated public tickets, one fixed test-token fund, several visible strategy profiles, one selected bounty, one accepted fix record, and one actual HSK testnet payout. It must also show a rejected duplicate or over-cap payment. The replay illustrating strategy evolution is separate from the live payment and is clearly labelled with its data source and limitations.

**Suggested three-minute narrative:**

| Time | Visible proof |
| --- | --- |
| 0:00–0:30 | Show the cause, approved repository, fund balance, and three competing tickets. |
| 0:30–1:05 | Show competing agent rankings, evidence, the winning strategy, and the exact reason one urgent issue is selected. |
| 1:05–1:55 | Reserve a bounded bounty, show accepted work and maintainer confirmation, then complete a real testnet payout. |
| 1:55–2:30 | Attempt an over-cap or duplicate payout; show the reason and contract rejection. |
| 2:30–3:00 | Show ticket-to-payment timeline and a labelled historical replay with strategy lineage and holdout result. |

The [Sydney event page](https://luma.com/49iyovqf) lists AI x Ethereum, open-source tooling, real-world applications, and HSK categories, with three minutes for a showcase and two for questions. A credible HSK prize submission needs an actual HSK testnet transaction, not merely a network label. Any token minted for the demonstration must be called a test token, not a stablecoin or real donation. The event page does not guarantee eligibility for multiple prizes.

## 8. Measures of success and validation

**Prototype acceptance:** A judge can follow the full issue-to-payment chain; a valid payout succeeds once; an invalid payout is rejected; the mandate is visible; and the evolution display distinguishes historical replay from live learning.

**Pilot measures, after a maintainer opts in:** percentage of selected tickets a maintainer agrees are urgent and high impact; time from eligible ticket to funded decision; share of bounties ending in accepted fixes; cost per accepted fix; number of blocked or disputed claims; contributor understanding of payment terms; and whether maintainers prefer the funded ordering to their existing triage. Compare with a simple fixed-priority baseline. No pilot result is claimed yet.

## 9. Scope boundaries and major risks

**In the first version:** public issues from approved repos, contributor payment for accepted work, a fixed test fund, bounded autonomous selection, reasoned verdicts, a traceable payout, and an honest evolutionary replay.

**Later:** multiple independent maintainers, signed attestations at scale, private security reports, split contributor rewards, live long-term outcome learning, advanced anti-sybil and conflict checks, real funding, cross-chain operation, and direct integrations with existing funding networks.

The main risks are proxy gaming (agents favoring easy or popular issues), selection bias (only funded work produces quick outcomes), false urgency, maintainer conflicts, fake contributor identity, source-platform outages, and an agent proposing payment to itself or a related address. The prototype addresses these with approved repositories, explicit evidence, separated scoring and settlement, one payee per bounty, hard caps, role checks, an inspection trail, and a pause. A production deployment would require independent security, custody, legal, and operational review.

## 10. Decision to carry forward

Build **OpenWorks as an urgent-issue allocator**, not a general DAO grants platform or an autonomous coding system. Its central test is whether bounded, evolving selection produces a better and more explainable choice of ticket, while accepted work and actual payment remain traceable from end to end.
