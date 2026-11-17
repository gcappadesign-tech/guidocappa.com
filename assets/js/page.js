/* About and the case studies: sections ease in as they scroll into view, and the product videos play while
   they are on screen (paused off screen, so a long page never plays them all at once).
   With reduced motion nothing moves by itself: sections are simply there and videos get their controls. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  var videos = [].slice.call(document.querySelectorAll('video[data-autoplay]'));

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    videos.forEach(function (v) { v.controls = true; v.preload = 'metadata'; });
    return;
  }

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(function (el) { seen.observe(el); });

  var playing = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.controls = true; });   // the browser said no: let the visitor press play
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  videos.forEach(function (v) { playing.observe(v); });
})();
