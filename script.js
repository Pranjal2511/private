(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // CONSTANTS & DATES (ASIA/KOLKATA TIMEZONE)
  // ---------------------------------------------------------------------------
  const RELATIONSHIP_START_IST = new Date('2023-10-29T00:00:00+05:30').getTime();
  const ANNIVERSARY_TARGET_IST = new Date('2026-10-29T00:00:00+05:30').getTime();

  const HEARTS = ['♡', '♥', '✧', '✦', '💕', '💗', '💖'];
  const EXTRA_REASONS = [
    'Because being loved by you has turned ordinary life into something full of quiet magic.',
    'Because you still make me smile at the most unexpected times in the day.',
    'Because your laugh is still my absolute favourite sound in the world.',
    'Because whenever I picture the future, you are always right there in it.',
    'Because we do not have to be perfect to keep choosing to be kind to each other.',
    'Because you are not just a chapter of my story — you are the whole reason it feels so beautiful.',
    'Because after three years, there is still so much about you I want to learn and adore.',
    'Because even the quietest Tuesday evening feels special when I get to spend it with you.',
    'Because you feel like coming home after a very long day.',
    'Because out of everyone in this world, I would still choose you. Every single time.'
  ];

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const maxFloatingHearts = reducedMotion ? 0 : (isMobile ? 3 : 7);

  // ---------------------------------------------------------------------------
  // DOM REFERENCES
  // ---------------------------------------------------------------------------
  const audio = document.getElementById('loveSong');
  const musicButton = document.querySelector('.music-toggle');
  const musicLabel = document.querySelector('.music-label');
  const toast = document.getElementById('toast');
  const heartsContainer = document.querySelector('.floating-hearts');

  let heartIntervalId = null;
  let lastAudioPositionSave = 0;
  let lastSparkleTime = 0;

  // ---------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // AUDIO CONTROLS ("TUM JO AAYE")
  // ---------------------------------------------------------------------------
  function updateMusicUi(isPlaying) {
    if (!musicButton) return;
    musicButton.classList.toggle('is-playing', isPlaying);
    musicButton.setAttribute('aria-pressed', String(isPlaying));
    musicButton.setAttribute('aria-label', isPlaying ? 'Pause Tum Jo Aaye' : 'Play Tum Jo Aaye');
    if (musicLabel) {
      musicLabel.textContent = isPlaying ? 'Tum Jo Aaye ♫' : 'Play our song';
    }
  }

  async function playSong(isAutoAttempt = false) {
    if (!audio) return;
    try {
      audio.volume = 0.45;

      // Restore position if available
      const savedTime = Number(sessionStorage.getItem('loveMusicTime') || 0);
      if (Number.isFinite(savedTime) && savedTime > 0 && Math.abs(audio.currentTime - savedTime) > 2) {
        if (audio.readyState >= 1) {
          try {
            audio.currentTime = Math.min(savedTime, Math.max(0, (audio.duration || savedTime) - 1));
          } catch (_) {}
        } else {
          audio.addEventListener('loadedmetadata', () => {
            try {
              audio.currentTime = Math.min(savedTime, Math.max(0, (audio.duration || savedTime) - 1));
            } catch (_) {}
          }, { once: true });
        }
      }

      await audio.play();
      sessionStorage.setItem('loveMusicOn', '1');
      sessionStorage.removeItem('loveMusicExplicitlyPaused');
      updateMusicUi(true);

      // Hide welcome modal if open
      const welcomeModal = document.getElementById('welcomeModal');
      if (welcomeModal) welcomeModal.classList.remove('show');

      if (!isAutoAttempt) {
        showToast('Playing "Tum Jo Aaye" ♡');
      }
    } catch (err) {
      updateMusicUi(false);
      // Browser blocked autoplay
      if (isAutoAttempt && sessionStorage.getItem('loveMusicExplicitlyPaused') !== '1') {
        showWelcomeModal();
      }
    }
  }

  function pauseSong() {
    if (!audio) return;
    audio.pause();
    sessionStorage.setItem('loveMusicOn', '0');
    sessionStorage.setItem('loveMusicExplicitlyPaused', '1');
    sessionStorage.setItem('loveMusicTime', String(audio.currentTime || 0));
    updateMusicUi(false);
    showToast('Music paused ♡');
  }

  function showWelcomeModal() {
    let modal = document.getElementById('welcomeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'welcomeModal';
      modal.className = 'welcome-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'welcomeTitle');
      modal.innerHTML = `
        <div class="welcome-box">
          <div class="welcome-icon">♥</div>
          <h2 id="welcomeTitle">Our Little Universe</h2>
          <p>Happy 3rd Anniversary, my love. Step into our world and listen to "Tum Jo Aaye" together.</p>
          <button class="button button-rose" id="welcomePlayBtn" type="button">
            Enter Our World & Play Song ♫
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      const playBtn = modal.querySelector('#welcomePlayBtn');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          modal.classList.remove('show');
          playSong(false);
          createHeartBurst(modal.getBoundingClientRect().left + modal.clientWidth / 2, modal.getBoundingClientRect().top + modal.clientHeight / 2, 8);
        });
      }
    }
    // Show with slight delay for gentle entrance
    window.setTimeout(() => modal.classList.add('show'), 450);
  }

  if (audio) {
    if (musicButton) {
      musicButton.addEventListener('click', () => {
        if (audio.paused) {
          playSong(false);
        } else {
          pauseSong();
        }
      });
    }

    audio.addEventListener('play', () => updateMusicUi(true));
    audio.addEventListener('pause', () => updateMusicUi(false));
    audio.addEventListener('ended', () => {
      // Loop seamlessly
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    // Throttled time storage to prevent layout/sessionStorage overhead
    audio.addEventListener('timeupdate', () => {
      if (!audio.paused && audio.currentTime - lastAudioPositionSave >= 3.5) {
        lastAudioPositionSave = audio.currentTime;
        sessionStorage.setItem('loveMusicTime', String(Math.floor(lastAudioPositionSave)));
      }
    });

    window.addEventListener('pagehide', () => {
      if (audio && Number.isFinite(audio.currentTime)) {
        sessionStorage.setItem('loveMusicTime', String(audio.currentTime));
      }
    });

    // User gesture listener to unlock audio if autoplay was restricted
    const unlockOnGesture = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('.music-toggle, #welcomePlayBtn')) return;
      document.removeEventListener('pointerdown', unlockOnGesture, true);
      document.removeEventListener('keydown', unlockOnGesture, true);
      if (audio.paused && sessionStorage.getItem('loveMusicExplicitlyPaused') !== '1') {
        playSong(true);
      }
    };
    document.addEventListener('pointerdown', unlockOnGesture, true);
    document.addEventListener('keydown', unlockOnGesture, true);

    // Initial autoplay attempt
    if (sessionStorage.getItem('loveMusicExplicitlyPaused') !== '1') {
      playSong(true);
    } else {
      updateMusicUi(false);
    }
  }

  // Links that intend to start music immediately
  document.querySelectorAll('[data-start-music]').forEach(link => {
    link.addEventListener('click', () => {
      if (audio && audio.paused) {
        audio.volume = 0.45;
        audio.play().catch(() => {});
        sessionStorage.setItem('loveMusicOn', '1');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ACTIVE NAVIGATION HIGHLIGHT
  // ---------------------------------------------------------------------------
  const currentPage = document.body.classList.contains('page-home') ? 'home'
    : document.body.classList.contains('page-story') ? 'story'
    : document.body.classList.contains('page-reasons') ? 'reasons'
    : document.body.classList.contains('page-letter') ? 'letter' : '';

  document.querySelectorAll('.site-nav a').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // ---------------------------------------------------------------------------
  // INDIAN STANDARD TIME CLOCK & COUNTDOWN / CELEBRATION
  // ---------------------------------------------------------------------------
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');
  const countdownTile = document.querySelector('.countdown-tile');
  const countdownLabel = document.getElementById('countdownLabel');
  const countdownValue = document.getElementById('countdownValue');
  const countdownSub = document.getElementById('countdownSub');

  const clockFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });

  function updateLiveClockAndCountdown() {
    const now = new Date();
    if (clockEl) clockEl.textContent = `${clockFormatter.format(now)} IST`;
    if (dateEl) dateEl.textContent = dateFormatter.format(now);

    if (countdownValue) {
      const nowMs = now.getTime();

      // Check if 29 October 2026 has arrived in India
      if (nowMs >= ANNIVERSARY_TARGET_IST) {
        if (countdownTile) countdownTile.classList.add('celebration-mode');
        if (countdownLabel) countdownLabel.textContent = 'HAPPY 3RD ANNIVERSARY! 🎉';
        countdownValue.textContent = 'Three Years of Us ♡';
        if (countdownSub) countdownSub.textContent = '29 October 2023 — 29 October 2026 · Celebrating today!';
      } else {
        const diff = ANNIVERSARY_TARGET_IST - nowMs;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (countdownLabel) countdownLabel.textContent = 'UNTIL OUR ANNIVERSARY';
        countdownValue.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        if (countdownSub) countdownSub.textContent = '29 October 2026 · midnight IST ♡';
      }
    }
  }

  updateLiveClockAndCountdown();
  window.setInterval(updateLiveClockAndCountdown, 1000);

  // ---------------------------------------------------------------------------
  // LIGHTWEIGHT FLOATING HEARTS (STRICT POOLING, NO MEMORY LEAKS)
  // ---------------------------------------------------------------------------
  function spawnFloatingHeart() {
    if (reducedMotion || document.hidden || !heartsContainer) return;
    if (heartsContainer.childElementCount >= maxFloatingHearts) return;

    const heart = document.createElement('span');
    heart.className = 'float-heart';
    if (Math.random() > 0.65) heart.classList.add('romantic-glow');
    heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];

    const leftPos = 4 + Math.random() * 92;
    const fontSize = 13 + Math.random() * 11;
    const duration = isMobile ? (7 + Math.random() * 3) : (9 + Math.random() * 4);
    const drift = Math.round((Math.random() - 0.5) * 44);

    heart.style.left = `${leftPos}%`;
    heart.style.fontSize = `${fontSize}px`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.setProperty('--drift', `${drift}px`);

    heart.addEventListener('animationend', () => heart.remove(), { once: true });
    heartsContainer.appendChild(heart);
  }

  function startHeartEmitter() {
    if (reducedMotion || heartIntervalId || document.hidden) return;
    // Spawn initial heart
    spawnFloatingHeart();
    heartIntervalId = window.setInterval(spawnFloatingHeart, isMobile ? 3200 : 2200);
  }

  function stopHeartEmitter() {
    if (heartIntervalId) {
      window.clearInterval(heartIntervalId);
      heartIntervalId = null;
    }
  }

  startHeartEmitter();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopHeartEmitter();
    } else {
      startHeartEmitter();
    }
  });

  // ---------------------------------------------------------------------------
  // CLICK SPARKLES & HEART BURSTS (THROTTLED & AUTO-CLEANED)
  // ---------------------------------------------------------------------------
  function createHeartBurst(originX, originY, count = 5) {
    if (reducedMotion || !heartsContainer) return;
    const safeCount = Math.min(count, 8);
    const symbols = ['♡', '♥', '✧', '✦', '💕'];

    for (let i = 0; i < safeCount; i++) {
      const spark = document.createElement('span');
      spark.className = 'love-spark';
      spark.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      spark.style.left = `${originX}px`;
      spark.style.top = `${originY}px`;

      const angle = (Math.PI * 2 * i) / safeCount + (Math.random() - 0.5) * 0.4;
      const distance = 40 + Math.random() * 65;
      const deltaX = Math.round(Math.cos(angle) * distance);
      const deltaY = Math.round(Math.sin(angle) * distance - 25);

      spark.style.setProperty('--spark-x', `${deltaX}px`);
      spark.style.setProperty('--spark-y', `${deltaY}px`);
      spark.style.fontSize = `${14 + Math.random() * 12}px`;

      spark.addEventListener('animationend', () => spark.remove(), { once: true });
      heartsContainer.appendChild(spark);
    }
  }

  document.addEventListener('click', (e) => {
    const target = e.target && e.target.closest && e.target.closest('.button, .page-card, .music-toggle, .text-link, .underlined-link, [data-heart-burst], #sendKiss, #reasonButton');
    if (!target) return;

    const now = Date.now();
    if (now - lastSparkleTime < 240) return;
    lastSparkleTime = now;

    const rect = target.getBoundingClientRect();
    const clickX = e.clientX || (rect.left + rect.width / 2);
    const clickY = e.clientY || (rect.top + rect.height / 2);
    createHeartBurst(clickX, clickY, 5);
  });

  // ---------------------------------------------------------------------------
  // OUR STORY PAGE: TIMELINE SCROLL REVEAL (INTERSECTION OBSERVER)
  // ---------------------------------------------------------------------------
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length > 0 && 'IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    timelineItems.forEach(item => observer.observe(item));
  } else {
    timelineItems.forEach(item => item.classList.add('is-visible'));
  }

  // ---------------------------------------------------------------------------
  // REASONS PAGE: RANDOM SURPRISE GENERATOR
  // ---------------------------------------------------------------------------
  const reasonBtn = document.getElementById('reasonButton');
  const randomReasonEl = document.getElementById('randomReason');

  if (reasonBtn && randomReasonEl) {
    let lastIndex = -1;
    reasonBtn.addEventListener('click', () => {
      let nextIndex = Math.floor(Math.random() * EXTRA_REASONS.length);
      if (nextIndex === lastIndex) {
        nextIndex = (nextIndex + 1) % EXTRA_REASONS.length;
      }
      lastIndex = nextIndex;

      randomReasonEl.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });

      randomReasonEl.textContent = EXTRA_REASONS[nextIndex];
    });
  }

  // ---------------------------------------------------------------------------
  // LOVE LETTER PAGE: KISS BUTTON INTERACTION
  // ---------------------------------------------------------------------------
  const kissButton = document.getElementById('sendKiss');
  if (kissButton) {
    kissButton.addEventListener('click', (e) => {
      const rect = kissButton.getBoundingClientRect();
      createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
      showToast('A thousand kisses sent straight to you 💋♡');
    });
  }

})();
