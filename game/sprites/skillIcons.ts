import { Archetype } from '../combat';
import { SkillSlotId } from '../skillTree';

// 6 職業 x 6 技能格 = 36 個獨立圖示,12x12 跟 tabIcons/eventIcons 同一套畫布尺寸。
// 用座標點列表建構(而不是手打字串),每個 cell 由陣列固定寬度保證、不會出現 monsters.ts
// 那種「多字元 palette key 把整列拼歪」的問題。
const CANVAS = 12;

interface Mark {
  x: number;
  y: number;
  c: string;
}

function buildFrame(marks: Mark[]): string[] {
  const grid: string[][] = Array.from({ length: CANVAS }, () => new Array(CANVAS).fill('.'));
  for (const { x, y, c } of marks) {
    if (x >= 0 && x < CANVAS && y >= 0 && y < CANVAS) grid[y][x] = c;
  }
  return grid.map((row) => row.join(''));
}

function rect(x0: number, y0: number, x1: number, y1: number, c: string): Mark[] {
  const marks: Mark[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) marks.push({ x, y, c });
  }
  return marks;
}

const PHYSICAL_COLOR = '#8b8698';
const MAGIC_COLOR = '#b389e0';
const RANGED_MAGIC_COLOR = '#6ab0e0';
const SUPPORT_MAGIC_COLOR = '#c9a94f';
const SPARK_COLOR = '#f2d675';
const HEAL_COLOR = '#9fd9a0';
const STAR_COLOR = '#ffffff';

// ===== physicalMelee(工地/扛貨風味)=====

// 扛貨練出的體感:紙箱剪影 + 一條斜背帶。
const PM_PASSIVE1: Mark[] = [...rect(2, 3, 9, 9, 'B'), { x: 2, y: 2, c: 'K' }, { x: 4, y: 4, c: 'K' }, { x: 6, y: 6, c: 'K' }, { x: 8, y: 8, c: 'K' }];
// 工地行情摸透了:安全帽剪影(半圓頂 + 帽緣)。
const PM_PASSIVE2: Mark[] = [...rect(4, 2, 7, 2, 'B'), ...rect(3, 3, 8, 5, 'B'), ...rect(1, 6, 10, 7, 'B'), { x: 5, y: 3, c: 'K' }, { x: 6, y: 3, c: 'K' }];
// 爆擊一擊(維持原設計):斜劈刀鋒 + 命中十字火花。
const PM_ACTIVE1: Mark[] = [
  { x: 1, y: 10, c: 'B' }, { x: 2, y: 9, c: 'B' }, { x: 3, y: 8, c: 'B' }, { x: 4, y: 7, c: 'B' },
  { x: 5, y: 6, c: 'B' }, { x: 6, y: 5, c: 'B' }, { x: 7, y: 4, c: 'B' },
  { x: 8, y: 3, c: 'S' }, { x: 8, y: 1, c: 'S' }, { x: 8, y: 5, c: 'S' }, { x: 6, y: 3, c: 'S' }, { x: 10, y: 3, c: 'S' },
];
// 連環出拳:兩個交錯的拳擊衝擊星,一前一後。
const PM_ACTIVE2: Mark[] = [
  { x: 2, y: 6, c: 'B' }, { x: 1, y: 5, c: 'S' }, { x: 3, y: 5, c: 'S' }, { x: 1, y: 7, c: 'S' }, { x: 3, y: 7, c: 'S' },
  { x: 8, y: 8, c: 'B' }, { x: 7, y: 7, c: 'S' }, { x: 9, y: 7, c: 'S' }, { x: 7, y: 9, c: 'S' }, { x: 9, y: 9, c: 'S' },
];
// 順手清點庫存:清單框 + 三條打勾記號。
const PM_ACTIVE3: Mark[] = [
  ...rect(2, 1, 9, 10, 'K'), ...rect(3, 2, 8, 9, 'B'),
  { x: 4, y: 4, c: 'S' }, { x: 5, y: 5, c: 'S' }, { x: 4, y: 6, c: 'S' }, { x: 5, y: 7, c: 'S' }, { x: 4, y: 8, c: 'S' },
];
// 扎實的一天:太陽剪影,外圈放射光芒。
const PM_ACTIVE4: Mark[] = [
  ...rect(4, 4, 7, 7, 'S'),
  { x: 5, y: 1, c: 'B' }, { x: 6, y: 1, c: 'B' }, { x: 5, y: 10, c: 'B' }, { x: 6, y: 10, c: 'B' },
  { x: 1, y: 5, c: 'B' }, { x: 1, y: 6, c: 'B' }, { x: 10, y: 5, c: 'B' }, { x: 10, y: 6, c: 'B' },
  { x: 2, y: 2, c: 'B' }, { x: 9, y: 2, c: 'B' }, { x: 2, y: 9, c: 'B' }, { x: 9, y: 9, c: 'B' },
];

