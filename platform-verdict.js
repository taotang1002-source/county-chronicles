
/*
  COUNTY CHRONICLES — B6
  PLATFORM REJECTION SYSTEM

  REALNESS = 100 - 17 * items
  LIKES    = -83 * items
  VIEWS    = 1200000 - 200000 * items

  New: animated negative platform reactions.
  Existing canvas and Supabase functions remain untouched.
*/

(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const scoreEl = document.getElementById('realnessScore');

  if (!canvas || !scoreEl) return;

  const $ = id => document.getElementById(id);

  const fill = $('realnessFill');
  const status = $('realnessStatus');
  const likesEl = $('fictionalLikes');
  const viewsEl = $('fictionalViews');
  const tags = $('platformTags');
  const message = $('platformMessage');
  const activity = $('platformActivity');
  const toast = $('platformToast');
  const explanation = $('scoreExplanation');
  const stamp = document.querySelector('.platform-stamp');

  const categoryTags = {
    people: '#HUMAN_ELEMENT',
    objects: '#VINTAGE_OBJECT',
    buildings: '#COUNTY_ARCHITECTURE'
  };

  const categoryPhrases = {
    people: 'HUMAN PRESENCE ADDED. REALITY REDUCED.',
    objects: 'EVERYDAY OBJECT ADDED. ORIGINAL CONTEXT LOST.',
    buildings: 'ARCHITECTURE ADDED. LOCATION NO LONGER REQUIRED.'
  };

  let toastTimer;
  let updateTimer;
  let reactionTimer;
  let lastSignature = null;
  let suppressUntil = 0;

  let lastCounts = {
    images: 0,
    text: 0,
    categories: new Set()
  };

  // ========================================
  // B6 — ANIMATION STYLES
  // ========================================

  const animationCSS = document.createElement('style');

  animationCSS.textContent = `
    .b6-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(8, 8, 14, 0.74);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity .18s ease, visibility .18s;
    }

    .b6-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .b6-reaction {
      position: relative;
      width: min(88vw, 560px);
      text-align: center;
      transform: scale(.45) rotate(-12deg);
      opacity: 0;
    }

    .b6-overlay.active .b6-reaction {
      animation: b6-pop 1.85s ease-out both;
    }

    .b6-symbol {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 170px;
      margin-bottom: 10px;
      filter: drop-shadow(0 10px 24px rgba(255,49,94,.4));
    }

    .b6-symbol svg {
      width: 160px;
      height: 160px;
      overflow: visible;
    }

    .b6-overlay.active .b6-symbol svg {
      animation: b6-heart 1.6s ease-in-out both;
    }

    .b6-headline {
      font-family: Impact, 'Arial Black', Arial, sans-serif;
      font-size: clamp(58px, 11vw, 120px);
      font-weight: 900;
      line-height: .95;
      letter-spacing: -.025em;
      color: #ff315e;
      text-shadow:
        5px 5px 0 #08080d,
        -3px -3px 0 #36e0e4;
      overflow-wrap: anywhere;
    }

    .b6-headline.long {
      font-size: clamp(40px, 7vw, 78px);
    }

    .b6-subtitle {
      display: inline-block;
      margin-top: 22px;
      padding: 9px 14px;
      background: #ff315e;
      color: #fff;
      font: 700 12px/1.5 Consolas, monospace;
      letter-spacing: .08em;
      max-width: 95%;
    }

    .b6-fragments {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .b6-fragment {
      position: absolute;
      top: 28%;
      left: 50%;
      width: 12px;
      height: 12px;
      background: #ff315e;
      opacity: 0;
    }

    .b6-overlay.active .b6-fragment {
      animation: b6-shatter 1.4s ease-out both;
      animation-delay: .18s;
    }

    .b6-fragment:nth-child(1) { --dx:-180px; --dy:-110px; --rot:75deg; }
    .b6-fragment:nth-child(2) { --dx:150px; --dy:-145px; --rot:140deg; background:#36e0e4; }
    .b6-fragment:nth-child(3) { --dx:-220px; --dy:60px; --rot:220deg; }
    .b6-fragment:nth-child(4) { --dx:210px; --dy:80px; --rot:310deg; }
    .b6-fragment:nth-child(5) { --dx:-90px; --dy:170px; --rot:170deg; background:#36e0e4; }
    .b6-fragment:nth-child(6) { --dx:90px; --dy:165px; --rot:280deg; }
    .b6-fragment:nth-child(7) { --dx:-40px; --dy:-190px; --rot:120deg; }
    .b6-fragment:nth-child(8) { --dx:40px; --dy:-185px; --rot:240deg; background:#36e0e4; }

    @keyframes b6-pop {
      0% { opacity:0; transform:scale(.45) rotate(-12deg); }
      18% { opacity:1; transform:scale(1.13) rotate(3deg); }
      29% { transform:scale(.97) rotate(-2deg); }
      40% { transform:scale(1) rotate(0); }
      78% { opacity:1; transform:scale(1); }
      100% { opacity:0; transform:scale(1.2); }
    }

    @keyframes b6-heart {
      0% { transform:scale(.2) rotate(-20deg); }
      20% { transform:scale(1.2) rotate(8deg); }
      35% { transform:scale(.9) rotate(-5deg); }
      48% { transform:scale(1.05); }
      100% { transform:scale(1); }
    }

    @keyframes b6-shatter {
      0%, 15% { opacity:0; transform:translate(0,0) scale(.3); }
      28% { opacity:1; }
      100% {
        opacity:0;
        transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(.3);
      }
    }

    @media (max-width: 600px) {
      .b6-symbol { height: 130px; }
      .b6-symbol svg { width: 125px; height: 125px; }
      .b6-subtitle { font-size: 10px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .b6-overlay.active .b6-reaction,
      .b6-overlay.active .b6-symbol svg,
      .b6-overlay.active .b6-fragment {
        animation: none;
      }
      .b6-overlay.active .b6-reaction {
        opacity: 1;
        transform: none;
      }
    }
  `;

  document.head.appendChild(animationCSS);

  // ========================================
  // B6 — REACTION ELEMENT
  // ========================================

  const overlay = document.createElement('div');
  overlay.className = 'b6-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="b6-reaction">
      <div class="b6-fragments">
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
        <i class="b6-fragment"></i>
      </div>
      <div class="b6-symbol"></div>
      <div class="b6-headline"></div>
      <div class="b6-subtitle"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const reactionSymbol = overlay.querySelector('.b6-symbol');
  const reactionHeadline = overlay.querySelector('.b6-headline');
  const reactionSubtitle = overlay.querySelector('.b6-subtitle');

  const heartSVG = `
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <path
        d="M90 158 C65 135 12 105 12 61
           C12 17 65 12 90 45
           C115 12 168 17 168 61
           C168 105 115 135 90 158Z"
        fill="#ff315e"
      />
    </svg>
  `;

  const brokenHeartSVG = `
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <path
        d="M90 158 C65 135 12 105 12 61
           C12 17 65 12 90 45
           C115 12 168 17 168 61
           C168 105 115 135 90 158Z"
        fill="#ff315e"
      />
      <path
        d="M90 45 L71 74 L98 91 L78 113
           L96 131 L90 158"
        fill="none"
        stroke="#111116"
        stroke-width="10"
        stroke-linejoin="round"
      />
    </svg>
  `;

  const eyeSVG = `
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <path
        d="M16 90 Q90 8 164 90 Q90 172 16 90Z"
        fill="none"
        stroke="#ff315e"
        stroke-width="12"
      />
      <circle cx="90" cy="90" r="28" fill="#ff315e"/>
      <path
        d="M22 158 L158 22"
        stroke="#36e0e4"
        stroke-width="15"
        stroke-linecap="round"
      />
    </svg>
  `;

  function showReaction(type) {
    const reactions = {
      unlike: {
        headline: 'UNLIKE!',
        subtitle: 'YOUR REALITY HAS BEEN REJECTED',
        symbol: heartSVG
      },
      broken: {
        headline: 'REALITY BROKEN',
        subtitle: 'REALNESS BELOW ZERO — SYSTEM DISAPPROVES',
        symbol: brokenHeartSVG
      },
      invisible: {
        headline: 'NO ONE IS WATCHING',
        subtitle: 'NEGATIVE VIEWS DETECTED',
        symbol: eyeSVG
      }
    };

    const reaction = reactions[type];
    if (!reaction) return;

    clearTimeout(reactionTimer);

    reactionHeadline.textContent = reaction.headline;
    reactionHeadline.classList.toggle(
      'long',
      type !== 'unlike'
    );

    reactionSubtitle.textContent = reaction.subtitle;
    reactionSymbol.innerHTML = reaction.symbol;

    // Restart CSS animations.
    overlay.classList.remove('active');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    reactionTimer = setTimeout(() => {
      overlay.classList.remove('active');
    }, 1850);
  }

  // ========================================
  // ORIGINAL B5 — CANVAS SNAPSHOT
  // ========================================

  function snapshot() {
    const all = [
      ...canvas.querySelectorAll('.canvas-item')
    ];

    const images = all.filter(
      el => !!el.querySelector('img')
    );

    const text = all.filter(
      el => el.classList.contains('dialogue-item')
    ).length;

    const categories = new Set(
      images
        .map(el => el.dataset.category)
        .filter(Boolean)
    );

    return {
      images: images.length,
      text,
      categories,
      count: all.length
    };
  }

  // ========================================
  // ORIGINAL B5 — PLATFORM ANNOUNCEMENTS
  // ========================================

  function announce(line) {
    if (message) {
      message.textContent = line;
    }

    if (activity) {
      const entry = document.createElement('div');
      entry.className = 'activity-entry';
      entry.textContent = line;
      activity.prepend(entry);

      while (activity.children.length > 5) {
        activity.lastElementChild.remove();
      }
    }

    if (toast) {
      toast.textContent = line;
      toast.classList.add('visible');

      clearTimeout(toastTimer);

      toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
      }, 2700);
    }
  }

  // ========================================
  // B5 METRICS + B6 TRIGGER LOGIC
  // ========================================

  function update() {
    const now = snapshot();

    const realness = 100 - 17 * now.count;
    const likes = -83 * now.count;
    const views = 1200000 - 200000 * now.count;

    scoreEl.innerHTML =
      realness.toLocaleString('en-US') +
      '<span>%</span>';

    if (likesEl) {
      likesEl.textContent =
        likes.toLocaleString('en-US');
    }

    if (viewsEl) {
      viewsEl.textContent =
        views.toLocaleString('en-US');
    }

    if (fill) {
      fill.style.width =
        Math.max(0, Math.min(100, realness)) + '%';
    }

    if (status) {
      status.textContent =
        now.count === 0
          ? 'UNTOUCHED REALITY'
          : realness > 0
            ? 'REALITY DECREASING — APPROVAL WITHDRAWN'
            : realness === 0
              ? 'REALITY EXHAUSTED'
              : 'BEYOND ZERO — REALITY IN DEBT';
    }

    if (stamp) {
      stamp.textContent =
        now.count === 0
          ? '100% UNTOUCHED REALITY'
          : '↓ APPROVAL WITHDRAWN · −' +
            now.count +
            ' FRAGMENTS';
    }

    if (tags) {
      const labels = [
        '#COUNTYCORE',
        '#NOSTALGIA',
        ...[...now.categories]
          .map(c => categoryTags[c])
          .filter(Boolean)
      ];

      tags.replaceChildren(
        ...labels.map(t => {
          const e = document.createElement('span');
          e.textContent = t;
          return e;
        })
      );
    }

    const signature = [
      now.images,
      now.text,
      [...now.categories].sort().join(',')
    ].join('|');

    if (signature !== lastSignature) {
      if (lastSignature !== null) {
        const oldCount =
          lastCounts.images + lastCounts.text;

        // B6 — Trigger only when crossing thresholds
        // while ADDING items, not while deleting.
        if (now.count > oldCount) {
          if (oldCount < 7 && now.count >= 7) {
            showReaction('invisible');
          } else if (oldCount < 6 && now.count >= 6) {
            showReaction('broken');
          } else if (oldCount < 1 && now.count >= 1) {
            showReaction('unlike');
          }
        }

        // Original B5 activity feedback
        if (Date.now() >= suppressUntil) {
          if (now.count > oldCount) {
            const added = [...now.categories].find(
              c => !lastCounts.categories.has(c)
            );

            announce(
              added && now.images > lastCounts.images
                ? categoryPhrases[added]
                : now.text > lastCounts.text &&
                  now.images === lastCounts.images
                  ? 'A NEW CAPTION ADDED. REALITY −17%. LIKES −83.'
                  : 'ANOTHER FRAGMENT ADDED. ORIGINAL REALITY FURTHER AWAY.'
            );
          } else if (now.count < oldCount) {
            announce(
              now.count === 0
                ? 'REALITY RESTORED TO 100%. ALL NEGATIVE METRICS RESET.'
                : 'FRAGMENT REMOVED. REALNESS +17%. LIKES +83. VIEWS +200,000.'
            );
          }
        }
      }

      lastSignature = signature;

      lastCounts = {
        images: now.images,
        text: now.text,
        categories: now.categories
      };
    }
  }

  // ========================================
  // ORIGINAL B5 — CANVAS OBSERVER
  // ========================================

  const observer = new MutationObserver(mutations => {
    const canvasItemsChanged = mutations.some(
      m => [
        ...m.addedNodes,
        ...m.removedNodes
      ].some(
        n =>
          n.nodeType === 1 &&
          n.classList?.contains('canvas-item')
      )
    );

    if (!canvasItemsChanged) return;

    clearTimeout(updateTimer);

    updateTimer = setTimeout(update, 45);
  });

  observer.observe(canvas, {
    childList: true
  });

  update();

  // ========================================
  // ORIGINAL B5 — SCORE EXPLANATION
  // ========================================

  if (explanation) {
    const small = explanation.querySelector('small');

    if (small) {
      small.textContent =
        'Fictional rules: REALNESS = 100% − 17% per item; ' +
        'LIKES = 0 − 83 per item; ' +
        'VIEWS = 1,200,000 − 200,000 per item. ' +
        'Deleting restores all three metrics. ' +
        'No minimum score. These numbers are fictional.';
    }
  }

  scoreEl.addEventListener('click', () => {
    if (explanation) {
      explanation.hidden = !explanation.hidden;

      if (!explanation.hidden) {
        announce(
          'THE SCORE MEASURES CONSTRUCTION, NOT REALITY.'
        );
      }
    }
  });

  // ========================================
  // ORIGINAL B5 — ALGORITHM FEEDBACK
  // ========================================

  $('makeAnotherCountyBtn')?.addEventListener(
    'click',
    () => {
      suppressUntil = Date.now() + 1200;

      announce(
        'ALGORITHM ENGINE™: REPLACING YOUR REALITY WITH ANOTHER VERSION.'
      );

      setTimeout(() => {
        update();

        if (snapshot().count > 0) {
          announce(
            'NEW COUNTY GENERATED. EACH FRAGMENT REDUCES REALNESS, LIKES AND VIEWS.'
          );
        }
      }, 220);
    }
  );

  // ========================================
  // ORIGINAL B5 — UPLOAD FEEDBACK
  // ========================================

  const library = document.querySelector('.library');

  if (library) {
    let initialized = false;

    const libObserver = new MutationObserver(
      mutations => {
        if (!initialized) return;

        const materialAdded = mutations.some(
          m => [...m.addedNodes].some(
            n =>
              n.nodeType === 1 &&
              n.classList?.contains('user-material')
          )
        );

        if (materialAdded) {
          announce(
            'UPLOAD ACCEPTED. YOUR IMAGE IS NOW A REUSABLE PLATFORM ASSET.'
          );
        }
      }
    );

    libObserver.observe(library, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      initialized = true;
    }, 2500);
  }
})();
