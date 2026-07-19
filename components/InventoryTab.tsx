import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EquipmentSlot } from '../game/equipment';
import { CharacterStatusPanel } from './CharacterStatusPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { InventoryPanel } from './InventoryPanel';
import { MaterialBrowserPanel } from './MaterialBrowserPanel';

type HostView = 'bag' | 'equipment' | 'materials' | 'status';

const HOST_VIEWS: { id: HostView; label: string }[] = [
  { id: 'bag', label: '背包' },
  { id: 'equipment', label: '裝備' },
  { id: 'materials', label: '材料' },
  { id: 'status', label: '狀態' },
];

// 「裝備」原本是獨立頂層分頁,併進「背包」分頁當子分頁——兩邊原本各自維護一份「目前選擇
// 部位」的狀態,玩家在裝備分頁選了頭飾、切去背包分頁看到的還是上次選的主手武器,等於同一個
// 決策要在兩個地方各做一次。selectedSlot 提到這裡共用,兩個子分頁看到的永遠是同一個選取
// 結果,子分頁各自的插槽選擇列(裝備:紙娃娃式左右插槽 / 背包:單排篩選列)UI 維持原樣不變
// (用途不同,一個是「你身上穿什麼」總覽、一個是「這個部位還有哪些沒穿的款式」清單),只是
// 底層狀態同步。
export function InventoryTab() {
  const [hostView, setHostView] = useState<HostView>('bag');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');

  return (
    <View style={styles.container}>
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
      {hostView === 'bag' && <InventoryPanel selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />}
      {hostView === 'equipment' && <EquipmentPanel selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />}
      {hostView === 'materials' && <MaterialBrowserPanel />}
      {hostView === 'status' && <CharacterStatusPanel />}
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
