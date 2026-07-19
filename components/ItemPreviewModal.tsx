import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { EquipmentItem, getIdentifyCost, getRerollCost, ItemInstanceData } from '../game/equipment';
import { formatItemStats } from './itemFormatting';
import { ItemIcon } from './ItemIcon';
import { OrnateFrame } from './OrnateFrame';

const ICON_PIXEL_SIZE = 2 / 3;

// 裝備/背包/工坊共用的道具預覽卡:點擊icon不再直接生效,先跳出這張卡片顯示完整屬性,
// 玩家自己按對應按鈕才會真的改動狀態(裝備/購買/卸下/鑑定/重擲皆同一套流程)——原本只有
// EquipmentPanel.tsx 的商店子分頁有這套「先預覽再操作」的設計,抽出來讓背包分頁的道具清單
// 也能用同一套,不用各自維護一份幾乎一樣的Modal。
interface ItemPreviewModalProps {
  item: EquipmentItem;
  instance: ItemInstanceData | undefined;
  coins: number;
  isEquipped: boolean;
  owned: boolean;
  onClose: () => void;
  onEquipOrBuy: () => void;
  onUnequip?: () => void;
  onIdentify?: () => void;
  onReroll?: () => void;
}

export function ItemPreviewModal({
  item,
  instance,
  coins,
  isEquipped,
  owned,
  onClose,
  onEquipOrBuy,
  onUnequip,
  onIdentify,
  onReroll,
}: ItemPreviewModalProps) {
  const statLines = formatItemStats(item, instance).split('\n');
  const canIdentify = instance !== undefined && !instance.identified;
  const canAffordEquip = owned || coins >= item.price;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <OrnateFrame />
        <View style={styles.iconWrap}>
          <ItemIcon item={item} color={item.color} pixelSize={ICON_PIXEL_SIZE * 2} aiHeight={44} />
        </View>
        {statLines.map((line, i) => (
          <Text key={i} style={i === 0 ? styles.name : styles.statLine}>
            {line}
          </Text>
        ))}

        {instance !== undefined && (onIdentify || onReroll) && (
          <View style={styles.identifyGroup}>
            {canIdentify && onIdentify && (
              <Pressable style={styles.identifyRow} onPress={onIdentify}>
                <Text style={styles.identifyLabel}>🔍 鑑定隱藏素質({getIdentifyCost(item)} 金幣)</Text>
              </Pressable>
            )}
            {onReroll && (
              <Pressable style={styles.identifyRow} onPress={onReroll}>
                <Text style={styles.identifyLabel}>🎲 重擲隨機/隱藏素質({getRerollCost(item)} 金幣)</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.actions}>
          {isEquipped && onUnequip ? (
            <Pressable style={styles.unequipButton} onPress={onUnequip}>
              <Text style={styles.actionLabel}>卸下</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.equipButton, !canAffordEquip && styles.equipButtonDisabled]}
              disabled={!canAffordEquip}
              onPress={onEquipOrBuy}
            >
              <Text style={styles.actionLabel}>{owned ? '裝備' : `購買並裝備(${item.price}金幣)`}</Text>
            </Pressable>
          )}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelLabel}>取消</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -160 }],
    maxWidth: 300,
    alignSelf: 'center',
    backgroundColor: '#17171f',
    padding: 20,
    gap: 4,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 6,
  },
  name: {
    color: '#d6a23a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLine: {
    color: '#e8e8ee',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  identifyGroup: {
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
  identifyRow: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2432',
  },
  identifyLabel: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  equipButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4a4456',
  },
  equipButtonDisabled: {
    opacity: 0.4,
  },
  unequipButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#8a2f2f',
  },
  actionLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2a2a35',
  },
  cancelLabel: {
    color: '#8a8a95',
    fontSize: 13,
  },
});