// ===== physicalRanged(外送/跑單風味)=====

// 抄近路練出的直覺:彎折捷徑路線圖。
const PR_PASSIVE1: Mark[] = [
  { x: 1, y: 9, c: 'A' }, { x: 2, y: 9, c: 'A' }, { x: 3, y: 9, c: 'A' }, { x: 3, y: 8, c: 'A' }, { x: 3, y: 7, c: 'A' },
  { x: 4, y: 6, c: 'A' }, { x: 5, y: 5, c: 'A' }, { x: 6, y: 4, c: 'A' }, { x: 7, y: 3, c: 'A' },
  { x: 8, y: 2, c: 'S' }, { x: 9, y: 2, c: 'S' }, { x: 8, y: 1, c: 'S' },
];
// 跑單跑出的效率:碼表剪影(圓框 + 指針)。
const PR_PASSIVE2: Mark[] = [
  ...rect(3, 3, 8, 8, 'A'), { x: 5, y: 1, c: 'A' }, { x: 6, y: 1, c: 'A' },
  { x: 5, y: 5, c: 'S' }, { x: 6, y: 4, c: 'S' }, { x: 7, y: 4, c: 'S' },
];
// 連續多重射擊(維持原設計):三支箭矢錯開角度飛出。
const PR_ACTIVE1: Mark[] = [
  { x: 5, y: 2, c: 'A' }, { x: 3, y: 1, c: 'A' }, { x: 3, y: 3, c: 'A' }, { x: 4, y: 2, c: 'A' },
  { x: 7, y: 5, c: 'A' }, { x: 5, y: 4, c: 'A' }, { x: 5, y: 6, c: 'A' }, { x: 6, y: 5, c: 'A' },
  { x: 9, y: 8, c: 'A' }, { x: 7, y: 7, c: 'A' }, { x: 7, y: 9, c: 'A' }, { x: 8, y: 8, c: 'A' },
];
// 順路多接一單:外送箱剪影(方箱 + 頂部提把)。
const PR_ACTIVE2: Mark[] = [...rect(2, 4, 9, 9, 'A'), { x: 4, y: 2, c: 'S' }, { x: 4, y: 3, c: 'S' }, { x: 7, y: 2, c: 'S' }, { x: 7, y: 3, c: 'S' }];
// 熟門熟路:地圖釘剪影(圓頭 + 尖端)。
const PR_ACTIVE3: Mark[] = [
  ...rect(4, 1, 7, 4, 'A'), { x: 5, y: 5, c: 'A' }, { x: 6, y: 5, c: 'A' },
  { x: 5, y: 6, c: 'S' }, { x: 6, y: 7, c: 'S' }, { x: 5, y: 8, c: 'S' },
];
// 精準一擊:同心圓靶心。
const PR_ACTIVE4: Mark[] = [
  ...rect(1, 1, 10, 10, 'A').filter((m) => m.x === 1 || m.x === 10 || m.y === 1 || m.y === 10),
  ...rect(3, 3, 8, 8, 'A').filter((m) => m.x === 3 || m.x === 8 || m.y === 3 || m.y === 8),
  { x: 5, y: 5, c: 'S' }, { x: 6, y: 5, c: 'S' }, { x: 5, y: 6, c: 'S' }, { x: 6, y: 6, c: 'S' },
];

// ===== physicalSupport(超商店員風味)=====

