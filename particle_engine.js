/**
 * Particle Engine — shared Lottie particle generation module.
 * Works in both Node.js (require) and browser (window.ParticleEngine).
 */
(function (exports) {
  'use strict';

  var DEFAULT_CONFIG = {
    particles: 400,
    turbulence: 6.5,
    speed: 0.5,
    size: 4,
    windx: -12,
    windy: 0,
    gravity: 0,
    life: 2,
    emit: 3,
    velrand: 50,
    sweepx: 100,
    sweepy: 0,
    duration: 8,
    drag: 0.97,
    fps: 30,
    canvasWidth: 1920,
    canvasHeight: 1080,
    burstMode: false,
    loopingMode: false,
    emitterShape: 'point',
    emitterShapeWidth: 200,
    emitterShapeHeight: 200,
    particleShape: 'circle',
    sizeOverLifetime: 'none',
    spinMin: 0,
    spinMax: 0,
    keyframeSample: 3,
    colors: [
      [1, 1, 1, 1],
      [1, 0.92, 0.23, 1],
      [1, 0.76, 0.03, 1],
      [1, 0.88, 0.51, 1],
      [0.51, 0.83, 0.98, 1],
      [0.88, 0.75, 0.91, 1]
    ]
  };

  /* ── Emitter spawn position ─────────────────────────────── */

  function getSpawnPosition(config, emitProgress) {
    var cx = config.canvasWidth / 2;
    var cy = config.canvasHeight / 2;

    var sweepOffX = 0, sweepOffY = 0;
    if (config.emit > 0 && !config.burstMode) {
      if (config.sweepx) sweepOffX = emitProgress * config.sweepx - config.sweepx / 2;
      if (config.sweepy) sweepOffY = emitProgress * config.sweepy - config.sweepy / 2;
    }

    var x, y, angle, r;
    switch (config.emitterShape) {
      case 'line':
        x = cx + sweepOffX + (Math.random() - 0.5) * config.emitterShapeWidth;
        y = cy + sweepOffY;
        break;
      case 'circle':
        angle = Math.random() * Math.PI * 2;
        r = Math.sqrt(Math.random()) * (config.emitterShapeWidth / 2);
        x = cx + sweepOffX + Math.cos(angle) * r;
        y = cy + sweepOffY + Math.sin(angle) * r;
        break;
      case 'rectangle':
        x = cx + sweepOffX + (Math.random() - 0.5) * config.emitterShapeWidth;
        y = cy + sweepOffY + (Math.random() - 0.5) * config.emitterShapeHeight;
        break;
      default: // point
        x = cx + sweepOffX + (Math.random() * 40 - 20);
        y = cy + sweepOffY + (Math.random() * 40 - 20);
        break;
    }
    return [x, y];
  }

  /* ── Shape factory ──────────────────────────────────────── */

  function createShapeItem(type, size) {
    switch (type) {
      case 'square':
        return {
          ty: 'rc',
          d: 1,
          p: { a: 0, k: [0, 0], ix: 3 },
          s: { a: 0, k: [size, size], ix: 2 },
          r: { a: 0, k: 0, ix: 7 },
          nm: 'Rectangle Path 1',
          mn: 'ADBE Vector Shape - Rect'
        };
      case 'triangle':
        return {
          ty: 'sr',
          d: 1,
          sy: 2, // polygon
          p: { a: 0, k: [0, 0], ix: 3 },
          or: { a: 0, k: size / 2, ix: 4 },
          os: { a: 0, k: 0, ix: 5 },
          pt: { a: 0, k: 3, ix: 6 },
          r: { a: 0, k: 0, ix: 7 },
          nm: 'Triangle Path 1',
          mn: 'ADBE Vector Shape - Star'
        };
      case 'star':
        return {
          ty: 'sr',
          d: 1,
          sy: 1, // star
          p: { a: 0, k: [0, 0], ix: 3 },
          or: { a: 0, k: size / 2, ix: 4 },
          os: { a: 0, k: 0, ix: 5 },
          ir: { a: 0, k: size * 0.2, ix: 6 },
          is: { a: 0, k: 0, ix: 7 },
          pt: { a: 0, k: 5, ix: 8 },
          r: { a: 0, k: 0, ix: 9 },
          nm: 'Star Path 1',
          mn: 'ADBE Vector Shape - Star'
        };
      default:
        // circle
        return {
          ty: 'el',
          d: 1,
          p: { a: 0, k: [0, 0], ix: 3 },
          s: { a: 0, k: [size, size], ix: 2 },
          nm: 'Ellipse Path 1',
          mn: 'ADBE Vector Shape - Ellipse'
        };
    }
  }

  /* ── Scale-over-lifetime presets ─────────────────────────── */

  function buildScaleKeys(start, end, life, preset) {
    var mid1, mid2, mid3;
    switch (preset) {
      case 'grow':
        return [
          { t: start, s: [30, 30, 100], e: [100, 100, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: end, s: [100, 100, 100] }
        ];
      case 'shrink':
        return [
          { t: start, s: [100, 100, 100], e: [20, 20, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: end, s: [20, 20, 100] }
        ];
      case 'pulse':
        mid1 = start + Math.floor(life * 0.25);
        mid2 = start + Math.floor(life * 0.5);
        mid3 = start + Math.floor(life * 0.75);
        return [
          { t: start, s: [0, 0, 100], e: [120, 120, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: mid1, s: [120, 120, 100], e: [60, 60, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: mid2, s: [60, 60, 100], e: [120, 120, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: mid3, s: [120, 120, 100], e: [0, 0, 100], i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] } },
          { t: end, s: [0, 0, 100] }
        ];
      default:
        // none — fade-in / hold / fade-out
        return [
          { t: start, s: [0, 0, 100], e: [100, 100, 100], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
          { t: start + Math.min(15, Math.floor(life * 0.15)), s: [100, 100, 100], e: [100, 100, 100], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
          { t: end - Math.min(15, Math.floor(life * 0.2)), s: [100, 100, 100], e: [0, 0, 100], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
          { t: end, s: [0, 0, 100] }
        ];
    }
  }

  /* ── Main generation ────────────────────────────────────── */

  function buildLottieJSON(userConfig) {
    var config = {};
    var key;
    for (key in DEFAULT_CONFIG) {
      config[key] = userConfig && userConfig[key] !== undefined ? userConfig[key] : DEFAULT_CONFIG[key];
    }

    var width = config.canvasWidth;
    var height = config.canvasHeight;
    var fps = config.fps;
    var duration = config.duration;
    var frames = Math.floor(fps * duration);
    var numParticles = Math.max(1, Math.floor(config.particles));
    var fpsNorm = 30 / fps; // normalise physics to 30-fps baseline
    var sampleRate = Math.max(1, Math.floor(config.keyframeSample));

    var layers = [];

    for (var i = 0; i < numParticles; i++) {
      var angle = Math.random() * Math.PI * 2;

      // Velocity randomness
      var randomFactor = (Math.random() * 2 - 1) * (config.velrand / 100);
      var initialSpeed = Math.max(0.1, config.speed * (1 + randomFactor));

      // Timing
      var start_time, life_time;
      if (config.loopingMode) {
        start_time = Math.floor((i / numParticles) * frames);
        var maxLife = Math.floor(config.life * fps);
        life_time = Math.floor(maxLife * 0.6 + Math.random() * maxLife * 0.4);
        if (start_time + life_time > frames) life_time = frames - start_time;
      } else if (config.burstMode) {
        start_time = 0;
        life_time = Math.floor(config.life * 0.4 * fps + Math.random() * config.life * 0.6 * fps);
      } else {
        start_time = Math.floor(Math.random() * (fps * config.emit));
        life_time = Math.floor(config.life * 0.4 * fps + Math.random() * config.life * 0.6 * fps);
      }

      var end_time = Math.min(start_time + life_time, frames);
      life_time = end_time - start_time;
      if (life_time < 2) continue;

      var color = config.colors[Math.floor(Math.random() * config.colors.length)];
      var size = config.size * 0.2 + Math.random() * config.size;

      // Spawn position
      var emitProgress =
        !config.burstMode && config.emit > 0 && start_time > 0
          ? start_time / (fps * config.emit)
          : 0;
      var spawn = getSpawnPosition(config, emitProgress);
      var curr_x = spawn[0];
      var curr_y = spawn[1];

      // Turbulence noise seeds
      var noise_offset_x = Math.random() * 1000;
      var noise_offset_y = Math.random() * 1000;
      var freq1 = 0.1 + Math.random() * 0.15;
      var freq2 = 0.1 + Math.random() * 0.15;

      var current_gravity = 0;
      var pos_keyframes = [];

      for (var f = start_time; f <= end_time; f++) {
        var timeOffset = f - start_time;
        var turb_x =
          (Math.sin(timeOffset * freq1 + noise_offset_x) +
            Math.cos(timeOffset * freq2 + noise_offset_y)) *
          config.turbulence;
        var turb_y =
          (Math.cos(timeOffset * freq1 + noise_offset_x) +
            Math.sin(timeOffset * freq2 + noise_offset_y)) *
          config.turbulence;

        var currentSpeed = initialSpeed * Math.pow(config.drag, timeOffset * fpsNorm);
        current_gravity += config.gravity * 0.05 * fpsNorm;

        curr_x += Math.cos(angle) * currentSpeed + turb_x + config.windx;
        curr_y += Math.sin(angle) * currentSpeed + turb_y + config.windy + current_gravity;

        // Sample at specified rate, always first + last
        if (f === start_time || f === end_time || (f - start_time) % sampleRate === 0) {
          pos_keyframes.push({ t: f, s: [curr_x, curr_y, 0] });
        }
      }

      // Format position keyframes
      var posKeys;
      if (sampleRate <= 1) {
        posKeys = pos_keyframes.map(function (k) {
          return { t: k.t, s: k.s, h: 1 };
        });
      } else {
        posKeys = pos_keyframes.map(function (k, idx) {
          if (idx === pos_keyframes.length - 1) return { t: k.t, s: k.s };
          return {
            t: k.t,
            s: k.s,
            e: pos_keyframes[idx + 1].s,
            i: { x: [1], y: [1] },
            o: { x: [0], y: [0] }
          };
        });
      }

      // Scale
      var scaleKeys = buildScaleKeys(start_time, end_time, life_time, config.sizeOverLifetime);

      // Opacity
      var fadeIn = Math.min(10, Math.floor(life_time * 0.15));
      var fadeOut = Math.min(15, Math.floor(life_time * 0.2));
      var opacityKeys = [
        { t: start_time, s: [0], e: [100], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
        { t: start_time + fadeIn, s: [100], e: [100], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
        { t: end_time - fadeOut, s: [100], e: [0], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
        { t: end_time, s: [0] }
      ];

      // Rotation / spin
      var rotationProp;
      var spinRate = config.spinMin + Math.random() * (config.spinMax - config.spinMin);
      if (spinRate !== 0) {
        var totalRotation = spinRate * (life_time / fps);
        rotationProp = {
          a: 1,
          k: [
            {
              t: start_time,
              s: [0],
              e: [totalRotation],
              i: { x: [1], y: [1] },
              o: { x: [0], y: [0] }
            },
            { t: end_time, s: [totalRotation] }
          ],
          ix: 10
        };
      } else {
        rotationProp = { a: 0, k: 0, ix: 10 };
      }

      // Shape
      var shapeItem = createShapeItem(config.particleShape, size);

      layers.push({
        ty: 4,
        nm: 'Particle_' + i,
        sr: 1,
        st: start_time,
        op: end_time,
        ip: start_time,
        ind: i + 1,
        ks: {
          o: { a: 1, k: opacityKeys, ix: 11 },
          r: rotationProp,
          p: { a: 1, k: posKeys, ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 1, k: scaleKeys, ix: 6 }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              shapeItem,
              {
                ty: 'fl',
                c: { a: 0, k: color, ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill'
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                sk: { a: 0, k: 0, ix: 4 },
                sa: { a: 0, k: 0, ix: 5 },
                nm: 'Transform'
              }
            ],
            nm: 'Shape Group',
            np: 3,
            cix: 2,
            ix: 1,
            mn: 'ADBE Vector Group'
          }
        ],
        ao: 0
      });
    }

    return {
      v: '5.7.4',
      fr: fps,
      ip: 0,
      op: frames,
      w: width,
      h: height,
      nm: 'Turbulent Particle Emitter',
      ddd: 0,
      assets: [],
      layers: layers
    };
  }

  exports.buildLottieJSON = buildLottieJSON;
  exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
})(
  typeof module !== 'undefined' && module.exports
    ? module.exports
    : (window.ParticleEngine = {})
);
