import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canUpgradeCompanionGearSlot,
  CompanionBonusStat,
  CompanionGearSlot,
  CompanionKind,
  companionGearSlotBonusValue,
  companionGearSlotStat,
  companionGearUpgradeCoinCost,
  companionGearUpgradeRequiredLevel,
  CompanionState,
  COMPANION_GEAR_MAX_LEVEL,
  COMPANION_GEAR_SLOTS,
  getCompanionBonusTotals,
  getCompanionById,
  getCompanionsByKind,
  isCompanionUnlocked,
} from '../game/companions';
import { getCompanionFrame, RARITY_BORDER_COLOR } from '../game/sprites/companions';
import { Rarity } from '../game/trigger';
import { useToast } from '../hooks/useToast';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const KIND_LABELS: Record<CompanionKind, string> = {
  pet: '寵物',
  mount: '坐騎',
};

const STAT_LABELS: Record<CompanionBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

const GEAR_SLOT_LABELS: Record<CompanionGearSlot, string> = {
  top: '上身',
  bottom: '下身',
  helmet: '頭盔',
  shoes: '鞋',
  weapon: '武器',
};

type SubView = 'worn' | 'bag' | 'shop' | 'gear' | 'codex';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'worn', label: '裝備中' },
  { id: 'bag', label: '背包' },
  { id: 'shop', label: '商店' },
  { id: 'gear', label: '裝備' },
  { id: 'codex', label: '圖鑑' },
];

const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說',
};

