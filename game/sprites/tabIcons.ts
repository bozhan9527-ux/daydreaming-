// 分頁導覽用的小圖示,跟 game/sprites/eventIcons.ts 同一套「純程式產生像素格」原則。
// 新增分頁時只要在這裡多加一個 icon frame + 對應的 TabIconId,不用動 UI 元件本身。
export type TabIconId = 'job' | 'equipment' | 'skill' | 'companion' | 'enhance' | 'socket';

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

const TAB_ICON_FRAMES: Record<TabIconId, string[]> = {
  job: JOB_ICON_FRAME,
  equipment: EQUIPMENT_ICON_FRAME,
  skill: SKILL_ICON_FRAME,
  companion: COMPANION_ICON_FRAME,
  enhance: ENHANCE_ICON_FRAME,
  socket: SOCKET_ICON_FRAME,
};

export interface TabIconData {
  frame: string[];
  palette: Record<string, string>;
}

export function getTabIcon(id: TabIconId): TabIconData {
  return { frame: TAB_ICON_FRAMES[id], palette: { X: ICON_COLOR } };
}
