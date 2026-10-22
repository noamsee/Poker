/**
 * Premium Casino Deck & Realistic SVG Card Renderer
 * Accurate pips, reversible royal court figures (J, Q, K), and authentic Ace of Spades
 */

const SUIT_SVGS = {
    spades: `<svg viewBox="0 0 100 110" class="suit-icon spade">
        <path d="M50 0 C45 35 10 50 10 75 C10 90 25 100 42 92 C44 91 46 94 45 108 L38 110 L62 110 L55 108 C54 94 56 91 58 92 C75 100 90 90 90 75 C90 50 55 35 50 0 Z" fill="currentColor"/>
    </svg>`,
    hearts: `<svg viewBox="0 0 100 100" class="suit-icon heart">
        <path d="M50 95 C15 65 0 45 0 26 C0 10 12 0 28 0 C38 0 46 6 50 14 C54 6 62 0 72 0 C88 0 100 10 100 26 C100 45 85 65 50 95 Z" fill="currentColor"/>
    </svg>`,
    diamonds: `<svg viewBox="0 0 100 115" class="suit-icon diamond">
        <path d="M50 0 L95 57.5 L50 115 L5 57.5 Z" fill="currentColor"/>
    </svg>`,
    clubs: `<svg viewBox="0 0 100 110" class="suit-icon club">
        <circle cx="50" cy="30" r="24" fill="currentColor"/>
        <circle cx="28" cy="62" r="24" fill="currentColor"/>
        <circle cx="72" cy="62" r="24" fill="currentColor"/>
        <path d="M44 65 L56 65 L60 110 L40 110 Z" fill="currentColor"/>
        <circle cx="50" cy="52" r="10" fill="currentColor"/>
    </svg>`
};

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

// Helper to generate court card illustration
function getCourtIllustration(rankLabel, suitName, color) {
    const primaryColor = color === 'red' ? '#b91c1c' : '#1e293b';
    const accentGold = '#d97706';
    const faceFill = '#fef3c7';

    let title = 'JACK';
    let crown = `<polygon points="35,32 50,42 65,32 60,50 40,50" fill="${accentGold}" stroke="#78350f" stroke-width="1.5"/>`;

    if (rankLabel === 'Q') {
        title = 'QUEEN';
        crown = `
            <path d="M30 46 Q50 30 70 46 L67 52 L33 52 Z" fill="${accentGold}" stroke="#78350f" stroke-width="1.5"/>
            <circle cx="34" cy="34" r="3" fill="${accentGold}"/>
            <circle cx="50" cy="27" r="3.5" fill="${accentGold}"/>
            <circle cx="66" cy="34" r="3" fill="${accentGold}"/>
        `;
    } else if (rankLabel === 'K') {
        title = 'KING';
        crown = `
            <path d="M28 48 L32 26 L42 36 L50 20 L58 36 L68 26 L72 48 Z" fill="${accentGold}" stroke="#78350f" stroke-width="1.5"/>
            <circle cx="50" cy="18" r="3" fill="#dc2626"/>
        `;
    }

    return `
    <div class="court-art">
        <svg viewBox="0 0 100 130" class="court-svg">
            <!-- Double-ended court frame -->
            <rect x="5" y="5" width="90" height="120" rx="4" fill="none" stroke="${primaryColor}" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="3,2"/>
            
            <!-- Top Half Figure -->
            <g>
                <!-- Robe & Shoulders -->
                <path d="M18 64 C20 48 32 46 50 46 C68 46 80 48 82 64 Z" fill="${primaryColor}"/>
                <path d="M28 64 L50 50 L72 64 Z" fill="${accentGold}" opacity="0.8"/>
                <!-- Neck & Face -->
                <rect x="44" y="42" width="12" height="10" fill="${faceFill}"/>
                <ellipse cx="50" cy="38" rx="14" ry="15" fill="${faceFill}" stroke="#78350f" stroke-width="1"/>
                <!-- Eyes & Beard/Mouth -->
                <circle cx="45" cy="36" r="1.5" fill="#1f2937"/>
                <circle cx="55" cy="36" r="1.5" fill="#1f2937"/>
                <path d="M47 43 Q50 45 53 43" stroke="#92400e" stroke-width="1" fill="none"/>
                ${rankLabel === 'K' ? '<path d="M43 41 Q50 45 57 41 L55 49 Q50 52 45 49 Z" fill="#78350f"/>' : ''}
                <!-- Crown / Hair -->
                ${crown}
            </g>

            <!-- Center Divider Ribbon -->
            <g transform="translate(0, 65)">
                <line x1="5" y1="0" x2="95" y2="0" stroke="${accentGold}" stroke-width="1.5"/>
                <circle cx="50" cy="0" r="10" fill="#fff" stroke="${accentGold}" stroke-width="1.5"/>
                <g transform="translate(44, -6) scale(0.12)">
                    ${SUIT_SVGS[suitName]}
                </g>
            </g>

            <!-- Bottom Half (Inverted Figure) -->
            <g transform="rotate(180 50 65)">
                <path d="M18 64 C20 48 32 46 50 46 C68 46 80 48 82 64 Z" fill="${primaryColor}"/>
                <path d="M28 64 L50 50 L72 64 Z" fill="${accentGold}" opacity="0.8"/>
                <rect x="44" y="42" width="12" height="10" fill="${faceFill}"/>
                <ellipse cx="50" cy="38" rx="14" ry="15" fill="${faceFill}" stroke="#78350f" stroke-width="1"/>
                <circle cx="45" cy="36" r="1.5" fill="#1f2937"/>
                <circle cx="55" cy="36" r="1.5" fill="#1f2937"/>
                <path d="M47 43 Q50 45 53 43" stroke="#92400e" stroke-width="1" fill="none"/>
                ${rankLabel === 'K' ? '<path d="M43 41 Q50 45 57 41 L55 49 Q50 52 45 49 Z" fill="#78350f"/>' : ''}
                ${crown}
            </g>
        </svg>
    </div>`;
}

