/* charlesnasr.com · v2 "Director's Cut" · main.js (vanilla + GSAP/ScrollTrigger/Lenis, all optional) */
(function () {
  'use strict';
  var d = document.documentElement;
  var reduced = d.classList.contains('reduced');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motion = hasGsap && !reduced;
  var isDesktop = function () { return window.innerWidth >= 1024; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  d.classList.add('booted');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!motion) { d.classList.remove('loading'); d.classList.add('ready'); if (!hasGsap) d.classList.add('nomotion'); }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (motion && fine && typeof window.Lenis !== 'undefined') {
    try {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.3 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  function lockScroll(on) {
    document.body.style.overflow = on ? 'hidden' : '';
    if (lenis) { on ? lenis.stop() : lenis.start(); }
  }

  /* ---------- reveals ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && motion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target);
        if (en.target.classList.contains('card')) setTimeout(function () { en.target.style.transition = 'none'; }, 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- nav colour follows the section under it ---------- */
  var nav = $('#nav');
  function setNavTheme(theme) {
    nav.classList.toggle('on-light', theme === 'light');
    nav.classList.toggle('on-accent', theme === 'accent');
  }
  var themed = $$('[data-theme]').filter(function (s) { return s !== document.body; });
  var navTick = false;
  function updateNav() {
    navTick = false;
    var y = 56, theme = 'dark';
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { theme = themed[i].getAttribute('data-theme'); }
    }
    setNavTheme(theme);
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } }, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();

  /* ---------- menu ---------- */
  var menu = $('#menu'), menuBtn = $('#menuBtn'), preview = $('#menuPreview'), previewBox = $('.menu-preview');
  function openMenu() { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); nav.classList.add('menu-open'); lockScroll(true);
    if (motion) gsap.fromTo('.menu-links a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .06 }); }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); nav.classList.remove('menu-open'); if (!overlayOpen) lockScroll(false); }
  menuBtn.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(); });
  $$('.menu-links a').forEach(function (a) {
    a.addEventListener('pointerenter', function () { var p = a.getAttribute('data-preview'); if (p && preview) { preview.src = 'assets/img/' + p; previewBox.classList.add('show'); } });
    a.addEventListener('pointerleave', function () { previewBox.classList.remove('show'); });
  });

  /* ---------- anchors & case links ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var caseId = a.getAttribute('data-case');
      if (caseId) { e.preventDefault(); openCase(caseId, true); return; }
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      if (overlayOpen) closeCase(false);
      scrollToEl(t);
      history.replaceState(null, '', id);
    });
  });

  /* ---------- custom cursor ---------- */
  var cursor = $('#cursor');
  if (cursor && fine && !reduced) {
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.add('is-hidden'); });
    (function loop() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
    $$('[data-case], .poster, .card, .drift-item').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('is-view'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('is-view'); });
    });
  }

  /* ---------- magnetic pills ---------- */
  if (fine && motion) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.28, y = (e.clientY - r.top - r.height / 2) * 0.28;
        gsap.to(el, { x: x, y: y, duration: .5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .5)' }); });
    });
  }

  /* ---------- loader ---------- */
  var loader = $('#loader');
  var heroScrollDone = false;
  function heroScroll() {
    if (heroScrollDone || !motion) return;
    heroScrollDone = true;
    gsap.fromTo('.hero-title', { yPercent: 0, opacity: 1 }, { yPercent: -30, opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: '80% top', scrub: true } });
    gsap.fromTo('.hero-media', { yPercent: 0, scale: 1 }, { yPercent: 12, scale: 1.06, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo(['.now-card', '.hero-sub'], { opacity: 1, y: 0 }, { opacity: 0, y: 20, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: true } });
  }
  function finishReady() {
    d.classList.remove('loading');
    d.classList.add('ready');
    try { sessionStorage.setItem('cn-seen', '1'); } catch (e) {}
    if (loader) loader.style.display = 'none';
    if (!overlayOpen && menu.hidden) lockScroll(false);
    if (hasGsap) ScrollTrigger.refresh();
  }
  function heroIn() {
    gsap.set(['.nav', '.hero-media', '.hero-title', '.hero-sub', '.now-card', '.hero-scroll'], { opacity: 1 });
    gsap.fromTo('.hero-media', { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' });
    gsap.fromTo('.hero-title .w', { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .15 });
    gsap.fromTo(['.hero-sub', '.now-card', '.hero-scroll'], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .9, ease: 'power2.out', stagger: .1, delay: .7, onComplete: heroScroll });
    gsap.fromTo('.nav', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .8, delay: .9 });
  }
  if (d.classList.contains('loading') && motion && loader) {
    lockScroll(true);
    window.scrollTo(0, 0);
    var quick = d.classList.contains('return');
    var count = $('#loadCount');
    var stroke = $('.mark-stroke', loader), fill = $('.mark-fill', loader), dot = $('.mark-dot', loader), glow = $('.mark-glow', loader);
    var len = 12000; try { len = stroke.getTotalLength(); } catch (e) {}
    gsap.set(stroke, { strokeDasharray: len, strokeDashoffset: len });
    var dur = quick ? 0.8 : 1.5;
    var tl = gsap.timeline({ onComplete: function () {
      var out = gsap.timeline({ onComplete: finishReady });
      out.to('.loader-foot', { opacity: 0, duration: .25 });
      out.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '-=0.1');
      out.add(heroIn, '-=0.65');
    } });
    var o = { n: 0 };
    tl.to(o, { n: 100, duration: dur, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(o.n)).padStart(2, '0'); } }, 0);
    tl.to(stroke, { strokeDashoffset: 0, duration: dur * .85, ease: 'power2.inOut' }, 0);
    tl.to(fill, { opacity: 1, duration: .45 }, dur * .7);
    tl.to(stroke, { opacity: 0, duration: .4 }, dur * .75);
    tl.fromTo(dot, { opacity: 0, attr: { r: 24 } }, { opacity: 1, attr: { r: 118 }, duration: .4, ease: 'back.out(2)' }, dur * .8);
    tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: .5 }, dur * .8);
    tl.to({}, { duration: .25 });
    loader.addEventListener('click', function () { tl.progress(1); });
  } else if (motion) {
    heroScroll();
  }

  /* ---------- manifesto: words light up with the scroll ---------- */
  var mani = $('#mani');
  if (mani) {
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(mani.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'mw'; s.textContent = part; frag.appendChild(s);
        });
      } else if (node.nodeType === 1) {
        var em = node.cloneNode(false); em.textContent = '';
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { em.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'mw'; s.textContent = part; em.appendChild(s);
        });
        frag.appendChild(em);
      }
    });
    mani.textContent = ''; mani.appendChild(frag);
    var words = $$('.mw', mani);
    if (motion) {
      ScrollTrigger.create({ trigger: mani, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: function (st) {
        var n = Math.round(st.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
      } });
    }
  }

  /* ---------- drift collage ---------- */
  var drift = $('#drift'), track = $('#driftTrack'), pagerCur = $('#pagerCur'), pagerTot = $('#pagerTot'), bar = $('#driftBar');
  var items = $$('.drift-item', track);
  if (pagerTot) pagerTot.textContent = String(items.length).padStart(2, '0');
  function setPager(i) { if (pagerCur) pagerCur.textContent = String(Math.min(items.length, Math.max(1, i))).padStart(2, '0'); }
  if (drift && track && motion && isDesktop() && fine) {
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var span = function () { return Math.round(dist() * 0.5); };
    gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: drift, start: 'top top', end: function () { return '+=' + span(); }, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function (st) { setPager(Math.round(st.progress * (items.length - 1)) + 1); if (bar) bar.style.width = (st.progress * 100).toFixed(1) + '%'; } } });
  } else if (drift) {
    drift.classList.add('static');
    drift.addEventListener('scroll', function () {
      var x = drift.scrollLeft + drift.clientWidth * 0.3, best = 1;
      items.forEach(function (it, i) { if (it.offsetLeft <= x) best = i + 1; });
      setPager(best);
    }, { passive: true });
  }

  /* ---------- posters parallax + cards tilt ---------- */
  if (motion) {
    $$('.poster').forEach(function (p) {
      gsap.fromTo($('.poster-media img', p), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo($('.poster-copy', p), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 60%' } });
    });
    if (fine) {
      $$('.card').forEach(function (c) {
        c.addEventListener('pointermove', function (e) {
          var r = c.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - .5) * -8, ry = ((e.clientX - r.left) / r.width - .5) * 10;
          gsap.to(c, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: .5, ease: 'power2.out' });
        });
        c.addEventListener('pointerleave', function () { gsap.to(c, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out' }); });
      });
    }
    if ($('.band')) gsap.fromTo('.band-media img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.brush', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '#ai', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.footer-media', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- compare slider ---------- */
  var cmp = $('#compare');
  if (cmp) {
    var range = $('.compare-range', cmp);
    var setPos = function (v) { cmp.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { setPos(range.value); });
    if (motion && 'IntersectionObserver' in window) {
      var cmpIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          cmpIO.disconnect();
          var o = { v: 50 };
          gsap.fromTo(o, { v: 12 }, { v: 62, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { range.value = o.v; setPos(o.v.toFixed(1)); } });
        });
      }, { threshold: 0.5 });
      cmpIO.observe(cmp);
    }
  }
  if (!fine) $$('.world').forEach(function (w) { w.addEventListener('click', function () { w.classList.toggle('flip'); }); });

  /* ---------- case overlay ---------- */
  var overlay = $('#overlay'), overlayScroll = $('#overlayScroll'), overlayTitle = $('#overlayTitle');
  var overlayOpen = false, current = null;
  function openCase(id, animate) {
    var art = document.getElementById('case-' + id);
    if (!art) return;
    closeMenu();
    if (current && current !== art) current.hidden = true;
    art.hidden = false; current = art;
    overlayTitle.textContent = art.getAttribute('data-title') || 'Case';
    overlayScroll.scrollTop = 0;
    if (!animate) overlay.style.transition = 'none';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (!animate) { void overlay.offsetHeight; overlay.style.transition = ''; }
    overlayOpen = true;
    lockScroll(true);
    history.replaceState(null, '', '#case-' + id);
    if (motion) {
      gsap.fromTo($('.case-head', art), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: animate ? .5 : 0 });
      gsap.fromTo($('.case-hero img', art), { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out', delay: animate ? .3 : 0 });
    }
    $('#overlayClose').focus({ preventScroll: true });
  }
  function closeCase(restoreHash) {
    if (!overlayOpen) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    overlayOpen = false;
    lockScroll(false);
    if (restoreHash !== false) history.replaceState(null, '', '#hof');
    setTimeout(function () { if (!overlayOpen && current) { current.hidden = true; current = null; } }, 900);
  }
  $('#overlayClose').addEventListener('click', function () { closeCase(); });
  $('.overlay-brand').addEventListener('click', function (e) { e.preventDefault(); closeCase(); scrollToEl($('#top')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (lb && lb.open) return; if (overlayOpen) closeCase(); else closeMenu(); }
  });
  (function openFromHash() {
    var m = /^#case-([\w-]+)$/.exec(location.hash || '');
    if (m && document.getElementById('case-' + m[1])) {
      var go = function () { openCase(m[1], false); };
      if (d.classList.contains('loading')) { var wait = setInterval(function () { if (d.classList.contains('ready')) { clearInterval(wait); go(); } }, 100); }
      else go();
    }
  })();

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightboxImg'), lbCap = $('#lightboxCap');
  if (lb && typeof lb.showModal === 'function') {
    $$('.tile picture img').forEach(function (img) {
      img.addEventListener('click', function () {
        var srcset = img.getAttribute('srcset') || '';
        var best = img.currentSrc || img.src;
        var parts = srcset.split(',').map(function (s) { return s.trim().split(' '); }).filter(function (p) { return p[0]; });
        if (parts.length) best = parts[parts.length - 1][0];
        lbImg.src = best; lbImg.alt = img.alt || ''; lbCap.textContent = img.alt || '';
        lb.showModal();
      });
    });
    var closeLb = function () { if (lb.open) lb.close(); };
    $('#lightboxClose').addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('close', function () { lbImg.removeAttribute('src'); });
  }

  /* ---------- refresh triggers when layout settles ---------- */
  if (hasGsap) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 200); });
  }
})();
