import { Archetype } from '../combat';

// 場景背景:6 職業各自一套配色+造型主題(呼應該職業的戰鬥風格),5 個關卡用「造型元素數量」
// 表現關卡遞進(關卡越高、場景裡的山/樹/柱子等元素越密集),用程式組合出 30 種背景而不是手繪
// 30 張整圖——跟 game/equipment.ts 的職業x階級組合命名、monsters.ts 的半寬序列同一套工程原則。
const WIDTH = 40;
const HEIGHT = 17;
const GROUND_ROWS = 3;
const SKY_TOP_ROWS = 8;
const MOTIF_BASE_ROW = HEIGHT - GROUND_ROWS - 1;

type MotifShape = 'mountain' | 'tree' | 'pillar' | 'crystal' | 'ice' | 'cloud';

interface BackgroundTheme {
  skyTop: string;
  skyBottom: string;
  ground: string;
  motif: string;
  motifShape: MotifShape;
}

const ARCHETYPE_THEMES: Record<Archetype, BackgroundTheme> = {
  physicalMelee: { skyTop: '#2a1a1a', skyBottom: '#4a2a20', ground: '#3a2418', motif: '#6b3a2a', motifShape: 'mountain' },
  physicalRanged: { skyTop: '#16241c', skyBottom: '#24382a', ground: '#1c2e20', motif: '#3a5a3a', motifShape: 'tree' },
  physicalSupport: { skyTop: '#2a2214', skyBottom: '#4a3a20', ground: '#3a3020', motif: '#c9a94f', motifShape: 'pillar' },
  magicMelee: { skyTop: '#1e1428', skyBottom: '#342248', ground: '#241a30', motif: '#8a5aaa', motifShape: 'crystal' },
  magicRanged: { skyTop: '#141e28', skyBottom: '#203040', ground: '#182430', motif: '#5a8aaa', motifShape: 'ice' },
  magicSupport: { skyTop: '#242030', skyBottom: '#3a3448', ground: '#2a2838', motif: '#e8d8a0', motifShape: 'cloud' },
};

// 每種造型用「相對於底部基準點」的座標偏移組成,dy=0 是貼地那一列,負值往上疊。
const SHAPE_OFFSETS: Record<MotifShape, { dx: number; dy: number }[]> = {
  mountain: [
    { dx: -1, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
  ],
  tree: [
    { dx: 0, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: 0, dy: -2 },
  ],
  pillar: [
    { dx: 0, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: -2 },
  ],
  crystal: [
    { dx: 0, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: 0, dy: -2 },
  ],
  ice: [
    { dx: 0, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
  ],
  cloud: [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
  ],
};

export interface BackgroundFrameData {
  frame: string[];
  palette: Record<string, string>;
}

// stage 1..5,數字越大場景裡的造型元素越密集,呼應關卡遞進;元素數量 = stage。
// totalHeight 預設等於原本的戰鬥場景高度(HEIGHT);傳更大的值(給「主視覺延伸區」用)時,
// 超出原本地面之後的部分一律延續 skyBottom 色階往下鋪,不會重複畫地面,不然會看起來像整塊土台。
export function getStageBackground(archetype: Archetype, stage: number, totalHeight: number = HEIGHT): BackgroundFrameData {
  const theme = ARCHETYPE_THEMES[archetype];
  const grid: string[][] = Array.from({ length: totalHeight }, (_, y) => {
    const rowChar = y < SKY_TOP_ROWS ? 'T' : y < HEIGHT - GROUND_ROWS ? 'B' : y < HEIGHT ? 'G' : 'B';
    return new Array(WIDTH).fill(rowChar);
  });

  const motifCount = Math.max(1, Math.min(5, stage));
  const spacing = Math.floor(WIDTH / (motifCount + 1));
  const offsets = SHAPE_OFFSETS[theme.motifShape];
  for (let i = 1; i <= motifCount; i++) {
    const baseX = spacing * i;
    for (const { dx, dy } of offsets) {
      const x = baseX + dx;
      const y = MOTIF_BASE_ROW + dy;
      if (x >= 0 && x < WIDTH && y >= 0 && y < totalHeight) grid[y][x] = 'M';
    }
  }

  const frame = grid.map((row) => row.join(''));
  const palette: Record<string, string> = { T: theme.skyTop, B: theme.skyBottom, G: theme.ground, M: theme.motif };
  return { frame, palette };
}

// 主視覺延伸區用:圖片本身之外(超出 totalHeight 的殘留高度)要靠外層 View 的純色
// backgroundColor 接住,顏色跟圖片最底部的 skyBottom 一致才不會看到明顯接縫。
export function getStageBackdropColor(archetype: Archetype): string {
  return ARCHETYPE_THEMES[archetype].skyBottom;
}
