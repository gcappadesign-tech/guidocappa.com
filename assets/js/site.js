/* guidocappa.com: word reveals, the showreel, Guido's eyes, and the chat.
   The chat first plays a short scripted conversation; then the bar becomes a real input and
   Guido answers from the case studies (see brain.js). No dependencies, no network calls
   except loading assets/data/knowledge.json. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const $ = (id) => document.getElementById(id);
  const brain = window.GuidoBrain;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const seconds = (name) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  const rand = (a, b) => a + Math.random() * (b - a);
  // the site's root, worked out from this script's own address (assets/js/site.js), so links work
  // wherever the site is served: guidocappa.com, a preview, or a page on claude.ai
  const ROOT = new URL('../../', document.currentScript ? document.currentScript.src : location.href);
  const at = (path) => new URL(path + (window.GC_FILE_LINKS && /\/$/.test(path) ? 'index.html' : ''), ROOT).href;   // GC_FILE_LINKS: set only on the review copy

  /* ---------- The headline types itself, letter by letter ---------- */
  const typed = document.querySelector('.typed');
  if (typed) {
    const text = typed.textContent.trim();
    typed.setAttribute('aria-label', text);   // read whole, not letter by letter
    typed.textContent = '';
    const letters = [...text].map((ch) => {
      const s = document.createElement('span');
      s.className = 'tw-c';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      typed.append(s);
      return s;
    });
    typed.classList.add('is-split');
    if (reduce) {
      letters.forEach((l) => l.classList.add('on'));
    } else {
      const per = root.classList.contains('intro-fast') ? 45 : 80;
      let t = seconds('--t-h1') * 1000;
      letters.forEach((l, i) => {
        setTimeout(() => {
          if (i) letters[i - 1].classList.remove('is-cur');
          l.classList.add('on', 'is-cur');
        }, t);
        // an uneven rhythm, with a breath after the comma, so it reads as typed by a person
        t += per * rand(0.7, 1.3) + (l.textContent === ',' ? per * 3 : 0);
      });
      setTimeout(() => document.dispatchEvent(new Event('gc:typed')), t + 250);   // Guido winks (see below)
      setTimeout(() => letters[letters.length - 1].classList.remove('is-cur'), t + 2400);
    }
  }

  /* ---------- Words that blur into focus ---------- */
  document.querySelectorAll('.words').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.textContent = word;
      el.append(span);
      if (i < words.length - 1) el.append(' ');
    });
    el.classList.add('is-split');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal, .words[data-reveal]').forEach((el) => io.observe(el));

  /* ---------- Showreel: plays while on screen, with a real pause button ---------- */
  const reel = document.querySelector('.reel video');
  const reelBtn = $('reel-toggle');
  if (reel && reelBtn) {
    let wanted = !reduce;   // people who asked for less motion start it themselves
    const label = () => { reelBtn.textContent = reel.paused ? 'Play' : 'Pause'; };
    const toggle = () => {
      wanted = reel.paused;
      if (wanted) reel.play().catch(() => {}); else reel.pause();
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && wanted) reel.play().catch(() => {}); else reel.pause();
    }, { threshold: 0.25 }).observe(reel);
    reelBtn.addEventListener('click', toggle);
    reel.addEventListener('click', toggle);
    reel.addEventListener('play', label);
    reel.addEventListener('pause', label);
    label();
  }

  const mascot = $('mascot');
  if (!mascot || !brain) return;
  try { sessionStorage.setItem('gc-intro', '1'); } catch (e) { /* private mode */ }

  /* ==================================================================
     Guido's eyes
  ================================================================== */
  const svg = mascot.querySelector('svg');
  const look = mascot.querySelector('.m-look');
  const eyes = [...mascot.querySelectorAll('.m-eye')];
  const say = $('say');
  const home = $('mascot-home');          // above the headline
  const cursorHost = $('mascot-cursor');  // follows the pointer

  let ptr = null;            // last pointer position
  let lastMove = 0;          // when the pointer last moved
  let overLight = false;     // the pointer is over the light page, not over a picture
  let hold = false;          // busy visiting something: do not chase the cursor
  let heroInView = true;
  let gazeAt = null;         // a fixed point to look at (the input while someone types)

  const mood = (m) => { mascot.dataset.mood = m; };
  const following = () => mascot.parentElement === cursorHost;
  // dark eyes over the light page, glowing white ones over dark pictures
  const tint = () => {
    const host = mascot.parentElement;
    const light = following() ? overLight : host.dataset.host !== 'dark';
    mascot.classList.toggle('is-light', light);
  };

  /* ---------- Blinks and winks ---------- */
  function blink(which = eyes, ms = 180) {
    if (reduce) return;
    which.forEach((e) => e.animate(
      [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }],
      { duration: ms, easing: 'ease-in-out' }
    ));
  }
  function wink() {
    if (reduce) return;
    mood('wink');
    eyes[1].animate(
      [{ transform: 'none' }, { transform: 'scaleY(0.08)', offset: 0.22 }, { transform: 'scaleY(0.08)', offset: 0.72 }, { transform: 'none' }],
      { duration: 1000, easing: 'ease-in-out' }
    );
    setTimeout(() => { if (mascot.dataset.mood === 'wink') mood('calm'); }, 1300);
  }
  // a wink as the headline finishes saying hello
  document.addEventListener('gc:typed', () => { if (!hold) wink(); });
  // blink at random, now and then twice in a row
  (function blinkLater() {
    setTimeout(() => {
      if (!document.hidden && mascot.dataset.mood === 'calm') {
        blink();
        if (Math.random() < 0.25) setTimeout(() => blink(), 280);
      }
      blinkLater();
    }, rand(2200, 6200));
  })();

  /* ---------- Speech: a few words typed right beside the eyes ----------
     Every line is its own little bubble and stays up until it has been read, even when the eyes move on:
     they carry it with them. A new line stacks under the one still showing instead of replacing it
     (two at most; a third pushes the oldest out). */
  const MAX_LINES = 2;
  const lines = [];   // { el, key, timers }
  const readingTime = (text) => 2400 + text.length * 40;   // after the line has finished typing
  function dropLine(line) {
    const i = lines.indexOf(line);
    if (i < 0) return;
    lines.splice(i, 1);
    line.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    line.el.classList.remove('is-on');
    setTimeout(() => line.el.remove(), 320);
    if (!lines.length && !hold) mood('calm');
  }
  const speaking = (key) => lines.some((l) => l.key === key);
  // beside the eyes: on their right, or on their left when there is no room, and always fully inside the window
  // (the lines are fixed to the window, so they can never make the page wider or taller).
  // The newest line sits level with the eyes; an older one sits above it.
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
    say.classList.toggle('is-away', r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw);
    const left = r.right + 10 + w <= vw - 12;
    say.classList.toggle('is-left', !left);
    const x = Math.min(Math.max(left ? r.right + 10 : r.left - 10 - w, 12), vw - 12 - w);
    const y = Math.min(Math.max(r.top + r.height / 2 + last / 2 - h, 12), vh - 12 - h);
    say.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    sayRaf = requestAnimationFrame(placeSay);
  }
  function speak(text, key = text) {
    if (speaking(key)) return;   // already on show
    while (lines.length >= MAX_LINES) dropLine(lines[0]);
    const el = document.createElement('div');
    el.className = 'say__line';
    say.append(el);
    const line = { el, key, timers: [] };
    lines.push(line);
    requestAnimationFrame(() => el.classList.add('is-on'));
    if (!sayRaf) placeSay();
    const done = () => line.timers.push(setTimeout(() => dropLine(line), readingTime(text)));
    if (reduce) { el.textContent = text; done(); return; }
    el.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    line.timers.push(setTimeout(() => {
      let i = 0;
      el.textContent = '';
      const typing = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(typing); done(); }
      }, 30);
      line.timers.push(typing);
    }, 450));
  }

  /* ---------- Where the eyes look ----------
     At the pointer while it moves; at the input while someone types; and when nothing
     is happening, they glance around by themselves. */
  let idleGaze = { x: 0, y: 0 };
  (function glanceLater() {
    setTimeout(() => {
      const quiet = !ptr || performance.now() - lastMove > 2500;
      if (quiet && !gazeAt && !document.hidden) {
        idleGaze = Math.random() < 0.3 ? { x: 0, y: 0 } : { x: rand(-3.4, 3.4), y: rand(-2.4, 2.2) };
        kick();
      }
      glanceLater();
    }, rand(900, 2600));
  })();

  function towards(x, y, reach) {
    const r = mascot.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / reach);
    return { x: (dx / d) * 3.4 * k, y: (dy / d) * 2.6 * k };
  }
  function eyeGoal() {
    if (gazeAt) return towards(gazeAt.x, gazeAt.y, 40);
    if (!ptr || performance.now() - lastMove > 2500) return idleGaze;
    return towards(ptr.x, ptr.y, 90);
  }

  /* ---------- One animation loop: following the cursor, squash and stretch, the gaze ---------- */
  const pos = { x: 0, y: 0 };
  const eye = { x: 0, y: 0 };
  let raf = 0;

  function frame() {
    let busy = false;
    if (following() && ptr) {
      const gx = ptr.x + 16, gy = ptr.y + 18;
      const lx = gx - pos.x, ly = gy - pos.y;
      pos.x += lx * 0.16;
      pos.y += ly * 0.16;
      cursorHost.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      // the faster it chases, the more it stretches along the way it is going
      const s = Math.min(0.3, Math.hypot(lx, ly) / 260);
      const a = Math.atan2(ly, lx);
      svg.style.transform = s > 0.01 ? `rotate(${a}rad) scale(${1 + s}, ${1 - s * 0.55}) rotate(${-a}rad)` : '';
      busy = Math.abs(lx) + Math.abs(ly) > 0.3;
    } else if (svg.style.transform) {
      svg.style.transform = '';
    }
    const g = eyeGoal();
    eye.x += (g.x - eye.x) * 0.24;
    eye.y += (g.y - eye.y) * 0.24;
    look.style.transform = `translate(${eye.x.toFixed(2)}px, ${eye.y.toFixed(2)}px)`;
    busy = busy || Math.abs(g.x - eye.x) + Math.abs(g.y - eye.y) > 0.03;
    raf = busy ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }

  function hop() {
    if (reduce) return;
    svg.animate(
      [{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }],
      { duration: 460, easing: 'ease-out' }
    );
  }

  /* ---------- Where the eyes are ---------- */
  // glide into something it is visiting
  function place(host) {
    if (mascot.parentElement === host) return;
    const from = mascot.getBoundingClientRect();
    host.append(mascot);
    tint();
    if (reduce || !from.width) return;
    const to = mascot.getBoundingClientRect();
    mascot.animate(
      [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: 'none' }],
      { duration: 650, easing: EASE_OUT }
    );
  }
  // let go and chase the cursor (false where there is no cursor to chase)
  function toCursor() {
    if (!canHover || reduce || !ptr || hold || !mascot.classList.contains('is-ready')) return false;
    if (!following()) {
      const r = mascot.getBoundingClientRect();
      pos.x = r.left; pos.y = r.top;
      cursorHost.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      cursorHost.append(mascot);
      tint();
    }
    kick();
    return true;
  }
  function rest() {
    hold = false;
    mood('calm');
    if (toCursor()) return;
    // touch or reduced motion: back above the headline when it is on screen, otherwise stay put
    if (heroInView) place(home);
    kick();
  }

  window.addEventListener('pointermove', (e) => {
    ptr = { x: e.clientX, y: e.clientY };
    lastMove = performance.now();
    restless();
    const t = e.target;
    overLight = !!(t.closest && t.closest('.stage, .hero, .foot') && !t.closest('img, video, .reel__frame, .project__media'));
    mascot.classList.toggle('is-keen', !!(t.closest && t.closest('a, button, .bar.is-live')));
    if (following()) tint();
    if (!toCursor()) kick();
  }, { passive: true });


  new IntersectionObserver(([e]) => {
    heroInView = e.isIntersecting;
    if (heroInView && !hold && !following()) place(home);
  }, { threshold: 0.3 }).observe($('hero-top'));

  /* ---------- Stops: the eyes visit the showreel and each project as it scrolls in ---------- */
  const stops = [...document.querySelectorAll('[data-tease]')];
  const hostOf = (el) => (el.matches('[data-host]') ? el : el.querySelector('[data-host]'));
  const seen = new Set();
  const inView = new Set();
  let visitTimer = 0;
  let visit = null;      // the stop being visited, and when the visit began

  function nextVisit() {
    const el = stops.find((s) => inView.has(s) && !seen.has(s));   // page order, one at a time
    if (!el) return false;
    seen.add(el);
    hold = true;
    visit = { el, at: performance.now() };
    place(hostOf(el));
    mood('spark');   // two sparkles and a smile: "look at this one"
    speak(brain.teasers[el.dataset.tease], el.dataset.tease);
    clearTimeout(visitTimer);
    visitTimer = setTimeout(() => { visit = null; if (!nextVisit()) rest(); }, 4200);   // the line stays up until read
    return true;
  }
  // a visit gives way as soon as the visitor moves on: at once when the picture scrolls out of the middle of the
  // screen, and after two seconds on any scroll or pointer move; then the eyes go back to the cursor
  function endVisit() {
    if (!visit) return;
    clearTimeout(visitTimer);
    visit = null;
    rest();   // the eyes go back to the cursor and take their line with them
  }
  const restless = () => { if (visit && performance.now() - visit.at > 2000) endVisit(); };
  // while the page is scrolling the eyes stay with the cursor; pause on a picture and they go and look at it
  const tryVisit = () => { if (!hold && mascot.classList.contains('is-ready')) nextVisit(); };
  let lastScroll = 0;
  let settle = 0;
  window.addEventListener('scroll', () => {
    lastScroll = performance.now();
    restless();
    clearTimeout(settle);
    settle = setTimeout(tryVisit, 450);
  }, { passive: true });
  window.addEventListener('wheel', restless, { passive: true });
  window.addEventListener('touchmove', restless, { passive: true });
  if (!reduce) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); });
      if (visit && !inView.has(visit.el)) endVisit();
      if (performance.now() - lastScroll > 450) tryVisit();
    }, { rootMargin: '-20% 0px -20% 0px', threshold: 0.35 });
    stops.forEach((s) => vio.observe(s));
  }

  // later, resting the cursor on one repeats its line beside the cursor
  if (canHover && !reduce) {
    let dwell = 0;
    stops.forEach((el) => {
      el.addEventListener('pointermove', () => {
        clearTimeout(dwell);
        dwell = setTimeout(() => {
          if (hold || !following() || speaking(el.dataset.tease)) return;
          mood('happy');
          speak(brain.teasers[el.dataset.tease], el.dataset.tease);   // stacks under a line still showing
        }, 700);
      });
      el.addEventListener('pointerleave', () => clearTimeout(dwell));
    });
  }

  /* ==================================================================
     The chat
  ================================================================== */
  const log = $('log');
  const logInner = $('log-inner');
  const scroller = $('chat');   // the headline and the chat scroll together
  const bar = $('bar');
  const barText = $('bar-text');
  const barInput = $('bar-input');
  const barSend = $('bar-send');
  const chatLive = $('chat-live');

  let pinned = true;     // follow new messages unless the reader has scrolled back
  let reading = false;   // pointer or focus is on the chat: hold the next scripted message
  let isLive = false;    // the bar is a real input
  let skipShow = false;  // the visitor wants to ask their own question now

  const atBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
  scroller.addEventListener('wheel', (e) => { if (e.deltaY < 0) pinned = false; }, { passive: true });
  scroller.addEventListener('touchmove', () => { pinned = false; }, { passive: true });
  scroller.addEventListener('keydown', (e) => { if (/^(ArrowUp|PageUp|Home)$/.test(e.key)) pinned = false; });
  /* Whenever the conversation grows (a new message, a line of text, a row of links) the newest part stays in view.
     Everything above the new part has then moved up: it is put in place at once, then glides there from where it was,
     like iMessage. The glide is a transform that eases out, so nothing is laid out again while it moves. */
  const intro = scroller.querySelector('.intro');
  const chatInner = scroller.firstElementChild;
  const lift = { intro: 0, log: 0 };   // how far the headline and the messages still are from their places, in px
  let lastH = logInner.offsetHeight;
  const restY = () => intro.getBoundingClientRect().top - lift.intro;   // where the headline sits once settled
  let introY = restY();
  let glideRaf = 0;
  let glideT = 0;
  const paint = () => {
    intro.style.transform = lift.intro ? `translateY(${lift.intro.toFixed(1)}px)` : '';
    logInner.style.transform = lift.log ? `translateY(${lift.log.toFixed(1)}px)` : '';
  };
  const glide = (now) => {
    const k = Math.exp(-(now - glideT) / 150);   // eases out: most of the way in about a third of a second
    glideT = now;
    lift.intro = Math.abs(lift.intro * k) < 0.5 ? 0 : lift.intro * k;
    lift.log = Math.abs(lift.log * k) < 0.5 ? 0 : lift.log * k;
    paint();
    glideRaf = lift.intro || lift.log ? requestAnimationFrame(glide) : 0;
  };
  function follow() {
    const h = logInner.offsetHeight;
    const grew = h - lastH;
    lastH = h;
    if (!pinned) return;
    scroller.scrollTop = Math.max(0, chatInner.offsetHeight - scroller.clientHeight);   // offsetHeight: the settled size, not the gliding one
    const y = restY();
    if (grew && !reduce) {   // growing or shrinking: either way the rest glides instead of jumping
      lift.log += grew;
      lift.intro += introY - y;
      paint();
      if (!glideRaf) { glideT = performance.now(); glideRaf = requestAnimationFrame(glide); }
    }
    introY = y;
  }
  new ResizeObserver(follow).observe(logInner);
  scroller.addEventListener('scroll', () => {
    if (atBottom()) pinned = true;
    introY = restY();
  }, { passive: true });
  log.addEventListener('pointerenter', () => { reading = true; });
  log.addEventListener('pointerleave', () => { reading = false; });
  log.addEventListener('focusin', () => { reading = true; });
  log.addEventListener('focusout', () => { reading = false; });

  // a pause that only counts while someone can see the hero and is not reading
  async function pause(ms) {
    while (ms > 0 && !skipShow) {
      await wait(200);
      if (heroInView && !reading && !document.hidden) ms -= 200;
    }
  }

  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const MINI_EYES = '<svg class="msg__eyes" viewBox="0 0 22 20" aria-hidden="true"><rect x="3" y="1" width="5.5" height="9.5" rx="2.75"/><rect x="13.5" y="1" width="5.5" height="9.5" rx="2.75"/><path d="M7 14.5q4 4.2 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function tile(a, i) {
    const style = ` style="--i:${i}"`;
    if (a.type === 'project') {
      const p = brain.projects[a.id];
      return `<a class="tile"${style} href="${at(p.slug + '/')}"><img src="${at('assets/img/work/' + p.img + '-800.webp')}" alt="" width="58" height="46"><span>${p.title}<small>Read case study</small></span>${icon('arrow-up-right')}</a>`;
    }
    if (a.type === 'stat') {
      return `<a class="tile tile--stat"${style} href="${at(brain.projects[a.id].slug + '/')}"><b>${a.n}</b><span>${a.label}<small>${a.who}</small></span></a>`;
    }
    if (a.type === 'about') {
      return `<a class="tile"${style} href="${at('about/')}"><img class="is-round" src="${at('assets/img/guido.jpg')}" alt="" width="46" height="46"><span>Guido Cappa<small>More about me</small></span>${icon('arrow-up-right')}</a>`;
    }
    return `<a class="tile tile--plain"${style} href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ''}>${icon(a.icon)}${a.label}</a>`;
  }

  // where the words sit in the bar, measured just before they are sent
  const wordsAt = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, cy: r.top + r.height / 2 }; };
  // a sent message lifts off the bar and glides up into place, like iMessage, while everything above slides up to make room
  const FLIGHT = { duration: 760, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };
  function addMine(text, from) {
    const m = document.createElement('p');
    m.className = 'msg msg--me';
    m.textContent = text;   // typed by the visitor: always text, never HTML
    if (!from || !pinned || reduce) { logInner.append(m); return m; }
    m.classList.add('is-sent');   // no fade-in: it is already on screen, in the bar
    logInner.append(m);
    follow();   // make room now (the messages above start their glide), so the bubble's place is known
    const r = m.getBoundingClientRect();
    const dx = from.left - (r.left + 17);            // 17px: the bubble's border and side padding, so the words line up
    const dy = from.cy - (r.top + r.height / 2);
    m.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], FLIGHT);
    return m;
  }
  /* ---------- How Guido's answers look ----------
     Like a design tool: an empty frame appears with selection handles, a cursor named Guido
     drops the project picture in, the placeholder lines become text, and the cursor then goes
     over the text drawing circles round the numbers and a line under the phrase that matters. */
  const hurry = () => skipShow && !isLive;   // the visitor wants to type: finish what is on screen at once
  const METRIC = /\$?\d+(?:[.,]\d+)?\s?(?:%|x\b|×|M\+?|K\b)/g;
  const INK_CIRCLE = '<svg class="nt__ink" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M10 18C3 28 15 37 38 40c27 3 56-3 58-15 2-12-14-20-38-21C34 3 11 9 7 22c-1 4 2 7 6 9"/></svg>';
  const INK_LINE = '<svg class="nt__ink" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7c14-4 28 3 44 0s32-5 52 1"/></svg>';

  const make = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  async function streamInto(t, text, perWord, fast) {
    t.textContent = '';
    t.classList.add('is-streaming');
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (fast()) { t.textContent = text; break; }
      t.textContent += (i ? ' ' : '') + words[i];
      await wait(perWord);
    }
    t.classList.remove('is-streaming');
  }

  // rebuild the answer with its marks: circles round the numbers, a line under the phrase that matters
  function markUp(t, text, mark) {
    const found = [];
    (text.match(METRIC) || []).slice(0, 2).forEach((m) => found.push({ i: text.indexOf(m), len: m.length, kind: 'circle' }));
    const phrase = [].concat(mark || []).find((m) => text.includes(m));
    if (phrase) found.push({ i: text.indexOf(phrase), len: phrase.length, kind: 'line' });
    if (!found.length) {
      const opening = text.split(/[,.!?;:]/)[0].split(' ').slice(0, 4).join(' ');
      found.push({ i: 0, len: opening.length, kind: 'line' });
    }
    found.sort((a, b) => a.i - b.i);
    t.textContent = '';
    let pos = 0;
    found.forEach((f) => {
      if (f.i < pos) return;   // overlapping marks: keep the first
      t.append(text.slice(pos, f.i));
      const s = make('span', `nt nt--${f.kind}`, text.slice(f.i, f.i + f.len));
      s.insertAdjacentHTML('beforeend', f.kind === 'circle' ? INK_CIRCLE : INK_LINE);
      t.append(s);
      pos = f.i + f.len;
    });
    t.append(text.slice(pos));
  }

  function cvMedia(a) {
    if (a.type === 'about') {
      return `<a href="${at('about/')}"><img src="${at('assets/img/guido.jpg')}" alt="" style="object-position:50% 20%"><span class="cv__cap">Guido Cappa · More about me</span></a>`;
    }
    const p = brain.projects[a.id];
    const src = p.wide ? p.wide + '-1600.webp' : p.img + '-800.webp';
    return `<a href="${at(p.slug + '/')}"><img src="${at('assets/img/work/' + src)}" alt=""><span class="cv__cap">${p.title} ↗</span></a>`;
  }
  // glide the cursor to a spot inside `target`, measured from the canvas `cv`
  function moveCursor(cursor, cv, target, ms, where = 'middle') {
    const c = cv.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const x = r.left - c.left + (where === 'start' ? 2 : Math.min(r.width * 0.55, 150));
    const y = r.top - c.top + Math.min(r.height * 0.5, 44);
    const from = cursor.style.transform || 'translate(-28px, -6px)';
    const to = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    cursor.style.transform = to;
    return cursor.animate([{ transform: from }, { transform: to }], { duration: ms, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }).finished.catch(() => {});
  }
  const press = (cursor) => cursor.querySelector('svg').animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.8)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });

  // Guido answers
  async function guidoSays(text, attach = [], opts = {}) {
    const fast = () => !!opts.fast || reduce || hurry();
    const m = make('div', 'msg msg--guido');
    m.innerHTML = MINI_EYES;
    const body = make('div', 'msg__body');
    m.append(body);
    logInner.append(m);
    if (!hold && !fast()) mood('think');

    const cv = make('div', 'cv');
    const label = make('span', 'cv__label', (opts.q || 'Your turn').replace(/[?.!]+$/, ''));
    const frame = make('div', 'cv__frame');
    frame.innerHTML = '<i class="cv__h cv__h--tl"></i><i class="cv__h cv__h--tr"></i><i class="cv__h cv__h--bl"></i><i class="cv__h cv__h--br"></i>';
    const visual = attach.find((a) => a.type === 'project' || a.type === 'about');
    const media = visual ? make('div', 'cv__media') : null;
    if (media) {
      media.innerHTML = cvMedia(visual);
      media.classList.toggle('is-wide', visual.type === 'project' && !!brain.projects[visual.id].wide);
      frame.append(media);
    }
    const lines = make('div', 'cv__lines');
    lines.innerHTML = '<i></i><i></i><i></i>';
    const t = make('p', 'msg__text');
    const more = make('div', 'attach');
    frame.append(lines, t, more);
    const cursor = make('div', 'cv__cursor');
    cursor.innerHTML = '<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M1.5 1.5l13 8.4-6 1.4-3.4 6.7z"/></svg><span>Guido</span>';
    cv.append(label, frame, cursor);
    body.append(cv);
    const rest = attach.filter((a) => a !== visual);

    const finish = () => {
      if (media) media.classList.add('is-dropped');
      lines.remove();
      if (!t.querySelector('.nt')) markUp(t, text, opts.mark);
      t.querySelectorAll('.nt').forEach((s) => s.classList.add('is-drawn'));
      if (!more.innerHTML) more.innerHTML = rest.map(tile).join('');
      cursor.classList.remove('is-on');
      cv.classList.add('is-done');
    };

    if (fast()) { finish(); return; }
    await wait(450);                                   // an empty frame, as if just drawn
    cursor.classList.add('is-on');
    await moveCursor(cursor, cv, media || lines, 650);
    if (media && !fast()) {
      press(cursor);
      media.classList.add('is-dropped');               // the picture lands in the frame
      await wait(550);
      await moveCursor(cursor, cv, lines, 450);
    }
    press(cursor);
    lines.remove();                                    // the placeholder lines become text
    await streamInto(t, text, 45, fast);
    // the cursor goes back over the text and marks what matters by hand
    markUp(t, text, opts.mark);
    for (const s of t.querySelectorAll('.nt')) {
      if (fast()) break;
      await moveCursor(cursor, cv, s, 420, 'start');
      s.classList.add('is-drawn');
      await moveCursor(cursor, cv, s, 520);            // and follows the pen across the word
    }
    more.innerHTML = rest.map(tile).join('');
    if (!fast()) await wait(450);
    finish();
    if (!hold && !fast()) {
      mood('happy');
      setTimeout(() => { if (!hold && mascot.dataset.mood === 'happy') mood('calm'); }, 1800);
    }
  }

  // a scripted question types itself into the bar, then is sent
  async function ask(q) {
    bar.classList.remove('is-empty');
    for (let i = 1; i <= q.length; i++) {
      if (skipShow) { barText.textContent = ''; bar.classList.add('is-empty'); return false; }
      barText.textContent = q.slice(0, i);
      await wait(62);
    }
    await wait(650);
    barSend.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.82)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
    const from = wordsAt(barText);
    barText.textContent = '';
    bar.classList.add('is-empty');
    addMine(q, from);
    await wait(reduce ? 350 : 800);   // let it land before Guido starts answering
    return true;
  }

  // Guido's messages go out one at a time, in order
  let chain = Promise.resolve();
  const queue = (fn) => (chain = chain.then(fn).catch(() => {}));

  // the case studies, loaded once, when they are first needed
  let kbPromise = null;
  const knowledge = () => kbPromise || (kbPromise = fetch(at('assets/data/knowledge.json'), { cache: 'no-cache' })   // revalidate: a cheap check, never a stale copy
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null));

  /* ---------- After the show: the bar becomes a real input ---------- */
  function goLive(focus) {
    if (isLive) return;
    isLive = true;
    knowledge();   // start loading now so the first answer is quick
    bar.classList.remove('is-show');
    bar.classList.add('is-live');
    barText.textContent = '';
    barInput.hidden = false;
    barSend.setAttribute('aria-label', 'Send');
    bar.classList.toggle('is-empty', !barInput.value.trim());
    log.setAttribute('aria-label', 'Chat with Guido about his work');
    if (focus) barInput.focus({ preventScroll: true });
    queue(() => guidoSays(brain.handover, []));
  }

  bar.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isLive) { skipShow = true; return; }   // pressing send during the show: skip to asking
    const q = barInput.value.trim();
    if (!q) { barInput.focus(); return; }
    const from = wordsAt(barInput);
    barInput.value = '';
    bar.classList.add('is-empty');
    pinned = true;
    addMine(q, from);
    queue(async () => {
      if (!reduce) await wait(800);   // let it land before Guido starts answering
      const kb = await knowledge();
      const r = brain.reply(q, kb);
      await guidoSays(r.say, r.attach, { q });
      chatLive.textContent = r.say;   // screen readers hear the whole answer once, not word by word
    });
  });
  // clicking the bar during the show also skips to asking
  bar.addEventListener('pointerdown', () => { if (!isLive) skipShow = true; });

  // while someone types, the eyes look at what they are writing
  let typingTimer = 0;
  barInput.addEventListener('input', () => {
    bar.classList.toggle('is-empty', !barInput.value.trim());
    const r = barInput.getBoundingClientRect();
    gazeAt = { x: r.left + Math.min(r.width, 10 + barInput.value.length * 8.5), y: r.top + r.height / 2 };
    kick();
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { gazeAt = null; kick(); }, 1200);
  });

  /* ---------- The opening show ---------- */
  async function show() {
    for (const [i, item] of brain.script.entries()) {
      await pause(i === 0 ? 400 : 3200);   // the first question starts almost as soon as the bar is open
      if (skipShow) break;
      if (!(await ask(item.q))) break;
      await guidoSays(item.say, item.attach, { q: item.q, mark: item.mark });
      if (skipShow) break;
    }
    goLive(skipShow);
  }

  bar.classList.add('is-empty', 'is-show');
  barSend.disabled = false;
  barSend.setAttribute('aria-label', 'Skip to asking your own question');

  if (reduce) {
    // the whole conversation at once, nothing moving, and the input ready
    mascot.classList.add('is-ready');
    brain.script.forEach((item) => {
      addMine(item.q);
      guidoSays(item.say, item.attach, { q: item.q, mark: item.mark, fast: true });
    });
    scroller.scrollTop = scroller.scrollHeight;
    goLive(false);
    return;
  }
  setTimeout(() => {
    mascot.classList.add('is-ready');
    if (ptr) toCursor();
  }, (seconds('--t-eyes') + 1.2) * 1000);
  setTimeout(() => queue(show), seconds('--t-chat') * 1000);
})();
