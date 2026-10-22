/**
 * UI Controller & Audio Synthesizer for Texas Hold'em
 * Zynga Poker Inspired Mobile Landscape UX
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

        const notes = [523.25, 659.25, 783.99, 1046.50];
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

    // Orientation Prompt
    const orientationPrompt = document.getElementById('orientation-prompt');
    const btnDismissOrientation = document.getElementById('btn-dismiss-orientation');
    if (btnDismissOrientation && orientationPrompt) {
        btnDismissOrientation.addEventListener('click', () => {
            orientationPrompt.classList.add('dismissed');
        });
    }

    // DOM Elements
    const dealerBtn = document.getElementById('dealer-btn');
    const tablePot = document.getElementById('table-pot');
    const communityCardsContainer = document.getElementById('community-cards');
    const dealerAnnouncement = document.getElementById('dealer-announcement');
    const centerHandRank = document.getElementById('center-hand-rank');
    // Hand Power / Odds Meter Elements (Docked in Action Bar)
    const actionOddsDock = document.getElementById('action-odds-dock');
    const powerTierBadge = document.getElementById('power-tier');
    const powerPctText = document.getElementById('power-pct');
    const powerBarFill = document.getElementById('power-bar-fill');
    const userHandName = document.getElementById('user-hand-name');
    const headerBankroll = document.getElementById('header-bankroll');
    const headerHands = document.getElementById('header-hands');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');

    // Action Controls & Rows
    const dealActionRow = document.getElementById('deal-action-row');
    const actionButtonsRow = document.getElementById('action-buttons-row');
    const btnActionDeal = document.getElementById('btn-action-deal');
    const btnActionDealLabel = document.getElementById('btn-action-deal-label');

    const btnFold = document.getElementById('btn-fold');
    const btnCheckCall = document.getElementById('btn-check-call');
    const btnCheckCallLabel = document.getElementById('btn-check-call-label');
    const btnRaiseToggle = document.getElementById('btn-raise-toggle');
    const btnRaiseLabel = document.getElementById('btn-raise-label');
    const raisePanel = document.getElementById('raise-panel');
    const btnCloseRaisePanel = document.getElementById('btn-close-raise-panel');
    const raiseSlider = document.getElementById('raise-slider');
    const btnRaiseMinus = document.getElementById('btn-raise-minus');
    const btnRaisePlus = document.getElementById('btn-raise-plus');

    const btnNewHand = document.getElementById('btn-new-hand');
    const btnRebuy = document.getElementById('btn-rebuy');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    // Fullscreen Toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(err => console.log('Fullscreen request error:', err));
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
            if (btnFullscreen) btnFullscreen.textContent = '✕ Exit';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            if (btnFullscreen) btnFullscreen.textContent = '⛶ Fullscreen';
        }
    }
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }
    document.addEventListener('fullscreenchange', () => {
        if (btnFullscreen) {
            btnFullscreen.textContent = document.fullscreenElement ? '✕ Exit' : '⛶ Fullscreen';
        }
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (btnFullscreen) {
            btnFullscreen.textContent = document.webkitFullscreenElement ? '✕ Exit' : '⛶ Fullscreen';
        }
    });

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

    function updateDealerButton(dealerIdx) {
        if (!dealerBtn) return;
        const seat = document.getElementById(`seat-${dealerIdx}`);
        const table = document.querySelector('.poker-table');
        if (seat && table) {
            const sRect = seat.getBoundingClientRect();
            const tRect = table.getBoundingClientRect();
            if (tRect.width > 0 && tRect.height > 0) {
                const sCenterX = sRect.left + sRect.width / 2 - tRect.left;
                const sCenterY = sRect.top + sRect.height / 2 - tRect.top;
                const tCenterX = tRect.width / 2;
                const tCenterY = tRect.height / 2;
                const angle = Math.atan2(tCenterY - sCenterY, tCenterX - sCenterX);
                const dist = Math.min(44, Math.max(28, tRect.width * 0.055));

                dealerBtn.style.left = `${Math.round(sCenterX + Math.cos(angle) * dist - 12)}px`;
                dealerBtn.style.top = `${Math.round(sCenterY + Math.sin(angle) * dist - 12)}px`;
                dealerBtn.style.bottom = 'auto';
                dealerBtn.style.right = 'auto';
                dealerBtn.style.transform = 'none';
                return;
            }
        }
        // Fallback
        dealerBtn.style.left = '50%';
        dealerBtn.style.bottom = '22%';
        dealerBtn.style.top = 'auto';
        dealerBtn.style.right = 'auto';
        dealerBtn.style.transform = 'translateX(-70px)';
    }

    window.addEventListener('resize', () => {
        updateDealerButton(game.dealerIndex);
    });

    function updateBankrollDisplay() {
        const humanChips = game.players[0].chips;
        headerBankroll.textContent = `$${humanChips.toLocaleString()}`;
        game.players.forEach(p => {
            const chipEl = document.getElementById(`chips-${p.id}`);
            if (chipEl) chipEl.textContent = `$${p.chips.toLocaleString()}`;
        });
    }

    function renderHoleCards(revealAll = false) {
        game.players.forEach(player => {
            const container = document.getElementById(`cards-${player.id}`);
            if (!container) return;
            container.innerHTML = '';
            if (player.folded) return;

            player.holeCards.forEach((card, idx) => {
                const faceUp = player.isHuman || revealAll;
                const cardEl = card.render(faceUp);
                if (idx === 0) {
                    cardEl.classList.add('card-tilt-left');
                } else {
                    cardEl.classList.add('card-tilt-right');
                }
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
            if (!betEl) return;
            if (p.currentBet > 0) {
                betEl.style.display = 'inline-flex';
                const valEl = betEl.querySelector('.bet-val');
                if (valEl) valEl.textContent = `$${p.currentBet}`;
            } else {
                betEl.style.display = 'none';
            }
        });
    }

    function updateHandStrength() {
        const human = game.players[0];
        if (human.folded || human.holeCards.length === 0) {
            userHandName.textContent = '—';
            if (powerPctText) powerPctText.textContent = '0%';
            if (powerBarFill) {
                powerBarFill.style.width = '0%';
                powerBarFill.style.backgroundColor = '#64748b';
            }
            if (powerTierBadge) {
                powerTierBadge.textContent = 'WAITING';
                powerTierBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                powerTierBadge.style.color = '#94a3b8';
            }
            if (centerHandRank) centerHandRank.style.display = 'none';
            return;
        }

        const power = calculateHandPower(human.holeCards, game.communityCards);
        userHandName.textContent = power.name;

        if (powerPctText) powerPctText.textContent = `${power.percent}%`;
        if (powerBarFill) {
            powerBarFill.style.width = `${power.percent}%`;
            powerBarFill.style.backgroundColor = power.color;
            powerBarFill.style.boxShadow = `0 0 10px ${power.color}`;
        }
        if (powerTierBadge) {
            powerTierBadge.textContent = power.tier;
            powerTierBadge.style.backgroundColor = `${power.color}25`;
            powerTierBadge.style.color = power.color;
        }
        if (actionOddsDock) {
            actionOddsDock.style.borderColor = `${power.color}80`;
        }

        // Center hand rank badge (Pokerist style: e.g. THREE OF A KIND, PAIR)
        if (centerHandRank) {
            if (game.communityCards && game.communityCards.length >= 3) {
                const evaluated = evaluateHand([...human.holeCards, ...game.communityCards]);
                if (evaluated) {
                    const rankName = HAND_NAMES[evaluated.category] ? HAND_NAMES[evaluated.category].toUpperCase() : evaluated.name.toUpperCase();
                    centerHandRank.textContent = rankName;
                    centerHandRank.style.display = 'inline-flex';
                } else {
                    centerHandRank.style.display = 'none';
                }
            } else {
                centerHandRank.style.display = 'none';
            }
        }
    }

    function highlightActiveTurn(playerIdx) {
        game.players.forEach((p, i) => {
            const seat = document.getElementById(`seat-${i}`);
            if (seat) seat.classList.toggle('active-turn', i === playerIdx);
        });
    }

    function setPlayerStatus(player, text, className) {
        const statusTag = document.getElementById(`status-${player.id}`);
        if (!statusTag) return;
        statusTag.textContent = text;
        statusTag.className = `player-status-tag ${className}`;
        statusTag.style.display = 'block';

        if (text === 'FOLD') {
            const seat = document.getElementById(`seat-${player.id}`);
            if (seat) seat.classList.add('folded');
        }
    }

    function clearStatusesForNewRound() {
        game.players.forEach(player => {
            if (!player.folded) {
                const statusTag = document.getElementById(`status-${player.id}`);
                if (statusTag) statusTag.style.display = 'none';
            }
        });
    }

    function clearStatuses() {
        game.players.forEach(player => {
            const statusTag = document.getElementById(`status-${player.id}`);
            if (statusTag) statusTag.style.display = 'none';
            const seat = document.getElementById(`seat-${player.id}`);
            if (seat) seat.classList.remove('folded');
        });
    }

    function updateHumanControls(isMyTurn) {
        const human = game.players[0];

        if (!isMyTurn || human.folded || human.allIn || human.chips <= 0) {
            btnFold.disabled = true;
            btnCheckCall.disabled = true;
            btnRaiseToggle.disabled = true;
            raiseSlider.disabled = true;
            raisePanel.classList.remove('active');
            return;
        }

        const callAmount = game.currentBet - human.currentBet;
        btnFold.disabled = false;

        // Check or Call
        if (callAmount === 0) {
            btnCheckCallLabel.textContent = 'CHECK';
            btnCheckCall.disabled = false;
        } else {
            const actualCall = Math.min(callAmount, human.chips);
            btnCheckCallLabel.textContent = `CALL $${actualCall}`;
            btnCheckCall.disabled = false;
        }

        // Bet or Raise setup
        const isBet = game.currentBet === 0;
        const minToWager = isBet ? game.bigBlind : (game.currentBet + game.minRaise);
        const canWager = human.chips > callAmount;

        if (canWager) {
            raiseSlider.disabled = false;
            btnRaiseToggle.disabled = false;

            const sliderMin = Math.min(minToWager, human.chips + human.currentBet);
            const sliderMax = human.chips + human.currentBet;

            raiseSlider.min = sliderMin;
            raiseSlider.max = sliderMax;
            raiseSlider.value = sliderMin;
            updateRaiseButtonLabel(sliderMin);
        } else {
            raiseSlider.disabled = true;
            btnRaiseToggle.disabled = true;
            btnRaiseLabel.textContent = isBet ? 'BET' : 'RAISE';
            raisePanel.classList.remove('active');
        }
    }

    function updateRaiseButtonLabel(amount) {
        const human = game.players[0];
        const isBet = game.currentBet === 0;
        if (amount >= human.chips + human.currentBet) {
            btnRaiseLabel.textContent = `ALL-IN ($${human.chips + human.currentBet})`;
        } else if (isBet) {
            btnRaiseLabel.textContent = `BET $${amount}`;
        } else {
            btnRaiseLabel.textContent = `RAISE TO $${amount}`;
        }
    }

    // Raise Slider listener
    raiseSlider.addEventListener('input', (e) => {
        updateRaiseButtonLabel(parseInt(e.target.value));
    });

    // Steppers +/-
    btnRaiseMinus.addEventListener('click', () => {
        const step = game.bigBlind;
        const current = parseInt(raiseSlider.value);
        const nextVal = Math.max(parseInt(raiseSlider.min), current - step);
        raiseSlider.value = nextVal;
        updateRaiseButtonLabel(nextVal);
    });

    btnRaisePlus.addEventListener('click', () => {
        const step = game.bigBlind;
        const current = parseInt(raiseSlider.value);
        const nextVal = Math.min(parseInt(raiseSlider.max), current + step);
        raiseSlider.value = nextVal;
        updateRaiseButtonLabel(nextVal);
    });

    if (btnCloseRaisePanel) {
        btnCloseRaisePanel.addEventListener('click', () => {
            raisePanel.classList.remove('active');
        });
    }

    // Preset buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const human = game.players[0];
            if (raiseSlider.disabled) return;

            const preset = btn.dataset.preset;
            const currentTotal = human.chips + human.currentBet;
            const isBet = game.currentBet === 0;
            let target = parseInt(raiseSlider.min);

            if (preset === 'min') {
                target = parseInt(raiseSlider.min);
            } else if (preset === 'half-pot') {
                const add = Math.max(game.bigBlind, Math.floor(game.pot * 0.5));
                target = isBet ? add : (game.currentBet + add);
            } else if (preset === 'pot') {
                const add = Math.max(game.bigBlind, game.pot);
                target = isBet ? add : (game.currentBet + add);
            } else if (preset === 'all-in') {
                target = currentTotal;
            }

            target = Math.max(parseInt(raiseSlider.min), Math.min(target, currentTotal));
            raiseSlider.value = target;
            updateRaiseButtonLabel(target);
        });
    });

    // Human Action Handlers
    btnFold.addEventListener('click', () => {
        raisePanel.classList.remove('active');
        game.executeAction(game.players[0], 'fold');
        updateHumanControls(false);
    });

    btnCheckCall.addEventListener('click', () => {
        raisePanel.classList.remove('active');
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

    // Raise / Bet toggle & submit
    btnRaiseToggle.addEventListener('click', () => {
        const human = game.players[0];

        // If panel is not open yet, open it to let player adjust amount
        if (!raisePanel.classList.contains('active')) {
            raisePanel.classList.add('active');
            return;
        }

        // If panel is open, confirm the bet/raise!
        raisePanel.classList.remove('active');
        const targetTotal = parseInt(raiseSlider.value);
        const amountToAdd = targetTotal - human.currentBet;

        sfx.playChipSound();
        if (targetTotal >= human.chips + human.currentBet) {
            game.executeAction(human, 'all-in');
        } else if (game.currentBet === 0) {
            game.executeAction(human, 'bet', amountToAdd);
        } else {
            game.executeAction(human, 'raise', amountToAdd);
        }
        updateHumanControls(false);
    });

    // Unified start hand helper that clears statuses, closes modals, and deals
    function startHandSafe() {
        resultModal.classList.remove('active');
        clearStatuses();
        raisePanel.classList.remove('active');
        game.startNewHand();
    }

    if (btnNewHand) btnNewHand.addEventListener('click', startHandSafe);
    if (btnActionDeal) btnActionDeal.addEventListener('click', startHandSafe);
    if (btnModalNext) btnModalNext.addEventListener('click', startHandSafe);
    if (resultModal) {
        resultModal.addEventListener('click', (e) => {
            if (e.target === resultModal) {
                startHandSafe();
            }
        });
    }

    btnRebuy.addEventListener('click', () => {
        game.rebuyHuman(1000);
        updateBankrollDisplay();
    });

    // Sound toggle
    if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
            sfx.enabled = !sfx.enabled;
            btnSoundToggle.textContent = sfx.enabled ? '🔊' : '🔇';
        });
    }

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
        if (dealActionRow) dealActionRow.style.display = 'none';
        if (actionButtonsRow) actionButtonsRow.style.display = 'flex';
        if (btnNewHand) {
            btnNewHand.disabled = true;
            btnNewHand.textContent = 'In Hand';
        }
        updateDealerButton(game.dealerIndex);
        updateBankrollDisplay();
        updatePot(game.pot);
        updateBets();
        renderCommunityCards([]);
        dealerAnnouncement.textContent = 'Blinds posted. Hole cards dealt.';
    });

    game.on('cardsDealt', () => {
        renderHoleCards(false);
        updateHandStrength();
    });

    game.on('communityCardsDealt', (data) => {
        clearStatusesForNewRound();
        renderCommunityCards(data.cards);
        updatePot(game.pot);
        updateBets();
        updateHandStrength();
        dealerAnnouncement.textContent = `Dealing ${data.round}... Betting round begins!`;
    });

    game.on('turnChanged', (data) => {
        highlightActiveTurn(data.player.id);
        updateBankrollDisplay();
        updatePot(data.pot);
        updateBets();

        const roundName = data.round || 'Round';
        if (data.player.isHuman) {
            const human = game.players[0];
            const callAmount = data.currentBet - human.currentBet;
            if (callAmount <= 0) {
                dealerAnnouncement.textContent = 'CHECK or RAISE';
            } else {
                dealerAnnouncement.textContent = `CALL $${callAmount} or RAISE`;
            }
            dealerAnnouncement.classList.add('prompt-active');
            updateHumanControls(true);
        } else {
            dealerAnnouncement.classList.remove('prompt-active');
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
        renderHoleCards(true);
        sfx.playWinSound();
        dealerAnnouncement.textContent = `Showdown! ${data.winningHand.name}`;
    });

    game.on('handComplete', (data) => {
        highlightActiveTurn(-1);
        updateBankrollDisplay();
        updatePot(0);
        if (dealActionRow) dealActionRow.style.display = 'flex';
        if (actionButtonsRow) actionButtonsRow.style.display = 'none';
        if (btnNewHand) {
            btnNewHand.disabled = false;
            btnNewHand.textContent = 'Deal Hand';
        }
        if (btnActionDealLabel) btnActionDealLabel.textContent = 'DEAL NEXT HAND';
        raisePanel.classList.remove('active');

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

    // Initial setup
    if (dealActionRow) dealActionRow.style.display = 'flex';
    if (actionButtonsRow) actionButtonsRow.style.display = 'none';
    if (btnNewHand) {
        btnNewHand.disabled = false;
        btnNewHand.textContent = 'Deal Hand';
    }
    updateDealerButton(0);
    renderCommunityCards([]);
    updateBankrollDisplay();
});
