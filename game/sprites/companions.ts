// 寵物/坐騎像素美術:跟怪物不同,這裡每種(pet/mount)共用同一個剪影,
// 稀有度只影響尺寸(越稀有越大隻)和顏色(沿用事件圖示的稀有度色階),不是每隻都畫獨立造型——
// 8 隻寵物+坐騎全部手工畫獨立剪影的美術成本跟目前架構驗證階段不成比例,先用這個簡化版。
import { Rarity } from '../trigger';
import { CompanionKind } from '../companions';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b8698',
  rare: '#6ab0e0',
  epic: '#b389e0',
  legendary: '#e8c25a',
};

const RARITY_SCALE: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 1,
  legendary: 2,
};

const K = 'K';

interface RowSpec {
  halfWidth: number;
}

function buildRow(width: number, centerLeft: number, centerRight: number, spec: RowSpec | null, fill: string): string {
  if (spec === null) return '.'.repeat(width);
  const cells = new Array(width).fill('.');
  const fillLeft = centerLeft - spec.halfWidth + 1;
  const fillRight = centerRight + spec.halfWidth - 1;
  for (let c = fillLeft; c <= fillRight; c++) cells[c] = fill;
  if (fillLeft - 1 >= 0) cells[fillLeft - 1] = K;
  if (fillRight + 1 < width) cells[fillRight + 1] = K;
  return cells.join('');
}

// 寵物:圓潤小獸剪影,稀有度越高整體半寬 +scale。
function buildPetFrame(scale: number, fill: string): string[] {
  const width = 10;
  const centerLeft = 4;
  const centerRight = 5;
  const rows: (RowSpec | null)[] = [
    null,
    { halfWidth: 1 + scale },
    { halfWidth: 2 + scale },
    { halfWidth: 2 + scale },
    { halfWidth: 1 + scale },
    null,
  ];
  return rows.map((row) => buildRow(width, centerLeft, centerRight, row, fill));
}

// 坐騎:扁寬身形剪影(省略獨立四肢),稀有度越高整體半寬 +scale。
function buildMountFrame(scale: number, fill: string): string[] {
  const width = 14;
  const centerLeft = 6;
  const centerRight = 7;
  const rows: (RowSpec | null)[] = [
    null,
    { halfWidth: 2 + scale },
    { halfWidth: 4 + scale },
    { halfWidth: 5 + scale },
    { halfWidth: 5 + scale },
    { halfWidth: 3 + scale },
  ];
  return rows.map((row) => buildRow(width, centerLeft, centerRight, row, fill));
}

export interface CompanionFrameData {
  frame: string[];
  palette: Record<string, string>;
}

export function getCompanionFrame(kind: CompanionKind, rarity: Rarity): CompanionFrameData {
  const color = RARITY_COLOR[rarity];
  const scale = RARITY_SCALE[rarity];
  const frame = kind === 'pet' ? buildPetFrame(scale, 'F') : buildMountFrame(scale, 'F');
  return { frame, palette: { K: '#3a3542', F: color } };
}
