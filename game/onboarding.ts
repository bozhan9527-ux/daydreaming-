// 分頁解鎖節奏:避免職業/裝備/背包/技能/成就/寵物坐騎 6 個系統從 Lv1 就一次全開讓新手措手不及。
// 強化/鑲嵌已經收納進「裝備」子分頁裡,不再是獨立系統,不需要各自的解鎖門檻。「技能」併進
// 「職業」分頁、「裝備」併進「背包」分頁當子分頁後(見 JobTab.tsx/InventoryTab.tsx),這裡的
// skill/equipment 兩個門檻改成給子分頁用,不再對應頂層 TabBar 的分頁列表(見 panelTabs.tsx)。
// 職業/裝備/背包是核心的第一眼視覺回饋,一開始就開放;其餘系統照「先懂基礎、再進階」的順序,
// 依練等曲線分散在前 1.5 小時左右的掛機進度內解鎖(數字對照 game/leveling.ts 的練等速度驗證過)。
export const TAB_UNLOCK_LEVELS: Record<string, number> = {
  job: 1,
  equipment: 1,
  inventory: 1,
  skill: 5,
  achievement: 6,
  companion: 8,
  // 工坊(強化裝備+合成技能書/強化石):跟成就一樣屬於「基礎系統玩過一輪後才用得上」的
  // 輔助系統,門檻對齊 achievement——太早開放的話材料還沒囤到,點進去只會看到空空如也。
  workshop: 6,
  // 副本挑戰的是「指定職業」的轉職試煉(見 game/dungeon.ts),等級門檻給低一點也沒關係——
  // 下面 hasChosenJob 那道閘門已經確保實際解鎖時機一定落在畢業(TIER_UNLOCK_LEVELS[1]=Lv30)之後。
  dungeon: 8,
  // 輪迴/轉生系統(見 game/ascension.ts):要打完一整輪 3000 關才會真正拿到轉生點數,門檻
  // 給 Lv50(比其餘系統晚很多)單純是不讓分頁列一開始就塞一個「打開來空空如也」的項目,
  // 玩家練到這個等級時通常已經對關卡進度有一定掌握,比較看得懂這個系統在幹嘛。
  ascension: 50,
};

export function tabUnlockLevel(tabId: string): number {
  return TAB_UNLOCK_LEVELS[tabId] ?? 1;
}

// 學生期(見 hasChosenJob)現在有自己專屬的技能樹(見 game/studentSkillTree.ts),技能分頁
// 不再需要「畢業」這道額外門檻,跟其餘分頁一樣單純只看等級。
// 副本分頁是例外:試煉打贏保證掉「指定職業」的轉職碎片,學生期還沒選定主職,打了也不知道
// 該指定哪個職業練,所以額外要求 hasChosenJob 才真的解鎖(等級門檻本身不夠)。
export function isTabUnlocked(tabId: string, level: number, hasChosenJob: boolean): boolean {
  if (level < tabUnlockLevel(tabId)) return false;
  if (tabId === 'dungeon' && !hasChosenJob) return false;
  return true;
}

// 這次升級有沒有剛好跨過某個分頁的解鎖門檻,回傳新解鎖的 tab id 清單,用來觸發「解鎖新分頁」提示。
export function newlyUnlockedTabs(previousLevel: number, newLevel: number): string[] {
  return Object.entries(TAB_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => previousLevel < unlockLevel && newLevel >= unlockLevel)
    .map(([tabId]) => tabId);
}