// Generate clean, modern Pokerist-style card layouts (single bold center suit)
function getPipGrid(rank, suitName) {
    const suitSvg = SUIT_SVGS[suitName];

    // Ace special case
    if (rank === 14) {
        if (suitName === 'spades') {
            return `
            <div class="ace-center ornate-spade">
                <svg viewBox="0 0 100 120" class="ornate-spade-svg">
                    <defs>
                        <linearGradient id="goldAceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1e293b"/>
                            <stop offset="50%" stop-color="#0f172a"/>
                            <stop offset="100%" stop-color="#334155"/>
                        </linearGradient>
                    </defs>
                    <path d="M50 5 C44 38 12 52 12 76 C12 92 27 100 42 92 C44 91 46 95 45 110 L35 112 L65 112 L55 110 C54 95 56 91 58 92 C73 100 88 92 88 76 C88 52 56 38 50 5 Z" fill="url(#goldAceGrad)" stroke="#d97706" stroke-width="2"/>
                    <circle cx="50" cy="55" r="9" fill="#d97706"/>
                    <circle cx="50" cy="55" r="6" fill="#0f172a"/>
                </svg>
            </div>`;
        }
        return `<div class="ace-center"><div class="large-suit-pip">${suitSvg}</div></div>`;
    }

    // Numbered cards 2 to 10: Single bold central suit (Pokerist style)
    return `<div class="clean-card-center"><div class="card-main-suit">${suitSvg}</div></div>`;
}

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
                        <div class="back-inner-frame">
                            <div class="back-filigree-pattern"></div>
                            <div class="back-seal">
                                <span>♠</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            return cardDiv;
        }

        const isCourt = this.rank >= 11 && this.rank <= 13;
        const middleContent = isCourt 
            ? getCourtIllustration(this.label, this.suitName, this.color)
            : getPipGrid(this.rank, this.suitName);

        const suitSvg = SUIT_SVGS[this.suitName];

        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <!-- Top Left Index -->
                    <div class="card-corner top-left">
                        <span class="card-rank">${this.label}</span>
                        <span class="card-corner-suit">${suitSvg}</span>
                    </div>

                    <!-- Center Artwork / Pips -->
                    <div class="card-body">
                        ${middleContent}
                    </div>

                    <!-- Bottom Right Index (Inverted) -->
                    <div class="card-corner bottom-right">
                        <span class="card-rank">${this.label}</span>
                        <span class="card-corner-suit">${suitSvg}</span>
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