// 站櫃練出的觀察力:杏眼剪影 + 瞳孔。
const PS_PASSIVE1: Mark[] = [
  { x: 2, y: 5, c: 'R' }, { x: 3, y: 4, c: 'R' }, { x: 4, y: 4, c: 'R' }, { x: 7, y: 4, c: 'R' }, { x: 8, y: 4, c: 'R' }, { x: 9, y: 5, c: 'R' },
  { x: 3, y: 6, c: 'R' }, { x: 4, y: 7, c: 'R' }, { x: 7, y: 7, c: 'R' }, { x: 8, y: 6, c: 'R' },
  { x: 5, y: 5, c: 'H' }, { x: 6, y: 5, c: 'H' }, { x: 5, y: 6, c: 'H' }, { x: 6, y: 6, c: 'H' },
];
// 會員點數精算術:3x3 點數網格。
const PS_PASSIVE2: Mark[] = [
  { x: 3, y: 3, c: 'R' }, { x: 6, y: 3, c: 'R' }, { x: 9, y: 3, c: 'R' },
  { x: 3, y: 6, c: 'R' }, { x: 6, y: 6, c: 'R' }, { x: 9, y: 6, c: 'R' },
  { x: 3, y: 9, c: 'R' }, { x: 6, y: 9, c: 'R' }, { x: 9, y: 9, c: 'R' },
];
// 治療光環(維持原設計):外圈光環 + 中心十字。
const PS_ACTIVE1: Mark[] = [
  { x: 5, y: 1, c: 'R' }, { x: 6, y: 1, c: 'R' }, { x: 3, y: 2, c: 'R' }, { x: 8, y: 2, c: 'R' },
  { x: 2, y: 3, c: 'R' }, { x: 9, y: 3, c: 'R' }, { x: 1, y: 4, c: 'R' }, { x: 10, y: 4, c: 'R' },
  { x: 1, y: 5, c: 'R' }, { x: 10, y: 5, c: 'R' }, { x: 1, y: 6, c: 'R' }, { x: 10, y: 6, c: 'R' },
  { x: 2, y: 7, c: 'R' }, { x: 9, y: 7, c: 'R' }, { x: 3, y: 8, c: 'R' }, { x: 8, y: 8, c: 'R' },
  { x: 5, y: 9, c: 'R' }, { x: 6, y: 9, c: 'R' },
  { x: 5, y: 4, c: 'H' }, { x: 6, y: 4, c: 'H' }, { x: 5, y: 5, c: 'H' }, { x: 6, y: 5, c: 'H' },
  { x: 5, y: 6, c: 'H' }, { x: 6, y: 6, c: 'H' }, { x: 3, y: 5, c: 'H' }, { x: 4, y: 5, c: 'H' },
  { x: 7, y: 5, c: 'H' }, { x: 8, y: 5, c: 'H' },
];
// 貼心的叮嚀:對話框剪影 + 尾巴。
const PS_ACTIVE2: Mark[] = [...rect(1, 1, 10, 6, 'R'), { x: 3, y: 7, c: 'R' }, { x: 4, y: 8, c: 'R' }, { x: 4, y: 3, c: 'H' }, { x: 5, y: 3, c: 'H' }, { x: 6, y: 3, c: 'H' }, { x: 7, y: 3, c: 'H' }];
// 速戰速決:閃電剪影。
const PS_ACTIVE3: Mark[] = [
  { x: 6, y: 1, c: 'R' }, { x: 5, y: 2, c: 'R' }, { x: 4, y: 3, c: 'R' }, { x: 3, y: 4, c: 'R' }, { x: 5, y: 4, c: 'R' },
  { x: 4, y: 5, c: 'R' }, { x: 3, y: 6, c: 'R' }, { x: 2, y: 7, c: 'R' }, { x: 1, y: 8, c: 'R' },
  { x: 6, y: 5, c: 'H' }, { x: 7, y: 6, c: 'H' },
];
// 雙倍關懷:兩顆愛心並排。
const PS_ACTIVE4: Mark[] = [
  { x: 2, y: 3, c: 'R' }, { x: 3, y: 2, c: 'R' }, { x: 4, y: 3, c: 'R' }, { x: 3, y: 4, c: 'R' }, { x: 3, y: 5, c: 'R' },
  { x: 7, y: 3, c: 'H' }, { x: 8, y: 2, c: 'H' }, { x: 9, y: 3, c: 'H' }, { x: 8, y: 4, c: 'H' }, { x: 8, y: 5, c: 'H' },
];

