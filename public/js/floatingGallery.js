/* ============================================================
   KKN Journey — floatingGallery.js
   Wanda.net-style Floating Photo Canvas
   ============================================================ */

class FloatingGallery {
  constructor() {
    this.section    = document.getElementById('gallery');
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
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.currentX = 0.5;
    this.currentY = 0.5;
    this.isActive = false;
    this.rafId    = null;
    this.time     = 0;

    // Virtual canvas dimensions (how much the canvas can pan)
    this.panRangeX = 320;
    this.panRangeY = 180;

    // Per-photo drift params
    this.driftParams = this.photos.map((_, i) => ({
      speed:     0.4 + Math.random() * 0.6,
      phase:     Math.random() * Math.PI * 2,
      amplitude: 4 + Math.random() * 8,
      axisY:     Math.random() > 0.5,
    }));

    this.init();
  }

  init() {
    // Track mouse within the section
    this.section.addEventListener('mousemove', (e) => {
      const rect = this.section.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top)  / rect.height;
    });

    // Pointer enters/leaves section
    this.section.addEventListener('mouseenter', () => {
      this.isActive = true;
      if (!this.rafId) this.tick();
    });

    this.section.addEventListener('mouseleave', () => {
      // Slowly drift back to center
      this.mouseX = 0.5;
      this.mouseY = 0.5;
    });

    // Start idle animation
    this.isActive = true;
    this.tick();

    // Photo click → popup
    this.photos.forEach((photo) => {
      photo.addEventListener('click', () => this.openPopup(photo));
    });

    // Close popup
    this.popupClose?.addEventListener('click', () => this.closePopup());
    this.popup?.addEventListener('click', (e) => {
      if (e.target === this.popup) this.closePopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closePopup();
    });

    // Intersection observer — only animate when visible
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        this.isActive = en.isIntersecting;
        if (this.isActive && !this.rafId) this.tick();
      });
    }, { threshold: 0.1 });
    obs.observe(this.section);
  }

  tick() {
    if (this.rafId) return; // already running
    const loop = () => {
      this.time += 0.008;

      // Smooth cursor follow (lerp)
      const lerpFactor = 0.045;
      this.currentX += (this.mouseX - this.currentX) * lerpFactor;
      this.currentY += (this.mouseY - this.currentY) * lerpFactor;

      // Pan offset — centre is 0.5, offset from -panRange/2 to +panRange/2
      const panX = (this.currentX - 0.5) * -this.panRangeX;
      const panY = (this.currentY - 0.5) * -this.panRangeY;

      // Apply to canvas
      this.canvas.style.transform = `translate(${panX}px, ${panY}px)`;

      // Per-photo idle drift + depth parallax
      this.photos.forEach((photo, i) => {
        const p = this.driftParams[i];
        const drift = Math.sin(this.time * p.speed + p.phase) * p.amplitude;
        const driftX = p.axisY ? 0 : drift;
        const driftY = p.axisY ? drift : 0;

        const depth  = parseFloat(photo.dataset.depth || '1');
        const extraX = panX * (depth - 1) * 0.3;
        const extraY = panY * (depth - 1) * 0.3;

        photo.style.transform = `translate(${driftX + extraX}px, ${driftY + extraY}px)`;
      });

      if (this.isActive) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }


  openPopup(photo) {
    const img   = photo.querySelector('.float-photo-img');
    if (!img || !this.popup) return;

    this.popupImg.src            = img.src;
    this.popupImg.alt            = img.alt || '';
    this.popupTitle.textContent  = photo.dataset.title    || '';
    this.popupDay.textContent    = photo.dataset.day      || '';
    this.popupCat.textContent    = photo.dataset.category || '';
    this.popupLoc.textContent    = `📍 ${photo.dataset.location || ''}`;
    this.popupDesc.textContent   = photo.dataset.description || '';

    this.popup.style.display     = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.popup.classList.add('open');
      });
    });
    document.body.style.overflow = 'hidden';
  }

  closePopup() {
    if (!this.popup) return;
    this.popup.classList.remove('open');
    setTimeout(() => {
      this.popup.style.display = 'none';
    }, 420);
    document.body.style.overflow = '';
  }
}

window.FloatingGallery = FloatingGallery;
