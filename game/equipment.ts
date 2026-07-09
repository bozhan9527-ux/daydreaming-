import { Archetype, getCurrentTier, getJobTitle, JobTier } from './combat';

export type EquipmentSlot =
  | 'back'
  | 'bottom'
  | 'top'
  | 'belt'
  | 'headwear'
  | 'face'
  | 'gloves'
  | 'offhand'
  | 'mainhand';

export type EquipmentBonusStat = 'exp' | 'coins' | 'speed';

export interface EquipmentBonus {
  stat: EquipmentBonusStat;
  value: number;
}

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  color: string;
  price: number;
  bonus: EquipmentBonus;
  twoHanded?: boolean;
  // undefined = 不限職業(起始/性別預設款);有值 = 職業鎖裝,只有該職業能裝備。
  archetype?: Archetype;
  // undefined = 無等級限制;有值 = 要練到這個等級才能購買/裝備。
  requiredLevel?: number;
}

// 每插槽固定一種加成類型(此插槽兩款只差數值),數值 = 百分比加成(0.02 = +2%):
// 免費款(-01)給小加成,付費款(-02)給大加成,呼應現有定價邏輯。
// back/bottom/face/mainhand = speed(縮短戰鬥時間);top/headwear/gloves = exp;belt/offhand = coins。
// 這 18 款不限職業、不限等級,主要作為起始裝備跟性別預設外觀(見 GENDER_DEFAULT_LOADOUT),
// 在下方生成式的職業鎖裝目錄開放之前(Lv10 起)先讓角色有基礎樣貌跟些微加成。
const LEGACY_EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'back-01', slot: 'back', name: '素色披風', color: '#6b6678', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'back-02', slot: 'back', name: '厚重斗篷', color: '#4a4456', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'bottom-01', slot: 'bottom', name: '粗布長褲', color: '#5c5468', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'bottom-02', slot: 'bottom', name: '皮革護腿', color: '#3a3542', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'top-01', slot: 'top', name: '亞麻上衣', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'top-02', slot: 'top', name: '皮甲背心', color: '#7a7488', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'belt-01', slot: 'belt', name: '麻繩腰帶', color: '#c9a94f', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'belt-02', slot: 'belt', name: '鉚釘皮帶', color: '#9c8a3f', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'headwear-01', slot: 'headwear', name: '布帽', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'headwear-02', slot: 'headwear', name: '鐵盔', color: '#7a7488', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'face-01', slot: 'face', name: '眼罩', color: '#3a3542', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'face-02', slot: 'face', name: '護目鏡', color: '#6ab0e0', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'gloves-01', slot: 'gloves', name: '布手套', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'gloves-02', slot: 'gloves', name: '皮革手套', color: '#6b6678', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'offhand-01', slot: 'offhand', name: '木盾', color: '#8b8698', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'offhand-02', slot: 'offhand', name: '厚重書冊', color: '#b389e0', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'mainhand-01', slot: 'mainhand', name: '短劍', color: '#d9c9b8', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  {
    id: 'mainhand-02',
    slot: 'mainhand',
    name: '雙手大劍',
    color: '#d9c9b8',
    price: 60,
    bonus: { stat: 'speed', value: 0.05 },
    twoHanded: true,
  },
];

// ---- 職業鎖裝生成式目錄 ----
// 9 個槽位(主手拆成單手/雙手兩條線)各自 50 個等級檔(Lv10~500,每 10 等一檔) × 6 職業,
// 單一槽位剛好 300 款,主手單手 300 款 + 雙手 300 款。用生成而非手打,避免 3000 筆物件字面量。
const ARCHETYPES: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

const BRACKET_COUNT = 50;
const LEVELS_PER_BRACKET = 10;

function bracketRequiredLevel(bracket: number): number {
  return bracket * LEVELS_PER_BRACKET;
}

// 前快後慢(對數收斂):bracket=1(Lv10)貼近舊制免費款的 2%,bracket=50(Lv500)收斂到上限 30%。
const MIN_BONUS = 0.02;
const MAX_BONUS = 0.3;

