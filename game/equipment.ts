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
  // undefined = 不限等級檔(起始/性別預設款);有值 = 生成式目錄的等級檔編號(1-50),
  // 圖示產生器(equipmentIcons.ts/weapons.ts)拿這個數字疊加「等級檔標記」,讓3000款裝備
  // 都有可辨識的視覺差異,不用真的手繪3000張圖。
  bracket?: number;
}

// 每插槽固定一種加成類型(此插槽兩款只差數值),數值 = 百分比加成(0.02 = +2%):
// 免費款(-01)給小加成,付費款(-02)給大加成,呼應現有定價邏輯。
// back/bottom/face/mainhand = speed(縮短戰鬥時間);top/headwear/gloves = exp;belt/offhand = coins。
// 這 18 款不限職業、不限等級,主要作為起始裝備跟性別預設外觀(見 GENDER_DEFAULT_LOADOUT),
// 在下方生成式的職業鎖裝目錄開放之前(Lv10 起)先讓角色有基礎樣貌跟些微加成。
// 顏色刻意避開 HERO_PALETTE(K/H/S/T/D/B/P/O,見 heroSilhouette.ts)裡的每一個色碼——
// 舊版這裡直接複製了角色本體的顏色(例如亞麻上衣 #8b8698 精準對上角色上衣的 T 色),
// 疊上去等於跟身體本色完全相同,裝備看起來像沒穿一樣,是「吃色」最嚴重的一批。
const LEGACY_EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'back-01', slot: 'back', name: '素色披風', color: '#5a6a7a', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'back-02', slot: 'back', name: '厚重斗篷', color: '#4a3528', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'bottom-01', slot: 'bottom', name: '粗布長褲', color: '#8a7550', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'bottom-02', slot: 'bottom', name: '皮革護腿', color: '#6b4a30', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'top-01', slot: 'top', name: '亞麻上衣', color: '#d8c8a0', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'top-02', slot: 'top', name: '皮甲背心', color: '#7a4a2a', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'belt-01', slot: 'belt', name: '麻繩腰帶', color: '#c9a94f', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'belt-02', slot: 'belt', name: '鉚釘皮帶', color: '#9c8a3f', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'headwear-01', slot: 'headwear', name: '布帽', color: '#c8b088', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'headwear-02', slot: 'headwear', name: '鐵盔', color: '#6a7078', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'face-01', slot: 'face', name: '眼罩', color: '#1a1a1a', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'face-02', slot: 'face', name: '護目鏡', color: '#6ab0e0', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'gloves-01', slot: 'gloves', name: '布手套', color: '#c8b088', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'gloves-02', slot: 'gloves', name: '皮革手套', color: '#7a4a2a', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'offhand-01', slot: 'offhand', name: '木盾', color: '#8a6030', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'offhand-02', slot: 'offhand', name: '厚重書冊', color: '#b389e0', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'mainhand-01', slot: 'mainhand', name: '短劍', color: '#b8b8c0', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  {
    id: 'mainhand-02',
    slot: 'mainhand',
    name: '雙手大劍',
    color: '#b8b8c0',
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

// 同一階(title+baseNoun)裡的 10 個等級檔,原本只靠「·LvN」數字區分,加一個品質詞前綴
// 讓名稱本身也看得出差異,不用點進去看等級數字才知道差在哪。依 bracket 循環,不特別對齊
// 職業階級邊界(職業階級已經用 title 表現了,這裡純粹補等級檔顆粒度)。
const QUALITY_WORDS = ['簡易', '耐用', '精良', '強化', '特製', '稀有', '精銳', '大師', '傳說', '究極'];

function qualityWordForBracket(bracket: number): string {
  return QUALITY_WORDS[(bracket - 1) % QUALITY_WORDS.length];
}
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

// 每個裝備的顏色對應「現實中這件東西真正的顏色」,不是整個職業共用一種色相再調亮——
// 舊版做法會讓同職業所有部位都是同一色系(還可能剛好撞到 HERO_PALETTE 的身體色,例如
// physicalMelee 舊底色 #8b8698 直接等於角色上衣色,疊上去等於「吃色」看不見),
// 依現實物品配色之後,不同部位天生就會有足夠色相差異,不會互相吃色。
const SLOT_COLOR_BY_ARCHETYPE_TIER: Record<Archetype, SlotNounsByTier> = {
  physicalMelee: {
    1: {
      back: '#a89060',
      bottom: '#5a6b42',
      top: '#ff7518',
      belt: '#7a5030',
      headwear: '#f2c230',
      face: '#e8e2d0',
      gloves: '#d9c9a0',
      offhand: '#c0392b',
    },
    2: {
      back: '#3a3a3a',
      bottom: '#6b5a3a',
      top: '#d4e157',
      belt: '#e8b93a',
      headwear: '#2a3a5a',
      face: '#5a5a5a',
      gloves: '#2a2a2a',
      offhand: '#b0401a',
    },
    3: {
      back: '#ff5500',
      bottom: '#8a7040',
      top: '#f0e030',
      belt: '#2a2a2a',
      headwear: '#e8e8e0',
      face: '#1a1a1a',
      gloves: '#a87a4a',
      offhand: '#3a3a3a',
    },
    4: {
      back: '#e8c020',
      bottom: '#2a2a3a',
      top: '#c0281a',
      belt: '#1a1a1a',
      headwear: '#b02020',
      face: '#1a1a1a',
      gloves: '#3a3a2a',
      offhand: '#c0281a',
    },
    5: {
      back: '#5a5040',
      bottom: '#6b5a3a',
      top: '#2a2a28',
      belt: '#1a1a1a',
      headwear: '#4a4530',
      face: '#1a2a1a',
      gloves: '#1a1a1a',
      offhand: '#4a4a2a',
    },
  },
  physicalRanged: {
    1: {
      back: '#e91e63',
      bottom: '#2a2a2a',
      top: '#ff7518',
      belt: '#2a2a2a',
      headwear: '#1a1a1a',
      face: '#6ab0e0',
      gloves: '#2a2a2a',
      offhand: '#3a3a3a',
    },
    2: {
      back: '#f2c230',
      bottom: '#2a2a2a',
      top: '#f2c230',
      belt: '#7a5030',
      headwear: '#2a2a2a',
      face: '#1a1a1a',
      gloves: '#2a2a2a',
      offhand: '#4a4a4a',
    },
    3: {
      back: '#1a2a4a',
      bottom: '#1a2a4a',
      top: '#1a2a4a',
      belt: '#1a1a1a',
      headwear: '#1a2a4a',
      face: '#2a2a2a',
      gloves: '#1a1a1a',
      offhand: '#2a2a2a',
    },
    4: {
      back: '#4a5a30',
      bottom: '#4a5a30',
      top: '#4a5a30',
      belt: '#6b4a2a',
      headwear: '#4a5a30',
      face: '#3a4a28',
      gloves: '#6b4a2a',
      offhand: '#8a6a3a',
    },
    5: {
      back: '#4a4530',
      bottom: '#4a4a2a',
      top: '#4a4a2a',
      belt: '#1a1a1a',
      headwear: '#3a3a20',
      face: '#1a2a1a',
      gloves: '#1a1a1a',
      offhand: '#6a6a6a',
    },
  },
  physicalSupport: {
    1: {
      back: '#6a6a6a',
      bottom: '#2a2a2a',
      top: '#2e7d32',
      belt: '#2a2a2a',
      headwear: '#2e7d32',
      face: '#a8d0e8',
      gloves: '#e8e8e0',
      offhand: '#2a2a2a',
    },
    2: {
      back: '#2a2a2a',
      bottom: '#2a2a2a',
      top: '#6a1a2a',
      belt: '#2a2a2a',
      headwear: '#1a1a1a',
      face: '#e8e8e0',
      gloves: '#e8e2d0',
      offhand: '#a8a8a8',
    },
    3: {
      back: '#e8e2d0',
      bottom: '#a8c8e0',
      top: '#a8c8e0',
      belt: '#e8e2d0',
      headwear: '#f0f0e8',
      face: '#a8d0e8',
      gloves: '#a8d0e0',
      offhand: '#d8d8d0',
    },
    4: {
      back: '#2a2a2a',
      bottom: '#c0281a',
      top: '#c0281a',
      belt: '#2a2a2a',
      headwear: '#c0281a',
      face: '#1a1a1a',
      gloves: '#2a2a2a',
      offhand: '#3a3a3a',
    },
    5: {
      back: '#1a3a5a',
      bottom: '#2a6a5a',
      top: '#2a6a5a',
      belt: '#e8e2d0',
      headwear: '#2a6a5a',
      face: '#d0e8f0',
      gloves: '#c0dce8',
      offhand: '#f0a020',
    },
  },
  magicMelee: {
    1: {
      back: '#2a2a2a',
      bottom: '#1a2a4a',
      top: '#e8e8e0',
      belt: '#6a5a3a',
      headwear: '#1a1a1a',
      face: '#8a1a1a',
      gloves: '#e0d8c8',
      offhand: '#2a1a1a',
    },
    2: {
      back: '#a01818',
      bottom: '#8a1818',
      top: '#c02020',
      belt: '#e8c020',
      headwear: '#a01818',
      face: '#c02020',
      gloves: '#f0f0e8',
      offhand: '#c9a030',
    },
    3: {
      back: '#e0c030',
      bottom: '#1a2030',
      top: '#1a2a4a',
      belt: '#2a2a2a',
      headwear: '#1a1a1a',
      face: '#e0c030',
      gloves: '#e8e2d0',
      offhand: '#7a5a30',
    },
    4: {
      back: '#8a1a2a',
      bottom: '#1a1a1a',
      top: '#8a1a2a',
      belt: '#c9a030',
      headwear: '#1a1a1a',
      face: '#c9a030',
      gloves: '#e8e2d0',
      offhand: '#8a6a3a',
    },
    5: {
      back: '#f0e8d0',
      bottom: '#f0ece0',
      top: '#f0ece0',
      belt: '#7ab088',
      headwear: '#d4af37',
      face: '#e8e0d0',
      gloves: '#e0e8d8',
      offhand: '#e8e2d0',
    },
  },
  magicRanged: {
    1: {
      back: '#39ff14',
      bottom: '#2a2a2a',
      top: '#2a2a2a',
      belt: '#2a2a2a',
      headwear: '#00e5ff',
      face: '#e8d840',
      gloves: '#2a2a2a',
      offhand: '#d8d8d0',
    },
    2: {
      back: '#4a4a4a',
      bottom: '#a0885a',
      top: '#4a6a9a',
      belt: '#3a5a8a',
      headwear: '#2a2a2a',
      face: '#6a6a6a',
      gloves: '#7a7a7a',
      offhand: '#a8a8a8',
    },
    3: {
      back: '#6a6a6a',
      bottom: '#4a4a4a',
      top: '#f0f0e8',
      belt: '#6a6a6a',
      headwear: '#2a2a2a',
      face: '#6ab0e0',
      gloves: '#6a5a9a',
      offhand: '#6ab0e0',
    },
    4: {
      back: '#1a1a1a',
      bottom: '#1a1a1a',
      top: '#1a1a1a',
      belt: '#1a1a1a',
      headwear: '#1a1a1a',
      face: '#e8e8e0',
      gloves: '#1a1a1a',
      offhand: '#1a2a1a',
    },
    5: {
      back: '#d0d8e0',
      bottom: '#a0a8b0',
      top: '#40e0d0',
      belt: '#40e0d0',
      headwear: '#a0e8e0',
      face: '#80d8d0',
      gloves: '#c0e8e0',
      offhand: '#40a0e0',
    },
  },
  magicSupport: {
    1: {
      back: '#d0e0e8',
      bottom: '#e8e8e0',
      top: '#f0f0e8',
      belt: '#c0d8c0',
      headwear: '#f0f0e8',
      face: '#a8d0e8',
      gloves: '#a8d0e0',
      offhand: '#d8c8a8',
    },
    2: {
      back: '#2a3a5a',
      bottom: '#2a2a2a',
      top: '#f0f0e8',
      belt: '#4a4a4a',
      headwear: '#a8c8e0',
      face: '#a8d0e8',
      gloves: '#e0c8a8',
      offhand: '#d8d8d0',
    },
    3: {
      back: '#c0a880',
      bottom: '#4a4a4a',
      top: '#a8b090',
      belt: '#7a5a3a',
      headwear: '#b0a0c8',
      face: '#6a4a2a',
      gloves: '#8a8a80',
      offhand: '#d0b888',
    },
    4: {
      back: '#6a4a2a',
      bottom: '#2a3a5a',
      top: '#2a3a5a',
      belt: '#7a5a3a',
      headwear: '#1a1a1a',
      face: '#c9a030',
      gloves: '#e8e2d0',
      offhand: '#5a4a3a',
    },
    5: {
      back: '#8a6a30',
      bottom: '#2a6a5a',
      top: '#2a6a5a',
      belt: '#d4af37',
      headwear: '#d4af37',
      face: '#e8e0c0',
      gloves: '#e8dcc0',
      offhand: '#e04030',
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

// 武器同一階(單手+雙手)共用一個對應現實材質的顏色,例如鐵鎚/電鋸是鋼鐵灰、七星劍是青銅金,
// 不是整個職業共用一種色相。
const WEAPON_COLOR_BY_TIER: Record<Archetype, Record<JobTier, string>> = {
  physicalMelee: { 1: '#7a7a7a', 2: '#e8a020', 3: '#f2c230', 4: '#c0281a', 5: '#2a2a2a' },
  physicalRanged: { 1: '#9a9a9a', 2: '#c0281a', 3: '#2a2a2a', 4: '#6a5030', 5: '#1a1a1a' },
  physicalSupport: { 1: '#a8a8a8', 2: '#b8b8b8', 3: '#d8d8d0', 4: '#2a2a2a', 5: '#e04030' },
  magicMelee: { 1: '#8a6a3a', 2: '#c9a030', 3: '#a88050', 4: '#d4af37', 5: '#d4af37' },
  magicRanged: { 1: '#00e5ff', 2: '#3a3a3a', 3: '#a8a8a8', 4: '#1a2a1a', 5: '#40e0d0' },
  magicSupport: { 1: '#a86a20', 2: '#c0281a', 3: '#a0c0d8', 4: '#c0c0c0', 5: '#d4af37' },
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
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const { tier, title } = jobTierAndTitleAtLevel(archetype, requiredLevel);
      const baseNoun = SLOT_BASE_NOUN_BY_ARCHETYPE_TIER[archetype][tier][slot];
      if (!baseNoun) continue;
      const tierColor = SLOT_COLOR_BY_ARCHETYPE_TIER[archetype][tier][slot] ?? ARCHETYPE_BASE_COLOR[archetype];
      items.push({
        id: `${slot}-${archetype}-${bracket}`,
        slot,
        name: `${title}${qualityWordForBracket(bracket)}${baseNoun}·Lv${requiredLevel}`,
        color: shiftColorForBracket(tierColor, bracket),
        price: bracketPrice(bracket),
        bonus: { stat, value: bracketBonusValue(bracket) },
        archetype,
        requiredLevel,
        bracket,
      });
    }
  }
  return items;
}

function generateMainhandItems(): EquipmentItem[] {
  const stat = SLOT_STAT.mainhand;
  const items: EquipmentItem[] = [];
  for (const archetype of ARCHETYPES) {
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const { tier, title } = jobTierAndTitleAtLevel(archetype, requiredLevel);
      const nouns = WEAPON_NOUNS_BY_TIER[archetype][tier];
      const color = shiftColorForBracket(WEAPON_COLOR_BY_TIER[archetype][tier], bracket);
      const oneHandedBonus = bracketBonusValue(bracket);
      const price = bracketPrice(bracket);

      items.push({
        id: `mainhand-1h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${qualityWordForBracket(bracket)}${nouns.oneHanded}·Lv${requiredLevel}`,
        color,
        price,
        bonus: { stat, value: oneHandedBonus },
        archetype,
        requiredLevel,
        bracket,
      });

      items.push({
        id: `mainhand-2h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${qualityWordForBracket(bracket)}${nouns.twoHanded}·Lv${requiredLevel}(雙手)`,
        color,
        price: Math.round(price * TWO_HANDED_PRICE_MULTIPLIER),
        bonus: { stat, value: Math.round(oneHandedBonus * TWO_HANDED_BONUS_MULTIPLIER * 1000) / 1000 },
        archetype,
        requiredLevel,
        bracket,
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

// 座標系對應 game/sprites/heroSilhouette.ts 的原生 64 欄 x 56 列網格(密度提升後的版本,
// 原本是 20x24,座標依 x*3.2/y*2.33 等比例換算),僅以「normal」體型的輪廓比例校準;
// thin/fat 選擇時疊圖會有些微不貼合,屬於這個架構驗證階段可接受的簡化,尚未做到依體型即時縮放錨點。
//
// 座標是直接量測 buildHeroFrames('normal').open 每一列實際填色範圍校準的(不是舊錨點等比例
// 縮放算出來的——早一版直接用線性倍率換算,沒考慮到新輪廓多了手臂,肩寬佔比本來就比舊版
// 大,疊圖套上去比例會比身體本身還誇張、看起來「穿太大件」,所以改成量真實輪廓校準)。
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SLOT_ANCHORS: Record<EquipmentSlot, Rect[]> = {
  // 背飾:比肩寬(22-41)略寬,露出一點在身體兩側,做出斗篷飄出來的感覺。
  back: [{ x: 19, y: 23, w: 26, h: 16 }],
  // 下身:雙腿外框(26-37),扣掉腰帶/上衣範圍往下。
  bottom: [{ x: 26, y: 39, w: 12, h: 13 }],
  // 上身:軀幹布料核心寬度(22-41),往兩側各多蓋一點到袖口區(D遮蔽),不會露出沒穿到的縫隙。
  top: [{ x: 20, y: 25, w: 24, h: 12 }],
  // 腰帶:腰帶列本身寬度(26-37)。
  belt: [{ x: 26, y: 37, w: 12, h: 2 }],
  // 頭飾:蓋住頭髮最寬的上半段(row4-11,peak width 22),留下方2列頭髮當瀏海。
  headwear: [{ x: 21, y: 4, w: 22, h: 8 }],
  // 面飾:眼睛所在列(row16-17)附近的窄框。
  face: [{ x: 26, y: 15, w: 12, h: 4 }],
  gloves: [
    { x: 13, y: 28, w: 4, h: 4 },
    { x: 47, y: 28, w: 4, h: 4 },
  ],
  offhand: [{ x: 8, y: 24, w: 14, h: 14 }],
  // 跟武器外型(game/sprites/weapons.ts,放大3倍後 18x30)完全對齊,不拉伸變形。
  mainhand: [{ x: 45, y: 19, w: 18, h: 30 }],
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
  enhanceLevel: number;
  socketedGems: (GemType | null)[];
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
    enhanceLevel: 0,
    socketedGems: new Array(getSocketCount(item)).fill(null),
  };
}

export type ItemInstances = Record<string, ItemInstanceData>;

// v12 存檔的 itemInstances 沒有 enhanceLevel/socketedGems(強化/鑲嵌系統還沒出生),
// 遷移到 v13 時用這個補齊:強化 0 級、插槽依裝備當下的規則清空。
export function upgradeItemInstancesToV13(
  instances: Record<string, { randomSubstat: Substat; hiddenSubstat: Substat; identified: boolean }>
): ItemInstances {
  const upgraded: ItemInstances = {};
  for (const [id, data] of Object.entries(instances)) {
    const item = getItemById(id);
    upgraded[id] = {
      ...data,
      enhanceLevel: 0,
      socketedGems: new Array(item ? getSocketCount(item) : 1).fill(null),
    };
  }
  return upgraded;
}

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

// ---- 強化系統 ----
// 花金幣 + 強化石把裝備從 +0 強化到 +10,每級疊加主加成的固定比例。Lv1~5 是安全區,失敗只
// 浪費資源;Lv6~10 失敗有機會降級或直接損毀裝備,抗性素質(見上方隨機/隱藏素質)降低失敗率。
export const ENHANCE_MAX_LEVEL = 10;
export const ENHANCE_STONE_PRICE = 50; // 商店直接用金幣買強化石的價格(掉落是另一條免費取得的路)
const ENHANCE_BONUS_PER_LEVEL = 0.08;
const ENHANCE_SAFE_LEVEL = 5;
const ENHANCE_BASE_FAIL_CHANCE = 0.05;
const ENHANCE_FAIL_CHANCE_PER_LEVEL = 0.05;
const ENHANCE_MAX_FAIL_CHANCE = 0.6;
const ENHANCE_MIN_FAIL_CHANCE = 0.01;
const ENHANCE_DESTROY_SHARE = 0.5; // 危險區失敗時,一半機率降級、一半機率損毀

// 強化後的實際加成值(疊加在裝備原本的主加成上),UI/戰鬥計算都要用這個而不是 item.bonus.value。
export function getEnhancedBonusValue(item: EquipmentItem, instance: ItemInstanceData | undefined): number {
  const level = instance?.enhanceLevel ?? 0;
  return Math.round(item.bonus.value * (1 + level * ENHANCE_BONUS_PER_LEVEL) * 1000) / 1000;
}

export function getEnhanceCoinCost(item: EquipmentItem, currentLevel: number): number {
  return Math.round(item.price * (0.3 + currentLevel * 0.15));
}

export function getEnhanceStoneCost(currentLevel: number): number {
  return currentLevel + 1;
}

function itemInstanceResistance(instance: ItemInstanceData): number {
  let total = 0;
  if (instance.randomSubstat.type === 'resistance') total += instance.randomSubstat.value;
  if (instance.identified && instance.hiddenSubstat.type === 'resistance') total += instance.hiddenSubstat.value;
  return total;
}

// 目標等級(currentLevel+1)決定基礎失敗率,裝備自己的抗性素質(不是全身加總)拉低失敗率。
export function getEnhanceFailChance(instance: ItemInstanceData, currentLevel: number): number {
  const base = Math.min(ENHANCE_MAX_FAIL_CHANCE, ENHANCE_BASE_FAIL_CHANCE + currentLevel * ENHANCE_FAIL_CHANCE_PER_LEVEL);
  const reduced = base - itemInstanceResistance(instance);
  return Math.max(ENHANCE_MIN_FAIL_CHANCE, reduced);
}

export type EnhanceOutcome = 'success' | 'fail_safe' | 'fail_downgrade' | 'fail_destroy';

// 純函式,方便測試:傳固定 rng 就能重現結果。丟出這次強化(currentLevel -> currentLevel+1)的結果,
// 呼叫端負責照結果更新/刪除 instance。
export function rollEnhanceOutcome(
  instance: ItemInstanceData,
  currentLevel: number,
  rng: () => number = Math.random
): EnhanceOutcome {
  const failChance = getEnhanceFailChance(instance, currentLevel);
  if (rng() >= failChance) return 'success';
  const targetLevel = currentLevel + 1;
  if (targetLevel <= ENHANCE_SAFE_LEVEL) return 'fail_safe';
  return rng() < ENHANCE_DESTROY_SHARE ? 'fail_destroy' : 'fail_downgrade';
}

// ---- 鑲嵌系統 ----
// 寶石鑲入裝備插槽,直接加成 exp/coins/speed(跟裝備主加成同一個維度),插槽數依裝備階級(1~5階
// 對應 1~3 格)。寶石雙軌取得:戰鬥獨立掉落 + 商店用金幣買,拔除寶石不會損毀、原樣退回背包。
export type GemType = 'expGem' | 'coinGem' | 'speedGem';

interface GemSpec {
  stat: EquipmentBonusStat;
  value: number;
  price: number;
  name: string;
}

export const GEM_SPECS: Record<GemType, GemSpec> = {
  expGem: { stat: 'exp', value: 0.03, price: 80, name: '經驗石' },
  coinGem: { stat: 'coins', value: 0.03, price: 80, name: '金幣石' },
  speedGem: { stat: 'speed', value: 0.03, price: 80, name: '速度石' },
};

export const GEM_TYPES: GemType[] = ['expGem', 'coinGem', 'speedGem'];

// 強化石/寶石掉落:跟寵物/坐騎掉落一樣,每次擊殺獨立判定一次,互不干擾、多數時候不會掉落。
const ENHANCE_STONE_DROP_CHANCE = 0.04;
const GEM_DROP_CHANCE = 0.04;

export function rollEnhanceStoneDrop(rng: () => number = Math.random): boolean {
  return rng() < ENHANCE_STONE_DROP_CHANCE;
}

export function rollGemDrop(rng: () => number = Math.random): GemType | null {
  if (rng() >= GEM_DROP_CHANCE) return null;
  return GEM_TYPES[Math.floor(rng() * GEM_TYPES.length)];
}

// 裝備掉落:跟上面幾種掉落同一套獨立判定模式,中了直接免費解鎖一件目前職業/等級穿得下的
// 付費款(不含 price=0 的起始款,那些本來就已解鎖),優先掉還沒解鎖過的款式讓抽到的東西
// 對玩家有意義;真的全部解鎖完了(邊緣情況)才會允許重複掉落,純粹避免回傳 null。
const EQUIPMENT_DROP_CHANCE = 0.05;

export function rollEquipmentDrop(
  archetype: Archetype,
  level: number,
  unlockedItemIds: UnlockedItemIds,
  rng: () => number = Math.random
): EquipmentItem | null {
  if (rng() >= EQUIPMENT_DROP_CHANCE) return null;
  const eligible = EQUIPMENT_ITEMS.filter((item) => item.price > 0 && canEquipItem(item, archetype, level));
  if (eligible.length === 0) return null;
  const notYetUnlocked = eligible.filter((item) => !isItemUnlocked(unlockedItemIds, item.id));
  const pool = notYetUnlocked.length > 0 ? notYetUnlocked : eligible;
  return pool[Math.floor(rng() * pool.length)];
}

export function getSocketCount(item: EquipmentItem): number {
  const tier = getCurrentTier(item.requiredLevel ?? 1);
  return Math.ceil(tier / 2);
}

export type GemCounts = Record<GemType, number>;

export function createEmptyGemCounts(): GemCounts {
  return { expGem: 0, coinGem: 0, speedGem: 0 };
}

// 只算目前已裝備項目上鑲嵌的寶石,跟裝備主加成/強化是同一個 exp/coins/speed 維度,直接相加。
export function getGemBonusTotals(loadout: EquipmentLoadout, instances: ItemInstances): EquipmentBonusTotals {
  const totals: EquipmentBonusTotals = { exp: 0, coins: 0, speed: 0 };
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const instance = instances[itemId];
    if (!instance) continue;
    for (const gemType of instance.socketedGems) {
      if (!gemType) continue;
      const spec = GEM_SPECS[gemType];
      totals[spec.stat] += spec.value;
    }
  }
  return totals;
}

// 裝備主加成(含強化)+鑲嵌寶石的完整加總,取代單純只看 item.bonus.value 的 getEquipmentBonusTotals。
export function getEquipmentBonusTotalsFull(loadout: EquipmentLoadout, instances: ItemInstances): EquipmentBonusTotals {
  const totals: EquipmentBonusTotals = { exp: 0, coins: 0, speed: 0 };
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    totals[item.bonus.stat] += getEnhancedBonusValue(item, instances[itemId]);
  }
  const gemTotals = getGemBonusTotals(loadout, instances);
  totals.exp += gemTotals.exp;
  totals.coins += gemTotals.coins;
  totals.speed += gemTotals.speed;
  return totals;
}
