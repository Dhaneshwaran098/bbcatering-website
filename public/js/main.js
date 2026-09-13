// =========================================================
// MADURAI KOORAI KADAI — site interactions
// =========================================================
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.querySelector('.navbar');
  const backTop = document.querySelector('.back-top');
  const onScroll = () => {
    if (window.scrollY > 60) { navbar?.classList.add('scrolled'); }
    else { navbar?.classList.remove('scrolled'); }
    if (window.scrollY > 700) { backTop?.classList.add('show'); }
    else { backTop?.classList.remove('show'); }
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.mobile-panel');
  const overlay = document.querySelector('.mobile-overlay');
  const closeBtn = document.querySelector('.mobile-close');

  const openMenu = () => { toggle?.classList.add('open'); panel?.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { toggle?.classList.remove('open'); panel?.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  toggle?.addEventListener('click', () => { toggle.classList.contains('open') ? closeMenu() : openMenu(); });
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  panel?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Active nav link ---------- */
  /* Handled server-side (see views/partials/nav.ejs) so it always matches the real route. */

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el, i) => {
      el.style.setProperty('--i', el.closest('[data-stagger]') ? (i % 12) : 0);
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Menu category tabs ---------- */
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-inner .ph-photo');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  document.querySelectorAll('.g-item').forEach(item => {
    item.addEventListener('click', () => {
      const bg = item.querySelector('.ph-photo')?.style.backgroundImage;
      const caption = item.getAttribute('data-caption') || '';
      if (lightboxImg && bg) lightboxImg.style.backgroundImage = bg;
      if (lightboxCaption) lightboxCaption.textContent = caption;
      lightbox?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelector('.lightbox-close')?.addEventListener('click', () => {
    lightbox?.classList.remove('open'); document.body.style.overflow = '';
  });
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { lightbox?.classList.remove('open'); document.body.style.overflow = ''; closeMenu(); }
  });

  /* ---------- Enquiry form -> WhatsApp handoff ---------- */
  const form = document.getElementById('enquiry-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#name')?.value.trim() || '';
    const phone = form.querySelector('#phone')?.value.trim() || '';
    const eventType = form.querySelector('#event-type')?.value || '';
    const date = form.querySelector('#date')?.value || '';
    const guests = form.querySelector('#guests')?.value || '';
    const message = form.querySelector('#message')?.value.trim() || '';

    const success = document.querySelector('.form-success');
    if (success) { success.classList.add('show'); }
    if (typeof window.fireConfetti === 'function') window.fireConfetti();

    const text = `Hello, I'd like to enquire about catering.%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AEvent: ${encodeURIComponent(eventType)}%0ADate: ${encodeURIComponent(date)}%0AGuests: ${encodeURIComponent(guests)}%0AMessage: ${encodeURIComponent(message)}`;
    const waNumber = form.getAttribute('data-whatsapp') || '919876543210';
    const waLink = `https://wa.me/${waNumber}?text=${text}`;

    setTimeout(() => { window.open(waLink, '_blank'); }, 500);
    form.reset();
  });

  /* ---------- Luxury Preloader Dismissal ---------- */
  const preloader = document.getElementById('sitePreloader') || document.querySelector('.preloader');
  const dismissPreloader = () => {
    if (!preloader || preloader.classList.contains('loaded')) return;
    preloader.classList.add('loaded');
    setTimeout(() => {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 750);
  };

  if (document.readyState === 'complete') {
    setTimeout(dismissPreloader, 400);
  } else {
    window.addEventListener('load', () => {
      setTimeout(dismissPreloader, 400);
    });
  }
  // Fallback timer
  setTimeout(dismissPreloader, 1800);

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.querySelector('.scroll-progress');
  const updateProgress = () => {
    if (!progressBar) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const height = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    progressBar.style.width = pct + '%';
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Floating particles ---------- */
  document.querySelectorAll('.hero, .page-header').forEach(host => {
    const wrap = document.createElement('div');
    wrap.className = 'particles';
    const count = window.innerWidth < 640 ? 8 : 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const size = 3 + Math.random() * 5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      p.style.animationDuration = (10 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 14) + 's';
      wrap.appendChild(p);
    }
    host.prepend(wrap);
  });

  /* ---------- 3D tilt on cards ---------- */
  const isTouch = window.matchMedia('(hover: none)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll('.card, .why-item, .info-card').forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Testimonial carousel ---------- */
  const tSlides = document.querySelectorAll('.t-slide');
  const tDotsWrap = document.querySelector('.t-dots');
  if (tSlides.length) {
    let tIndex = 0;
    tSlides.forEach((s, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      dot.addEventListener('click', () => showSlide(i));
      tDotsWrap?.appendChild(dot);
    });
    const dots = tDotsWrap ? tDotsWrap.querySelectorAll('button') : [];
    function showSlide(i) {
      tSlides[tIndex].classList.remove('active');
      dots[tIndex]?.classList.remove('active');
      tIndex = i;
      tSlides[tIndex].classList.add('active');
      dots[tIndex]?.classList.add('active');
    }
    setInterval(() => { showSlide((tIndex + 1) % tSlides.length); }, 5500);
  }

  /* ---------- Gallery filters ---------- */
  const gFilters = document.querySelectorAll('.g-filter');
  const gItems = document.querySelectorAll('.g-item');
  gFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      gFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      gItems.forEach(item => {
        const match = cat === 'all' || item.getAttribute('data-category') === cat;
        item.classList.toggle('hide', !match);
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) { other.classList.remove('open'); other.querySelector('.faq-a').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Sticky mobile action bar ---------- */
  const mobileBar = document.querySelector('.mobile-actionbar');
  document.addEventListener('scroll', () => {
    if (!mobileBar) return;
    if (window.scrollY > 400) mobileBar.classList.add('show');
    else mobileBar.classList.remove('show');
  }, { passive: true });

  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  /* ---------- Luxury Magnetic Custom Cursor ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.innerHTML = '<span class="cursor-text">View</span>';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

      if (!isVisible) {
        isVisible = true;
        dot.classList.add('cursor-visible');
        ring.classList.add('cursor-visible');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isVisible = false;
      dot.classList.remove('cursor-visible');
      ring.classList.remove('cursor-visible');
    });

    document.addEventListener('mouseenter', () => {
      isVisible = true;
      dot.classList.add('cursor-visible');
      ring.classList.add('cursor-visible');
    });

    document.addEventListener('mousedown', () => ring.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => ring.classList.remove('cursor-click'));

    const renderRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderRing);
    };
    requestAnimationFrame(renderRing);

    const attachCursorEvents = () => {
      document.querySelectorAll('a, button, input, select, textarea, .faq-q, .menu-tab').forEach(el => {
        el.addEventListener('mouseenter', () => {
          ring.classList.add('cursor-hover');
          dot.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
          ring.classList.remove('cursor-hover');
          dot.classList.remove('cursor-hover');
        });
      });

      document.querySelectorAll('.g-item, .dish-card, .frame, .card-media, .why-item, .split-media, .info-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
          ring.classList.add('cursor-view');
          dot.classList.add('cursor-view');
        });
        el.addEventListener('mouseleave', () => {
          ring.classList.remove('cursor-view');
          dot.classList.remove('cursor-view');
        });
      });
    };
    attachCursorEvents();
  }

});

/* ---------- Confetti burst (global helper) ---------- */
window.fireConfetti = function () {
  const colors = ['#D96C2C', '#C99A3D', '#7A1F1F', '#FFF4E3'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    piece.style.animationDuration = (2 + Math.random() * 1.2) + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3800);
  }
};
