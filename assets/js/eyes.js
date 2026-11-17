/* Guido's eyes on About and the case studies.
   They follow the cursor as on the home page (same look, same moods, same speech bubbles, styled in site.css),
   glow white over pictures, and when the cursor stops on a long paragraph they read it, then sum it up in one
   line: the paragraph's data-tldr, written for each one in tools/tldr.json.
   A small switch in the corner turns them off and on, and the choice is remembered.
   Only where there is a cursor to follow, and not for people who asked for less motion. */
(() => {
  'use strict';
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const READ_AFTER = 1800;   // the cursor has stopped on a paragraph: the eyes start reading it
  const SUM_AFTER = 5000;    // ...and say what it is about
  const STILL = 30;          // moving less than this many pixels still counts as stopped
  const rand = (a, b) => a + Math.random() * (b - a);
  const remember = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } };
  const recall = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

  /* ---------- The eyes, their speech, and the switch ---------- */
  const host = document.createElement('div');
  host.className = 'mascot-cursor mascot-cursor--page';
  host.innerHTML = `<div class="mascot is-light" data-mood="calm" aria-hidden="true"><svg viewBox="0 0 30 28">
    <g class="m-look">
      <g class="m-open"><rect class="m-eye" x="5" y="2" width="7" height="12" rx="3.5"/><rect class="m-eye m-eye--r" x="18" y="2" width="7" height="12" rx="3.5"/></g>
      <g class="m-flat"><rect x="4.5" y="6.5" width="8" height="3" rx="1.5"/><rect x="17.5" y="6.5" width="8" height="3" rx="1.5"/></g>
      <g class="m-happy" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 10q3.5-6 7 0"/><path d="M18 10q3.5-6 7 0"/></g>
      <g class="m-spark"><path d="M8.5 1.6Q9.6 6.9 14.9 8Q9.6 9.1 8.5 14.4Q7.4 9.1 2.1 8Q7.4 6.9 8.5 1.6Z"/><path d="M21.5 1.6Q22.6 6.9 27.9 8Q22.6 9.1 21.5 14.4Q20.4 9.1 15.1 8Q20.4 6.9 21.5 1.6Z"/></g>
      <g class="m-mouth" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path class="m-smile" d="M9 19.5q6 6.5 12 0"/><path class="m-hmm" d="M11.5 22.5q1.75-1.6 3.5 0t3.5 0"/></g>
    </g></svg></div>`;
  const mascot = host.firstElementChild;
  const svg = mascot.querySelector('svg');
  const look = mascot.querySelector('.m-look');
  const eyes = [...mascot.querySelectorAll('.m-eye')];

  const say = document.createElement('div');
  say.className = 'say';
  say.setAttribute('aria-hidden', 'true');   // decorative: every summary repeats what the page already says

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'eyes-toggle';
  toggle.innerHTML = `<svg viewBox="0 0 30 18" aria-hidden="true">
      <g class="eyes-toggle__open"><rect x="5" y="2" width="7" height="12" rx="3.5"/><rect x="18" y="2" width="7" height="12" rx="3.5"/></g>
      <g class="eyes-toggle__shut"><rect x="4.5" y="6.5" width="8" height="3" rx="1.5"/><rect x="17.5" y="6.5" width="8" height="3" rx="1.5"/></g>
    </svg><span class="eyes-toggle__label"></span>`;
  const toggleLabel = toggle.querySelector('.eyes-toggle__label');
  document.body.append(host, say, toggle);

  let on = recall('gc-eyes') !== 'off';
  let ptr = null;            // last pointer position
  let lastMove = 0;
  let inside = false;        // the pointer is in the window
  const mood = (m) => { mascot.dataset.mood = m; };
  const settle = (m, ms) => setTimeout(() => { if (mascot.dataset.mood === m) mood('calm'); }, ms);

  /* ---------- Blinks ---------- */
  function blink() {
    eyes.forEach((e) => e.animate(
      [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }],
      { duration: 180, easing: 'ease-in-out' }
    ));
  }
  (function blinkLater() {
    setTimeout(() => {
      if (on && inside && !document.hidden && mascot.dataset.mood === 'calm') {
        blink();
        if (Math.random() < 0.25) setTimeout(blink, 280);
      }
      blinkLater();
    }, rand(2200, 6200));
  })();
  function hop() {
    svg.animate([{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }], { duration: 460, easing: 'ease-out' });
  }

  /* ---------- Speech: the same bubbles as on the home page, kept inside the window ---------- */
  const MAX_LINES = 2;
  const lines = [];
  const readingTime = (text) => 2400 + text.length * 45;
  function dropLine(line) {
    const i = lines.indexOf(line);
    if (i < 0) return;
    lines.splice(i, 1);
    line.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    line.el.classList.remove('is-on');
    setTimeout(() => line.el.remove(), 320);
  }
  const speaking = (key) => lines.some((l) => l.key === key);
  let sayRaf = 0;
  function placeSay() {
    sayRaf = 0;
    if (!say.childElementCount) return;
    const r = mascot.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = say.offsetWidth;
    const h = say.offsetHeight;
    const last = say.lastElementChild.offsetHeight;
    const left = r.right + 10 + w <= vw - 12;
    say.classList.toggle('is-left', !left);
    const x = Math.min(Math.max(left ? r.right + 10 : r.left - 10 - w, 12), vw - 12 - w);
    const y = Math.min(Math.max(r.top + r.height / 2 + last / 2 - h, 12), vh - 12 - h);
    say.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    sayRaf = requestAnimationFrame(placeSay);
  }
  function speak(text, key = text) {
    if (speaking(key)) return;
    while (lines.length >= MAX_LINES) dropLine(lines[0]);
    const el = document.createElement('div');
    el.className = 'say__line';
    say.append(el);
    const line = { el, key, timers: [] };
    lines.push(line);
    requestAnimationFrame(() => el.classList.add('is-on'));
    if (!sayRaf) placeSay();
    el.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    line.timers.push(setTimeout(() => {
      let i = 0;
      el.textContent = '';
      const typing = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(typing);
          line.timers.push(setTimeout(() => dropLine(line), readingTime(text)));
        }
      }, 24);
      line.timers.push(typing);
    }, 450));
  }
  const hush = () => lines.slice().forEach(dropLine);

  /* ---------- Following the cursor, with a little stretch; where the eyes look ---------- */
  const pos = { x: 0, y: 0 };
  const eye = { x: 0, y: 0 };
  let idleGaze = { x: 0, y: 0 };
  let reading = false;       // running along the lines of a paragraph
  let raf = 0;
  (function glanceLater() {
    setTimeout(() => {
      if (performance.now() - lastMove > 2500 && !reading) { idleGaze = Math.random() < 0.3 ? { x: 0, y: 0 } : { x: rand(-3.4, 3.4), y: rand(-2.4, 2.2) }; kick(); }
      glanceLater();
    }, rand(900, 2600));
  })();
  function eyeGoal() {
    if (reading) return { x: Math.sin(performance.now() / 420) * 3.2, y: 1.8 };   // left to right, along the text
    if (!ptr || performance.now() - lastMove > 2500) return idleGaze;
    const r = mascot.getBoundingClientRect();
    const dx = ptr.x - (r.left + r.width / 2);
    const dy = ptr.y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 90);
    return { x: (dx / d) * 3.4 * k, y: (dy / d) * 2.6 * k };
  }
  function frame() {
    let busy = reading;
    if (ptr) {
      const lx = ptr.x + 16 - pos.x, ly = ptr.y + 18 - pos.y;
      pos.x += lx * 0.16;
      pos.y += ly * 0.16;
      host.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      const s = Math.min(0.3, Math.hypot(lx, ly) / 260);   // the faster it chases, the more it stretches
      const a = Math.atan2(ly, lx);
      svg.style.transform = s > 0.01 ? `rotate(${a}rad) scale(${1 + s}, ${1 - s * 0.55}) rotate(${-a}rad)` : '';
      busy = busy || Math.abs(lx) + Math.abs(ly) > 0.3;
    }
    const g = eyeGoal();
    eye.x += (g.x - eye.x) * 0.24;
    eye.y += (g.y - eye.y) * 0.24;
    look.style.transform = `translate(${eye.x.toFixed(2)}px, ${eye.y.toFixed(2)}px)`;
    busy = busy || Math.abs(g.x - eye.x) + Math.abs(g.y - eye.y) > 0.03;
    raf = busy && on ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf && on) raf = requestAnimationFrame(frame); }
  const show = () => host.classList.toggle('is-shown', on && inside && !!ptr);

  /* ---------- Resting on a paragraph: read it, then sum it up ---------- */
  let para = null;           // the paragraph under the cursor
  let anchor = null;         // where the cursor stopped on it
  let said = null;           // already summed up: not again until the cursor has been somewhere else
  let readTimer = 0;
  let sumTimer = 0;
  function rest(p) {
    clearTimeout(readTimer);
    clearTimeout(sumTimer);
    if (reading) { reading = false; if (mascot.dataset.mood === 'think') mood('calm'); }
    if (p !== para && para === said) said = null;
    para = p;
    anchor = ptr && { x: ptr.x, y: ptr.y };
    if (!p || !on || p === said) return;
    readTimer = setTimeout(() => { reading = true; mood('think'); kick(); }, READ_AFTER);
    sumTimer = setTimeout(() => {
      reading = false;
      said = p;
      mood('happy');
      hop();
      speak(p.dataset.tldr, p);
      settle('happy', 1800);
    }, SUM_AFTER);
  }

  const atPointer = () => {
    const el = ptr && document.elementFromPoint(ptr.x, ptr.y);
    return el && el.closest ? el : null;
  };
  // dark eyes over the light page, glowing white ones over pictures, videos and the dark press band
  function tint(t) {
    mascot.classList.toggle('is-light', !(t && t.closest('img, video, .cs-frame--video, .cs-press')));
    mascot.classList.toggle('is-keen', !!(t && t.closest('a, button')));
  }

  window.addEventListener('pointermove', (e) => {
    const first = !ptr;
    ptr = { x: e.clientX, y: e.clientY };
    lastMove = performance.now();
    inside = true;
    if (first) {   // appear right at the cursor, eyes opening
      pos.x = ptr.x + 16; pos.y = ptr.y + 18;
      host.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }
    show();
    if (!on) return;
    const t = e.target.closest ? e.target : null;
    tint(t);
    const p = t && t.closest('[data-tldr]');
    if (p !== para || !anchor || Math.hypot(ptr.x - anchor.x, ptr.y - anchor.y) > STILL) rest(p);
    kick();
    if (first) hello();
  }, { passive: true });

  // scrolling moves the page under a still cursor: start again from whatever is under it once it settles
  let scrollRaf = 0;
  window.addEventListener('scroll', () => {
    if (!on || !ptr || scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const t = atPointer();
      tint(t);
      rest(t && t.closest('[data-tldr]'));
    });
  }, { passive: true });

  // leave the window and the eyes fade out; come back and they are there again
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) { inside = false; show(); rest(null); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) rest(null); });

  // the first time they show up on these pages, they say what they can do
  let greeted = false;
  function hello() {
    if (greeted) return;
    greeted = true;
    try { if (sessionStorage.getItem('gc-eyes-hello')) return; sessionStorage.setItem('gc-eyes-hello', '1'); } catch (e) { return; }
    setTimeout(() => {
      if (!on || !inside || lines.length) return;
      mood('happy');
      speak('Rest the cursor on a paragraph and I’ll sum it up for you.', 'hello');
      settle('happy', 1800);
    }, 1200);
  }

  /* ---------- The switch ---------- */
  function label() {
    toggle.classList.toggle('is-off', !on);
    toggleLabel.textContent = on ? 'Hide eyes' : 'Show eyes';
    toggle.setAttribute('aria-label', on ? 'Hide Guido’s eyes' : 'Show Guido’s eyes');
  }
  toggle.addEventListener('click', () => {
    on = !on;
    remember('gc-eyes', on ? 'on' : 'off');
    label();
    show();
    if (!on) { hush(); rest(null); mood('calm'); return; }
    tint(toggle);
    mood('happy');   // a happy hop to say hello again; no words here, where they would cover the switch's label
    hop();
    settle('happy', 1800);
    kick();
  });
  label();
})();
