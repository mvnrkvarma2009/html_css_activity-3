/**
 * APEX AERO-GT | ELECTRIC HYPERCAR SHOWROOM
 * Pure Vanilla ES6 JavaScript (Zero Build Steps, Zero Emojis)
 * NRI University Web Assignment • Group 3, Project 8 • Made by Nagendra Varma
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. Web Audio API Telemetry Sound Synthesizer
     ========================================================================== */
  class TelemetryAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
          this.initialized = true;
        }
      } catch (e) {
        console.warn('Web Audio API not supported in this browser.');
      }
    }

    toggleMute() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.08) {
      if (this.isMuted || !this.ctx) return;
      try {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (err) {
        // Silently ignore audio playback errors
      }
    }

    playModeSwitch() {
      this.playTone(320, 'sine', 0.12, 0.06);
      setTimeout(() => this.playTone(640, 'triangle', 0.18, 0.08), 80);
    }

    playLightning() {
      this.playTone(180, 'sawtooth', 0.2, 0.05);
      setTimeout(() => this.playTone(120, 'sine', 0.3, 0.07), 60);
    }

    playSuccessChime() {
      this.playTone(523.25, 'sine', 0.2, 0.06); // C5
      setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.06), 100); // E5
      setTimeout(() => this.playTone(783.99, 'sine', 0.35, 0.08), 200); // G5
      setTimeout(() => this.playTone(1046.50, 'triangle', 0.45, 0.09), 300); // C6
    }
  }

  const audioEngine = new TelemetryAudio();

  // Audio Toggle Button
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const isMuted = audioEngine.toggleMute();
      audioToggleBtn.classList.toggle('muted', isMuted);
      const iconOn = audioToggleBtn.querySelector('.sound-on');
      const iconOff = audioToggleBtn.querySelector('.sound-off');
      if (iconOn && iconOff) {
        iconOn.style.display = isMuted ? 'none' : 'inline-block';
        iconOff.style.display = isMuted ? 'inline-block' : 'none';
      }
      showToast(isMuted ? 'Audio Telemetry Muted' : 'Audio Telemetry Engaged');
    });
  }

  /* ==========================================================================
     2. ArgentCloudburst Canvas Background Shader Simulation
     ========================================================================== */
  class ArgentCloudburstCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Rain strand physics
      this.strands = [];
      this.strandCount = Math.floor(Math.min(this.width / 11, 160));
      this.burstIntensity = 1.0;
      this.targetBurst = 1.0;
      this.isHolding = false;

      // Mouse & Wind physics
      this.mouse = { x: -1000, y: -1000, vx: 0, vy: 0, prevX: -1000, prevY: -1000 };
      this.windLean = 0;
      this.windVelocity = 0;

      // Lightning charge ripple effect
      this.lightning = {
        active: false,
        flashOpacity: 0,
        ripples: []
      };

      this.init();
    }

    init() {
      this.resize();
      this.createStrands();
      this.bindEvents();
      this.render();
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.scale(this.dpr, this.dpr);

      this.strandCount = Math.floor(Math.min(this.width / 11, 160));
      this.createStrands();
    }

    createStrands() {
      this.strands = [];
      const colStep = this.width / this.strandCount;
      for (let i = 0; i < this.strandCount; i++) {
        const baseX = i * colStep + (Math.random() - 0.5) * colStep * 0.8;
        const speed = 2.4 + Math.random() * 4.2;
        const length = 14 + Math.random() * 26;
        const alpha = 0.25 + Math.random() * 0.55;
        this.strands.push({
          baseX: baseX,
          x: baseX,
          y: Math.random() * this.height,
          speed: speed,
          length: length,
          alpha: alpha,
          charge: 0,
          lateralVel: 0,
          tailGlyphs: Math.random() > 0.4
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });

      // Mouse movement
      window.addEventListener('mousemove', (e) => {
        if (this.mouse.prevX !== -1000) {
          const dx = e.clientX - this.mouse.prevX;
          this.mouse.vx = dx;
          this.windLean += dx * 0.05;
        }
        this.mouse.prevX = this.mouse.x;
        this.mouse.prevY = this.mouse.y;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }, { passive: true });

      // Click / Tap Lightning Discharge
      window.addEventListener('click', (e) => {
        // Trigger lightning double flash
        this.triggerLightning(e.clientX, e.clientY);
      });

      // Hold Press Cloudburst Burst
      const startHold = () => {
        this.isHolding = true;
        this.targetBurst = 2.8;
      };
      const endHold = () => {
        this.isHolding = false;
        this.targetBurst = 1.0;
      };

      window.addEventListener('mousedown', (e) => {
        if (e.button === 0) startHold();
      });
      window.addEventListener('mouseup', endHold);
      window.addEventListener('mouseleave', endHold);

      window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          this.mouse.x = t.clientX;
          this.mouse.y = t.clientY;
          startHold();
        }
      }, { passive: true });

      window.addEventListener('touchend', endHold, { passive: true });
    }

    triggerLightning(clickX, clickY) {
      audioEngine.playLightning();
      this.lightning.flashOpacity = 0.75;
      this.lightning.ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(this.width, this.height) * 0.85,
        speed: 18,
        chargeTime: 1.0
      });

      // Secondary echo flash for authentic lightning feel
      setTimeout(() => {
        this.lightning.flashOpacity = Math.max(this.lightning.flashOpacity, 0.45);
      }, 110);
    }

    render() {
      requestAnimationFrame(() => this.render());

      // Ease burst intensity
      this.burstIntensity += (this.targetBurst - this.burstIntensity) * 0.08;

      // Damp wind lean back to center
      this.windLean *= 0.94;

      // Clear with subtle alpha fade for liquid titanium rain trails
      this.ctx.fillStyle = 'rgba(10, 10, 12, 0.28)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Handle lightning ambient flash
      if (this.lightning.flashOpacity > 0.01) {
        this.ctx.fillStyle = `rgba(184, 165, 254, ${this.lightning.flashOpacity * 0.22})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.lightning.flashOpacity *= 0.88;
      }

      // Update & render ripples
      for (let r = this.lightning.ripples.length - 1; r >= 0; r--) {
        const rip = this.lightning.ripples[r];
        rip.radius += rip.speed;
        rip.chargeTime -= 0.02;

        this.ctx.beginPath();
        this.ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(184, 165, 254, ${Math.max(0, rip.chargeTime * 0.35)})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        if (rip.radius > rip.maxRadius || rip.chargeTime <= 0) {
          this.lightning.ripples.splice(r, 1);
        }
      }

      // Parting rain around mouse cursor physics
      const repelDist = 110;
      const repelForce = 6.0;

      const currentLean = Math.max(-25, Math.min(25, this.windLean));

      for (let i = 0; i < this.strands.length; i++) {
        const s = this.strands[i];

        // Normal falling motion
        s.y += s.speed * this.burstIntensity;

        // Interactive cursor parting (like a hand parting digital curtain)
        const dx = s.x - this.mouse.x;
        const dy = s.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < repelDist && dist > 0) {
          const force = (1 - dist / repelDist) * repelForce;
          s.lateralVel += (dx / dist) * force;
        }

        // Apply lateral velocity and damping spring back to baseX
        s.x += s.lateralVel;
        s.lateralVel *= 0.86;
        s.x += (s.baseX - s.x) * 0.05;

        // Wrap around at bottom
        if (s.y > this.height + s.length) {
          s.y = -s.length;
          s.baseX = (s.baseX + (Math.random() - 0.5) * 8) % this.width;
          if (s.baseX < 0) s.baseX += this.width;
          s.x = s.baseX;
        }

        // Render silver rain droplet strand
        const headX = s.x + currentLean;
        const headY = s.y;
        const tailX = s.x;
        const tailY = s.y - s.length;

        // Draw gradient strand
        const grad = this.ctx.createLinearGradient(headX, headY, tailX, tailY);
        grad.addColorStop(0, `rgba(248, 250, 252, ${s.alpha})`);
        grad.addColorStop(0.3, `rgba(226, 232, 240, ${s.alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(184, 165, 254, 0)');

        this.ctx.beginPath();
        this.ctx.moveTo(tailX, tailY);
        this.ctx.lineTo(headX, headY);
        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = 1.35;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Shimmering leading head glow
        this.ctx.fillStyle = `rgba(184, 165, 254, ${Math.min(1, s.alpha * 1.3)})`;
        this.ctx.fillRect(headX - 0.6, headY - 1, 1.2, 2.5);
      }
    }
  }

  // Initialize ArgentCloudburst
  const argentBackground = new ArgentCloudburstCanvas('argentCloudburstCanvas');

  /* ==========================================================================
     3. Originkit Hero-55 Scramble Text Effect (Attribution)
     ========================================================================== */
  class ScrambleText {
    constructor(element) {
      this.el = element;
      if (!this.el) return;
      this.originalText = this.el.getAttribute('data-original') || this.el.innerText;
      this.chars = '░▒▓█0123456789ABCDEF!@#$%&*<>~';
      this.isScrambling = false;
      this.init();
    }

    init() {
      // Trigger initial scramble on load
      setTimeout(() => this.scramble(), 500);

      // Re-trigger on hover
      this.el.addEventListener('mouseenter', () => this.scramble());
    }

    scramble() {
      if (this.isScrambling) return;
      this.isScrambling = true;
      audioEngine.playTone(880, 'sine', 0.08, 0.04);

      let iteration = 0;
      const totalIterations = this.originalText.length * 4;

      const interval = setInterval(() => {
        this.el.innerText = this.originalText
          .split('')
          .map((letter, index) => {
            if (letter === ' ') return ' ';
            if (index < iteration / 4) {
              return this.originalText[index];
            }
            return this.chars[Math.floor(Math.random() * this.chars.length)];
          })
          .join('');

        iteration++;

        if (iteration >= totalIterations) {
          clearInterval(interval);
          this.el.innerText = this.originalText;
          this.isScrambling = false;
        }
      }, 35);
    }
  }

  const scrambleAuthor = document.getElementById('scrambleAuthor');
  let authorScrambler = null;
  if (scrambleAuthor) {
    authorScrambler = new ScrambleText(scrambleAuthor);
  }

  const scrambleReplayBtn = document.getElementById('scrambleReplayBtn');
  if (scrambleReplayBtn && authorScrambler) {
    scrambleReplayBtn.addEventListener('click', () => {
      authorScrambler.scramble();
    });
  }

  /* ==========================================================================
     4. Hypercar Visualizer & Stage Controls
     ========================================================================== */
  const heroStage = document.getElementById('heroStage');
  const hypercarBody = document.getElementById('hypercarBody');
  const activeRearWing = document.getElementById('activeRearWing');
  const aeroSplitter = document.getElementById('aeroSplitter');
  const laserBeamCone = document.getElementById('laserBeamCone');
  const windTunnelOverlay = document.getElementById('windTunnelOverlay');

  // Interactive 3D Parallax tilt on Hero Stage
  if (heroStage && hypercarBody) {
    heroStage.addEventListener('mousemove', (e) => {
      const rect = heroStage.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotY = (x / (rect.width / 2)) * 6.5; // -6.5deg to +6.5deg
      const rotX = -(y / (rect.height / 2)) * 4.0; // -4deg to +4deg
      hypercarBody.style.transform = `perspective(1000px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    });

    heroStage.addEventListener('mouseleave', () => {
      hypercarBody.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }

  // Stage Quick Toggle: Laser Matrix Headlights
  const toggleHeadlightsBtn = document.getElementById('toggleHeadlightsBtn');
  if (toggleHeadlightsBtn && laserBeamCone) {
    toggleHeadlightsBtn.addEventListener('click', () => {
      const isActive = laserBeamCone.classList.toggle('active');
      toggleHeadlightsBtn.classList.toggle('active', isActive);
      audioEngine.playTone( isActive ? 750 : 350, 'sine', 0.12, 0.05);
      showToast(isActive ? 'Laser Matrix Headlights Engaged' : 'Laser Matrix Headlights Off');
    });
  }

  // Stage Quick Toggle: Wind Tunnel Streamlines
  const toggleWindTunnelBtn = document.getElementById('toggleWindTunnelBtn');
  if (toggleWindTunnelBtn && windTunnelOverlay) {
    toggleWindTunnelBtn.addEventListener('click', () => {
      const isActive = windTunnelOverlay.classList.toggle('active');
      toggleWindTunnelBtn.classList.toggle('active', isActive);
      audioEngine.playTone(isActive ? 620 : 400, 'sine', 0.1, 0.05);
      showToast(isActive ? 'Wind Tunnel Flow Simulation Active' : 'Flow Streamlines Hidden');
    });
  }

  // Stage Quick Toggle: Active Aero Mode
  const toggleAeroModeQuick = document.getElementById('toggleAeroModeQuick');
  const quickAeroModeLabel = document.getElementById('quickAeroModeLabel');

  /* ==========================================================================
     5. Livery & Aero Configurator
     ========================================================================== */
  const root = document.documentElement;
  const currentLiveryName = document.getElementById('currentLiveryName');
  const currentFinishName = document.getElementById('currentFinishName');
  const currentAeroState = document.getElementById('currentAeroState');
  const telemetryDownforce = document.getElementById('telemetryDownforce');
  const telemetryDrag = document.getElementById('telemetryDrag');
  const telemetryGForce = document.getElementById('telemetryGForce');
  const telemetryPrice = document.getElementById('telemetryPrice');
  const cfdFrontSplitter = document.getElementById('cfdFrontSplitter');
  const cfdUnderbody = document.getElementById('cfdUnderbody');
  const cfdRearWing = document.getElementById('cfdRearWing');
  const cfdFrontVal = document.getElementById('cfdFrontVal');
  const cfdUnderVal = document.getElementById('cfdUnderVal');
  const cfdRearVal = document.getElementById('cfdRearVal');

  // Color Swatches
  const colorSwatches = document.querySelectorAll('.color-swatch-btn');
  colorSwatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorSwatches.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const p1 = btn.getAttribute('data-p1');
      const p2 = btn.getAttribute('data-p2');
      const p3 = btn.getAttribute('data-p3');
      const name = btn.getAttribute('data-name');

      root.style.setProperty('--livery-primary', p1);
      root.style.setProperty('--livery-secondary', p2);
      root.style.setProperty('--livery-dark', p3);

      if (currentLiveryName) currentLiveryName.innerText = name;
      audioEngine.playTone(540, 'triangle', 0.1, 0.04);
      showToast(`Exterior Livery: ${name}`);
    });
  });

  // Finish Swatches
  const finishBtns = document.querySelectorAll('.finish-btn');
  const carBodywork = document.querySelector('.car-bodywork');
  finishBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      finishBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const finish = btn.getAttribute('data-finish');
      if (currentFinishName) currentFinishName.innerText = btn.innerText;

      if (carBodywork) {
        if (finish === 'gloss') {
          carBodywork.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.25))';
        } else if (finish === 'satin') {
          carBodywork.style.filter = 'contrast(1.1) brightness(0.9)';
        } else if (finish === 'forged') {
          carBodywork.style.filter = 'contrast(1.25) saturate(0.85)';
        }
      }
      audioEngine.playTone(480, 'sine', 0.1, 0.04);
    });
  });

  // Aero Modes (Track Downforce Mode vs V-Max Low-Drag Mode)
  let currentAeroMode = 'track'; // 'track' | 'vmax'

  function setAeroMode(mode) {
    currentAeroMode = mode;
    audioEngine.playModeSwitch();

    const btnTrack = document.getElementById('btnModeTrack');
    const btnVmax = document.getElementById('btnModeVmax');

    if (mode === 'track') {
      if (btnTrack) btnTrack.classList.add('active');
      if (btnVmax) btnVmax.classList.remove('active');

      if (activeRearWing) {
        activeRearWing.classList.remove('vmax-mode');
        activeRearWing.classList.add('track-mode');
      }
      if (aeroSplitter) {
        aeroSplitter.classList.remove('vmax-mode');
        aeroSplitter.classList.add('track-mode');
      }

      if (quickAeroModeLabel) quickAeroModeLabel.innerText = 'TRACK MODE (850 KG)';
      if (currentAeroState) currentAeroState.innerText = 'Active Downforce: 850 KG';
      if (telemetryDownforce) telemetryDownforce.innerText = '850 KG';
      if (telemetryDrag) telemetryDrag.innerText = '0.38 Cd';
      if (telemetryGForce) telemetryGForce.innerText = '2.15 G';

      if (cfdFrontSplitter) cfdFrontSplitter.style.width = '88%';
      if (cfdUnderbody) cfdUnderbody.style.width = '94%';
      if (cfdRearWing) cfdRearWing.style.width = '90%';
      if (cfdFrontVal) cfdFrontVal.innerText = '88%';
      if (cfdUnderVal) cfdUnderVal.innerText = '94%';
      if (cfdRearVal) cfdRearVal.innerText = '90%';

      showToast('Aero Mode: Track Downforce (+28° DRS Angle)');
    } else {
      if (btnTrack) btnTrack.classList.remove('active');
      if (btnVmax) btnVmax.classList.add('active');

      if (activeRearWing) {
        activeRearWing.classList.remove('track-mode');
        activeRearWing.classList.add('vmax-mode');
      }
      if (aeroSplitter) {
        aeroSplitter.classList.remove('track-mode');
        aeroSplitter.classList.add('vmax-mode');
      }

      if (quickAeroModeLabel) quickAeroModeLabel.innerText = 'V-MAX MODE (220 KG)';
      if (currentAeroState) currentAeroState.innerText = 'Active Drag: 0.21 Cd';
      if (telemetryDownforce) telemetryDownforce.innerText = '220 KG';
      if (telemetryDrag) telemetryDrag.innerText = '0.21 Cd';
      if (telemetryGForce) telemetryGForce.innerText = '1.45 G';

      if (cfdFrontSplitter) cfdFrontSplitter.style.width = '35%';
      if (cfdUnderbody) cfdUnderbody.style.width = '60%';
      if (cfdRearWing) cfdRearWing.style.width = '24%';
      if (cfdFrontVal) cfdFrontVal.innerText = '35%';
      if (cfdUnderVal) cfdUnderVal.innerText = '60%';
      if (cfdRearVal) cfdRearVal.innerText = '24%';

      showToast('Aero Mode: V-Max Low-Drag (0° DRS Slice • 380 km/h Unlocked)');
    }
  }

  const btnModeTrack = document.getElementById('btnModeTrack');
  const btnModeVmax = document.getElementById('btnModeVmax');

  if (btnModeTrack) {
    btnModeTrack.addEventListener('click', () => setAeroMode('track'));
  }
  if (btnModeVmax) {
    btnModeVmax.addEventListener('click', () => setAeroMode('vmax'));
  }
  if (toggleAeroModeQuick) {
    toggleAeroModeQuick.addEventListener('click', () => {
      setAeroMode(currentAeroMode === 'track' ? 'vmax' : 'track');
    });
  }

  /* ==========================================================================
     6. Telemetry HUD & Interactive Simulations
     ========================================================================== */
  // Velocity Scrubber & Downforce Dial
  const speedScrubber = document.getElementById('speedScrubber');
  const scrubberSpeedVal = document.getElementById('scrubberSpeedVal');
  const gaugeProgressCircle = document.getElementById('gaugeProgressCircle');
  const gaugeCenterNum = document.getElementById('gaugeCenterNum');
  const gRatioVal = document.getElementById('gRatioVal');
  const gDragVal = document.getElementById('gDragVal');
  const gApexVal = document.getElementById('gApexVal');

  if (speedScrubber) {
    speedScrubber.addEventListener('input', (e) => {
      const speed = parseInt(e.target.value, 10);
      if (scrubberSpeedVal) scrubberSpeedVal.innerText = `${speed} km/h`;

      // Downforce proportional to V^2: D = 850 * (V / 250)^2
      const maxDownforce = 1450;
      const downforceKg = Math.round(850 * Math.pow(speed / 250, 2));

      if (gaugeCenterNum) gaugeCenterNum.innerText = downforceKg;

      // Circle stroke calculation (314 is circumference)
      // 0 kg -> offset 314, 1450 kg -> offset 0
      const pct = Math.min(1, downforceKg / maxDownforce);
      const offset = 314 - 314 * pct;
      if (gaugeProgressCircle) {
        gaugeProgressCircle.style.strokeDashoffset = offset;
      }

      // Live Stats update
      if (gRatioVal) {
        const ratio = (downforceKg / 1750).toFixed(2);
        gRatioVal.innerText = `${ratio}:1`;
      }
      if (gDragVal) {
        const dragN = Math.round(1420 * Math.pow(speed / 250, 1.8));
        gDragVal.innerText = `${dragN.toLocaleString()} N`;
      }
      if (gApexVal) {
        const apexSpeed = Math.round(speed * 0.96);
        gApexVal.innerText = `${apexSpeed} km/h`;
      }
    });
  }

  // Carbon-Ceramic Brake Thermal Simulator
  const btnHoldBrake = document.getElementById('btnHoldBrake');
  const rotorDisc = document.getElementById('rotorDisc');
  const rotorTempReadout = document.getElementById('rotorTempReadout');
  const flBrakeTemp = document.getElementById('flBrakeTemp');
  const rrBrakeTemp = document.getElementById('rrBrakeTemp');
  const brakeTempStatus = document.getElementById('brakeTempStatus');

  let brakeTemp = 180;
  let isBraking = false;
  let brakeInterval = null;

  function updateBrakeTempUI() {
    const rounded = Math.round(brakeTemp);
    if (rotorTempReadout) rotorTempReadout.innerText = `${rounded}°C`;
    if (flBrakeTemp) flBrakeTemp.innerText = `${rounded}°C`;
    if (rrBrakeTemp) rrBrakeTemp.innerText = `${Math.round(rounded * 0.96)}°C`;

    if (rotorDisc) {
      if (brakeTemp > 450) {
        rotorDisc.classList.add('hot');
      } else {
        rotorDisc.classList.remove('hot');
      }
    }

    if (brakeTempStatus) {
      if (brakeTemp > 650) {
        brakeTempStatus.innerText = 'OVERHEAT / BRAKE FADE';
        brakeTempStatus.classList.add('overheat');
      } else if (brakeTemp > 400) {
        brakeTempStatus.innerText = 'OPTIMUM TRACK HEAT';
        brakeTempStatus.classList.remove('overheat');
      } else {
        brakeTempStatus.innerText = 'NORMAL';
        brakeTempStatus.classList.remove('overheat');
      }
    }
  }

  function startBraking() {
    if (isBraking) return;
    isBraking = true;
    audioEngine.playTone(220, 'sawtooth', 0.4, 0.05);

    if (brakeInterval) clearInterval(brakeInterval);
    brakeInterval = setInterval(() => {
      if (brakeTemp < 820) {
        brakeTemp += 14;
        updateBrakeTempUI();
      }
    }, 50);
  }

  function stopBraking() {
    isBraking = false;
    if (brakeInterval) clearInterval(brakeInterval);

    // Natural cooling cycle
    brakeInterval = setInterval(() => {
      if (brakeTemp > 180) {
        brakeTemp -= 8;
        updateBrakeTempUI();
      } else {
        brakeTemp = 180;
        updateBrakeTempUI();
        clearInterval(brakeInterval);
      }
    }, 60);
  }

  if (btnHoldBrake) {
    btnHoldBrake.addEventListener('mousedown', startBraking);
    btnHoldBrake.addEventListener('mouseup', stopBraking);
    btnHoldBrake.addEventListener('mouseleave', stopBraking);

    btnHoldBrake.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startBraking();
    }, { passive: false });
    btnHoldBrake.addEventListener('touchend', stopBraking);
  }

  // Battery Pack Temperature fluctuation simulator
  const pack1 = document.getElementById('pack1Temp');
  const pack2 = document.getElementById('pack2Temp');
  const pack3 = document.getElementById('pack3Temp');
  const pack4 = document.getElementById('pack4Temp');

  setInterval(() => {
    if (pack1) pack1.innerText = `${(32.4 + (Math.random() - 0.5) * 0.4).toFixed(1)}°C`;
    if (pack2) pack2.innerText = `${(33.1 + (Math.random() - 0.5) * 0.4).toFixed(1)}°C`;
    if (pack3) pack3.innerText = `${(34.8 + (Math.random() - 0.5) * 0.4).toFixed(1)}°C`;
    if (pack4) pack4.innerText = `${(35.0 + (Math.random() - 0.5) * 0.4).toFixed(1)}°C`;
  }, 2200);

  /* ==========================================================================
     7. Cockpit & Interior Gallery Viewers
     ========================================================================== */
  const cockpitTabBtns = document.querySelectorAll('.cockpit-tab-btn');
  const cockpitViews = document.querySelectorAll('.cockpit-view-card');

  cockpitTabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      cockpitTabBtns.forEach((t) => t.classList.remove('active'));
      cockpitViews.forEach((v) => v.classList.remove('active'));

      tab.classList.add('active');
      const viewKey = tab.getAttribute('data-view');
      const targetView = document.getElementById(`view-${viewKey}`);
      if (targetView) targetView.classList.add('active');
      audioEngine.playTone(450, 'sine', 0.08, 0.04);
    });
  });

  // Hotspots on Yoke
  const hotspotPins = document.querySelectorAll('.hotspot-pin');
  const hotspotTitle = document.getElementById('hotspotTitle');
  const hotspotDesc = document.getElementById('hotspotDesc');

  hotspotPins.forEach((pin) => {
    pin.addEventListener('click', () => {
      const title = pin.getAttribute('data-title');
      const desc = pin.getAttribute('data-desc');
      if (hotspotTitle) hotspotTitle.innerText = title;
      if (hotspotDesc) hotspotDesc.innerText = desc;
      audioEngine.playTone(720, 'sine', 0.1, 0.05);
    });
  });

  // Stitch Selector
  const stitchButtons = document.querySelectorAll('.stitch-choice-btn');
  const stitchLine = document.getElementById('stitchLine');
  stitchButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      stitchButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const stitchColor = btn.getAttribute('data-stitch');
      if (stitchLine) {
        stitchLine.style.setProperty('--stitch-col', stitchColor);
      }
      audioEngine.playTone(560, 'sine', 0.1, 0.04);
    });
  });

  /* ==========================================================================
     8. VIP Test Drive Booking Modal
     ========================================================================== */
  const bookingModal = document.getElementById('bookingModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const modalTrimName = document.getElementById('modalTrimName');
  const modalTrimPrice = document.getElementById('modalTrimPrice');
  const reservationForm = document.getElementById('reservationForm');
  const modalStepForm = document.getElementById('modalStepForm');
  const modalStepSuccess = document.getElementById('modalStepSuccess');
  const btnCloseSuccessModal = document.getElementById('btnCloseSuccessModal');
  const btnPrintTicket = document.getElementById('btnPrintTicket');
  const driveDateInput = document.getElementById('driveDate');

  // Set min date for test drive (tomorrow)
  if (driveDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    driveDateInput.min = tomorrow.toISOString().split('T')[0];
  }

  function openModal(trimName = 'Nürburgring Track Edition', price = '4.50') {
    if (!bookingModal) return;
    if (modalTrimName) modalTrimName.innerText = trimName;
    if (modalTrimPrice) modalTrimPrice.innerHTML = `&#8377;${price} Cr`;

    modalStepForm.classList.add('active');
    modalStepSuccess.classList.remove('active');
    bookingModal.classList.add('open');
    bookingModal.setAttribute('aria-hidden', 'false');
    audioEngine.playTone(520, 'sine', 0.15, 0.05);
  }

  function closeModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('open');
    bookingModal.setAttribute('aria-hidden', 'true');
  }

  openModalBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const trim = btn.getAttribute('data-trim') || 'Nürburgring Track Edition';
      const price = btn.getAttribute('data-price') || '4.50';
      openModal(trim, price);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeModal();
    });
  }

  // Handle Form Submission
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('clientName').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const phone = document.getElementById('clientPhone').value.trim();
      const city = document.getElementById('showroomCity').value;
      const date = document.getElementById('driveDate').value;
      const slot = document.getElementById('sessionSlot').value;
      const currentTrim = modalTrimName ? modalTrimName.innerText : 'Nürburgring Track Edition';
      const currentPrice = modalTrimPrice ? modalTrimPrice.innerText : '₹4.50 Cr';

      // Generate Pass Serial ID
      const cityCode = city.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const serialId = `APX-2026-${cityCode}-${randomNum}`;

      // Populate Success Pass Ticket
      const ticketSerial = document.getElementById('ticketSerialNum');
      const ticketDriver = document.getElementById('ticketDriverName');
      const ticketTrim = document.getElementById('ticketTrimName');
      const ticketLocation = document.getElementById('ticketLocation');
      const ticketDateSlot = document.getElementById('ticketDateSlot');

      if (ticketSerial) ticketSerial.innerText = serialId;
      if (ticketDriver) ticketDriver.innerText = name;
      if (ticketTrim) ticketTrim.innerText = `${currentTrim} (${currentPrice})`;
      if (ticketLocation) ticketLocation.innerText = city;
      if (ticketDateSlot) ticketDateSlot.innerText = `${date} • ${slot}`;

      // Switch to Ticket view
      modalStepForm.classList.remove('active');
      modalStepSuccess.classList.add('active');

      audioEngine.playSuccessChime();
      showToast(`VIP Pass ${serialId} Issued for ${name}!`);
    });
  }

  if (btnCloseSuccessModal) {
    btnCloseSuccessModal.addEventListener('click', closeModal);
  }

  if (btnPrintTicket) {
    btnPrintTicket.addEventListener('click', () => {
      window.print();
    });
  }

  /* ==========================================================================
     9. Interactive Toast Notifications
     ========================================================================== */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg class="lucide-icon" style="color: var(--color-lavender);"><use href="#icon-activity"></use></svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 320);
    }, 3200);
  }

  /* ==========================================================================
     10. Mobile Menu Navigation
     ========================================================================== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close when clicking nav links
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // Active navigation link highlighting on scroll
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
});