// log(bracket)/log(50) 讓 bracket=1 精準落在 0(=MIN_BONUS)、bracket=50 精準落在 1(=MAX_BONUS),
// 不會像 log(1+bracket) 那樣在 bracket=1 就已經吃掉一大截成長量。
function bracketBonusValue(bracket: number): number {
  const t = Math.log(bracket) / Math.log(BRACKET_COUNT);
  const raw = MIN_BONUS + t * (MAX_BONUS - MIN_BONUS);
  return Math.round(raw * 1000) / 1000;
}

// 雙手武器犧牲副手格,單件加成用倍率補償,呼應「雙手武器賭大加成」的取捨。
const TWO_HANDED_BONUS_MULTIPLIER = 1.8;
const TWO_HANDED_PRICE_MULTIPLIER = 1.6;

const PRICE_BASE = 20;
const PRICE_EXPONENT = 1.6;

function bracketPrice(bracket: number): number {
  return Math.round(PRICE_BASE * Math.pow(bracket, PRICE_EXPONENT));
}

const SLOT_STAT: Record<EquipmentSlot, EquipmentBonusStat> = {
  back: 'speed',
  bottom: 'speed',
  face: 'speed',
  mainhand: 'speed',
  top: 'exp',
  headwear: 'exp',
  gloves: 'exp',
  belt: 'coins',
  offhand: 'coins',
};

// 每個職業的裝備名稱都對應「該轉職階段」現實中真的會用到的物品,不是整條 50 檔共用一個詞。
// 5 階對應 game/combat.ts JOB_TITLES 分支 A 的 5 個現實身分,裝備跟著身分換,例如
// physicalMelee 從「工讀生」的棉紗手套換到「特種部隊」的戰術手套,不是同一款東西穿到底。
type SlotNounsByTier = Record<JobTier, Partial<Record<EquipmentSlot, string>>>;

