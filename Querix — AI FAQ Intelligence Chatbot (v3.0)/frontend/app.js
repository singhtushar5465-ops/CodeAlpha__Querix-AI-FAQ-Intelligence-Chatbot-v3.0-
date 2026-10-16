/**
 * Querix v3.0 — AI FAQ Intelligence Chatbot Engine
 * Frontend Controller & Voice Agent (Jarvix)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Management
  const state = {
    user: null, // null = guest mode
    guestId: localStorage.getItem('querix_guest_id') || ('guest_' + Math.random().toString(36).substring(2, 9)),
    currentTopic: 'All',
    sessionId: 'session_' + Date.now(),
    tokensUsed: 0,
    tokenLimit: 10000,
    guestQuestionsLeft: 5,
    plan: 'Free',
    isVoiceModalOpen: false,
    voiceState: 'IDLE', // 'IDLE', 'LISTENING', 'THINKING', 'SPEAKING'
    autoReadAnswers: true,
    speechLang: 'en-US',
    speechSpeed: 1.0,
    billingCycle: 'monthly',
    chatHistory: [],
    theme: localStorage.getItem('querix_theme') || 'dark'
  };

  localStorage.setItem('querix_guest_id', state.guestId);

  // Dynamic API Base URL (Supports localhost:8000, 127.0.0.1, and file:// preview)
  const API_BASE = (window.location.protocol === 'file:' || (window.location.port !== '8000' && window.location.hostname === 'localhost'))
    ? 'http://127.0.0.1:8000'
    : '';

  // Apply Theme
  document.documentElement.setAttribute('data-theme', state.theme);

  // DOM Elements
  const sidebar = document.getElementById('sidebar');

  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
  const newChatBtn = document.getElementById('new-chat-btn');
  const topicList = document.getElementById('topic-list');
  const activeContextBadge = document.getElementById('active-context-badge');
  const inputTopicTag = document.getElementById('input-topic-tag');

  const chatScrollArea = document.getElementById('chat-scroll-area');
  const emptyState = document.getElementById('empty-state');
  const messageList = document.getElementById('message-list');
  const typingIndicator = document.getElementById('typing-indicator');
  const chatForm = document.getElementById('chat-form');
  const chatTextarea = document.getElementById('chat-textarea');
  const micBtn = document.getElementById('mic-btn');
  const inputTokenEst = document.getElementById('input-token-est');

  // Token Meter Elements
  const tokenUsedText = document.getElementById('token-used-text');
  const tokenLimitText = document.getElementById('token-limit-text');
  const tokenProgressBar = document.getElementById('token-progress-bar');
  const tokenPctText = document.getElementById('token-pct-text');
  const planBadgeLabel = document.getElementById('plan-badge-label');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userNameDisplay = document.getElementById('user-name-display');
  const userStatusDisplay = document.getElementById('user-status-display');
  const userAvatarBadge = document.getElementById('user-avatar-badge');

  // Modals
  const voiceModal = document.getElementById('voice-modal');
  const closeVoiceModalBtn = document.getElementById('close-voice-modal-btn');
  const voiceStatePill = document.getElementById('voice-state-pill');
  const orbStateText = document.getElementById('orb-state-text');
  const voiceTranscriptText = document.getElementById('voice-transcript-text');
  const voiceAnswerBox = document.getElementById('voice-answer-box');
  const voiceAnswerText = document.getElementById('voice-answer-text');
  const voiceMatchBadge = document.getElementById('voice-match-badge');
  const voiceTopicLabel = document.getElementById('voice-topic-label');
  const voiceListenToggleBtn = document.getElementById('voice-listen-toggle-btn');
  const voiceToggleLabel = document.getElementById('voice-toggle-label');
  const voiceInterruptBtn = document.getElementById('voice-interrupt-btn');
  const voiceLangSelect = document.getElementById('voice-lang-select');
  const voiceSpeedSelect = document.getElementById('voice-speed-select');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const voiceAudioMeterFill = document.getElementById('audio-meter-fill');
  const audioStatusTag = document.getElementById('audio-status-tag');
  const voiceMicAlert = document.getElementById('voice-mic-alert');
  const voiceMicAlertTitle = document.getElementById('voice-mic-alert-title');
  const voiceMicAlertDesc = document.getElementById('voice-mic-alert-desc');
  const btnRequestMic = document.getElementById('btn-request-mic');

  const authModal = document.getElementById('auth-modal');
  const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
  const tabSignup = document.getElementById('tab-signup');
  const tabLogin = document.getElementById('tab-login');
  const groupName = document.getElementById('group-name');
  const authForm = document.getElementById('auth-form');
  const authName = document.getElementById('auth-name');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const authModalTitle = document.getElementById('auth-modal-title');
  const authModalSub = document.getElementById('auth-modal-sub');
  const googleAuthBtn = document.getElementById('google-auth-btn');

  const ledgerModal = document.getElementById('ledger-modal');
  const closeLedgerModalBtn = document.getElementById('close-ledger-modal-btn');
  const viewLedgerBtn = document.getElementById('view-ledger-btn');
  const ledgerPlanVal = document.getElementById('ledger-plan-val');
  const ledgerUsedVal = document.getElementById('ledger-used-val');
  const ledgerLimitVal = document.getElementById('ledger-limit-val');
  const ledgerPctVal = document.getElementById('ledger-pct-val');
  const ledgerTableBody = document.getElementById('ledger-table-body');
  const ledgerTopupBtn = document.getElementById('ledger-topup-btn');
  const ledgerUpgradeBtn = document.getElementById('ledger-upgrade-btn');

  const pricingModal = document.getElementById('pricing-modal');
  const closePricingModalBtn = document.getElementById('close-pricing-modal-btn');
  const sidebarUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
  const billingCycleSwitch = document.getElementById('billing-cycle-switch');
  const proPriceVal = document.getElementById('pro-price-val');
  const proPeriodVal = document.getElementById('pro-period-val');
  const bizPriceVal = document.getElementById('biz-price-val');
  const bizPeriodVal = document.getElementById('biz-period-val');
  const upgradeProBtn = document.getElementById('upgrade-pro-btn');
  const upgradeBizBtn = document.getElementById('upgrade-biz-btn');
  const quickTopupBtn = document.getElementById('quick-topup-btn');

  // Checkout Modal Elements
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutModalBtn = document.getElementById('close-checkout-modal-btn');
  const checkoutViewForm = document.getElementById('checkout-view-form');
  const checkoutViewReceipt = document.getElementById('checkout-view-receipt');
  const summaryPlanName = document.getElementById('summary-plan-name');
  const summaryPlanCycle = document.getElementById('summary-plan-cycle');
  const summaryPlanTokens = document.getElementById('summary-plan-tokens');
  const checkoutCustomerName = document.getElementById('checkout-customer-name');
  const checkoutCustomerEmail = document.getElementById('checkout-customer-email');
  const checkoutPromoInput = document.getElementById('checkout-promo-input');
  const btnApplyPromo = document.getElementById('btn-apply-promo');
  const promoStatusMsg = document.getElementById('promo-status-msg');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryDiscountRow = document.getElementById('summary-discount-row');
  const summaryDiscountVal = document.getElementById('summary-discount-val');
  const summaryTax = document.getElementById('summary-tax');
  const summaryTotalAmount = document.getElementById('summary-total-amount');
  const btnCompletePayment = document.getElementById('btn-complete-payment');
  const btnPayLabel = document.getElementById('btn-pay-label');
  const btnFillDemoCard = document.getElementById('btn-fill-demo-card');
  const btnVerifyUpi = document.getElementById('btn-verify-upi');
  const checkoutUpiId = document.getElementById('checkout-upi-id');
  const btnDownloadReceipt = document.getElementById('btn-download-receipt');
  const btnFinishCheckout = document.getElementById('btn-finish-checkout');

  const adminModal = document.getElementById('admin-modal');
  const headerAdminBtn = document.getElementById('header-admin-btn');
  const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
  const tabAnalytics = document.getElementById('tab-analytics');
  const tabUpload = document.getElementById('tab-upload');
  const viewAnalytics = document.getElementById('view-analytics');
  const viewUpload = document.getElementById('view-upload');
  const faqDropzone = document.getElementById('faq-dropzone');
  const faqFileInput = document.getElementById('faq-file-input');
  const browseFaqFileBtn = document.getElementById('browse-faq-file-btn');
  const uploadStatusAlert = document.getElementById('upload-status-alert');

  const profileModal = document.getElementById('profile-modal');
  const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
  const profileNameText = document.getElementById('profile-name-text');
  const profileEmailText = document.getElementById('profile-email-text');
  const exportHistoryBtn = document.getElementById('export-history-btn');
  const signoutBtn = document.getElementById('signout-btn');
  const deleteAccountBtn = document.getElementById('delete-account-btn');

  const cmdPaletteModal = document.getElementById('cmd-palette-modal');
  const headerCmdBtn = document.getElementById('header-cmd-btn');
  const cmdInput = document.getElementById('cmd-input');
  const cmdResultsList = document.getElementById('cmd-results-list');

  const supportModal = document.getElementById('support-modal');
  const closeSupportModalBtn = document.getElementById('close-support-modal-btn');
  const toastNotify = document.getElementById('toast-notify');
  const toastText = document.getElementById('toast-text');
  const headerVoiceBtn = document.getElementById('header-voice-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // =========================================================================
  // 3D Canvas Voice Orb Animation (Jarvix)
  // =========================================================================
  const canvas = document.getElementById('voice-orb-canvas');

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let orbAngle = 0;

  function renderVoiceOrb() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    orbAngle += 0.03;

    let baseRadius = 46;
    let primaryColor = 'rgba(108, 92, 231, ';
    let secondaryColor = 'rgba(0, 212, 255, ';

    if (state.voiceState === 'LISTENING') {
      baseRadius = 54 + Math.sin(orbAngle * 4) * 8;
      primaryColor = 'rgba(245, 166, 35, ';
      secondaryColor = 'rgba(0, 212, 255, ';
    } else if (state.voiceState === 'THINKING') {
      baseRadius = 50 + Math.cos(orbAngle * 6) * 6;
      primaryColor = 'rgba(255, 107, 157, ';
      secondaryColor = 'rgba(108, 92, 231, ';
    } else if (state.voiceState === 'SPEAKING') {
      baseRadius = 58 + Math.sin(orbAngle * 5) * 10;
      primaryColor = 'rgba(0, 212, 255, ';
      secondaryColor = 'rgba(46, 204, 113, ';
    } else {
      // IDLE breathing
      baseRadius = 46 + Math.sin(orbAngle * 1.5) * 4;
    }

    // Outer Halo
    const outerGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.4, centerX, centerY, baseRadius * 1.8);
    outerGrad.addColorStop(0, primaryColor + '0.5)');
    outerGrad.addColorStop(0.6, secondaryColor + '0.2)');
    outerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Multi-Layer Harmonic Wave Rings
    const layers = state.voiceState === 'SPEAKING' ? 6 : 4;
    for (let i = 0; i < layers; i++) {
      ctx.beginPath();
      const phase = orbAngle * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / 3;
      const waveCount = 8;
      for (let a = 0; a <= Math.PI * 2; a += 0.05) {
        const distortion = Math.sin(a * waveCount + phase) * (state.voiceState === 'IDLE' ? 4 : 14);
        const r = baseRadius + distortion;
        const x = centerX + Math.cos(a) * r;
        const y = centerY + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = i % 2 === 0 ? primaryColor + '0.8)' : secondaryColor + '0.8)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Core Radiant Sphere
    const coreGrad = ctx.createRadialGradient(centerX - 15, centerY - 15, 5, centerX, centerY, baseRadius);
    coreGrad.addColorStop(0, '#FFFFFF');
    coreGrad.addColorStop(0.4, primaryColor + '0.9)');
    coreGrad.addColorStop(1, secondaryColor + '1)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    animationFrameId = requestAnimationFrame(renderVoiceOrb);
  }

  function setVoiceState(newState, textHint) {
    state.voiceState = newState;
    voiceStatePill.textContent = newState;
    if (textHint) orbStateText.textContent = textHint;

    if (newState === 'LISTENING') {
      voiceStatePill.style.borderColor = 'var(--status-warning)';
      voiceStatePill.style.color = 'var(--status-warning)';
      voiceListenToggleBtn.classList.add('btn-primary');
      voiceToggleLabel.textContent = 'Listening…';
    } else if (newState === 'SPEAKING') {
      voiceStatePill.style.borderColor = 'var(--status-info)';
      voiceStatePill.style.color = 'var(--status-info)';
      voiceToggleLabel.textContent = 'Speaking Answer';
    } else {
      voiceStatePill.style.borderColor = 'var(--brand-cyan)';
      voiceStatePill.style.color = 'var(--brand-cyan)';
      voiceToggleLabel.textContent = 'Start Listening';
    }
  }

  // =========================================================================
  // Web Speech API (STT & TTS with Barge-In & Silence Debounce)
  // =========================================================================
  let recognition = null;
  let synth = window.speechSynthesis;
  let isSpeechActive = false;
  let accumulatedSpeech = '';
  let speechSilenceTimer = null;
  let hasSubmittedCurrentSpeech = false;
  let micAudioLevelInterval = null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isSpeechActive = true;
      hasSubmittedCurrentSpeech = false;
      micBtn.classList.add('active');
      setVoiceState('LISTENING', 'Listening… speak clearly into your microphone');
      startAudioMeterAnimation();
      if (voiceMicAlert) voiceMicAlert.style.display = 'none';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const trans = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += trans;
        } else {
          interimTranscript += trans;
        }
      }

      const display = (finalTranscript || interimTranscript || '').trim();
      if (display) {
        accumulatedSpeech = display;
        voiceTranscriptText.textContent = `"${display}"`;
        chatTextarea.value = display;
        hasSubmittedCurrentSpeech = false;

        // Auto-submit after 850ms pause in speech
        clearTimeout(speechSilenceTimer);
        speechSilenceTimer = setTimeout(() => {
          if (accumulatedSpeech.trim() && !hasSubmittedCurrentSpeech && state.voiceState === 'LISTENING') {
            submitVoiceQuery(accumulatedSpeech.trim());
          }
        }, 850);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      micBtn.classList.remove('active');
      stopAudioMeterAnimation();

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        if (voiceMicAlert) {
          voiceMicAlert.style.display = 'flex';
          voiceMicAlertTitle.textContent = 'Microphone Blocked';
          voiceMicAlertDesc.textContent = 'Click "Allow Mic" or tap the lock icon in the browser URL bar. Or click any test question chip below!';
        }
        setVoiceState('IDLE', 'Mic permission blocked. Tap question chip or orb.');
      } else if (event.error === 'network') {
        if (voiceMicAlert) {
          voiceMicAlert.style.display = 'flex';
          voiceMicAlertTitle.textContent = 'Speech Network Delay';
          voiceMicAlertDesc.textContent = 'Google Speech API is momentarily slow. Click any prompt chip below to test Jarvix voice immediately.';
        }
        setVoiceState('IDLE', 'Network delay. Tap quick chip below.');
      } else if (event.error === 'no-speech') {
        if (state.voiceState === 'LISTENING') {
          setVoiceState('LISTENING', 'Still listening… speak clearly into your mic');
        }
      } else {
        setVoiceState('IDLE', 'Tap orb or chip below to speak');
      }
    };

    recognition.onend = () => {
      isSpeechActive = false;
      micBtn.classList.remove('active');
      stopAudioMeterAnimation();

      // If speech was pending when recognition ended, submit immediately!
      if (accumulatedSpeech.trim() && !hasSubmittedCurrentSpeech && state.voiceState === 'LISTENING') {
        submitVoiceQuery(accumulatedSpeech.trim());
        return;
      }

      // Smooth auto-restart if modal is open and in LISTENING state
      if (state.isVoiceModalOpen && state.voiceState === 'LISTENING') {
        setTimeout(() => {
          if (state.isVoiceModalOpen && state.voiceState === 'LISTENING' && !isSpeechActive) {
            startListening();
          }
        }, 300);
      }
    };
  }

  function startAudioMeterAnimation() {
    stopAudioMeterAnimation();
    if (!voiceAudioMeterFill) return;
    if (audioStatusTag) {
      audioStatusTag.textContent = 'Listening';
      audioStatusTag.style.color = 'var(--brand-cyan)';
    }

    micAudioLevelInterval = setInterval(() => {
      if (state.voiceState === 'LISTENING') {
        const level = Math.floor(25 + Math.random() * 65);
        voiceAudioMeterFill.style.width = `${level}%`;
      } else if (state.voiceState === 'SPEAKING') {
        const level = Math.floor(35 + Math.sin(Date.now() / 90) * 45);
        voiceAudioMeterFill.style.width = `${level}%`;
      } else {
        voiceAudioMeterFill.style.width = '0%';
      }
    }, 100);
  }

  function stopAudioMeterAnimation() {
    if (micAudioLevelInterval) {
      clearInterval(micAudioLevelInterval);
      micAudioLevelInterval = null;
    }
    if (voiceAudioMeterFill) voiceAudioMeterFill.style.width = '0%';
    if (audioStatusTag) {
      audioStatusTag.textContent = state.voiceState;
      audioStatusTag.style.color = state.voiceState === 'SPEAKING' ? 'var(--status-info)' : 'var(--text-dim)';
    }
  }

  function submitVoiceQuery(text) {
    if (!text || hasSubmittedCurrentSpeech) return;
    hasSubmittedCurrentSpeech = true;
    clearTimeout(speechSilenceTimer);
    stopListening();
    setVoiceState('THINKING', 'Jarvix is consulting knowledge base…');
    handleUserQuery(text, true);
  }

  function startListening() {
    interruptSpeech();
    accumulatedSpeech = '';
    hasSubmittedCurrentSpeech = false;

    if (!recognition) {
      if (voiceMicAlert) {
        voiceMicAlert.style.display = 'flex';
        voiceMicAlertTitle.textContent = 'Speech Recognition Unsupported';
        voiceMicAlertDesc.textContent = 'Speech recognition is not available in this browser. Please click the quick question chips below to test!';
      }
      return;
    }

    try {
      recognition.lang = state.speechLang === 'hinglish' ? 'hi-IN' : state.speechLang;
      recognition.start();
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.warn('Recognition start exception:', e);
      }
    }
  }

  function stopListening() {
    if (recognition && isSpeechActive) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    isSpeechActive = false;
    stopAudioMeterAnimation();
  }

  function interruptSpeech() {
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
      setVoiceState('IDLE', 'Interrupted. Speak your next question.');
      stopAudioMeterAnimation();
    }
  }

  function speakText(text) {
    if (!synth || !state.autoReadAnswers) return;
    try {
      synth.cancel();
      if (synth.paused) synth.resume();

      const cleanSpeech = text.replace(/[*_#`]/g, '').slice(0, 360);
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = state.speechSpeed;
      utterance.lang = state.speechLang === 'hinglish' ? 'en-IN' : state.speechLang;

      // Select voice if available
      const voices = synth.getVoices();
      if (voices.length > 0) {
        const bestVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi')) ||
                          voices.find(v => v.lang.includes('en') && v.name.includes('Google')) ||
                          voices.find(v => v.lang.includes('en')) ||
                          voices[0];
        if (bestVoice) utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        setVoiceState('SPEAKING', 'Jarvix is answering aloud… (Tap to interrupt)');
        startAudioMeterAnimation();
      };

      utterance.onend = () => {
        setVoiceState('IDLE', 'Tap orb or speak to ask another question');
        stopAudioMeterAnimation();
        // Hands-free follow up
        if (state.isVoiceModalOpen) {
          setTimeout(() => {
            if (state.isVoiceModalOpen && state.voiceState === 'IDLE') {
              startListening();
            }
          }, 1200);
        }
      };

      utterance.onerror = () => {
        setVoiceState('IDLE', 'Finished speaking.');
        stopAudioMeterAnimation();
      };

      synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setVoiceState('IDLE', 'Answer displayed.');
      stopAudioMeterAnimation();
    }
  }

  // Voice Modal Toggles
  function openVoiceModal() {
    state.isVoiceModalOpen = true;
    voiceModal.classList.add('active');
    if (!animationFrameId) renderVoiceOrb();
    if (window.lucide) window.lucide.createIcons();
    startListening();
  }

  function closeVoiceModal() {
    state.isVoiceModalOpen = false;
    voiceModal.classList.remove('active');
    stopListening();
    interruptSpeech();
  }

  // Listeners for Voice Mode
  canvas.addEventListener('click', () => {
    if (synth && synth.speaking) {
      interruptSpeech();
    } else if (state.voiceState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  });

  voiceListenToggleBtn.addEventListener('click', () => {
    if (state.voiceState === 'LISTENING') stopListening();
    else startListening();
  });

  voiceInterruptBtn.addEventListener('click', interruptSpeech);
  headerVoiceBtn.addEventListener('click', openVoiceModal);
  closeVoiceModalBtn.addEventListener('click', closeVoiceModal);

  const voiceFloatingClose = document.getElementById('voice-floating-close');
  if (voiceFloatingClose) {
    voiceFloatingClose.addEventListener('click', closeVoiceModal);
  }
  const voiceModalBackdrop = document.getElementById('voice-modal-backdrop');
  if (voiceModalBackdrop) {
    voiceModalBackdrop.addEventListener('click', closeVoiceModal);
  }

  micBtn.addEventListener('click', () => {
    openVoiceModal();
  });

  if (btnRequestMic) {
    btnRequestMic.addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (voiceMicAlert) voiceMicAlert.style.display = 'none';
        showToast('Microphone access enabled!');
        stream.getTracks().forEach(t => t.stop());
        startListening();
      } catch (err) {
        alert('Microphone permission denied. Please allow microphone in browser URL settings.');
      }
    });
  }

  // Quick Voice Chips: test immediately
  document.querySelectorAll('.voice-demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.speak;
      accumulatedSpeech = q;
      voiceTranscriptText.textContent = `"${q}"`;
      chatTextarea.value = q;
      submitVoiceQuery(q);
    });
  });

  if (voiceLangSelect) {
    voiceLangSelect.addEventListener('change', (e) => {
      state.speechLang = e.target.value;
      showToast(`Voice language switched to ${e.target.options[e.target.selectedIndex].text}`);
      if (state.voiceState === 'LISTENING') {
        stopListening();
        setTimeout(startListening, 200);
      }
    });
  }

  if (voiceSpeedSelect) {
    voiceSpeedSelect.addEventListener('change', (e) => {
      state.speechSpeed = parseFloat(e.target.value);
    });
  }

  if (autoSpeakToggle) {
    autoSpeakToggle.addEventListener('change', (e) => {
      state.autoReadAnswers = e.target.checked;
    });
  }

  // =========================================================================
  // Topic Contexts & Starter Selection
  // =========================================================================
  topicList.addEventListener('click', (e) => {
    const item = e.target.closest('.topic-item');
    if (!item) return;

    document.querySelectorAll('.topic-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    const selectedTopic = item.dataset.topic;
    state.currentTopic = selectedTopic;
    activeContextBadge.textContent = `${selectedTopic} Context`;
    inputTopicTag.textContent = selectedTopic;

    showToast(`Context filtered to: ${selectedTopic}`);
    if (window.innerWidth <= 768) closeSidebar();
  });

  document.querySelectorAll('.starter-card').forEach(card => {
    card.addEventListener('click', () => {
      const q = card.dataset.query;
      handleUserQuery(q);
    });
  });

  // Input Token Estimator
  chatTextarea.addEventListener('input', () => {
    chatTextarea.style.height = 'auto';
    chatTextarea.style.height = `${Math.min(chatTextarea.scrollHeight, 160)}px`;

    const textLen = chatTextarea.value.length;
    const est = Math.max(12, Math.ceil(textLen / 4) + 15);
    inputTokenEst.textContent = `~${est} tokens`;
  });

  chatTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatTextarea.value.trim();
    if (!query) return;
    chatTextarea.value = '';
    chatTextarea.style.height = 'auto';
    handleUserQuery(query, false);
  });

  // =========================================================================
  // Core Chat Execution & NLP Pipeline Integration
  // =========================================================================
  async function handleUserQuery(query, isVoice = false) {
    if (!query) return;

    // Hide empty state hero
    if (emptyState.style.display !== 'none') {
      emptyState.style.display = 'none';
    }

    // Append User Bubble
    appendUserBubble(query);

    // Show Typing Indicator
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    if (state.isVoiceModalOpen) {
      setVoiceState('THINKING', 'Jarvix is consulting knowledge base…');
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          topic: state.currentTopic,
          is_voice: isVoice,
          session_id: state.sessionId,
          guest_id: state.guestId
        })
      });

      const data = await response.json();
      typingIndicator.style.display = 'none';

      // Soft Block / Guest limit check
      if (data.blocked) {
        if (data.reason === 'guest_limit') {
          appendBotBubble({
            matched: false,
            answer: data.message,
            confidence: 0,
            contact_support: false,
            isAlert: true
          });
          openAuthModal(true);
        } else if (data.reason === 'token_limit') {
          appendBotBubble({
            matched: false,
            answer: data.message,
            confidence: 0,
            contact_support: false,
            isAlert: true
          });
          openPricingModal();
        }
        return;
      }

      // Update token metrics & usage
      updateTokenUsageMetrics(data);

      // Append Bot Bubble with answer & confidence
      appendBotBubble(data, isVoice);

      // Voice Modal integration
      if (state.isVoiceModalOpen) {
        voiceAnswerBox.style.display = 'block';
        voiceMatchBadge.textContent = `${data.confidence}% Match`;
        voiceTopicLabel.textContent = data.topic || 'General';
        voiceAnswerText.textContent = data.answer;
        if (state.autoReadAnswers) {
          speakText(data.answer);
        } else {
          setVoiceState('IDLE', 'Answer received. Tap orb to speak again.');
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      typingIndicator.style.display = 'none';
      appendBotBubble({
        matched: false,
        answer: 'Querix encountered a network connection anomaly. Please check backend server status.',
        confidence: 0,
        contact_support: true
      });
    }

    scrollToBottom();
  }

  function appendUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user-bubble';
    bubble.innerHTML = `
      <div class="bubble-avatar">
        <i data-lucide="user"></i>
      </div>
      <div class="bubble-content">
        ${escapeHtml(text)}
      </div>
    `;
    messageList.appendChild(bubble);
    if (window.lucide) window.lucide.createIcons({ root: bubble });
  }

  function appendBotBubble(data, isVoice = false) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot-bubble';

    let confidenceBadgeClass = 'badge-confidence';
    if (data.confidence < 50) confidenceBadgeClass += ' low';

    let contentHtml = '';

    if (data.matched) {
      contentHtml = `
        <div class="bubble-meta-header">
          <div class="bubble-tags">
            <span class="badge-topic-sm">${data.topic || 'General'}</span>
            <span class="${confidenceBadgeClass}">${data.confidence}% Confidence</span>
          </div>
          <span class="matched-question-title">${escapeHtml(data.matched_question || '')}</span>
        </div>
        <div class="bubble-answer-text">${formatMarkdown(data.answer)}</div>
      `;

      // Related Question Chips
      if (data.related_questions && data.related_questions.length > 0) {
        const chipsHtml = data.related_questions.map(q => 
          `<button class="query-chip" data-query="${escapeHtml(q.question)}">
             <i data-lucide="help-circle"></i>
             <span>${escapeHtml(q.question)}</span>
           </button>`
        ).join('');

        contentHtml += `
          <div class="related-chips-section">
            <span class="chips-label">Related Questions</span>
            <div class="chips-grid">${chipsHtml}</div>
          </div>
        `;
      }

    } else {
      // Confidence < 0.35 fallback
      const suggestionsHtml = (data.suggested_questions || []).map(q => 
        `<button class="query-chip" data-query="${escapeHtml(q.question)}">
           <i data-lucide="corner-down-right"></i>
           <span>${escapeHtml(q.question)}</span>
         </button>`
      ).join('');

      contentHtml = `
        <div class="fallback-alert-card">
          <div class="fallback-title">
            <i data-lucide="alert-circle"></i>
            <span>${data.confidence ? `${data.confidence}% Match (Below 35% Confidence Threshold)` : 'Inquiry Notice'}</span>
          </div>
          <p class="bubble-answer-text">${escapeHtml(data.answer || data.message || '')}</p>
        </div>
      `;

      if (suggestionsHtml) {
        contentHtml += `
          <div class="related-chips-section">
            <span class="chips-label">Did you mean:</span>
            <div class="chips-grid">${suggestionsHtml}</div>
          </div>
        `;
      }

      if (data.contact_support) {
        contentHtml += `
          <div style="padding-top: 6px;">
            <button class="btn btn-secondary contact-support-action-btn">
              <i data-lucide="headphones"></i>
              <span>Contact Human Support</span>
            </button>
          </div>
        `;
      }
    }

    // Action bar (Thumbs, Copy, Share, Speak)
    contentHtml += `
      <div class="bubble-action-bar">
        <div class="feedback-group">
          <button class="action-icon-btn btn-thumbs-up" title="Helpful response" data-faq="${data.faq_id || ''}">
            <i data-lucide="thumbs-up"></i>
            <span>Helpful</span>
          </button>
          <button class="action-icon-btn btn-thumbs-down" title="Not helpful" data-faq="${data.faq_id || ''}">
            <i data-lucide="thumbs-down"></i>
          </button>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="action-icon-btn btn-copy-answer" title="Copy answer">
            <i data-lucide="copy"></i>
            <span>Copy</span>
          </button>
          <button class="action-icon-btn btn-share-answer" title="Share link">
            <i data-lucide="share-2"></i>
          </button>
          <button class="action-icon-btn btn-speak-answer" title="Speak with Jarvix">
            <i data-lucide="volume-2"></i>
          </button>
        </div>
      </div>
    `;

    bubble.innerHTML = `
      <div class="bubble-avatar"><img src="logo.png" alt="Q" class="bot-avatar-img"></div>
      <div class="bubble-content">${contentHtml}</div>
    `;


    messageList.appendChild(bubble);
    if (window.lucide) window.lucide.createIcons({ root: bubble });

    // Wire action buttons
    bubble.querySelectorAll('.query-chip').forEach(chip => {
      chip.addEventListener('click', () => handleUserQuery(chip.dataset.query));
    });

    const contactSupportBtn = bubble.querySelector('.contact-support-action-btn');
    if (contactSupportBtn) {
      contactSupportBtn.addEventListener('click', () => openModal(supportModal));
    }

    const thumbsUp = bubble.querySelector('.btn-thumbs-up');
    const thumbsDown = bubble.querySelector('.btn-thumbs-down');
    if (thumbsUp && thumbsDown) {
      thumbsUp.addEventListener('click', () => submitFeedback(data.faq_id, 1, thumbsUp, thumbsDown));
      thumbsDown.addEventListener('click', () => submitFeedback(data.faq_id, -1, thumbsDown, thumbsUp));
    }

    const copyBtn = bubble.querySelector('.btn-copy-answer');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.answer);
        showToast('Answer copied to clipboard!');
      });
    }

    const shareBtn = bubble.querySelector('.btn-share-answer');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.origin + '?faq=' + (data.faq_id || 'share'));
        showToast('Sharable link copied to clipboard!');
      });
    }

    const speakBtn = bubble.querySelector('.btn-speak-answer');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => speakText(data.answer));
    }

    // Auto read aloud if enabled and triggered by voice
    if (isVoice && state.autoReadAnswers && data.answer) {
      speakText(data.answer);
    }
  }

  async function submitFeedback(faqId, rating, activeBtn, otherBtn) {
    activeBtn.classList.add(rating === 1 ? 'active-positive' : 'active-negative');
    otherBtn.classList.remove('active-positive', 'active-negative');
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq_id: faqId, query: 'Feedback', rating })
      });
      showToast(rating === 1 ? 'Glad this answered your question!' : 'Thanks for your feedback. We will refine this.');
    } catch (e) {
      console.log('Feedback error:', e);
    }
  }

  // =========================================================================
  // 3.4 Token Meter Updates & Soft-Block
  // =========================================================================
  function updateTokenUsageMetrics(data) {
    if (data.tokens_used !== undefined) {
      state.tokensUsed = data.tokens_used;
      state.tokenLimit = data.token_limit;
    }

    const used = state.tokensUsed;
    const limit = state.tokenLimit;
    const pct = Math.min(100, Math.round((used / limit) * 100));

    tokenUsedText.textContent = used.toLocaleString();
    tokenLimitText.textContent = limit.toLocaleString();
    tokenProgressBar.style.width = `${pct}%`;
    tokenPctText.textContent = `${pct}% used`;

    // Visual Color Shifts at 70% and 90%
    tokenProgressBar.classList.remove('warning', 'danger');
    if (pct >= 90) {
      tokenProgressBar.classList.add('danger');
    } else if (pct >= 70) {
      tokenProgressBar.classList.add('warning');
    }

    if (data.is_guest) {
      state.guestQuestionsLeft = data.guest_questions_left;
      userStatusDisplay.textContent = `${state.guestQuestionsLeft} questions left`;
      planBadgeLabel.textContent = 'Guest Tier';
    } else {
      userStatusDisplay.textContent = `${state.plan} Plan`;
      planBadgeLabel.textContent = `${state.plan} Tier`;
    }
  }

  // =========================================================================
  // 3.3 Authentication & Session Management
  // =========================================================================
  let isSignupMode = true;

  function openAuthModal(signup = true) {
    isSignupMode = signup;
    authErrorMsg.style.display = 'none';

    if (signup) {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      groupName.style.display = 'flex';
      authName.required = true;
      authModalTitle.textContent = 'Create your Querix Account';
      authModalSub.textContent = 'Unlock 10,000 free monthly tokens and cloud history sync.';
      authSubmitBtn.querySelector('span').textContent = 'Create Free Account';
    } else {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      groupName.style.display = 'none';
      authName.required = false;
      authModalTitle.textContent = 'Welcome Back to Querix';
      authModalSub.textContent = 'Sign in to access your quotas, custom FAQs, and voice settings.';
      authSubmitBtn.querySelector('span').textContent = 'Sign In to Account';
    }

    openModal(authModal);
  }

  tabSignup.addEventListener('click', () => openAuthModal(true));
  tabLogin.addEventListener('click', () => openAuthModal(false));
  closeAuthModalBtn.addEventListener('click', () => closeModal(authModal));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMsg.style.display = 'none';

    const email = authEmail.value.trim();
    const password = authPassword.value;
    const name = authName.value.trim();

    const endpoint = isSignupMode ? `${API_BASE}/api/auth/signup` : `${API_BASE}/api/auth/login`;
    const payload = isSignupMode ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        authErrorMsg.textContent = data.detail || 'Authentication failed. Please verify credentials.';
        authErrorMsg.style.display = 'block';
        return;
      }

      // Success
      state.user = data.user;
      state.plan = data.user.plan;
      state.tokensUsed = data.user.tokens_used;
      state.tokenLimit = data.user.token_limit;

      userNameDisplay.textContent = data.user.name;
      userStatusDisplay.textContent = `${data.user.plan} Plan`;
      profileNameText.textContent = data.user.name;
      profileEmailText.textContent = data.user.email;
      planBadgeLabel.textContent = `${data.user.plan} Tier`;

      updateTokenUsageMetrics({
        tokens_used: data.user.tokens_used,
        token_limit: data.user.token_limit,
        is_guest: false
      });

      closeModal(authModal);
      showToast(`Welcome ${data.user.name}! Your account is active.`);

    } catch (err) {
      authErrorMsg.textContent = 'Unable to reach authentication server.';
      authErrorMsg.style.display = 'block';
    }
  });

  googleAuthBtn.addEventListener('click', () => {
    // Simulated Google OAuth login
    authName.value = 'Dr. Priya Sharma';
    authEmail.value = 'priya.sharma@example.com';
    authPassword.value = 'SecureP@ssword2026';
    authForm.dispatchEvent(new Event('submit'));
  });

  signoutBtn.addEventListener('click', async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    state.user = null;
    state.plan = 'Free';
    userNameDisplay.textContent = 'Guest User';
    userStatusDisplay.textContent = '5 questions left';
    planBadgeLabel.textContent = 'Guest Tier';
    closeModal(profileModal);
    showToast('Signed out of session.');
  });

  deleteAccountBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to permanently delete your account and all data under GDPR Right to Erasure? This action is irreversible.')) {
      await fetch(`${API_BASE}/api/account`, { method: 'DELETE' });
      state.user = null;
      closeModal(profileModal);
      showToast('Account permanently erased.');
      location.reload();
    }
  });

  // Check existing session
  async function checkAuthSession() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`);
      const data = await res.json();
      if (data.authenticated && data.user) {
        state.user = data.user;
        state.plan = data.user.plan;
        state.tokensUsed = data.user.tokens_used;
        state.tokenLimit = data.user.token_limit;
        userNameDisplay.textContent = data.user.name;
        userStatusDisplay.textContent = `${data.user.plan} Plan`;
        profileNameText.textContent = data.user.name;
        profileEmailText.textContent = data.user.email;
        updateTokenUsageMetrics({
          tokens_used: data.user.tokens_used,
          token_limit: data.user.token_limit,
          is_guest: false
        });
      }
    } catch (e) {
      console.log('Session check:', e);
    }
  }
  checkAuthSession();

  // =========================================================================
  // 3.4 Token Ledger Modal
  // =========================================================================
  async function openLedgerModal() {
    openModal(ledgerModal);
    ledgerPlanVal.textContent = `${state.plan} Tier`;
    ledgerUsedVal.textContent = state.tokensUsed.toLocaleString();
    ledgerLimitVal.textContent = state.tokenLimit.toLocaleString();
    const pct = Math.round((state.tokensUsed / state.tokenLimit) * 100);
    ledgerPctVal.textContent = `${pct}%`;

    try {
      const res = await fetch(`${API_BASE}/api/usage`);
      const data = await res.json();
      if (data.ledger && data.ledger.length > 0) {
        ledgerTableBody.innerHTML = data.ledger.map(row => `
          <tr>
            <td style="color: var(--text-dim); font-size: 11.5px;">${new Date(row.date).toLocaleTimeString()}</td>
            <td>${escapeHtml(row.query)}</td>
            <td><span class="badge" style="font-size: 10px; background: rgba(0,212,255,0.1); color: var(--brand-cyan);">${row.query_type}</span></td>
            <td style="font-family: var(--font-mono); font-weight: 600;">+${row.tokens_used}</td>
          </tr>
        `).join('');
      } else {
        ledgerTableBody.innerHTML = `<tr><td colspan="4" class="empty-table">No query transactions logged yet.</td></tr>`;
      }
    } catch (e) {
      console.log('Ledger fetch error:', e);
    }
  }

  viewLedgerBtn.addEventListener('click', openLedgerModal);
  closeLedgerModalBtn.addEventListener('click', () => closeModal(ledgerModal));

  ledgerTopupBtn.addEventListener('click', () => {
    closeModal(ledgerModal);
    purchaseTopup();
  });

  ledgerUpgradeBtn.addEventListener('click', () => {
    closeModal(ledgerModal);
    openPricingModal();
  });

  // =========================================================================
  // 3.5 Plans & Upgrade Integration
  // =========================================================================
  function openPricingModal() {
    openModal(pricingModal);
    if (window.lucide) window.lucide.createIcons();
  }

  const goProCard = document.getElementById('go-pro-card');
  if (goProCard) {
    goProCard.addEventListener('click', () => openCheckoutModal('Pro'));
  }
  if (sidebarUpgradeBtn) {
    sidebarUpgradeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCheckoutModal('Pro');
    });
  }
  closePricingModalBtn.addEventListener('click', () => closeModal(pricingModal));

  billingCycleSwitch.addEventListener('click', () => {
    billingCycleSwitch.classList.toggle('active');
    const isYearly = billingCycleSwitch.classList.contains('active');
    state.billingCycle = isYearly ? 'yearly' : 'monthly';

    if (isYearly) {
      proPriceVal.textContent = '4,990';
      proPeriodVal.textContent = '/year (₹415/mo)';
      bizPriceVal.textContent = '19,990';
      bizPeriodVal.textContent = '/year (₹1,665/mo)';
    } else {
      proPriceVal.textContent = '499';
      proPeriodVal.textContent = '/month';
      bizPriceVal.textContent = '1,999';
      bizPeriodVal.textContent = '/month';
    }
  });

  // =========================================================================
  // 3.5.1 Querix Secure Checkout & Payment Engine
  // =========================================================================
  let currentCheckoutPlan = 'Pro';
  let currentCheckoutCycle = 'monthly';
  let currentPaymentMethod = 'UPI';
  let activePromoDiscount = 0;

  function openCheckoutModal(planName = 'Pro', cycle = null) {
    currentCheckoutPlan = planName;
    currentCheckoutCycle = cycle || state.billingCycle || 'monthly';
    activePromoDiscount = 0;

    checkoutViewForm.style.display = 'block';
    checkoutViewReceipt.style.display = 'none';
    promoStatusMsg.style.display = 'none';
    summaryDiscountRow.style.display = 'none';
    checkoutPromoInput.value = '';

    if (state.user) {
      checkoutCustomerName.value = state.user.name || 'Alex Morgan';
      checkoutCustomerEmail.value = state.user.email || 'alex@company.com';
    }

    updateCheckoutPricingDisplay();
    closeModal(pricingModal);
    openModal(checkoutModal);
    if (window.lucide) window.lucide.createIcons();
  }

  function updateCheckoutPricingDisplay() {
    let basePrice = 499;
    let tokensDesc = '500,000 Tokens/mo';
    let cycleDesc = currentCheckoutCycle === 'yearly' ? 'Yearly Subscription (2 Months Free)' : 'Monthly Subscription';

    if (currentCheckoutPlan === 'Business') {
      basePrice = currentCheckoutCycle === 'yearly' ? 19990 : 1999;
      tokensDesc = '3,000,000 Tokens/mo';
    } else if (currentCheckoutPlan === 'Topup') {
      basePrice = 99;
      tokensDesc = '+100,000 Token Booster Pack';
      cycleDesc = 'Instant Top-Up Pack (One-Time)';
    } else {
      // Pro
      basePrice = currentCheckoutCycle === 'yearly' ? 4990 : 499;
      tokensDesc = '500,000 Tokens/mo';
    }

    summaryPlanName.textContent = currentCheckoutPlan === 'Topup' ? 'Token Booster Pack' : `${currentCheckoutPlan} Plan`;
    summaryPlanCycle.textContent = cycleDesc;
    summaryPlanTokens.textContent = tokensDesc;

    const discount = activePromoDiscount;
    const finalAmount = Math.max(0, basePrice - discount);
    const tax = Math.round(finalAmount * 0.18 * 100) / 100;

    summarySubtotal.textContent = `₹${basePrice.toFixed(2)}`;
    if (discount > 0) {
      summaryDiscountRow.style.display = 'flex';
      summaryDiscountVal.textContent = `-₹${discount.toFixed(2)}`;
    } else {
      summaryDiscountRow.style.display = 'none';
    }

    summaryTax.textContent = `₹${tax.toFixed(2)}`;
    summaryTotalAmount.textContent = `₹${finalAmount.toFixed(2)}`;
    btnPayLabel.textContent = `Pay ₹${finalAmount.toFixed(2)} & Activate ${currentCheckoutPlan === 'Topup' ? 'Tokens' : currentCheckoutPlan}`;
  }

  // Payment Tabs Switcher
  document.querySelectorAll('.pay-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pay-tab-content').forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const tab = btn.dataset.tab;
      currentPaymentMethod = tab.toUpperCase();
      const content = document.getElementById(`tab-content-${tab}`);
      if (content) content.style.display = 'block';
    });
  });

  // Bank selection styling
  document.querySelectorAll('input[name="bank_select"]').forEach(input => {
    input.addEventListener('change', (e) => {
      document.querySelectorAll('.bank-card').forEach(c => c.classList.remove('active'));
      e.target.closest('.bank-card').classList.add('active');
    });
  });

  // Wallet selection styling
  document.querySelectorAll('input[name="wallet_select"]').forEach(input => {
    input.addEventListener('change', (e) => {
      document.querySelectorAll('.wallet-card').forEach(c => c.classList.remove('active'));
      e.target.closest('.wallet-card').classList.add('active');
    });
  });

  // Demo auto-fill test card
  if (btnFillDemoCard) {
    btnFillDemoCard.addEventListener('click', () => {
      document.getElementById('card-name').value = state.user?.name || 'Alex Morgan';
      document.getElementById('card-number').value = '4532 8901 2345 6789';
      document.getElementById('card-expiry').value = '12/28';
      document.getElementById('card-cvv').value = '888';
      showToast('Demo Card auto-filled with test credentials!');
    });
  }

  // Demo VPA chips
  document.querySelectorAll('.vpa-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      checkoutUpiId.value = chip.dataset.vpa;
      showToast(`Selected UPI ID: ${chip.dataset.vpa}`);
    });
  });

  if (btnVerifyUpi) {
    btnVerifyUpi.addEventListener('click', () => {
      showToast(`VPA ${checkoutUpiId.value} verified with NPCI!`);
    });
  }

  // Promo Code Application
  if (btnApplyPromo) {
    btnApplyPromo.addEventListener('click', () => {
      const code = checkoutPromoInput.value.trim().toUpperCase();
      if (code === 'QUERIX50') {
        activePromoDiscount = currentCheckoutPlan === 'Business' ? 500 : 100;
        promoStatusMsg.style.display = 'block';
        promoStatusMsg.style.background = 'rgba(46, 204, 113, 0.15)';
        promoStatusMsg.style.color = 'var(--status-success)';
        promoStatusMsg.textContent = `🎉 Coupon QUERIX50 applied! ₹${activePromoDiscount} discount credited.`;
        updateCheckoutPricingDisplay();
      } else if (code === 'WELCOME') {
        activePromoDiscount = 50;
        promoStatusMsg.style.display = 'block';
        promoStatusMsg.style.background = 'rgba(46, 204, 113, 0.15)';
        promoStatusMsg.style.color = 'var(--status-success)';
        promoStatusMsg.textContent = '🎉 Coupon WELCOME applied! ₹50 discount credited.';
        updateCheckoutPricingDisplay();
      } else {
        promoStatusMsg.style.display = 'block';
        promoStatusMsg.style.background = 'rgba(255, 92, 92, 0.12)';
        promoStatusMsg.style.color = 'var(--status-error)';
        promoStatusMsg.textContent = 'Invalid promo code. Try "QUERIX50" or "WELCOME".';
      }
    });
  }

  // Complete Payment Action
  if (btnCompletePayment) {
    btnCompletePayment.addEventListener('click', async () => {
      const email = checkoutCustomerEmail.value.trim();
      const name = checkoutCustomerName.value.trim() || 'Alex Morgan';

      if (!email || !email.includes('@')) {
        alert('Please enter a valid billing email address.');
        checkoutCustomerEmail.focus();
        return;
      }

      // Step 1: Connecting Gateway
      btnCompletePayment.disabled = true;
      btnPayLabel.textContent = `Contacting ${currentPaymentMethod} Banking Gateway…`;

      setTimeout(() => {
        // Step 2: Authorizing
        btnPayLabel.textContent = `Authorizing Payment & 3D Secure Verification…`;

        setTimeout(async () => {
          try {
            const endpoint = currentCheckoutPlan === 'Topup'
              ? `${API_BASE}/api/billing/topup`
              : `${API_BASE}/api/billing/upgrade`;

            const payload = currentCheckoutPlan === 'Topup'
              ? {
                  payment_method: currentPaymentMethod,
                  customer_email: email,
                  customer_name: name,
                  amount: 99.0
                }
              : {
                  plan: currentCheckoutPlan,
                  billing_period: currentCheckoutCycle,
                  payment_method: currentPaymentMethod,
                  customer_email: email,
                  customer_name: name
                };

            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
              btnPayLabel.textContent = `Payment Approved!`;

              state.user = data.user;
              state.plan = data.user.plan;
              state.tokenLimit = data.user.token_limit;
              state.tokensUsed = data.user.tokens_used;

              userNameDisplay.textContent = data.user.name;
              userStatusDisplay.textContent = `${data.user.plan} Plan`;
              profileNameText.textContent = data.user.name;
              profileEmailText.textContent = data.user.email;
              planBadgeLabel.textContent = `${data.user.plan} Tier`;

              updateTokenUsageMetrics({
                tokens_used: data.user.tokens_used,
                token_limit: data.user.token_limit,
                is_guest: false
              });

              // Transition to Receipt View
              checkoutViewForm.style.display = 'none';
              checkoutViewReceipt.style.display = 'block';

              document.getElementById('receipt-txn-id').textContent = data.transaction_id || `TXN_QX_${Date.now()}`;
              document.getElementById('receipt-invoice-no').textContent = data.invoice_no || `INV-2026-001`;
              document.getElementById('receipt-plan-name').textContent = `${data.user.plan} Tier`;
              document.getElementById('receipt-amount').textContent = `₹${(data.amount_paid || 499).toFixed(2)} INR`;
              document.getElementById('receipt-method').textContent = `${currentPaymentMethod} (${currentPaymentMethod === 'UPI' ? checkoutUpiId.value : 'Authorized'})`;
              document.getElementById('receipt-time').textContent = new Date().toLocaleString();
              document.getElementById('receipt-tokens').textContent = `+${data.user.token_limit.toLocaleString()} Tokens Ready to Use`;

              showToast(`Payment of ₹${data.amount_paid || 499} verified! ${data.user.plan} activated.`);
            } else {
              alert(data.detail || 'Payment authorization failed.');
              btnCompletePayment.disabled = false;
              updateCheckoutPricingDisplay();
            }
          } catch (err) {
            alert('Unable to reach payment gateway.');
            btnCompletePayment.disabled = false;
            updateCheckoutPricingDisplay();
          }
        }, 750);
      }, 750);
    });
  }

  // Download Receipt
  if (btnDownloadReceipt) {
    btnDownloadReceipt.addEventListener('click', () => {
      const receiptData = {
        platform: "Querix — AI FAQ Intelligence",
        transaction_id: document.getElementById('receipt-txn-id').textContent,
        invoice_number: document.getElementById('receipt-invoice-no').textContent,
        plan_name: document.getElementById('receipt-plan-name').textContent,
        amount_paid: document.getElementById('receipt-amount').textContent,
        payment_method: document.getElementById('receipt-method').textContent,
        timestamp: document.getElementById('receipt-time').textContent,
        customer_email: checkoutCustomerEmail.value,
        token_quota: document.getElementById('receipt-tokens').textContent,
        status: "COMPLETED / PAID"
      };

      const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Querix_Tax_Invoice_${receiptData.invoice_number}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Tax Invoice receipt downloaded.');
    });
  }

  if (btnFinishCheckout) {
    btnFinishCheckout.addEventListener('click', () => {
      closeModal(checkoutModal);
      btnCompletePayment.disabled = false;
      chatTextarea.focus();
    });
  }

  if (closeCheckoutModalBtn) {
    closeCheckoutModalBtn.addEventListener('click', () => {
      closeModal(checkoutModal);
      btnCompletePayment.disabled = false;
    });
  }

  // Pricing Modal Buttons launch Checkout
  upgradeProBtn.addEventListener('click', () => openCheckoutModal('Pro'));
  upgradeBizBtn.addEventListener('click', () => openCheckoutModal('Business'));
  quickTopupBtn.addEventListener('click', () => openCheckoutModal('Topup'));

  // =========================================================================
  // 3.6 Admin Analytics & Custom FAQ Ingestion
  // =========================================================================
  async function openAdminModal() {
    openModal(adminModal);
    loadAnalytics();
  }

  headerAdminBtn.addEventListener('click', openAdminModal);
  closeAdminModalBtn.addEventListener('click', () => closeModal(adminModal));

  tabAnalytics.addEventListener('click', () => {
    tabAnalytics.classList.add('active');
    tabUpload.classList.remove('active');
    viewAnalytics.style.display = 'block';
    viewUpload.style.display = 'none';
  });

  tabUpload.addEventListener('click', () => {
    tabUpload.classList.add('active');
    tabAnalytics.classList.remove('active');
    viewUpload.style.display = 'block';
    viewAnalytics.style.display = 'none';
  });

  async function loadAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics`);
      const data = await res.json();

      document.getElementById('kpi-queries').textContent = data.total_queries;
      document.getElementById('kpi-confidence').textContent = `${data.average_confidence}%`;
      document.getElementById('kpi-satisfaction').textContent = `${data.satisfaction_rate}%`;

      const topList = document.getElementById('top-questions-list');
      if (data.top_questions && data.top_questions.length > 0) {
        topList.innerHTML = data.top_questions.map(q => 
          `<li><span>${escapeHtml(q.query)}</span> <span class="badge" style="background: rgba(108,92,231,0.2); color: var(--brand-cyan);">${q.count} queries</span></li>`
        ).join('');
      }

      const unList = document.getElementById('unanswered-list');
      if (data.unmatched_queries && data.unmatched_queries.length > 0) {
        unList.innerHTML = data.unmatched_queries.map(q => 
          `<li><span>${escapeHtml(q.query)}</span> <span class="badge badge-warn">${q.count} hits</span></li>`
        ).join('');
      }

    } catch (e) {
      console.log('Analytics load error:', e);
    }
  }

  // Custom FAQ Upload
  browseFaqFileBtn.addEventListener('click', () => faqFileInput.click());

  faqFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    uploadStatusAlert.style.display = 'block';
    uploadStatusAlert.style.background = 'rgba(108, 92, 231, 0.15)';
    uploadStatusAlert.style.color = 'var(--brand-cyan)';
    uploadStatusAlert.textContent = 'Uploading and retraining TF-IDF index…';

    try {
      const res = await fetch(`${API_BASE}/api/faq/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        uploadStatusAlert.style.background = 'rgba(46, 204, 113, 0.15)';
        uploadStatusAlert.style.color = 'var(--status-success)';
        uploadStatusAlert.textContent = data.message;
        showToast(data.message);
      } else {
        uploadStatusAlert.style.background = 'rgba(255, 92, 92, 0.15)';
        uploadStatusAlert.style.color = 'var(--status-error)';
        uploadStatusAlert.textContent = data.detail || 'Upload failed.';
      }
    } catch (err) {
      uploadStatusAlert.textContent = 'Upload network error.';
    }
  });

  // Drag and Drop
  faqDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    faqDropzone.style.borderColor = 'var(--brand-cyan)';
  });
  faqDropzone.addEventListener('dragleave', () => {
    faqDropzone.style.borderColor = 'var(--border-focus)';
  });
  faqDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    faqDropzone.style.borderColor = 'var(--border-focus)';
    if (e.dataTransfer.files.length) {
      faqFileInput.files = e.dataTransfer.files;
      faqFileInput.dispatchEvent(new Event('change'));
    }
  });

  // =========================================================================
  // Profile Modal & History Export
  // =========================================================================
  // User Dropdown Menu Elements
  const userDropdownMenu = document.getElementById('user-dropdown-menu');
  const userMenuChevron = document.getElementById('user-menu-chevron');
  const dropdownUserName = document.getElementById('dropdown-user-name');
  const dropdownUserBadge = document.getElementById('dropdown-user-badge');
  const dropdownOptProfile = document.getElementById('dropdown-opt-profile');
  const dropdownOptUpgrade = document.getElementById('dropdown-opt-upgrade');
  const dropdownOptLedger = document.getElementById('dropdown-opt-ledger');
  const dropdownOptTheme = document.getElementById('dropdown-opt-theme');
  const dropdownThemeLabel = document.getElementById('dropdown-theme-label');
  const dropdownOptAuth = document.getElementById('dropdown-opt-auth');
  const dropdownAuthLabel = document.getElementById('dropdown-auth-label');
  const dropdownAuthIcon = document.getElementById('dropdown-auth-icon');

  function updateUserDropdownDisplay() {
    if (!userDropdownMenu) return;
    if (state.user) {
      if (dropdownUserName) dropdownUserName.textContent = state.user.name || 'User';
      if (dropdownUserBadge) dropdownUserBadge.textContent = `${state.user.plan || 'Free'} Tier`;
      if (dropdownAuthLabel) dropdownAuthLabel.textContent = 'Sign Out';
      if (dropdownAuthIcon) dropdownAuthIcon.setAttribute('data-lucide', 'log-out');
    } else {
      if (dropdownUserName) dropdownUserName.textContent = 'Guest User';
      if (dropdownUserBadge) dropdownUserBadge.textContent = `${state.guestQuestionsLeft} Qs left`;
      if (dropdownAuthLabel) dropdownAuthLabel.textContent = 'Sign In / Sign Up';
      if (dropdownAuthIcon) dropdownAuthIcon.setAttribute('data-lucide', 'log-in');
    }
    if (dropdownThemeLabel) {
      dropdownThemeLabel.textContent = state.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleUserDropdown(e) {
    if (e) e.stopPropagation();
    if (!userDropdownMenu) return;
    const isActive = userDropdownMenu.classList.toggle('active');
    if (userMenuChevron) {
      userMenuChevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    if (isActive) updateUserDropdownDisplay();
  }

  function closeUserDropdown() {
    if (userDropdownMenu && userDropdownMenu.classList.contains('active')) {
      userDropdownMenu.classList.remove('active');
      if (userMenuChevron) userMenuChevron.style.transform = 'rotate(0deg)';
    }
  }

  userMenuBtn.addEventListener('click', toggleUserDropdown);

  // Close user dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#user-menu-container')) {
      closeUserDropdown();
    }
  });

  if (dropdownOptProfile) {
    dropdownOptProfile.addEventListener('click', () => {
      closeUserDropdown();
      if (!state.user) openAuthModal(false);
      else openModal(profileModal);
    });
  }

  if (dropdownOptUpgrade) {
    dropdownOptUpgrade.addEventListener('click', () => {
      closeUserDropdown();
      openCheckoutModal('Pro');
      if (window.lucide) window.lucide.createIcons();
    });
  }

  if (dropdownOptLedger) {
    dropdownOptLedger.addEventListener('click', () => {
      closeUserDropdown();
      openLedgerModal();
    });
  }

  if (dropdownOptTheme) {
    dropdownOptTheme.addEventListener('click', () => {
      toggleTheme();
      updateUserDropdownDisplay();
    });
  }

  if (dropdownOptAuth) {
    dropdownOptAuth.addEventListener('click', () => {
      closeUserDropdown();
      if (state.user) {
        signoutBtn.click();
      } else {
        openAuthModal(false);
      }
    });
  }

  closeProfileModalBtn.addEventListener('click', () => closeModal(profileModal));

  exportHistoryBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `querix_chat_history_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Chat history exported to JSON!');
    } catch (e) {
      showToast('Export history error');
    }
  });

  // =========================================================================
  // Command Palette (Ctrl+K)
  // =========================================================================
  headerCmdBtn.addEventListener('click', () => openModal(cmdPaletteModal));

  cmdResultsList.addEventListener('click', (e) => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;
    const action = item.dataset.action;
    closeModal(cmdPaletteModal);

    if (action === 'new-chat') resetNewChat();
    else if (action === 'voice') openVoiceModal();
    else if (action === 'ledger') openLedgerModal();
    else if (action === 'upgrade') openPricingModal();
    else if (action === 'admin') openAdminModal();
    else if (action === 'theme') toggleTheme();
    else if (action === 'export') exportHistoryBtn.click();
  });

  cmdInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.cmd-item').forEach(item => {
      const txt = item.textContent.toLowerCase();
      item.style.display = txt.includes(val) ? 'flex' : 'none';
    });
  });

  // =========================================================================
  // Theme Toggle (Dark / Light)
  // =========================================================================
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('querix_theme', state.theme);
    updateThemeIcon();
    showToast(`Switched to ${state.theme} mode`);
  }

  function updateThemeIcon() {
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) {
      iconEl.setAttribute('data-lucide', state.theme === 'dark' ? 'moon' : 'sun');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  themeToggleBtn.addEventListener('click', toggleTheme);

  // =========================================================================
  // Keyboard Shortcuts (/, Ctrl+K, Ctrl+M, Ctrl+J, Escape)
  // =========================================================================
  document.addEventListener('keydown', (e) => {
    // Escape closes modals & user dropdown
    if (e.key === 'Escape') {
      closeUserDropdown();
      document.querySelectorAll('.modal.active, .voice-modal.active').forEach(m => {
        m.classList.remove('active');
      });
      stopListening();
      interruptSpeech();
      return;
    }

    // '/' Focuses chat input when not in another input
    if (e.key === '/' && document.activeElement !== chatTextarea && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      chatTextarea.focus();
      return;
    }

    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openModal(cmdPaletteModal);
      cmdInput.focus();
      return;
    }

    // Ctrl+M or Cmd+M: Toggle Voice
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      openVoiceModal();
      return;
    }

    // Ctrl+J: New Chat
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      resetNewChat();
      return;
    }
  });

  // =========================================================================
  // Sidebar Responsiveness & Helpers
  // =========================================================================
  function openSidebar() {
    sidebar.classList.add('mobile-open');
    sidebarOverlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  }

  toggleSidebarBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      openSidebar();
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  closeSidebarMobile.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  function resetNewChat() {
    messageList.innerHTML = '';
    emptyState.style.display = 'flex';
    state.sessionId = 'session_' + Date.now();
    showToast('Started a new conversation session');
  }

  newChatBtn.addEventListener('click', resetNewChat);

  document.getElementById('clear-history-btn').addEventListener('click', resetNewChat);

  closeSupportModalBtn.addEventListener('click', () => closeModal(supportModal));

  // Modal Helpers
  function openModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  // Allow clicking anywhere on modal backdrop to close modal
  document.querySelectorAll('.modal').forEach(modal => {
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => closeModal(modal));
    }
  });

  // Toast Helper
  let toastTimer = null;
  function showToast(msg) {
    toastText.textContent = msg;
    toastNotify.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotify.classList.remove('show');
    }, 2800);
  }

  function scrollToBottom() {
    chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHtml(text);
    // Bold **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet list lines
    parsed = parsed.replace(/^- (.*)$/gim, '• $1');
    return parsed;
  }

});
