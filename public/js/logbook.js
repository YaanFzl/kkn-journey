/* ============================================================
   KKN Journey — logbook.js
   Full-screen Journal Overlay Controller
   ============================================================ */

class LogbookController {
  constructor() {
    this.overlay    = document.getElementById('logbook-overlay');
    this.closeBtn   = document.getElementById('logbook-close');
    this.prevBtn    = document.getElementById('logbook-prev');
    this.nextBtn    = document.getElementById('logbook-next');
    this.romanEl    = document.getElementById('logbook-roman');
    this.titleEl    = document.getElementById('logbook-title');
    this.rangeEl    = document.getElementById('logbook-range');
    this.prevLabel  = document.getElementById('logbook-prev-label');
    this.nextLabel  = document.getElementById('logbook-next-label');
    this.pageCurEl  = document.getElementById('logbook-page-current');
    this.weekPanels = document.querySelectorAll('.logbook-week-content');
    this.scrollArea = this.overlay?.querySelector('.logbook-journal-scroll');
    this.openBtns   = document.querySelectorAll('.btn-open-logbook');
    this.currentWeek = 0;

    // Week metadata (synced with Timeline.astro data)
    this.weeks = [
      { roman: 'I',   title: 'Kedatangan & Orientasi',       range: '13 — 19 Juli 2026' },
      { roman: 'II',  title: 'Edukasi & Sosialisasi',        range: '20 — 26 Juli 2026' },
      { roman: 'III', title: 'Mangrove, UMKM & Lingkungan',  range: '27 Jul — 2 Agust 2026' },
      { roman: 'IV',  title: 'Gelar Karya & Pamitan',        range: '3 — 15 Agustus 2026' },
    ];

    if (!this.overlay) return;
    this.init();
  }

  init() {
    // Open overlay from week cards
    this.openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const weekIdx = parseInt(btn.dataset.week, 10);
        this.open(weekIdx);
      });
    });

    // Close
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay.querySelector('.logbook-backdrop')?.addEventListener('click', () => this.close());

    // Navigation
    this.prevBtn?.addEventListener('click', () => this.navigate(-1));
    this.nextBtn?.addEventListener('click', () => this.navigate(1));

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('open')) return;
      if (e.key === 'Escape')     this.close();
      if (e.key === 'ArrowLeft')  this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });

    // Gallery bridge buttons
    this.overlay.querySelectorAll('.btn-view-gallery').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.dataset.galleryDate;
        this.close();
        setTimeout(() => this.scrollToGalleryPhoto(date), 500);
      });
    });

    // Epilogue link button to Gallery
    const epilogueBtn = document.getElementById('btn-epilogue-gallery');
    epilogueBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
      setTimeout(() => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    });

    // Touch swipe on journal
    let touchStartX = 0;
    const journal = this.overlay.querySelector('.logbook-journal');
    if (journal) {
      journal.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      journal.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 60) this.navigate(dx < 0 ? 1 : -1);
      });
    }
  }

  open(weekIdx) {
    this.currentWeek = weekIdx;
    this.updateContent();
    this.overlay.style.display = 'flex';
    // Force reflow for animation
    this.overlay.offsetHeight;
    this.overlay.classList.add('open');
    this.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 450);
    document.body.style.overflow = '';
  }

  navigate(dir) {
    const nextIdx = this.currentWeek + dir;
    if (nextIdx < 0 || nextIdx >= this.weeks.length) return;
    
    // Animate content transition
    const journal = this.overlay.querySelector('.logbook-journal');
    journal.classList.add('logbook-transitioning');
    
    setTimeout(() => {
      this.currentWeek = nextIdx;
      this.updateContent();
      journal.classList.remove('logbook-transitioning');
    }, 200);
  }

  updateContent() {
    const w = this.weeks[this.currentWeek];
    const n = this.weeks.length;

    // Update header
    if (this.romanEl) this.romanEl.textContent = w.roman;
    if (this.titleEl) this.titleEl.textContent = w.title;
    if (this.rangeEl) this.rangeEl.textContent = w.range;
    if (this.pageCurEl) this.pageCurEl.textContent = this.currentWeek + 1;

    // Show active week content, hide others
    this.weekPanels.forEach((panel, i) => {
      panel.classList.toggle('active', i === this.currentWeek);
    });

    // Scroll to top
    if (this.scrollArea) this.scrollArea.scrollTop = 0;

    // Update navigation
    const hasPrev = this.currentWeek > 0;
    const hasNext = this.currentWeek < n - 1;

    if (this.prevBtn) {
      this.prevBtn.disabled = !hasPrev;
      this.prevBtn.style.visibility = hasPrev ? 'visible' : 'hidden';
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = !hasNext;
      this.nextBtn.style.visibility = hasNext ? 'visible' : 'hidden';
    }
    if (this.prevLabel && hasPrev) {
      this.prevLabel.textContent = `Minggu ${this.weeks[this.currentWeek - 1].roman}`;
    }
    if (this.nextLabel && hasNext) {
      this.nextLabel.textContent = `Minggu ${this.weeks[this.currentWeek + 1].roman}`;
    }
  }

  scrollToGalleryPhoto(date) {
    const galleryItem = document.querySelector(`.gallery-item[data-date="${date}"]`);
    if (galleryItem) {
      galleryItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        galleryItem.classList.add('gallery-item-highlight');
        setTimeout(() => galleryItem.classList.remove('gallery-item-highlight'), 1500);
        galleryItem.click();
      }, 900);
    } else {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

window.LogbookController = LogbookController;
