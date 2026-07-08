export type BodyType = 'thin' | 'normal' | 'fat';

// 厭世莫蘭迪調色盤,對應 CLAUDE.md「像素美術規格」章節。
export const HERO_PALETTE: Record<string, string> = {
  K: '#3a3542',
  H: '#7a7488',
  S: '#d9c9b8',
  T: '#8b8698',
  D: '#6b6678',
  B: '#5c5468',
  P: '#4a4456',
  O: '#38323f',
};

const BODY_PRESETS: Record<BodyType, { head: number; body: number }> = {
  thin: { head: 3, body: 2 },
  normal: { head: 4, body: 4 },
  fat: { head: 6, body: 6 },
};

const PADDED_WIDTH = 20;
const CENTER_LEFT = 9;
const CENTER_RIGHT = 10;

function buildRow(halfWidth: number, fillChar: string, withEyes: boolean): string {
  const cells = new Array(PADDED_WIDTH).fill('.');
  const fillLeft = CENTER_LEFT - halfWidth + 1;
  const fillRight = CENTER_RIGHT + halfWidth - 1;
  for (let c = fillLeft; c <= fillRight; c++) cells[c] = fillChar;
  cells[fillLeft - 1] = 'K';
  cells[fillRight + 1] = 'K';
  if (withEyes) {
    cells[fillLeft + 1] = 'K';
    cells[fillRight - 1] = 'K';
  }
  return cells.join('');
}

function buildSilhouette(headHalfWidth: number, bodyHalfWidth: number): string[] {
  // 臉部半寬下限為 3,確保雙眼像素間留至少 1 格鼻樑間距。
  const faceHalfWidth = Math.max(3, headHalfWidth - 1);
  const legHalfWidth = Math.max(1, bodyHalfWidth - 1);
  const blank = '.'.repeat(PADDED_WIDTH);

  return [
    blank,
    blank,
    buildRow(headHalfWidth, 'H', false),
    buildRow(headHalfWidth, 'H', false),
    buildRow(faceHalfWidth, 'S', false),
    buildRow(faceHalfWidth, 'S', true),
    buildRow(faceHalfWidth, 'S', false),
    buildRow(faceHalfWidth, 'S', false),
    buildRow(2, 'K', false),
    buildRow(bodyHalfWidth, 'T', false),
    buildRow(bodyHalfWidth, 'T', false),
    buildRow(bodyHalfWidth, 'T', false),
    buildRow(bodyHalfWidth, 'D', false),
    buildRow(bodyHalfWidth, 'T', false),
    buildRow(bodyHalfWidth, 'B', false),
    buildRow(legHalfWidth, 'P', false),
    buildRow(legHalfWidth, 'P', false),
    buildRow(legHalfWidth, 'P', false),
    buildRow(legHalfWidth, 'O', false),
    buildRow(legHalfWidth, 'O', false),
    blank,
    blank,
    blank,
    blank,
  ];
}

function blinkFrame(frame: string[]): string[] {
  const faceRowIndex = 5;
  const openRow = frame[4];
  return frame.map((row, i) => (i === faceRowIndex ? openRow : row));
}

export interface HeroFrames {
  open: string[];
  blink: string[];
}

export function buildHeroFrames(bodyType: BodyType): HeroFrames {
  const preset = BODY_PRESETS[bodyType];
  const open = buildSilhouette(preset.head, preset.body);
  return { open, blink: blinkFrame(open) };
}
