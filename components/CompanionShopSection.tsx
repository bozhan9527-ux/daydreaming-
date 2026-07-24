import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CompanionBonusStat,
  CompanionKind,
  getCompanionsByKind,
  isCompanionUnlocked,
} from '../game/companions';
import { useGameState } from '../hooks/useGameState';

const KIND_LABELS: Record<CompanionKind, string> = {
  pet: '寵物',
  mount: '坐騎',
};

const STAT_LABELS: Record<CompanionBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

function formatBonus(stat: CompanionBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

const KINDS: CompanionKind[] = ['pet', 'mount'];

// 商店的「寵物坐騎」分類:從 CompanionPanel 原本的「商店」子檢視搬過來(見該檔案的
// 既有註解)——花錢購買的區塊統一收進頂層商店分頁,寵物坐騎面板只留裝備中/背包/裝備/圖鑑
// 這幾個「管理已擁有的」子檢視,不重複維護一份購買清單邏輯。
export function CompanionShopSection() {
  const companions = useGameState((state) => state.companions);
  const purchaseCompanion = useGameState((state) => state.purchaseCompanion);

  const shopCount = KINDS.reduce(
    (sum, kind) => sum + getCompanionsByKind(kind).filter((c) => !isCompanionUnlocked(companions, c.id)).length,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>還有 {shopCount} 隻未收集</Text>
      {KINDS.map((kind) => {
        const notOwned = getCompanionsByKind(kind).filter((c) => !isCompanionUnlocked(companions, c.id));
        if (notOwned.length === 0) return null;
        return (
          <View key={kind} style={styles.kindSection}>
            <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
            {notOwned.map((companion) => (
              <Pressable key={companion.id} style={styles.row} onPress={() => purchaseCompanion(companion.id)}>
                <Text style={styles.label}>{companion.name}</Text>
                <Text style={styles.cost}>
                  {formatBonus(companion.bonus.stat, companion.bonus.value)} ({companion.price} 金幣)
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
      {shopCount === 0 && <Text style={styles.emptyText}>寵物坐騎都收集齊了</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  header: {
    color: '#8a8a95',
    fontSize: 11,
    marginBottom: 4,
  },
  kindSection: {
    gap: 4,
    marginBottom: 8,
  },
  kindTitle: {
    color: '#8a8a95',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  cost: {
    color: '#8a8a95',
    fontSize: 12,
  },
  emptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
