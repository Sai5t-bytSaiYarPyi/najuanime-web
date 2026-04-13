/* ══════════════════════════════════════════════════════
   NaJu Anime — ဒုက္ခကို Version မြှင့်ခြင်း
   main.js — Three.js + GSAP ScrollTrigger
══════════════════════════════════════════════════════ */

// ─── Ensure GSAP + ScrollTrigger ─────────────────────
gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════
   1. CUSTOM CURSOR
════════════════════════════════════════ */
function initCursor() {
  const cursor     = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursor.className     = 'cursor';
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(cursorRing);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(cursor, { x: mx, y: my, duration: 0.08, ease: 'none' });
  });

  // Ring follows with lag
  (function loop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    gsap.set(cursorRing, { x: rx, y: ry });
    requestAnimationFrame(loop);
  })();

  // Hover effect on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .dual-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursorRing, { width: 56, height: 56, borderColor: 'rgba(212,175,55,0.8)', duration: 0.2 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cursorRing, { width: 32, height: 32, borderColor: 'rgba(212,175,55,0.5)', duration: 0.2 });
    });
  });
}

/* ════════════════════════════════════════
   2. PROGRESS BAR
════════════════════════════════════════ */
function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.body.scrollHeight - window.innerHeight;
    const pct        = (scrollTop / docHeight) * 100;
    bar.style.width  = pct + '%';
  });
}

/* ════════════════════════════════════════
   3. NAV CHAPTER TRACKER
════════════════════════════════════════ */
function initChapterTracker() {
  const nav        = document.getElementById('nav');
  const chNumEl    = document.getElementById('chapter-num');
  const chapters   = document.querySelectorAll('.chapter-section');
  const numerals   = { 'I':'I', 'II':'II', 'III':'III', 'IV':'IV', 'V':'V' };

  window.addEventListener('scroll', () => {
    // Nav scrolled style
    nav.classList.toggle('scrolled', window.scrollY > 80);

    // Chapter detection
    chapters.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.4 && rect.bottom > 0) {
        const ch = section.dataset.chapter;
        if (chNumEl.textContent !== ch) {
          gsap.to(chNumEl, { opacity: 0, y: -8, duration: 0.15, onComplete: () => {
            chNumEl.textContent = ch;
            gsap.to(chNumEl, { opacity: 1, y: 0, duration: 0.2 });
          }});
        }
      }
    });
  });
}