const SLOT_BASE_NOUN_BY_ARCHETYPE_TIER: Record<Archetype, SlotNounsByTier> = {
  // 工讀生 → 搬運工 → 工地師傅 → 消防員 → 特種部隊
  physicalMelee: {
    1: {
      back: '工作背帶',
      bottom: '工作褲',
      top: '反光背心',
      belt: '工具腰帶',
      headwear: '工地安全帽',
      face: '防塵口罩',
      gloves: '棉紗手套',
      offhand: '工具箱',
    },
    2: {
      back: '搬運護腰帶',
      bottom: '耐磨工作褲',
      top: '搬運背心',
      belt: '貨物固定帶',
      headwear: '針織帽',
      face: '防塵面罩',
      gloves: '防滑手套',
      offhand: '手推車',
    },
    3: {
      back: '工程背心',
      bottom: '工程長褲',
      top: '反光工程外套',
      belt: '電工腰帶',
      headwear: 'ABS 安全帽',
      face: '焊接面罩',
      gloves: '皮革工作手套',
      offhand: '對講機',
    },
    4: {
      back: '消防氧氣瓶',
      bottom: '防火褲',
      top: '消防衣',
      belt: '消防安全帶',
      headwear: '消防頭盔',
      face: '防毒面具',
      gloves: '消防手套',
      offhand: '滅火器',
    },
    5: {
      back: '戰術背包',
      bottom: '戰術長褲',
      top: '防彈背心',
      belt: '戰術腰帶',
      headwear: '戰術頭盔',
      face: '夜視鏡',
      gloves: '戰術手套',
      offhand: '閃光彈',
    },
  },
  // 外送員 → 計程車司機 → 警察 → 職業獵人 → 狙擊手
  physicalRanged: {
    1: {
      back: '外送保溫箱',
      bottom: '機車雨褲',
      top: '反光外送背心',
      belt: '證件腰包',
      headwear: '全罩安全帽',
      face: '防風鏡',
      gloves: '騎士手套',
      offhand: '對講機',
    },
    2: {
      back: '計程車座椅靠枕',
      bottom: '司機長褲',
      top: '計程車制服',
      belt: '零錢腰包',
      headwear: '司機帽',
      face: '太陽眼鏡',
      gloves: '排檔手套',
      offhand: '導航機',
    },
    3: {
      back: '警用背包',
      bottom: '警用長褲',
      top: '警用制服',
      belt: '警用勤務帶',
      headwear: '警帽',
      face: '防彈面罩',
      gloves: '防刺手套',
      offhand: '警用無線電',
    },
    4: {
      back: '獵人背包',
      bottom: '迷彩長褲',
      top: '迷彩獵裝',
      belt: '彈藥腰帶',
      headwear: '迷彩帽',
      face: '偽裝面罩',
      gloves: '狩獵手套',
      offhand: '誘鳥笛',
    },
    5: {
      back: '狙擊背包',
      bottom: '吉利服褲',
      top: '吉利服',
      belt: '彈匣腰帶',
      headwear: '狙擊頭套',
      face: '測距鏡',
      gloves: '狙擊手套',
      offhand: '風速計',
    },
  },
  // 超商店員 → 餐廳服務生 → 護理師 → 健身教練 → 急診室王牌護理長
  physicalSupport: {
    1: {
      back: '店員背包',
      bottom: '店員長褲',
      top: '店員制服',
      belt: '收銀腰包',
      headwear: '店員小帽',
      face: '口罩',
      gloves: '收銀手套',
      offhand: '條碼掃描器',
    },
    2: {
      back: '服務生圍裙背帶',
      bottom: '服務生長褲',
      top: '服務生背心',
      belt: '點餐機腰包',
      headwear: '服務生領結',
      face: '餐廳口罩',
      gloves: '上菜手套',
      offhand: '托盤',
    },
    3: {
      back: '急救後背包',
      bottom: '護理長褲',
      top: '護理師制服',
      belt: '工作圍裙',
      headwear: '護理帽',
      face: '醫療口罩',
      gloves: '拋棄式手套',
      offhand: '血氧機',
    },
    4: {
      back: '健身背心',
      bottom: '訓練短褲',
      top: '緊身運動衣',
      belt: '舉重腰帶',
      headwear: '運動頭帶',
      face: '運動墨鏡',
      gloves: '健身手套',
      offhand: '計時碼錶',
    },
    5: {
      back: '急診值班背包',
      bottom: '手術長褲',
      top: '手術服',
      belt: '急救腰包',
      headwear: '手術髮帽',
      face: '護目面罩',
      gloves: '無菌手套',
      offhand: '心臟去顫器',
    },
  },
  // 中二國中生 → 阿志 → 道士/法師 → 命理師 → 得道仙人
  magicMelee: {
    1: {
      back: '黑色連帽外套',
      bottom: '制服長褲',
      top: '制服襯衫',
      belt: '帆布腰帶',
      headwear: '單邊瀏海',
      face: '眼罩',
      gloves: '繃帶手套',
      offhand: '中二筆記本',
    },
    2: {
      back: '神轎背帶',
      bottom: '陣頭褲',
      top: '廟會背心',
      belt: '符令腰帶',
      headwear: '陣頭頭巾',
      face: '面繪',
      gloves: '白手套',
      offhand: '銅鑼',
    },
    3: {
      back: '符咒披風',
      bottom: '道士褲',
      top: '道袍',
      belt: '八卦腰帶',
      headwear: '道士帽',
      face: '護身符',
      gloves: '白棉手套',
      offhand: '桃木劍鞘',
    },
    4: {
      back: '卦攤布幔',
      bottom: '唐裝褲',
      top: '唐裝',
      belt: '銅錢腰帶',
      headwear: '瓜皮帽',
      face: '老花眼鏡',
      gloves: '占卜手套',
      offhand: '羅盤',
    },
    5: {
      back: '仙氣雲紋披風',
      bottom: '仙裙褲',
      top: '仙人白袍',
      belt: '玉帶',
      headwear: '蓮花冠',
      face: '仙氣面紗',
      gloves: '白玉護手',
      offhand: '拂塵',
    },
  },
  // 電競選手/實況主 → 軟體工程師 → 研究員/科學家 → 駭客 → AI 天才工程師
  magicRanged: {
    1: {
      back: '戰隊背包',
      bottom: '電競長褲',
      top: '連帽衛衣',
      belt: '隨身碟腰包',
      headwear: '電競耳機',
      face: '藍光眼鏡',
      gloves: '電競手套',
      offhand: '行動電源',
    },
    2: {
      back: '筆電後背包',
      bottom: '工程師長褲',
      top: '格子襯衫',
      belt: '識別證吊帶',
      headwear: '降噪耳機',
      face: '抗藍光眼鏡',
      gloves: '打字手套',
      offhand: '保溫咖啡杯',
    },
    3: {
      back: '實驗室背包',
      bottom: '實驗長褲',
      top: '白色實驗袍',
      belt: '儀器腰帶',
      headwear: '護目鏡頭帶',
      face: '實驗護目鏡',
      gloves: '丁腈手套',
      offhand: '試管架',
    },
    4: {
      back: '匿名背包',
      bottom: '黑色連帽長褲',
      top: '連帽外套',
      belt: '隨身硬碟腰帶',
      headwear: '面罩兜帽',
      face: '面具',
      gloves: '觸控手套',
      offhand: '隨身路由器',
    },
    5: {
      back: '量子背包',
      bottom: '未來科技長褲',
      top: '全息投影外套',
      belt: '神經連結腰帶',
      headwear: '腦機介面頭環',
      face: 'AR 智慧眼鏡',
      gloves: '觸覺回饋手套',
      offhand: '量子運算晶片',
    },
  },
  // 藥師 → 醫生 → 心理諮商師 → 老中醫 → 神醫/華佗再世
  magicSupport: {
    1: {
      back: '藥師背包',
      bottom: '藥局長褲',
      top: '藥師白袍',
      belt: '藥袋腰包',
      headwear: '藥師帽',
      face: '藥用口罩',
      gloves: '藥品手套',
      offhand: '藥杵藥臼',
    },
    2: {
      back: '醫師後背包',
      bottom: '白袍長褲',
      top: '白袍',
      belt: '聽診器',
      headwear: '手術髮帽',
      face: '醫療口罩',
      gloves: '乳膠手套',
      offhand: '血壓計',
    },
    3: {
      back: '諮商背包',
      bottom: '諮商師西裝褲',
      top: '針織開襟外套',
      belt: '筆記本腰包',
      headwear: '舒壓髮帶',
      face: '溫和款眼鏡',
      gloves: '無指手套',
      offhand: '沙盤玩具',
    },
    4: {
      back: '藥箱背帶',
      bottom: '唐裝褲',
      top: '中醫唐裝',
      belt: '脈枕腰帶',
      headwear: '瓜皮帽',
      face: '老花眼鏡',
      gloves: '把脈手套',
      offhand: '藥碾',
    },
    5: {
      back: '神醫藥箱背帶',
      bottom: '仙醫長袍褲',
      top: '神醫長袍',
      belt: '金針腰帶',
      headwear: '醫仙冠',
      face: '仙氣面紗',
      gloves: '金針手套',
      offhand: '再生藥丸',
    },
  },
};

