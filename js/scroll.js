/* ============================================================
   KKN Journey — scroll.js
   Parallax, Intersection Observer, Section Color Shifts
   ============================================================ */

class ScrollController {
  constructor() {
    this.heroBg = document.querySelector('.hero-bg');
    this.progressBar = document.getElementById('scroll-progress');
    this.navbar = document.getElementById('navbar');
    this.sections = document.querySelectorAll('section[id]');
    this.revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    this.impactBars = document.querySelectorAll('.impact-bar-fill');
    this.statNums = document.querySelectorAll('[data-count]');
    this.countedStats = new Set();
    this.countedBars = new Set();

    this.init();
  }

  init() {
    this.setupRevealObserver();
    this.setupImpactObserver();
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll(); // run once
  }

  onScroll() {
    const scrollY = window.scrollY;
    const docH = document.body.scrollHeight - window.innerHeight;

    // Progress bar
    if (this.progressBar) {
      const pct = Math.min((scrollY / docH) * 100, 100);
      this.progressBar.style.width = pct + '%';
    }

    // Navbar state
    if (this.navbar) {
      this.navbar.classList.toggle('scrolled', scrollY > 60);
    }

    // Hero parallax
    if (this.heroBg && scrollY < window.innerHeight) {
      const speed = scrollY * 0.4;
      this.heroBg.style.transform = `translateY(${speed}px) scale(1.05)`;
    }
  }

  setupRevealObserver() {
    const options = {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    this.revealEls.forEach((el) => observer.observe(el));
  }

  setupImpactObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Animate progress bars
        if (entry.target.classList.contains('impact-bar-fill')) {
          if (!this.countedBars.has(entry.target)) {
            this.countedBars.add(entry.target);
            const target = entry.target.dataset.width || '0';
            requestAnimationFrame(() => {
              entry.target.style.width = target + '%';
            });
            observer.unobserve(entry.target);
          }
        }

        // Animate counters
        if (entry.target.hasAttribute('data-count')) {
          if (!this.countedStats.has(entry.target)) {
            this.countedStats.add(entry.target);
            this.animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.2 });

    this.impactBars.forEach((el) => observer.observe(el));
    this.statNums.forEach((el) => observer.observe(el));
  }

  animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}

window.ScrollController = ScrollController;