/* ════════════════════════════════════════
   4. THREE.JS — PARTICLE FIELD
════════════════════════════════════════ */
function initThreeJS() {
  const canvas   = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  // ── Particle Geometry ───────────────────────────────
  const PARTICLE_COUNT = 1800;
  const positions    = new Float32Array(PARTICLE_COUNT * 3);
  const colors       = new Float32Array(PARTICLE_COUNT * 3);
  const sizes        = new Float32Array(PARTICLE_COUNT);

  const goldColor    = new THREE.Color(0xd4af37);
  const blueColor    = new THREE.Color(0x4f8ef0);
  const whiteColor   = new THREE.Color(0xe8e5dc);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 200;
    positions[i3 + 1] = (Math.random() - 0.5) * 200;
    positions[i3 + 2] = (Math.random() - 0.5) * 100;

    sizes[i] = Math.random() * 1.8 + 0.3;

    // Color distribution: 70% white/dim, 20% gold, 10% blue
    const rnd = Math.random();
    let col;
    if      (rnd < 0.1)  col = blueColor;
    else if (rnd < 0.3)  col = goldColor;
    else                 col = whiteColor;

    const brightness = 0.15 + Math.random() * 0.5;
    colors[i3]     = col.r * brightness;
    colors[i3 + 1] = col.g * brightness;
    colors[i3 + 2] = col.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size:          0.9,
    vertexColors:  true,
    transparent:   true,
    opacity:       0.7,
    sizeAttenuation: true,
    depthWrite:    false,
    blending:      THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── Floating Orbs ───────────────────────────────────
  const orbs = [];
  const orbData = [
    { radius: 0.8, color: 0xd4af37, x: 30, y: 20, z: -30, speed: 0.6 },
    { radius: 0.5, color: 0x4f8ef0, x: -40, y: -15, z: -50, speed: 0.4 },
    { radius: 1.0, color: 0x8b5cf6, x: -20, y: 30, z: -60, speed: 0.3 },
    { radius: 0.4, color: 0xd4af37, x: 50, y: -30, z: -40, speed: 0.8 },
  ];

  orbData.forEach(o => {
    const geo  = new THREE.SphereGeometry(o.radius, 16, 16);
    const mat  = new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(o.x, o.y, o.z);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(o.radius * 3, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: o.color, transparent: true, opacity: 0.04,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    scene.add(mesh);
    orbs.push({ mesh, ox: o.x, oy: o.y, speed: o.speed });
  });

  // ── Animation Loop ──────────────────────────────────
  let scrollFraction = 0;
  let rafId;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Scroll-driven camera tilt
    const targetY   = -(window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 30;
    scrollFraction  = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
    camera.position.y += (targetY - camera.position.y) * 0.05;

    // Slow rotation
    particles.rotation.y = t * 0.025;
    particles.rotation.x = Math.sin(t * 0.015) * 0.1;

    // Orb float
    orbs.forEach((o, i) => {
      o.mesh.position.x = o.ox + Math.sin(t * o.speed * 0.5 + i) * 4;
      o.mesh.position.y = o.oy + Math.cos(t * o.speed * 0.3 + i * 1.3) * 3;
    });

    // Particle opacity based on scroll (fade during climax)
    const climaxOpacity = scrollFraction > 0.75 ? 0.3 + (1 - scrollFraction) * 0.4 : 0.7;
    material.opacity = climaxOpacity;

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ════════════════════════════════════════
   5. HERO ENTRANCE ANIMATIONS
════════════════════════════════════════ */
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-tag',    { opacity: 1, y: 0, duration: 0.7 }, 0.3)
    .to('.ht-main',     { opacity: 1, y: 0, duration: 1.0 }, 0.5)
    .to('.ht-dash',     { opacity: 1, y: 0, duration: 0.7 }, 0.8)
    .to('.ht-sub',      { opacity: 1, y: 0, duration: 0.9 }, 0.9)
    .to('.hero-byline', { opacity: 1, y: 0, duration: 0.8 }, 1.1)
    .to('.scroll-cue',  { opacity: 1, y: 0, duration: 0.7 }, 1.4);
}

/* ════════════════════════════════════════
   6. SCROLL ANIMATIONS — CHAPTERS
════════════════════════════════════════ */
function initScrollAnimations() {

  // ── Helper: standard reveal ──────────────────────────
  function revealOnScroll(selector, fromVars, trigger, start = 'top 80%') {
    gsap.from(selector, {
      scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
      ...fromVars,
      stagger: 0.12,
      ease: 'power3.out',
      duration: 0.9,
    });
  }

  // ── CH01 Cards ───────────────────────────────────────
  gsap.from('#ch01 .ch-header', {
    scrollTrigger: { trigger: '#ch01', start: 'top 75%' },
    opacity: 0, x: -40, duration: 0.8, ease: 'power3.out'
  });

  gsap.from('#card-loud', {
    scrollTrigger: { trigger: '#ch01', start: 'top 65%' },
    opacity: 0, x: -60, duration: 1.0, ease: 'power3.out'
  });

  gsap.from('.vs-divider', {
    scrollTrigger: { trigger: '#ch01', start: 'top 60%' },
    opacity: 0, scale: 0.5, duration: 0.5, ease: 'back.out(2)'
  });

  gsap.from('#card-silent', {
    scrollTrigger: { trigger: '#ch01', start: 'top 65%' },
    opacity: 0, x: 60, duration: 1.0, ease: 'power3.out'
  });

  gsap.from('.ch-footer-note', {
    scrollTrigger: { trigger: '#ch01', start: 'top 40%' },
    opacity: 0, y: 20, duration: 0.7, ease: 'power2.out'
  });

  // ── CH02 Admin ───────────────────────────────────────
  gsap.from('#ch02 .ch-header', {
    scrollTrigger: { trigger: '#ch02', start: 'top 80%' },
    opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
  });

  gsap.from('.ap-avatar', {
    scrollTrigger: { trigger: '#ch02', start: 'top 70%' },
    opacity: 0, scale: 0.5, duration: 1.0, ease: 'back.out(1.5)'
  });

  gsap.from('.stat-row', {
    scrollTrigger: { trigger: '#ch02', start: 'top 65%' },
    opacity: 0, x: 30, duration: 0.6, stagger: 0.1, ease: 'power3.out'
  });

  gsap.from('.big-quote', {
    scrollTrigger: { trigger: '#ch02', start: 'top 50%' },
    opacity: 0, y: 40, scale: 0.97, duration: 1.0, ease: 'power3.out'
  });

  // ── CH03 Chaos ───────────────────────────────────────
  gsap.from('#ch03 .ch-header', {
    scrollTrigger: { trigger: '#ch03', start: 'top 80%' },
    opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
  });

  gsap.from('.anime-rain-zone', {
    scrollTrigger: { trigger: '#ch03', start: 'top 70%' },
    opacity: 0, scale: 0.95, duration: 1.0, ease: 'power3.out'
  });

  gsap.from('.ct-line', {
    scrollTrigger: { trigger: '#ch03', start: 'top 60%' },
    opacity: 0, x: 40, duration: 0.7, stagger: 0.15, ease: 'power3.out'
  });

  gsap.from('.equation-box', {
    scrollTrigger: { trigger: '#ch03', start: 'top 40%' },
    opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
  });

  // ── CH04 Budget ──────────────────────────────────────
  gsap.from('#ch04 .ch-header', {
    scrollTrigger: { trigger: '#ch04', start: 'top 80%' },
    opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
  });

  gsap.from('.br-name', {
    scrollTrigger: { trigger: '#ch04', start: 'top 70%' },
    opacity: 0, x: -80, duration: 1.2, ease: 'power4.out'
  });

  // Budget meter drain animation
  ScrollTrigger.create({
    trigger: '#ch04',
    start: 'top 60%',
    onEnter: () => animateBudgetMeter(),
  });

  gsap.from('.budget-desc', {
    scrollTrigger: { trigger: '#ch04', start: 'top 40%' },
    opacity: 0, y: 24, duration: 0.8, ease: 'power3.out'
  });

  // ── CH05 Hope ────────────────────────────────────────
  gsap.from('.hope-orb', {
    scrollTrigger: { trigger: '#ch05', start: 'top 75%' },
    opacity: 0, scale: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)'
  });

  gsap.from('.hope-quote p', {
    scrollTrigger: { trigger: '#ch05', start: 'top 60%' },
    opacity: 0, y: 20, duration: 0.8, stagger: 0.2, ease: 'power3.out'
  });

  gsap.from('.hope-quote cite', {
    scrollTrigger: { trigger: '#ch05', start: 'top 50%' },
    opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.4
  });

  gsap.from('.hope-spoiler', {
    scrollTrigger: { trigger: '#ch05', start: 'top 40%' },
    opacity: 0, y: 10, duration: 0.6, delay: 0.8, ease: 'power2.out'
  });

  // ── CLIMAX ───────────────────────────────────────────
  initClimaxAnimation();
}

/* ════════════════════════════════════════
   7. CLIMAX ANIMATION SEQUENCE
════════════════════════════════════════ */
function initClimaxAnimation() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#climax',
      start: 'top 70%',
      toggleActions: 'play none none reverse',
    }
  });

  tl.to('.climax-eyebrow', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, 0)

  .to('#cxl-1', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  }, 0.3)

  .to('.cx-divider', {
    opacity: 1, duration: 0.5, ease: 'power2.out'
  }, 0.7)

  .to('#cxl-2', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, 1.0)

  .to('#cxl-3', {
    opacity: 1, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)'
  }, 1.4)

  .to('#cxl-4', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  }, 2.0)

  .to('#cx-badge', {
    opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(2)'
  }, 2.5)

  .to('.cx-cta', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  }, 3.0);

  // Gold glow pulse on the Premium text (after reveal)
  ScrollTrigger.create({
    trigger: '#climax',
    start: 'top 50%',
    onEnter: () => {
      gsap.to('.cx-version-text', {
        textShadow: '0 0 60px rgba(212,175,55,0.8), 0 0 100px rgba(212,175,55,0.4), 0 0 160px rgba(212,175,55,0.2)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  });
}

/* ════════════════════════════════════════
   8. BUDGET METER ANIMATION
════════════════════════════════════════ */
function animateBudgetMeter() {
  const fill   = document.getElementById('meter-fill');
  const pctEl  = document.getElementById('meter-pct');
  if (!fill || !pctEl) return;

  let pct = 100;
  const target = 3;
  const duration = 2800; // ms
  const startTime = performance.now();

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out

    pct = 100 - (100 - target) * eased;
    fill.style.width = pct + '%';
    pctEl.textContent = Math.round(pct) + '%';

    // Color shifts from gold → red as it drains
    const redness = progress;
    pctEl.style.color = `hsl(${45 - redness * 45}deg, 80%, ${60 - redness * 15}%)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Flash red at end
      gsap.to(fill, {
        opacity: 0.4, duration: 0.15, repeat: 5, yoyo: true, ease: 'none'
      });
    }
  }

  requestAnimationFrame(step);
}

/* ════════════════════════════════════════
   9. ANIME RAIN (CH03)
════════════════════════════════════════ */
function initAnimeRain() {
  const zone = document.getElementById('rain-zone');
  if (!zone) return;

  const animes = [
    'Dungeon Meshi', 'Solo Leveling', 'Frieren', 'Oshi no Ko',
    'Kaiju No.8', 'Jujutsu Kaisen', 'Chainsaw Man', 'Blue Lock',
    'My Hero Academia', 'One Piece', 'Black Clover', 'Vinland Saga',
    'Demon Slayer', 'Overlord', 'Re:Zero', 'Jobless Reincarnation',
    'The Eminence in Shadow', 'Isekai Ojisan', 'Bucchigiri',
    'Metallic Rouge', 'Mashle', 'Zom 100', 'Pluto',
    'Dr. Stone', 'That Time I Got Reincarnated', 'Spy × Family',
    'Lycoris Recoil', 'Tensei Shitara', 'Classroom of the Elite',
  ];

  function spawnItem() {
    if (!zone.isConnected) return;

    const el    = document.createElement('div');
    el.className = 'rain-item';
    el.textContent = animes[Math.floor(Math.random() * animes.length)];

    const left     = Math.random() * 88;
    const duration = 2.5 + Math.random() * 4;
    const delay    = Math.random() * 0.5;

    el.style.left         = left + '%';
    el.style.animationDuration = duration + 's';
    el.style.animationDelay    = delay + 's';
    el.style.fontSize     = (9 + Math.random() * 4) + 'px';
    el.style.opacity      = (0.4 + Math.random() * 0.6).toString();

    // Occasional gold highlight
    if (Math.random() < 0.15) {
      el.style.borderColor = 'rgba(212,175,55,0.5)';
      el.style.color = '#f0cc60';
    }

    zone.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
  }

  // Burst spawn
  let spawning = false;

  ScrollTrigger.create({
    trigger: '#ch03',
    start: 'top 70%',
    onEnter: () => {
      if (spawning) return;
      spawning = true;
      for (let i = 0; i < 12; i++) {
        setTimeout(spawnItem, i * 120);
      }
      const interval = setInterval(() => {
        if (!document.getElementById('rain-zone')) { clearInterval(interval); return; }
        spawnItem();
      }, 380);
      // Stop after leaving
      ScrollTrigger.create({
        trigger: '#ch04',
        start: 'top 90%',
        onEnter: () => clearInterval(interval),
      });
    }
  });
}

/* ════════════════════════════════════════
   10. CHAPTER BACKGROUND COLOR SHIFT
════════════════════════════════════════ */
function initChapterColorShift() {
  const chapterColors = {
    'ch01': 'rgba(212,175,55,0.025)',
    'ch02': 'rgba(79,142,240,0.025)',
    'ch03': 'rgba(224,85,85,0.02)',
    'ch04': 'rgba(224,85,85,0.04)',
    'ch05': 'rgba(212,175,55,0.03)',
  };

  Object.entries(chapterColors).forEach(([id, color]) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => gsap.to('body', {
        '--bg': '#04050d', duration: 0.8, ease: 'power2.inOut'
      }),
    });
  });
}

/* ════════════════════════════════════════
   11. CHAPTER HEADER PARALLAX
════════════════════════════════════════ */
function initParallaxNumbers() {
  document.querySelectorAll('.ch-num-bg').forEach(el => {
    const section = el.closest('.chapter-section');
    gsap.to(el, {
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: -80,
      ease: 'none',
    });
  });
}

/* ════════════════════════════════════════
   12. HERO PARALLAX
════════════════════════════════════════ */
function initHeroParallax() {
  gsap.to('.hero-inner', {
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
    y: 60,
    opacity: 0,
    ease: 'none',
  });
}

/* ════════════════════════════════════════
   13. STAT ROW — CARD HOVER GLOW
════════════════════════════════════════ */
function initCardInteractions() {
  document.querySelectorAll('.dual-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const x     = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y     = ((e.clientY - rect.top)  / rect.height - 0.5) * 20;
      gsap.to(card, { rotationY: x, rotationX: -y, duration: 0.3, ease: 'power2.out', transformPerspective: 800 });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ════════════════════════════════════════
   14. FOOTER REVEAL
════════════════════════════════════════ */
function initFooter() {
  gsap.from('#footer .ft-inner > *', {
    scrollTrigger: {
      trigger: '#footer',
      start: 'top 85%',
    },
    opacity: 0,
    y: 20,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power3.out',
  });
}

/* ════════════════════════════════════════
   15. INIT ALL
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Check for device
  const isMobile = window.innerWidth < 600;

  if (!isMobile) initCursor();

  initProgressBar();
  initChapterTracker();
  initThreeJS();
  initHeroAnimations();
  initScrollAnimations();
  initAnimeRain();
  initParallaxNumbers();
  initHeroParallax();
  initCardInteractions();
  initChapterColorShift();
  initFooter();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    });
  });

  // ScrollTrigger refresh after fonts load
  document.fonts.ready.then(() => ScrollTrigger.refresh());
});
