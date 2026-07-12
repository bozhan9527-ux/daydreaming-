// 分頁導覽用的小圖示,跟 game/sprites/eventIcons.ts 同一套「純程式產生像素格」原則。
// 新增分頁時只要在這裡多加一個 icon frame + 對應的 TabIconId,不用動 UI 元件本身。
export type TabIconId =
  | 'job'
  | 'equipment'
  | 'skill'
  | 'companion'
  | 'enhance'
  | 'socket'
  | 'codex'
  | 'achievement'
  | 'inventory'
  | 'dungeon'
  | 'ascension';

const ICON_COLOR = '#f2f2f2';

const JOB_ICON_FRAME = [
  '..........X.',
  '.........XX.',
  '........XX..',
  '.......XX...',
  '......XX....',
  '.....XX.....',
  '....XX......',
  '...XXXXX....',
  '....XX......',
  '....XX......',
  '....XX......',
  '............',
];

const EQUIPMENT_ICON_FRAME = [
  '...XXXXXX...',
  '..X.XXXX.X..',
  '.X..XXXX..X.',
  'X...XXXX...X',
  'X...XXXX...X',
  'X...XXXX...X',
  '.X..XXXX..X.',
  '..X.XXXX.X..',
  '...XXXXXX...',
  '............',
  '............',
  '............',
];

const SKILL_ICON_FRAME = [
  '............',
  '......XXX...',
  '.....XXX....',
  '....XXX.....',
  '..XXXXXXXX..',
  '.......XX...',
  '......XX....',
  '.....XX.....',
  '....XX......',
  '............',
  '............',
  '............',
];

const COMPANION_ICON_FRAME = [
  '............',
  '..XX....XX..',
  '..XX....XX..',
  '...XX..XX...',
  '...XX..XX...',
  '............',
  '..XXXXXXXX..',
  '.XXXXXXXXXX.',
  '.XXXXXXXXXX.',
  '..XXXXXXXX..',
  '............',
  '............',
];

// 強化:向上箭頭 + 兩側小閃光,呼應「提升等級」的意象。
const ENHANCE_ICON_FRAME = [
  '.....XX.....',
  '....XXXX....',
  '...XXXXXX...',
  '.....XX.....',
  '.....XX.....',
  '.....XX.....',
  '.....XX.....',
  '............',
  '..X......X..',
  '............',
  '............',
  '............',
];

// 鑲嵌:菱形寶石造型。
const SOCKET_ICON_FRAME = [
  '.....XX.....',
  '....XXXX....',
  '...XXXXXX...',
  '..XXXXXXXX..',
  '.XXXXXXXXXX.',
  '..XXXXXXXX..',
  '...XXXXXX...',
  '....XXXX....',
  '.....XX.....',
  '............',
  '............',
  '............',
];

// 圖鑑:書本造型,中央一條書脊線。
const CODEX_ICON_FRAME = [
  '............',
  '.XXXXXXXXXX.',
  '.X........X.',
  '.X...XX...X.',
  '.X...XX...X.',
  '.X...XX...X.',
  '.X...XX...X.',
  '.X...XX...X.',
  '.X...XX...X.',
  '.X........X.',
  '.XXXXXXXXXX.',
  '............',
];

// 成就:獎盃造型(杯身+雙耳把手+底座),呼應「達成目標」的意象。
const ACHIEVEMENT_ICON_FRAME = [
  '...XXXXXX...',
  '.X.XXXXXX.X.',
  '.X.XXXXXX.X.',
  '...XXXXXX...',
  '....XXXX....',
  '.....XX.....',
  '.....XX.....',
  '....XXXX....',
  '...XXXXXX...',
  '............',
  '............',
  '............',
];

// 背包:提把弧線 + 袋身 + 中間口袋接縫,跟裝備分頁裡的皮包/背飾造型呼應但更簡化,
// 12x12在小尺寸的分頁圖示裡還是要一眼認得出是「包」不是「箱子」。
const INVENTORY_ICON_FRAME = [
  '....XXXX....',
  '...X....X...',
  '...X....X...',
  '.XXXXXXXXXX.',
  '.X........X.',
  '.X..XXXX..X.',
  '.X..XXXX..X.',
  '.X........X.',
  '.X........X.',
  '.XXXXXXXXXX.',
  '............',
  '............',
];

// 副本:傳送門/地下城入口造型——外圈拱門輪廓 + 中央鏤空通道,呼應「走進去挑戰」的意象。
const DUNGEON_ICON_FRAME = [
  '....XXXX....',
  '...X....X...',
  '..X......X..',
  '..X......X..',
  '..X......X..',
  '..X.XXXX.X..',
  '..X.X..X.X..',
  '..X.X..X.X..',
  '..X.XXXX.X..',
  '..X......X..',
  '..XXXXXXXX..',
  '............',
];

// 轉生:環狀箭頭造型(缺一角的圓環+箭頭),呼應「輪迴一圈again」的意象,跟副本的
// 拱門/圖鑑的書本區隔開來,一眼看得出是循環而不是進入某個空間。
const ASCENSION_ICON_FRAME = [
  '....XXXX....',
  '..XX....XX..',
  '.X........X.',
  'X..........X',
  'X..........X',
  'X....XX...X.',
  'X....XX..X..',
  'X..........X',
  '.X........X.',
  '..XX....XX..',
  '....XXXX....',
  '............',
];

const TAB_ICON_FRAMES: Record<TabIconId, string[]> = {
  job: JOB_ICON_FRAME,
  equipment: EQUIPMENT_ICON_FRAME,
  skill: SKILL_ICON_FRAME,
  companion: COMPANION_ICON_FRAME,
  enhance: ENHANCE_ICON_FRAME,
  socket: SOCKET_ICON_FRAME,
  codex: CODEX_ICON_FRAME,
  achievement: ACHIEVEMENT_ICON_FRAME,
  inventory: INVENTORY_ICON_FRAME,
  dungeon: DUNGEON_ICON_FRAME,
  ascension: ASCENSION_ICON_FRAME,
};

export interface TabIconData {
  frame: string[];
  palette: Record<string, string>;
}

export function getTabIcon(id: TabIconId): TabIconData {
  return { frame: TAB_ICON_FRAMES[id], palette: { X: ICON_COLOR } };
}
