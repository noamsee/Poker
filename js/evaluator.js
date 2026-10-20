/**
 * Texas Hold'em Hand Evaluator & Real-Time Hand Power Engine
 * Evaluates best 5-card poker hand and computes hand power (0-100%) for preflop and postflop
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

function evaluate5CardHand(cards) {
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    let isStraight = false;
    let straightHigh = 0;

    const uniqueRanks = [...new Set(ranks)];
    if (uniqueRanks.length === 5) {
        if (ranks[0] - ranks[4] === 4) {
            isStraight = true;
            straightHigh = ranks[0];
        } else if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
            isStraight = true;
            straightHigh = 5;
        }
    }

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
            name: `Two Pair (${VALUE_PLURALS[highPair]} & ${VALUE_PLURALS[lowPair]})`
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

function compareScores(scoreA, scoreB) {
    for (let i = 0; i < Math.max(scoreA.length, scoreB.length); i++) {
        const a = scoreA[i] || 0;
        const b = scoreB[i] || 0;
        if (a !== b) return a - b;
    }
    return 0;
}

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

/**
 * Real-Time Hand Power Meter Calculator
 * Returns: { percent: number, tier: string, color: string, name: string }
 */
function calculateHandPower(holeCards, communityCards = []) {
    if (!holeCards || holeCards.length < 2) {
        return { percent: 0, tier: 'NO CARDS', color: '#64748b', name: '—' };
    }

    // 1. PRE-FLOP (Only 2 cards)
    if (!communityCards || communityCards.length === 0) {
        const [c1, c2] = holeCards;
        const highRank = Math.max(c1.rank, c2.rank);
        const lowRank = Math.min(c1.rank, c2.rank);
        const isPair = c1.rank === c2.rank;
        const isSuited = c1.suit === c2.suit;
        const gap = highRank - lowRank;

        let pct = 0;
        let name = '';

        if (isPair) {
            name = `Pocket Pair of ${VALUE_PLURALS[highRank]}`;
            // 22 = 50%, AA = 95%
            pct = 50 + Math.round(((highRank - 2) / 12) * 45);
        } else {
            name = `${VALUE_NAMES[highRank]}-${VALUE_NAMES[lowRank]}${isSuited ? 's' : 'o'}`;
            pct = 15 + Math.round((highRank / 14) * 35 + (lowRank / 14) * 20);
            if (isSuited) pct += 8;
            if (gap <= 2) pct += 5;
        }

        pct = Math.min(96, Math.max(12, pct));
        return getPowerTierData(pct, name);
    }

    // 2. POST-FLOP (5, 6, or 7 cards)
    const allCards = [...holeCards, ...communityCards];
    const evaluated = evaluateHand(allCards);
    if (!evaluated) {
        return { percent: 20, tier: 'WEAK', color: '#ef4444', name: 'Evaluating...' };
    }

    const cat = evaluated.category;
    let pct = 0;

    switch (cat) {
        case HAND_RANKS.STRAIGHT_FLUSH:
            pct = evaluated.name.includes('Royal') ? 100 : 98;
            break;
        case HAND_RANKS.FOUR_OF_A_KIND:
            pct = 95 + Math.round((evaluated.score[1] / 14) * 3);
            break;
        case HAND_RANKS.FULL_HOUSE:
            pct = 90 + Math.round((evaluated.score[1] / 14) * 4);
            break;
        case HAND_RANKS.FLUSH:
            pct = 82 + Math.round((evaluated.score[1] / 14) * 6);
            break;
        case HAND_RANKS.STRAIGHT:
            pct = 75 + Math.round((evaluated.score[1] / 14) * 6);
            break;
        case HAND_RANKS.THREE_OF_A_KIND:
            pct = 65 + Math.round((evaluated.score[1] / 14) * 8);
            break;
        case HAND_RANKS.TWO_PAIR:
            pct = 52 + Math.round((evaluated.score[1] / 14) * 11);
            break;
        case HAND_RANKS.ONE_PAIR:
            pct = 35 + Math.round((evaluated.score[1] / 14) * 15);
            break;
        case HAND_RANKS.HIGH_CARD:
        default:
            pct = 12 + Math.round((evaluated.score[1] / 14) * 18);
            break;
    }

    return getPowerTierData(pct, evaluated.name);
}

function getPowerTierData(percent, name) {
    let tier = 'WEAK';
    let color = '#ef4444'; // Red

    if (percent >= 90) {
        tier = 'MONSTER HAND';
        color = '#ec4899'; // Vibrant Pink / Gold
    } else if (percent >= 75) {
        tier = 'VERY STRONG';
        color = '#10b981'; // Emerald
    } else if (percent >= 60) {
        tier = 'STRONG';
        color = '#22c55e'; // Green
    } else if (percent >= 40) {
        tier = 'MODERATE';
        color = '#f59e0b'; // Amber / Yellow
    } else {
        tier = 'WEAK HAND';
        color = '#ef4444'; // Red
    }

    return { percent, tier, color, name };
}

if (typeof module !== 'undefined') {
    module.exports = { 
        evaluateHand, 
        compareScores, 
        calculateHandPower,
        HAND_RANKS, 
        HAND_NAMES, 
        VALUE_NAMES, 
        VALUE_PLURALS 
    };
}
