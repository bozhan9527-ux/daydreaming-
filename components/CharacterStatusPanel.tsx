import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getArchetypeComposition, getJobTitle } from '../game/combat';
import {
  EquipmentSlot,
  getEquipmentBonusTotalsFull,
  getItemById,
  getSubstatTotals,
  SLOT_Z_ORDER,
} from '../game/equipment';
import { heroAttackPower, heroDefensePower, heroMaxHp } from '../game/heroHealth';
import { getEquipmentSlotIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { formatBonus } from './itemFormatting';
import { ItemIcon } from './ItemIcon';
import { PixelSprite } from './PixelSprite';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  back: '背飾',
  bottom: '下身',
  top: '上身',
  belt: '腰帶',
  headwear: '頭飾',
  face: '面飾',
  gloves: '手套',
  offhand: '副手',
  mainhand: '主手武器',
};

const EMPTY_ICON_COLOR = '#4a4456';
const ICON_PIXEL_SIZE = 2 / 3;

function StatCell({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellLabel}>{label}</Text>
      <Text style={[styles.statCellValue, pct === 0 && styles.statCellValueZero]}>+{pct}%</Text>
    </View>
  );
}

// 角色狀態總覽:數值全部從既有的裝備/等級公式即算即用(getEquipmentBonusTotalsFull/
// getSubstatTotals/heroAttackPower...),不新增任何追蹤欄位——跟「裝備」子分頁頂部的
// 總加成/素質格是同一份計算,只是這裡額外加上戰鬥力數字(攻擊/防禦/血量)跟已裝備物品
// 總覽,獨立成一個不用先選插槽就能看的總覽頁。
export function CharacterStatusPanel() {
  const level = useGameState((state) => state.level);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const job = useGameState((state) => state.job);
  const tier = useGameState((state) => state.jobTier);
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);
  const heroHp = useGameState((state) => state.heroHp);
  const showToast = useToast((state) => state.show);

  const title = hasChosenJob ? getJobTitle(job.archetype, job.branch, tier) : '學生';
  const totals = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const substatTotals = getSubstatTotals(equipment, itemInstances);
  const heroSchool = getArchetypeComposition(job.archetype).damageType;
  const attackSubstat = heroSchool === 'physical' ? substatTotals.physicalAttack : substatTotals.magicAttack;
  const resistanceSubstat = heroSchool === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
  const maxHp = heroMaxHp(level.level);
  const attackPower = heroAttackPower(level.level, tier, attackSubstat);
  const defensePower = heroDefensePower(level.level, tier, resistanceSubstat);

  function handleSlotPress(slot: EquipmentSlot) {
    const itemId = equipment[slot];
    if (!itemId) {
      showToast(`${SLOT_LABELS[slot]}還沒裝備任何東西`);
      return;
    }
    const item = getItemById(itemId);
    if (!item) return;
    showToast(`${SLOT_LABELS[slot]}:${item.name}(${formatBonus(item.bonus.stat, item.bonus.value)})`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.levelText}>Lv.{level.level}</Text>

      <View style={styles.powerRow}>
        <View style={styles.powerCell}>
          <Text style={styles.powerLabel}>血量</Text>
          <Text style={styles.powerValue}>
            {heroHp}/{maxHp}
          </Text>
        </View>
        <View style={styles.powerCell}>
          <Text style={styles.powerLabel}>攻擊力</Text>
          <Text style={styles.powerValue}>{Math.round(attackPower)}</Text>
        </View>
        <View style={styles.powerCell}>
          <Text style={styles.powerLabel}>防禦力</Text>
          <Text style={styles.powerValue}>{Math.round(defensePower)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>裝備總加成</Text>
      <Text style={styles.totalsText}>
        {formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} / {formatBonus('speed', totals.speed)}
      </Text>

      <Text style={styles.sectionTitle}>素質總和</Text>
      <View style={styles.substatGrid}>
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>物理</Text>
          <StatCell label="攻擊" value={substatTotals.physicalAttack} />
          <StatCell label="抗性" value={substatTotals.physicalResistance} />
          <StatCell label="爆率" value={substatTotals.physicalCritRate} />
          <StatCell label="爆傷" value={substatTotals.physicalCritDamage} />
        </View>
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>魔法</Text>
          <StatCell label="攻擊" value={substatTotals.magicAttack} />
          <StatCell label="抗性" value={substatTotals.magicResistance} />
          <StatCell label="爆率" value={substatTotals.magicCritRate} />
          <StatCell label="爆傷" value={substatTotals.magicCritDamage} />
        </View>
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>通用</Text>
          <StatCell label="吸血" value={substatTotals.lifesteal} />
          <StatCell label="回血" value={substatTotals.hpRegen} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>已裝備物品</Text>
      <View style={styles.slotGrid}>
        {SLOT_Z_ORDER.map((slot) => {
          const itemId = equipment[slot];
          const item = itemId !== undefined ? getItemById(itemId) : undefined;
          const iconColor = item ? item.color : EMPTY_ICON_COLOR;
          const emptySlotIcon = getEquipmentSlotIcon(slot);
          return (
            <View key={slot} style={styles.slotTileWrap}>
              <Pressable style={styles.slotTile} onPress={() => handleSlotPress(slot)}>
                {item ? (
                  <ItemIcon item={item} color={iconColor} pixelSize={ICON_PIXEL_SIZE} aiHeight={30} />
                ) : (
                  <PixelSprite frame={emptySlotIcon.frame} palette={{ [emptySlotIcon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
                )}
              </Pressable>
              <Text style={styles.slotTileLabel} numberOfLines={1}>
                {SLOT_LABELS[slot]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
    alignItems: 'center',
  },
  title: {
    color: '#d6a23a',
    fontSize: 15,
    fontWeight: '700',
  },
  levelText: {
    color: '#f2f2f2',
    fontSize: 13,
  },
  powerRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  powerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  powerLabel: {
    color: '#8a8a95',
    fontSize: 11,
  },
  powerValue: {
    color: '#f2f2f2',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  totalsText: {
    color: '#8fd4a8',
    fontSize: 12,
  },
  substatGrid: {
    width: '100%',
    gap: 4,
  },
  substatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  substatRowLabel: {
    color: '#8a8a95',
    fontSize: 10,
    width: 28,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
  },
  statCellLabel: {
    color: '#8a8a95',
    fontSize: 9,
  },
  statCellValue: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
  statCellValueZero: {
    color: '#5a5a62',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  slotTileWrap: {
    alignItems: 'center',
    gap: 2,
    width: 52,
  },
  slotTile: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTileLabel: {
    color: '#8a8a95',
    fontSize: 9,
    textAlign: 'center',
  },
});
