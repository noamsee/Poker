/**
 * Texas Hold'em Game State Controller
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
        this.lastRaiserIndex = -1;
        this.handInProgress = false;

        this.players = [
            { id: 0, name: 'You', isHuman: true, chips: 1000, holeCards: [], currentBet: 0, folded: false, allIn: false, avatar: '👤' },
            { id: 1, name: 'Alex', isHuman: false, personality: 'aggressive', chips: 1000, holeCards: [], currentBet: 0, folded: false, allIn: false, avatar: '🦊' },
            { id: 2, name: 'Claire', isHuman: false, personality: 'conservative', chips: 1000, holeCards: [], currentBet: 0, folded: false, allIn: false, avatar: '🦉' },
            { id: 3, name: 'Tom', isHuman: false, personality: 'balanced', chips: 1000, holeCards: [], currentBet: 0, folded: false, allIn: false, avatar: '🐺' }
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
        // Filter out players with 0 chips
        const activePlayers = this.players.filter(p => p.chips > 0);
        if (activePlayers.length < 2) {
            this.log('Not enough players with chips to start a hand!', 'alert');
            return;
        }

        // Check if human has busted
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

        // Reset player hand states
        this.players.forEach(p => {
            p.holeCards = [];
            p.currentBet = 0;
            p.folded = p.chips <= 0;
            p.allIn = false;
        });

        // Rotate dealer button
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

        // Preflop action begins left of Big Blind
        const bbIndex = this.getNextActiveIndex((this.dealerIndex + 1) % this.players.length);
        const firstToAct = this.getNextActiveIndex(bbIndex);
        this.activePlayerIndex = firstToAct;
        this.lastRaiserIndex = bbIndex; // action closes when reaches BB if no raise

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

    getActivePlayersCount() {
        return this.players.filter(p => !p.folded && p.chips > 0).length;
    }

    getRemainingPlayers() {
        return this.players.filter(p => !p.folded);
    }

    processCurrentTurn() {
        // Check if only one player remaining (everyone else folded)
        const remaining = this.getRemainingPlayers();
        if (remaining.length === 1) {
            this.handleLastPlayerStanding(remaining[0]);
            return;
        }

        // Check if round should advance
        if (this.isBettingRoundComplete()) {
            this.advanceToNextRound();
            return;
        }

        const activePlayer = this.players[this.activePlayerIndex];

        // Skip players who are all-in or folded
        if (activePlayer.folded || activePlayer.allIn) {
            this.activePlayerIndex = this.getNextActivePlayerToAct(this.activePlayerIndex);
            this.processCurrentTurn();
            return;
        }

        this.emit('turnChanged', {
            player: activePlayer,
            currentBet: this.currentBet,
            minRaise: this.minRaise,
            pot: this.pot
        });

        if (!activePlayer.isHuman) {
            // Trigger AI action after a slight natural delay
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
            }, 800 + Math.random() * 600);
        }
    }

    isBettingRoundComplete() {
        const canActPlayers = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);
        if (canActPlayers.length <= 1 && this.players.filter(p => !p.folded).some(p => p.allIn)) {
            // Everyone remaining is either all-in or only one player with chips left
            const highestBet = Math.max(...this.players.map(p => p.currentBet));
            return canActPlayers.every(p => p.currentBet === highestBet || p.chips === 0);
        }

        // Everyone who hasn't folded must have matched current bet or is all-in
        const activeUnfolded = this.players.filter(p => !p.folded);
        const allBetsMatched = activeUnfolded.every(p => p.currentBet === this.currentBet || p.allIn);

        return allBetsMatched && this.activePlayerIndex === this.lastRaiserIndex;
    }

    getNextActivePlayerToAct(fromIndex) {
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

    executeAction(player, action, amount = 0) {
        const toCall = this.currentBet - player.currentBet;

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
                this.lastRaiserIndex = player.id;

                if (player.chips === 0) player.allIn = true;
                this.log(`${player.name} ${action}s to $${player.currentBet}`, 'raise');
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
                    this.lastRaiserIndex = player.id;
                }
                this.log(`${player.name} goes ALL-IN for $${allInAmount}!`, 'allin');
                break;
            }
        }

        this.emit('playerActed', { player, action, amount });

        // Advance turn
        this.activePlayerIndex = this.getNextActivePlayerToAct(player.id);
        this.processCurrentTurn();
    }

    advanceToNextRound() {
        // Reset player round bets
        this.players.forEach(p => { p.currentBet = 0; });
        this.currentBet = 0;
        this.minRaise = this.bigBlind;

        // Reset first to act postflop (first active player after dealer)
        this.activePlayerIndex = this.getNextActivePlayerToAct(this.dealerIndex);
        this.lastRaiserIndex = this.activePlayerIndex;

        // Check if players can still bet, or if all are all-in
        const playersCanAct = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0).length;

        if (this.currentRound === 'PREFLOP') {
            this.currentRound = 'FLOP';
            this.deck.deal(); // Burn card
            this.communityCards.push(this.deck.deal(), this.deck.deal(), this.deck.deal());
            this.log('Dealing Flop: 3 community cards', 'round');
            this.emit('communityCardsDealt', { round: 'FLOP', cards: this.communityCards });
        } else if (this.currentRound === 'FLOP') {
            this.currentRound = 'TURN';
            this.deck.deal(); // Burn card
            this.communityCards.push(this.deck.deal());
            this.log('Dealing Turn: 4th community card', 'round');
            this.emit('communityCardsDealt', { round: 'TURN', cards: this.communityCards });
        } else if (this.currentRound === 'TURN') {
            this.currentRound = 'RIVER';
            this.deck.deal(); // Burn card
            this.communityCards.push(this.deck.deal());
            this.log('Dealing River: Final community card', 'round');
            this.emit('communityCardsDealt', { round: 'RIVER', cards: this.communityCards });
        } else if (this.currentRound === 'RIVER') {
            this.showdown();
            return;
        }

        if (playersCanAct <= 1) {
            // Auto-advance rest of the board if players can't bet
            setTimeout(() => this.advanceToNextRound(), 1200);
        } else {
            this.processCurrentTurn();
        }
    }

    handleLastPlayerStanding(winner) {
        winner.chips += this.pot;
        this.log(`Everyone folded. ${winner.name} wins the pot ($${this.pot})!`, 'win');
        this.emit('handComplete', {
            winner: [winner],
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

        // Detect winners (may be multiple in case of split pot)
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
