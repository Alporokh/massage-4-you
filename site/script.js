/* Massage4you — interactions */
(function () {

  /* ------------------------------------------------------------------
     Booking form delivery.
     Leave FORM_ENDPOINT empty and the form falls back to opening the
     visitor's mail client with the request pre-filled. Paste a Formspree /
     Getform / own-backend URL here and it will POST the fields as JSON
     instead — no other change needed.
  ------------------------------------------------------------------ */
  var FORM_ENDPOINT = '';
  var STUDIO_EMAIL = 'massage4youpoznan@gmail.com';

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
      // navigating away — there is no hover on a touch screen
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

  // Transparent over the hero, solid once the page scrolls — keeps the logo
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
    video.addEventListener('pause', function () {
      if (video.currentTime === 0 || video.ended) vid.classList.remove('is-playing');
    });
    video.addEventListener('ended', function () {
      vid.classList.remove('is-playing');
      video.controls = false;
      video.load();           // back to the poster frame
    });
  }

  /* ---------------- Gallery: parallax carousel ----------------
     The strip itself is plain CSS scroll-snap and works with this script
     switched off. What is added here is the parallax — each photo is 118%
     of its frame and slides against the scroll direction, so the images
     drift inside their frames instead of moving as flat tiles — plus the
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

    // Percent of the IMAGE's own width, which is 118% of the frame — so 7%
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
  }

  // "Rezerwacja" button on a service card — preselect that treatment
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
        note: (fd.get('note') || '').trim()
      };

      var button = form.querySelector('button[type="submit"]');

      if (FORM_ENDPOINT) {
        if (button) { button.disabled = true; button.textContent = 'Wysyłanie…'; }
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          say('Dziękujemy! Zgłoszenie dotarło — odezwiemy się, żeby potwierdzić termin.', true);
        }).catch(function () {
          say('Nie udało się wysłać formularza. Zadzwoń do nas: +48 533 681 901.', false);
        }).then(function () {
          if (button) { button.disabled = false; button.textContent = 'Wyślij zgłoszenie'; }
        });
        return;
      }

      // No endpoint configured — hand the request to the mail client.
      var subject = 'Rezerwacja: ' + data.service + ' — ' + data.name;
      window.location.href = 'mailto:' + STUDIO_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(summary(data));
      say('Otworzyliśmy Twój program pocztowy z gotową wiadomością — wyślij ją, a my potwierdzimy termin. ' +
          'Jeśli okno się nie pojawiło, zadzwoń: +48 533 681 901.', true);
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
