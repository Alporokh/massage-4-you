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
  /* ------------------------------------------------------------------
     GA4 events.
     Each page's <head> holds analytics_storage at denied until the cookie
     banner is accepted; until then Google receives these only as cookieless
     pings. No event carries the visitor's name, phone, email or message.
  ------------------------------------------------------------------ */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  // Lead value in PLN, copied from cennik.html on 2026-09-14 (single sessions
  // only, no packages). When a price changes on the cennik page, change it here.
  var PRICES = {
    'Masaż relaksacyjny całego ciała': { '60 min': 170, '80 min': 220, '90 min': 240, '120 min': 330 },
    'Masaż zdrowotny całego ciała': { '60 min': 190, '80 min': 240, '90 min': 270, '120 min': 370 },
    'Masaż tkanek głębokich': { '40 min': 140, '60 min': 190, '80 min': 250, '90 min': 270 },
    'Masaż sportowy': { '60 min': 190, '80 min': 230, '90 min': 270 },
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
    'Masaż dla dwojga relaksacyjny ciała + twarzy': { '120 min': 640, '140 min': 740 },
    'Masaż dla dwojga kamieniami gorącymi': { '60 min': 340, '80 min': 440 },
    'Masaż Kobido dla dwojga': { '60 min': 340, '75 min': 400 },
    'Masaż Kobido': { '60 min': 180, '75 min': 210 },
    'Masaż autorski skulpturalny twarzy': { '80 min': 250 },
    'Masaż mioplastyczny + transbukalny twarzy': { '60 min': 180 },
    'Masaż transbukalny twarzy': { '40 min': 120 },
    'Masaż karku + mioplastyczny twarzy': { '90 min': 250 },
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
    var params = { link_placement: area ? (area.id || area.tagName.toLowerCase()) : 'page' };

    if (href.indexOf('tel:') === 0) {
      track('phone_click', params);
    } else if (href.indexOf('mailto:') === 0 || href.indexOf('/cdn-cgi/l/email-protection') !== -1) {
      track('email_click', params);
    } else if (/(^|\.)booksy\.com$/.test(host)) {
      track('booksy_click', params);
    } else if (/(^|\.)instagram\.com$/.test(host)) {
      track('instagram_click', params);
    } else if (/(^|\.)facebook\.com$/.test(host)) {
      track('facebook_click', params);
    } else if (host === 'share.google' || host === 'g.page' || host === 'maps.app.goo.gl') {
      track('google_profile_click', params);
    } else if (href.indexOf('#rezerwacja') !== -1) {
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
      var target = document.getElementById('rezerwacja');
      if (target && window.location.hash !== '#rezerwacja') {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // voucher rows on the cennik page also carry the chosen amount
    var amount = params.get('kwota');
    var note = document.getElementById('bk-note');
    if (amount && note && !note.value) {
      note.value = 'Voucher upominkowy na kwotę ' + amount + '.';
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
        note.value = 'Wybrany wariant: ' + czas + '.';
      }
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
      var data = {
        name: (fd.get('name') || '').trim(),
        phone: (fd.get('phone') || '').trim(),
        email: (fd.get('email') || '').trim(),
        service: fd.get('service') || '',
        duration: fd.get('duration') || '',
        therapist: fd.get('therapist') || '',
        date: fd.get('date') || '',
        time: fd.get('time') || '',
        note: (fd.get('note') || '').trim(),
        // honeypot - hidden from people, so anything here means a bot
        company: (fd.get('company') || '').trim()
      };

      var button = form.querySelector('button[type="submit"]');

      // Hand the request to the visitor's mail client. This was the original
      // behaviour and is now also the safety net: if the endpoint is down, the
      // enquiry still has a way out instead of the visitor hitting a wall.
      function sendByMail(lead) {
        var subject = 'Rezerwacja: ' + data.service + ' - ' + data.name;
        window.location.href = 'mailto:' + STUDIO_EMAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(summary(data));
        say(lead + 'Otworzyliśmy Twój program pocztowy z gotową wiadomością - wyślij ją, a my potwierdzimy termin. ' +
            'Jeśli okno się nie pojawiło, zadzwoń: +48 533 681 901.', true);
      }

      if (FORM_ENDPOINT) {
        if (button) { button.disabled = true; button.textContent = 'Wysyłanie…'; }
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
            say('Dziękujemy! Zgłoszenie dotarło - odezwiemy się, żeby potwierdzić termin.', true);
            return;
          }
          var reason = (res.payload && (res.payload.description || res.payload.error)) || ('HTTP ' + res.status);
          if (window.console) console.error('[rezerwacja] wysyłka nie powiodła się:', res.status, res.payload);
          track('booking_email_fallback', { service: data.service || 'nie_wybrano', failure_reason: String(reason).slice(0, 100) });
          sendByMail('Nie udało się wysłać zgłoszenia ze strony (' + reason + '). ');
        }).catch(function (err) {
          // Network failure, or something in the browser blocked the request.
          if (window.console) console.error('[rezerwacja] żądanie nie doszło:', err);
          track('booking_email_fallback', { service: data.service || 'nie_wybrano', failure_reason: 'network' });
          sendByMail('Nie udało się połączyć z serwerem. ');
        }).then(function () {
          if (button) { button.disabled = false; button.textContent = 'Wyślij zgłoszenie'; }
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

  // Current year in footer
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