function formatBonus(stat: CompanionBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

const KINDS: CompanionKind[] = ['pet', 'mount'];

// 圖鑑格子:數值(方塊尺寸/字級大小)是為了讓 100 格塞進面板寬度(container maxWidth 280)
// 抓的折衷值——寵物/坐騎的 frame 寬高不同(見 game/sprites/companions.ts PET_WIDTH/MOUNT_WIDTH),
// 但共用同一個固定尺寸的方塊+置中裁切,兩個 kind 區塊看起來才會是同一套視覺語言。
const CODEX_ICON_PIXEL_SIZE = 1.3;
const CODEX_CELL_ICON_WIDTH = 56;
const CODEX_CELL_ICON_HEIGHT = 34;
const CODEX_LOCKED_BORDER = '#3a3a45';

function codexUnlockedCount(state: CompanionState, kind: CompanionKind): number {
  return getCompanionsByKind(kind).filter((c) => isCompanionUnlocked(state, c.id)).length;
}

export function CompanionPanel() {
  const companions = useGameState((state) => state.companions);
  const companionGear = useGameState((state) => state.companionGear);
  const level = useGameState((state) => state.level);
  const coins = useGameState((state) => state.coins);
  const purchaseCompanion = useGameState((state) => state.purchaseCompanion);
  const unequipCompanionSlot = useGameState((state) => state.unequipCompanionSlot);
  const upgradeCompanionGearSlot = useGameState((state) => state.upgradeCompanionGearSlot);
  const showToast = useToast((state) => state.show);

  const [subView, setSubView] = useState<SubView>('worn');

  const totals = getCompanionBonusTotals(companions);

  const bagCount = KINDS.reduce((sum, kind) => {
    const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
    return sum + getCompanionsByKind(kind).filter((c) => isCompanionUnlocked(companions, c.id) && c.id !== equippedId).length;
  }, 0);
  const shopCount = KINDS.reduce(
    (sum, kind) => sum + getCompanionsByKind(kind).filter((c) => !isCompanionUnlocked(companions, c.id)).length,
    0
  );

  const handleCodexCellPress = (companionId: string, unlocked: boolean) => {
    if (!unlocked) {
      showToast('尚未擁有');
      return;
    }
    const companion = getCompanionById(companionId);
    if (!companion) return;
    showToast(`${companion.name} · ${RARITY_LABELS[companion.rarity]} · ${formatBonus(companion.bonus.stat, companion.bonus.value)}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>

      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={styles.subNavLabel}>
              {view.label}
              {view.id === 'bag' ? `(${bagCount})` : view.id === 'shop' ? `(${shopCount})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {subView === 'worn' &&
        KINDS.map((kind) => {
          const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
          const equipped = equippedId ? getCompanionById(equippedId) : undefined;
          return (
            <View key={kind} style={styles.wornCard}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              {equipped ? (
                <>
                  <Text style={styles.wornItemName}>{equipped.name}</Text>
                  <Text style={styles.wornItemBonus}>{formatBonus(equipped.bonus.stat, equipped.bonus.value)}</Text>
                  <Pressable style={styles.unequipButton} onPress={() => unequipCompanionSlot(kind)}>
                    <Text style={styles.unequipLabel}>卸下</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.emptyText}>還沒裝備{KIND_LABELS[kind]},去「背包」或「商店」挑一隻</Text>
              )}
            </View>
          );
        })}

      {subView === 'bag' &&
        KINDS.map((kind) => {
          const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
          const owned = getCompanionsByKind(kind).filter(
            (c) => isCompanionUnlocked(companions, c.id) && c.id !== equippedId
          );
          if (owned.length === 0) return null;
          return (
            <View key={kind} style={styles.kindSection}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              {owned.map((companion) => (
                <Pressable key={companion.id} style={styles.row} onPress={() => purchaseCompanion(companion.id)}>
                  <Text style={styles.label}>{companion.name}</Text>
                  <Text style={styles.cost}>{formatBonus(companion.bonus.stat, companion.bonus.value)}(點擊裝備)</Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      {subView === 'bag' && bagCount === 0 && <Text style={styles.emptyText}>背包裡沒有其他寵物/坐騎</Text>}

      {subView === 'shop' &&
        KINDS.map((kind) => {
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
      {subView === 'shop' && shopCount === 0 && <Text style={styles.emptyText}>寵物坐騎都收集齊了</Text>}

      {subView === 'gear' &&
        KINDS.map((kind) => (
          <View key={kind} style={styles.kindSection}>
            <Text style={styles.kindTitle}>{KIND_LABELS[kind]}裝備</Text>
            {COMPANION_GEAR_SLOTS.map((slot) => {
              const slotLevel = companionGear[kind][slot];
              const stat = companionGearSlotStat(kind, slot);
              const bonusValue = companionGearSlotBonusValue(slotLevel);
              const atCap = slotLevel >= COMPANION_GEAR_MAX_LEVEL;
              const requiredLevel = companionGearUpgradeRequiredLevel(slotLevel + 1);
              const coinCost = companionGearUpgradeCoinCost(slotLevel);
              const canUpgrade = canUpgradeCompanionGearSlot(slotLevel, level.level, coins);
              return (
                <View key={slot} style={styles.gearRow}>
                  <View style={styles.gearRowHeader}>
                    <Text style={styles.label}>{GEAR_SLOT_LABELS[slot]}</Text>
                    <Text style={styles.cost}>
                      {slotLevel}/{COMPANION_GEAR_MAX_LEVEL} 級 · {formatBonus(stat, bonusValue)}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.upgradeButton, !canUpgrade && styles.upgradeButtonDisabled]}
                    onPress={() => upgradeCompanionGearSlot(kind, slot)}
                    disabled={!canUpgrade}
                  >
                    <Text style={styles.upgradeLabel}>
                      {atCap ? '已達上限' : `升級(需 Lv.${requiredLevel} / ${coinCost} 金幣)`}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}

      {subView === 'codex' && (
        <>
          <Text style={styles.codexProgress}>
            {KINDS.map((kind) => `${KIND_LABELS[kind]} ${codexUnlockedCount(companions, kind)}/${getCompanionsByKind(kind).length}`).join(' · ')}
          </Text>
          {KINDS.map((kind) => (
            <View key={kind} style={styles.kindSection}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}圖鑑</Text>
              <View style={styles.codexGrid}>
                {getCompanionsByKind(kind).map((companion) => {
                  const unlocked = isCompanionUnlocked(companions, companion.id);
                  const frameData = unlocked ? getCompanionFrame(companion.id) : null;
                  return (
                    <Pressable
                      key={companion.id}
                      style={styles.codexCell}
                      onPress={() => handleCodexCellPress(companion.id, unlocked)}
                    >
                      <View
                        style={[
                          styles.codexIconBox,
                          { borderColor: unlocked ? RARITY_BORDER_COLOR[companion.rarity] : CODEX_LOCKED_BORDER },
                        ]}
                      >
                        {unlocked && frameData ? (
                          <PixelSprite frame={frameData.frame} palette={frameData.palette} pixelSize={CODEX_ICON_PIXEL_SIZE} />
                        ) : (
                          <Text style={styles.codexUnknownMark}>?</Text>
                        )}
                      </View>
                      <Text style={styles.codexName} numberOfLines={1}>
                        {unlocked ? companion.name : '???'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 4,
  },
  totalsText: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  subNav: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  subNavButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  subNavButtonActive: {
    backgroundColor: '#4a4456',
  },
  subNavLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  wornCard: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    marginBottom: 8,
  },
  wornItemName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  wornItemBonus: {
    color: '#c9a94f',
    fontSize: 12,
  },
  emptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  unequipButton: {
    marginTop: 2,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  unequipLabel: {
    color: '#f2f2f2',
    fontSize: 12,
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
  gearRow: {
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    marginBottom: 4,
  },
  gearRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upgradeButton: {
    marginTop: 2,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  codexProgress: {
    color: '#c9a94f',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  codexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  codexCell: {
    width: CODEX_CELL_ICON_WIDTH,
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  codexIconBox: {
    width: CODEX_CELL_ICON_WIDTH,
    height: CODEX_CELL_ICON_HEIGHT,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  codexUnknownMark: {
    color: '#5a5a65',
    fontSize: 16,
    fontWeight: '700',
  },
  codexName: {
    color: '#8a8a95',
    fontSize: 8,
    maxWidth: CODEX_CELL_ICON_WIDTH,
    textAlign: 'center',
  },
});
