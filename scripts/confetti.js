// confetti.js
// Usage: triggerConfetti();  
// or triggerConfetti({ particleCount: 220, spawnDuration: 3000, gravity: 0.22 })

function triggerConfetti(options = {}) {
  const {
    particleCount = 90,
    spawnDuration = 500, // ms over which to create particles
    maxLifetime = 9999,   // frames
    gravity = 0.18,
    drag = 0.995,
    wind = 0.0025,
  } = options;

  const confettiCanvas = document.createElement("canvas");
  const confettiCtx = confettiCanvas.getContext("2d");
  document.body.appendChild(confettiCanvas);

  function resize() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  resize();
  confettiCanvas.style.position = "fixed";
  confettiCanvas.style.top = "0";
  confettiCanvas.style.left = "0";
  confettiCanvas.style.pointerEvents = "none";
  confettiCanvas.style.zIndex = "15";

  class Particle {
    constructor() {
      this.x = Math.random() * confettiCanvas.width;
      this.y = -20 - Math.random() * 120;
      this.length = 16.18;
      this.thickness = 10;
      this.vx = (Math.random() - 0.5) * 2.8;
      this.vy = 1.2 + Math.random() * 2.4;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.15;
      this.flip = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.25 + Math.random() * 0.35;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.08 + Math.random() * 0.12;
      this.wobbleDist = 0.6 + Math.random() * 1.4;
      this.h = Math.floor(Math.random() * 360);
      this.s = 100;
      this.baseL = 50;
      this.age = 0;
      this.maxAge = maxLifetime;
    }

    update() {
      this.vy += gravity;
      this.vx *= drag;
      this.vy *= drag;
      this.vx += (Math.random() - 0.5) * wind * 2;
      this.wobble += this.wobbleSpeed;
      this.flip += this.flipSpeed;
      this.angle += this.spin;
      this.x += this.vx + Math.cos(this.wobble) * this.wobbleDist;
      this.y += this.vy;
      this.age++;
    }

    draw(ctx) {
      const flipCos = Math.cos(this.flip);
      const apparentThickness = this.thickness * (0.22 + 0.78 * Math.abs(flipCos));
      const shimmerL = Math.max(30, Math.min(70, this.baseL + flipCos * 18));

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = `hsl(${this.h} ${this.s}% ${shimmerL}%)`;
      const w = this.length, h = apparentThickness, r = Math.min(2, h * 0.5);

      ctx.beginPath();
      ctx.moveTo(-w/2 + r, -h/2);
      ctx.lineTo(w/2 - r, -h/2);
      ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
      ctx.lineTo(w/2, h/2 - r);
      ctx.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
      ctx.lineTo(-w/2 + r, h/2);
      ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
      ctx.lineTo(-w/2, -h/2 + r);
      ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.25 * (0.4 + 0.6 * Math.abs(flipCos));
      ctx.strokeStyle = `hsl(${this.h} ${this.s}% ${Math.max(20, shimmerL - 10)}%)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    isDead(canvasHeight) {
      return this.y > canvasHeight + 30 || this.age > this.maxAge;
    }
  }

  let particles = [];
  let spawned = 0;
  const spawnInterval = spawnDuration / particleCount;
  const spawnTimer = setInterval(() => {
    if (spawned < particleCount) {
      particles.push(new Particle());
      spawned++;
    } else {
      clearInterval(spawnTimer);
    }
  }, spawnInterval);

  let rafId = null;

  function animate() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach(p => { p.update(); p.draw(confettiCtx); });
    particles = particles.filter(p => !p.isDead(confettiCanvas.height));

    if (particles.length || spawned < particleCount) {
      rafId = requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    clearInterval(spawnTimer);
    window.removeEventListener("resize", resize);
    confettiCanvas.remove();
  }

  window.addEventListener("resize", resize);
  animate();
}
