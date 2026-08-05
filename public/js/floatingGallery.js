/* ============================================================
   KKN Journey — floatingGallery.js
   Wanda.net-style Floating Photo Canvas
   Mouse + Touch support
   ============================================================ */

class FloatingGallery {
  constructor() {
    this.section    = document.getElementById('gallery');
    this.wrapper    = document.getElementById('gallery-float-wrapper');
    this.canvas     = document.getElementById('gallery-float-canvas');
    this.popup      = document.getElementById('float-popup');
    this.popupImg   = document.getElementById('float-popup-img');
    this.popupTitle = document.getElementById('float-popup-title');
    this.popupDay   = document.getElementById('float-popup-day');
    this.popupCat   = document.getElementById('float-popup-cat');
    this.popupLoc   = document.getElementById('float-popup-loc');
    this.popupDesc  = document.getElementById('float-popup-desc');
    this.popupClose = document.getElementById('float-popup-close');

    if (!this.canvas) return;

    this.photos = Array.from(document.querySelectorAll('.float-photo'));

    // Normalised target position (0–1, centre = 0.5)
    this.mouseX   = 0.5;
    this.mouseY   = 0.5;
    // Smoothed current position
    this.currentX = 0.5;
    this.currentY = 0.5;

    this.isActive = false;
    this.rafId    = null;
    this.time     = 0;

    // How far (px) the canvas can pan in each axis
    this.panRangeX = 280;
    this.panRangeY = 160;

    // Touch tracking
    this._touchStartX  = 0;
    this._touchStartY  = 0;
    this._touchStartNX = 0.5; // normalised at touch start
    this._touchStartNY = 0.5;
    this._touchMoved   = false;
    this.TAP_THRESHOLD = 12; // px — below this = tap, above = drag

    // Per-photo idle drift params (randomised once)
    this.driftParams = this.photos.map(() => ({
      speed:     0.35 + Math.random() * 0.55,
      phase:     Math.random() * Math.PI * 2,
      amplitude: 4 + Math.random() * 8,
      axisY:     Math.random() > 0.5,
    }));

    this.init();
  }