// 武器一樣按 5 階換款,呼應各階現實身分(見上方 SLOT_BASE_NOUN_BY_ARCHETYPE_TIER 的職業世界觀)。
type WeaponNounsByTier = Record<JobTier, { oneHanded: string; twoHanded: string }>;

const WEAPON_NOUNS_BY_TIER: Record<Archetype, WeaponNounsByTier> = {
  physicalMelee: {
    1: { oneHanded: '工作手套', twoHanded: '鐵鎚' },
    2: { oneHanded: '打包膠帶槍', twoHanded: '貨物撬棍' },
    3: { oneHanded: '電鑽', twoHanded: '電鋸' },
    4: { oneHanded: '消防斧', twoHanded: '破壞剪' },
    5: { oneHanded: '戰鬥匕首', twoHanded: '突擊步槍' },
  },
  physicalRanged: {
    1: { oneHanded: '美工刀', twoHanded: 'U 型大鎖' },
    2: { oneHanded: '方向盤鎖', twoHanded: '千斤頂' },
    3: { oneHanded: '警棍', twoHanded: '霰彈槍' },
    4: { oneHanded: '獵刀', twoHanded: '獵槍' },
    5: { oneHanded: '消音手槍', twoHanded: '狙擊步槍' },
  },
  physicalSupport: {
    1: { oneHanded: '御飯糰加熱夾', twoHanded: '補貨推車' },
    2: { oneHanded: '開瓶器', twoHanded: '大托盤' },
    3: { oneHanded: '針筒', twoHanded: '點滴架' },
    4: { oneHanded: '啞鈴', twoHanded: '槓鈴' },
    5: { oneHanded: '急救剪', twoHanded: '急救推車' },
  },
  magicMelee: {
    1: { oneHanded: '木劍', twoHanded: '掃把' },
    2: { oneHanded: '七星劍', twoHanded: '關刀' },
    3: { oneHanded: '桃木劍', twoHanded: '拂塵杖' },
    4: { oneHanded: '銅錢劍', twoHanded: '招財貓棒' },
    5: { oneHanded: '仙劍', twoHanded: '如意金箍棒' },
  },
  magicRanged: {
    1: { oneHanded: '電競鍵盤', twoHanded: '電競滑鼠墊' },
    2: { oneHanded: '機械鍵盤', twoHanded: '雙螢幕支架' },
    3: { oneHanded: '雷射筆', twoHanded: '顯微鏡' },
    4: { oneHanded: '資安隨身碟', twoHanded: '伺服器主機' },
    5: { oneHanded: '神經連結手環', twoHanded: 'AI 核心終端機' },
  },
  magicSupport: {
    1: { oneHanded: '藥瓶', twoHanded: '藥箱權杖' },
    2: { oneHanded: '反射錘', twoHanded: '點滴架' },
    3: { oneHanded: '減壓筆', twoHanded: '沙發抱枕' },
    4: { oneHanded: '銀針', twoHanded: '藥杵' },
    5: { oneHanded: '華佗神針', twoHanded: '再世金刀' },
  },
};

