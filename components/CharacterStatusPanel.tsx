import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { calcCombatMultiplier, getArchetypeComposition, getJobTitle } from '../game/combat';
import { EquipmentSlot, getEquipmentBonusTotalsFull, getItemById, getSubstatTotals } from '../game/equipment';
import { heroAttackPower, heroDefensePower, heroMaxHp } from '../game/heroHealth';
import { getPassiveBonusValue, resolveSkillLevel } from '../game/skillTree';
import { getEquipmentSlotIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { useHeroArt } from './HeroWalkSprite';
import { formatBonus } from './itemFormatting';
import { ItemIcon } from './ItemIcon';
import { PixelSprite } from './PixelSprite';

// 角色預覽:原本是「裝備」分頁紙娃娃專用的元件,紙娃娃整組搬過來這裡(取代原本的
// 「已裝備物品」格子)時一起帶過來。點一下短暫換成 middle(三聯圖中間那張動作格)再彈回來。
const HERO_PREVIEW_HEIGHT = 130;
const HERO_PREVIEW_CLICK_MS = 500;

function EquipmentHeroPreview() {
  const art = useHeroArt();
  const [showMiddle, setShowMiddle] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timeout.current);
  }, []);

  function handlePress() {
    setShowMiddle(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setShowMiddle(false), HERO_PREVIEW_CLICK_MS);
  }

  const source = showMiddle ? art.middle : art.open;
  const aspectRatio = showMiddle ? art.middleAspectRatio : art.openAspectRatio;

  return (
    <Pressable onPress={handlePress}>
      <Image
        source={source}
        style={{ height: HERO_PREVIEW_HEIGHT, width: HERO_PREVIEW_HEIGHT * aspectRatio }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

// 紙娃娃兩側各一欄插槽按鈕:武器(主手/副手)對放最上排,其餘裝備往下排——
// 跟原本「裝備」分頁的排列一致。
const LEFT_COLUMN: EquipmentSlot[] = ['offhand', 'headwear', 'top', 'belt', 'bottom'];
const RIGHT_COLUMN: EquipmentSlot[] = ['mainhand', 'face', 'back', 'gloves'];

// 數值為0時用暗色淡化,非零維持一般文字色——跟旁邊有意義的數字用同樣視覺權重呈現,
// 會讓玩家要花力氣從一堆「沒有」裡面找「有」。原本是 JobSelector.tsx 的 HeroStatusPanel
// 專用元件,整組搬過來時一起帶過來。
function ZeroDimmed({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return <Text style={pct === 0 && styles.jobStatusValueZero}>{pct}%</Text>;
}

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
  const skillTree = useGameState((state) => state.skillTree);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const passiveSkillLoadout = useGameState((state) => state.passiveSkillLoadout);
  const showToast = useToast((state) => state.show);

  const title = hasChosenJob ? getJobTitle(job.archetype, job.branch, tier) : '學生';
  const totals = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const substatTotals = getSubstatTotals(equipment, itemInstances);
  const heroSchool = getArchetypeComposition(job.archetype).damageType;
  const isPhysical = heroSchool === 'physical';
  const attackSubstat = heroSchool === 'physical' ? substatTotals.physicalAttack : substatTotals.magicAttack;
  const resistanceSubstat = heroSchool === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
  const maxHp = heroMaxHp(level.level);
  const attackPower = heroAttackPower(level.level, tier, attackSubstat);
  const defensePower = heroDefensePower(level.level, tier, resistanceSubstat);
  // 吸血/回血:裝備素質+passive3被動技能欄自選(見 game/skillTree.ts 的
  // PassiveSkillLoadout)的完整合併值——跟 hooks/useGameState.ts 的 currentPassiveBonusValue
  // 同一份資料來源,不再用「畢業與否」二選一,改成直接讀目前實際裝的那一格。
  const passive3Level = resolveSkillLevel(passiveSkillLoadout.passive3, skillTree, studentSkillTree);
  const totalLifesteal = substatTotals.lifesteal + getPassiveBonusValue(passive3Level);
  const totalHpRegen = substatTotals.hpRegen + getPassiveBonusValue(passive3Level);

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

  function renderSlotButton(slot: EquipmentSlot) {
    const itemId = equipment[slot];
    const item = itemId !== undefined ? getItemById(itemId) : undefined;
    const iconColor = item ? item.color : EMPTY_ICON_COLOR;
    const emptySlotIcon = getEquipmentSlotIcon(slot);
    return (
      <Pressable key={slot} style={styles.slotButton} onPress={() => handleSlotPress(slot)}>
        {item ? (
          <ItemIcon item={item} color={iconColor} pixelSize={ICON_PIXEL_SIZE} aiHeight={20} />
        ) : (
          <>
            <PixelSprite frame={emptySlotIcon.frame} palette={{ [emptySlotIcon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
            <Text style={styles.slotButtonLabel} numberOfLines={1}>
              {SLOT_LABELS[slot]}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* 紙娃娃(角色預覽+兩側插槽按鈕)取代原本的「已裝備物品」格子,從「裝備」分頁搬過來——
          放在最上面,邊框回復成搬過來之前的樣式(單純銅色邊框),不套用「裝備」分頁曾經用過
          的稀有度九宮格金框美術,點插槽維持原本的 toast 提示,不是完整的裝備管理介面
          (裝備管理留在「裝備」分頁做)。 */}
      <View style={styles.paperdollRow}>
        <View style={styles.slotColumn}>{LEFT_COLUMN.map(renderSlotButton)}</View>
        <View style={styles.heroWrap}>
          <EquipmentHeroPreview />
        </View>
        <View style={styles.slotColumn}>{RIGHT_COLUMN.map(renderSlotButton)}</View>
      </View>

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

      {/* 以下原本是「職業」分頁 JobSelector.tsx 的 HeroStatusPanel,整組搬過來這裡,
          職業分頁那邊已經移除,不再重複顯示。 */}
      <Text style={styles.sectionTitle}>職業戰鬥數值</Text>
      <View style={styles.jobStatusCard}>
        <Text style={[styles.jobStatusLine, isPhysical && styles.jobStatusLineHighlight]}>
          物理:爆擊率 <ZeroDimmed value={substatTotals.physicalCritRate} /> / 爆擊傷害 +
          <ZeroDimmed value={substatTotals.physicalCritDamage} />
        </Text>
        <Text style={[styles.jobStatusLine, !isPhysical && styles.jobStatusLineHighlight]}>
          魔法:爆擊率 <ZeroDimmed value={substatTotals.magicCritRate} /> / 爆擊傷害 +
          <ZeroDimmed value={substatTotals.magicCritDamage} />
        </Text>
        <Text style={styles.jobStatusLine}>
          吸血 <ZeroDimmed value={totalLifesteal} />　自動回血 <ZeroDimmed value={totalHpRegen} />
        </Text>
        <Text style={styles.jobStatusLine}>職業階級倍率 x{calcCombatMultiplier(job.archetype, tier).toFixed(2)}</Text>
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
  paperdollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotColumn: {
    gap: 6,
  },
  // 邊框回復成搬到這裡之前的樣式:單純銅色邊框,不套用「裝備」分頁曾經用過的
  // 稀有度九宮格金框美術(NineSliceFrame/RARITY_FRAME_PARTS)。
  slotButton: {
    width: 48,
    paddingVertical: 4,
    gap: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonLabel: {
    color: '#8a8a95',
    fontSize: 8,
    textAlign: 'center',
  },
  jobStatusCard: {
    width: '100%',
    gap: 3,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  jobStatusLine: {
    color: '#c8c8d0',
    fontSize: 11,
  },
  jobStatusLineHighlight: {
    color: '#c9a94f',
    fontWeight: '600',
  },
  jobStatusValueZero: {
    color: '#5a5a65',
    fontWeight: '400',
  },
});
