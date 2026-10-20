/**
 * Deck & Card Utilities for Texas Hold'em
 */

const SUITS = [
    { symbol: '♠', name: 'spades', color: 'black' },
    { symbol: '♥', name: 'hearts', color: 'red' },
    { symbol: '♦', name: 'diamonds', color: 'red' },
    { symbol: '♣', name: 'clubs', color: 'black' }
];

const RANKS = [
    { rank: 2, label: '2' },
    { rank: 3, label: '3' },
    { rank: 4, label: '4' },
    { rank: 5, label: '5' },
    { rank: 6, label: '6' },
    { rank: 7, label: '7' },
    { rank: 8, label: '8' },
    { rank: 9, label: '9' },
    { rank: 10, label: '10' },
    { rank: 11, label: 'J' },
    { rank: 12, label: 'Q' },
    { rank: 13, label: 'K' },
    { rank: 14, label: 'A' }
];

class Card {
    constructor(rank, suit) {
        this.rank = rank; // 2..14
        this.suit = suit.symbol;
        this.suitName = suit.name;
        this.color = suit.color;
        this.label = RANKS.find(r => r.rank === rank).label;
    }

    render(faceUp = true) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `poker-card ${this.color} ${faceUp ? 'face-up' : 'face-down'}`;

        if (!faceUp) {
            cardDiv.innerHTML = `
                <div class="card-inner">
                    <div class="card-back">
                        <div class="back-pattern"></div>
                    </div>
                </div>`;
            return cardDiv;
        }

        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-corner top-left">
                        <span class="card-rank">${this.label}</span>
                        <span class="card-suit">${this.suit}</span>
                    </div>
                    <div class="card-center">
                        <span class="center-suit">${this.suit}</span>
                    </div>
                    <div class="card-corner bottom-right">
                        <span class="card-rank">${this.label}</span>
                        <span class="card-suit">${this.suit}</span>
                    </div>
                </div>
            </div>`;
        return cardDiv;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const r of RANKS) {
                this.cards.push(new Card(r.rank, suit));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        if (this.cards.length === 0) {
            throw new Error('Deck is empty!');
        }
        return this.cards.pop();
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Card, Deck, SUITS, RANKS };
}
