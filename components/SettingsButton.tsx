import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useGameState } from '../hooks/useGameState';

// 設定入口刻意不放進底部8分頁(那邊已經滿了)、也不塞進頂部資源列(TopResourceBar.tsx刻意
// 只放3顆藥丸,見該檔案的設計取捨)——改成獨立的浮動齒輪按鈕,跟 DailyQuestBadge/
// LimitedEventBanner 同一套「浮在畫面角落、不佔用主畫面高度」的既有慣例,放在比它們更高的
// top:8(它們在 top:74),避免疊在一起。
export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const soundMuted = useGameState((state) => state.soundMuted);
  const toggleSound = useGameState((state) => state.toggleSound);
  const resetSave = useGameState((state) => state.resetSave);

  const close = () => {
    setOpen(false);
    setConfirmingReset(false);
  };

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.icon}>⚙</Text>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>設定</Text>
            <Pressable style={styles.closeButton} onPress={close}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <Pressable style={styles.row} onPress={toggleSound}>
            <Text style={styles.rowLabel}>音效</Text>
            <Text style={styles.rowValue}>{soundMuted ? '關閉' : '開啟'}</Text>
          </Pressable>

          <View style={styles.divider} />

          {confirmingReset ? (
            <View style={styles.resetConfirmBlock}>
              <Text style={styles.resetWarning}>確定要清除存檔重新開始嗎?這個動作無法復原。</Text>
              <View style={styles.resetActions}>
                <Pressable style={styles.cancelButton} onPress={() => setConfirmingReset(false)}>
                  <Text style={styles.cancelLabel}>取消</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmButton}
                  onPress={() => {
                    resetSave();
                    close();
                  }}
                >
                  <Text style={styles.confirmLabel}>確定清除</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.resetButton} onPress={() => setConfirmingReset(true)}>
              <Text style={styles.resetButtonLabel}>清除存檔重新開始</Text>
            </Pressable>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#3a3a45',
    zIndex: 20,
  },
  icon: {
    fontSize: 15,
    color: '#c8c8d0',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -100 }],
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: '#17171f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a3a45',
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  title: {
    color: '#f2f2f2',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeLabel: {
    color: '#8a8a95',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    color: '#f2f2f2',
    fontSize: 13,
  },
  rowValue: {
    color: '#8fbfe0',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a35',
  },
  resetButton: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#2a2a35',
  },
  resetButtonLabel: {
    color: '#e0705c',
    fontSize: 12,
    fontWeight: '600',
  },
  resetConfirmBlock: {
    gap: 8,
  },
  resetWarning: {
    color: '#e0705c',
    fontSize: 12,
    lineHeight: 17,
  },
  resetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#2a2a35',
  },
  cancelLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#e0503a',
  },
  confirmLabel: {
    color: '#17171f',
    fontSize: 12,
    fontWeight: '700',
  },
});
