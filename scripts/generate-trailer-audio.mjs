import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sampleRate = 48000;
const duration = 12;
const channels = 2;
const samples = sampleRate * duration;
const data = Buffer.alloc(samples * channels * 2);
const chordRoots = [73.42, 58.27, 87.31, 65.41];

let seed = 0x5a17;
let filteredNoise = 0;

const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};

const envelope = (time, start, attack, release, length) => {
  if (time < start || time > start + length) return 0;
  const local = time - start;
  return Math.min(1, local / attack, (length - local) / release);
};

const impact = (time, at, strength = 1) => {
  const local = time - at;
  if (local < 0 || local > 1.1) return 0;
  return (
    Math.sin(2 * Math.PI * (54 - local * 17) * local) * Math.exp(-local * 6.4) * 0.7 +
    (random() * 2 - 1) * Math.exp(-local * 18) * 0.22
  ) * strength;
};

const riser = (time, start, length) => {
  const local = time - start;
  if (local < 0 || local > length) return 0;
  const progress = local / length;
  return (random() * 2 - 1) * progress * progress * 0.15 +
    Math.sin(2 * Math.PI * (130 + progress * 620) * local) * progress * 0.045;
};

for (let i = 0; i < samples; i += 1) {
  const time = i / sampleRate;
  const section = Math.min(3, Math.floor(time / 3));
  const root = chordRoots[section];
  const fadeIn = Math.min(1, time / 0.8);
  const fadeOut = Math.min(1, (duration - time) / 0.7);
  const master = Math.max(0, fadeIn * fadeOut);

  filteredNoise = filteredNoise * 0.985 + (random() * 2 - 1) * 0.015;
  const sea = filteredNoise * 0.14 + Math.sin(time * 2.1) * 0.012;
  const pad = (
    Math.sin(2 * Math.PI * root * time) * 0.075 +
    Math.sin(2 * Math.PI * root * 1.5 * time + 0.7) * 0.045 +
    Math.sin(2 * Math.PI * root * 2 * time + 1.4) * 0.025
  ) * (0.55 + 0.45 * Math.sin(Math.PI * ((time % 3) / 3)));
  const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 2 * time)), 12) *
    Math.sin(2 * Math.PI * root * 0.5 * time) * 0.11;

  let signal = sea + pad + pulse;
  signal += impact(time, 0.08, 1.15);
  signal += impact(time, 2.82, 0.88);
  signal += impact(time, 5.62, 1.08);
  signal += impact(time, 8.42, 1.22);
  signal += riser(time, 2.18, 0.64);
  signal += riser(time, 4.98, 0.64);
  signal += riser(time, 7.72, 0.7);

  for (const bell of [9.15, 9.65, 10.18]) {
    const bellEnv = envelope(time, bell, 0.02, 0.8, 1.0);
    signal += Math.sin(2 * Math.PI * 659.25 * (time - bell)) * bellEnv * 0.055;
    signal += Math.sin(2 * Math.PI * 987.77 * (time - bell)) * bellEnv * 0.025;
  }

  const limited = Math.tanh(signal * 1.45) * 0.78 * master;
  const pan = Math.sin(time * 0.73) * 0.1;
  const left = Math.max(-1, Math.min(1, limited * (1 - pan)));
  const right = Math.max(-1, Math.min(1, limited * (1 + pan)));
  data.writeInt16LE(Math.round(left * 32767), i * 4);
  data.writeInt16LE(Math.round(right * 32767), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * channels * 2, 28);
header.writeUInt16LE(channels * 2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

writeFileSync(resolve("public/video/trailer-assets/dreamtide-score.wav"), Buffer.concat([header, data]));
