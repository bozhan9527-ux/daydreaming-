import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CharacterStatusPanel } from './CharacterStatusPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { GemBrowsePanel } from './GemBrowsePanel';
import { MaterialBrowserPanel } from './MaterialBrowserPanel';
import { ResourceBar } from './ResourceBar';

type HostView = 'status' | 'equipment' | 'materials' | 'gems';

const HOST_VIEWS: { id: HostView; label: string }[] = [
  { id: 'status', label: '狀態' },
  { id: 'equipment', label: '裝備' },
  { id: 'materials', label: '材料' },
  { id: 'gems', label: '鑲嵌石' },
];

// 分頁順序:狀態/裝備/材料/鑲嵌石(原本的「背包」分頁併進「裝備」,見 EquipmentPanel.tsx 的
// 「已擁有」子檢視;鑲嵌石是新增的唯讀瀏覽分頁,操作維持在工坊的鑲嵌子分頁)。ResourceBar
// (強化石/寶石總量)原本放在「背包」分頁裡,那個分頁拆掉後移到這裡當四個子分頁共用的
// 常駐列,不管切到哪個子分頁都看得到。
export function InventoryTab() {
  const [hostView, setHostView] = useState<HostView>('status');

  return (
    <View style={styles.container}>
      <ResourceBar />
      <View style={styles.hostNav}>
        {HOST_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.hostNavButton, hostView === view.id && styles.hostNavButtonActive]}
            onPress={() => setHostView(view.id)}
          >
            <Text style={styles.hostNavLabel}>{view.label}</Text>
          </Pressable>
        ))}
      </View>
      {hostView === 'status' && <CharacterStatusPanel />}
      {hostView === 'equipment' && <EquipmentPanel />}
      {hostView === 'materials' && <MaterialBrowserPanel />}
      {hostView === 'gems' && <GemBrowsePanel />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
  },
  hostNav: {
    flexDirection: 'row',
    gap: 6,
  },
  hostNavButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#59462b',
    alignItems: 'center',
  },
  // 選取中的子分頁統一用藍色(#6ab0e0)訊號色,金色專門留給裝飾性外框。
  hostNavButtonActive: {
    backgroundColor: '#3d3450',
    borderColor: '#6ab0e0',
  },
  hostNavLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '700',
  },
});
