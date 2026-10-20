/**
 * AI Decision Engine for Texas Hold'em
 */

class PokerAI {
    /**
     * @param {Object} player - AI player object
     * @param {Object} gameState - Current table state
     * @returns {Object} { action: 'fold'|'check'|'call'|'raise'|'all-in', amount: number }
     */
    static decide(player, gameState) {
        const { currentBet, minRaise, pot, communityCards } = gameState;
        const callAmount = currentBet - player.currentBet;
        const canCheck = callAmount === 0;
        const personality = player.personality || 'balanced';

        // Preflop vs Postflop
        const isPreflop = communityCards.length === 0;
        let handStrength = 0;

        if (isPreflop) {
            handStrength = this.evaluatePreflopStrength(player.holeCards);
        } else {
            const evaluation = evaluateHand([...player.holeCards, ...communityCards]);
            handStrength = this.normalizeHandStrength(evaluation, communityCards.length);
        }

        // Adjust strength based on personality
        if (personality === 'aggressive') {
            handStrength += 0.15; // plays bolder
        } else if (personality === 'conservative') {
            handStrength -= 0.10; // plays tighter
        }

        // Pot odds calculation
        const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;

        // Decision logic
        if (canCheck) {
            // Can check for free
            if (handStrength > 0.75 && Math.random() < 0.8) {
                // Good hand: bet
                const betSize = this.calculateBetSize(player, gameState, handStrength);
                return { action: 'bet', amount: betSize };
            } else if (personality === 'aggressive' && Math.random() < 0.35) {
                // Bluff bet
                const betSize = Math.min(player.chips, Math.max(minRaise, Math.floor(pot * 0.5)));
                return { action: 'bet', amount: betSize };
            }
            return { action: 'check', amount: 0 };
        } else {
            // Faced with a bet/raise
            if (callAmount >= player.chips) {
                // Call means going all-in
                if (handStrength > 0.70 || (handStrength > 0.55 && potOdds < 0.3)) {
                    return { action: 'all-in', amount: player.chips };
                }
                return { action: 'fold', amount: 0 };
            }

            // Strong hand: Raise or All-In
            if (handStrength > 0.82 && Math.random() < 0.75) {
                const raiseAmount = this.calculateRaiseSize(player, gameState, handStrength);
                if (raiseAmount >= player.chips) {
                    return { action: 'all-in', amount: player.chips };
                }
                return { action: 'raise', amount: raiseAmount };
            }

            // Decent hand: Call
            if (handStrength >= potOdds * 1.5 || handStrength > 0.45) {
                return { action: 'call', amount: callAmount };
            }

            // Occasional float/call if small bet
            if (callAmount <= gameState.bigBlind * 2 && handStrength > 0.3 && Math.random() < 0.4) {
                return { action: 'call', amount: callAmount };
            }

            // Otherwise fold
            return { action: 'fold', amount: 0 };
        }
    }

    static evaluatePreflopStrength(cards) {
        if (!cards || cards.length < 2) return 0.2;
        const [c1, c2] = cards;
        const highRank = Math.max(c1.rank, c2.rank);
        const lowRank = Math.min(c1.rank, c2.rank);
        const isPair = c1.rank === c2.rank;
        const isSuited = c1.suit === c2.suit;
        const gap = highRank - lowRank;

        let score = 0;
        if (isPair) {
            score = 0.5 + (highRank / 14) * 0.48; // Pocket pairs: 0.56 (22) up to 0.98 (AA)
        } else {
            score = (highRank / 14) * 0.4 + (lowRank / 14) * 0.25;
            if (isSuited) score += 0.08;
            if (gap <= 2) score += 0.05; // Connected cards
        }
        return Math.min(0.99, Math.max(0.1, score));
    }

    static normalizeHandStrength(evaluation, communityCount) {
        if (!evaluation) return 0.2;
        const category = evaluation.category;
        // Map 1..9 category to 0.2 .. 0.99
        let base = (category - 1) / 8.0; // 0 for High Card, 1.0 for Straight Flush
        
        // Add kicker weighting
        if (evaluation.score && evaluation.score.length > 1) {
            base += (evaluation.score[1] / 14.0) * 0.12;
        }

        return Math.min(0.99, Math.max(0.15, base));
    }

    static calculateBetSize(player, gameState, strength) {
        const { pot, bigBlind, minRaise } = gameState;
        let fraction = 0.5; // Half pot
        if (strength > 0.85) fraction = 0.75;
        if (strength > 0.92) fraction = 1.0;

        let target = Math.floor(pot * fraction);
        target = Math.max(target, minRaise, bigBlind);
        return Math.min(player.chips, target);
    }

    static calculateRaiseSize(player, gameState, strength) {
        const { currentBet, minRaise, pot } = gameState;
        const callAmount = currentBet - player.currentBet;
        let raiseBy = Math.max(minRaise, Math.floor(pot * 0.6));
        let total = callAmount + raiseBy;
        return Math.min(player.chips, total);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { PokerAI };
}
