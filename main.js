/* ==========================================================================
   DataVision Analytics — main.js
   Classic script (no ES modules). Every init wrapped in safe() so one
   failure never breaks the rest of the page. Content is hardcoded in HTML;
   JS only enriches.
   ========================================================================== */
(function () {
  'use strict';

  function safe(fn, name) {
    try { fn(); } catch (e) { console.error('[init failed] ' + name, e); }
  }

  /* ---------------- Splash safety net ---------------- */
  function initSplash() {
    var splash = document.getElementById('splash');
    if (!splash) return;
    var hide = function () { document.body.classList.add('loaded'); };
    window.addEventListener('load', function () { setTimeout(hide, 700); });
    setTimeout(hide, 6000); // hard safety net regardless of load event
  }

  /* ---------------- Navbar scroll state ---------------- */
  function initNavbar() {
    var nav = document.getElementById('navbar');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Mobile menu ---------------- */
  function initMobileMenu() {
    var burger = document.getElementById('hamburger');
    var mnav = document.getElementById('mobileNav');
    var closeBtn = document.getElementById('mobileClose');
    if (!burger || !mnav) return;
    var open = function () { mnav.classList.add('open'); document.body.style.overflow = 'hidden'; };
    var close = function () { mnav.classList.remove('open'); document.body.style.overflow = ''; };
    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  }

  /* ---------------- Theme toggle (persists in memory only) ---------------- */
  function initTheme() {
    var toggles = document.querySelectorAll('.theme-toggle');
    if (!toggles.length) return;
    var root = document.documentElement;
    var setIcon = function () {
      var isDark = root.getAttribute('data-theme') === 'dark';
      toggles.forEach(function (t) { t.textContent = isDark ? '☀' : '☾'; });
    };
    toggles.forEach(function (t) {
      t.addEventListener('click', function () {
        var isDark = root.getAttribute('data-theme') === 'dark';
        root.setAttribute('data-theme', isDark ? 'light' : 'dark');
        setIcon();
      });
    });
    setIcon();
  }

  /* ---------------- Scroll reveal (IntersectionObserver, threshold <= 0.05) + safety timeout ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }

    // 6s safety timeout — reveal anything still hidden (defensive net)
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('in'); });
    }, 6000);
  }

  /* ---------------- Animated counters ---------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    var animated = new WeakSet();

    var run = function (el) {
      if (animated.has(el)) return;
      animated.add(el);
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1800;
      var startTime = null;
      var step = function (ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = target * eased;
        el.textContent = (target % 1 === 0 ? Math.floor(value) : value.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.3 });
      counters.forEach(function (c) { io.observe(c); });
    } else {
      counters.forEach(run);
    }
    setTimeout(function () { counters.forEach(run); }, 6000);
  }

  /* ---------------- Testimonial carousel (autoplay) ---------------- */
  function initTestimonials() {
    var track = document.getElementById('testiSlides');
    var dotsWrap = document.getElementById('testiDots');
    if (!track || !dotsWrap) return;
    if (track.children.length === 0) return; // idempotent guard
    var slides = track.children.length;
    var index = 0;
    var timer = null;

    var dots = [];
    for (var i = 0; i < slides; i++) {
      var b = document.createElement('button');
      if (i === 0) b.classList.add('active');
      (function (idx) { b.addEventListener('click', function () { goTo(idx); restart(); }); })(i);
      dotsWrap.appendChild(b);
      dots.push(b);
    }

    function render() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }
    function goTo(i) { index = (i + slides) % slides; render(); }
    function next() { goTo(index + 1); }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, 6000); }

    restart();
  }

  /* ---------------- Contact form validation + fake submit ---------------- */
  function initForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var success = document.getElementById('formSuccess');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var required = form.querySelectorAll('[data-required]');
      required.forEach(function (field) {
        var wrap = field.closest('.field');
        var val = (field.value || '').trim();
        var ok = val.length > 0;
        if (field.type === 'email' && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }
        if (wrap) wrap.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      setTimeout(function () {
        form.style.display = 'none';
        if (success) success.classList.add('show');
      }, 900);
    });

    form.querySelectorAll('[data-required]').forEach(function (field) {
      field.addEventListener('input', function () {
        var wrap = field.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }

  /* ---------------- Back to top + floating buttons ---------------- */
  function initFabs() {
    var topBtn = document.getElementById('fabTop');
    if (topBtn) {
      window.addEventListener('scroll', function () {
        topBtn.classList.toggle('show', window.scrollY > 500);
      }, { passive: true });
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ---------------- Smooth in-page anchor offset for fixed navbar ---------------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var y = target.getBoundingClientRect().top + window.pageYOffset - 84;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    safe(initSplash, 'splash');
    safe(initNavbar, 'navbar');
    safe(initMobileMenu, 'mobileMenu');
    safe(initTheme, 'theme');
    safe(initReveal, 'reveal');
    safe(initCounters, 'counters');
    safe(initTestimonials, 'testimonials');
    safe(initForm, 'form');
    safe(initFabs, 'fabs');
    safe(initAnchors, 'anchors');
  });
})();
