import { JobSelector } from './JobSelector';

// 「技能」原本是獨立頂層分頁,後來併成「職業」分頁的子分頁,現在職業/技能合併成同一個
// 連續的瀏覽流程(職業/學生格子 → 階級 → 技能投資,見 JobSelector.tsx),不再需要
// 這層 host 分頁切換——JobTab 純粹是掛在 TabBar 上的入口。
export function JobTab() {
  return <JobSelector />;
}
