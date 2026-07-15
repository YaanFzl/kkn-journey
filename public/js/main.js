/* ============================================================
   KKN Journey — main.js
   Entry Point & Initialization
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ——— Loading Screen ——— */
  const loadingScreen = document.getElementById('loading-screen');
  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }, 2000);
  document.body.style.overflow = 'hidden';

  /* ——— Custom Cursor ——— */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let cursorX = 0, cursorY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (dot) {
      dot.style.left = cursorX + 'px';
      dot.style.top  = cursorY + 'px';
    }
  });

  // Smooth ring follow
  function animateCursor() {
    ringX += (cursorX - ringX) * 0.12;
    ringY += (cursorY - ringY) * 0.12;
    if (ring) {
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Cursor hover effect on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .gallery-item, .week-card, .impact-card, .glass-card');
  hoverEls.forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  /* ——— Particle System ——— */
  if (window.ParticleSystem) {
    new window.ParticleSystem('canvas-particles');
  }

  /* ——— Cursor Trail ——— */
  if (window.CursorTrail) {
    new window.CursorTrail();
  }

  /* ——— Scroll Controller ——— */
  if (window.ScrollController) {
    new window.ScrollController();
  }

  /* ——— Gallery ——— */
  if (window.Gallery) {
    new window.Gallery();
  }

  /* ——— Navigation ——— */
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  navToggle?.addEventListener('click', () => {
    mobileNav?.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav?.classList.remove('open');
    });
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ——— Active nav link highlight ——— */
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const sectionEls = document.querySelectorAll('section[id]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
        active?.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sectionEls.forEach((s) => sectionObserver.observe(s));

  /* ——— Week card expand on click (mobile) ——— */
  document.querySelectorAll('.week-card').forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });

  /* ——— Typewriter effect on hero subtitle ——— */
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const texts = [
      'Satu Bulan. Satu Desa. Seribu Cerita.',
      'Bukan sekadar program, ini perjalanan jiwa.',
      'Dari kampus ke desa, dari teori ke nyata.',
    ];
    let tIdx = 0;
    let cIdx = 0;
    let deleting = false;
    let timeout;

    function type() {
      const current = texts[tIdx];
      if (!deleting) {
        typingEl.textContent = current.slice(0, ++cIdx);
        if (cIdx === current.length) {
          deleting = true;
          timeout = setTimeout(type, 2500);
          return;
        }
      } else {
        typingEl.textContent = current.slice(0, --cIdx);
        if (cIdx === 0) {
          deleting = false;
          tIdx = (tIdx + 1) % texts.length;
        }
      }
      timeout = setTimeout(type, deleting ? 40 : 70);
    }

    // Start after hero loads
    setTimeout(type, 3000);
  }

  /* ——— Image loaded fade-in (.gallery-img & .week-img) ——— */
  document.querySelectorAll('.gallery-img, .week-img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.add('loaded')); // fallback
    }
  });

  /* ——— Parallax on about image ——— */
  const aboutImg = document.querySelector('.about-image');
  if (aboutImg) {
    window.addEventListener('scroll', () => {
      const rect = aboutImg.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const offset = (window.innerHeight / 2 - rect.top) * 0.06;
        aboutImg.style.transform = `translateY(${offset}px)`;
      }
    }, { passive: true });
  }

  console.log('%c🌿 KKN Journey — Loaded', 'color:#8DBE6A;font-size:14px;font-weight:bold;');
});
