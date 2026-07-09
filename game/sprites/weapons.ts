import { Archetype } from '../combat';

// 武器外型只吃「職業 + 是否雙手」,50 個等級檔共用同一個外型(呼應 game/equipment.ts 的
// WEAPON_NOUNS,一個職業一款單手、一款雙手),顏色仍吃該裝備自己的 item.color(隨等級檔漸亮),
// 呼叫端(HeroSprite)會把 W 換成該裝備當下的顏色,這裡只負責形狀。
const WEAPON_WIDTH = 6;
const WEAPON_HEIGHT = 10;

function assertFrameShape(frame: string[], label: string): string[] {
  if (frame.length !== WEAPON_HEIGHT) throw new Error(`${label}: expected ${WEAPON_HEIGHT} rows, got ${frame.length}`);
  for (const row of frame) {
    if (row.length !== WEAPON_WIDTH) throw new Error(`${label}: expected row width ${WEAPON_WIDTH}, got "${row}"`);
  }
  return frame;
}

// 工作手套:拳套形的方塊,窄柄。
const PHYSICAL_MELEE_1H = assertFrameShape(
  ['......', '.WWWW.', '.WWWW.', '.WWWW.', '.WWWW.', '..WW..', '..WW..', '......', '......', '......'],
  'physicalMelee 1H'
);

// 鐵鎚:寬鎚頭 + 長柄。
const PHYSICAL_MELEE_2H = assertFrameShape(
  ['WWWWWW', 'WWWWWW', 'WWWWWW', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..'],
  'physicalMelee 2H'
);

// 飛鏢:細長對角線,像擲出去的鏢。
const PHYSICAL_RANGED_1H = assertFrameShape(
  ['.....W', '....WW', '...WW.', '..WW..', '.WW...', 'WW....', 'W.....', '......', '......', '......'],
  'physicalRanged 1H'
);

// 長弓:弓臂弧線 + 中間弓弦。
const PHYSICAL_RANGED_2H = assertFrameShape(
  ['..WW..', '.W..W.', 'W...W.', 'W...W.', 'W...W.', 'W...W.', 'W...W.', 'W...W.', '.W..W.', '..WW..'],
  'physicalRanged 2H'
);

// 急救箱:方正小箱子。
const PHYSICAL_SUPPORT_1H = assertFrameShape(
  ['......', '.WWWW.', '.WWWW.', '.WWWW.', '.WWWW.', '......', '......', '......', '......', '......'],
  'physicalSupport 1H'
);

// 擔架:長柄配橫桿,梯形節奏。
const PHYSICAL_SUPPORT_2H = assertFrameShape(
  ['.WWWW.', '.W..W.', '.W..W.', '.WWWW.', '.W..W.', '.W..W.', '.WWWW.', '.W..W.', '.W..W.', '.WWWW.'],
  'physicalSupport 2H'
);

// 符咒短刀:十字護手 + 短刀身。
const MAGIC_MELEE_1H = assertFrameShape(
  ['......', '..WW..', '..WW..', 'WWWWWW', '..WW..', '..WW..', '..WW..', '......', '......', '......'],
  'magicMelee 1H'
);

// 降魔大劍:長刀身 + 十字護手 + 長柄。
const MAGIC_MELEE_2H = assertFrameShape(
  ['..WW..', '..WW..', '..WW..', '..WW..', 'WWWWWW', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..'],
  'magicMelee 2H'
);

// 法術鍵盤:扁平面板 + 短柄。
const MAGIC_RANGED_1H = assertFrameShape(
  ['......', 'WWWWWW', 'WWWWWW', '..WW..', '..WW..', '......', '......', '......', '......', '......'],
  'magicRanged 1H'
);

// 法杖:頂端法球 + 長柄。
const MAGIC_RANGED_2H = assertFrameShape(
  ['.WWWW.', 'WWWWWW', '.WWWW.', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..'],
  'magicRanged 2H'
);

// 藥瓶:窄頸寬身。
const MAGIC_SUPPORT_1H = assertFrameShape(
  ['......', '..WW..', '..WW..', '.WWWW.', '.WWWW.', '.WWWW.', '..WW..', '......', '......', '......'],
  'magicSupport 1H'
);

// 藥箱權杖:頂端藥箱 + 長柄。
const MAGIC_SUPPORT_2H = assertFrameShape(
  ['.WWWW.', '.WWWW.', '.WWWW.', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..', '..WW..'],
  'magicSupport 2H'
);

// 起始款(不限職業的舊 18 款)沒有 archetype,給一款通用短劍/大劍外型。
const GENERIC_1H = assertFrameShape(
  ['......', '..WW..', '..WW..', '..WW..', 'WWWWWW', '..WW..', '..WW..', '......', '......', '......'],
  'generic 1H'
);

const GENERIC_2H = assertFrameShape(
  ['..WW..', '..WW..', '..WW..', '..WW..', '..WW..', 'WWWWWW', '..WW..', '..WW..', '..WW..', '..WW..'],
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
    return { frame: twoHanded ? GENERIC_2H : GENERIC_1H, fillKey: WEAPON_FILL_KEY };
  }
  const set = WEAPON_FRAMES[archetype];
  return { frame: twoHanded ? set.twoHanded : set.oneHanded, fillKey: WEAPON_FILL_KEY };
}