// ===== magicMelee(修煉/廟宇風味)=====

// 修煉日常:蓮花/火焰剪影。
const MM_PASSIVE1: Mark[] = [
  { x: 5, y: 1, c: 'M' }, { x: 6, y: 1, c: 'M' }, { x: 4, y: 2, c: 'M' }, { x: 7, y: 2, c: 'M' },
  { x: 3, y: 3, c: 'M' }, { x: 8, y: 3, c: 'M' }, { x: 2, y: 4, c: 'M' }, { x: 9, y: 4, c: 'M' },
  { x: 2, y: 5, c: 'M' }, { x: 9, y: 5, c: 'M' }, ...rect(3, 6, 8, 7, 'M'),
];
// 香油錢緣分:銅錢剪影(圓框 + 方孔)。
const MM_PASSIVE2: Mark[] = [
  ...rect(3, 3, 8, 8, 'W').filter((m) => m.x === 3 || m.x === 8 || m.y === 3 || m.y === 8),
  { x: 5, y: 5, c: 'W' }, { x: 6, y: 5, c: 'W' }, { x: 5, y: 6, c: 'W' }, { x: 6, y: 6, c: 'W' },
];
// 能量爆發斬(維持原設計):斜劈刀鋒(魔法色) + 四方向大星爆。
const MM_ACTIVE1: Mark[] = [
  { x: 1, y: 10, c: 'M' }, { x: 2, y: 9, c: 'M' }, { x: 3, y: 8, c: 'M' }, { x: 4, y: 7, c: 'M' },
  { x: 5, y: 6, c: 'M' }, { x: 6, y: 5, c: 'M' }, { x: 7, y: 4, c: 'M' },
  { x: 8, y: 3, c: 'W' }, { x: 8, y: 1, c: 'W' }, { x: 8, y: 5, c: 'W' }, { x: 6, y: 3, c: 'W' }, { x: 10, y: 3, c: 'W' },
  { x: 7, y: 2, c: 'W' }, { x: 9, y: 2, c: 'W' }, { x: 7, y: 4, c: 'W' }, { x: 9, y: 4, c: 'W' },
];
// 連環符咒:兩張直立符紙,交錯排列。
const MM_ACTIVE2: Mark[] = [...rect(1, 2, 4, 9, 'M'), ...rect(6, 1, 9, 8, 'M'), { x: 2, y: 4, c: 'W' }, { x: 3, y: 6, c: 'W' }, { x: 7, y: 3, c: 'W' }, { x: 8, y: 5, c: 'W' }];
// 收驚順便收紅包:紅包袋剪影 + 金色封印點。
const MM_ACTIVE3: Mark[] = [...rect(2, 2, 9, 9, 'M'), { x: 5, y: 5, c: 'W' }, { x: 6, y: 5, c: 'W' }, { x: 5, y: 6, c: 'W' }, { x: 6, y: 6, c: 'W' }];
// 頓悟時刻:光環爆發(圓心 + 放射短線)。
const MM_ACTIVE4: Mark[] = [
  ...rect(4, 4, 7, 7, 'W'),
  { x: 5, y: 1, c: 'M' }, { x: 6, y: 1, c: 'M' }, { x: 5, y: 10, c: 'M' }, { x: 6, y: 10, c: 'M' },
  { x: 1, y: 5, c: 'M' }, { x: 1, y: 6, c: 'M' }, { x: 10, y: 5, c: 'M' }, { x: 10, y: 6, c: 'M' },
  { x: 2, y: 2, c: 'M' }, { x: 9, y: 2, c: 'M' }, { x: 2, y: 9, c: 'M' }, { x: 9, y: 9, c: 'M' },
];

// ===== magicRanged(工程師風味)=====

