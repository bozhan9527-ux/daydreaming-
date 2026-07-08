import { Rarity } from '../trigger';

const CANVAS = 12;
const CENTER_L = 5;
const CENTER_R = 6;

// 稀有度越高,十字閃光的臂寬越粗、顏色越亮。
const RARITY_THICKNESS: Record<Rarity, number> = { common: 1, rare: 2, epic: 3, legendary: 4 };
const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b8698',
  rare: '#6ab0e0',
  epic: '#b389e0',
  legendary: '#e8c25a',
};

function buildIconRow(rowIndex: number, thickness: number): string {
  const cells = new Array(CANVAS).fill('.');
  const bandStart = CENTER_L - thickness + 1;
  const bandEnd = CENTER_R + thickness - 1;
  const inBand = rowIndex >= bandStart && rowIndex <= bandEnd;

  if (inBand) {
    for (let c = 0; c < CANVAS; c++) cells[c] = 'X';
  } else {
    for (let c = bandStart; c <= bandEnd; c++) cells[c] = 'X';
  }
  return cells.join('');
}

function buildIconFrame(thickness: number): string[] {
  const rows: string[] = [];
  for (let r = 0; r < CANVAS; r++) rows.push(buildIconRow(r, thickness));
  return rows;
}

export interface EventIconData {
  frame: string[];
  palette: Record<string, string>;
}

export function getEventIcon(rarity: Rarity): EventIconData {
  const thickness = RARITY_THICKNESS[rarity];
  return {
    frame: buildIconFrame(thickness),
    palette: { X: RARITY_COLOR[rarity] },
  };
}
