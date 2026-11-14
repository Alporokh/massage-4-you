/* Massage4you - interactions */
(function () {

  /* ------------------------------------------------------------------
     Booking form delivery.
     Leave FORM_ENDPOINT empty and the form falls back to opening the
     visitor's mail client with the request pre-filled. Paste a Formspree /
     Getform / own-backend URL here and it will POST the fields as JSON
     instead - no other change needed.
  ------------------------------------------------------------------ */
  var FORM_ENDPOINT = '/api/booking';
  var STUDIO_EMAIL = 'massage4youpoznan@gmail.com';
  // English pages carry <html lang="en">: visitor-facing messages switch to
  // English and the lead is flagged so the studio replies in English.
  var EN = /^en/i.test(document.documentElement.lang || '');
  function tr(pl, en) { return EN ? en : pl; }
  /* ------------------------------------------------------------------
     GA4 events.
     Each page's <head> holds analytics_storage at denied until the cookie
     banner is accepted; until then Google receives these only as cookieless
     pings. No event carries the visitor's name, phone, email or message.
  ------------------------------------------------------------------ */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  // Lead value in PLN, re-synced with cennik.html on 2026-11-14 (single sessions
  // only, no packages). When a price changes on the cennik page, change it here.
  var PRICES = {
    'Masaż relaksacyjny całego ciała': { '60 min': 170, '80 min': 220, '90 min': 240, '120 min': 330 },
    'Masaż zdrowotny całego ciała': { '60 min': 190, '80 min': 240, '90 min': 270, '120 min': 370 },
    'Masaż tkanek głębokich': { '40 min': 140, '60 min': 200, '80 min': 250, '90 min': 280 },
    'Masaż sportowy': { '60 min': 190, '80 min': 240, '90 min': 270 },
    'Masaż drenażu limfatycznego': { '60 min': 170, '80 min': 220 },
    'Masaż kamieniami gorącymi': { '60 min': 180, '80 min': 230 },
    'Masaż na 4 ręce': { '60 min': 330 },
    'Masaż relaksacyjny ciała + twarzy': { '120 min': 330, '140 min': 380 },
    'Masaż pleców': { '30 min': 90, '45 min': 130, '60 min': 170 },
    'Masaż karku': { '30 min': 90 },
    'Masaż karku + głowa': { '40 min': 120 },
    'Masaż biurowy': { '50 min': 140 },
    'Masaż stóp klasyczny': { '20 min': 70 },
    'Masaż dla dwojga relaksacyjny': { '60 min': 320, '80 min': 420, '90 min': 460, '120 min': 640 },
    'Masaż dla dwojga zdrowotny': { '60 min': 360, '80 min': 460, '90 min': 520, '120 min': 720 },
    'Masaż dla dwojga relaksacyjny ciała + twarzy': { '90 min': 500, '120 min': 640, '140 min': 740 },
    'Masaż dla dwojga kamieniami gorącymi': { '60 min': 350, '80 min': 420 },
    'Masaż Kobido dla dwojga': { '60 min': 340, '75 min': 420 },
    'Masaż Kobido': { '60 min': 180, '75 min': 220 },
    'Masaż autorski skulpturalny twarzy': { '80 min': 250 },
    'Masaż mioplastyczny + transbukalny twarzy': { '60 min': 180 },
    'Masaż transbukalny twarzy': { '40 min': 120 },
    'Masaż karku + mioplastyczny twarzy': { '90 min': 260 },
    'Masaż tajski klasyczny na matach': { '60 min': 180, '90 min': 240 },
    'Masaż tajski stóp': { '45 min': 130 },
    'Masaż tajski stóp + głowy': { '60 min': 170 },
    'Masaż antycellulitowy': { '60 min': 180, '80 min': 240 },
    'Masaż antycellulitowy + presoterapia': { '80 min': 240 },
    'Endosfera': { '20 min': 90, '30 min': 110, '45 min': 150 },
    'Presoterapia': { '30 min': 90 },
    'Lipolaser': { '20 min': 50, '40 min': 90 },
    'Liposukcja ultradźwiękowa': { '30 min': 90 },
    'Kriolipoliza': { '60 min': 310 },
    'Fala radiowa z vacuum': { '30 min': 90, '60 min': 150 },
    'Endermologia (LPG)': { '30 min': 120, '60 min': 180 }
  };

  // The price of the chosen length; with no length chosen, the cheapest single
  // session, so the value never overstates the lead. A voucher is worth the
  // amount the cennik link wrote into the message.
  function leadValue(d) {
    var byLength = PRICES[d.service];
    if (byLength) {
      if (byLength[d.duration]) return byLength[d.duration];
      return Math.min.apply(null, Object.keys(byLength).map(function (k) { return byLength[k]; }));
    }
    if (d.service === 'Voucher upominkowy') {
      var amount = /na kwotę\s*(\d[\d\s]*)/.exec(d.note || '');
      if (amount) return parseInt(amount[1].replace(/\s/g, ''), 10);
    }
    return null;
  }

  function leadParams(d) {
    var params = {
      lead_source: 'booking_form',
      service: d.service || 'nie_wybrano',
      duration: d.duration || 'bez_preferencji',
      therapist: d.therapist || 'bez_preferencji'
    };
    var value = leadValue(d);
    if (value) { params.value = value; params.currency = 'PLN'; }
    return params;
  }

  // Contact and booking clicks, on every page
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var host = (link.hostname || '').replace(/^www\./, '');
    var area = link.closest('[id], header, nav, footer');
    var params = { link_placement: link.getAttribute('data-placement') || (area ? (area.id || area.tagName.toLowerCase()) : 'page') };

    if (href.indexOf('tel:') === 0) {
      track('phone_click', params);
    } else if (href.indexOf('mailto:') === 0 || href.indexOf('/cdn-cgi/l/email-protection') !== -1) {
      track('email_click', params);
    } else if (/(^|\.)booksy\.com$/.test(host)) {
      track('booksy_click', params);
    } else if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(host) || href.indexOf('whatsapp:') === 0) {
      track('whatsapp_click', params);
    } else if (/(^|\.)instagram\.com$/.test(host)) {
      track('instagram_click', params);
    } else if (/(^|\.)facebook\.com$/.test(host)) {
      track('facebook_click', params);
    } else if (host === 'share.google' || host === 'g.page' || host === 'maps.app.goo.gl') {
      track('google_profile_click', params);
    } else if (href.indexOf('#rezerwacja') !== -1 || href.indexOf('#booking') !== -1 || link.hasAttribute('data-book')) {
      var query = new URLSearchParams(link.search);
      params.service = link.getAttribute('data-service') || query.get('zabieg') || 'nie_wybrano';
      if (query.get('czas')) params.duration = query.get('czas');
      track('booking_button_click', params);
    }
  });

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  var header = document.querySelector('.header');

  // Mobile nav toggle
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      // inside the folded panel the Zabiegi label expands its list instead of
      // navigating away - there is no hover on a touch screen
      var label = e.target.closest('.menu__label');
      if (label && window.matchMedia('(max-width: 860px)').matches) {
        e.preventDefault();
        label.parentNode.classList.toggle('open');
        return;
      }
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Keep the Zabiegi dropdown on screen. It is centred under its label, and on
  // narrower desktops the label sits left of centre, so a panel sized to its
  // content can hang off the left edge. Worked out from layout offsets, not
  // getBoundingClientRect: the panel's transform is animated, and a rect read
  // mid-transition would still include the shift being replaced.
  var menuWrap = document.querySelector('.menu');
  var menuPanel = menuWrap && menuWrap.querySelector('.menu__panel');
  if (menuPanel) {
    var placeMenu = function () {
      if (window.matchMedia('(max-width: 860px)').matches) {
        menuPanel.style.removeProperty('--menu-shift');   // folded into the burger menu
        return;
      }
      var gutter = 16;
      var vw = document.documentElement.clientWidth;
      var left = menuWrap.getBoundingClientRect().left + menuPanel.offsetLeft - menuPanel.offsetWidth / 2;
      var right = left + menuPanel.offsetWidth;
      var shift = 0;
      if (left < gutter) shift = gutter - left;
      else if (right > vw - gutter) shift = vw - gutter - right;
      menuPanel.style.setProperty('--menu-shift', Math.round(shift) + 'px');
    };
    placeMenu();
    window.addEventListener('resize', placeMenu, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeMenu);
  }

  // Transparent over the hero, solid once the page scrolls - keeps the logo
  // and the nav readable over the light sections underneath.
  if (header && !header.classList.contains('header--solid')) {
    var onScroll = function () {
      header.classList.toggle('header--scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Team video ---------------- */
  // Held at poster + play button until asked for: preload="none" means the
  // 1.5 MB clip is only fetched on a real click.
  var vid = document.querySelector('[data-video]');
  if (vid) {
    var video = vid.querySelector('video');
    var playBtn = vid.querySelector('.vid__play');
    playBtn.addEventListener('click', function () {
      vid.classList.add('is-playing');
      video.controls = true;
      video.play();
    });

    // Back to the resting state: overlay button visible, native controls gone.
    function rest() {
      vid.classList.remove('is-playing');
      video.controls = false;
    }

    // The clip loops, so 'ended' never fires and pausing is the only way back
    // to rest - the old handler waited for an end that no longer arrives.
    // 'ended' stays wired so pulling the loop attribute still behaves.
    video.addEventListener('pause', rest);
    video.addEventListener('ended', function () {
      rest();
      video.load();           // rewind to the poster frame
    });
  }

  /* ---------------- Gallery: parallax carousel ----------------
     The strip itself is plain CSS scroll-snap and works with this script
     switched off. What is added here is the parallax - each photo is 118%
     of its frame and slides against the scroll direction, so the images
     drift inside their frames instead of moving as flat tiles - plus the
     arrows and the progress rule.
  ------------------------------------------------------------------- */
  var pcar = document.querySelector('[data-carousel]');
  if (pcar) {
    var vp = pcar.querySelector('.pcar__viewport');
    var slides = Array.prototype.slice.call(pcar.querySelectorAll('.pcar__slide'));
    var pPrev = pcar.querySelector('[data-pcar-prev]');
    var pNext = pcar.querySelector('[data-pcar-next]');
    var pBar = pcar.querySelector('.pcar__bar i');
    // honour the OS setting, and keep honouring it if the visitor changes it
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var queued = false;

    // Percent of the IMAGE's own width, which is 118% of the frame - so 7%
    // here is 7 * 1.18 = 8.3% of the frame, just inside the 9% of slack the
    // overscan leaves on each side. Raising this past 7.6 tears a gap open.
    var DRIFT = 7;

    function paint() {
      queued = false;
      var box = vp.getBoundingClientRect();
      var middle = box.left + box.width / 2;

      if (!motionQuery.matches) {
        for (var i = 0; i < slides.length; i++) {
          var r = slides[i].getBoundingClientRect();
          // -1 at the far left of the viewport, 0 dead centre, +1 far right
          var p = (r.left + r.width / 2 - middle) / box.width;
          p = Math.max(-1, Math.min(1, p));
          var img = slides[i].querySelector('img');
          if (img) img.style.transform = 'translate3d(' + (p * DRIFT).toFixed(2) + '%,0,0)';
        }
      }

      var max = vp.scrollWidth - vp.clientWidth;
      if (pBar) {
        // the rule's length shows how much of the strip fits on screen,
        // its position shows where you are in it
        var w = vp.scrollWidth > 0 ? Math.max(12, (vp.clientWidth / vp.scrollWidth) * 100) : 100;
        var ratio = max > 0 ? vp.scrollLeft / max : 0;
        pBar.style.width = w + '%';
        pBar.style.transform = 'translateX(' + (ratio * (100 - w) / w * 100).toFixed(2) + '%)';
      }
      if (pPrev) pPrev.disabled = vp.scrollLeft <= 2;
      if (pNext) pNext.disabled = max <= 2 || vp.scrollLeft >= max - 2;
    }

    function schedule() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(paint);
    }

    function stride() {
      // one slide plus the gap, measured rather than hard-coded
      if (slides.length > 1) return slides[1].offsetLeft - slides[0].offsetLeft;
      return slides.length ? slides[0].getBoundingClientRect().width : vp.clientWidth * 0.8;
    }

    function nudge(dir) {
      vp.scrollBy({ left: dir * stride(), behavior: motionQuery.matches ? 'auto' : 'smooth' });
    }

    if (pPrev) pPrev.addEventListener('click', function () { nudge(-1); });
    if (pNext) pNext.addEventListener('click', function () { nudge(1); });

    vp.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    // addEventListener on a MediaQueryList is not in older Safari
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', schedule);
    else if (motionQuery.addListener) motionQuery.addListener(schedule);

    // lazy images have no width until they load, which would leave the
    // progress rule wrong on first paint
    Array.prototype.forEach.call(pcar.querySelectorAll('img'), function (img) {
      if (!img.complete) img.addEventListener('load', schedule, { once: true });
    });

    schedule();
  }

  /* ---------------- Booking pop-up, mobile bar, map ----------------
     Only the homepages carry the booking form. Everywhere else "Zarezerwuj"
     opens the same form in a pop-up instead of sending people to another
     page; it is built here (one copy for 80 pages) before the booking code
     below wires it up, and it posts to the same endpoint. The service and
     length come from the button: data-service, ?zabieg= and &czas=. */
  var SERVICES = [["Masaże ciała", "Body massages", [["Masaż relaksacyjny całego ciała", "Relaxing full-body massage"], ["Masaż zdrowotny całego ciała", "Health (therapeutic) full-body massage"], ["Masaż tkanek głębokich", "Deep tissue massage"], ["Masaż sportowy", "Sports massage"], ["Masaż drenażu limfatycznego", "Lymphatic drainage massage"], ["Masaż kamieniami gorącymi", "Hot stone massage"], ["Masaż na 4 ręce", "Four-hands massage"], ["Masaż relaksacyjny ciała + twarzy", "Relaxing body + face massage"], ["Masaż pleców", "Back massage"], ["Masaż karku", "Neck massage"], ["Masaż karku + głowa", "Neck + head massage"], ["Masaż biurowy", "Office massage (neck and shoulders)"], ["Masaż stóp klasyczny", "Classic foot massage"]]], ["Masaże dla dwojga", "Massages for two", [["Masaż dla dwojga relaksacyjny", "Relaxing couples massage"], ["Masaż dla dwojga zdrowotny", "Health couples massage"], ["Masaż dla dwojga relaksacyjny ciała + twarzy", "Body + face for two"], ["Masaż dla dwojga kamieniami gorącymi", "Hot stones for two"], ["Masaż Kobido dla dwojga", "Kobido for two"]]], ["Masaże twarzy", "Facial massages", [["Masaż Kobido", "Kobido facial massage"], ["Masaż autorski skulpturalny twarzy", "Sculptural facial massage"], ["Masaż mioplastyczny + transbukalny twarzy", "Myoplastic + buccal facial massage"], ["Masaż transbukalny twarzy", "Buccal facial massage"], ["Masaż karku + mioplastyczny twarzy", "Neck + myoplastic facial massage"]]], ["Masaże tajskie", "Thai massages", [["Masaż tajski klasyczny na matach", "Thai massage on mats"], ["Masaż tajski stóp", "Thai foot massage"], ["Masaż tajski stóp + głowy", "Thai foot + head massage"]]], ["Masaże antycellulitowe", "Anti-cellulite", [["Masaż antycellulitowy", "Anti-cellulite massage"], ["Masaż antycellulitowy + presoterapia", "Anti-cellulite massage + pressotherapy"]]], ["Zabiegi na ciało", "Body treatments", [["Endosfera", "Endosphères therapy"], ["Presoterapia", "Pressotherapy"], ["Lipolaser", "Lipolaser"], ["Liposukcja ultradźwiękowa", "Ultrasound cavitation"], ["Kriolipoliza", "Cryolipolysis"], ["Fala radiowa z vacuum", "Radiofrequency with vacuum"], ["Endermologia (LPG)", "Endermologie (LPG)"]]], ["Inne", "Other", [["Voucher upominkowy", "Gift voucher"], ["Nie wiem - proszę o doradztwo", "Not sure - please advise me"]]]];
  var DURATIONS = ['20 min', '30 min', '40 min', '45 min', '50 min', '60 min', '75 min', '80 min', '90 min', '120 min', '140 min'];
  var bookModal = null;
  if (!document.getElementById('booking-form')) {
    var opt = function (v, l) { return '<option value="' + v + '">' + l + '</option>'; };
    var svcHtml = '<option value="" disabled selected>' + tr('Wybierz zabieg', 'Choose a treatment') + '</option>' +
      SERVICES.map(function (g) {
        return '<optgroup label="' + tr(g[0], g[1]) + '">' + g[2].map(function (o) { return opt(o[0], tr(o[0], o[1])); }).join('') + '</optgroup>';
      }).join('');
    var times = ['<option value="" selected>' + tr('Bez preferencji', 'No preference') + '</option>'];
    for (var hh = 9; hh <= 20; hh++) for (var mm = 0; mm < 60; mm += 15) {
      var tt = (hh < 10 ? '0' : '') + hh + ':' + (mm ? mm : '00');
      if (hh === 20 && mm === 15) continue;
      times.push('<option>' + tt + '</option>');
    }
    bookModal = document.createElement('div');
    bookModal.className = 'bkm';
    bookModal.hidden = true;
    bookModal.setAttribute('role', 'dialog');
    bookModal.setAttribute('aria-modal', 'true');
    bookModal.setAttribute('aria-labelledby', 'bkm-title');
    bookModal.innerHTML =
      '<div class="bkm__panel">' +
        '<button type="button" class="bkm__close" data-bkm-close aria-label="' + tr('Zamknij', 'Close') + '">&times;</button>' +
        '<h2 class="h2" id="bkm-title">' + tr('Zarezerwuj wizytę', 'Book a visit') + '</h2>' +
        '<p class="lead">' + tr('Wypełnij formularz - odezwiemy się, żeby potwierdzić termin. Zwykle odpowiadamy tego samego dnia.',
                                'Fill in the form and we will get back to you to confirm the time, usually the same day. We speak English.') + '</p>' +
        '<form class="form" id="booking-form" novalidate>' +
          '<div class="field"><label for="bk-name">' + tr('Imię i nazwisko *', 'Your name *') + '</label><input id="bk-name" name="name" type="text" autocomplete="name" required></div>' +
          '<div class="field"><label for="bk-phone">' + tr('Telefon *', 'Phone or WhatsApp *') + '</label><input id="bk-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+48 600 000 000"></div>' +
          '<div class="field field--full"><label for="bk-email">E-mail</label><input id="bk-email" name="email" type="email" autocomplete="email"></div>' +
          '<div class="field field--full"><label for="bk-service">' + tr('Zabieg *', 'Treatment *') + '</label><select id="bk-service" name="service" required>' + svcHtml + '</select></div>' +
          '<div class="field"><label for="bk-duration">' + tr('Długość zabiegu', 'Length') + '</label><select id="bk-duration" name="duration"><option value="" selected>' + tr('Bez preferencji', 'No preference') + '</option>' + DURATIONS.map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="bk-date">' + tr('Preferowana data', 'Preferred date') + '</label><input id="bk-date" name="date" type="date"></div>' +
          '<div class="field field--full"><label for="bk-time">' + tr('Preferowana godzina', 'Preferred time') + '</label><select id="bk-time" name="time">' + times.join('') + '</select></div>' +
          '<div class="field field--full"><label for="bk-note">' + tr('Wiadomość', 'Message') + '</label><textarea id="bk-note" name="note" rows="3"></textarea></div>' +
          '<div class="hp" aria-hidden="true"><label for="bk-company">Company</label><input id="bk-company" name="company" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<label class="consent field--full" for="bk-consent"><input id="bk-consent" name="consent" type="checkbox" required><span>' +
            tr('Wyrażam zgodę na kontakt telefoniczny lub mailowy w celu potwierdzenia rezerwacji. *', 'I agree to be contacted by phone, WhatsApp or e-mail to confirm my booking. *') + '</span></label>' +
          '<div class="field--full form__actions"><button type="submit" class="btn btn--solid">' + tr('Wyślij zgłoszenie', 'Send request') + '</button>' +
            '<span class="form__hint">' + tr('* pola wymagane', '* required fields') + '</span></div>' +
          '<p class="form__status field--full" id="booking-status" role="status" aria-live="polite"></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(bookModal);

    var lastFocusBk = null;
    var closeBk = function () {
      bookModal.hidden = true;
      document.body.classList.remove('bkm-open');
      if (lastFocusBk) lastFocusBk.focus({ preventScroll: true });
    };
    var openBk = function (svc, czas) {
      lastFocusBk = document.activeElement;
      var sel = document.getElementById('bk-service');
      var dur = document.getElementById('bk-duration');
      if (svc) {
        var hit = Array.prototype.find.call(sel.options, function (o) { return o.value === svc; });
        if (hit) sel.value = hit.value;
      }
      if (czas) {
        var dh = Array.prototype.find.call(dur.options, function (o) { return o.textContent.trim() === czas; });
        if (dh) dur.value = dh.textContent.trim();
        else { var nt = document.getElementById('bk-note'); if (nt && !nt.value) nt.value = tr('Wybrany wariant: ', 'Chosen option: ') + czas + '.'; }
      }
      bookModal.hidden = false;
      document.body.classList.add('bkm-open');
      document.getElementById('bk-name').focus();
    };
    bookModal.addEventListener('click', function (e) {
      if (e.target === bookModal || e.target.closest('[data-bkm-close]')) closeBk();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bookModal.hidden) closeBk(); });
    // Any link to the booking form (#rezerwacja / #booking, with or without
    // ?zabieg=&czas=) opens the pop-up instead of leaving the page.
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var h = a.getAttribute('href') || '';
      if (!/#(rezerwacja|booking)$/.test(h) && !a.hasAttribute('data-book')) return;
      if (a.hostname && a.hostname !== location.hostname) return;
      e.preventDefault();
      var q = new URLSearchParams(a.search);
      openBk(a.getAttribute('data-service') || q.get('zabieg'), q.get('czas'));
    });
  }

  // Mobile action bar: Zarezerwuj / WhatsApp / Zadzwoń, fixed to the bottom.
  // It replaces the floating WhatsApp button on phones (hidden in CSS).
  (function () {
    var bar = document.createElement('nav');
    bar.className = 'actionbar';
    bar.setAttribute('aria-label', tr('Szybki kontakt', 'Quick contact'));
    var bookHref = document.getElementById('rezerwacja') ? '#rezerwacja'
      : document.getElementById('booking') ? '#booking'
      : (EN ? '/en/#booking' : '/#rezerwacja');
    var ico = {
      book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      wa: '<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.8A13 13 0 1 0 16 3Zm0 23.8c-2 0-3.9-.5-5.5-1.5l-.4-.2-4 1 1.1-3.8-.3-.4A10.8 10.8 0 1 1 16 26.8Z"/></svg>',
      tel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    };
    bar.innerHTML =
      '<a class="actionbar__book" href="' + bookHref + '" data-book data-placement="sticky-bar">' + ico.book + tr('Zarezerwuj', 'Book now') + '</a>' +
      '<a href="https://wa.me/48533681901" target="_blank" rel="noopener" data-placement="sticky-bar">' + ico.wa + 'WhatsApp</a>' +
      '<a href="tel:+48533681901" data-placement="sticky-bar">' + ico.tel + tr('Zadzwoń', 'Call') + '</a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-actionbar');
  })();

  // Map: the Google embed loads only after a click (it sets Google cookies).
  Array.prototype.forEach.call(document.querySelectorAll('[data-map]'), function (box) {
    var btn = box.querySelector('[data-map-load]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-src');
      f.title = box.getAttribute('data-title') || 'Mapa';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
      track('map_open', { link_placement: 'map' });
    });
  });

  /* ---------------- Booking ---------------- */
  var form = document.getElementById('booking-form');
  var status = document.getElementById('booking-status');
  var serviceSelect = document.getElementById('bk-service');

  function selectService(wanted) {
    if (!serviceSelect || !wanted) return false;
    var match = Array.prototype.find.call(serviceSelect.options, function (o) {
      return o.value === wanted || o.textContent.trim() === wanted;
    });
    if (!match) return false;
    serviceSelect.value = match.value || match.textContent.trim();
    serviceSelect.dispatchEvent(new Event('change'));
    return true;
  }

  // Arriving from the cennik page: /?zabieg=Masaż%20klasyczny#rezerwacja
  // preselects the treatment, so those buttons work across pages too.
  if (serviceSelect) {
    var params = new URLSearchParams(window.location.search);
    var wantedFromUrl = params.get('zabieg');
    if (wantedFromUrl && selectService(wantedFromUrl)) {
      var target = document.getElementById('rezerwacja') || document.getElementById('booking');
      if (target && !/^#(rezerwacja|booking)$/.test(window.location.hash)) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // voucher rows on the cennik page also carry the chosen amount
    var amount = params.get('kwota');
    var note = document.getElementById('bk-note');
    if (amount && note && !note.value) {
      note.value = tr('Voucher upominkowy na kwotę ' + amount + '.', 'Gift voucher for ' + amount + '.');
    }

    // Price pills on the cennik also carry the chosen length. Package rows use
    // labels like "6 × 45 min" that no <option> matches - those go in the
    // message instead of being dropped on the floor.
    var czas = params.get('czas');
    var durationSelect = document.getElementById('bk-duration');
    if (czas && durationSelect) {
      var hit = Array.prototype.find.call(durationSelect.options, function (o) {
        return o.value === czas || o.textContent.trim() === czas;
      });
      if (hit) {
        durationSelect.value = hit.value || hit.textContent.trim();
        durationSelect.dispatchEvent(new Event('change'));
      } else if (note && !note.value) {
        note.value = tr('Wybrany wariant: ' + czas + '.', 'Chosen option: ' + czas + '.');
      }
    }
  }

  // Voucher pages: ?kwota=320 (or "320 zł") preselects the amount dropdown.
  var amountSelect = document.getElementById('bk-amount');
  if (amountSelect) {
    var kw = (new URLSearchParams(window.location.search).get('kwota') || '').replace(/\D/g, '');
    if (kw && Array.prototype.some.call(amountSelect.options, function (o) { return o.value === kw; })) {
      amountSelect.value = kw;
    }
  }

  // "Rezerwacja" button on a service card - preselect that treatment
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-service]');
    if (!trigger || !serviceSelect) return;
    selectService(trigger.getAttribute('data-service'));
    if (status) { status.textContent = ''; status.className = 'form__status'; }
    // let the anchor do the scrolling, then put the cursor in the first field
    setTimeout(function () {
      var name = document.getElementById('bk-name');
      if (name) name.focus({ preventScroll: true });
    }, 600);
  });

  function say(text, ok) {
    if (!status) return;
    status.textContent = text;
    status.className = 'form__status ' + (ok ? 'form__status--ok' : 'form__status--err');
  }

  function summary(d) {
    var lines = [
      'Zabieg: ' + d.service,
      'Imię i nazwisko: ' + d.name,
      'Telefon: ' + d.phone
    ];
    if (d.email) lines.push('E-mail: ' + d.email);
    if (d.duration) lines.push('Długość: ' + d.duration);
    if (d.therapist) lines.push('Terapeuta: ' + d.therapist);
    if (d.date) lines.push('Preferowana data: ' + d.date);
    if (d.time) lines.push('Preferowana godzina: ' + d.time);
    if (d.note) lines.push('', 'Wiadomość:', d.note);
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var fd = new FormData(form);

      // The voucher pages ask for amount, format and recipient in their own
      // fields. The Worker and the sheet only know "note", so those go in
      // front of it - in Polish, because the studio reads them, and the
      // amount keeps the "na kwotę N zł" shape the sheet's Kwota column parses.
      var extra = [];
      var amt = (fd.get('amount') || '').trim();
      if (amt) extra.push(/^\d+$/.test(amt) ? 'Voucher upominkowy na kwotę ' + amt + ' zł.' : 'Kwota: ' + amt + '.');
      if (fd.get('format')) extra.push('Forma: ' + fd.get('format') + '.');
      if ((fd.get('recipient') || '').trim()) extra.push('Dla: ' + fd.get('recipient').trim() + '.');
      var userNote = (fd.get('note') || '').trim();
      var fullNote = extra.length ? extra.join('\n') + (userNote ? '\n\n' + userNote : '') : userNote;

      var data = {
        name: (fd.get('name') || '').trim(),
        phone: (fd.get('phone') || '').trim(),
        email: (fd.get('email') || '').trim(),
        service: fd.get('service') || '',
        duration: fd.get('duration') || '',
        therapist: fd.get('therapist') || '',
        date: fd.get('date') || '',
        time: fd.get('time') || '',
        note: fullNote,
        lang: EN ? 'en' : 'pl',
        // honeypot - hidden from people, so anything here means a bot
        company: (fd.get('company') || '').trim()
      };

      var button = form.querySelector('button[type="submit"]');

      // Hand the request to the visitor's mail client. This was the original
      // behaviour and is now also the safety net: if the endpoint is down, the
      // enquiry still has a way out instead of the visitor hitting a wall.
      function sendByMail(lead) {
        var subject = (EN ? '[EN] ' : '') + 'Rezerwacja: ' + data.service + ' - ' + data.name;
        window.location.href = 'mailto:' + STUDIO_EMAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(summary(data));
        say(lead + tr('Otworzyliśmy Twój program pocztowy z gotową wiadomością - wyślij ją, a my potwierdzimy termin. ' +
            'Jeśli okno się nie pojawiło, zadzwoń: +48 533 681 901.',
            'We opened your e-mail app with the message ready - send it and we will confirm the time. ' +
            'If nothing opened, message us on WhatsApp or call +48 533 681 901.'), true);
      }

      if (FORM_ENDPOINT) {
        if (button) { button.disabled = true; button.textContent = tr('Wysyłanie…', 'Sending…'); }
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          // Read the body either way - the endpoint explains itself in JSON,
          // and throwing that away is what made the first failure undiagnosable.
          return r.json().catch(function () { return null; }).then(function (payload) {
            return { ok: r.ok, status: r.status, payload: payload };
          });
        }).then(function (res) {
          if (res.ok && res.payload && res.payload.ok) {
            // The Worker confirmed Telegram accepted the message - a real lead
            track('generate_lead', leadParams(data));
            form.reset();
            say(tr('Dziękujemy! Zgłoszenie dotarło - odezwiemy się, żeby potwierdzić termin.',
                'Thank you! We have your request and will get back to you to confirm the time.'), true);
            return;
          }
          var reason = (res.payload && (res.payload.description || res.payload.error)) || ('HTTP ' + res.status);
          if (window.console) console.error('[rezerwacja] wysyłka nie powiodła się:', res.status, res.payload);
          track('booking_email_fallback', { service: data.service || 'nie_wybrano', failure_reason: String(reason).slice(0, 100) });
          sendByMail(tr('Nie udało się wysłać zgłoszenia ze strony (', 'The form could not be sent (') + reason + '). ');
        }).catch(function (err) {
          // Network failure, or something in the browser blocked the request.
          if (window.console) console.error('[rezerwacja] żądanie nie doszło:', err);
          track('booking_email_fallback', { service: data.service || 'nie_wybrano', failure_reason: 'network' });
          sendByMail(tr('Nie udało się połączyć z serwerem. ', 'Could not reach the server. '));
        }).then(function () {
          if (button) { button.disabled = false; button.textContent = tr('Wyślij zgłoszenie', 'Send request'); }
        });
        return;
      }

      sendByMail('');
    });
  }

  // Nothing in the past in the date picker
  var dateInput = document.getElementById('bk-date');
  if (dateInput) {
    var t = new Date();
    dateInput.min = t.getFullYear() + '-' +
      String(t.getMonth() + 1).padStart(2, '0') + '-' +
      String(t.getDate()).padStart(2, '0');
  }

  /* ---------------- 3D ring gallery ----------------
     The photos stand around a cylinder that turns slowly on its own. Drag or
     use the arrows to rotate, click a photo to open it large. Nine photos make
     a cramped ring, so they repeat until there are 24+ cards - the clones are hidden from
     assistive tech, and the counter always reports the real photo (1-9). */
  /* Specular header button: the light on the glass pill drifts toward the
     cursor while it moves anywhere over the header (clamped just past the
     pill's edges), and settles back to the top rim when the cursor leaves.
     The glide itself is a CSS transition on --mx / --my. */
  var cta = document.querySelector('.nav-cta');
  var headerEl = document.querySelector('.header');
  if (cta && headerEl && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    headerEl.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      if (!r.width) return;
      var x = Math.max(-15, Math.min(115, (e.clientX - r.left) / r.width * 100));
      var y = Math.max(-40, Math.min(140, (e.clientY - r.top) / r.height * 100));
      cta.style.setProperty('--mx', x.toFixed(1) + '%');
      cta.style.setProperty('--my', y.toFixed(1) + '%');
    });
    headerEl.addEventListener('pointerleave', function () {
      cta.style.removeProperty('--mx');
      cta.style.removeProperty('--my');
    });
  }

  /* ---------------- Team: chroma spotlight ----------------
     Each photo gets a colour copy on top of its black-and-white base, masked
     to a soft circle. One light travels a slow looping path over the whole
     grid, so colour sweeps from person to person; while the cursor is over
     the grid the light eases toward it instead. */
  var teamGrid = document.querySelector('.team-grid');
  if (teamGrid && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) (function () {
    var cards = Array.prototype.slice.call(teamGrid.querySelectorAll('.team-card'));
    var medias = [];
    cards.forEach(function (card) {
      var img = card.querySelector('img');
      if (!img) return;
      var wrap = document.createElement('div');
      wrap.className = 'team-card__media';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      img.classList.add('team-card__base');
      var color = img.cloneNode();
      color.className = 'team-card__color';
      color.alt = '';
      color.setAttribute('aria-hidden', 'true');
      wrap.appendChild(color);
      medias.push({ card: card, el: wrap });
    });
    if (!medias.length) return;
    teamGrid.classList.add('chroma');

    var lx = 0, ly = 0, mouse = null, visible = true, t0 = performance.now();
    teamGrid.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var g = teamGrid.getBoundingClientRect();
      mouse = { x: e.clientX - g.left, y: e.clientY - g.top };
    });
    teamGrid.addEventListener('pointerleave', function () { mouse = null; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(teamGrid);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      var g = teamGrid.getBoundingClientRect();
      var t = (now - t0) / 1000;
      // A slow Lissajous loop that covers the whole grid, rows included
      var tx = g.width * (0.5 + 0.48 * Math.sin(t * 0.55));
      var ty = g.height * (0.5 + 0.42 * Math.sin(t * 0.86 + 1.2));
      if (mouse) { tx = mouse.x; ty = mouse.y; }
      lx += (tx - lx) * (mouse ? 0.14 : 0.09);
      ly += (ty - ly) * (mouse ? 0.14 : 0.09);
      var r = Math.max(260, Math.min(480, g.width * 0.34));
      medias.forEach(function (m) {
        var b = m.el.getBoundingClientRect();
        var x = lx - (b.left - g.left), y = ly - (b.top - g.top);
        m.el.style.setProperty('--lx', x.toFixed(1) + 'px');
        m.el.style.setProperty('--ly', y.toFixed(1) + 'px');
        m.el.style.setProperty('--r', r.toFixed(0) + 'px');
        var dx = Math.max(0, Math.abs(x - b.width / 2) - b.width / 2);
        var dy = Math.max(0, Math.abs(y - b.height / 2) - b.height / 2);
        var glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (r * 0.6));
        m.card.style.setProperty('--glow', glow.toFixed(2));
        m.el.style.setProperty('--glow', glow.toFixed(2));
      });
    }
    requestAnimationFrame(frame);
  })();

  var ringEl = document.querySelector('[data-ring]');
  if (ringEl) (function () {
    var stage = ringEl.querySelector('.ring__stage');
    var inner = ringEl.querySelector('.ring__inner');
    var originals = Array.prototype.slice.call(inner.querySelectorAll('.ring__item'));
    var REAL = originals.length;
    if (!REAL) return;
    var copies = Math.max(1, Math.ceil(24 / REAL));
    for (var c = 1; c < copies; c++) {
      originals.forEach(function (fig) {
        var clone = fig.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelector('img').alt = '';
        inner.appendChild(clone);
      });
    }
    var items = Array.prototype.slice.call(inner.querySelectorAll('.ring__item'));
    var N = items.length, STEP = 360 / N;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nEl = ringEl.querySelector('[data-ring-n]');
    var capEl = ringEl.querySelector('[data-ring-cap]');
    var pauseBtn = ringEl.querySelector('[data-ring-pause]');
    var angle = 0, target = null, R = 900, front = -1;
    var paused = reduce, hovering = false, visible = true, dragging = false;
    var SPEED = 3; // degrees per second of auto-rotation

    ringEl.classList.add('is-3d');

    function layout() {
      var w = items[0].offsetWidth || 300;
      R = Math.round((w + 24) / (2 * Math.tan(Math.PI / N)));
      items.forEach(function (it, i) { it.dataset.base = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)'; });
      front = -1; render();
    }
    function mod(a, n) { return ((a % n) + n) % n; }
    function render() {
      inner.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + angle + 'deg)';
      var f = mod(Math.round(-angle / STEP), N);
      if (f === front) return;
      front = f;
      items.forEach(function (it, i) {
        var isFront = i === f;
        it.classList.toggle('is-front', isFront);
        it.style.transform = it.dataset.base + (isFront ? ' scale(1.08)' : '');
      });
      var real = f % REAL;
      if (nEl) nEl.textContent = (real + 1 < 10 ? '0' : '') + (real + 1);
      if (capEl) capEl.textContent = originals[real].querySelector('figcaption').textContent;
    }
    function snapTo(delta) {
      var base = Math.round(angle / STEP) * STEP;
      target = base - delta * STEP;
    }

    var last = performance.now();
    function tick(now) {
      var dt = Math.min(64, now - last) / 1000; last = now;
      if (target !== null) {
        var d = target - angle;
        if (Math.abs(d) < 0.05) { angle = target; target = null; }
        else angle += d * Math.min(1, dt * 7);
        render();
      } else if (!paused && !hovering && !dragging && visible && !document.hidden) {
        angle -= SPEED * dt;
        render();
      }
      requestAnimationFrame(tick);
    }

    // Drag to rotate. A press that barely moves is a click and opens the photo.
    var startX = 0, startAngle = 0, moved = 0, pressItem = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; target = null; moved = 0;
      startX = e.clientX; startAngle = angle;
      pressItem = e.target.closest('.ring__item');
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      angle = startAngle + dx * STEP / ((items[0].offsetWidth || 300) * 1.1);
      render();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (moved < 6 && pressItem) {
        openBox(items.indexOf(pressItem) % REAL);
      }
      snapTo(0);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('mouseenter', function () { hovering = true; });
    stage.addEventListener('mouseleave', function () { hovering = false; });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { snapTo(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { snapTo(-1); e.preventDefault(); }
      else if (e.key === 'Enter') { openBox(front % REAL); }
    });
    ringEl.querySelector('[data-ring-next]').addEventListener('click', function () { snapTo(1); });
    ringEl.querySelector('[data-ring-prev]').addEventListener('click', function () { snapTo(-1); });
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.setAttribute('aria-pressed', String(paused));
        pauseBtn.setAttribute('aria-label', paused ? 'Wznów obracanie' : 'Zatrzymaj obracanie');
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(stage);
    }
    window.addEventListener('resize', layout);

    // Lightbox
    var box = document.querySelector('[data-lbox]');
    var boxImg = box && box.querySelector('[data-lbox-img]');
    var boxCap = box && box.querySelector('[data-lbox-cap]');
    var boxIdx = 0, lastFocus = null;
    function showBox(k) {
      boxIdx = mod(k, REAL);
      var img = originals[boxIdx].querySelector('img');
      boxImg.src = img.currentSrc || img.src; boxImg.alt = img.alt;
      boxCap.textContent = originals[boxIdx].querySelector('figcaption').textContent;
    }
    function openBox(k) {
      if (!box) return;
      lastFocus = document.activeElement;
      showBox(k); box.hidden = false; document.body.style.overflow = 'hidden';
      box.querySelector('[data-lbox-close]').focus();
    }
    function closeBox() {
      box.hidden = true; document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    if (box) {
      box.querySelector('[data-lbox-close]').addEventListener('click', closeBox);
      box.querySelector('[data-lbox-prev]').addEventListener('click', function () { showBox(boxIdx - 1); });
      box.querySelector('[data-lbox-next]').addEventListener('click', function () { showBox(boxIdx + 1); });
      box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
      document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') closeBox();
        else if (e.key === 'ArrowRight') showBox(boxIdx + 1);
        else if (e.key === 'ArrowLeft') showBox(boxIdx - 1);
      });
    }

    layout();
    requestAnimationFrame(tick);
  })();

  // WhatsApp button, on every page. Built here rather than in the HTML so the
  // number and wording live in one place instead of 45 copies. The id doubles
  // as link_placement in the whatsapp_click event.
  var WHATSAPP = '48533681901';
  var wa = document.createElement('a');
  wa.id = 'whatsapp';
  wa.className = 'wa-float';
  wa.href = 'https://wa.me/' + WHATSAPP + '?text=' +
    encodeURIComponent(tr('Dzień dobry! Piszę ze strony Massage 4 You.', 'Hello! I am writing from the Massage 4 You website.'));
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.setAttribute('aria-label', tr('Napisz do nas na WhatsApp', 'Message us on WhatsApp'));
  wa.innerHTML = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M16.02 3C8.84 3 3 8.83 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A13 13 0 0 0 16.02 29C23.2 29 29 23.17 29 16S23.2 3 16.02 3Zm0 23.8c-1.95 0-3.86-.52-5.53-1.51l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.77 10.77 0 0 1 5.2 16c0-5.96 4.85-10.8 10.82-10.8 5.96 0 10.8 4.84 10.8 10.8 0 5.96-4.84 10.8-10.8 10.8Zm5.93-8.09c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.86-1.62-1.93-1.81-2.26-.19-.32-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.32.33-.54.11-.22.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.27-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.4-.3.33-1.14 1.12-1.14 2.72s1.17 3.15 1.33 3.37c.16.22 2.3 3.5 5.57 4.91.78.34 1.39.54 1.86.69.78.25 1.5.21 2.06.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.62-.38Z"/>' +
    '</svg>';
  document.body.appendChild(wa);

  // Current year in footer
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
