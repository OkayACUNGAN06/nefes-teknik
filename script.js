/* =========================================================
   NEFES TEKNİK – script.js
   ScrollSpy • Canlı çalışma saati • WhatsApp formu • Animasyonlar
   ========================================================= */
(() => {
  'use strict';

  const WA_NUMBER = '905323624074';
  const OPEN_MIN = 9 * 60;   // 09:00
  const CLOSE_MIN = 19 * 60; // 19:00
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  };

  /* ---------- 1. Canlı Çalışma Saati Rozeti ----------
     Saat, ziyaretçinin bulunduğu yerden bağımsız olarak
     İzmir (Europe/Istanbul) saat dilimine göre hesaplanır. */
  const statusBadge = $('#status-badge');
  const statusText = $('#status-text');

  const getIstanbulMinutes = () => {
    try {
      const parts = new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
      const m = Number(parts.find((p) => p.type === 'minute').value);
      return h * 60 + m;
    } catch {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  };

  const updateStatus = () => {
    if (!statusBadge || !statusText) return;
    const mins = getIstanbulMinutes();
    const isOpen = mins >= OPEN_MIN && mins < CLOSE_MIN;

    statusBadge.classList.toggle('is-open', isOpen);
    statusBadge.classList.toggle('is-closed', !isOpen);
    statusText.textContent = isOpen
      ? 'Şu An Açık • Servis Kaydı Alınıyor (09:00 - 19:00)'
      : "Şu An Kapalı • WhatsApp'tan Arıza Kaydı Bırakabilirsiniz (Açılış: 09:00)";
  };

  updateStatus();
  setInterval(updateStatus, 30_000);

  /* ---------- 2. Navbar: kaydırma durumu ---------- */
  const navbar = $('#navbar');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navbar?.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Mobil Menü ---------- */
  const menuToggle = $('#menu-toggle');
  const navLinksEl = $('#nav-links');

  const setMenu = (open) => {
    if (!menuToggle || !navLinksEl) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    navLinksEl.classList.toggle('is-open', open);
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  navLinksEl?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinksEl?.classList.contains('is-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!navLinksEl?.classList.contains('is-open')) return;
    if (!e.target.closest('#nav-links') && !e.target.closest('#menu-toggle')) setMenu(false);
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- 4. ScrollSpy (IntersectionObserver) ---------- */
  const navLinks = $$('.nav-link');
  const linkById = new Map(
    navLinks.map((link) => [link.getAttribute('href').slice(1), link])
  );

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const active = link === linkById.get(id);
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    // Bölüm, ekranın orta bandına girdiğinde aktif kabul edilir
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    linkById.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- 5. Kaydırınca Görünme (Reveal) ---------- */
  const revealEls = $$('.reveal');

  // Aynı kapsayıcıdaki öğelere kademeli gecikme
  revealEls.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const index = siblings.indexOf(el);
    if (index > 0) el.style.setProperty('--d', `${Math.min(index, 6) * 90}ms`);
  });

  const finishReveal = (el) => {
    // Animasyon bitince bileşenin kendi hover geçişlerini geri ver
    el.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'opacity') return;
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--d');
      el.removeEventListener('transitionend', handler);
    });
  };

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          finishReveal(entry.target);
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.remove('reveal'));
  }

  /* ---------- 6. İstatistik Sayaçları ---------- */
  const counters = $$('.counter');
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = Number(el.dataset.decimals || 0);
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (counters.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  }

  /* ---------- 7. WhatsApp Hızlı Arıza Kayıt Formu ---------- */
  const form = $('#wa-form');
  const nameInput = $('#form-name');
  const deviceSelect = $('#form-device');
  const detailInput = $('#form-detail');

  const supportsUserInvalid = (() => {
    try { return CSS.supports('selector(:user-invalid)'); } catch { return false; }
  })();

  const rules = [
    { el: nameInput, test: (v) => v.trim().length >= 3 },
    { el: deviceSelect, test: (v) => v !== '' },
    { el: detailInput, test: (v) => v.trim().length >= 5 }
  ];

  const setFieldState = (el, valid) => {
    const field = el.closest('.field');
    field?.classList.toggle('is-invalid', !valid);
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');
  };

  // Etkileşim sonrası doğrulama: alan yalnızca kullanıcı değiştirdikten sonra
  // hata gösterir (:user-invalid davranışı) ve aria-invalid görsel durumla senkron kalır.
  rules.forEach(({ el, test }) => {
    if (!el) return;
    const markDirty = () => { el.dataset.dirty = '1'; };
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);

    el.addEventListener('blur', () => {
      if (!el.dataset.dirty) return;
      const valid = test(el.value) && !(supportsUserInvalid && el.matches(':user-invalid'));
      setFieldState(el, valid);
    });

    const clearIfValid = () => {
      if (el.getAttribute('aria-invalid') === 'true' && test(el.value)) setFieldState(el, true);
    };
    el.addEventListener('input', clearIfValid);
    el.addEventListener('change', clearIfValid);
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    rules.forEach(({ el, test }) => {
      const valid = test(el.value);
      setFieldState(el, valid);
      if (!valid && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      showToast('Lütfen işaretli alanları doldurun.');
      return;
    }

    const message = [
      'Merhaba Nefes Teknik, web siteniz üzerinden servis talebi oluşturmak istiyorum.',
      '',
      `👤 Ad Soyad: ${nameInput.value.trim()}`,
      `🔧 Cihaz Türü: ${deviceSelect.value}`,
      `📝 Arıza Detayı: ${detailInput.value.trim()}`,
      '',
      'Uygun olduğunuzda dönüş yapabilir misiniz? Teşekkürler.'
    ].join('\n');

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

    showToast('WhatsApp açılıyor… Mesajınız hazır!');
    const win = window.open(url, '_blank');
    if (win) {
      win.opener = null;
    } else {
      // Açılır pencere engellendiyse aynı sekmede yönlendir
      window.location.href = url;
    }

    form.reset();
    rules.forEach(({ el }) => {
      el.closest('.field')?.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      delete el.dataset.dirty;
    });
  });

  /* ---------- 8. Hizmet kartından form ön seçimi ---------- */
  $$('.service-card__link[data-device]').forEach((link) => {
    link.addEventListener('click', () => {
      const device = link.dataset.device;
      if (deviceSelect && [...deviceSelect.options].some((o) => o.value === device)) {
        deviceSelect.value = device;
        setFieldState(deviceSelect, true);
      }
      if (form) {
        form.classList.remove('is-highlight');
        // Kaydırma tamamlandıktan sonra formu vurgula
        setTimeout(() => {
          form.classList.add('is-highlight');
          form.addEventListener('animationend', () => form.classList.remove('is-highlight'), { once: true });
        }, prefersReducedMotion ? 0 : 700);
      }
    });
  });

  /* ---------- 9. Footer yılı ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
