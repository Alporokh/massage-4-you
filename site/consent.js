/* Massage 4 You - GDPR / ePrivacy consent.

   Analytics runs on Google Consent Mode v2: the Google tag loads on every page,
   but every storage type is declared denied before it does, so it writes no
   cookies and records no visit until an affirmative choice is made here. This
   file flips analytics_storage to granted on accept.

   The parking mechanism below is still live for anything added later: a script
   written as <script type="text/plain" data-cc="category"> is never executed by
   the browser and is rewritten into a real script only once that category is
   accepted. Nothing is parked at the moment. */
(function () {
  'use strict';

  var KEY = 'cc_consent_v1';
  var MAX_AGE_DAYS = 180;              // re-ask twice a year
  var CATEGORIES = ['analytics'];      // the only non-essential category in use

  var banner, overlay, lastFocus = null;

  function read() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (!d) return null;
      if ((Date.now() - d.ts) / 86400000 > MAX_AGE_DAYS) return null;
      return d;
    } catch (e) { return null; }
  }

  function write(consent) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), version: 1, consent: consent }));
    } catch (e) { /* storage blocked - banner simply reappears */ }
  }

  // turn the parked scripts into real ones, in document order
  function activate(consent) {
    var parked = document.querySelectorAll('script[type="text/plain"][data-cc]');
    Array.prototype.forEach.call(parked, function (old) {
      if (!consent[old.getAttribute('data-cc')]) return;
      var s = document.createElement('script');
      Array.prototype.forEach.call(old.attributes, function (a) {
        if (a.name !== 'type' && a.name !== 'data-cc') s.setAttribute(a.name, a.value);
      });
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  // The tag is already loaded and sitting at denied; this is what turns
  // collection on. Without it an accepted banner would change nothing.
  function tellGoogle(consent) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', { analytics_storage: consent.analytics ? 'granted' : 'denied' });
  }

  function apply(consent, persist) {
    if (persist) write(consent);
    // Keep the checkbox in step with the decision. Reopening the panel already
    // re-reads the stored choice, so nothing depends on this today - but that
    // makes correctness rest on a second code path repairing the first, and
    // anything else that reads the box would read it stale.
    var box = document.getElementById('cc-analytics');
    if (box) box.checked = !!consent.analytics;
    tellGoogle(consent);
    activate(consent);
  }

  function open() {
    lastFocus = document.activeElement;
    banner.setAttribute('data-open', '');
    overlay.setAttribute('data-open', '');
    var f = document.getElementById('cc-accept');
    if (f) f.focus();
  }

  function close() {
    banner.removeAttribute('data-open');
    overlay.removeAttribute('data-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function all(v) {
    var c = {};
    CATEGORIES.forEach(function (k) { c[k] = v; });
    return c;
  }

  function boot() {
    banner = document.getElementById('cc-banner');
    overlay = document.getElementById('cc-overlay');
    if (!banner) return;

    document.getElementById('cc-accept').addEventListener('click', function () {
      apply(all(true), true); close();
    });
    document.getElementById('cc-reject').addEventListener('click', function () {
      apply(all(false), true); close();
    });

    // reopen from the footer of any page
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cc-open]') : null;
      if (!t) return;
      e.preventDefault();
      var saved = read();
      var box = document.getElementById('cc-analytics');
      if (box) box.checked = !!(saved && saved.consent.analytics);
      open();
    });

    document.getElementById('cc-save').addEventListener('click', function () {
      var box = document.getElementById('cc-analytics');
      apply({ analytics: !!(box && box.checked) }, true); close();
    });

    // Esc closes only once a choice exists - otherwise there is nothing to fall back on
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && banner.hasAttribute('data-open') && read()) close();
    });

    // keep focus inside the dialog while it is open
    banner.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = banner.querySelectorAll('button, input:not([disabled]), a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    var saved = read();
    if (saved) apply(saved.consent, false); else open();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