const ARCHETYPE_BASE_COLOR: Record<Archetype, string> = {
  physicalMelee: '#8b8698',
  physicalRanged: '#7a9e7e',
  physicalSupport: '#c9a94f',
  magicMelee: '#b389e0',
  magicRanged: '#6ab0e0',
  magicSupport: '#e0a0c0',
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

// 等級檔越高,顏色越往亮部靠(視覺上暗示「越後期越華麗」),幅度封頂在 35%。
function shiftColorForBracket(baseHex: string, bracket: number): string {
  const [r, g, b] = hexToRgb(baseHex);
  const t = (bracket - 1) / (BRACKET_COUNT - 1);
  const brighten = t * 0.35;
  return rgbToHex(r + (255 - r) * brighten, g + (255 - g) * brighten, b + (255 - b) * brighten);
}

function jobTierAndTitleAtLevel(archetype: Archetype, level: number): { tier: JobTier; title: string } {
  const tier = getCurrentTier(level);
  return { tier, title: getJobTitle(archetype, 'A', tier) };
}

function generateRegularSlotItems(slot: EquipmentSlot): EquipmentItem[] {
  const stat = SLOT_STAT[slot];
  const items: EquipmentItem[] = [];
  for (const archetype of ARCHETYPES) {
    const baseColor = ARCHETYPE_BASE_COLOR[archetype];
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const { tier, title } = jobTierAndTitleAtLevel(archetype, requiredLevel);
      const baseNoun = SLOT_BASE_NOUN_BY_ARCHETYPE_TIER[archetype][tier][slot];
      if (!baseNoun) continue;
      items.push({
        id: `${slot}-${archetype}-${bracket}`,
        slot,
        name: `${title}${baseNoun}·Lv${requiredLevel}`,
        color: shiftColorForBracket(baseColor, bracket),
        price: bracketPrice(bracket),
        bonus: { stat, value: bracketBonusValue(bracket) },
        archetype,
        requiredLevel,
      });
    }
  }
  return items;
}

