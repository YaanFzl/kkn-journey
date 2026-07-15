/* ============================================================
   KKN Journey — particles.js
   Canvas-based Particle System
   ============================================================ */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.animFrameId = null;

    this.config = {
      count: 80,
      colors: [
        'rgba(168, 196, 212, 0.6)',   // mist/foggy blue
        'rgba(122, 158, 106, 0.55)',  // sage green
        'rgba(184, 126, 90, 0.45)',   // sand/bark
        'rgba(74, 127, 165, 0.55)',   // dusty river blue
        'rgba(212, 163, 70, 0.5)',    // Angsana gold
        'rgba(181, 204, 160, 0.5)',   // dew green
      ],
      minSize: 1,
      maxSize: 3.5,
      minSpeed: 0.15,
      maxSpeed: 0.5,
      mouseRadius: 120,
      mouseForce: 0.04,
    };

    this.init();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = this.config.minSpeed + Math.random() * (this.config.maxSpeed - this.config.minSpeed);
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.1,  // slight upward drift
      size: this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize),
      color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
      alpha: 0.2 + Math.random() * 0.6,
      alphaDelta: (Math.random() - 0.5) * 0.005,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      life: Math.random(),
      isSpore: Math.random() > 0.7, // some are spore-shaped
    };
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    for (let i = 0; i < this.config.count; i++) {
      const p = this.createParticle();
      p.y = Math.random() * this.canvas.height; // spread initially
      this.particles.push(p);
    }

    this.animate();
  }

  update() {
    for (let p of this.particles) {
      // Mouse repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.config.mouseRadius) {
        const force = (this.config.mouseRadius - dist) / this.config.mouseRadius;
        p.vx += (dx / dist) * force * this.config.mouseForce;
        p.vy += (dy / dist) * force * this.config.mouseForce;
      }

      // Speed cap
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > this.config.maxSpeed * 2) {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      // Alpha flicker
      p.alpha += p.alphaDelta;
      if (p.alpha > 0.85 || p.alpha < 0.1) {
        p.alphaDelta *= -1;
      }

      // Wrap around edges
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.alpha;

      if (p.isSpore) {
        // Draw spore shape (elongated)
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.6, p.size * 1.6, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      } else {
        // Draw circular particle with glow
        const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');

        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  animate() {
    this.update();
    this.draw();
    this.animFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}

// ——— Cursor Trail ———
class CursorTrail {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed; inset: 0; pointer-events: none;
      z-index: 399; mix-blend-mode: screen;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.mouse = { x: -1000, y: -1000 };
    this.maxPoints = 30;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse = { x: e.clientX, y: e.clientY };
      this.points.unshift({ ...this.mouse, age: 0 });
      if (this.points.length > this.maxPoints) {
        this.points.pop();
      }
    });

    this.animate();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.points.length - 1; i++) {
      const p = this.points[i];
      const next = this.points[i + 1];
      const t = 1 - i / this.maxPoints;
      const alpha = t * 0.4;

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(next.x, next.y);
      this.ctx.strokeStyle = `rgba(45, 125, 210, ${alpha})`;
      this.ctx.lineWidth = t * 3;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      // Green trail
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, t * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(141, 190, 106, ${alpha * 0.6})`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.ParticleSystem = ParticleSystem;
window.CursorTrail = CursorTrail;
