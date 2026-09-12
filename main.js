/* charlesnasr.com · v2 "Director's Cut" · native scrolling + optional GSAP motion */
(function () {
  'use strict';
  var d = document.documentElement;
  var reduced = d.classList.contains('reduced');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motion = hasGsap && !reduced;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  d.classList.add('booted');
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  if (!motion) { d.classList.remove('loading'); d.classList.add('ready'); if (!hasGsap) d.classList.add('nomotion'); }

  /* ---------- native scrolling, with an offset for the fixed navigation ---------- */
  function scrollToEl(el) {
    window.scrollTo({ top: el.id === 'top' ? 0 : Math.max(0, window.scrollY + el.getBoundingClientRect().top - 90), behavior: reduced ? 'auto' : 'smooth' });
  }
  function lockScroll(on) {
    d.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  }

  /* ---------- reveals ---------- */
  var reveals = $$('.reveal').filter(function (el) { return !el.closest('#projectGrid'); });
  $$('#projectGrid .reveal').forEach(function (el) { el.classList.add('in'); });
  if ('IntersectionObserver' in window && motion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target);
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
  if (document.fonts) document.fonts.ready.then(function () {
    if (hasGsap) ScrollTrigger.refresh();
    updateNav();
  });

  /* ---------- menu ---------- */
  var menu = $('#menu'), menuBtn = $('#menuBtn'), preview = $('#menuPreview'), previewBox = $('.menu-preview');
  function menuBackgroundInert(value) { $$('main, footer, .skip').forEach(function (el) { el.inert = value; }); }
  function openMenu() {
    menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); nav.classList.add('menu-open');
    menuBackgroundInert(true); lockScroll(true);
    $('.menu-links a').focus({ preventScroll: true });
    if (motion) gsap.fromTo('.menu-links a', { opacity: .65 }, { opacity: 1, duration: .18, overwrite: true });
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); nav.classList.remove('menu-open');
    if (!overlayOpen) { menuBackgroundInert(false); lockScroll(false); }
    menuBtn.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || menu.hidden) return;
    var focusable = $$('#nav a[href], #menuBtn, #menu a[href]').filter(function (el) { return el.getClientRects().length; });
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
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

  /* ---------- loader ---------- */
  var loader = $('#loader');
  var heroScrollDone = false;
  function heroScroll() {
    if (heroScrollDone || !motion) return;
    heroScrollDone = true;
    // The name holds near its starting position while the keyed cloud and portrait pass in front.
    gsap.fromTo('.hero-title', { y: 0 }, { y: function () { return window.innerHeight * 0.98; }, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    gsap.fromTo('.hero-title', { opacity: 1 }, { opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: '48% top', end: '78% top', scrub: true } });
    gsap.fromTo(['.hero-media', '.hero-cut-box'], { yPercent: 0 }, { yPercent: 42, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.hero-sub', { opacity: 1, y: 0 }, { opacity: 0, y: 20, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: true } });
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
    gsap.set(['.nav', '.hero-media', '.hero-cut-box', '.hero-title', '.hero-sub', '.hero-scroll'], { opacity: 1 });
    gsap.fromTo(['.hero-media', '.hero-cut-box'], { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' });
    gsap.fromTo('.hero-title .w', { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .15 });
    gsap.fromTo(['.hero-sub', '.hero-scroll'], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .9, ease: 'power2.out', stagger: .1, delay: .7, onComplete: heroScroll });
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

  /* ---------- works strip (native horizontal scroll) ---------- */
  var drift = $('#drift'), track = $('#driftTrack'), pagerCur = $('#pagerCur'), pagerTot = $('#pagerTot'), bar = $('#driftBar');
  var items = $$('.drift-item', track);
  if (pagerTot) pagerTot.textContent = String(items.length).padStart(2, '0');
  function driftUpdate() {
    if (!drift) return;
    var max = drift.scrollWidth - drift.clientWidth;
    var p = max > 0 ? drift.scrollLeft / max : 0;
    if (bar) bar.style.width = Math.max(8, p * 100).toFixed(1) + '%';
    if (pagerCur) pagerCur.textContent = String(Math.min(items.length, Math.round(p * (items.length - 1)) + 1)).padStart(2, '0');
  }
  if (drift) {
    drift.addEventListener('scroll', driftUpdate, { passive: true });
    driftUpdate();
    $$('.drift-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = (items[0] ? items[0].getBoundingClientRect().width : 300) + window.innerWidth * 0.02;
        drift.scrollBy({ left: step * parseInt(b.getAttribute('data-dir'), 10), behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- browse the work by type ---------- */
  var projectGrid = $('#projectGrid');
  var filterButtons = $$('.work-filter');
  var projectCards = $$('#projectGrid > [data-category]');
  var filterStatus = $('#filterStatus');
  var filterLabels = { live: 'live experience', destinations: 'destination', content: 'visual content', ai: 'AI exploration' };
  var activeFilter = 'all';
  var filterAnimation = null;
  function warmProjectImages() {
    $$('#projectGrid img').forEach(function (img) { img.loading = 'eager'; });
  }
  if ('IntersectionObserver' in window) {
    var projectImageObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        warmProjectImages(); projectImageObserver.disconnect();
      }
    }, { rootMargin: '600px' });
    projectImageObserver.observe($('#hof'));
  }
  filterButtons.forEach(function (button, index) {
    var category = button.getAttribute('data-filter');
    var total = projectCards.filter(function (card) { return category === 'all' || card.getAttribute('data-category') === category; }).length;
    $('span', button).textContent = total;
    button.addEventListener('click', function () {
      if (activeFilter === category) return;
      activeFilter = category;
      if (filterAnimation) filterAnimation.cancel();
      var visible = [];
      filterButtons.forEach(function (b) {
        var active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      projectCards.forEach(function (card) {
        var show = category === 'all' || card.getAttribute('data-category') === category;
        card.hidden = !show;
        if (show) { card.classList.add('in'); visible.push(card); }
      });
      var cta = $('.card-cta', projectGrid);
      if (cta) cta.hidden = category !== 'all';
      filterStatus.textContent = category === 'all'
        ? 'Showing all ' + visible.length + ' projects'
        : 'Showing ' + visible.length + ' ' + filterLabels[category] + (category === 'content' ? ' projects' : (visible.length === 1 ? ' project' : ' projects'));
      if (!reduced && typeof projectGrid.animate === 'function') {
        filterAnimation = projectGrid.animate([{ opacity: .85 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' });
      }
      // Effects below the index use IntersectionObserver; filtering needs no global refresh.
      requestAnimationFrame(updateNav);
    });
    button.addEventListener('keydown', function (e) {
      var next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % filterButtons.length;
      else if (e.key === 'ArrowLeft') next = (index + filterButtons.length - 1) % filterButtons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = filterButtons.length - 1;
      else return;
      e.preventDefault(); filterButtons[next].focus(); filterButtons[next].click();
    });
  });

  /* ---------- poster imagery moves inside fixed frames; text stays crisp ---------- */
  if (motion) {
    $$('.poster').forEach(function (p) {
      if (fine) gsap.fromTo($('.poster-media img', p), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo($('.poster-copy', p), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 60%' } });
    });
    if ($('.band')) gsap.fromTo('.band-media img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- parallax layers ---------- */
  if (motion) {
    // Headings, captions, frames and textures stay in normal flow. Only hero atmosphere reacts.
    if (fine) {
      var heroEl = $('#hero');
      // only the background reacts to the pointer; the portrait stays still
      var glowX = gsap.quickTo('.hero-glow', 'x', { duration: .9, ease: 'power3.out' });
      var glowY = gsap.quickTo('.hero-glow', 'y', { duration: .9, ease: 'power3.out' });
      heroEl.addEventListener('pointermove', function (e) {
        var r = heroEl.getBoundingClientRect();
        var hx = e.clientX / window.innerWidth - .5, hy = e.clientY / window.innerHeight - .5;
        heroEl.classList.add('lit');
        glowX(e.clientX - r.left); glowY(e.clientY - r.top);
        gsap.to('.hero .tex', { x: hx * 110, y: hy * 70, scale: 1.04, duration: 1.2, ease: 'power2.out' });
        gsap.to('.hero-title', { x: -hx * 18, duration: 1.1, ease: 'power2.out' });
      });
      heroEl.addEventListener('pointerleave', function () { heroEl.classList.remove('lit'); gsap.to('.hero .tex', { x: 0, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' }); gsap.to('.hero-title', { x: 0, duration: 1.2, ease: 'power3.out' }); });
    }
  }

  /* ---------- compare slider ---------- */
  var cmp = $('#compare');
  if (cmp) {
    var range = $('.compare-range', cmp);
    var cmpTween;
    var cmpInteracted = false;
    var setPos = function (v) { cmp.style.setProperty('--pos', v + '%'); };
    function stopComparePreview() {
      cmpInteracted = true;
      if (cmpTween) cmpTween.kill();
      if (cmpIO) cmpIO.disconnect();
    }
    range.addEventListener('pointerdown', stopComparePreview);
    range.addEventListener('keydown', stopComparePreview);
    range.addEventListener('input', function () { stopComparePreview(); setPos(range.value); });
    if (motion && 'IntersectionObserver' in window) {
      var cmpIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting || cmpInteracted) return;
          cmpIO.disconnect();
          var o = { v: 50 };
          cmpTween = gsap.fromTo(o, { v: 12 }, { v: 62, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { range.value = o.v; setPos(o.v.toFixed(1)); } });
        });
      }, { threshold: 0.5 });
      cmpIO.observe(cmp);
    }
  }
  if (!fine) $$('.world').forEach(function (w) { w.addEventListener('click', function () { w.classList.toggle('flip'); }); });

  /* ---------- quiet atmosphere, paused off screen ---------- */
  var atmosphereEnabled = !reduced;
  var ambientVideos = $$('.ambient-video');
  function syncAtmosphere() {
    d.classList.toggle('atmosphere-paused', !atmosphereEnabled);
    $$('.motion-toggle').forEach(function (button) {
      button.textContent = atmosphereEnabled ? 'Pause motion' : 'Play motion';
      button.setAttribute('aria-pressed', String(atmosphereEnabled));
    });
    ambientVideos.forEach(function (video) {
      var shouldPlay = atmosphereEnabled && video.dataset.inView === 'true' && !document.hidden && !overlayOpen && !(video.dataset.playOnce === 'true' && video.ended);
      if (!shouldPlay) { video.pause(); return; }
      if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
      video.muted = true;
      var play = video.play();
      if (play) play.catch(function () { /* The poster stays visible when autoplay is unavailable. */ });
    });
  }
  $$('.motion-toggle').forEach(function (button) {
    button.addEventListener('click', function () { atmosphereEnabled = !atmosphereEnabled; syncAtmosphere(); });
  });
  if ('IntersectionObserver' in window) {
    var atmosphereObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target.matches('video')) entry.target.dataset.inView = String(entry.isIntersecting);
        else entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
      syncAtmosphere();
    }, { threshold: .12 });
    ambientVideos.concat($$('.lens-layer')).forEach(function (el) { atmosphereObserver.observe(el); });
  }
  document.addEventListener('visibilitychange', syncAtmosphere);
  syncAtmosphere();

  /* ---------- supplied project films ---------- */
  function stopFilms() {
    $$('.film-player').forEach(function (player) {
      var video = $('video', player);
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); }
      var loading = $('.film-loading', player);
      if (loading) loading.remove();
      var launch = $('.film-launch', player);
      launch.hidden = false;
      player.classList.remove('is-playing');
    });
  }
  $$('.film-launch').forEach(function (button) {
    button.addEventListener('click', function () {
      var player = button.closest('.film-player');
      stopFilms();
      button.hidden = true;
      player.classList.add('is-playing');
      var loading = document.createElement('span');
      loading.className = 'film-loading'; loading.textContent = 'Loading film…';
      player.appendChild(loading);
      var video = document.createElement('video');
      video.setAttribute('aria-label', player.dataset.title);
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.tabIndex = 0;
      video.poster = $('img', button).currentSrc || $('img', button).src;
      video.src = player.dataset.video;
      video.addEventListener('playing', function () { loading.remove(); });
      video.addEventListener('error', function () {
        loading.textContent = 'Unable to load this film. Use the original video link below.';
      });
      player.appendChild(video);
      video.focus({ preventScroll: true });
      var play = video.play();
      if (play) play.catch(function () { if (!video.error) loading.remove(); });
    });
  });

  /* ---------- case overlay ---------- */
  var overlay = $('#overlay'), overlayScroll = $('#overlayScroll'), overlayTitle = $('#overlayTitle');
  var overlayOpen = false, current = null;
  var caseOpener = null;
  function setPageInert(value) {
    $$('.skip, #nav, #menu, main, footer').forEach(function (el) { el.inert = value; });
  }
  function openCase(id, animate) {
    if (id === 'kingdom') id = 'usyk';
    var art = document.getElementById('case-' + id);
    if (!art) return;
    if (!overlayOpen) caseOpener = document.activeElement;
    stopFilms();
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
    setPageInert(true);
    syncAtmosphere();
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
    stopFilms();
    setPageInert(false);
    syncAtmosphere();
    lockScroll(false);
    if (restoreHash !== false) history.replaceState(null, '', '#hof');
    setTimeout(function () { if (!overlayOpen && current) { current.hidden = true; current = null; } }, 900);
    if (caseOpener && caseOpener.isConnected && !caseOpener.hidden) caseOpener.focus({ preventScroll: true });
  }
  $('#overlayClose').addEventListener('click', function () { closeCase(); });
  $('.overlay-brand').addEventListener('click', function (e) { e.preventDefault(); closeCase(); scrollToEl($('#top')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (lb && lb.open) return; if (overlayOpen) closeCase(); else closeMenu(); }
    if (e.key === 'Tab' && overlayOpen && !(lb && lb.open)) {
      var focusable = $$('a[href], button, iframe, input, [tabindex="0"]', overlay).filter(function (el) { return !el.disabled && el.getClientRects().length && !el.closest('[hidden]'); });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  (function openFromHash() {
    var m = /^#case-([\w-]+)$/.exec(location.hash || '');
    if (m && m[1] === 'kingdom') m[1] = 'usyk';
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
