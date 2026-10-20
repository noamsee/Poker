/**
 * Texas Hold'em Hand Evaluator
 * Evaluates best 5-card poker hand from up to 7 cards.
 */

const HAND_RANKS = {
    STRAIGHT_FLUSH: 9,
    FOUR_OF_A_KIND: 8,
    FULL_HOUSE: 7,
    FLUSH: 6,
    STRAIGHT: 5,
    THREE_OF_A_KIND: 4,
    TWO_PAIR: 3,
    ONE_PAIR: 2,
    HIGH_CARD: 1
};

const HAND_NAMES = {
    9: 'Straight Flush',
    8: 'Four of a Kind',
    7: 'Full House',
    6: 'Flush',
    5: 'Straight',
    4: 'Three of a Kind',
    3: 'Two Pair',
    2: 'One Pair',
    1: 'High Card'
};

const VALUE_NAMES = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: '10',
    9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2'
};

const VALUE_PLURALS = {
    14: 'Aces', 13: 'Kings', 12: 'Queens', 11: 'Jacks', 10: '10s',
    9: '9s', 8: '8s', 7: '7s', 6: '6s', 5: '5s', 4: '4s', 3: '3s', 2: '2s'
};

function getCombinations(arr, k) {
    const results = [];
    function backtrack(start, combo) {
        if (combo.length === k) {
            results.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            backtrack(i + 1, combo);
            combo.pop();
        }
    }
    backtrack(0, []);
    return results;
}

/**
 * Evaluates a single 5-card hand.
 * card: { rank: 2..14, suit: '♠'|'♥'|'♦'|'♣' }
 */
function evaluate5CardHand(cards) {
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    // Check straight (including A-2-3-4-5 wheel)
    let isStraight = false;
    let straightHigh = 0;

    const uniqueRanks = [...new Set(ranks)];
    if (uniqueRanks.length === 5) {
        if (ranks[0] - ranks[4] === 4) {
            isStraight = true;
            straightHigh = ranks[0];
        } else if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
            isStraight = true;
            straightHigh = 5; // 5-high straight
        }
    }

    // Rank counts
    const counts = {};
    ranks.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    const countPairs = Object.entries(counts).map(([rank, count]) => ({
        rank: parseInt(rank),
        count
    })).sort((a, b) => b.count - a.count || b.rank - a.rank);

    // 1. Straight Flush / Royal Flush
    if (isFlush && isStraight) {
        const isRoyal = straightHigh === 14;
        return {
            category: HAND_RANKS.STRAIGHT_FLUSH,
            score: [HAND_RANKS.STRAIGHT_FLUSH, straightHigh],
            cards: sorted,
            name: isRoyal ? 'Royal Flush' : `Straight Flush (${VALUE_NAMES[straightHigh]} High)`
        };
    }

    // 2. Four of a kind
    if (countPairs[0].count === 4) {
        return {
            category: HAND_RANKS.FOUR_OF_A_KIND,
            score: [HAND_RANKS.FOUR_OF_A_KIND, countPairs[0].rank, countPairs[1].rank],
            cards: sorted,
            name: `Four of a Kind (${VALUE_PLURALS[countPairs[0].rank]})`
        };
    }

    // 3. Full house
    if (countPairs[0].count === 3 && countPairs[1].count === 2) {
        return {
            category: HAND_RANKS.FULL_HOUSE,
            score: [HAND_RANKS.FULL_HOUSE, countPairs[0].rank, countPairs[1].rank],
            cards: sorted,
            name: `Full House (${VALUE_PLURALS[countPairs[0].rank]} full of ${VALUE_PLURALS[countPairs[1].rank]})`
        };
    }

    // 4. Flush
    if (isFlush) {
        return {
            category: HAND_RANKS.FLUSH,
            score: [HAND_RANKS.FLUSH, ...ranks],
            cards: sorted,
            name: `Flush (${VALUE_NAMES[ranks[0]]} High)`
        };
    }

    // 5. Straight
    if (isStraight) {
        return {
            category: HAND_RANKS.STRAIGHT,
            score: [HAND_RANKS.STRAIGHT, straightHigh],
            cards: sorted,
            name: `Straight (${VALUE_NAMES[straightHigh]} High)`
        };
    }

    // 6. Three of a kind
    if (countPairs[0].count === 3) {
        return {
            category: HAND_RANKS.THREE_OF_A_KIND,
            score: [HAND_RANKS.THREE_OF_A_KIND, countPairs[0].rank, countPairs[1].rank, countPairs[2].rank],
            cards: sorted,
            name: `Three of a Kind (${VALUE_PLURALS[countPairs[0].rank]})`
        };
    }

    // 7. Two Pair
    if (countPairs[0].count === 2 && countPairs[1].count === 2) {
        const highPair = Math.max(countPairs[0].rank, countPairs[1].rank);
        const lowPair = Math.min(countPairs[0].rank, countPairs[1].rank);
        const kicker = countPairs[2].rank;
        return {
            category: HAND_RANKS.TWO_PAIR,
            score: [HAND_RANKS.TWO_PAIR, highPair, lowPair, kicker],
            cards: sorted,
            name: `Two Pair (${VALUE_PLURALS[highPair]} and ${VALUE_PLURALS[lowPair]})`
        };
    }

    // 8. One Pair
    if (countPairs[0].count === 2) {
        const pair = countPairs[0].rank;
        const kickers = countPairs.slice(1).map(c => c.rank).sort((a, b) => b - a);
        return {
            category: HAND_RANKS.ONE_PAIR,
            score: [HAND_RANKS.ONE_PAIR, pair, ...kickers],
            cards: sorted,
            name: `One Pair of ${VALUE_PLURALS[pair]}`
        };
    }

    // 9. High Card
    return {
        category: HAND_RANKS.HIGH_CARD,
        score: [HAND_RANKS.HIGH_CARD, ...ranks],
        cards: sorted,
        name: `High Card (${VALUE_NAMES[ranks[0]]})`
    };
}

/**
 * Compare two scores array element by element.
 * Returns >0 if a beats b, <0 if b beats a, 0 if tie.
 */
function compareScores(scoreA, scoreB) {
    for (let i = 0; i < Math.max(scoreA.length, scoreB.length); i++) {
        const a = scoreA[i] || 0;
        const b = scoreB[i] || 0;
        if (a !== b) return a - b;
    }
    return 0;
}

/**
 * Evaluates the best 5-card hand out of 5 to 7 cards.
 */
function evaluateHand(allCards) {
    if (!allCards || allCards.length < 5) {
        return null;
    }

    if (allCards.length === 5) {
        return evaluate5CardHand(allCards);
    }

    const combos = getCombinations(allCards, 5);
    let bestHand = null;

    for (const combo of combos) {
        const evaluated = evaluate5CardHand(combo);
        if (!bestHand || compareScores(evaluated.score, bestHand.score) > 0) {
            bestHand = evaluated;
        }
    }

    return bestHand;
}

if (typeof module !== 'undefined') {
    module.exports = { evaluateHand, compareScores, HAND_RANKS, HAND_NAMES, VALUE_NAMES, VALUE_PLURALS };
}