// 肝出來的手感:鍵盤剪影(小方格陣列)。
const MR_PASSIVE1: Mark[] = [
  ...rect(1, 4, 10, 8, 'O'),
  { x: 2, y: 5, c: 'K' }, { x: 4, y: 5, c: 'K' }, { x: 6, y: 5, c: 'K' }, { x: 8, y: 5, c: 'K' },
  { x: 2, y: 7, c: 'K' }, { x: 4, y: 7, c: 'K' }, { x: 6, y: 7, c: 'K' }, { x: 8, y: 7, c: 'K' },
];
// 接案眼光:放大鏡剪影。
const MR_PASSIVE2: Mark[] = [
  ...rect(2, 2, 6, 6, 'O').filter((m) => m.x === 2 || m.x === 6 || m.y === 2 || m.y === 6),
  { x: 7, y: 7, c: 'O' }, { x: 8, y: 8, c: 'O' }, { x: 9, y: 9, c: 'O' },
];
// 法術齊射(維持原設計):三顆魔法彈由左上往右下墜落。
const MR_ACTIVE1: Mark[] = [
  { x: 2, y: 1, c: 'O' }, { x: 3, y: 1, c: 'O' }, { x: 2, y: 2, c: 'O' }, { x: 3, y: 2, c: 'O' }, { x: 1, y: 0, c: 'O' },
  { x: 5, y: 4, c: 'O' }, { x: 6, y: 4, c: 'O' }, { x: 5, y: 5, c: 'O' }, { x: 6, y: 5, c: 'O' }, { x: 4, y: 3, c: 'O' },
  { x: 8, y: 7, c: 'O' }, { x: 9, y: 7, c: 'O' }, { x: 8, y: 8, c: 'O' }, { x: 9, y: 8, c: 'O' }, { x: 7, y: 6, c: 'O' },
];
// 業配置入:標籤牌剪影(五邊形 + 孔洞)。
const MR_ACTIVE2: Mark[] = [...rect(2, 3, 8, 8, 'O'), { x: 9, y: 4, c: 'O' }, { x: 10, y: 5, c: 'O' }, { x: 9, y: 6, c: 'O' }, { x: 3, y: 5, c: 'K' }];
// 熬夜肝出的心得:咖啡杯剪影 + 蒸氣。
const MR_ACTIVE3: Mark[] = [
  ...rect(3, 5, 8, 9, 'O'), { x: 9, y: 6, c: 'O' }, { x: 10, y: 6, c: 'O' }, { x: 10, y: 7, c: 'O' },
  { x: 4, y: 3, c: 'K' }, { x: 4, y: 4, c: 'K' }, { x: 7, y: 2, c: 'K' }, { x: 7, y: 3, c: 'K' },
];
// 一鍵神操作:單一按鍵剪影 + 中心圓點。
const MR_ACTIVE4: Mark[] = [...rect(3, 3, 8, 8, 'O'), { x: 5, y: 5, c: 'K' }, { x: 6, y: 5, c: 'K' }, { x: 5, y: 6, c: 'K' }, { x: 6, y: 6, c: 'K' }];

// ===== magicSupport(醫護風味)=====

