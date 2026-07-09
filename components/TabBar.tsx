import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTabIcon } from '../game/sprites/tabIcons';
import { PanelTab } from './panelTabs';
import { PixelSprite } from './PixelSprite';

interface TabBarProps {
  tabs: PanelTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, activeId, onSelect }: TabBarProps) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const { frame, palette } = getTabIcon(tab.icon);
        const active = tab.id === activeId;
        return (
          <Pressable key={tab.id} style={[styles.tab, active && styles.tabActive]} onPress={() => onSelect(tab.id)}>
            <PixelSprite frame={frame} palette={palette} pixelSize={3} />
            <Text style={styles.label}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
  },
  tabActive: {
    backgroundColor: '#4a4456',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
