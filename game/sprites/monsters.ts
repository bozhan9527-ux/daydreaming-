// 怪物像素美術,跟 heroSilhouette.ts 同一套「半寬參數 + 中心對稱」產生手法,
// 差別是每種怪物的半寬序列(rows)手工設計,做出不同輪廓,而不是共用同一套身體。
export interface MonsterRowSpec {
  halfWidth: number;
  fill: string;
  eyes?: boolean;
}

interface MonsterVisualSpec {
  width: number;
  centerLeft: number;
  centerRight: number;
  outline: string;
  rows: (MonsterRowSpec | null)[];
  palette: Record<string, string>;
}

function buildRow(width: number, centerLeft: number, centerRight: number, spec: MonsterRowSpec | null, outline: string): string {
  if (spec === null) return '.'.repeat(width);
  // 每個 cell 只能塞一個字元,palette key 一定要是單一字元,不然拼出來的 row 長度會跑掉。
  if (spec.fill.length !== 1) throw new Error(`fill must be a single character, got "${spec.fill}"`);
  if (outline.length !== 1) throw new Error(`outline must be a single character, got "${outline}"`);
  const cells = new Array(width).fill('.');
  const fillLeft = centerLeft - spec.halfWidth + 1;
  const fillRight = centerRight + spec.halfWidth - 1;
  for (let c = fillLeft; c <= fillRight; c++) cells[c] = spec.fill;
  if (fillLeft - 1 >= 0) cells[fillLeft - 1] = outline;
  if (fillRight + 1 < width) cells[fillRight + 1] = outline;
  if (spec.eyes && spec.halfWidth >= 2) {
    cells[fillLeft + 1] = outline;
    cells[fillRight - 1] = outline;
  }
  return cells.join('');
}

function buildMonsterFrame(spec: MonsterVisualSpec): { frame: string[]; palette: Record<string, string> } {
  const frame = spec.rows.map((row) => buildRow(spec.width, spec.centerLeft, spec.centerRight, row, spec.outline));
  return { frame, palette: spec.palette };
}

const K = 'K'; // 預設外框色,深灰,跟勇者身上的 K 同色階

const MONSTER_VISUALS: Record<string, MonsterVisualSpec> = {
  slime: {
    width: 12,
    centerLeft: 5,
    centerRight: 6,
    outline: K,
    palette: { K: '#3a3542', G: '#8a9a86' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'G' },
      { halfWidth: 4, fill: 'G' },
      { halfWidth: 5, fill: 'G', eyes: true },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 4, fill: 'G' },
      { halfWidth: 2, fill: 'G' },
      null,
      null,
    ],
  },
  bat: {
    width: 12,
    centerLeft: 5,
    centerRight: 6,
    outline: K,
    palette: { K: '#3a3542', B: '#6b6678', W: '#4a4456' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'B', eyes: true },
      { halfWidth: 5, fill: 'W' },
      { halfWidth: 6, fill: 'W' },
      { halfWidth: 4, fill: 'W' },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      null,
      null,
      null,
      null,
    ],
  },
  goblin: {
    width: 14,
    centerLeft: 6,
    centerRight: 7,
    outline: K,
    palette: { K: '#3a3542', S: '#7a8a6a' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'S' },
      { halfWidth: 2, fill: 'S', eyes: true },
      { halfWidth: 1, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 3, fill: 'S' },
      { halfWidth: 2, fill: 'S' },
      { halfWidth: 2, fill: 'S' },
      null,
      null,
      null,
    ],
  },
  mushroom: {
    width: 14,
    centerLeft: 6,
    centerRight: 7,
    outline: K,
    palette: { K: '#3a3542', C: '#a05a52', T: '#c9c4b0' },
    rows: [
      null,
      null,
      { halfWidth: 5, fill: 'C' },
      { halfWidth: 6, fill: 'C', eyes: true },
      { halfWidth: 6, fill: 'C' },
      { halfWidth: 4, fill: 'C' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      null,
      null,
      null,
      null,
    ],
  },
  skeleton: {
    width: 16,
    centerLeft: 7,
    centerRight: 8,
    outline: K,
    palette: { K: '#3a3542', B: '#d9c9b8' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 3, fill: 'B', eyes: true },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 1, fill: 'B' },
      { halfWidth: 4, fill: 'B' },
      { halfWidth: 4, fill: 'B' },
      { halfWidth: 3, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      null,
      null,
      null,
      null,
    ],
  },
  golem: {
    width: 16,
    centerLeft: 7,
    centerRight: 8,
    outline: K,
    palette: { K: '#3a3542', S: '#8b8698' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'S' },
      { halfWidth: 5, fill: 'S', eyes: true },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      null,
      null,
      null,
      null,
      null,
    ],
  },
  dragon: {
    width: 20,
    centerLeft: 9,
    centerRight: 10,
    outline: 'Y',
    palette: { Y: '#c9a94f', D: '#6b4a4a', W: '#4a3a3a' },
    rows: [
      null,
      null,
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 3, fill: 'D', eyes: true },
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 7, fill: 'W' },
      { halfWidth: 8, fill: 'W' },
      { halfWidth: 6, fill: 'W' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 4, fill: 'D' },
      { halfWidth: 3, fill: 'D' },
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 1, fill: 'D' },
      null,
      null,
      null,
      null,
      null,
    ],
  },
};

export type MonsterSpriteId = keyof typeof MONSTER_VISUALS;

export interface MonsterFrameData {
  frame: string[];
  palette: Record<string, string>;
}

export function getMonsterFrame(id: string): MonsterFrameData {
  const spec = MONSTER_VISUALS[id];
  if (!spec) throw new Error(`No monster visual defined for id: ${id}`);
  return buildMonsterFrame(spec);
}

export function hasMonsterVisual(id: string): boolean {
  return id in MONSTER_VISUALS;
}
