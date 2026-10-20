/**
 * Texas Hold'em Game State Controller
 * Fully compliant with official Texas Hold'em rules & betting rounds:
 * Pre-Flop -> Flop -> Turn -> River -> Showdown
 */

class PokerGame {
    constructor() {
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.minRaise = 20;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerIndex = 0;
        this.activePlayerIndex = -1;
        this.currentRound = 'IDLE'; // 'PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'
        this.handInProgress = false;

        this.players = [
            { id: 0, name: 'You', isHuman: true, chips: 1000, holeCards: [], currentBet: 0, hasActed: false, folded: false, allIn: false, avatar: '👤' },
            { id: 1, name: 'Alex', isHuman: false, personality: 'aggressive', chips: 1000, holeCards: [], currentBet: 0, hasActed: false, folded: false, allIn: false, avatar: '🦊' },
            { id: 2, name: 'Claire', isHuman: false, personality: 'conservative', chips: 1000, holeCards: [], currentBet: 0, hasActed: false, folded: false, allIn: false, avatar: '🦉' },
            { id: 3, name: 'Tom', isHuman: false, personality: 'balanced', chips: 1000, holeCards: [], currentBet: 0, hasActed: false, folded: false, allIn: false, avatar: '🐺' }
        ];

        this.history = [];
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    log(message, type = 'info') {
        const entry = { message, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
        this.history.unshift(entry);
        this.emit('log', entry);
    }

    startNewHand() {
        const activePlayers = this.players.filter(p => p.chips > 0);
        if (activePlayers.length < 2) {
            this.log('Not enough players with chips to start a hand!', 'alert');
            return;
        }

        if (this.players[0].chips <= 0) {
            this.emit('playerBusted');
            return;
        }

        this.handInProgress = true;
        this.deck.reset();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.currentRound = 'PREFLOP';

        // Reset player states for new hand
        this.players.forEach(p => {
            p.holeCards = [];
            p.currentBet = 0;
            p.hasActed = false;
            p.folded = p.chips <= 0;
            p.allIn = false;
        });

        // Rotate dealer button to next player with chips
        do {
            this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        } while (this.players[this.dealerIndex].chips <= 0);

        this.log(`--- Hand Started. Dealer: ${this.players[this.dealerIndex].name} ---`, 'header');

        // Post Blinds
        this.postBlinds();

        // Deal 2 hole cards to each active player
        for (let i = 0; i < 2; i++) {
            this.players.forEach(player => {
                if (!player.folded) {
                    player.holeCards.push(this.deck.deal());
                }
            });
        }

        this.emit('handStarted');
        this.emit('cardsDealt');

        // Preflop action begins left of Big Blind (Under The Gun)
        const sbIndex = this.getNextActiveIndex(this.dealerIndex);
        const bbIndex = this.getNextActiveIndex(sbIndex);
        this.activePlayerIndex = this.getNextActiveIndex(bbIndex);

        this.processCurrentTurn();
    }

    postBlinds() {
        const sbIndex = this.getNextActiveIndex(this.dealerIndex);
        const bbIndex = this.getNextActiveIndex(sbIndex);

        const sbPlayer = this.players[sbIndex];
        const bbPlayer = this.players[bbIndex];

        // Small blind
        const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
        sbPlayer.chips -= sbAmount;
        sbPlayer.currentBet = sbAmount;
        this.pot += sbAmount;
        if (sbPlayer.chips === 0) sbPlayer.allIn = true;
        this.log(`${sbPlayer.name} posts Small Blind: $${sbAmount}`, 'blind');

        // Big blind
        const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
        bbPlayer.chips -= bbAmount;
        bbPlayer.currentBet = bbAmount;
        this.pot += bbAmount;
        if (bbPlayer.chips === 0) bbPlayer.allIn = true;
        this.log(`${bbPlayer.name} posts Big Blind: $${bbAmount}`, 'blind');

        this.currentBet = this.bigBlind;
        this.minRaise = this.bigBlind;
    }

    getNextActiveIndex(fromIndex) {
        let index = (fromIndex + 1) % this.players.length;
        let count = 0;
        while ((this.players[index].folded || this.players[index].chips <= 0) && count < this.players.length) {
            index = (index + 1) % this.players.length;
            count++;
        }
        return index;
    }

    getNextPlayerToAct(fromIndex) {
        let next = (fromIndex + 1) % this.players.length;
        let checks = 0;
        while (checks < this.players.length) {
            const p = this.players[next];
            if (!p.folded && !p.allIn && p.chips > 0) {
                return next;
            }
            next = (next + 1) % this.players.length;
            checks++;
        }
        return next;
    }

    getRemainingPlayers() {
        return this.players.filter(p => !p.folded);
    }

    getCanActPlayers() {
        return this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);
    }

    isBettingRoundComplete() {
        const remaining = this.getRemainingPlayers();
        if (remaining.length <= 1) return true;

        const canAct = this.getCanActPlayers();

        // If no one can act anymore (all in), round is complete
        if (canAct.length === 0) {
            return true;
        }

        // If only 1 player can act and all others are all-in, verify bet matched
        if (canAct.length === 1 && this.players.filter(p => !p.folded && p.allIn).length > 0) {
            const highestBet = Math.max(...this.players.map(p => p.currentBet));
            return canAct[0].currentBet === highestBet || canAct[0].hasActed;
        }

        // Standard: Every player who can act MUST have acted at least once this round
        const allActed = canAct.every(p => p.hasActed);

        // AND every active player must have matched the current bet (or be all-in)
        const allBetsMatched = remaining.every(p => p.currentBet === this.currentBet || p.allIn);

        return allActed && allBetsMatched;
    }

    processCurrentTurn() {
        // 1. Check if all but one folded
        const remaining = this.getRemainingPlayers();
        if (remaining.length === 1) {
            this.handleLastPlayerStanding(remaining[0]);
            return;
        }

        // 2. Check if betting round is complete
        if (this.isBettingRoundComplete()) {
            this.advanceToNextRound();
            return;
        }

        // 3. Current active player
        const activePlayer = this.players[this.activePlayerIndex];

        // Skip if folded or all-in
        if (activePlayer.folded || activePlayer.allIn) {
            this.activePlayerIndex = this.getNextPlayerToAct(this.activePlayerIndex);
            this.processCurrentTurn();
            return;
        }

        this.emit('turnChanged', {
            player: activePlayer,
            currentBet: this.currentBet,
            minRaise: this.minRaise,
            pot: this.pot,
            round: this.currentRound
        });

        if (!activePlayer.isHuman) {
            // Natural thinking delay for AI
            setTimeout(() => {
                if (!this.handInProgress) return;
                const decision = PokerAI.decide(activePlayer, {
                    currentBet: this.currentBet,
                    minRaise: this.minRaise,
                    pot: this.pot,
                    communityCards: this.communityCards,
                    bigBlind: this.bigBlind
                });
                this.executeAction(activePlayer, decision.action, decision.amount);
            }, 800 + Math.random() * 500);
        }
    }

    executeAction(player, action, amount = 0) {
        const toCall = this.currentBet - player.currentBet;
        player.hasActed = true;

        switch (action) {
            case 'fold':
                player.folded = true;
                this.log(`${player.name} folds`, 'fold');
                break;

            case 'check':
                this.log(`${player.name} checks`, 'check');
                break;

            case 'call': {
                const callAmount = Math.min(toCall, player.chips);
                player.chips -= callAmount;
                player.currentBet += callAmount;
                this.pot += callAmount;
                if (player.chips === 0) player.allIn = true;
                this.log(`${player.name} calls $${callAmount}`, 'call');
                break;
            }

            case 'bet':
            case 'raise': {
                const addAmount = Math.min(amount, player.chips);
                player.chips -= addAmount;
                player.currentBet += addAmount;
                this.pot += addAmount;

                const raiseOverCurrent = player.currentBet - this.currentBet;
                this.minRaise = Math.max(this.bigBlind, raiseOverCurrent);
                this.currentBet = player.currentBet;

                // When someone bets or raises, all other active players must respond again!
                this.players.forEach(p => {
                    if (p.id !== player.id && !p.folded && !p.allIn) {
                        p.hasActed = false;
                    }
                });

                if (player.chips === 0) player.allIn = true;
                const actionLabel = this.currentRound !== 'PREFLOP' && toCall === 0 ? 'bets' : 'raises to';
                this.log(`${player.name} ${actionLabel} $${player.currentBet}`, 'raise');
                break;
            }

            case 'all-in': {
                const allInAmount = player.chips;
                player.chips = 0;
                player.currentBet += allInAmount;
                this.pot += allInAmount;
                player.allIn = true;

                if (player.currentBet > this.currentBet) {
                    const raiseOverCurrent = player.currentBet - this.currentBet;
                    this.minRaise = Math.max(this.bigBlind, raiseOverCurrent);
                    this.currentBet = player.currentBet;

                    // Require everyone else to act on the all-in raise
                    this.players.forEach(p => {
                        if (p.id !== player.id && !p.folded && !p.allIn) {
                            p.hasActed = false;
                        }
                    });
                }
                this.log(`${player.name} goes ALL-IN for $${allInAmount}!`, 'allin');
                break;
            }
        }

        this.emit('playerActed', { player, action, amount });

        // Advance to next active player
        this.activePlayerIndex = this.getNextPlayerToAct(player.id);
        this.processCurrentTurn();
    }

    advanceToNextRound() {
        // Collect bets into the pot and reset current round bets
        this.players.forEach(p => {
            p.currentBet = 0;
            p.hasActed = false;
        });
        this.currentBet = 0;
        this.minRaise = this.bigBlind;

        // Postflop action starts with first active player seated to the left of the dealer button
        this.activePlayerIndex = this.getNextPlayerToAct(this.dealerIndex);

        const canActPlayers = this.getCanActPlayers();
        const allInRemaining = this.players.filter(p => !p.folded && p.allIn).length;

        if (this.currentRound === 'PREFLOP') {
            this.currentRound = 'FLOP';
            this.deck.deal(); // Burn card
            const c1 = this.deck.deal();
            const c2 = this.deck.deal();
            const c3 = this.deck.deal();
            this.communityCards.push(c1, c2, c3);
            this.log('--- Flop Dealt (3 cards) ---', 'round');
            this.emit('communityCardsDealt', { round: 'FLOP', cards: this.communityCards });
        } else if (this.currentRound === 'FLOP') {
            this.currentRound = 'TURN';
            this.deck.deal(); // Burn card
            const c4 = this.deck.deal();
            this.communityCards.push(c4);
            this.log('--- Turn Dealt (4th card) ---', 'round');
            this.emit('communityCardsDealt', { round: 'TURN', cards: this.communityCards });
        } else if (this.currentRound === 'TURN') {
            this.currentRound = 'RIVER';
            this.deck.deal(); // Burn card
            const c5 = this.deck.deal();
            this.communityCards.push(c5);
            this.log('--- River Dealt (5th card) ---', 'round');
            this.emit('communityCardsDealt', { round: 'RIVER', cards: this.communityCards });
        } else if (this.currentRound === 'RIVER') {
            this.showdown();
            return;
        }

        // If players can't bet because they are all-in, run out board with suspenseful delays
        if (canActPlayers.length <= 1 && allInRemaining > 0) {
            setTimeout(() => {
                if (this.handInProgress) this.advanceToNextRound();
            }, 1400);
        } else {
            // Give players a brief moment to see the new card before prompting the first bet
            setTimeout(() => {
                if (this.handInProgress) this.processCurrentTurn();
            }, 600);
        }
    }

    handleLastPlayerStanding(winner) {
        winner.chips += this.pot;
        this.log(`Everyone folded. ${winner.name} wins the pot ($${this.pot})!`, 'win');
        this.emit('handComplete', {
            winners: [winner],
            potWon: this.pot,
            reason: 'All opponents folded'
        });
        this.handInProgress = false;
    }

    showdown() {
        this.currentRound = 'SHOWDOWN';
        this.handInProgress = false;
        const remaining = this.getRemainingPlayers();

        // Evaluate all remaining hands
        const evaluations = remaining.map(player => ({
            player,
            hand: evaluateHand([...player.holeCards, ...this.communityCards])
        }));

        // Sort descending by score
        evaluations.sort((a, b) => compareScores(b.hand.score, a.hand.score));

        // Detect winners (split pot in case of exact tie)
        const bestScore = evaluations[0].hand.score;
        const winners = evaluations.filter(e => compareScores(e.hand.score, bestScore) === 0);

        const splitAmount = Math.floor(this.pot / winners.length);
        winners.forEach(w => {
            w.player.chips += splitAmount;
        });

        const winnerNames = winners.map(w => w.player.name).join(' & ');
        const handDescription = winners[0].hand.name;

        this.log(`Showdown! ${winnerNames} wins with ${handDescription}! (Pot: $${this.pot})`, 'win');

        this.emit('showdown', {
            evaluations,
            winners: winners.map(w => w.player),
            winningHand: winners[0].hand,
            pot: this.pot,
            splitAmount
        });

        this.emit('handComplete', {
            winners: winners.map(w => w.player),
            potWon: this.pot,
            winningHand: winners[0].hand,
            reason: handDescription
        });
    }

    rebuyHuman(amount = 1000) {
        this.players[0].chips = amount;
        this.log(`You re-bought for $${amount}! Welcome back to the table.`, 'info');
        this.emit('rebuy');
    }
}

if (typeof module !== 'undefined') {
    module.exports = { PokerGame };
}
