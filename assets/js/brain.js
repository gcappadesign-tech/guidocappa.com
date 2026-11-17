/* What "Guido" (the chat on the home page) says.
   - The scripted conversation that plays first.
   - Answers to typed questions: a few common ones are written out here; everything else is
     found in the case studies (assets/data/knowledge.json, built by tools/build_knowledge.py).
   No network calls and no AI service: the search runs in the browser.
   Tested without a browser by tests/brain.test.js. */
(function (g) {
  'use strict';

  var PROJECTS = {
    // wide: a 16:9 picture made for the chat's answer cards (assets/img/work/<wide>-1600.webp)
    gopuff: { slug: 'gopuff-go-ai', img: 'gopuff', wide: 'gopuff-wide', title: 'Gopuff, Go AI' },
    ava: { slug: 'ava-ai-game-creator', img: 'ava', title: 'Upit, Creating Games with Ava' },
    play: { slug: 'the-new-play-experience', img: 'play', title: 'Upit, The New Play Experience' },
    hero: { slug: 'hero-the-future-of-authentication', img: 'hero', title: 'Hero, The Future of Collecting' },
    connectible: { slug: 'connectible', img: 'connectible', title: 'Connectible, Art Community' },
    frvr: { slug: 'frvr-home-of-gamers', img: 'frvr', title: 'FRVR, Home of Gamers' },
    artspydr: { slug: 'work/artspydr', img: 'artspydr', title: 'Artspydr, Trading Art Made Simple' },
    microwave: { slug: 'smart-microwave-case-study', img: 'microwave', title: 'A Smart Way of Cooking' }
  };

  var project = function (id) { return { type: 'project', id: id }; };
  var stat = function (n, label, who, id) { return { type: 'stat', n: n, label: label, who: who, id: id }; };
  var link = function (icon, label, href, ext) { return { type: 'link', icon: icon, label: label, href: href, ext: !!ext }; };
  var ABOUT = { type: 'about' };
  var MAIL = link('envelope', 'gcappa.design@gmail.com', 'mailto:gcappa.design@gmail.com');
  var LINKEDIN = link('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/guidocappa/', true);
  var CV = link('download', 'Download CV', 'https://drive.google.com/file/d/15bHLeHBrdMc0MzU9YChnHQD7r2aeO82U/view?usp=sharing', true);
  var ALL_WORK = link('arrow-up-right', 'See all work', '#work');

  /* ---------------- the conversation that plays by itself ---------------- */
  var SCRIPT = [
    {
      q: 'What did you ship last?',
      mark: ['shops for you'],   // the phrase Guido's cursor underlines (the first one found in the answer)
      say: "Most recently I led the 0-to-1 design of Go, Gopuff's AI companion that shops for you. It drove 12x order volume growth and a 68.9% add-to-cart conversion.",
      attach: [project('gopuff')]
    },
    {
      q: 'Show me the numbers',
      mark: ['proud'],
      say: "Three results I'm proud of, from Gopuff and Upit.",
      attach: [
        stat('12x', 'order volume growth', 'Gopuff', 'gopuff'),
        stat('3x', 'game completion rate', 'Upit, Ava', 'ava'),
        stat('2x', 'daily social interactions', 'Upit, Play', 'play')
      ]
    },
    {
      q: 'Who are you?',
      mark: ['simple'],
      say: "I design digital products that make complex experiences feel simple. Over the past 8+ years I've worked across AI, marketplaces, gaming, fintech, and social platforms.",
      attach: [ABOUT]
    },
    {
      q: 'How can I contact you?',
      mark: ['talk', 'Email'],
      say: 'Email is the best way to reach me. You can also find me on LinkedIn or download my CV.',
      attach: [MAIL, LINKEDIN, CV]
    }
  ];

  /* ---------------- typed questions: the common ones, written out ----------------
     Checked in order; a question that names a project skips straight to the search. */
  var CANNED = [
    [/^(hi|hey|hello|ciao|hola|yo|good (morning|afternoon|evening))\b/, {
      say: "Hi! Ask me anything about my projects, like how Go was designed or what I learned building Ava.", attach: [] }],
    [/\b(thanks|thank you|cheers|thx)\b/, { say: 'Anytime. Ask me something else whenever you like.', attach: [] }],
    [/\b(are you (a |an )?(real|human|bot|robot|ai|person)|real ai|chatgpt|gpt|scripted|how do you work)\b/, {
      say: "Not quite. I'm a scripted version of me that answers from my case studies, so I only know what's in them. For anything else, email me.",
      attach: [MAIL] }],
    [/\b(cv|resume|curriculum)\b/, { say: 'Here is my CV. LinkedIn has the longer version.', attach: [CV, LINKEDIN] }],
    [/\b(contact|e-?mail|hire|hiring|reach you|get in touch|available|availability|freelance)\b/, SCRIPT[3]],
    [/\b(where (are|do) you (based|live|work from)|where are you from|based|london|remote|time ?zone|relocat\w*)\b/, {
      say: "I'm based in London and work remotely with global teams.", attach: [ABOUT] }],
    [/\b(numbers|metrics|results|impact|kpis?|stats)\b/, SCRIPT[1]],
    [/\b(ship(ped)?|latest|most recent|newest|working on|current(ly)? (job|role|work))\b/, SCRIPT[0]],
    [/^(who are you|tell me about (you|yourself)|about you|introduce yourself)\b/, SCRIPT[2]]
  ];

  var FALLBACK = {
    say: "I couldn't find that in my case studies. Try asking about a project, like Gopuff's Go AI or Upit's Ava, or what I learned from them.",
    attach: [ALL_WORK]
  };

  /* names that point at one project; the search then only looks there */
  var ALIASES = [
    ['gopuff', /\b(gopuff|go ai|go app|spacex|xai|grocer\w*|moments?)\b/],
    ['ava', /\b(ava|game creat\w*|creator flow|ai game)\b/],
    ['play', /\b(play (screen|experience)|new play|leaderboards?)\b/],
    ['hero', /\b(hero|authenticat\w*|collectibles?|sneakers?|bidding)\b/],
    ['connectible', /\b(connectible|art (collectors?|communit\w+))\b/],
    ['frvr', /\bfrvr\b/],
    ['artspydr', /\b(artspydr|art ?spyder|trading art)\b/],
    ['microwave', /\b(microwave|cooking|kitchen)\b/],
    ['about', /\b(paybase|calmia|lucy wakefield|career|experience|companies|worked (at|for))\b/]
  ];
  // "upit" covers two case studies; leave both in play
  var UPIT = /\bupit\b/;
  // bare product names say where to look but nothing about what to find, so they are not searched for
  var NAMES = /\b(gopuff|hero|ava|upit|connectible|frvr|artspydr|art ?spyder)\b/g;
  // "Go" (Gopuff's product) only counts when capitalised mid-sentence, so "go" the verb does not
  var GO = /\S\s+Go\b/;

  /* ---------------- search ----------------
     Each case study is a list of sections (a heading and its sentences). A question is
     matched against short passages (up to three sentences) inside each section, scored
     with BM25 on the words, plus the section heading, plus a nudge when the question's
     intent (challenges, lessons, results...) matches what the heading is about. */
  var STOP = ('a about above after again all also am an and any are as at be been before being below between both but by can could did do does doing done down during each few for from further go going had has have having he her here hers him his how i if in into is it its itself just me more most my myself new no nor not now of off on once only or other our ours out over own part same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself tell show give explain describe please know want like let us thing things really much many way get got make made one two guido project projects case study studies design designed designing work worked').split(' ');
  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = 1; });

  // words a visitor uses that the case studies say differently
  var EXPAND = {
    hard: 'challenge problem constraint', hardest: 'challenge problem constraint', difficult: 'challenge problem constraint',
    struggle: 'challenge problem', wrong: 'didn problem', fail: 'didn problem', failed: 'didn problem',
    learn: 'takeaway took lesson', learned: 'takeaway took lesson', lesson: 'takeaway learn',
    result: 'metric growth increase revenue', outcome: 'result metric', success: 'result growth increase',
    test: 'testing usability validation', tested: 'testing usability', validate: 'test validation usability',
    research: 'interview analysis competitor', team: 'engineer collaborat partnership', collaborate: 'team engineer partnership',
    prototype: 'prototyp wireframe figma', wireframe: 'prototyp', users: 'user'
  };
  // what the question is after, and the section headings that answer it
  var INTENTS = [
    [/\b(learn\w*|lessons?|take ?aways?|took away|reflect\w*|would you do differently)\b/, /take ?aways?|took from|lessons?|learn/i],
    [/\b(hard\w*|difficult\w*|challeng\w*|problems?|struggl\w*|wrong|fail\w*|obstacles?|constraints?|pain)\b/, /challenge|problem|constraint|didn.t work|pain/i],
    [/\b(results?|impact|outcomes?|metrics?|numbers?|success\w*|kpis?|growth)\b/, /results?|metrics?|data|impact|\d\s*%|\dx\b|\$\d/i],
    [/\b(research\w*|interview\w*|competitors?|insights?|discovery)\b/, /research|discovery|interview|insight/i],
    [/\b(test\w*|usability|validat\w*|a\/b)\b/, /test|validation|iteration/i],
    [/\b(process|approach|method\w*|prototyp\w*|wireframe\w*|ideation)\b/, /process|ideation|prototyp|wireframe|research|iteration/i]
  ];

  function stem(w) {
    if (w.length <= 4) return w;
    var rules = [['ational', 'ate'], ['ization', 'ize'], ['iveness', 'ive'], ['fulness', 'ful'], ['ations', 'ate'], ['ation', 'ate'],
      ['ments', ''], ['ment', ''], ['ingly', ''], ['ing', ''], ['edly', ''], ['ies', 'y'], ['ied', 'y'], ['ed', ''], ['es', ''], ['ly', ''], ['s', '']];
    for (var i = 0; i < rules.length; i++) {
      var suf = rules[i][0];
      if (w.length - suf.length >= 3 && w.slice(-suf.length) === suf) return w.slice(0, -suf.length) + rules[i][1];
    }
    return w;
  }
  function words(text) {
    return String(text).toLowerCase().replace(/[’‘`]/g, "'").replace(/'s\b/g, '').match(/[a-z0-9]+/g) || [];
  }
  function terms(text) {
    return words(text).filter(function (w) { return !STOPSET[w] && w.length > 1; }).map(stem);
  }
  function counts(list) {
    var tf = {};
    list.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    return tf;
  }

  // built once per knowledge file
  var built = null;
  function build(kb) {
    var df = {}, n = 0, total = 0, secs = [];
    Object.keys(kb).forEach(function (pid) {
      kb[pid].forEach(function (sec, si) {
        var sents = sec.s.map(function (s) {
          var t = terms(s), tf = counts(t);
          Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
          n++; total += t.length;
          return { text: s, tf: tf, len: t.length };
        });
        secs.push({ pid: pid, si: si, h: sec.h, head: counts(terms(sec.h)), sents: sents });
      });
    });
    built = { kb: kb, secs: secs, df: df, n: n, avg: total / Math.max(1, n) };
    return built;
  }
  function idf(index, w) {
    var d = index.df[w] || 0;
    return Math.log(1 + (index.n - d + 0.5) / (d + 0.5));
  }
  function bm25(index, s, q) {
    var k1 = 1.2, b = 0.75, score = 0;
    q.forEach(function (term) {
      var f = s.tf[term.w];
      if (f) score += term.weight * idf(index, term.w) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * s.len / index.avg));
    });
    return score;
  }

  var MIN_SCORE = 2.5;

  function search(question, kb) {
    var index = built && built.kb === kb ? built : build(kb);
    var lower = String(question).toLowerCase();

    var only = null;
    ALIASES.some(function (a) { if (a[1].test(lower)) { only = a[0]; return true; } return false; });
    var allow = only ? [only] : (UPIT.test(lower) ? ['ava', 'play'] : null);
    // the project's name tells us where to look; the rest of the question says what to find
    var rest = lower.replace(NAMES, ' ');

    var intent = null;
    INTENTS.some(function (it) { if (it[0].test(rest)) { intent = it[1]; return true; } return false; });

    var asked = [], q = [], seen = {};
    terms(rest).forEach(function (w) {
      if (seen[w]) return;
      seen[w] = 1; asked.push(w); q.push({ w: w, weight: 1 });
      var raw = words(rest).filter(function (x) { return stem(x) === w; })[0];
      var more = EXPAND[raw] || EXPAND[w];
      if (more) more.split(' ').forEach(function (x) { var s = stem(x); if (!seen[s]) { seen[s] = 1; q.push({ w: s, weight: 0.6 }); } });
    });

    // only a project's name (or nothing searchable): start at the top of that case study
    if (!q.length && !intent) {
      if (!only && allow) {
        var upit = index.secs.filter(function (s) { return s.pid === 'about' && /upit/i.test(s.h); })[0];
        if (upit) return { pid: 'upit', heading: upit.h, text: window(upit.sents, 0).text, score: MIN_SCORE };
      }
      if (!only) return null;
      var top = index.secs.filter(function (s) { return s.pid === only; })[0];
      return top ? { pid: only, heading: top.h, text: window(top.sents, 0).text, score: MIN_SCORE } : null;
    }

    // when the question is clearly after lessons, challenges, results... and a section is headed that way, answer from those
    var pool = index.secs.filter(function (sec) { return !allow || allow.indexOf(sec.pid) >= 0; });
    var aimed = intent ? pool.filter(function (sec) { return intent.test(sec.h); }) : [];
    if (aimed.length) pool = aimed;

    var best = null;
    pool.forEach(function (sec) {
      var head = 0;
      q.forEach(function (t) { if (sec.head[t.w]) head += 1.4 * t.weight * idf(index, t.w); });
      var aim = intent && intent.test(sec.h) ? 7 : 0;
      var own = sec.sents.map(function (s) { return bm25(index, s, q); });
      for (var i = 0; i < sec.sents.length; i++) {
        var win = window(sec.sents, i);
        // a passage reads best from the top of its section, and never from the middle of a list of questions
        var score = head + aim + (i === 0 ? 0.6 : 0) - (i > 0 && /\?$/.test(sec.sents[i].text) ? 3 : 0);
        for (var k = i; k < win.end; k++) score += own[k];
        if (!best || score > best.score) best = { sec: sec, i: i, text: win.text, end: win.end, score: score };
      }
    });
    if (!best || best.score < MIN_SCORE) return null;

    // without a project name or a clear intent, most of what was asked has to be in the answer
    if (!only && !allow && !intent) {
      var found = {};
      for (var k = best.i; k < best.end; k++) Object.keys(best.sec.sents[k].tf).forEach(function (w) { found[w] = 1; });
      Object.keys(best.sec.head).forEach(function (w) { found[w] = 1; });
      var hits = asked.filter(function (w) { return found[w]; }).length;
      if (hits * 2 <= asked.length) return null;
    }
    return { pid: best.sec.pid, heading: best.sec.h, text: best.text, score: best.score };
  }

  // up to three sentences from i, short enough to read in a chat bubble
  function window(sents, i) {
    var out = [sents[i].text], len = sents[i].text.length, j = i + 1;
    while (j < sents.length && out.length < 3 && len + sents[j].text.length < 440) {
      out.push(sents[j].text); len += sents[j].text.length; j++;
    }
    return { text: out.join(' '), end: j };
  }

  function reply(question, kb) {
    var lower = String(question || '').toLowerCase().replace(/[’‘`]/g, "'").trim();
    if (!lower) return FALLBACK;
    if (GO.test(String(question))) lower += ' gopuff';
    var names = ALIASES.some(function (a) { return a[0] !== 'about' && a[1].test(lower); }) || UPIT.test(lower);
    if (!names) {
      for (var c = 0; c < CANNED.length; c++) { if (CANNED[c][0].test(lower)) return CANNED[c][1]; }
    }
    if (!kb) return FALLBACK;
    var hit = search(lower, kb);
    if (!hit) return FALLBACK;
    return {
      say: hit.text,
      attach: hit.pid === 'about' ? [ABOUT] : hit.pid === 'upit' ? [project('ava'), project('play')] : [project(hit.pid)],
      source: { project: hit.pid, heading: hit.heading, score: Math.round(hit.score * 10) / 10 }
    };
  }

  g.GuidoBrain = {
    projects: PROJECTS,
    handover: "Now it's your turn. Ask me anything about my projects.",
    script: SCRIPT,
    reply: reply,
    fallback: FALLBACK,
    /* one line per stop, typed when the eyes visit it */
    teasers: {
      reel: 'One minute of my recent work.',
      gopuff: 'This one reached 50M+ users. Want to see how?',
      ava: 'Game completion went up over 3x here.',
      play: 'This redesign doubled daily social interactions.',
      hero: 'AI that authenticates collectibles. Curious?',
      connectible: 'I co-founded this one. The full story is inside.'
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
