import type { Teaser } from "./teaserTypes";

// Canonical game-theory setups (Prisoner's Dilemma, Stag Hunt, Ultimatum,
// Centipede, Beauty Contest, Traveler's Dilemma) and folklore logic puzzles
// (Monty Hall, hat colours, bridge crossing). These are public, textbook-
// independent constructions — the narration, numbers and framing here are
// written for this site.

export const TEASER_BANK: Teaser[] = [
  {
    slug: "prisoners-dilemma",
    title: "The Split Deal",
    tag: "Game theory",
    description: "Two thieves, two rooms, one offer each - and no way to talk it over.",
    sprite: "prisoner",
    palette: "red",
    cast: [
      { id: "a", label: "Ada", sprite: "prisoner", palette: "red" },
      { id: "b", label: "Bo", sprite: "prisoner", palette: "blue" },
    ],
    beats: [
      { caption: "Ada and Bo are picked up walking out of a warehouse they shouldn't have been in.", hold: 3000, show: ["a", "b"] },
      { caption: "There's enough evidence to charge them both with trespassing - one year each. Not enough to prove the theft.", hold: 3400 },
      { caption: "So they're put in separate rooms. Neither can hear the other. Neither gets to talk first.", hold: 3400, lit: ["a"] },
      { caption: "Each is offered the same deal: testify against the other, and your own sentence is wiped.", hold: 3600, lit: ["a", "b"] },
      {
        caption: "Here is every way it can land - years served, Ada first.",
        hold: 5200,
        matrix: {
          rowPlayer: "Ada",
          colPlayer: "Bo",
          rowChoices: ["Stay silent", "Testify"],
          colChoices: ["Stay silent", "Testify"],
          cells: [
            ["1 , 1", "10 , 0"],
            ["0 , 10", "8 , 8"],
          ],
          caption: "Lower is better - these are years in prison.",
        },
      },
      {
        caption: "If they both stay silent, they each do a single year and walk out.",
        hold: 3600,
        matrix: {
          rowPlayer: "Ada",
          colPlayer: "Bo",
          rowChoices: ["Stay silent", "Testify"],
          colChoices: ["Stay silent", "Testify"],
          cells: [
            ["1 , 1", "10 , 0"],
            ["0 , 10", "8 , 8"],
          ],
          highlight: [0, 0],
          caption: "The best combined outcome on the board.",
        },
      },
      {
        caption: "But if Ada stays silent and Bo talks, Ada serves ten years while Bo walks free that afternoon.",
        hold: 4200,
        matrix: {
          rowPlayer: "Ada",
          colPlayer: "Bo",
          rowChoices: ["Stay silent", "Testify"],
          colChoices: ["Stay silent", "Testify"],
          cells: [
            ["1 , 1", "10 , 0"],
            ["0 , 10", "8 , 8"],
          ],
          highlight: [0, 1],
        },
      },
    ],
    assumptions: [
      "Both are perfectly rational and only care about their own years served.",
      "Neither can communicate, make promises, or find out what the other chose until it's over.",
      "They will never meet again - there's no reputation to protect and no revenge to fear.",
    ],
    question: "What does each one do?",
    guessPlaceholder: "e.g. both stay silent",
    answerHeadline: "Both testify. Both serve eight years.",
    answerSteps: [
      {
        label: "Step 1 - Put yourself in Ada's chair and fix Bo's choice",
        text: "Ada can't control Bo, so she reasons through both cases separately. Suppose Bo stays silent: Ada gets 1 year by staying silent, or 0 by testifying. Testifying is better.",
      },
      {
        label: "Step 2 - Now suppose Bo testifies",
        text: "Ada gets 10 years by staying silent, or 8 by testifying. Testifying is better again.",
      },
      {
        label: "Step 3 - Notice what just happened",
        text: "Testifying beat staying silent in BOTH cases. Ada never has to guess what Bo will do - one option is better no matter what. That's a dominant strategy.",
      },
      {
        label: "Step 4 - The board is symmetric",
        text: "Bo faces exactly the same numbers and runs exactly the same reasoning. So he testifies too.",
      },
      {
        label: "Step 5 - Land on the outcome",
        text: "Both testify, both serve 8 years - even though both staying silent would have cost them 1 year each. Two individually flawless decisions produced a worse result for both than the option they each rejected.",
      },
    ],
    breakdown: [
      {
        heading: "The equilibrium isn't the best outcome",
        body: "(Testify, Testify) is a Nash equilibrium: given what the other is doing, neither can improve by switching alone. If Ada deviates to silence while Bo testifies, she goes from 8 years to 10. It's stable - and it's worse for both than mutual silence.",
      },
      {
        heading: "Why mutual silence collapses",
        body: "(Silent, Silent) is better for both, but it isn't stable. From there, either one can drop from 1 year to 0 by defecting. Anything a player can unilaterally improve on won't survive rational play.",
      },
      {
        heading: "What interviewers are really testing",
        body: "That you fix the other player's choice and evaluate your own options against it, rather than trying to reason about both moves at once. Say the words 'suppose he testifies... now suppose he stays silent' out loud and the answer falls out.",
      },
      {
        heading: "Where this shows up for real",
        body: "Price wars, arms races, overfishing, and traders all widening spreads at once. Any situation where cooperating is collectively best but individually fragile has this exact shape.",
      },
    ],
  },
  {
    slug: "stag-hunt",
    title: "Stag or Hare",
    tag: "Game theory",
    description: "Two hunters, one stag that takes both of them, and one hare that doesn't.",
    sprite: "stag",
    palette: "brown",
    cast: [
      { id: "h1", label: "Rell", sprite: "hunter", palette: "hunterOlive" },
      { id: "h2", label: "Mabu", sprite: "hunter", palette: "hunterRust" },
      { id: "stag", label: "Stag", sprite: "stag", palette: "brown" },
      { id: "hare", label: "Hare", sprite: "hare", palette: "bone" },
    ],
    beats: [
      { caption: "Two hunters set out at dawn. They separate at the treeline and can't signal each other after that.", hold: 3400, show: ["h1", "h2"] },
      { caption: "There is a stag in the woods. Bringing it down takes both of them, in position, at the same time.", hold: 3600, show: ["h1", "h2", "stag"], lit: ["stag"] },
      { caption: "A stag feeds both families for a week - call that 5 each.", hold: 3200 },
      { caption: "There are also hares. A hare is a sure thing: any one hunter can take one alone.", hold: 3400, show: ["h1", "h2", "stag", "hare"], lit: ["hare"] },
      { caption: "But a hare is a thin meal - call it 3. And chasing one means abandoning the stag.", hold: 3600 },
      {
        caption: "So each hunter, alone at their post, has to decide what the other is doing.",
        hold: 5000,
        matrix: {
          rowPlayer: "Hunter 1",
          colPlayer: "Hunter 2",
          rowChoices: ["Hunt stag", "Take hare"],
          colChoices: ["Hunt stag", "Take hare"],
          cells: [
            ["5 , 5", "0 , 3"],
            ["3 , 0", "3 , 3"],
          ],
          caption: "Higher is better - meals brought home.",
        },
      },
      {
        caption: "Hold for the stag while your partner slips off for a hare, and you go home with nothing at all.",
        hold: 4200,
        matrix: {
          rowPlayer: "Hunter 1",
          colPlayer: "Hunter 2",
          rowChoices: ["Hunt stag", "Take hare"],
          colChoices: ["Hunt stag", "Take hare"],
          cells: [
            ["5 , 5", "0 , 3"],
            ["3 , 0", "3 , 3"],
          ],
          highlight: [0, 1],
        },
      },
    ],
    assumptions: [
      "Both hunters are rational and want the largest meal they can get.",
      "They cannot communicate once they've separated.",
      "Neither has hunted with the other before - there's no track record to go on.",
    ],
    question: "Is there one right answer here, the way there was with the prisoners?",
    guessPlaceholder: "e.g. both hunt the stag",
    answerHeadline: "No. There are two stable outcomes, and which one happens is about trust, not logic.",
    answerSteps: [
      {
        label: "Step 1 - Check for a dominant strategy",
        text: "If your partner hunts stag, you get 5 for stag versus 3 for hare - stag wins. If your partner takes a hare, you get 0 for stag versus 3 for hare - hare wins. Neither option is better in both cases, so nothing dominates.",
      },
      {
        label: "Step 2 - Find the stable pairs",
        text: "(Stag, Stag) is stable: deviating alone drops you from 5 to 3. (Hare, Hare) is also stable: deviating alone drops you from 3 to 0. Two equilibria, not one.",
      },
      {
        label: "Step 3 - Rank them",
        text: "(Stag, Stag) pays 5 each and (Hare, Hare) pays 3 each. Everyone prefers the stag outcome. It is strictly better for both players.",
      },
      {
        label: "Step 4 - See why the worse one still happens",
        text: "Stag only pays if you're right about your partner. Hare pays 3 whether you're right or wrong. The safe choice doesn't depend on trusting anyone - so a hunter with any real doubt takes the hare.",
      },
      {
        label: "Step 5 - State the answer properly",
        text: "Both outcomes are rational. The stag is better for everyone; the hare is safer for anyone. Which one you land on is decided by what each hunter believes about the other, not by the payoffs alone.",
      },
    ],
    breakdown: [
      {
        heading: "This is NOT the Prisoner's Dilemma",
        body: "In the dilemma, defecting is better no matter what, so cooperation is doomed. Here, cooperating is better IF the other cooperates. Nothing is stopping the good outcome except doubt - which makes it a coordination problem, not a conflict of interest.",
      },
      {
        heading: "Payoff-dominant vs. risk-dominant",
        body: "(Stag, Stag) is payoff-dominant - the biggest prize. (Hare, Hare) is risk-dominant - the choice that protects you when you're unsure what the other side does. Naming both, and saying which one you'd expect and why, is the answer an interviewer is listening for.",
      },
      {
        heading: "What breaks the tie in the real world",
        body: "Anything that makes trust cheaper: a reputation, a repeated relationship, a contract, or just being able to talk beforehand. The whole value of communication here is that it moves people off the safe-but-poor equilibrium.",
      },
      {
        heading: "Where this shows up",
        body: "Bank runs, adopting a new standard or platform, joining a strike, a startup team all quitting their jobs on the same day. Everyone prefers the coordinated outcome and everyone fears being the only one who showed up.",
      },
    ],
  },
  {
    slug: "ultimatum",
    title: "One Offer, No Discussion",
    tag: "Game theory",
    description: "A hundred pounds, one proposal, and a partner who can burn it all.",
    sprite: "coin",
    palette: "gold",
    cast: [
      { id: "p", label: "Proposer", sprite: "officeBun", palette: "suitBun" },
      { id: "r", label: "Responder", sprite: "officeShort", palette: "suitShort" },
      { id: "pot", label: "£100", sprite: "coin", palette: "gold" },
    ],
    beats: [
      { caption: "Two strangers are handed £100 to divide, and a single rule for doing it.", hold: 3400, show: ["p", "r", "pot"] },
      { caption: "One of them is named Proposer. She names a split - any split - and that's the only offer that will ever be made.", hold: 3800, lit: ["p"] },
      { caption: "The other is the Responder. He can accept, and they each take what was proposed.", hold: 3400, lit: ["r"] },
      { caption: "Or he can reject. In which case the money goes back in the envelope and BOTH of them walk away with nothing.", hold: 4000, show: ["p", "r"], lit: ["r"] },
      { caption: "No counter-offers. No second round. No conversation. One number, one yes or no.", hold: 3600, show: ["p", "r", "pot"] },
      { caption: "So the Proposer has to decide: how little can she offer and still have it taken?", hold: 3800, lit: ["p"] },
    ],
    assumptions: [
      "Both players are perfectly rational and only care about the money they personally end up with.",
      "They are strangers, they play exactly once, and neither will ever learn who the other was.",
      "The rules are common knowledge - each knows the other understands the game completely.",
    ],
    question: "What should the Proposer offer, and what does the Responder do?",
    guessPlaceholder: "e.g. £50 / £50",
    answerHeadline: "Theory says offer £1 and it gets accepted. Real people reject it every time.",
    answerSteps: [
      {
        label: "Step 1 - Start at the end, not the beginning",
        text: "The Responder moves last, so solve his decision first. That's backward induction: you can't work out the opening move until you know how the game finishes.",
      },
      {
        label: "Step 2 - Solve the Responder",
        text: "He's facing some offer of £X against the alternative of £0. If he only cares about money, any X above zero beats rejecting. So a rational Responder accepts literally any positive offer.",
      },
      {
        label: "Step 3 - Feed that back to the Proposer",
        text: "If she knows every positive offer gets accepted, she should offer the smallest positive amount there is - £1 - and keep £99.",
      },
      {
        label: "Step 4 - The theoretical answer",
        text: "£99 / £1, accepted. That's the subgame-perfect equilibrium: it's optimal at every decision point in the game, not just overall.",
      },
      {
        label: "Step 5 - Now the part that matters",
        text: "This has been run on thousands of real people. Offers below about 20-30% are rejected roughly half the time. People pay real money to punish an offer they consider insulting - and Proposers, anticipating this, typically offer close to 40-50%.",
      },
    ],
    breakdown: [
      {
        heading: "Backward induction is the technique",
        body: "Any sequential game with a known endpoint gets solved from the last move backwards. Work out what the final player does, treat it as fixed, then solve the move before it. The same machinery drives the Centipede game and every decision-tree question you'll be asked.",
      },
      {
        heading: "The assumption that actually breaks",
        body: "Not rationality - the payoff function. The theory assumes the Responder's payoff is exactly the cash. Real people also price fairness and the satisfaction of punishing someone. Rejecting £1 is perfectly rational if being treated contemptuously costs you more than £1 of felt value.",
      },
      {
        heading: "The answer interviewers want",
        body: "Both halves. Derive £99/£1 cleanly by backward induction, then say plainly that it fails empirically and name why - the model priced the money and forgot to price the insult. Giving only the theory looks naive; giving only the behavioural answer looks like you can't do the math.",
      },
      {
        heading: "Where this shows up",
        body: "Any take-it-or-leave-it negotiation: final salary offers, a single-shot acquisition bid, a landlord's renewal terms. Squeezing every last pound out of a counterparty who can walk away is usually a worse strategy than the arithmetic suggests.",
      },
    ],
  },
  {
    slug: "centipede",
    title: "The Growing Pot",
    tag: "Game theory",
    description: "Every time you pass, the money doubles - and the other player gets the chance to take it.",
    sprite: "coin",
    palette: "teal",
    cast: [
      { id: "a", label: "Ann", sprite: "officeFreckles", palette: "suitGrey" },
      { id: "b", label: "Ben", sprite: "officeAfro", palette: "suitBlondeAfro" },
      { id: "pot", label: "Pot", sprite: "coin", palette: "gold" },
    ],
    beats: [
      { caption: "Ann and Ben sit across a table. Between them, £4 - £3 on Ann's side, £1 on Ben's.", hold: 3600, show: ["a", "b", "pot"] },
      { caption: "Ann goes first. She can TAKE, ending it right there and pocketing the £3.", hold: 3400, lit: ["a"] },
      { caption: "Or she can PASS. If she passes, the pot doubles - and the decision moves to Ben.", hold: 3600 },
      { caption: "Now it's £8 on the table, £6 of it Ben's if he takes. He can take, or pass and double it again.", hold: 3800, lit: ["b"] },
      { caption: "It runs six rounds like this. Pass every single time and the pot reaches £256.", hold: 3800, show: ["a", "b", "pot"] },
      { caption: "But whoever takes, takes the larger share - and the other one is left holding the smaller.", hold: 3800 },
      { caption: "Both of them can see the whole ladder before a single move is made.", hold: 3600, lit: ["a", "b"] },
    ],
    assumptions: [
      "Both players are perfectly rational, care only about their own money, and know the other is the same.",
      "The number of rounds is fixed at six and both know it.",
      "The pot doubles on every pass, and taking always yields more than passing did a moment earlier.",
    ],
    question: "How far does the pot actually get?",
    guessPlaceholder: "e.g. they pass a few times then take",
    answerHeadline: "Ann takes on move one. The pot never grows at all.",
    answerSteps: [
      {
        label: "Step 1 - Go to the last move first",
        text: "On the final round, Ben chooses between taking the larger share and passing to a game that has now ended, which pays him less. He takes. There is no future left to protect, so nothing restrains him.",
      },
      {
        label: "Step 2 - Step back one move",
        text: "Ann, moving second-to-last, now knows with certainty that if she passes, Ben takes and she's left with the small share. Taking now beats that. So she takes.",
      },
      {
        label: "Step 3 - Keep unwinding",
        text: "Ben, one move earlier, knows Ann will take at the next node. So passing gains him nothing and he takes. The same logic applies at every node going backwards.",
      },
      {
        label: "Step 4 - Reach the first move",
        text: "The reasoning chains all the way to the start. Ann takes immediately with £3, Ben gets £1, and the £256 at the end of the ladder is never touched by anybody.",
      },
      {
        label: "Step 5 - And again, reality disagrees",
        text: "In experiments, almost nobody takes on move one. Most pairs pass several times and take somewhere in the middle, ending up far richer than the equilibrium predicts.",
      },
    ],
    breakdown: [
      {
        heading: "Backward induction can eat the whole game",
        body: "Every player prefers the deep end of the ladder to the shallow end - and rigorous logic marches them straight to the shallow end anyway. The result is airtight and collectively terrible, which is exactly why it's a famous problem.",
      },
      {
        heading: "The fragile ingredient is common knowledge",
        body: "The chain requires you to be certain the other player is rational, certain they're certain you are, and so on forever. Introduce even a small doubt - maybe they're a bit irrational, or willing to cooperate - and passing becomes worth a gamble. That crack is enough to explain the experimental results.",
      },
      {
        heading: "The contrast to draw",
        body: "The Prisoner's Dilemma fails because defecting is better regardless. The Centipede fails for a different reason: nobody wants to be the one holding the small share when the music stops. Being able to articulate that difference is what separates a memorised answer from an understood one.",
      },
      {
        heading: "Where this shows up",
        body: "Any finite relationship where the last period is known - a fixed-term contract, an employee's final month, an exit-round negotiation. Cooperation reliably decays as the endpoint gets close, and everyone can see it coming.",
      },
    ],
  },
  {
    slug: "beauty-contest",
    title: "Two-Thirds of the Room",
    tag: "Game theory",
    description: "Everyone picks a number. The winner is closest to two-thirds of the average.",
    sprite: "envelope",
    palette: "purple",
    cast: [
      { id: "a", sprite: "officeFreckles", palette: "suitFreckles" },
      { id: "b", sprite: "officeShort", palette: "suitShort" },
      { id: "c", sprite: "officeAfro", palette: "suitBlondeAfro" },
      { id: "d", sprite: "officeBun", palette: "suitBun" },
      { id: "e", sprite: "officeAfro", palette: "suitGrey" },
    ],
    beats: [
      { caption: "A hundred people are in a room. Each is handed a card and told to write down one number from 0 to 100.", hold: 3600, show: ["a", "b", "c", "d", "e"] },
      { caption: "The cards are collected and averaged.", hold: 2800 },
      { caption: "The winner isn't whoever wrote the highest number, or the lowest.", hold: 3000 },
      { caption: "It's whoever wrote the number closest to TWO-THIRDS of the average.", hold: 3800, lit: ["a", "b", "c", "d", "e"] },
      { caption: "Nobody can see anyone else's card. Everyone in the room has been told the same rule.", hold: 3600 },
      { caption: "You're holding a blank card and a pen.", hold: 3000, lit: ["c"] },
    ],
    assumptions: [
      "Everyone wants to win and is choosing their number to do so.",
      "Nobody can see, discuss, or coordinate on anyone else's number.",
      "The rule is common knowledge - everyone knows the rule, and knows that everyone knows it.",
    ],
    question: "What do you write down?",
    guessPlaceholder: "e.g. 33",
    answerHeadline: "The equilibrium is 0. The winning number in a real room is usually somewhere around 20-30.",
    answerSteps: [
      {
        label: "Level 0 - no reasoning at all",
        text: "If people just scribble anything between 0 and 100, the average lands near 50. Two-thirds of 50 is about 33.",
      },
      {
        label: "Level 1 - one step of thinking",
        text: "But if you expect everyone else to reason that far, they'll all write ~33. Two-thirds of 33 is 22. So you write 22.",
      },
      {
        label: "Level 2 - assume they thought of that too",
        text: "If everyone gets to 22, two-thirds of that is about 15. And if everyone gets to 15, the target drops to 10. The target keeps sliding down every time you add a level.",
      },
      {
        label: "Step 4 - Follow it to the floor",
        text: "Each round of reasoning multiplies by 2/3. Iterate it forever and the only number that survives is 0. If literally everyone is perfectly rational and knows it, everyone writes 0 and everyone ties.",
      },
      {
        label: "Step 5 - Play the actual room",
        text: "Real rooms don't get there. Most people stop at one or two levels of reasoning, so winning answers cluster around 20-30. The skill isn't reaching 0 - it's estimating how many levels deep THIS room will go, and stopping one level past it.",
      },
    ],
    breakdown: [
      {
        heading: "Iterated elimination of dominated strategies",
        body: "Nobody can win with a number above 67, since two-thirds of the largest possible average is 67. Delete those. Now nobody can win above 44. Delete again. Repeated deletion is the formal machinery, and it converges on 0.",
      },
      {
        heading: "Depth of reasoning is the real variable",
        body: "This is a direct measure of how many steps of 'I think that you think that I think' a population actually performs. The empirical answer is: not many. Two levels is typical, even among people who understand the math perfectly.",
      },
      {
        heading: "Why quant desks love this question",
        body: "Answering 0 shows you can do the induction. Answering ~22 with the reasoning above shows you can do the induction AND model the people you're up against. Markets reward the second skill much more heavily than the first.",
      },
      {
        heading: "Where this shows up",
        body: "Keynes described the market itself this way: you're not picking the stock you think is best, you're picking the one you think everyone else will think everyone else will pick. Momentum, positioning and crowded trades are all this game.",
      },
    ],
  },
  {
    slug: "river-crossing",
    title: "One Seat in the Boat",
    tag: "Case reduction",
    description: "A wolf, a goat, a cabbage, and a boat that only carries one of them.",
    sprite: "boat",
    palette: "brown",
    cast: [
      { id: "f", label: "Farmer", sprite: "hiker", palette: "hikerGreen" },
      { id: "w", label: "Wolf", sprite: "wolf", palette: "bone" },
      { id: "g", label: "Goat", sprite: "goat", palette: "brown" },
      { id: "c", label: "Cabbage", sprite: "cabbage", palette: "green" },
      { id: "b", label: "Boat", sprite: "boat", palette: "brown" },
    ],
    beats: [
      { caption: "A farmer reaches a river with a wolf, a goat, and a sack of cabbages.", hold: 3400, show: ["f", "w", "g", "c"] },
      { caption: "There's one boat, and it's small. The farmer rows, and there's room for exactly one passenger beside him.", hold: 4000, show: ["f", "w", "g", "c", "b"], lit: ["b"] },
      { caption: "Which means at every crossing, two of the three get left behind on a bank by themselves.", hold: 3800, show: ["f", "w", "g", "c"] },
      { caption: "Leave the wolf alone with the goat, and the farmer comes back to a wolf and no goat.", hold: 3800, lit: ["w", "g"], dim: ["c"] },
      { caption: "Leave the goat alone with the cabbages, and the cabbages are gone.", hold: 3800, lit: ["g", "c"], dim: ["w"] },
      { caption: "The wolf, for its part, has no interest whatsoever in cabbage.", hold: 3400, lit: ["w", "c"], dim: ["g"] },
      { caption: "All three have to reach the far bank intact.", hold: 3400, show: ["f", "w", "g", "c", "b"] },
    ],
    assumptions: [
      "The boat carries the farmer plus at most one of the three, and only the farmer can row it.",
      "Nothing gets eaten while the farmer is standing there - trouble only happens on a bank he has left.",
      "The farmer may cross as many times as he likes, in either direction, including with an empty boat.",
    ],
    question: "How does he get all three across?",
    guessPlaceholder: "e.g. goat first, then...",
    answerHeadline: "Seven crossings - and the trick is that one passenger has to come back.",
    answerSteps: [
      {
        label: "Step 1 - Find the troublemaker",
        text: "List the conflicts: wolf-goat and goat-cabbage. The goat appears in both. The wolf and the cabbage are perfectly safe together. So the goat is the one that can never be left with either of the others.",
      },
      {
        label: "Step 2 - Take the goat over first",
        text: "That leaves the wolf and the cabbage alone on the near bank, which we just established is fine. Drop the goat on the far bank and row back empty.",
      },
      {
        label: "Step 3 - Take the wolf across",
        text: "Now the cabbage sits alone on the near bank - safe. But the far bank now has the wolf AND the goat, which is exactly the thing we can't allow.",
      },
      {
        label: "Step 4 - Bring the goat back",
        text: "This is the move nobody sees. Load the goat into the boat and return it to the near bank. It feels like undoing progress, and it's the only way through.",
      },
      {
        label: "Step 5 - Swap the goat for the cabbage",
        text: "Leave the goat on the near bank, take the cabbage across. The far bank now holds the wolf and the cabbage - safe. The near bank holds only the goat.",
      },
      {
        label: "Step 6 - Go back for the goat",
        text: "Row back empty, collect the goat, and cross one last time. Seven crossings in total: over, back, over, back, over, back, over.",
      },
    ],
    breakdown: [
      {
        heading: "Why people get stuck",
        body: "Almost everyone assumes each passenger crosses exactly once, so the puzzle looks impossible after three moves. Nothing in the rules says that. The moment you allow a return trip the whole thing opens up - and noticing the assumption you invented yourself is the actual skill being tested.",
      },
      {
        heading: "The goat is the articulation point",
        body: "Rather than searching moves at random, characterise the constraints first. One item appears in every conflict; the other two are mutually harmless. That immediately forces the goat to move first and to be the thing shuttled back - the solution is almost determined once you see it.",
      },
      {
        heading: "It's a tiny state search",
        body: "A state is just which of the four are on each bank - sixteen combinations, most of them illegal. With a space that small, say so and walk the graph systematically rather than hunting for inspiration. There's a mirror-image solution too: take the cabbage third instead of the wolf.",
      },
      {
        heading: "The transferable move",
        body: "When a problem looks impossible, check which rule you added yourself. Progress that must be temporarily reversed shows up constantly - in sorting, in routing, and in any search where a step backwards is required to move forwards.",
      },
    ],
  },
  {
    slug: "birthday-problem",
    title: "The Office Bet",
    tag: "Probability",
    description: "Your colleague bets you two people in the office share a birthday. Do you take it?",
    sprite: "cake",
    palette: "purple",
    cast: [
      { id: "p1", label: "You", sprite: "officeFreckles", palette: "suitFreckles" },
      { id: "p2", label: "Dev", sprite: "officeAfro", palette: "suitBlondeAfro" },
      { id: "p3", sprite: "officeBun", palette: "suitBun" },
      { id: "p4", sprite: "officeShort", palette: "suitShort" },
      { id: "p5", sprite: "officeAfro", palette: "suitGrey" },
      { id: "cake", label: "?", sprite: "cake", palette: "purple" },
    ],
    beats: [
      { caption: "It's Friday. You and your colleagues are crammed into the meeting room for someone's leaving cake.", hold: 3600, show: ["p1", "p2", "p3", "cake"] },
      { caption: "Dev from the desk opposite counts the room. Twenty-three of you, including him and you.", hold: 3600, show: ["p1", "p2", "p3", "p4", "p5", "cake"], lit: ["p2"] },
      { caption: "He puts fifty quid on the table. His bet: at least two people in this room share a birthday.", hold: 4200, lit: ["p2"] },
      { caption: "Twenty-three people. Three hundred and sixty-five days in the year.", hold: 3600, show: ["p1", "p2", "p3", "p4", "p5"] },
      { caption: "That's barely six percent of the calendar covered. Free money, surely.", hold: 3800, lit: ["p1"] },
      { caption: "Dev is still smiling, and he hasn't moved his hand off the fifty.", hold: 3600, lit: ["p2"] },
    ],
    assumptions: [
      "Birthdays are spread uniformly across 365 days - ignore leap years and seasonal clustering.",
      "Everyone's birthday is independent of everyone else's.",
      "Dev wins if ANY two people in the room match - not if someone matches him specifically.",
    ],
    question: "Do you take Dev's bet?",
    guessPlaceholder: "e.g. yes, easy money",
    answerHeadline: "Don't take it. Dev wins about 50.7% of the time - he's got the edge, and he knows it.",
    answerSteps: [
      {
        label: "Step 1 - Flip the question",
        text: "Working out 'at least one shared birthday' directly means summing over one pair matching, two pairs, and so on. Compute the opposite instead: the chance ALL 23 birthdays differ, then subtract from 1.",
      },
      {
        label: "Step 2 - Let people into the room one at a time",
        text: "The first person can have any birthday: 365/365. The second has to dodge that one day: 364/365. The third has to dodge two: 363/365. Every new arrival has one fewer day left free.",
      },
      {
        label: "Step 3 - Multiply the whole run",
        text: "P(all different) = (365/365) x (364/365) x ... x (343/365) for 23 people. It's a long product of numbers just under 1 - and those fall away far faster than your gut expects.",
      },
      {
        label: "Step 4 - Do the arithmetic",
        text: "That product comes to about 0.4927. So the chance of at least one shared birthday is 1 - 0.4927, about 50.7%. Dev is a slight favourite. At 22 people he'd have been a slight underdog, so he picked his moment.",
      },
      {
        label: "Step 5 - See why it isn't 23 out of 365",
        text: "You were counting people. The bet is about PAIRS. Twenty-three people make C(23,2) = 253 different pairs, each with a 1/365 chance of matching. 253/365 is about 0.69 expected matches - suddenly a coin flip sounds right.",
      },
    ],
    breakdown: [
      {
        heading: "Pairs grow quadratically, people grow linearly",
        body: "If the room filled to 46 the chance wouldn't double - the pairs would roughly quadruple, 253 to 1,035, and Dev would win about 95% of the time. Every failed intuition here comes from counting heads instead of handshakes.",
      },
      {
        heading: "The bet you thought you were taking",
        body: "'Does anyone here share MY birthday?' is a different bet entirely - that's 22 comparisons, not 253, and it sits around 6%. You'd have won that one comfortably. Spotting that Dev worded it the other way is the whole trick.",
      },
      {
        heading: "The complement trick generalises",
        body: "Any time a question says 'at least one', compute the probability of none and subtract. It turns a messy inclusion-exclusion sum into one clean product, and it's the first move on collision, coupon-collector, and defect-rate problems.",
      },
      {
        heading: "Where this shows up for real",
        body: "Hash collisions and the birthday attack in cryptography: a hash with N possible outputs starts colliding around the square root of N, not N. It's why a 64-bit ID space is far less safe than it sounds - collisions turn up near 2^32, not 2^64.",
      },
    ],
  },
  {
    slug: "monty-hall",
    title: "The Third Door",
    tag: "Conditional probability",
    description: "You pick a door. The host opens another. Do you switch?",
    sprite: "door",
    palette: "brown",
    cast: [
      { id: "d1", label: "1", sprite: "door", palette: "brown" },
      { id: "d2", label: "2", sprite: "door", palette: "brown" },
      { id: "d3", label: "3", sprite: "door", palette: "brown" },
    ],
    beats: [
      { caption: "Three doors. Behind one of them is a car. Behind the other two, goats.", hold: 3400, show: ["d1", "d2", "d3"] },
      { caption: "You pick a door - say Door 1. You don't open it yet.", hold: 3400, lit: ["d1"] },
      { caption: "The host knows exactly what's behind all three doors. This matters more than anything else in the puzzle.", hold: 4000 },
      { caption: "He opens one of the two doors you didn't pick - and reveals a goat. He would never open the car.", hold: 4000, dim: ["d3"], lit: ["d1"] },
      { caption: "Two doors are left standing: the one you picked, and one other.", hold: 3400, dim: ["d3"] },
      { caption: "The host offers you the chance to change your mind.", hold: 3400, lit: ["d1", "d2"], dim: ["d3"] },
    ],
    assumptions: [
      "The host always opens a door you did not pick, always reveals a goat, and always offers the switch.",
      "The car was placed behind a uniformly random door at the start.",
      "If your first pick happened to be the car, the host chooses between the two goat doors at random.",
    ],
    question: "Do you switch, and what are your odds either way?",
    guessPlaceholder: "e.g. doesn't matter, 50/50",
    answerHeadline: "Switch. Switching wins two-thirds of the time; staying wins one-third.",
    answerSteps: [
      {
        label: "Step 1 - Nail down your first pick",
        text: "When you chose Door 1, you had a 1/3 chance of being right and a 2/3 chance of being wrong. Nothing the host does afterwards changes what was true at that moment.",
      },
      {
        label: "Step 2 - Case A: your first pick was the car (1/3)",
        text: "The host opens a goat. The remaining door is also a goat. Switching loses. This happens one time in three.",
      },
      {
        label: "Step 3 - Case B: your first pick was a goat (2/3)",
        text: "The other two doors hold one goat and the car. The host must open the goat - he can't open the car. So the door he leaves shut is the car. Switching wins. This happens two times in three.",
      },
      {
        label: "Step 4 - Add up the cases",
        text: "Switching wins in Case B, which is 2/3 of the time. Staying wins in Case A, which is 1/3. Switching is exactly twice as good.",
      },
      {
        label: "Step 5 - Kill the 50/50 intuition",
        text: "Two doors left doesn't mean equal odds. The host's choice wasn't random - it was constrained by where the car actually is, and that constraint leaks information into the door he left closed.",
      },
    ],
    breakdown: [
      {
        heading: "The information is in the host's constraint",
        body: "Because the host must avoid the car, his action is correlated with the truth. Opening a goat door tells you nothing about your own door - it was locked in at 1/3 - but it concentrates the entire remaining 2/3 onto the one door he chose to leave shut.",
      },
      {
        heading: "Change the rules and the answer changes",
        body: "If the host picks at random and happens to reveal a goat, it genuinely is 50/50. The whole result depends on the host knowing and being obliged to avoid the car. Always ask how the information was generated - that's the transferable lesson.",
      },
      {
        heading: "Make it obvious with bigger numbers",
        body: "Run it with 100 doors. You pick one, the host opens 98 goats, and leaves one shut. Nobody's intuition says 50/50 there - obviously the untouched door is the car. It's the same problem with the effect amplified.",
      },
      {
        heading: "Why this is asked constantly",
        body: "It's the cleanest test of conditional probability under an observation process. Interviewers want to see you condition on HOW you learned something, not just on what you learned - the single most common mistake in applied probability.",
      },
    ],
  },
  {
    slug: "hat-colours",
    title: "The Line of Hats",
    tag: "Induction",
    description: "A hundred prisoners in a line, each seeing only forwards, each guessing their own hat.",
    sprite: "hat",
    palette: "red",
    cast: [
      { id: "p1", sprite: "person", palette: "hatBlack1" },
      { id: "p2", sprite: "person", palette: "hatWhite1" },
      { id: "p3", sprite: "person", palette: "hatBlack2" },
      { id: "p4", sprite: "person", palette: "hatWhite2" },
      { id: "p5", sprite: "person", palette: "hatBlack3" },
    ],
    beats: [
      { caption: "A hundred prisoners are lined up single file, each facing the back of the person in front.", hold: 3600, show: ["p1", "p2", "p3", "p4", "p5"] },
      { caption: "A hat is placed on every head - black or white, decided by a coin flip nobody sees.", hold: 3600 },
      { caption: "You can see every hat in front of you. You cannot see your own, or any behind you.", hold: 3800, lit: ["p5"] },
      { caption: "Starting from the back of the line, each prisoner must say one word: 'black' or 'white'.", hold: 3800, lit: ["p5"] },
      { caption: "Everyone hears every guess. Guess your own hat right and you live. Guess wrong and you don't.", hold: 4000 },
      { caption: "The night before, they're allowed to agree on a strategy together.", hold: 3600, lit: ["p1", "p2", "p3", "p4", "p5"] },
    ],
    assumptions: [
      "All hundred prisoners are perfectly rational, can agree a strategy beforehand, and will follow it exactly.",
      "Each hears all previous guesses, and knows their position in the line.",
      "They may only say the single word 'black' or 'white' - no pauses, tones, or other signals.",
    ],
    question: "What's the best strategy, and how many are guaranteed to survive?",
    guessPlaceholder: "e.g. 50 of them",
    answerHeadline: "Ninety-nine are guaranteed. Only the prisoner at the very back is at risk, and even he has a coin flip.",
    answerSteps: [
      {
        label: "Step 1 - Notice who has nothing to lose",
        text: "The prisoner at the back sees all 99 hats ahead but gets no information about his own. He cannot do better than a coin flip. So spend his guess buying information for everyone else.",
      },
      {
        label: "Step 2 - Agree on a parity code",
        text: "The night before, they agree: the back prisoner says 'black' if he counts an EVEN number of black hats ahead of him, and 'white' if he counts an odd number. His word is a checksum, not a guess about himself.",
      },
      {
        label: "Step 3 - The next prisoner solves it exactly",
        text: "Prisoner 99 counts the black hats in front of him. If his count's parity differs from what was announced, the missing black hat must be his own. If it matches, his hat is white. He is never wrong.",
      },
      {
        label: "Step 4 - Everyone downstream updates",
        text: "Each subsequent prisoner heard the original parity AND every guess since. He knows all hats behind him from those guesses and sees all hats ahead. Everything is accounted for except his own - so his colour is forced.",
      },
      {
        label: "Step 5 - Count the survivors",
        text: "Prisoners 99 through 1 are all certain: 99 guaranteed. The prisoner at the back is right half the time, so the expected total is 99.5.",
      },
    ],
    breakdown: [
      {
        heading: "One bit, shared by everyone",
        body: "The back prisoner emits exactly one bit of information. Because parity is a global property of the whole line, that single bit is simultaneously useful to all 99 others - it doesn't get consumed by the first person who uses it.",
      },
      {
        heading: "Induction is doing the real work",
        body: "Prisoner 99's deduction is the base case. Each one after that inherits a fully-determined picture of everything behind them and adds their own answer to it. Assume it works for prisoner k, prove it for k−1 - textbook induction wearing a costume.",
      },
      {
        heading: "How to find this in an interview",
        body: "Ask which player is unavoidably doomed, and turn their wasted move into a signal. That reframe - spend the hopeless move on information - cracks a whole family of puzzles, not just this one.",
      },
      {
        heading: "Sanity check the bound",
        body: "You can't guarantee all 100: the back prisoner's hat is genuinely independent of everything he can observe, so no strategy can do better than chance for him. 99 guaranteed is provably optimal.",
      },
    ],
  },
  {
    slug: "bridge-crossing",
    title: "The Rope Bridge",
    tag: "Case reduction",
    description: "Four friends, a rotting bridge in the dark, and one torch between them.",
    sprite: "bridge",
    palette: "rope",
    cast: [
      { id: "d", label: "Dee · 1 min", sprite: "hiker", palette: "hikerGreen" },
      { id: "c", label: "Cass · 2 min", sprite: "hiker", palette: "hikerBlue" },
      { id: "b", label: "Bo · 5 min", sprite: "hiker", palette: "hikerPlum" },
      { id: "a", label: "Amal · 10 min", sprite: "hiker", palette: "hikerRed" },
      { id: "bridge", sprite: "bridge", palette: "rope" },
      { id: "torch", label: "the only torch", sprite: "torch", palette: "flame" },
    ],
    beats: [
      { caption: "Amal, Bo, Cass and Dee are an hour behind schedule when they finally reach the gorge.", hold: 3600, show: ["a", "b", "c", "d"] },
      { caption: "The only way across is an old rope bridge. It sags when you look at it. Two people on it at once is the absolute limit.", hold: 4200, show: ["bridge", "a", "b", "c", "d"], lit: ["bridge"] },
      { caption: "It's properly dark now, and between the four of them there is exactly one torch.", hold: 3800, show: ["bridge", "torch", "a", "b", "c", "d"], lit: ["torch"] },
      { caption: "Nobody sets foot on those planks without it - which means after every crossing, somebody has to carry it back.", hold: 4200, lit: ["torch", "bridge"] },
      { caption: "They don't move at the same pace. Dee jogs it in one minute. Cass takes two.", hold: 3800, show: ["bridge", "torch", "a", "b", "c", "d"], lit: ["d", "c"] },
      { caption: "Bo needs five. Amal, whose knee has never been the same, needs ten.", hold: 3800, lit: ["b", "a"] },
      { caption: "And a pair crossing together can only go as fast as the slower one of them.", hold: 3800, show: ["bridge", "torch", "a", "b", "c", "d"] },
      { caption: "Someone checks their phone. The storm front hits in seventeen minutes.", hold: 3800, lit: ["a", "b", "c", "d"] },
    ],
    assumptions: [
      "At most two people on the bridge at once, and whoever is on it must have the torch.",
      "A pair crosses at the slower person's pace; the torch cannot be thrown back across.",
      "All four have to end up on the far side.",
    ],
    question: "What's the minimum time to get all four across?",
    guessPlaceholder: "e.g. 19 minutes",
    answerHeadline: "Seventeen minutes exactly - and it means sending Amal and Bo over together.",
    answerSteps: [
      {
        label: "Step 1 - Try the obvious plan",
        text: "Let Dee, the fastest, escort everyone. Dee+Cass over (2), Dee back (1), Dee+Bo over (5), Dee back (1), Dee+Amal over (10). That's 19 minutes. Two short. So the instinctive plan is wrong.",
      },
      {
        label: "Step 2 - Work out where the time went",
        text: "Amal's ten minutes bought one person's passage, and Bo's five bought one person's passage. The two expensive crossings were paid for separately - that's the waste.",
      },
      {
        label: "Step 3 - Put the two slow ones together",
        text: "If Amal and Bo cross as a pair, the trip costs 10 minutes and moves BOTH of them. You pay Amal's ten once and Bo rides along for free. That's the entire insight.",
      },
      {
        label: "Step 4 - Build the schedule around that trip",
        text: "Dee and Cass cross first (2 min). Dee runs the torch back (1 min). Amal and Bo cross together (10 min). Cass brings the torch back (2 min). Dee and Cass cross again (2 min).",
      },
      {
        label: "Step 5 - Add it up",
        text: "2 + 1 + 10 + 2 + 2 = 17 minutes, with the storm arriving as the last two step off. Notice the pattern: the two fastest handle every return trip, and the two slowest make one single journey between them.",
      },
    ],
    breakdown: [
      {
        heading: "The reframe: pay for slowness once",
        body: "Every crossing is billed at the slower walker's time. So pairing a slow person with a fast one wastes the fast one entirely. Putting Amal and Bo together makes their times overlap instead of adding - 10 instead of 15.",
      },
      {
        heading: "Why the escort plan fails",
        body: "Sending Dee back and forth minimises each individual return trip, which feels efficient, but it forces every slow crossing to be paid in full and separately. A textbook case of a locally sensible rule producing a globally worse answer.",
      },
      {
        heading: "How to search it properly",
        body: "The state is just who is on each side plus where the torch is - a small enough space to walk exhaustively. When a puzzle has few states, say so and enumerate them rather than hoping for inspiration you might not get.",
      },
      {
        heading: "The generalisation",
        body: "With more people the optimal schedule alternates between two moves: ferry the two slowest over together, or shuttle them one at a time with the fastest. Which wins depends on whether the second-fastest time is small relative to the slowest - worth saying out loud if you're pushed.",
      },
    ],
  },
];

export function getTeaser(slug: string): Teaser | undefined {
  return TEASER_BANK.find((t) => t.slug === slug);
}
