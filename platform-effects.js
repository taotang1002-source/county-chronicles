
/*
  COUNTY CHRONICLES — B7
  PLATFORM MELTDOWN

  Adds:
  - Full-screen flashes
  - Screen shake
  - 28 flying fragments

  Works with existing B6 animations.
  Does not change scoring or canvas logic.
*/

(function () {
  'use strict';

  const style = document.createElement('style');

  style.textContent = `
    /* FULL-SCREEN FLASH */

    .b7-flash {
      position: fixed;
      inset: 0;
      z-index: 999998;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
    }

    .b7-flash.active {
      visibility: visible;
      animation: b7-flash-effect .7s steps(1) both;
    }

    @keyframes b7-flash-effect {
      0%   { opacity: 0; }
      12%  { opacity: .42; background: #ff315e; }
      22%  { opacity: 0; }
      34%  { opacity: .28; background: #36e0e4; }
      43%  { opacity: 0; }
      55%  { opacity: .32; background: #ff315e; }
      66%  { opacity: 0; }
      100% { opacity: 0; }
    }

    /* SCREEN SHAKE */

    body.b7-shaking .main-layout,
    body.b7-shaking .site-header {
      animation: b7-shake .55s linear both;
    }

    @keyframes b7-shake {
      0%   { transform: translate(0, 0); }
      10%  { transform: translate(-6px, 3px); }
      20%  { transform: translate(7px, -4px); }
      30%  { transform: translate(-8px, 5px); }
      40%  { transform: translate(6px, -5px); }
      50%  { transform: translate(-5px, 2px); }
      60%  { transform: translate(7px, 4px); }
      70%  { transform: translate(-4px, -3px); }
      80%  { transform: translate(3px, 2px); }
      100% { transform: translate(0, 0); }
    }

    /* EXPLODING FRAGMENTS */

    .b7-particle {
      position: fixed;
      left: 50%;
      top: 50%;
      width: var(--size);
      height: var(--size);
      background: var(--color);
      z-index: 1000001;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -50%);
    }

    .b7-particle.active {
      animation: b7-explode 1.45s cubic-bezier(.15,.6,.3,1)
        forwards;
    }

    @keyframes b7-explode {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(.2);
      }
      15% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform:
          translate(
            calc(-50% + var(--dx)),
            calc(-50% + var(--dy))
          )
          rotate(var(--rotation))
          scale(.3);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .b7-flash.active,
      body.b7-shaking .main-layout,
      body.b7-shaking .site-header,
      .b7-particle.active {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  const flash = document.createElement('div');
  flash.className = 'b7-flash';
  flash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flash);

  const overlay = document.querySelector('.b6-overlay');

  if (!overlay) {
    console.warn('B7: B6 overlay not found.');
    return;
  }

  let cleanupTimer = null;

  function clearEffects() {
    document.body.classList.remove('b7-shaking');
    flash.classList.remove('active');

    document.querySelectorAll('.b7-particle')
      .forEach(p => p.remove());
  }

  function explode(count) {
    const colors = [
      '#ff315e',
      '#36e0e4',
      '#ffffff',
      '#ff315e'
    ];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');

      particle.className = 'b7-particle active';

      const angle = (Math.PI * 2 * i) / count;
      const distance = 130 + Math.random() * 300;

      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      particle.style.setProperty('--dx', dx + 'px');
      particle.style.setProperty('--dy', dy + 'px');

      particle.style.setProperty(
        '--rotation',
        (Math.random() * 720 - 360) + 'deg'
      );

      particle.style.setProperty(
        '--size',
        (5 + Math.random() * 18) + 'px'
      );

      particle.style.setProperty(
        '--color',
        colors[i % colors.length]
      );

      if (i % 3 === 0) {
        particle.style.borderRadius = '50%';
      }

      document.body.appendChild(particle);
    }
  }

  function triggerEffects() {
    clearTimeout(cleanupTimer);
    clearEffects();

    const headline = overlay.querySelector('.b6-headline');
    const text = headline?.textContent?.trim() || '';

    let particleCount = 12;
    let shake = false;
    let flashing = false;

    if (text === 'UNLIKE!') {
      particleCount = 12;
    }

    if (text === 'REALITY BROKEN') {
      particleCount = 28;
      shake = true;
      flashing = true;
    }

    if (text === 'NO ONE IS WATCHING') {
      particleCount = 36;
      shake = true;
      flashing = true;
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion) return;

    if (shake) {
      document.body.classList.add('b7-shaking');
    }

    if (flashing) {
      flash.classList.add('active');
    }

    explode(particleCount);

    cleanupTimer = setTimeout(() => {
      clearEffects();
    }, 1550);
  }

  const observer = new MutationObserver(() => {
    if (overlay.classList.contains('active')) {
      triggerEffects();
    }
  });

  observer.observe(overlay, {
    attributes: true,
    attributeFilter: ['class']
  });

})();
