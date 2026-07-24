import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GEM_SPECS, GEM_TYPES, GemType } from '../game/equipment';
import { MATERIAL_TIER_LABELS, MATERIAL_TIERS } from '../game/materials';
import { useGameState } from '../hooks/useGameState';

// 加成類(exp/coins/speed)跟素質類(物理/魔法抗性、爆擊率、爆擊傷害、攻擊力、吸血、回血)
// 分兩個分頁瀏覽——13種寶石一次全攤開會太亂,跟工坊「鑲嵌」子分頁(SocketPanel.tsx)
// 同一套大類分組,方便玩家兩邊對照。
type SubView = 'bonus' | 'substat';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'bonus', label: '加成類' },
  { id: 'substat', label: '素質類' },
];

const BONUS_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'bonus');
const SUBSTAT_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'substat');

// 背包的鑲嵌石分頁:只顯示擁有數量(唯讀瀏覽),鑲入/拔出/合成/購買等操作維持在
// 「工坊」分頁的「鑲嵌」子分頁(SocketPanel.tsx)——跟材料分頁「背包只看數量、合成在
// 工坊做」同一套分工原則。
export function GemBrowsePanel() {
  const gemCounts = useGameState((state) => state.gemCounts);
  const [subView, setSubView] = useState<SubView>('bonus');

  const gemTypes = subView === 'bonus' ? BONUS_GEM_TYPES : SUBSTAT_GEM_TYPES;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        這裡只顯示擁有數量,購買/合成/鑲入裝備要去「工坊」分頁的「鑲嵌」子分頁操作。
      </Text>

      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={[styles.subNavLabel, subView === view.id && styles.subNavLabelActive]}>{view.label}</Text>
          </Pressable>
        ))}
      </View>

      {gemTypes.map((gemType) => (
        <GemTypeRow key={gemType} gemType={gemType} counts={gemCounts[gemType]} />
      ))}
    </View>
  );
}

// 寶石目前沒有專屬圖示素材(SocketPanel.tsx 的鑲嵌介面也是純文字,沒有畫圖示),
// 這裡用階級文字+數量表示,格子尺寸維持跟材料分頁一致的8欄密集網格規則。
function GemTypeRow({ gemType, counts }: { gemType: GemType; counts: Record<number, number> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{GEM_SPECS[gemType].name}</Text>
      <View style={styles.grid}>
        {MATERIAL_TIERS.map((tier) => (
          <View key={tier} style={styles.tile}>
            <Text style={styles.tierLabel}>{MATERIAL_TIER_LABELS[tier]}</Text>
            <Text style={styles.countLabel}>{counts[tier]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 8,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  // 分段切換器樣式跟 InventoryTab 的方形通欄分頁拉開差異(見 EquipmentPanel.tsx 同名樣式
  // 的說明),膠囊型、靠左、不佔滿寬度。
  subNav: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#14141a',
  },
  subNavButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  subNavButtonActive: {
    backgroundColor: '#2a2440',
  },
  subNavLabel: {
    color: '#8a8a95',
    fontSize: 12,
  },
  subNavLabelActive: {
    color: '#f2f2f2',
    fontWeight: '700',
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '700',
  },
  // 8欄密集網格,跟材料分頁/裝備分頁的「已擁有」子檢視同一套格子尺寸規則。
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
  },
  tile: {
    width: 30,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
  },
  tierLabel: {
    color: '#8a8a95',
    fontSize: 9,
  },
  countLabel: {
    color: '#f2f2f2',
    fontSize: 10,
    fontWeight: '600',
  },
});
