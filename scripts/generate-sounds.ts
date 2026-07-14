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

// 三角波:比方波(下面 squareTone 用的 Math.sign)柔和很多,拿來當BGM的貝斯/長音,
// 不然連續循環播放一段方波旋律聽久了會刺耳。
function triangleTone(freq: number, durationMs: number, volume: number, attackMs = 8, releaseMs = 30): Float32Array {
  const numSamples = Math.round((SAMPLE_RATE * durationMs) / 1000);
  const attackSamples = Math.round((SAMPLE_RATE * attackMs) / 1000);
  const releaseSamples = Math.round((SAMPLE_RATE * releaseMs) / 1000);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const phase = ((freq * i) / SAMPLE_RATE) % 1;
    const wave = 4 * Math.abs(phase - 0.5) - 1;
    samples[i] = wave * envelope(i, numSamples, attackSamples, releaseSamples) * volume;
  }
  return samples;
}

// 窄脈衝波(duty 25%):比 50% 方波亮一點但沒那麼刺耳,拿來當BGM主旋律的音色,
// 跟既有事件音效的 squareTone 音色刻意做出區隔,不會讓玩家把BGM誤聽成連續觸發事件音。
function pulseTone(freq: number, durationMs: number, volume: number, duty = 0.25, attackMs = 6, releaseMs = 25): Float32Array {
  const numSamples = Math.round((SAMPLE_RATE * durationMs) / 1000);
  const attackSamples = Math.round((SAMPLE_RATE * attackMs) / 1000);
  const releaseSamples = Math.round((SAMPLE_RATE * releaseMs) / 1000);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const phase = ((freq * i) / SAMPLE_RATE) % 1;
    const wave = phase < duty ? 1 : -1;
    samples[i] = wave * envelope(i, numSamples, attackSamples, releaseSamples) * volume;
  }
  return samples;
}

// 疊加多條同時發聲的軌道(旋律+貝斯),不是首尾相接——用來合成BGM的和聲。
function mix(...tracks: Float32Array[]): Float32Array {
  const length = Math.max(...tracks.map((track) => track.length));
  const out = new Float32Array(length);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i++) out[i] += track[i];
  }
  return out;
}

// 音名對應頻率(十二平均律,A4=440Hz)。
const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25,
};

const BGM_BPM = 96;
const BEAT_MS = 60000 / BGM_BPM;

// [音名, 拍數] 的序列轉成一整條音軌;REST 是休止符(純靜音,不發聲),拍數可以是小數
// (例如半拍0.5)。toneFn 決定這條音軌的音色(旋律用 pulseTone,貝斯用 triangleTone)。
function melodyTrack(
  sequence: [string, number][],
  toneFn: (freq: number, durationMs: number, volume: number) => Float32Array,
  volume: number
): Float32Array {
  return concat(
    ...sequence.map(([name, beats]) =>
      name === 'REST' ? silence(beats * BEAT_MS) : toneFn(NOTE_FREQ[name], beats * BEAT_MS, volume)
    )
  );
}

// 8小節、悠閒步調的循環主題,呼應「勇者發呆中」放置遊戲慵懶不緊繃的調性——五聲音階為主的
// 旋律線(pulseTone,音量刻意壓低不搶戲)配上每小節一個根音的三角波貝斯(triangleTone,
// I-V-vi-IV走向,第8小節拆成兩個半音符做出回到第1小節根音C3的終止式)。旋律/貝斯總拍數
// 都是32拍(8小節x4拍),長度對齊才能疊出正確的和聲、迴圈銜接處也不會突然錯拍。
const BGM_MELODY: [string, number][] = [
  ['E4', 1], ['G4', 1], ['A4', 1], ['G4', 1],
  ['E4', 1], ['D4', 1], ['C4', 2],
  ['A4', 1], ['C5', 1], ['D5', 1], ['C5', 1],
  ['A4', 1], ['G4', 1], ['E4', 2],
  ['G4', 1], ['E4', 1], ['D4', 1], ['E4', 1],
  ['C4', 1], ['D4', 1], ['E4', 2],
  ['G4', 1], ['A4', 1], ['G4', 1], ['E4', 1],
  ['D4', 1], ['C4', 2], ['REST', 1],
];

const BGM_BASS: [string, number][] = [
  ['C3', 4],
  ['G3', 4],
  ['A3', 4],
  ['F3', 4],
  ['C3', 4],
  ['G3', 4],
  ['A3', 4],
  ['F3', 2], ['G3', 2],
];

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
  'bgm.wav': mix(
    melodyTrack(BGM_MELODY, pulseTone, 0.09),
    melodyTrack(BGM_BASS, triangleTone, 0.07)
  ),
};

for (const [filename, samples] of Object.entries(SOUNDS)) {
  const wav = encodeWav(samples);
  writeFileSync(join(OUTPUT_DIR, filename), wav);
  const durationMs = Math.round((samples.length / SAMPLE_RATE) * 1000);
  console.log(`${filename}: ${durationMs}ms, ${wav.length} bytes`);
}
