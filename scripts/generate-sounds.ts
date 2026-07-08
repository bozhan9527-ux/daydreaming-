// 一次性內容產生腳本:純數學合成復古 8-bit 方波音效,寫成 WAV 檔到 assets/sounds/。
// 跟像素美術同一個原則——不依賴外部音檔/AI 生音工具,用波形數學算出來。
// 需要調整音色時直接改這裡的參數重跑:npx tsx scripts/generate-sounds.ts
import { writeFileSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 22050;
const OUTPUT_DIR = join(__dirname, '..', 'assets', 'sounds');

function envelope(i: number, numSamples: number, attackSamples: number, releaseSamples: number): number {
  if (i < attackSamples) return i / attackSamples;
  if (i > numSamples - releaseSamples) return Math.max(0, (numSamples - i) / releaseSamples);
  return 1;
}

function squareTone(freq: number, durationMs: number, volume: number, attackMs = 4, releaseMs = 15): Float32Array {
  const numSamples = Math.round((SAMPLE_RATE * durationMs) / 1000);
  const attackSamples = Math.round((SAMPLE_RATE * attackMs) / 1000);
  const releaseSamples = Math.round((SAMPLE_RATE * releaseMs) / 1000);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const wave = Math.sign(Math.sin(2 * Math.PI * freq * t)) || 1;
    samples[i] = wave * envelope(i, numSamples, attackSamples, releaseSamples) * volume;
  }
  return samples;
}

// 連續變頻方波(用相位累加確保頻率滑動時波形不斷裂),用於升級的音高上揚感。
function sweepTone(freqStart: number, freqEnd: number, durationMs: number, volume: number, attackMs = 4, releaseMs = 20): Float32Array {
  const numSamples = Math.round((SAMPLE_RATE * durationMs) / 1000);
  const attackSamples = Math.round((SAMPLE_RATE * attackMs) / 1000);
  const releaseSamples = Math.round((SAMPLE_RATE * releaseMs) / 1000);
  const samples = new Float32Array(numSamples);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const freq = freqStart + (freqEnd - freqStart) * progress;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const wave = Math.sign(Math.sin(phase)) || 1;
    samples[i] = wave * envelope(i, numSamples, attackSamples, releaseSamples) * volume;
  }
  return samples;
}

function silence(durationMs: number): Float32Array {
  return new Float32Array(Math.round((SAMPLE_RATE * durationMs) / 1000));
}

function concat(...parts: Float32Array[]): Float32Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeWav(samples: Float32Array): Buffer {
  const blockAlign = 2;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

const SOUNDS: Record<string, Float32Array> = {
  'click.wav': squareTone(900, 50, 0.25, 3, 15),
  'event-common.wav': squareTone(500, 90, 0.3, 5, 20),
  'event-rare.wav': concat(squareTone(600, 90, 0.32), silence(10), squareTone(800, 90, 0.32)),
  'event-epic.wav': concat(
    squareTone(600, 80, 0.34),
    silence(10),
    squareTone(800, 80, 0.34),
    silence(10),
    squareTone(1000, 90, 0.34)
  ),
  'event-legendary.wav': concat(
    squareTone(600, 80, 0.36),
    silence(8),
    squareTone(800, 80, 0.36),
    silence(8),
    squareTone(1000, 80, 0.36),
    silence(8),
    squareTone(1300, 120, 0.36),
    sweepTone(1300, 1600, 100, 0.3)
  ),
  'level-up.wav': concat(sweepTone(400, 900, 200, 0.3), silence(20), squareTone(1200, 150, 0.34)),
  'skill-upgrade.wav': concat(squareTone(750, 60, 0.28), silence(40), squareTone(750, 60, 0.28)),
};

for (const [filename, samples] of Object.entries(SOUNDS)) {
  const wav = encodeWav(samples);
  writeFileSync(join(OUTPUT_DIR, filename), wav);
  const durationMs = Math.round((samples.length / SAMPLE_RATE) * 1000);
  console.log(`${filename}: ${durationMs}ms, ${wav.length} bytes`);
}
