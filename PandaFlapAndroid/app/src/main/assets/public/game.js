const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game UI Elements
const uiOverlay = document.getElementById('ui-overlay');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const shopMenu = document.getElementById('shop-menu');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const shopBtn = document.getElementById('shop-btn');
const overShopBtn = document.getElementById('over-shop-btn');
const shopBackBtn = document.getElementById('shop-back-btn');

const bestScoreEl = document.getElementById('best-score');
const totalCoinsEl = document.getElementById('total-coins');
const finalScoreEl = document.getElementById('final-score');
const overBestScoreEl = document.getElementById('over-best-score');
const coinsCollectedEl = document.getElementById('coins-collected');
const shopCoinsEl = document.getElementById('shop-coins');
const shopItemsContainer = document.getElementById('shop-items');

// Local Storage Setup
let highScore = parseInt(localStorage.getItem('panda_flap_high') || '0');
let totalCoins = parseInt(localStorage.getItem('panda_flap_coins') || '0');
let unlockedSkins = JSON.parse(localStorage.getItem('panda_flap_unlocked') || '["classic"]');
let equippedSkin = localStorage.getItem('panda_flap_equipped') || 'classic';

// Game State
let gameState = 'menu'; // menu, playing, gameover
let score = 0;
let sessionCoins = 0;
let timeOfDay = 0; // 0 to 1, representing diurnal cycle (0 = noon, 0.5 = midnight, etc.)

// Canvas Responsive Sizing
function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Web Audio API Synthesizer
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;

        if (type === 'flap') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'coin') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'crash') {
            // Low rumble explosion
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(10, now + 0.4);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'unlock') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(261.63, now); // C4
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3); // C5

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {
        console.error("Audio error", e);
    }
}

// Skins Definition
const SKINS = {
    classic: { name: 'Classic Panda', price: 0, bg: '#ffffff', ear: '#000000', eyeColor: '#000000', cheeks: 'rgba(255, 100, 100, 0.4)' },
    pink: { name: 'Pink Blush', price: 15, bg: '#fff0f5', ear: '#ff69b4', eyeColor: '#db7093', cheeks: 'rgba(255, 50, 150, 0.5)' },
    gold: { name: 'Golden Warrior', price: 40, bg: '#fffaf0', ear: '#ffd700', eyeColor: '#daa520', cheeks: 'rgba(255, 215, 0, 0.6)', glow: true },
    cyber: { name: 'Cyber Hacker', price: 80, bg: '#0d1117', ear: '#39ff14', eyeColor: '#39ff14', cheeks: 'rgba(57, 255, 20, 0.5)', neon: true }
};

// Particle Engine
class Particle {
    constructor(x, y, color, size, vx, vy, isSpark = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.01;
        this.isSpark = isSpark;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (!this.isSpark) {
            this.vy += 0.1; // gravity for confetti
        }
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        if (this.isSpark) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        ctx.restore();
    }
}

let particles = [];

function spawnConfetti(x, y, color) {
    const count = 15;
    const colors = [color, '#FFEB3B', '#FF5252', '#4CAF50', '#2196F3'];
    for (let i = 0; i < count; i++) {
        const randColor = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 6 + 4;
        const speed = Math.random() * 4 + 2;
        const angle = Math.random() * Math.PI * 2;
        particles.push(new Particle(
            x, y, randColor, size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2
        ));
    }
}

// Background Clouds & Parallax Forest
class Cloud {
    constructor() {
        this.reset(true);
    }

    reset(startAnywhere = false) {
        this.x = startAnywhere ? Math.random() * canvas.width : canvas.width + 100;
        this.y = Math.random() * (canvas.height * 0.3) + 50;
        this.speed = Math.random() * 0.4 + 0.1;
        this.size = Math.random() * 40 + 20;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -this.size * 2) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.2, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x - this.size * 0.6, this.y - this.size * 0.1, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

let clouds = [new Cloud(), new Cloud(), new Cloud()];

// Main Panda Character Class
class Panda {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 80;
        this.y = canvas.height / 2;
        this.radius = 18;
        this.gravity = 0.4;
        this.jumpForce = -7.5;
        this.velocity = 0;
        this.angle = 0;
        this.flapAnim = 0;
    }

    flap() {
        this.velocity = this.jumpForce;
        this.flapAnim = 10; // flap ears/feet visual duration
        playSound('flap');
    }

