import { Archetype, JobTier } from './combat';
import {
  SKILL_SLOT_DESCRIPTIONS,
  SKILL_SLOT_NAMES,
  SkillSlotId,
} from './skillTree';

export interface TierSkillFlavor {
  name: string;
  description: string;
}

// tier1 沿用 game/skillTree.ts 既有的 SKILL_SLOT_NAMES/SKILL_SLOT_DESCRIPTIONS,這裡只需要 2~5 階。
// passive3(吸血+自動回血)刻意排除在外——這格名稱/敘述全職業全階級都是同一份鎖定文案
// (見 SKILL_SLOT_NAMES/SKILL_SLOT_DESCRIPTIONS 的 passive3),不像 passive1/passive2 每階
// 都要換一套「職業分支」敘述,所以不需要也不應該在這裡幫它多寫 2~5 階的版本。
type TierBranchSlotId = Exclude<SkillSlotId, 'passive3'>;
type TierBranchContent = Record<Exclude<JobTier, 1>, Record<TierBranchSlotId, TierSkillFlavor>>;

// 每一階(2/3/4/5)6 個技能格描述,結尾都會統一附上該階新解鎖的疊加效果說明——
// 數值對應 game/skillTree.ts 的 TIER2_BONUS_COIN_MULT(10%)/TIER3_BONUS_EXP_MULT(10%)/
// TIER4_BONUS_FLAT_COINS(3 枚)/TIER5_EXTRA_INSTANT_CHANCE(8%),不可更改數字。
const TIER_STACK_NOTE: Record<Exclude<JobTier, 1>, string> = {
  2: '(這階起,主動技能觸發時額外多賺 10% 金幣)',
  3: '(這階起,主動技能觸發時額外多賺 10% 經驗值,跟2階的金幣加成疊加)',
  4: '(這階起,主動技能觸發時額外多進帳 3 枚金幣,前面幾階的加成全部疊加)',
  5: '(這階起,主動技能觸發時有 8% 機率額外讓下一場戰鬥直接結束,前面所有疊加效果全部保留)',
};

function withStack(tier: Exclude<JobTier, 1>, description: string): string {
  return `${description}${TIER_STACK_NOTE[tier]}`;
}