  /* ─────────────────────────────────────────
     init — attach all event listeners
  ───────────────────────────────────────── */
  init() {
    const wrapper = this.wrapper || this.section;

    /* ── Mouse ── */
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      this.mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.mouseY = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
    });

    wrapper.addEventListener('mouseenter', () => {
      this.isActive = true;
      this.tick();
    });

    wrapper.addEventListener('mouseleave', () => {
      // Ease back to centre on mouse leave
      this.mouseX = 0.5;
      this.mouseY = 0.5;
    });

    /* ── Touch ── */
    wrapper.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      const rect = wrapper.getBoundingClientRect();

      this._touchStartX  = t.clientX;
      this._touchStartY  = t.clientY;
      this._touchStartNX = this.currentX; // keep current position
      this._touchStartNY = this.currentY;
      this._touchMoved   = false;

      this.isActive = true;
      this.tick();
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      const rect = wrapper.getBoundingClientRect();

      const dx = t.clientX - this._touchStartX;
      const dy = t.clientY - this._touchStartY;

      // Mark as drag if movement exceeds threshold
      if (Math.abs(dx) > this.TAP_THRESHOLD || Math.abs(dy) > this.TAP_THRESHOLD) {
        this._touchMoved = true;
      }

      // Convert drag delta into normalised position change
      // Dragging right → pan right (mouseX decreases → canvas shifts right)
      const sensitivity = 1.6; // feel factor — higher = more responsive
      const newX = this._touchStartNX - (dx / rect.width)  * sensitivity;
      const newY = this._touchStartNY - (dy / rect.height) * sensitivity;

      this.mouseX = Math.max(0, Math.min(1, newX));
      this.mouseY = Math.max(0, Math.min(1, newY));

      // Prevent page scroll while dragging the gallery
      if (this._touchMoved) e.preventDefault();
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
      if (!this._touchMoved) {
        // It was a tap — find which photo was tapped
        const t  = e.changedTouches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const photo = el?.closest('.float-photo');
        if (photo) this.openPopup(photo);
      }
      // On release, gently drift back toward centre
      this.mouseX = 0.5;
      this.mouseY = 0.5;
    }, { passive: true });

    /* ── Popup close handlers ── */
    this.popupClose?.addEventListener('click', () => this.closePopup());
    this.popup?.addEventListener('click', (e) => {
      if (e.target === this.popup) this.closePopup();
    });

    // Close popup on swipe-down on mobile
    let popupTouchY = 0;
    this.popup?.addEventListener('touchstart', (e) => {
      popupTouchY = e.touches[0].clientY;
    }, { passive: true });
    this.popup?.addEventListener('touchend', (e) => {
      const dy = e.changedTouches[0].clientY - popupTouchY;
      if (dy > 60) this.closePopup(); // swipe down to close
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closePopup();
    });

    /* ── Photo click (mouse) ── */
    this.photos.forEach((photo) => {
      photo.addEventListener('click', () => this.openPopup(photo));
    });

    /* ── Intersection Observer — pause when off-screen ── */
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        this.isActive = en.isIntersecting;
        if (this.isActive) this.tick();
      });
    }, { threshold: 0.05 });

    obs.observe(this.section);

    // Kick off immediately
    this.isActive = true;
    this.tick();
  }

  /* ─────────────────────────────────────────
     Animation loop
  ───────────────────────────────────────── */
  tick() {
    if (this.rafId) return; // already scheduled

    const loop = () => {
      this.time += 0.008;

      // Lerp toward target position (smoother on touch than mouse)
      const lerpFactor = 0.055;
      this.currentX += (this.mouseX - this.currentX) * lerpFactor;
      this.currentY += (this.mouseY - this.currentY) * lerpFactor;

      // Canvas pan offset
      const panX = (this.currentX - 0.5) * -this.panRangeX;
      const panY = (this.currentY - 0.5) * -this.panRangeY;

      this.canvas.style.transform = `translate(${panX}px, ${panY}px)`;

      // Per-photo idle drift + depth parallax
      this.photos.forEach((photo, i) => {
        const p = this.driftParams[i];
        const drift  = Math.sin(this.time * p.speed + p.phase) * p.amplitude;
        const driftX = p.axisY ? 0 : drift;
        const driftY = p.axisY ? drift : 0;

        const depth  = parseFloat(photo.dataset.depth || '1');
        const extraX = panX * (depth - 1) * 0.25;
        const extraY = panY * (depth - 1) * 0.25;

        photo.style.transform = `translate(${driftX + extraX}px, ${driftY + extraY}px)`;
      });

      this.rafId = this.isActive ? requestAnimationFrame(loop) : null;
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /* ─────────────────────────────────────────
     Popup open / close
  ───────────────────────────────────────── */
  openPopup(photo) {
    const img = photo.querySelector('.float-photo-img');
    if (!img || !this.popup) return;

    this.popupImg.src           = img.src;
    this.popupImg.alt           = img.alt || '';
    this.popupTitle.textContent = photo.dataset.title       || '';
    this.popupDay.textContent   = photo.dataset.day         || '';
    this.popupCat.textContent   = photo.dataset.category    || '';
    this.popupLoc.textContent   = `📍 ${photo.dataset.location || ''}`;
    this.popupDesc.textContent  = photo.dataset.description || '';

    this.popup.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.popup.classList.add('open');
    }));
    document.body.style.overflow = 'hidden';
  }

  closePopup() {
    if (!this.popup) return;
    this.popup.classList.remove('open');
    setTimeout(() => { this.popup.style.display = 'none'; }, 420);
    document.body.style.overflow = '';
  }
}

window.FloatingGallery = FloatingGallery;