// 臨床經驗:聽診器剪影(彎管 + 圓頭)。
const MS_PASSIVE1: Mark[] = [
  { x: 2, y: 1, c: 'G' }, { x: 2, y: 2, c: 'G' }, { x: 2, y: 3, c: 'G' }, { x: 3, y: 4, c: 'G' }, { x: 4, y: 5, c: 'G' },
  { x: 5, y: 5, c: 'G' }, { x: 6, y: 5, c: 'G' }, { x: 7, y: 4, c: 'G' }, { x: 8, y: 3, c: 'G' }, { x: 8, y: 2, c: 'G' }, { x: 8, y: 1, c: 'G' },
  ...rect(7, 6, 9, 8, 'G').filter((m) => m.x === 7 || m.x === 9 || m.y === 6 || m.y === 8),
];
// 診間人脈:病歷夾剪影(方框 + 三條橫線)。
const MS_PASSIVE2: Mark[] = [...rect(2, 1, 9, 10, 'G'), { x: 4, y: 3, c: 'P' }, { x: 5, y: 3, c: 'P' }, { x: 6, y: 3, c: 'P' }, { x: 4, y: 5, c: 'P' }, { x: 5, y: 5, c: 'P' }, { x: 4, y: 7, c: 'P' }, { x: 5, y: 7, c: 'P' }, { x: 6, y: 7, c: 'P' }];
// 增幅祝福(維持原設計):向上箭頭 + 兩側閃光。
const MS_ACTIVE1: Mark[] = [
  { x: 5, y: 9, c: 'G' }, { x: 5, y: 8, c: 'G' }, { x: 5, y: 7, c: 'G' }, { x: 5, y: 6, c: 'G' }, { x: 5, y: 5, c: 'G' },
  { x: 5, y: 3, c: 'G' }, { x: 4, y: 4, c: 'G' }, { x: 6, y: 4, c: 'G' }, { x: 3, y: 5, c: 'G' }, { x: 7, y: 5, c: 'G' },
  { x: 1, y: 2, c: 'P' }, { x: 2, y: 1, c: 'P' }, { x: 2, y: 3, c: 'P' }, { x: 3, y: 2, c: 'P' },
  { x: 9, y: 2, c: 'P' }, { x: 10, y: 1, c: 'P' }, { x: 10, y: 3, c: 'P' }, { x: 8, y: 2, c: 'P' },
];
// 衛教叮嚀:對話框剪影 + 十字。
const MS_ACTIVE2: Mark[] = [...rect(1, 1, 10, 6, 'G'), { x: 3, y: 7, c: 'G' }, { x: 4, y: 8, c: 'G' }, { x: 5, y: 3, c: 'P' }, { x: 5, y: 4, c: 'P' }, { x: 4, y: 3, c: 'P' }, { x: 6, y: 3, c: 'P' }];
// 藥到病除:膠囊剪影(兩色分半)。
const MS_ACTIVE3: Mark[] = [...rect(1, 4, 5, 7, 'G'), ...rect(6, 4, 10, 7, 'P')];
// 雙倍療效:兩個十字並排。
const MS_ACTIVE4: Mark[] = [
  { x: 2, y: 1, c: 'G' }, { x: 2, y: 2, c: 'G' }, { x: 2, y: 3, c: 'G' }, { x: 1, y: 2, c: 'G' }, { x: 3, y: 2, c: 'G' },
  { x: 8, y: 5, c: 'P' }, { x: 8, y: 6, c: 'P' }, { x: 8, y: 7, c: 'P' }, { x: 7, y: 6, c: 'P' }, { x: 9, y: 6, c: 'P' },
];

interface SkillIconSpec {
  marks: Mark[];
  palette: Record<string, string>;
}

