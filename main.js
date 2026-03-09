(function () {
  'use strict';

  /* ── Cursor + lagging ring ──────────────────────── */
  const cur  = document.getElementById('cur');
  const ring = document.getElementById('cur-ring');
  const spot = document.getElementById('spotlight');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left  = mx + 'px';
    cur.style.top   = my + 'px';
    spot.style.left = mx + 'px';
    spot.style.top  = my + 'px';
  });

  (function trail() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(trail);
  })();

  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, .config-card, .feature')) {
      cur.classList.add('grow'); ring.classList.add('hide');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, .config-card, .feature')) {
      cur.classList.remove('grow'); ring.classList.remove('hide');
    }
  });
  document.addEventListener('mouseleave', () => { cur.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cur.style.opacity = '1'; ring.style.opacity = '1'; });

  /* ── CSS Ripple engine ──────────────────────────────────────────────────
   * Each click injects a burst + 4 concentric rings into #ripple-stage.
   * All animation is CSS @keyframes — runs on the GPU compositor thread.
   * JS does zero work per frame; elements self-remove via animationend.
   * ─────────────────────────────────────────────────────────────────────── */
  const stage = document.getElementById('ripple-stage');
  const RINGS = [
    { cls: 'r1', s: 18, dur: 1.3,  delay: 0    },
    { cls: 'r2', s: 26, dur: 1.7,  delay: 0.07 },
    { cls: 'r3', s: 36, dur: 2.1,  delay: 0.15 },
    { cls: 'r4', s: 48, dur: 2.6,  delay: 0.25 },
  ];
  const DRAG_GAP = 55;
  let isDown = false, lastX = -999, lastY = -999;

  function spawn(x, y) {
    const b = document.createElement('div');
    b.className = 'rburst';
    b.style.cssText = `left:${x}px;top:${y}px`;
    stage.appendChild(b);
    b.addEventListener('animationend', () => b.remove(), { once: true });

    RINGS.forEach(r => {
      const el = document.createElement('div');
      el.className = `rring ${r.cls}`;
      el.style.cssText = `left:${x}px;top:${y}px;--s:${r.s};--dur:${r.dur}s;--delay:${r.delay}s`;
      stage.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    });
  }

  const hero = document.getElementById('hero');

  hero.addEventListener('mousedown', e => {
    isDown = true;
    spawn(e.clientX, e.clientY);
    lastX = e.clientX; lastY = e.clientY;
    coord(e.clientX, e.clientY);
  });
  hero.addEventListener('mousemove', e => {
    coord(e.clientX, e.clientY);
    if (!isDown) return;
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > DRAG_GAP) {
      spawn(e.clientX, e.clientY);
      lastX = e.clientX; lastY = e.clientY;
    }
  });
  hero.addEventListener('mouseup',    () => isDown = false);
  hero.addEventListener('mouseleave', () => isDown = false);

  hero.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    spawn(t.clientX, t.clientY);
    lastX = t.clientX; lastY = t.clientY;
  }, { passive: false });
  hero.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    if (Math.hypot(t.clientX - lastX, t.clientY - lastY) > DRAG_GAP) {
      spawn(t.clientX, t.clientY);
      lastX = t.clientX; lastY = t.clientY;
    }
  }, { passive: false });
  hero.addEventListener('touchend', () => isDown = false);

  // Welcome ripple sequence on load
  setTimeout(() => {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    spawn(cx, cy);
    setTimeout(() => spawn(cx - 130, cy + 70),  750);
    setTimeout(() => spawn(cx + 170, cy - 90),  1400);
    setTimeout(() => spawn(cx - 70,  cy - 110), 2000);
  }, 500);

  function coord(x, y) {
    document.getElementById('cx').textContent = 'x: ' + String(Math.round(x)).padStart(4, '0');
    document.getElementById('cy').textContent = 'y: ' + String(Math.round(y)).padStart(4, '0');
  }

  /* ── Nav scroll state ───────────────────────────── */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });
  nav.classList.toggle('scrolled', scrollY > 40);

  /* ── Mobile drawer ──────────────────────────────── */
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  burger && burger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer && drawer.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', () => {
    drawer.classList.remove('open');
    burger && burger.classList.remove('open');
    document.body.style.overflow = '';
  }));

  /* ── Smooth anchor scrolling ────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - nav.offsetHeight, behavior: 'smooth' });
    });
  });

  /* ── Scroll reveal (IntersectionObserver) ───────── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('on'));
  }

  /* ── Ticker pause on hover ──────────────────────── */
  const tt = document.getElementById('ticker-track');
  if (tt) {
    tt.addEventListener('mouseenter', () => tt.style.animationPlayState = 'paused');
    tt.addEventListener('mouseleave', () => tt.style.animationPlayState = 'running');
  }

})();