const TIER_SKILL_FLAVOR: Record<Archetype, TierBranchContent> = {
  // physicalMelee branch A:1工讀生 2搬運工 3工地師傅 4消防員 5特種部隊
  // 機制對照(核對自 skillTree.ts 既有 tier1 敘述):active1=instantFinish、active2=doubleReward、active3=bonusCoins、active4=expBoost
  physicalMelee: {
    2: {
      passive1: { name: '扛出來的肌肉記憶', description: withStack(2, '搬久了東西,身體自然記住怎麼閃、怎麼發力,經驗值吸收得更快。') },
      passive2: { name: '搬運行情摸更透', description: withStack(2, '搬家公司跑多了,行情摸得比誰都熟,順手多賺一點。') },
      active1: { name: '一肩扛起全場', description: withStack(2, '扛著整組家具直接砸過去,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '搬運工的連續搬運', description: withStack(2, '一趟接一趟不停手,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '順手多接一趟', description: withStack(2, '收工前順路再接一趟搬運,額外進帳一筆金幣。') },
      active4: { name: '扎實搬完整棟樓', description: withStack(2, '扎實把整棟樓搬完才收工,額外進帳一筆經驗值。') },
    },
    3: {
      passive1: { name: '工地老手的敏銳度', description: withStack(3, '在工地待久了,一眼就看穿怪物的破綻,經驗值吸收得更快。') },
      passive2: { name: '工班行情算到骨子裡', description: withStack(3, '跟工班打交道練出的精算功力,順手多賺一點工錢。') },
      active1: { name: '怪手一鏟到底', description: withStack(3, '操作怪手一鏟清空戰場,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '師傅連環指揮', description: withStack(3, '指揮工班一波接一波動工,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '工地順手驗收', description: withStack(3, '驗收工程順便清點材料,額外進帳一筆金幣。') },
      active4: { name: '扎實蓋好一層樓', description: withStack(3, '扎實把一層樓蓋好才收工,額外進帳一筆經驗值。') },
    },
    4: {
      passive1: { name: '火場練出的判斷力', description: withStack(4, '在火場千鈞一髮練出的反應,經驗值吸收得更快。') },
      passive2: { name: '救援津貼精算術', description: withStack(4, '出勤津貼算得清清楚楚,順手多賺一點加給。') },
      active1: { name: '破門一擊', description: withStack(4, '斧頭破門直搗黃龍,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '水柱連發', description: withStack(4, '水柱一波接一波狂噴,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '救援順手清點裝備', description: withStack(4, '救援結束順手清點裝備損耗,額外進帳一筆金幣。') },
      active4: { name: '扎實完成一次出勤', description: withStack(4, '扎實完成整趟救援出勤,額外進帳一筆經驗值。') },
    },
    5: {
      passive1: { name: '百戰練出的直覺', description: withStack(5, '身經百戰淬煉出的戰場直覺,經驗值吸收得更快。') },
      passive2: { name: '任務獎金精算術', description: withStack(5, '任務獎金算得比誰都精,順手多賺一筆津貼。') },
      active1: { name: '斬首行動', description: withStack(5, '一次斬首行動直取要害,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '特種連續突襲', description: withStack(5, '小隊連續突襲不留喘息,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '任務順手清場', description: withStack(5, '任務結束順手清點戰利品,額外進帳一筆金幣。') },
      active4: { name: '扎實完成一次任務', description: withStack(5, '扎實完成一次任務歸隊,額外進帳一筆經驗值。') },
    },
  },
  // physicalRanged branch A:1外送員 2計程車司機 3警察 4職業獵人 5狙擊手
  // 機制對照:active1=doubleReward、active2=bonusCoins、active3=expBoost、active4=instantFinish
  physicalRanged: {
    2: {
      passive1: { name: '跑車跑出的路感', description: withStack(2, '天天在路上跑,對地形與怪物的反應更快,經驗值吸收得更快。') },
      passive2: { name: '跳錶行情摸透了', description: withStack(2, '跳錶算得滾瓜爛熟,順手多賺一點車資。') },
      active1: { name: '熟客連環載', description: withStack(2, '熟客一個接一個上車,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順路多繞一趟', description: withStack(2, '順路多繞一趟載客,額外進帳一筆金幣。') },
      active3: { name: '熟門熟路抄捷徑', description: withStack(2, '抄近路練出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一腳踩到底', description: withStack(2, '油門一腳踩到底衝過終點,直接讓下一場戰鬥瞬間結束。') },
    },
    3: {
      passive1: { name: '巡邏練出的敏銳', description: withStack(3, '天天巡邏練出的敏銳直覺,經驗值吸收得更快。') },
      passive2: { name: '績效獎金算盤', description: withStack(3, '績效獎金算得精明,順手多賺一點獎金。') },
      active1: { name: '警網連環出動', description: withStack(3, '警網一波接一波出動,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手臨檢', description: withStack(3, '下班前順手臨檢一輪,額外進帳一筆金幣。') },
      active3: { name: '辦案熟門熟路', description: withStack(3, '辦案經驗越來越老道,額外進帳一筆經驗值。') },
      active4: { name: '一槍制伏', description: withStack(3, '精準一槍當場制伏,直接讓下一場戰鬥瞬間結束。') },
    },
    4: {
      passive1: { name: '叢林練出的野性直覺', description: withStack(4, '長年在山林打滾練出的野性直覺,經驗值吸收得更快。') },
      passive2: { name: '獵物行情摸透了', description: withStack(4, '獵物行情摸得一清二楚,順手多賺一點收購金。') },
      active1: { name: '陷阱連環設下', description: withStack(4, '陷阱一個接一個佈下,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手撿戰利品', description: withStack(4, '狩獵完順手撿些戰利品,額外進帳一筆金幣。') },
      active3: { name: '追蹤熟門熟路', description: withStack(4, '追蹤獸跡的功夫越來越老練,額外進帳一筆經驗值。') },
      active4: { name: '一箭穿心', description: withStack(4, '一箭精準穿心,直接讓下一場戰鬥瞬間結束。') },
    },
    5: {
      passive1: { name: '千米外練出的專注', description: withStack(5, '千米之外盯出來的極致專注,經驗值吸收得更快。') },
      passive2: { name: '任務津貼精算術', description: withStack(5, '任務津貼算得比誰都精,順手多賺一點獎金。') },
      active1: { name: '連續精準點殺', description: withStack(5, '一發接一發精準點殺,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手清點彈藥', description: withStack(5, '任務結束順手清點裝備,額外進帳一筆金幣。') },
      active3: { name: '潛伏練出的心得', description: withStack(5, '長時間潛伏練出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一發入魂', description: withStack(5, '屏息扣下扳機一發入魂,直接讓下一場戰鬥瞬間結束。') },
    },
  },
  // physicalSupport branch A:1超商店員 2餐廳服務生 3護理師 4健身教練 5急診室王牌護理長
  // 機制對照:active1=bonusCoins、active2=expBoost、active3=instantFinish、active4=doubleReward
  physicalSupport: {
    2: {
      passive1: { name: '外場練出的眼力', description: withStack(2, '外場跑久了,一眼看穿客人跟怪物的需求,經驗值吸收得更快。') },
      passive2: { name: '小費行情摸透了', description: withStack(2, '小費行情摸得一清二楚,順手多賺一點小費。') },
      active1: { name: '順手加點', description: withStack(2, '上菜順手推薦加點,額外進帳一筆金幣。') },
      active2: { name: '貼心報菜名', description: withStack(2, '報菜名報得又快又順,額外進帳一筆經驗值。') },
      active3: { name: '手腳俐落出餐', description: withStack(2, '手腳俐落一口氣出完餐,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '翻桌率全開', description: withStack(2, '翻桌翻得又快又順,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    3: {
      passive1: { name: '臨床練出的觀察力', description: withStack(3, '臨床照護練出的敏銳觀察力,經驗值吸收得更快。') },
      passive2: { name: '班表津貼算盤', description: withStack(3, '輪班津貼算得精明,順手多賺一點加班費。') },
      active1: { name: '順手量個生命徵象', description: withStack(3, '巡房順手量個生命徵象,額外進帳一筆金幣。') },
      active2: { name: '衛教說得仔細', description: withStack(3, '衛教叮嚀說得又細又清楚,額外進帳一筆經驗值。') },
      active3: { name: '手腳俐落急救', description: withStack(3, '急救處置手腳俐落到位,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍照護到位', description: withStack(3, '照護加倍用心到位,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    4: {
      passive1: { name: '帶課練出的判讀力', description: withStack(4, '帶課帶久了,一眼看穿姿勢跟破綻,經驗值吸收得更快。') },
      passive2: { name: '課程業績算盤', description: withStack(4, '課程業績算得精明,順手多賺一點業績獎金。') },
      active1: { name: '順手加開一堂課', description: withStack(4, '順手加開一堂體驗課,額外進帳一筆金幣。') },
      active2: { name: '菜單調整到位', description: withStack(4, '訓練菜單調整得又細又到位,額外進帳一筆經驗值。') },
      active3: { name: '一組全力衝刺', description: withStack(4, '喊口號帶一組全力衝刺收操,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍燃脂菜單', description: withStack(4, '雙倍強度菜單全開,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    5: {
      passive1: { name: '急診練出的判斷力', description: withStack(5, '急診室千錘百鍊出的判斷力,經驗值吸收得更快。') },
      passive2: { name: '資深加給算盤', description: withStack(5, '資深加給算得一清二楚,順手多賺一筆津貼。') },
      active1: { name: '順手清點急救車', description: withStack(5, '交班前順手清點急救車存貨,額外進帳一筆金幣。') },
      active2: { name: '帶教學弟妹', description: withStack(5, '順手帶教學弟妹的心得,額外進帳一筆經驗值。') },
      active3: { name: '一聲令下全員就位', description: withStack(5, '一聲令下全員迅速就位處置,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍搶救效率', description: withStack(5, '帶隊搶救效率整組翻倍,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
  },
  // magicMelee branch A:1中二國中生 2阿志 3道士/法師 4命理師 5得道仙人
  // 機制對照:active1=instantFinish、active2=doubleReward、active3=bonusCoins、active4=expBoost
  magicMelee: {
    2: {
      passive1: { name: '混出來的江湖直覺', description: withStack(2, '在外面混出來的江湖直覺,經驗值吸收得更快。') },
      passive2: { name: '跑腿行情摸透了', description: withStack(2, '幫忙跑腿辦事練出的行情眼光,順手多賺一點。') },
      active1: { name: '一拳定江湖', description: withStack(2, '往前一拳直接定江湖,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '兄弟連環助陣', description: withStack(2, '兄弟一個接一個上前助陣,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '順手喬事情', description: withStack(2, '順手幫忙喬點事情,額外進帳一筆金幣。') },
      active4: { name: '扎實混一天', description: withStack(2, '扎實在外面混了一整天,額外進帳一筆經驗值。') },
    },
    3: {
      passive1: { name: '唸咒練出的悟性', description: withStack(3, '日夜唸咒練出的悟性,經驗值吸收得更快。') },
      passive2: { name: '紅包行情摸透了', description: withStack(3, '辦法事的紅包行情摸得一清二楚,順手多收一點。') },
      active1: { name: '一道符鎮壓', description: withStack(3, '一道符咒直接鎮壓對手,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '連環作法', description: withStack(3, '法器一件接一件連環作法,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '順手看個風水', description: withStack(3, '作法之餘順手看個風水,額外進帳一筆金幣。') },
      active4: { name: '扎實做完一場法事', description: withStack(3, '扎實做完一整場法事,額外進帳一筆經驗值。') },
    },
    4: {
      passive1: { name: '算命練出的洞察力', description: withStack(4, '看命盤看久了練出的洞察力,經驗值吸收得更快。') },
      passive2: { name: '問事行情摸透了', description: withStack(4, '問事收費行情摸得一清二楚,順手多賺一點。') },
      active1: { name: '一卦定生死', description: withStack(4, '一卦下去直接定生死,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '連環開示', description: withStack(4, '一句接一句連環開示點破,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '順手改個名', description: withStack(4, '批完命盤順手幫忙改個名,額外進帳一筆金幣。') },
      active4: { name: '扎實批完一輪命盤', description: withStack(4, '扎實批完一整輪命盤,額外進帳一筆經驗值。') },
    },
    5: {
      passive1: { name: '得道練出的洞悉力', description: withStack(5, '得道多年練出的洞悉萬物之力,經驗值吸收得更快。') },
      passive2: { name: '香火緣分算透了', description: withStack(5, '香火緣分算得一清二楚,順手多收一點供養。') },
      active1: { name: '一指渡化', description: withStack(5, '仙指一點直接渡化敵人,直接讓下一場戰鬥瞬間結束。') },
      active2: { name: '連環顯化神通', description: withStack(5, '神通一招接一招連環顯化,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active3: { name: '順手賜個福', description: withStack(5, '渡化之餘順手賜個福,額外進帳一筆金幣。') },
      active4: { name: '扎實悟出一層道理', description: withStack(5, '扎實悟出新的一層道理,額外進帳一筆經驗值。') },
    },
  },
  // magicRanged branch A:1電競選手/實況主 2軟體工程師 3研究員/科學家 4駭客 5AI天才工程師
  // 機制對照:active1=doubleReward、active2=bonusCoins、active3=expBoost、active4=instantFinish
  magicRanged: {
    2: {
      passive1: { name: '寫 code 練出的邏輯力', description: withStack(2, '每天寫 code 練出的邏輯思維,經驗值吸收得更快。') },
      passive2: { name: '接案行情摸透了', description: withStack(2, '接案行情摸得一清二楚,順手多賺一點外快。') },
      active1: { name: '連環部署上線', description: withStack(2, '功能一個接一個部署上線,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手接個小案子', description: withStack(2, '下班前順手接個小案子,額外進帳一筆金幣。') },
      active3: { name: '熬夜除錯的心得', description: withStack(2, '熬夜除錯練出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一鍵重構搞定', description: withStack(2, '一鍵重構直接搞定,直接讓下一場戰鬥瞬間結束。') },
    },
    3: {
      passive1: { name: '泡實驗室練出的直覺', description: withStack(3, '泡在實驗室練出的實驗直覺,經驗值吸收得更快。') },
      passive2: { name: '研究經費算盤', description: withStack(3, '研究經費算得精打細算,順手多爭取一點補助。') },
      active1: { name: '連環發表論文', description: withStack(3, '論文一篇接一篇連環發表,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手申請個專利', description: withStack(3, '實驗之餘順手申請個專利,額外進帳一筆金幣。') },
      active3: { name: '反覆實驗練出的心得', description: withStack(3, '反覆實驗累積出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一次實驗成功', description: withStack(3, '關鍵一次實驗直接成功,直接讓下一場戰鬥瞬間結束。') },
    },
    4: {
      passive1: { name: '潛伏練出的敏銳度', description: withStack(4, '長期潛伏系統練出的敏銳度,經驗值吸收得更快。') },
      passive2: { name: '賞金行情摸透了', description: withStack(4, '抓漏賞金行情摸得一清二楚,順手多賺一點賞金。') },
      active1: { name: '連環入侵防線', description: withStack(4, '防線一道接一道連環突破,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手抓個漏洞', description: withStack(4, '入侵之餘順手抓個漏洞回報,額外進帳一筆金幣。') },
      active3: { name: '破解練出的心得', description: withStack(4, '破解系統累積出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一次全面接管', description: withStack(4, '一次入侵直接全面接管,直接讓下一場戰鬥瞬間結束。') },
    },
    5: {
      passive1: { name: '訓練模型練出的直覺', description: withStack(5, '訓練模型調參練出的直覺,經驗值吸收得更快。') },
      passive2: { name: '授權金行情摸透了', description: withStack(5, '技術授權行情摸得一清二楚,順手多賺一筆授權金。') },
      active1: { name: '連環推論加速', description: withStack(5, '推論一輪接一輪連環加速,這次擊殺的經驗與金幣獎勵直接翻倍。') },
      active2: { name: '順手接個顧問案', description: withStack(5, '研發之餘順手接個顧問案,額外進帳一筆金幣。') },
      active3: { name: '煉模型練出的心得', description: withStack(5, '反覆煉模型累積出的心得,額外進帳一筆經驗值。') },
      active4: { name: '一次推理秒殺', description: withStack(5, '模型一次推理直接秒殺對手,直接讓下一場戰鬥瞬間結束。') },
    },
  },
  // magicSupport branch A:1藥師 2醫生 3心理諮商師 4老中醫 5神醫/華佗再世
  // 機制對照:active1=bonusCoins、active2=expBoost、active3=instantFinish、active4=doubleReward
  magicSupport: {
    2: {
      passive1: { name: '問診練出的判斷力', description: withStack(2, '問診看久了練出的敏銳判斷力,經驗值吸收得更快。') },
      passive2: { name: '診療行情摸透了', description: withStack(2, '診療費行情摸得一清二楚,順手多賺一點診療費。') },
      active1: { name: '順手開個檢查單', description: withStack(2, '看診順手多開一張檢查單,額外進帳一筆金幣。') },
      active2: { name: '衛教叮嚀到位', description: withStack(2, '衛教叮嚀交代得又細又到位,額外進帳一筆經驗值。') },
      active3: { name: '一針見效', description: withStack(2, '對症下藥一針見效,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍藥效發揮', description: withStack(2, '藥效發揮加倍見效,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    3: {
      passive1: { name: '傾聽練出的洞察力', description: withStack(3, '長期傾聽練出的敏銳洞察力,經驗值吸收得更快。') },
      passive2: { name: '諮商鐘點算盤', description: withStack(3, '諮商鐘點費算得精打細算,順手多賺一點鐘點費。') },
      active1: { name: '順手排個加談', description: withStack(3, '晤談之餘順手排個加談時段,額外進帳一筆金幣。') },
      active2: { name: '同理心叮嚀', description: withStack(3, '同理心叮嚀說得又細又暖,額外進帳一筆經驗值。') },
      active3: { name: '一句話點醒', description: withStack(3, '關鍵一句話直接點醒對方,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍療癒效果', description: withStack(3, '療癒效果加倍發揮作用,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    4: {
      passive1: { name: '把脈練出的敏銳度', description: withStack(4, '把脈把久了練出的敏銳手感,經驗值吸收得更快。') },
      passive2: { name: '藥材行情摸透了', description: withStack(4, '藥材行情摸得一清二楚,順手多賺一點藥錢。') },
      active1: { name: '順手抓帖藥', description: withStack(4, '看診順手多抓一帖藥,額外進帳一筆金幣。') },
      active2: { name: '食療叮嚀到位', description: withStack(4, '食療叮嚀交代得又細又到位,額外進帳一筆經驗值。') },
      active3: { name: '一帖藥到病除', description: withStack(4, '一帖藥下去直接藥到病除,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍藥膳進補', description: withStack(4, '藥膳進補加倍見效,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
    5: {
      passive1: { name: '神乎其技的判斷力', description: withStack(5, '神乎其技的診斷功力,經驗值吸收得更快。') },
      passive2: { name: '義診名聲換來的緣分', description: withStack(5, '義診名聲累積出的行情,順手多收一點謝禮。') },
      active1: { name: '順手義診一輪', description: withStack(5, '看診之餘順手義診一輪,額外進帳一筆金幣。') },
      active2: { name: '妙手叮嚀到位', description: withStack(5, '妙手叮嚀交代得又細又到位,額外進帳一筆經驗值。') },
      active3: { name: '妙手回春', description: withStack(5, '妙手一出直接妙手回春,直接讓下一場戰鬥瞬間結束。') },
      active4: { name: '雙倍回春神效', description: withStack(5, '回春神效加倍發揮,這次擊殺的經驗與金幣獎勵直接翻倍。') },
    },
  },
};

// tier=1 時呼叫端應改用 game/skillTree.ts 的 SKILL_SLOT_NAMES/SKILL_SLOT_DESCRIPTIONS,這個函式只處理 2~5。
export function getTierSkillFlavor(archetype: Archetype, tier: Exclude<JobTier, 1>, slot: SkillSlotId): TierSkillFlavor {
  // passive3 沒有 tier2~5 專屬敘述(見上面 TierBranchSlotId 的說明),不管玩家目前在看哪一階,
  // 一律回傳 game/skillTree.ts 那份全職業全階級共用的鎖定文案。
  if (slot === 'passive3') {
    return { name: SKILL_SLOT_NAMES[archetype].passive3, description: SKILL_SLOT_DESCRIPTIONS[archetype].passive3 };
  }
  return TIER_SKILL_FLAVOR[archetype][tier][slot];
}
