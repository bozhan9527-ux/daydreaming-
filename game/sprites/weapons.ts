import { Archetype } from '../combat';
import { upscaleFrame } from './spriteScale';

// 武器外型只吃「職業 + 是否雙手」,50 個等級檔共用同一個外型(呼應 game/equipment.ts 的
// WEAPON_NOUNS,一個職業一款單手、一款雙手),顏色仍吃該裝備自己的 item.color(隨等級檔漸亮),
// 呼叫端(HeroSprite)會把 W 換成該裝備當下的顏色,這裡只負責形狀。
// 形狀在 10x14 基礎網格畫(比舊的 6x10 寬鬆許多,不再侷促,讓每個職業的單手/雙手都能畫出可
// 辨識的具體造型,雙手款體型/細節明顯比單手款更誇張)。
// 注意:SCALE 這裡刻意維持 2,不跟其他 sprite 檔案一樣用 3——game/equipment.ts 的
// SLOT_ANCHORS.mainhand 錨點({x:45,y:19})是拿舊版「6x10 底圖 x3 倍=18x30」的實際輸出尺寸
// 校準的,HeroSprite 疊圖時只用這個錨點的左上角定位、不會把武器拉伸/裁切成 rect.w/h,所以放大
// 倍率如果沒跟著底圖尺寸等比例收斂,武器會整個明顯超出勇者手部位置甚至超出勇者本體畫布。用
// SCALE=2 讓新底圖(10x14)放大後落在 20x28,跟舊的 18x30 錨定尺寸接近,不用去動 HeroSprite.tsx
// /game/equipment.ts 這些不在本次改動範圍內的呼叫端,細節提升但握持位置維持原本校準。
const BASE_WIDTH = 10;
const BASE_HEIGHT = 14;
const SCALE = 2;

function assertFrameShape(frame: string[], label: string): string[] {
  if (frame.length !== BASE_HEIGHT) throw new Error(`${label}: expected ${BASE_HEIGHT} rows, got ${frame.length}`);
  for (const row of frame) {
    if (row.length !== BASE_WIDTH) throw new Error(`${label}: expected row width ${BASE_WIDTH}, got "${row}"`);
  }
  return frame;
}

// 工作手套(工地風味):拳套形的厚實護拳 + 側凸拇指 + 寬版護腕。
const PHYSICAL_MELEE_1H = assertFrameShape(
  [
    '..........',
    '..WWWWWW..',
    '.WWWWWWWW.',
    '.WWWWWWWW.',
    'WWWWWWWWW.',
    'WWWWWWWWW.',
    '.WWWWWWWW.',
    '.WWWWWWWW.',
    '..WWWWWW..',
    '..WWWWWW..',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
  ],
  'physicalMelee 1H'
);

// 鐵鎚(工地風味):寬鎚頭滿版展開 + 收尖過渡 + 長柄,比拳套更巨大沉重。
const PHYSICAL_MELEE_2H = assertFrameShape(
  [
    '..WWWWWW..',
    '.WWWWWWWW.',
    'WWWWWWWWWW',
    'WWWWWWWWWW',
    '.WWWWWWWW.',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
    '...WWWW...',
  ],
  'physicalMelee 2H'
);

// 飛鏢:細長對角線鏢身 + 頭端尖鋒 + 尾端羽尾散開。
const PHYSICAL_RANGED_1H = assertFrameShape(
  [
    '.......WW.',
    '.......WW.',
    '.......W..',
    '.......W..',
    '......W...',
    '.....W....',
    '.....W....',
    '....W.....',
    '....W.....',
    '...W......',
    '..W.......',
    'W.W.W.....',
    'WW.W......',
    'WWW.......',
  ],
  'physicalRanged 1H'
);

// 長弓:對稱弓臂弧線 + 中央握把纏繩 + 貫穿全長的弓弦,比飛鏢更誇張大件。
const PHYSICAL_RANGED_2H = assertFrameShape(
  [
    '....WW....',
    '...WW.W...',
    '..W.W..W..',
    '.W..W...W.',
    '.W..W...W.',
    'W...W....W',
    'W..WWWW..W',
    'W..WWWW..W',
    'W...W....W',
    '.W..W...W.',
    '.W..W...W.',
    '..W.W..W..',
    '...WW.W...',
    '....WW....',
  ],
  'physicalRanged 2H'
);

// 急救箱(超商風味):方正提把箱身,正面挖出十字醫療標記鏤空。
const PHYSICAL_SUPPORT_1H = assertFrameShape(
  [
    '..........',
    '....WW....',
    '...W..W...',
    '..WWWWWW..',
    '..WWWWWW..',
    '..WW..WW..',
    '..W....W..',
    '..WW..WW..',
    '..WWWWWW..',
    '..WWWWWW..',
    '..WWWWWW..',
    '..........',
    '..........',
    '..........',
  ],
  'physicalSupport 1H'
);

// 擔架(超商風味):兩側扶手長桿 + 等距橫桿,收銀台後備用的長型工具,比急救箱誇張許多。
const PHYSICAL_SUPPORT_2H = assertFrameShape(
  [
    '.WWWWWWWW.',
    '..W....W..',
    '..W....W..',
    '..WWWWWW..',
    '..W....W..',
    '..W....W..',
    '..WWWWWW..',
    '..W....W..',
    '..W....W..',
    '..WWWWWW..',
    '..W....W..',
    '..W....W..',
    '..WWWWWW..',
    '.WWWWWWWW.',
  ],
  'physicalSupport 2H'
);

