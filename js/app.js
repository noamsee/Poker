/**
 * UI Controller & Audio Synthesizer for Texas Hold'em
 */

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playCardSlide() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playChipSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }

    playWinSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

            gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.1);
            osc.stop(this.ctx.currentTime + idx * 0.1 + 0.25);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new PokerGame();
    const sfx = new SoundEffects();
    let handsPlayedCount = 0;

    // DOM Elements
    const dealerBtn = document.getElementById('dealer-btn');
    const tablePot = document.getElementById('table-pot');
    const communityCardsContainer = document.getElementById('community-cards');
    const dealerAnnouncement = document.getElementById('dealer-announcement');
    const userHandName = document.getElementById('user-hand-name');
    const headerBankroll = document.getElementById('header-bankroll');
    const headerHands = document.getElementById('header-hands');

    // Controls
    const btnFold = document.getElementById('btn-fold');
    const btnCheckCall = document.getElementById('btn-check-call');
    const btnRaise = document.getElementById('btn-raise');
    const raiseSlider = document.getElementById('raise-slider');
    const btnNewHand = document.getElementById('btn-new-hand');
    const btnRebuy = document.getElementById('btn-rebuy');

    // History Drawer
    const historyDrawer = document.getElementById('history-drawer');
    const btnToggleLog = document.getElementById('btn-toggle-log');
    const btnCloseLog = document.getElementById('btn-close-log');
    const logList = document.getElementById('log-list');

    // Result Modal
    const resultModal = document.getElementById('result-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const btnModalNext = document.getElementById('btn-modal-next');

    // Dealer Button Seat Coordinates
    const dealerPositions = {
        0: { bottom: '130px', left: '50%', transform: 'translateX(-110px)' }, // You
        1: { top: '100px', left: '50%', transform: 'translateX(-110px)' },    // Alex
        2: { top: '50%', left: '170px', transform: 'translateY(-60px)' },     // Claire
        3: { top: '50%', right: '170px', transform: 'translateY(-60px)' }     // Tom
    };

    function updateDealerButton(dealerIdx) {
        const pos = dealerPositions[dealerIdx];
        if (!pos) return;
        dealerBtn.style.top = pos.top || 'auto';
        dealerBtn.style.bottom = pos.bottom || 'auto';
        dealerBtn.style.left = pos.left || 'auto';
        dealerBtn.style.right = pos.right || 'auto';
        dealerBtn.style.transform = pos.transform || 'none';
    }

    function updateBankrollDisplay() {
        const humanChips = game.players[0].chips;
        headerBankroll.textContent = `$${humanChips.toLocaleString()}`;
        document.getElementById('chips-0').textContent = `$${humanChips.toLocaleString()}`;
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`chips-${i}`).textContent = `$${game.players[i].chips.toLocaleString()}`;
        }
    }

    function renderHoleCards(revealAll = false) {
        game.players.forEach(player => {
            const container = document.getElementById(`cards-${player.id}`);
            container.innerHTML = '';
            if (player.folded) return;

            player.holeCards.forEach(card => {
                const faceUp = player.isHuman || revealAll;
                const cardEl = card.render(faceUp);
                container.appendChild(cardEl);
            });
        });
        sfx.playCardSlide();
    }

    function renderCommunityCards(cards) {
        communityCardsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < cards.length) {
                const cardEl = cards[i].render(true);
                communityCardsContainer.appendChild(cardEl);
            } else {
                const slot = document.createElement('div');
                slot.className = 'community-card-slot';
                communityCardsContainer.appendChild(slot);
            }
        }
        if (cards.length > 0) sfx.playCardSlide();
    }

    function updatePot(amount) {
        tablePot.textContent = `$${amount.toLocaleString()}`;
    }

    function updateBets() {
        game.players.forEach(p => {
            const betEl = document.getElementById(`bet-${p.id}`);
            if (p.currentBet > 0) {
                betEl.style.display = 'flex';
                betEl.querySelector('.bet-val').textContent = `$${p.currentBet}`;
            } else {
                betEl.style.display = 'none';
            }
        });
    }

    function updateHandStrength() {
        const human = game.players[0];
        if (human.folded || human.holeCards.length === 0) {
            userHandName.textContent = '—';
            return;
        }

        const allCards = [...human.holeCards, ...game.communityCards];
        if (allCards.length >= 5) {
            const evalResult = evaluateHand(allCards);
            userHandName.textContent = evalResult ? evalResult.name : '—';
        } else if (human.holeCards.length === 2) {
            const [c1, c2] = human.holeCards;
            if (c1.rank === c2.rank) {
                userHandName.textContent = `Pocket Pair (${VALUE_PLURALS[c1.rank]})`;
            } else {
                userHandName.textContent = `${VALUE_NAMES[Math.max(c1.rank, c2.rank)]} High`;
            }
        }
    }

    function highlightActiveTurn(playerIdx) {
        for (let i = 0; i < 4; i++) {
            const seat = document.getElementById(`seat-${i}`);
            seat.classList.toggle('active-turn', i === playerIdx);
        }
    }

    function setPlayerStatus(player, text, className) {
        const statusTag = document.getElementById(`status-${player.id}`);
        statusTag.textContent = text;
        statusTag.className = `player-status-tag ${className}`;
        statusTag.style.display = 'block';

        if (text === 'FOLD') {
            document.getElementById(`seat-${player.id}`).classList.add('folded');
        }
    }

    function clearStatuses() {
        for (let i = 0; i < 4; i++) {
            const statusTag = document.getElementById(`status-${i}`);
            statusTag.style.display = 'none';
            document.getElementById(`seat-${i}`).classList.remove('folded');
        }
    }

    function updateHumanControls(isMyTurn) {
        const human = game.players[0];

        if (!isMyTurn || human.folded || human.allIn || human.chips <= 0) {
            btnFold.disabled = true;
            btnCheckCall.disabled = true;
            btnRaise.disabled = true;
            raiseSlider.disabled = true;
            return;
        }

        const callAmount = game.currentBet - human.currentBet;
        btnFold.disabled = false;

        // Check or Call
        if (callAmount === 0) {
            btnCheckCall.textContent = 'Check';
            btnCheckCall.disabled = false;
        } else {
            const actualCall = Math.min(callAmount, human.chips);
            btnCheckCall.textContent = `Call $${actualCall}`;
            btnCheckCall.disabled = false;
        }

        // Raise Setup
        const minToRaise = game.currentBet + game.minRaise;
        const canRaise = human.chips > callAmount;

        if (canRaise) {
            raiseSlider.disabled = false;
            btnRaise.disabled = false;

            const sliderMin = Math.min(minToRaise, human.chips + human.currentBet);
            const sliderMax = human.chips + human.currentBet;

            raiseSlider.min = sliderMin;
            raiseSlider.max = sliderMax;
            raiseSlider.value = sliderMin;
            updateRaiseButtonLabel(sliderMin);
        } else {
            raiseSlider.disabled = true;
            btnRaise.disabled = true;
            btnRaise.textContent = 'Raise';
        }
    }

    function updateRaiseButtonLabel(amount) {
        const human = game.players[0];
        if (amount >= human.chips + human.currentBet) {
            btnRaise.textContent = `All-In ($${human.chips + human.currentBet})`;
        } else {
            btnRaise.textContent = `Raise to $${amount}`;
        }
    }

    // Raise Slider listener
    raiseSlider.addEventListener('input', (e) => {
        updateRaiseButtonLabel(parseInt(e.target.value));
    });

    // Preset buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const human = game.players[0];
            if (raiseSlider.disabled) return;

            const preset = btn.dataset.preset;
            const currentTotal = human.chips + human.currentBet;
            let target = parseInt(raiseSlider.min);

            if (preset === 'min') {
                target = parseInt(raiseSlider.min);
            } else if (preset === 'half-pot') {
                target = Math.max(parseInt(raiseSlider.min), game.currentBet + Math.floor(game.pot * 0.5));
            } else if (preset === 'pot') {
                target = Math.max(parseInt(raiseSlider.min), game.currentBet + game.pot);
            } else if (preset === 'all-in') {
                target = currentTotal;
            }

            target = Math.min(target, currentTotal);
            raiseSlider.value = target;
            updateRaiseButtonLabel(target);
        });
    });

    // Human Action Handlers
    btnFold.addEventListener('click', () => {
        game.executeAction(game.players[0], 'fold');
        updateHumanControls(false);
    });

    btnCheckCall.addEventListener('click', () => {
        const human = game.players[0];
        const callAmount = game.currentBet - human.currentBet;
        if (callAmount === 0) {
            game.executeAction(human, 'check');
        } else {
            sfx.playChipSound();
            game.executeAction(human, 'call');
        }
        updateHumanControls(false);
    });

    btnRaise.addEventListener('click', () => {
        const human = game.players[0];
        const targetTotal = parseInt(raiseSlider.value);
        const amountToAdd = targetTotal - human.currentBet;

        sfx.playChipSound();
        if (targetTotal >= human.chips + human.currentBet) {
            game.executeAction(human, 'all-in');
        } else {
            game.executeAction(human, 'raise', amountToAdd);
        }
        updateHumanControls(false);
    });

    // Deal Next Hand
    btnNewHand.addEventListener('click', () => {
        clearStatuses();
        game.startNewHand();
    });

    btnModalNext.addEventListener('click', () => {
        resultModal.classList.remove('active');
        clearStatuses();
        game.startNewHand();
    });

    btnRebuy.addEventListener('click', () => {
        game.rebuyHuman(1000);
        updateBankrollDisplay();
    });

    // Log Drawer Toggle
    btnToggleLog.addEventListener('click', () => {
        historyDrawer.classList.toggle('closed');
    });

    btnCloseLog.addEventListener('click', () => {
        historyDrawer.classList.add('closed');
    });

    // Game Event Listeners
    game.on('log', (entry) => {
        const item = document.createElement('div');
        item.className = `log-entry ${entry.type}`;
        item.innerHTML = `<span class="log-time">[${entry.time}]</span> ${entry.message}`;
        logList.insertBefore(item, logList.firstChild);
    });

    game.on('handStarted', () => {
        handsPlayedCount++;
        headerHands.textContent = handsPlayedCount;
        updateDealerButton(game.dealerIndex);
        updateBankrollDisplay();
        updatePot(game.pot);
        updateBets();
        renderCommunityCards([]);
        dealerAnnouncement.textContent = 'Blinds posted. Hole cards dealt.';
        btnNewHand.disabled = true;
    });

    game.on('cardsDealt', () => {
        renderHoleCards(false);
        updateHandStrength();
    });

    game.on('communityCardsDealt', (data) => {
        renderCommunityCards(data.cards);
        updatePot(game.pot);
        updateBets();
        updateHandStrength();
        dealerAnnouncement.textContent = `${data.round} dealt.`;
    });

    game.on('turnChanged', (data) => {
        highlightActiveTurn(data.player.id);
        updateBankrollDisplay();
        updatePot(data.pot);
        updateBets();

        if (data.player.isHuman) {
            dealerAnnouncement.textContent = `It is your turn! (Current bet: $${data.currentBet})`;
            updateHumanControls(true);
        } else {
            dealerAnnouncement.textContent = `${data.player.name} is thinking...`;
            updateHumanControls(false);
        }
    });

    game.on('playerActed', (data) => {
        const { player, action } = data;
        let className = 'status-call';
        if (action === 'fold') className = 'status-folded';
        if (action === 'raise' || action === 'bet') className = 'status-raise';
        if (action === 'all-in') className = 'status-allin';

        setPlayerStatus(player, action.toUpperCase(), className);
        updateBankrollDisplay();
        updatePot(game.pot);
        updateBets();
        updateHandStrength();
    });

    game.on('showdown', (data) => {
        renderHoleCards(true); // Reveal cards of everyone
        sfx.playWinSound();
        dealerAnnouncement.textContent = `Showdown! ${data.winningHand.name}`;
    });

    game.on('handComplete', (data) => {
        highlightActiveTurn(-1);
        updateBankrollDisplay();
        updatePot(0);
        btnNewHand.disabled = false;

        const winnerNames = data.winners ? data.winners.map(w => w.name).join(' & ') : 'Winner';
        const potAmount = data.potWon;

        modalTitle.textContent = data.winners && data.winners.some(w => w.isHuman) ? '🎉 You Won! 🎉' : '🏆 Hand Finished';
        modalBody.innerHTML = `
            <p><strong>${winnerNames}</strong> won the pot of <strong>$${potAmount.toLocaleString()}</strong>!</p>
            <p style="margin-top: 8px; color: var(--gold);">${data.reason || ''}</p>
        `;

        setTimeout(() => {
            resultModal.classList.add('active');
        }, 1400);
    });

    game.on('playerBusted', () => {
        modalTitle.textContent = 'Out of Chips!';
        modalBody.innerHTML = `
            <p>You have run out of chips.</p>
            <p>Click "Re-buy" to grab another $1,000 stack and jump right back in!</p>
        `;
        resultModal.classList.add('active');
        btnNewHand.disabled = true;
    });

    // Initial table setup
    updateDealerButton(0);
    renderCommunityCards([]);
    updateBankrollDisplay();
});
