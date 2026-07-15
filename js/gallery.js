/* ============================================================
   KKN Journey — gallery.js
   Lightbox & Gallery Interactions
   ============================================================ */

class Gallery {
  constructor() {
    this.lightbox     = document.getElementById('lightbox');
    this.lightboxImg  = document.getElementById('lightbox-img');
    this.lightboxTitle    = document.getElementById('lightbox-title');
    this.lightboxDay      = document.getElementById('lightbox-day');
    this.lightboxCategory = document.getElementById('lightbox-category');
    this.lightboxLocation = document.getElementById('lightbox-location');
    this.lightboxDescription = document.getElementById('lightbox-description');
    this.lightboxCounter  = document.getElementById('lightbox-counter');

    // Peek panels
    this.prevPeek     = document.getElementById('lightbox-prev-peek');
    this.nextPeek     = document.getElementById('lightbox-next-peek');
    this.prevPeekImg  = document.getElementById('lightbox-prev-peek-img');
    this.nextPeekImg  = document.getElementById('lightbox-next-peek-img');

    this.closeBtn = document.getElementById('lightbox-close');
    this.items    = Array.from(document.querySelectorAll('.gallery-item'));
    this.currentIndex = 0;

    if (!this.lightbox) return;
    this.init();
  }

  init() {
    // Open on gallery item click
    this.items.forEach((item, i) => {
      item.addEventListener('click', () => this.open(i));
    });

    // Close on backdrop or button
    this.closeBtn?.addEventListener('click', () => this.close());
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.close();
    });

    // Peek panel clicks → navigate
    this.prevPeek?.addEventListener('click', () => this.navigate(-1));
    this.nextPeek?.addEventListener('click', () => this.navigate(1));
    this.prevPeek?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.navigate(-1); });
    this.nextPeek?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.navigate(1); });

    // Keyboard arrows
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')      this.close();
      if (e.key === 'ArrowLeft')   this.navigate(-1);
      if (e.key === 'ArrowRight')  this.navigate(1);
    });

    // Touch swipe
    let touchStartX = 0;
    this.lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    this.lightbox.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) this.navigate(dx < 0 ? 1 : -1);
    });
  }

  open(index) {
    this.currentIndex = index;
    this.updateLightbox();
    this.lightbox.style.display = 'flex';
    this.lightbox.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.lightbox.style.opacity = '1';
        this.lightbox.classList.add('open');
      });
    });
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightbox.style.opacity = '0';
    this.lightbox.classList.remove('open');
    if (this.lightboxImg) this.lightboxImg.classList.remove('loaded');
    setTimeout(() => { this.lightbox.style.display = 'none'; }, 500);
    document.body.style.overflow = '';
  }

  navigate(dir) {
    this.currentIndex = (this.currentIndex + dir + this.items.length) % this.items.length;
    this.updateLightbox();
  }

  updateLightbox() {
    const n    = this.items.length;
    const cur  = this.items[this.currentIndex];
    const prev = this.items[(this.currentIndex - 1 + n) % n];
    const next = this.items[(this.currentIndex + 1) % n];

    // ——— Main image ———
    const curImg = cur.querySelector('.gallery-img');
    if (this.lightboxImg && curImg) {
      this.lightboxImg.classList.remove('loaded');
      setTimeout(() => {
        this.lightboxImg.src = curImg.src;
        this.lightboxImg.alt = curImg.alt || '';
        if (this.lightboxImg.complete) {
          this.lightboxImg.classList.add('loaded');
        } else {
          this.lightboxImg.onload = () => this.lightboxImg.classList.add('loaded');
        }
      }, 100);
    }

    // ——— Info pane ———
    if (this.lightboxTitle)       this.lightboxTitle.textContent       = cur.dataset.title       || '';
    if (this.lightboxDay)         this.lightboxDay.textContent         = cur.dataset.day          || '';
    if (this.lightboxCategory)    this.lightboxCategory.textContent    = cur.dataset.category     || '';
    if (this.lightboxLocation)    this.lightboxLocation.textContent    = `📍 ${cur.dataset.location || ''}`;
    if (this.lightboxDescription) this.lightboxDescription.textContent = cur.dataset.description  || '';
    if (this.lightboxCounter)     this.lightboxCounter.textContent     = `${this.currentIndex + 1} / ${n}`;

    // ——— Peek panels ———
    const prevImg = prev.querySelector('.gallery-img');
    const nextImg = next.querySelector('.gallery-img');
    if (this.prevPeekImg && prevImg) this.prevPeekImg.src = prevImg.src;
    if (this.nextPeekImg && nextImg) this.nextPeekImg.src = nextImg.src;
  }
}

window.Gallery = Gallery;