// 符咒短刀(修煉廟宇風味):尖鋒短刀身 + 一字護手 + 纏繩握把 + 小巧刀鐔。
const MAGIC_MELEE_1H = assertFrameShape(
  [
    '....WW....',
    '....WW....',
    '...WWWW...',
    '....WW....',
    '....WW....',
    '....WW....',
    'WWWWWWWWWW',
    '..WWWWWW..',
    '....WW....',
    '...WWWW...',
    '....WW....',
    '...WWWW...',
    '....WW....',
    '...WWWW...',
  ],
  'magicMelee 1H'
);

// 降魔大劍(修煉廟宇風味):加長劍身 + 加厚雙層十字護手 + 長握把,比短刀壯碩許多。
const MAGIC_MELEE_2H = assertFrameShape(
  [
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '...WWWW...',
    '....WW....',
    'WWWWWWWWWW',
    'WWWWWWWWWW',
    '....WW....',
    '...WWWW...',
    '....WW....',
    '...WWWW...',
    '..WWWWWW..',
  ],
  'magicMelee 2H'
);

// 法術面板(工程師風味):扁平掃描面板,四角挖出接口孔洞 + 短握柄。
const MAGIC_RANGED_1H = assertFrameShape(
  [
    '..........',
    '..WWWWWW..',
    '..WWWWWW..',
    '..W.WW.W..',
    '..WWWWWW..',
    '..W.WW.W..',
    '..WWWWWW..',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
  ],
  'magicRanged 1H'
);

// 法杖(工程師風味):頂端法球 + 天線圈狀收束 + 長桿 + 加寬底座,比面板誇張立體許多。
const MAGIC_RANGED_2H = assertFrameShape(
  [
    '....WW....',
    '...WWWW...',
    '..WWWWWW..',
    '...WWWW...',
    '....WW....',
    '..WWWWWW..',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '...WWWW...',
  ],
  'magicRanged 2H'
);

// 藥瓶(醫護風味):軟木塞 + 窄頸 + 圓身,中段挖出一道刻度線代表藥液刻度。
const MAGIC_SUPPORT_1H = assertFrameShape(
  [
    '..........',
    '....WW....',
    '....WW....',
    '...WWWW...',
    '..WWWWWW..',
    '..WWWWWW..',
    '..W....W..',
    '..WWWWWW..',
    '..WWWWWW..',
    '...WWWW...',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  'magicSupport 1H'
);

// 藥箱權杖(醫護風味):頂端十字藥箱(鏤空成十字標記)+ 長桿 + 加寬底座,比藥瓶誇張立體許多。
const MAGIC_SUPPORT_2H = assertFrameShape(
  [
    '...WWWW...',
    '...W..W...',
    '...WWWW...',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '...WWWW...',
  ],
  'magicSupport 2H'
);

// 起始款(不限職業的舊 18 款)沒有 archetype,給一款通用短劍外型。
const GENERIC_1H = assertFrameShape(
  [
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '..WWWWWW..',
    '....WW....',
    '....WW....',
    '....WW....',
    '...WWWW...',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  'generic 1H'
);

// 通用大劍外型,比通用短劍更長更厚重。
const GENERIC_2H = assertFrameShape(
  [
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '..WWWWWW..',
    '....WW....',
    '....WW....',
    '....WW....',
    '....WW....',
    '...WWWW...',
    '..........',
    '..........',
  ],
  'generic 2H'
);

const WEAPON_FRAMES: Record<Archetype, { oneHanded: string[]; twoHanded: string[] }> = {
  physicalMelee: { oneHanded: PHYSICAL_MELEE_1H, twoHanded: PHYSICAL_MELEE_2H },
  physicalRanged: { oneHanded: PHYSICAL_RANGED_1H, twoHanded: PHYSICAL_RANGED_2H },
  physicalSupport: { oneHanded: PHYSICAL_SUPPORT_1H, twoHanded: PHYSICAL_SUPPORT_2H },
  magicMelee: { oneHanded: MAGIC_MELEE_1H, twoHanded: MAGIC_MELEE_2H },
  magicRanged: { oneHanded: MAGIC_RANGED_1H, twoHanded: MAGIC_RANGED_2H },
  magicSupport: { oneHanded: MAGIC_SUPPORT_1H, twoHanded: MAGIC_SUPPORT_2H },
};

const WEAPON_FILL_KEY = 'W';

export interface WeaponFrameData {
  frame: string[];
  fillKey: string;
}

// archetype 是 undefined 時代表舊有不限職業的起始武器,給通用外型。
export function getWeaponFrame(archetype: Archetype | undefined, twoHanded: boolean | undefined): WeaponFrameData {
  if (archetype === undefined) {
    return { frame: upscaleFrame(twoHanded ? GENERIC_2H : GENERIC_1H, SCALE), fillKey: WEAPON_FILL_KEY };
  }
  const set = WEAPON_FRAMES[archetype];
  return { frame: upscaleFrame(twoHanded ? set.twoHanded : set.oneHanded, SCALE), fillKey: WEAPON_FILL_KEY };
}
