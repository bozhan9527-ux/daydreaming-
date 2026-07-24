import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavIntent } from '../hooks/useNavIntent';
import { CraftingPanel } from './CraftingPanel';
import { EnhancementPanel } from './EnhancementPanel';
import { SocketPanel } from './SocketPanel';

type HostView = 'enhance' | 'craft' | 'socket';

const HOST_VIEWS: { id: HostView; label: string }[] = [
  { id: 'enhance', label: '強化' },
  { id: 'craft', label: '合成' },
  { id: 'socket', label: '鑲嵌' },
];

// 工坊分頁:強化+鑲嵌(原本都收在「裝備」子分頁下,見 EquipmentPanel.tsx 的既有註解)
// +合成(技能書/強化石分階系統,見 game/materials.ts)三個子分頁,都是圍繞「花材料換
// 更強」的系統,收在同一個分頁下比各自散落好找。
export function WorkshopTab() {
  const [hostView, setHostView] = useState<HostView>('enhance');

  // 材料瀏覽頁(見 MaterialBrowserPanel.tsx/GemBrowsePanel.tsx)點擊素材的跳轉按鈕
  // 可以指定要直接落在哪個子分頁——見 hooks/useNavIntent.ts 的整體說明。
  const requestedWorkshopView = useNavIntent((state) => state.workshopView);
  const consumeWorkshopView = useNavIntent((state) => state.consumeWorkshopView);
  useEffect(() => {
    if (requestedWorkshopView) {
      setHostView(requestedWorkshopView);
      consumeWorkshopView();
    }
  }, [requestedWorkshopView, consumeWorkshopView]);

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
      {hostView === 'enhance' && <EnhancementPanel />}
      {hostView === 'craft' && <CraftingPanel />}
      {hostView === 'socket' && <SocketPanel />}
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