function generateMainhandItems(): EquipmentItem[] {
  const stat = SLOT_STAT.mainhand;
  const items: EquipmentItem[] = [];
  for (const archetype of ARCHETYPES) {
    const baseColor = ARCHETYPE_BASE_COLOR[archetype];
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const { tier, title } = jobTierAndTitleAtLevel(archetype, requiredLevel);
      const nouns = WEAPON_NOUNS_BY_TIER[archetype][tier];
      const color = shiftColorForBracket(baseColor, bracket);
      const oneHandedBonus = bracketBonusValue(bracket);
      const price = bracketPrice(bracket);

      items.push({
        id: `mainhand-1h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${nouns.oneHanded}·Lv${requiredLevel}`,
        color,
        price,
        bonus: { stat, value: oneHandedBonus },
        archetype,
        requiredLevel,
      });

      items.push({
        id: `mainhand-2h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${nouns.twoHanded}·Lv${requiredLevel}(雙手)`,
        color,
        price: Math.round(price * TWO_HANDED_PRICE_MULTIPLIER),
        bonus: { stat, value: Math.round(oneHandedBonus * TWO_HANDED_BONUS_MULTIPLIER * 1000) / 1000 },
        archetype,
        requiredLevel,
        twoHanded: true,
      });
    }
  }
  return items;
}

const GENERATED_REGULAR_SLOTS: EquipmentSlot[] = [
  'back',
  'bottom',
  'top',
  'belt',
  'headwear',
  'face',
  'gloves',
  'offhand',
];

const GENERATED_EQUIPMENT_ITEMS: EquipmentItem[] = [
  ...GENERATED_REGULAR_SLOTS.flatMap((slot) => generateRegularSlotItems(slot)),
  ...generateMainhandItems(),
];

export const EQUIPMENT_ITEMS: EquipmentItem[] = [...LEGACY_EQUIPMENT_ITEMS, ...GENERATED_EQUIPMENT_ITEMS];

export type EquipmentLoadout = Partial<Record<EquipmentSlot, string>>;

export function createEmptyLoadout(): EquipmentLoadout {
  return {};
}

// 目錄有 3000+ 筆,查找一律走 Map,避免每次都線性掃描整個陣列。
const EQUIPMENT_ITEMS_BY_ID = new Map(EQUIPMENT_ITEMS.map((item) => [item.id, item]));
const EQUIPMENT_ITEMS_BY_SLOT = new Map<EquipmentSlot, EquipmentItem[]>();
for (const item of EQUIPMENT_ITEMS) {
  const list = EQUIPMENT_ITEMS_BY_SLOT.get(item.slot);
  if (list) list.push(item);
  else EQUIPMENT_ITEMS_BY_SLOT.set(item.slot, [item]);
}

export function getItemById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_ITEMS_BY_ID.get(id);
}

export function getItemsForSlot(slot: EquipmentSlot): EquipmentItem[] {
  return EQUIPMENT_ITEMS_BY_SLOT.get(slot) ?? [];
}

export function isArchetypeCompatible(item: EquipmentItem, archetype: Archetype): boolean {
  return item.archetype === undefined || item.archetype === archetype;
}

export function isLevelSufficient(item: EquipmentItem, level: number): boolean {
  return item.requiredLevel === undefined || level >= item.requiredLevel;
}

export function canEquipItem(item: EquipmentItem, archetype: Archetype, level: number): boolean {
  return isArchetypeCompatible(item, archetype) && isLevelSufficient(item, level);
}

// 只回傳目前職業能穿的款式(不限職業的舊起始款 + 對應職業的鎖裝款),給 UI 篩選用。
export function getEquippableItemsForSlot(slot: EquipmentSlot, archetype: Archetype): EquipmentItem[] {
  return getItemsForSlot(slot).filter((item) => isArchetypeCompatible(item, archetype));
}

// 切職業後,原本裝備的職業鎖裝若跟新職業不符就直接卸下,不限職業的款式不受影響。
export function filterLoadoutForArchetype(loadout: EquipmentLoadout, archetype: Archetype): EquipmentLoadout {
  const next: EquipmentLoadout = {};
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (item && isArchetypeCompatible(item, archetype)) next[slot] = itemId;
  }
  return next;
}

