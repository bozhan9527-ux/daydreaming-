import { StyleSheet, View } from 'react-native';

import { JobSelector } from './JobSelector';

// 技能子分頁整組搬到「背包」分頁的「狀態」子分頁(見 CharacterStatusPanel.tsx 的說明),
// 這裡不再需要職業/技能的子導覽,直接顯示選職業畫面。
export function JobTab() {
  return (
    <View style={styles.container}>
      <JobSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
  },
});
