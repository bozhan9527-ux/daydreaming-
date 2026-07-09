import { Archetype } from '../combat';

// 六大職業主動技能的圖示,一個 archetype 一張,12x12 跟 tabIcons/eventIcons 同一套畫布尺寸。
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

const PHYSICAL_COLOR = '#8b8698';
const MAGIC_COLOR = '#b389e0';
const RANGED_MAGIC_COLOR = '#6ab0e0';
const SUPPORT_MAGIC_COLOR = '#c9a94f';
const SPARK_COLOR = '#f2d675';
const HEAL_COLOR = '#9fd9a0';
const STAR_COLOR = '#ffffff';

// 爆擊一擊:斜劈刀鋒 + 命中處一個十字火花。
const CRITICAL_STRIKE: Mark[] = [
  { x: 1, y: 10, c: 'B' },
  { x: 2, y: 9, c: 'B' },
  { x: 3, y: 8, c: 'B' },
  { x: 4, y: 7, c: 'B' },
  { x: 5, y: 6, c: 'B' },
  { x: 6, y: 5, c: 'B' },
  { x: 7, y: 4, c: 'B' },
  { x: 8, y: 3, c: 'S' },
  { x: 8, y: 1, c: 'S' },
  { x: 8, y: 5, c: 'S' },
  { x: 6, y: 3, c: 'S' },
  { x: 10, y: 3, c: 'S' },
];

// 連續多重射擊:三支箭矢錯開角度同時飛出。
const MULTI_SHOT: Mark[] = [
  { x: 5, y: 2, c: 'A' },
  { x: 3, y: 1, c: 'A' },
  { x: 3, y: 3, c: 'A' },
  { x: 4, y: 2, c: 'A' },
  { x: 7, y: 5, c: 'A' },
  { x: 5, y: 4, c: 'A' },
  { x: 5, y: 6, c: 'A' },
  { x: 6, y: 5, c: 'A' },
  { x: 9, y: 8, c: 'A' },
  { x: 7, y: 7, c: 'A' },
  { x: 7, y: 9, c: 'A' },
  { x: 8, y: 8, c: 'A' },
];

// 治療光環:外圈光環 + 中心十字。
const HEALING_AURA: Mark[] = [
  { x: 5, y: 1, c: 'R' },
  { x: 6, y: 1, c: 'R' },
  { x: 3, y: 2, c: 'R' },
  { x: 8, y: 2, c: 'R' },
  { x: 2, y: 3, c: 'R' },
  { x: 9, y: 3, c: 'R' },
  { x: 1, y: 4, c: 'R' },
  { x: 10, y: 4, c: 'R' },
  { x: 1, y: 5, c: 'R' },
  { x: 10, y: 5, c: 'R' },
  { x: 1, y: 6, c: 'R' },
  { x: 10, y: 6, c: 'R' },
  { x: 2, y: 7, c: 'R' },
  { x: 9, y: 7, c: 'R' },
  { x: 3, y: 8, c: 'R' },
  { x: 8, y: 8, c: 'R' },
  { x: 5, y: 9, c: 'R' },
  { x: 6, y: 9, c: 'R' },
  { x: 5, y: 4, c: 'H' },
  { x: 6, y: 4, c: 'H' },
  { x: 5, y: 5, c: 'H' },
  { x: 6, y: 5, c: 'H' },
  { x: 5, y: 6, c: 'H' },
  { x: 6, y: 6, c: 'H' },
  { x: 3, y: 5, c: 'H' },
  { x: 4, y: 5, c: 'H' },
  { x: 7, y: 5, c: 'H' },
  { x: 8, y: 5, c: 'H' },
];

