/* ============================================================
   KKN Journey — carousel.js
   Drag/swipe carousel for Bab IV impact cards
   ============================================================ */

class ImpactCarousel {
  constructor() {
    this.wrap   = document.getElementById('impact-carousel-wrap');
    this.track  = document.getElementById('impact-carousel-track');
    this.dots   = Array.from(document.querySelectorAll('.carousel-dot'));
    this.hint   = document.getElementById('carousel-drag-hint');

    if (!this.track) return;

    this.cards      = Array.from(this.track.querySelectorAll('.impact-card'));
    this.total      = this.cards.length;
    this.current    = 0;
    this.startX     = 0;
    this.startY     = 0;
    this.dragDelta  = 0;
    this.isDragging = false;
    this.isLocked   = false;   // axis lock (horizontal vs vertical scroll)
    this.velocity   = 0;
    this.lastX      = 0;
    this.rafId      = null;

    this.SNAP_THRESHOLD = 60;   // px drag needed to advance
    this.VELOCITY_THRESHOLD = 0.4;

    this.init();
  }

  init() {
    /* ── Mouse drag ── */
    this.track.addEventListener('mousedown',  (e) => this.onDragStart(e.clientX, e.clientY));
    window.addEventListener('mousemove',      (e) => this.onDragMove(e.clientX, e.clientY));
    window.addEventListener('mouseup',        ()  => this.onDragEnd());

    /* ── Touch drag ── */
    this.track.addEventListener('touchstart', (e) => {
      this.onDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    this.track.addEventListener('touchmove', (e) => {
      this.onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      // only prevent if dragging horizontally
      if (this.isDragging && !this.isLocked) e.preventDefault();
    }, { passive: false });

    this.track.addEventListener('touchend', () => this.onDragEnd(), { passive: true });

    /* ── Dot navigation ── */
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });

    /* ── Keyboard ── */
    this.wrap?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  this.goTo(this.current - 1);
      if (e.key === 'ArrowRight') this.goTo(this.current + 1);
    });

    /* ── Hide hint after first drag ── */
    this.track.addEventListener('mousedown', () => this.hideHint(), { once: true });
    this.track.addEventListener('touchstart', () => this.hideHint(), { once: true });

    // Initial render
    this.renderCards(0);
    this.updateDots();
  }

  hideHint() {
    if (this.hint) {
      this.hint.style.opacity = '0';
      setTimeout(() => { if (this.hint) this.hint.style.display = 'none'; }, 500);
    }
  }

  /* ─────── Drag lifecycle ─────── */
  onDragStart(x, y) {
    this.startX    = x;
    this.startY    = y;
    this.lastX     = x;
    this.dragDelta = 0;
    this.isDragging = true;
    this.isLocked   = false;
    this.velocity   = 0;
    this.track.style.cursor = 'grabbing';
    cancelAnimationFrame(this.rafId);
  }

  onDragMove(x, y) {
    if (!this.isDragging) return;

    const dx = x - this.startX;
    const dy = y - this.startY;

    // Lock axis on first significant movement
    if (!this.isLocked && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      this.isLocked = true;
      // If more vertical → treat as page scroll, cancel drag
      if (Math.abs(dy) > Math.abs(dx)) {
        this.isDragging = false;
        this.track.style.cursor = '';
        return;
      }
    }

    this.velocity   = x - this.lastX;
    this.lastX      = x;
    this.dragDelta  = dx;

    this.renderCards(dx);
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.cursor = '';

    const shouldAdvance = Math.abs(this.dragDelta) > this.SNAP_THRESHOLD
                       || Math.abs(this.velocity) > this.VELOCITY_THRESHOLD;

    if (shouldAdvance) {
      if (this.dragDelta < 0) this.goTo(this.current + 1);
      else                    this.goTo(this.current - 1);
    } else {
      // Snap back
      this.goTo(this.current);
    }
  }

  /* ─────── Navigation ─────── */
  goTo(index) {
    this.current = Math.max(0, Math.min(this.total - 1, index));
    this.dragDelta = 0;
    this.renderCards(0, true);
    this.updateDots();
  }

  /* ─────── Render ─────── */
  renderCards(dragOffset = 0, animate = false) {
    const n = this.total;

    this.cards.forEach((card, i) => {
      const rel      = i - this.current;        // position relative to current
      const rawDrag  = dragOffset / 380;        // normalise drag
      const pos      = rel - rawDrag;           // effective position

      // How far from center (0 = active, ±1 = adjacent, ±2 = behind…)
      const absPos   = Math.abs(pos);
      const sign     = pos < 0 ? -1 : 1;

      // Visibility cap — only render ±2 cards
      const visible  = absPos < 2.6;
      card.style.display = visible ? '' : 'none';
      if (!visible) return;

      /* Transform values */
      const translateX = pos * 88;             // px spacing between cards
      const translateY = absPos * 12;          // stack depth (lower = closer)
      const scale      = 1 - absPos * 0.08;   // shrink neighbours
      const rotateY    = pos * -3;             // slight 3D tilt
      const opacity    = Math.max(0.25, 1 - absPos * 0.35);
      const zIndex     = 10 - Math.round(absPos * 3);

      const transitionStr = animate
        ? 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1), opacity 0.45s ease'
        : 'none';

      card.style.transition = transitionStr;
      card.style.transform  = `
        translateX(${translateX}%)
        translateY(${translateY}px)
        scale(${scale})
        rotateY(${rotateY}deg)
      `;
      card.style.opacity    = String(opacity);
      card.style.zIndex     = String(zIndex);
      card.style.pointerEvents = absPos < 0.5 ? 'auto' : 'none';
      card.classList.toggle('is-active', absPos < 0.5);
    });
  }

  updateDots() {
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.current);
      dot.setAttribute('aria-selected', i === this.current ? 'true' : 'false');
    });
  }
}

window.ImpactCarousel = ImpactCarousel;