// 雙手武器裝備時副手鎖死清空;反過來裝備副手時,若目前主手是雙手武器也一併清空。
export function equipItem(loadout: EquipmentLoadout, itemId: string): EquipmentLoadout {
  const item = getItemById(itemId);
  if (!item) return loadout;

  const next: EquipmentLoadout = { ...loadout, [item.slot]: item.id };

  if (item.slot === 'mainhand' && item.twoHanded) {
    delete next.offhand;
  }

  if (item.slot === 'offhand') {
    const currentMainhand = next.mainhand ? getItemById(next.mainhand) : undefined;
    if (currentMainhand?.twoHanded) delete next.mainhand;
  }

  return next;
}

export function unequipSlot(loadout: EquipmentLoadout, slot: EquipmentSlot): EquipmentLoadout {
  const next = { ...loadout };
  delete next[slot];
  return next;
}

// 解鎖狀態:price 為 0 的起始裝一律視為已解鎖,不需要出現在清單裡。
export type UnlockedItemIds = string[];

export function createEmptyUnlockedItems(): UnlockedItemIds {
  return [];
}

export function isItemUnlocked(unlocked: UnlockedItemIds, itemId: string): boolean {
  const item = getItemById(itemId);
  if (!item) return false;
  return item.price === 0 || unlocked.includes(itemId);
}

export function unlockItem(unlocked: UnlockedItemIds, itemId: string): UnlockedItemIds {
  if (unlocked.includes(itemId)) return unlocked;
  return [...unlocked, itemId];
}

// 性別不做獨立身體變體,改用預設裝備組合(頭飾/下身/上身)區分外觀,對應 CLAUDE.md 規格。
export type Gender = 'male' | 'female';

export const GENDER_DEFAULT_LOADOUT: Record<Gender, Partial<Record<EquipmentSlot, string>>> = {
  male: { headwear: 'headwear-02', top: 'top-02', bottom: 'bottom-02' },
  female: { headwear: 'headwear-01', top: 'top-01', bottom: 'bottom-01' },
};

// 切換性別只覆蓋頭飾/上身/下身三格,武器、副手、腰帶等其餘裝備維持玩家原有選擇。
export function applyGenderDefault(loadout: EquipmentLoadout, gender: Gender): EquipmentLoadout {
  return { ...loadout, ...GENDER_DEFAULT_LOADOUT[gender] };
}

// 換性別是角色設定,不是商店消費;對應性別的頭飾/上身/下身即使原本要收費也強制免費解鎖。
export function getGenderUnlockItems(gender: Gender): string[] {
  return Object.values(GENDER_DEFAULT_LOADOUT[gender]);
}

// 座標系對應 game/sprites/heroSilhouette.ts 的原生 20 欄 x 24 列網格,
// 僅以「normal」體型的輪廓比例校準;thin/fat 選擇時疊圖會有些微不貼合,
// 屬於這個架構驗證階段可接受的簡化,尚未做到依體型即時縮放錨點。
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SLOT_ANCHORS: Record<EquipmentSlot, Rect[]> = {
  back: [{ x: 3, y: 9, w: 14, h: 6 }],
  bottom: [{ x: 6, y: 15, w: 8, h: 5 }],
  top: [{ x: 5, y: 9, w: 10, h: 5 }],
  belt: [{ x: 5, y: 14, w: 10, h: 1 }],
  headwear: [{ x: 5, y: 1, w: 10, h: 3 }],
  face: [{ x: 6, y: 4, w: 8, h: 2 }],
  gloves: [
    { x: 4, y: 11, w: 1, h: 2 },
    { x: 15, y: 11, w: 1, h: 2 },
  ],
  offhand: [{ x: 1, y: 10, w: 3, h: 4 }],
  // 比其他槽位大,給武器外型(game/sprites/weapons.ts)足夠的像素空間畫出可辨識的形狀。
  mainhand: [{ x: 14, y: 8, w: 6, h: 10 }],
};

// 疊圖繪製順序,對應 CLAUDE.md 文件的 z-order:背飾→下身→上身→腰帶→頭飾→面飾→手套→副手→主手武器。
export const SLOT_Z_ORDER: EquipmentSlot[] = [
  'back',
  'bottom',
  'top',
  'belt',
  'headwear',
  'face',
  'gloves',
  'offhand',
  'mainhand',
];

export interface EquipmentOverlay {
  rect: Rect;
  color: string;
  slot: EquipmentSlot;
  item: EquipmentItem;
}

