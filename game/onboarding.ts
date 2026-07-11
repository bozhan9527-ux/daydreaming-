// 分頁解鎖節奏:避免職業/裝備/背包/技能/成就/寵物坐騎 6 個頂層系統從 Lv1 就一次全開讓新手措手不及。
// 強化/鑲嵌已經收納進「裝備」分頁裡當子分頁,不再是獨立頂層系統,不需要各自的解鎖門檻。
// 職業/裝備/背包是核心的第一眼視覺回饋,一開始就開放;其餘系統照「先懂基礎、再進階」的順序,
// 依練等曲線分散在前 1.5 小時左右的掛機進度內解鎖(數字對照 game/leveling.ts 的練等速度驗證過)。
export const TAB_UNLOCK_LEVELS: Record<string, number> = {
  job: 1,
  equipment: 1,
  inventory: 1,
  skill: 5,
  achievement: 6,
  companion: 8,
};

export function tabUnlockLevel(tabId: string): number {
  return TAB_UNLOCK_LEVELS[tabId] ?? 1;
}

// 學生期(見 hasChosenJob)現在有自己專屬的技能樹(見 game/studentSkillTree.ts),技能分頁
// 不再需要「畢業」這道額外門檻,跟其餘分頁一樣單純只看等級。
export function isTabUnlocked(tabId: string, level: number, hasChosenJob: boolean): boolean {
  if (level < tabUnlockLevel(tabId)) return false;
  return true;
}

// 這次升級有沒有剛好跨過某個分頁的解鎖門檻,回傳新解鎖的 tab id 清單,用來觸發「解鎖新分頁」提示。
export function newlyUnlockedTabs(previousLevel: number, newLevel: number): string[] {
  return Object.entries(TAB_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => previousLevel < unlockLevel && newLevel >= unlockLevel)
    .map(([tabId]) => tabId);
}
