function triggerConfetti() {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.position = 'fixed';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = 15;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f94144','#f3722c','#f9c74f','#90be6d','#43aa8b','#577590'];

    function random(min, max) { return Math.random() * (max - min) + min; }

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: random(0, W),
            y: random(0, H),
            r: random(5, 10),
            d: random(1, 5),
            color: colors[Math.floor(random(0, colors.length))],
            tilt: random(-10, 10),
            tiltAngleIncrement: random(0.05, 0.12),
            tiltAngle: 0
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (let p of particles) {
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        }
        update();
    }

    function update() {
        for (let p of particles) {
            p.tiltAngle += p.tiltAngleIncrement;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.d);
            p.tilt = Math.sin(p.tiltAngle) * 15;

            if (p.y > H) {
                p.y = -10;
                p.x = random(0, W);
            }
        }
    }

    const interval = setInterval(draw, 20);

    // Stop confetti after 3 seconds
    setTimeout(() => {
        clearInterval(interval);
        document.body.removeChild(canvas);
    }, 3000);

    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });
}
