#!/usr/bin/env node
/**
 * CLI Lottie particle generator.
 *
 * Usage:
 *   node generate_lottie.js                        # uses defaults
 *   node generate_lottie.js --config preset.json    # uses config file
 *   node generate_lottie.js -o my_animation.json    # custom output path
 */
const fs = require('fs');
const engine = require('./particle_engine');

// Parse CLI args
const args = process.argv.slice(2);
let configPath = null;
let outputPath = 'particle_animation.json';

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--config' || args[i] === '-c') && args[i + 1]) {
    configPath = args[++i];
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputPath = args[++i];
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`Usage: node generate_lottie.js [options]

Options:
  --config, -c <file>   JSON config file (see DEFAULT_CONFIG for fields)
  --output, -o <file>   Output path (default: particle_animation.json)
  --help, -h            Show this help

Config fields (all optional, defaults shown):
${JSON.stringify(engine.DEFAULT_CONFIG, null, 2)}`);
    process.exit(0);
  }
}

// Load config
let userConfig = {};
if (configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    userConfig = JSON.parse(raw);
    console.log('Loaded config from', configPath);
  } catch (err) {
    console.error('Failed to read config:', err.message);
    process.exit(1);
  }
}

// Generate
const lottieData = engine.buildLottieJSON(userConfig);
fs.writeFileSync(outputPath, JSON.stringify(lottieData));

const sizeMB = (Buffer.byteLength(JSON.stringify(lottieData)) / 1024 / 1024).toFixed(2);
console.log(`Created ${outputPath} (${sizeMB} MB, ${lottieData.layers.length} particles, ${lottieData.fr}fps, ${lottieData.op} frames)`);