const SKILL_ICON_SPECS: Record<Archetype, Record<SkillSlotId, SkillIconSpec>> = {
  physicalMelee: {
    passive1: { marks: PM_PASSIVE1, palette: { B: PHYSICAL_COLOR, K: '#3a3542' } },
    passive2: { marks: PM_PASSIVE2, palette: { B: PHYSICAL_COLOR, K: '#3a3542' } },
    active1: { marks: PM_ACTIVE1, palette: { B: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active2: { marks: PM_ACTIVE2, palette: { B: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active3: { marks: PM_ACTIVE3, palette: { K: '#3a3542', B: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active4: { marks: PM_ACTIVE4, palette: { S: SPARK_COLOR, B: PHYSICAL_COLOR } },
  },
  physicalRanged: {
    passive1: { marks: PR_PASSIVE1, palette: { A: PHYSICAL_COLOR, S: SPARK_COLOR } },
    passive2: { marks: PR_PASSIVE2, palette: { A: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active1: { marks: PR_ACTIVE1, palette: { A: PHYSICAL_COLOR } },
    active2: { marks: PR_ACTIVE2, palette: { A: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active3: { marks: PR_ACTIVE3, palette: { A: PHYSICAL_COLOR, S: SPARK_COLOR } },
    active4: { marks: PR_ACTIVE4, palette: { A: PHYSICAL_COLOR, S: SPARK_COLOR } },
  },
  physicalSupport: {
    passive1: { marks: PS_PASSIVE1, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
    passive2: { marks: PS_PASSIVE2, palette: { R: PHYSICAL_COLOR } },
    active1: { marks: PS_ACTIVE1, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
    active2: { marks: PS_ACTIVE2, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
    active3: { marks: PS_ACTIVE3, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
    active4: { marks: PS_ACTIVE4, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
  },
  magicMelee: {
    passive1: { marks: MM_PASSIVE1, palette: { M: MAGIC_COLOR } },
    passive2: { marks: MM_PASSIVE2, palette: { W: STAR_COLOR } },
    active1: { marks: MM_ACTIVE1, palette: { M: MAGIC_COLOR, W: STAR_COLOR } },
    active2: { marks: MM_ACTIVE2, palette: { M: MAGIC_COLOR, W: STAR_COLOR } },
    active3: { marks: MM_ACTIVE3, palette: { M: MAGIC_COLOR, W: STAR_COLOR } },
    active4: { marks: MM_ACTIVE4, palette: { M: MAGIC_COLOR, W: STAR_COLOR } },
  },
  magicRanged: {
    passive1: { marks: MR_PASSIVE1, palette: { O: RANGED_MAGIC_COLOR, K: '#3a3542' } },
    passive2: { marks: MR_PASSIVE2, palette: { O: RANGED_MAGIC_COLOR } },
    active1: { marks: MR_ACTIVE1, palette: { O: RANGED_MAGIC_COLOR } },
    active2: { marks: MR_ACTIVE2, palette: { O: RANGED_MAGIC_COLOR, K: '#3a3542' } },
    active3: { marks: MR_ACTIVE3, palette: { O: RANGED_MAGIC_COLOR, K: '#3a3542' } },
    active4: { marks: MR_ACTIVE4, palette: { O: RANGED_MAGIC_COLOR, K: '#3a3542' } },
  },
  magicSupport: {
    passive1: { marks: MS_PASSIVE1, palette: { G: SUPPORT_MAGIC_COLOR } },
    passive2: { marks: MS_PASSIVE2, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
    active1: { marks: MS_ACTIVE1, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
    active2: { marks: MS_ACTIVE2, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
    active3: { marks: MS_ACTIVE3, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
    active4: { marks: MS_ACTIVE4, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
  },
};

export interface SkillIconData {
  frame: string[];
  palette: Record<string, string>;
}

// 技能等級對照 5 個視覺階段(呼應 skillSlotLevelCap 的 tier*60 分段),階數越高外框裝飾越多,
// 同一個基礎圖案看得出「練到哪一階」,不用每一階都重畫一張全新的圖。
const TIER_ACCENT_COLOR = '#f2d675';
const LEVELS_PER_TIER = 60;
const MAX_TIER = 5;

function skillIconTier(level: number): number {
  return Math.max(1, Math.min(MAX_TIER, Math.ceil(level / LEVELS_PER_TIER)));
}

function applyTierAccent(marks: Mark[], tier: number): Mark[] {
  const accents: Mark[] = [];
  if (tier >= 2) accents.push({ x: 0, y: 0, c: 'X' }, { x: 11, y: 0, c: 'X' });
  if (tier >= 3) accents.push({ x: 0, y: 11, c: 'X' }, { x: 11, y: 11, c: 'X' });
  if (tier >= 4) accents.push({ x: 0, y: 5, c: 'X' }, { x: 0, y: 6, c: 'X' }, { x: 11, y: 5, c: 'X' }, { x: 11, y: 6, c: 'X' });
  if (tier >= 5) accents.push({ x: 5, y: 0, c: 'X' }, { x: 6, y: 0, c: 'X' }, { x: 5, y: 11, c: 'X' }, { x: 6, y: 11, c: 'X' });
  return accents.length > 0 ? [...marks, ...accents] : marks;
}

export function getSkillIcon(archetype: Archetype, slot: SkillSlotId, level: number): SkillIconData {
  const spec = SKILL_ICON_SPECS[archetype][slot];
  const tier = skillIconTier(level);
  const marks = applyTierAccent(spec.marks, tier);
  const palette = tier >= 2 ? { ...spec.palette, X: TIER_ACCENT_COLOR } : spec.palette;
  return { frame: buildFrame(marks), palette };
}
