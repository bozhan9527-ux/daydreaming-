// 分頁解鎖節奏:避免職業/裝備/技能/寵物坐騎/強化/鑲嵌 6 個系統從 Lv1 就一次全開讓新手措手不及。
// 職業/裝備是核心的第一眼視覺回饋,一開始就開放;其餘系統照「先懂基礎、再進階」的順序,
// 依練等曲線分散在前 1.5 小時左右的掛機進度內解鎖(數字對照 game/leveling.ts 的練等速度驗證過)。
export const TAB_UNLOCK_LEVELS: Record<string, number> = {
  job: 1,
  equipment: 1,
  skill: 5,
  companion: 8,
  enhance: 12,
  socket: 16,
};

export function tabUnlockLevel(tabId: string): number {
  return TAB_UNLOCK_LEVELS[tabId] ?? 1;
}

// 技能分頁額外多一道「學生畢業」門檻(見 hasChosenJob,game/leveling.ts 練等曲線註解旁的說明):
// 學生期間就算等級已經過了 TAB_UNLOCK_LEVELS.skill,也還不能真的進去技能分頁操作,
// 因為根本還沒有主職可以升技能。其餘分頁不受這個額外條件影響。
export function isTabUnlocked(tabId: string, level: number, hasChosenJob: boolean): boolean {
  if (level < tabUnlockLevel(tabId)) return false;
  if (tabId === 'skill' && !hasChosenJob) return false;
  return true;
}

// 這次升級有沒有剛好跨過某個分頁的解鎖門檻,回傳新解鎖的 tab id 清單,用來觸發「解鎖新分頁」提示。
export function newlyUnlockedTabs(previousLevel: number, newLevel: number): string[] {
  return Object.entries(TAB_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => previousLevel < unlockLevel && newLevel >= unlockLevel)
    .map(([tabId]) => tabId);
}