export function getEquippedOverlays(loadout: EquipmentLoadout): EquipmentOverlay[] {
  const overlays: EquipmentOverlay[] = [];
  for (const slot of SLOT_Z_ORDER) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    for (const rect of SLOT_ANCHORS[slot]) {
      overlays.push({ rect, color: item.color, slot, item });
    }
  }
  return overlays;
}

export interface EquipmentBonusTotals {
  exp: number;
  coins: number;
  speed: number;
}

// 裝備加成總和(百分比),供 game/battle.ts 換算成擊殺獎勵/戰鬥時長的乘數;只算目前已裝備的項目。
export function getEquipmentBonusTotals(loadout: EquipmentLoadout): EquipmentBonusTotals {
  const totals: EquipmentBonusTotals = { exp: 0, coins: 0, speed: 0 };
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    totals[item.bonus.stat] += item.bonus.value;
  }
  return totals;
}

// ---- 隨機素質 / 隱藏素質 ----
// 每件裝備第一次裝備時額外擲兩條這個池子裡的素質:一條「隨機素質」立即生效,一條「隱藏素質」
// 要花錢鑑定過才會生效,鑑定前數值未知。跟主加成(exp/coins/speed)是完全獨立的維度,
// critRate 影響戰鬥擊殺獎勵翻倍機率,resistance 留給強化系統用來降低失敗率。
export type SubstatType = 'critRate' | 'resistance';

export interface Substat {
  type: SubstatType;
  value: number;
}

export interface ItemInstanceData {
  randomSubstat: Substat;
  hiddenSubstat: Substat;
  identified: boolean;
}

const SUBSTAT_TYPES: SubstatType[] = ['critRate', 'resistance'];
const SUBSTAT_MAGNITUDE = 0.6; // 副素質整體比主加成弱一截,不會喧賓奪主
const SUBSTAT_VARIANCE_MIN = 0.7;
const SUBSTAT_VARIANCE_RANGE = 0.6; // 實際擲出 0.7~1.3 倍的隨機區間

function rollSubstat(bracket: number, rng: () => number): Substat {
  const type = SUBSTAT_TYPES[Math.floor(rng() * SUBSTAT_TYPES.length)];
  const base = bracketBonusValue(bracket) * SUBSTAT_MAGNITUDE;
  const variance = SUBSTAT_VARIANCE_MIN + rng() * SUBSTAT_VARIANCE_RANGE;
  const value = Math.round(base * variance * 1000) / 1000;
  return { type, value };
}

// 第一次裝備某款裝備時呼叫一次,擲出這件的隨機/隱藏素質並固定下來,之後不會再重擲。
export function rollItemInstance(item: EquipmentItem, rng: () => number = Math.random): ItemInstanceData {
  const bracket = item.requiredLevel !== undefined ? Math.max(1, Math.round(item.requiredLevel / LEVELS_PER_BRACKET)) : 1;
  return {
    randomSubstat: rollSubstat(bracket, rng),
    hiddenSubstat: rollSubstat(bracket, rng),
    identified: false,
  };
}

export type ItemInstances = Record<string, ItemInstanceData>;

export function createEmptyItemInstances(): ItemInstances {
  return {};
}

export interface SubstatTotals {
  critRate: number;
  resistance: number;
}

// 只算目前已裝備的項目;隱藏素質要鑑定過(identified)才計入。
export function getSubstatTotals(loadout: EquipmentLoadout, instances: ItemInstances): SubstatTotals {
  const totals: SubstatTotals = { critRate: 0, resistance: 0 };
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const instance = instances[itemId];
    if (!instance) continue;
    totals[instance.randomSubstat.type] += instance.randomSubstat.value;
    if (instance.identified) {
      totals[instance.hiddenSubstat.type] += instance.hiddenSubstat.value;
    }
  }
  return totals;
}

const IDENTIFY_COST_MULTIPLIER = 0.5;

// 鑑定花費跟這件裝備的原價掛勾,越貴的裝備鑑定費越高。
export function getIdentifyCost(item: EquipmentItem): number {
  return Math.max(1, Math.round(item.price * IDENTIFY_COST_MULTIPLIER));
}