    update() {
        this.velocity += this.gravity;
        // clamp downward velocity
        if (this.velocity > 12) this.velocity = 12;
        this.y += this.velocity;

        // angle logic based on velocity
        this.angle = Math.max(-0.4, Math.min(0.7, this.velocity * 0.08));

        // flap animation countdown
        if (this.flapAnim > 0) this.flapAnim--;

        // Trails for glowing skins
        const skin = SKINS[equippedSkin];
        if (skin.glow || skin.neon) {
            const sparkColor = skin.neon ? '#39ff14' : '#FFD700';
            if (Math.random() < 0.4) {
                particles.push(new Particle(
                    this.x - 10, this.y + (Math.random() * 10 - 5),
                    sparkColor, Math.random() * 3 + 1,
                    -1.5, Math.random() * 1 - 0.5, true
                ));
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const skin = SKINS[equippedSkin];

        // Draw Glow Outline if equipped skin has it
        if (skin.glow) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        } else if (skin.neon) {
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 15;
        }

        // --- Body / Head Base ---
        ctx.fillStyle = skin.bg;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ears
        ctx.fillStyle = skin.ear;
        const earFlapOffset = this.flapAnim > 0 ? -4 : 0;
        // Left Ear
        ctx.beginPath();
        ctx.arc(-14, -14 + earFlapOffset, 7, 0, Math.PI * 2);
        ctx.fill();
        // Right Ear
        ctx.beginPath();
        ctx.arc(14, -14 + earFlapOffset, 7, 0, Math.PI * 2);
        ctx.fill();

        // Draw Eye Patches (classic Panda spots)
        ctx.fillStyle = skin.ear;
        // Left patch
        ctx.beginPath();
        ctx.ellipse(-6, -4, 5, 6, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // Right patch
        ctx.beginPath();
        ctx.ellipse(6, -4, 5, 6, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye Pupils (white of the eyes)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-5.5, -4, 2, 0, Math.PI * 2);
        ctx.arc(5.5, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tiny Black Center (Iris)
        ctx.fillStyle = skin.eyeColor;
        ctx.beginPath();
        ctx.arc(-5.2, -3.8, 1, 0, Math.PI * 2);
        ctx.arc(5.2, -3.8, 1, 0, Math.PI * 2);
        ctx.fill();

        // Cute Blush Cheeks
        ctx.fillStyle = skin.cheeks;
        ctx.beginPath();
        ctx.arc(-10, 2, 3, 0, Math.PI * 2);
        ctx.arc(10, 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Snout & Nose
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(0, 0.5, 1.8, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute Mouth Line
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-1, 2.5, 1, 0, Math.PI);
        ctx.arc(1, 2.5, 1, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }
}

const player = new Panda();

// Bamboo Pipes (Obstacles)
class BambooPipe {
    constructor(x) {
        this.x = x;
        this.width = 65;
        this.gap = 145;
        this.speed = 2.4;
        this.passed = false;
        this.recalculate();
    }

    recalculate() {
        // Randomise gap position safely
        const minHeight = 80;
        const maxHeight = canvas.height - minHeight - this.gap;
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomHeight = canvas.height - this.topHeight - this.gap;
        this.coinY = this.topHeight + this.gap / 2;
        this.hasCoin = Math.random() < 0.75; // 75% chance of coin
        this.passed = false;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        // Draw top Bamboo
        this.drawBambooSegment(this.x, 0, this.width, this.topHeight, true);
        // Draw bottom Bamboo
        this.drawBambooSegment(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight, false);

        // Draw Coin
        if (this.hasCoin) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.coinY, 11, 0, Math.PI * 2);
            ctx.fill();
            // inner circle detail
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawBambooSegment(x, y, w, h, isTop) {
        // Draw Main Bamboo stem with vertical gradients
        const grad = ctx.createLinearGradient(x, y, x + w, y);
        grad.addColorStop(0, '#2E7D32'); // deep green
        grad.addColorStop(0.3, '#4CAF50'); // bright green
        grad.addColorStop(0.7, '#81C784'); // light green
        grad.addColorStop(1, '#1B5E20'); // shadow green

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Segment joint spacing
        const segmentHeight = 55;
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 4;

        let curY = isTop ? h % segmentHeight : y;
        while (isTop ? curY < h : curY < y + h) {
            // Joint ring shadow
            ctx.beginPath();
            ctx.moveTo(x, curY);
            ctx.lineTo(x + w, curY);
            ctx.stroke();

            // Joint highlight line
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, curY + 2);
            ctx.lineTo(x + w, curY + 2);
            ctx.stroke();
            ctx.restore();

            // Bamboo mini Leaf sprout occasionally!
            if (curY > 40 && curY < canvas.height - 40 && Math.abs(curY - h) > 30) {
                this.drawBambooLeaf(x + (isTop ? w - 4 : 4), curY, isTop ? 1 : -1);
            }

            curY += segmentHeight;
        }

        // Draw Bamboo Cap/Rim at the gap opening
        const rimY = isTop ? h - 12 : y;
        const rimGrad = ctx.createLinearGradient(x - 4, rimY, x + w + 4, rimY);
        rimGrad.addColorStop(0, '#1B5E20');
        rimGrad.addColorStop(0.3, '#81C784');
        rimGrad.addColorStop(0.8, '#4CAF50');
        rimGrad.addColorStop(1, '#0D3E10');

        ctx.fillStyle = rimGrad;
        ctx.fillRect(x - 4, rimY, w + 8, 12);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x - 4, rimY, w + 8, 12);
    }

    drawBambooLeaf(lx, ly, dir) {
        ctx.save();
        ctx.fillStyle = '#66BB6A';
        ctx.translate(lx, ly);
        ctx.scale(dir, 1);
        ctx.beginPath();
        ctx.ellipse(8, -4, 10, 4, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    checkCollision(player) {
        // Box vs Circle collision for accuracy
        const px = player.x;
        const py = player.y;
        const pr = player.radius - 2; // slightly forgiving boundary

        // Check top pipe collision
        if (px + pr > this.x && px - pr < this.x + this.width) {
            if (py - pr < this.topHeight || py + pr > canvas.height - this.bottomHeight) {
                return true;
            }
        }

        // Check Coin Collection
        if (this.hasCoin) {
            const cx = this.x + this.width / 2;
            const cy = this.coinY;
            const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            if (dist < pr + 11) {
                this.hasCoin = false;
                sessionCoins++;
                totalCoins++;
                localStorage.setItem('panda_flap_coins', totalCoins.toString());
                spawnConfetti(cx, cy, '#FFD700');
                playSound('coin');
            }
        }

        return false;
    }
}

let pipes = [];

function spawnPipes() {
    pipes = [];
    const initialOffset = canvas.width + 100;
    const spacing = 220;
    for (let i = 0; i < 3; i++) {
        pipes.push(new BambooPipe(initialOffset + i * spacing));
    }
}

// Draw Environmental Ambient Parallax Background Layers
function drawAmbientBackground() {
    timeOfDay += 0.0001;
    if (timeOfDay > 1) timeOfDay = 0;

    // Define Sky Gradient based on time of day
    let skyColor1, skyColor2;
    if (timeOfDay < 0.25) { // Noon to Dusk
        const progress = timeOfDay / 0.25;
        skyColor1 = lerpColor('#87CEEB', '#E066FF', progress); // Blue to violet
        skyColor2 = lerpColor('#E0F6FF', '#FF7F24', progress); // light to orange
    } else if (timeOfDay < 0.5) { // Dusk to Midnight
        const progress = (timeOfDay - 0.25) / 0.25;
        skyColor1 = lerpColor('#E066FF', '#0F172A', progress); // Violet to Midnight blue
        skyColor2 = lerpColor('#FF7F24', '#020617', progress); // Orange to pitch black
    } else if (timeOfDay < 0.75) { // Midnight to Dawn
        const progress = (timeOfDay - 0.5) / 0.25;
        skyColor1 = lerpColor('#0F172A', '#1E1B4B', progress); // dark to indigo
        skyColor2 = lerpColor('#020617', '#FF7E79', progress); // black to deep dawn pink
    } else { // Dawn to Noon
        const progress = (timeOfDay - 0.75) / 0.25;
        skyColor1 = lerpColor('#1E1B4B', '#87CEEB', progress); // indigo to Blue
        skyColor2 = lerpColor('#FF7E79', '#E0F6FF', progress); // pink to light blue
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, skyColor1);
    skyGrad.addColorStop(1, skyColor2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars at Night
    if (timeOfDay > 0.4 && timeOfDay < 0.75) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.sin((timeOfDay - 0.4) / 0.35 * Math.PI) * 0.8;
        // Simple random seed pattern for stars
        for (let i = 0; i < 20; i++) {
            const sx = (i * 1234.5) % canvas.width;
            const sy = (i * 5678.9) % (canvas.height * 0.4);
            ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.restore();
    }

    // Draw Parallax distant misty green hills
    drawMistyForestLayer(0.04, 'rgba(38, 70, 83, 0.25)', canvas.height * 0.72, 35);
    drawMistyForestLayer(0.12, 'rgba(42, 110, 80, 0.4)', canvas.height * 0.8, 20);
}

function drawMistyForestLayer(speedFactor, color, yOffset, waveHeight) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width + 10; x += 10) {
        // smooth terrain curve
        const wave = Math.sin(x * 0.005 + (Date.now() * speedFactor * 0.003)) * waveHeight;
        ctx.lineTo(x, yOffset + wave);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
}

function lerpColor(color1, color2, factor) {
    const parse = (c) => {
        if (c.startsWith('#')) {
            return [
                parseInt(c.substring(1, 3), 16),
                parseInt(c.substring(3, 5), 16),
                parseInt(c.substring(5, 7), 16)
            ];
        }
        return [255, 255, 255];
    };
    const c1 = parse(color1);
    const c2 = parse(color2);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

// Main Interactive Loop
function update() {
    if (gameState === 'playing') {
        player.update();

        // Check ceiling / floor boundary collisions
        if (player.y - player.radius < 0 || player.y + player.radius > canvas.height) {
            triggerGameOver();
        }

        // Update clouds
        clouds.forEach(c => c.update());

        // Update pipes
        pipes.forEach(pipe => {
            pipe.update();

            // Collision check
            if (pipe.checkCollision(player)) {
                triggerGameOver();
            }

            // Score check
            if (!pipe.passed && pipe.x + pipe.width < player.x) {
                pipe.passed = true;
                score++;
                playSound('flap'); // high beep sound
            }
        });

        // Recycling off-screen pipes
        if (pipes.length > 0 && pipes[0].x < -pipes[0].width) {
            const first = pipes.shift();
            // push to end with relative offset
            const lastX = pipes[pipes.length - 1].x;
            first.x = lastX + 220;
            first.recalculate();
            pipes.push(first);
        }
    }

    // Update Particles
    particles.forEach((p, idx) => {
        p.update();
        if (p.alpha <= 0) {
            particles.splice(idx, 1);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Sky & Parallax hills
    drawAmbientBackground();

    // 2. Draw clouds
    clouds.forEach(c => c.draw());

    // 3. Pipes (obstacles & coins)
    if (gameState === 'playing' || gameState === 'gameover') {
        pipes.forEach(pipe => pipe.draw());
    }

    // 4. Draw Particles
    particles.forEach(p => p.draw());

    // 5. Draw Player Panda
    player.draw();

    // 6. Draw Live Score Text during gameplay
    if (gameState === 'playing') {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.fillText(score, canvas.width / 2, 80);

        // Session Coin Display
        ctx.fillStyle = '#FFEB3B';
        ctx.font = '700 18px sans-serif';
        ctx.fillText(`★ ${sessionCoins}`, canvas.width / 2, 115);
        ctx.restore();
    }
}

function gameTick() {
    update();
    draw();
    requestAnimationFrame(gameTick);
}
requestAnimationFrame(gameTick);

// Game Logic Control Transitions
function triggerGameOver() {
    gameState = 'gameover';
    playSound('crash');

    // Save Score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('panda_flap_high', highScore.toString());
    }

    // Show Game Over UI
    startMenu.classList.remove('active');
    shopMenu.classList.remove('active');
    gameOverMenu.classList.add('active');

    finalScoreEl.innerText = score;
    overBestScoreEl.innerText = highScore;
    coinsCollectedEl.innerText = sessionCoins;
}

function startPlaying() {
    initAudio();
    player.reset();
    spawnPipes();
    score = 0;
    sessionCoins = 0;
    gameState = 'playing';

    // Hide menus completely
    startMenu.classList.remove('active');
    gameOverMenu.classList.remove('active');
    shopMenu.classList.remove('active');
}

// User Gestures Setup
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        player.flap();
    }
});
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'playing') {
        player.flap();
    }
});

startBtn.addEventListener('click', startPlaying);
restartBtn.addEventListener('click', startPlaying);

// Shop UI Controller
function renderShop() {
    shopCoinsEl.innerText = totalCoins;
    shopItemsContainer.innerHTML = '';

    Object.keys(SKINS).forEach(id => {
        const skin = SKINS[id];
        const isUnlocked = unlockedSkins.includes(id);
        const isEquipped = equippedSkin === id;

        const card = document.createElement('div');
        card.className = `shop-item ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'unlocked' : ''}`;

        // Create Canvas dynamic avatar inside card
        const canvasPreview = document.createElement('canvas');
        canvasPreview.className = 'shop-item-preview';
        canvasPreview.width = 44;
        canvasPreview.height = 44;
        drawSkinPreview(canvasPreview, skin);

        const name = document.createElement('span');
        name.className = 'shop-item-name';
        name.innerText = skin.name;

        const price = document.createElement('span');
        price.className = 'shop-item-price';
        price.innerText = isUnlocked ? 'Unlocked' : `★ ${skin.price}`;

        const status = document.createElement('span');
        status.className = `shop-item-status ${isEquipped ? 'equipped-text' : ''}`;
        status.innerText = isEquipped ? 'Equipped' : (isUnlocked ? 'Tap to Equip' : 'Tap to Buy');

        card.appendChild(canvasPreview);
        card.appendChild(name);
        card.appendChild(price);
        card.appendChild(status);

        // Click Handler for Buy/Equip
        card.addEventListener('click', () => {
            initAudio();
            if (isUnlocked) {
                equippedSkin = id;
                localStorage.setItem('panda_flap_equipped', id);
                renderShop();
                playSound('flap');
            } else {
                if (totalCoins >= skin.price) {
                    totalCoins -= skin.price;
                    localStorage.setItem('panda_flap_coins', totalCoins.toString());
                    unlockedSkins.push(id);
                    localStorage.setItem('panda_flap_unlocked', JSON.stringify(unlockedSkins));
                    equippedSkin = id;
                    localStorage.setItem('panda_flap_equipped', id);
                    renderShop();
                    playSound('unlock');
                } else {
                    // Flash price text red
                    price.style.color = '#FF5252';
                    setTimeout(() => { price.style.color = '#FFEB3B'; }, 500);
                    playSound('crash');
                }
            }
        });

        shopItemsContainer.appendChild(card);
    });
}

function drawSkinPreview(canv, skin) {
    const pctx = canv.getContext('2d');
    pctx.clearRect(0,0,44,44);

    const cx = 22;
    const cy = 22;
    const r = 14;

    // Head Base
    pctx.fillStyle = skin.bg;
    pctx.beginPath();
    pctx.arc(cx, cy, r, 0, Math.PI * 2);
    pctx.fill();

    // Ears
    pctx.fillStyle = skin.ear;
    pctx.beginPath();
    pctx.arc(cx - 10, cy - 10, 5, 0, Math.PI * 2);
    pctx.arc(cx + 10, cy - 10, 5, 0, Math.PI * 2);
    pctx.fill();

    // Eyes Spots
    pctx.beginPath();
    pctx.ellipse(cx - 5, cy - 2, 4, 5, Math.PI/6, 0, Math.PI * 2);
    pctx.ellipse(cx + 5, cy - 2, 4, 5, -Math.PI/6, 0, Math.PI * 2);
    pctx.fill();

    // Inner White
    pctx.fillStyle = '#ffffff';
    pctx.beginPath();
    pctx.arc(cx - 4.5, cy - 2, 1.5, 0, Math.PI * 2);
    pctx.arc(cx + 4.5, cy - 2, 1.5, 0, Math.PI * 2);
    pctx.fill();

    // Blush cheeks
    pctx.fillStyle = skin.cheeks;
    pctx.beginPath();
    pctx.arc(cx - 8, cy + 2, 2.5, 0, Math.PI * 2);
    pctx.arc(cx + 8, cy + 2, 2.5, 0, Math.PI * 2);
    pctx.fill();

    // Snout
    pctx.fillStyle = '#ffffff';
    pctx.beginPath();
    pctx.arc(cx, cy + 2, 3, 0, Math.PI * 2);
    pctx.fill();

    pctx.fillStyle = '#111111';
    pctx.beginPath();
    pctx.ellipse(cx, cy + 1, 1.5, 1, 0, 0, Math.PI * 2);
    pctx.fill();
}

// Navigation Controller Menu Actions
function openShop() {
    initAudio();
    startMenu.classList.remove('active');
    gameOverMenu.classList.remove('active');
    shopMenu.classList.add('active');
    renderShop();
}

function closeShop() {
    initAudio();
    shopMenu.classList.remove('active');
    startMenu.classList.add('active');
    updateGlobalScoresDisplay();
}

shopBtn.addEventListener('click', openShop);
overShopBtn.addEventListener('click', openShop);
shopBackBtn.addEventListener('click', closeShop);

function updateGlobalScoresDisplay() {
    bestScoreEl.innerText = highScore;
    totalCoinsEl.innerText = totalCoins;
}
updateGlobalScoresDisplay();