// 能量爆發斬:跟爆擊一擊同構圖,但刀鋒是魔法色、命中處是四方向大星爆。
const ENERGY_BURST_SLASH: Mark[] = [
  { x: 1, y: 10, c: 'M' },
  { x: 2, y: 9, c: 'M' },
  { x: 3, y: 8, c: 'M' },
  { x: 4, y: 7, c: 'M' },
  { x: 5, y: 6, c: 'M' },
  { x: 6, y: 5, c: 'M' },
  { x: 7, y: 4, c: 'M' },
  { x: 8, y: 3, c: 'W' },
  { x: 8, y: 1, c: 'W' },
  { x: 8, y: 5, c: 'W' },
  { x: 6, y: 3, c: 'W' },
  { x: 10, y: 3, c: 'W' },
  { x: 7, y: 2, c: 'W' },
  { x: 9, y: 2, c: 'W' },
  { x: 7, y: 4, c: 'W' },
  { x: 9, y: 4, c: 'W' },
];

// 法術齊射:三顆魔法彈由左上往右下墜落,每顆帶一個左上拖影。
const SPELL_VOLLEY: Mark[] = [
  { x: 2, y: 1, c: 'O' },
  { x: 3, y: 1, c: 'O' },
  { x: 2, y: 2, c: 'O' },
  { x: 3, y: 2, c: 'O' },
  { x: 1, y: 0, c: 'O' },
  { x: 5, y: 4, c: 'O' },
  { x: 6, y: 4, c: 'O' },
  { x: 5, y: 5, c: 'O' },
  { x: 6, y: 5, c: 'O' },
  { x: 4, y: 3, c: 'O' },
  { x: 8, y: 7, c: 'O' },
  { x: 9, y: 7, c: 'O' },
  { x: 8, y: 8, c: 'O' },
  { x: 9, y: 8, c: 'O' },
  { x: 7, y: 6, c: 'O' },
];

// 增幅祝福:向上箭頭(祝福提升)+ 兩側各一顆閃光。
const AMPLIFY_BLESSING: Mark[] = [
  { x: 5, y: 9, c: 'G' },
  { x: 5, y: 8, c: 'G' },
  { x: 5, y: 7, c: 'G' },
  { x: 5, y: 6, c: 'G' },
  { x: 5, y: 5, c: 'G' },
  { x: 5, y: 3, c: 'G' },
  { x: 4, y: 4, c: 'G' },
  { x: 6, y: 4, c: 'G' },
  { x: 3, y: 5, c: 'G' },
  { x: 7, y: 5, c: 'G' },
  { x: 1, y: 2, c: 'P' },
  { x: 2, y: 1, c: 'P' },
  { x: 2, y: 3, c: 'P' },
  { x: 3, y: 2, c: 'P' },
  { x: 9, y: 2, c: 'P' },
  { x: 10, y: 1, c: 'P' },
  { x: 10, y: 3, c: 'P' },
  { x: 8, y: 2, c: 'P' },
];

interface SkillIconSpec {
  marks: Mark[];
  palette: Record<string, string>;
}

const SKILL_ICON_SPECS: Record<Archetype, SkillIconSpec> = {
  physicalMelee: { marks: CRITICAL_STRIKE, palette: { B: PHYSICAL_COLOR, S: SPARK_COLOR } },
  physicalRanged: { marks: MULTI_SHOT, palette: { A: PHYSICAL_COLOR } },
  physicalSupport: { marks: HEALING_AURA, palette: { R: PHYSICAL_COLOR, H: HEAL_COLOR } },
  magicMelee: { marks: ENERGY_BURST_SLASH, palette: { M: MAGIC_COLOR, W: STAR_COLOR } },
  magicRanged: { marks: SPELL_VOLLEY, palette: { O: RANGED_MAGIC_COLOR } },
  magicSupport: { marks: AMPLIFY_BLESSING, palette: { G: SUPPORT_MAGIC_COLOR, P: STAR_COLOR } },
};

export interface SkillIconData {
  frame: string[];
  palette: Record<string, string>;
}

export function getSkillIcon(archetype: Archetype): SkillIconData {
  const spec = SKILL_ICON_SPECS[archetype];
  return { frame: buildFrame(spec.marks), palette: spec.palette };
}
