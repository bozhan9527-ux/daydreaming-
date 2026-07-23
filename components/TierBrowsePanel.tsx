import { Pressable, StyleSheet, Text, View } from 'react-native';

import { JobTier, TIER_UNLOCK_LEVELS } from '../game/combat';
import {
  TIER2_BONUS_COIN_MULT,
  TIER3_BONUS_EXP_MULT,
  TIER4_BONUS_FLAT_COINS,
  TIER5_EXTRA_DAMAGE_CHANCE,
  TIER5_EXTRA_DAMAGE_CUT_RATIO,
} from '../game/skillTree';

const TIERS: JobTier[] = [1, 2, 3, 4, 5];

// 每晉一階新增疊加的專屬加成(見 game/skillTree.ts 的 getTierTriggerBonus):1階沒有額外加成
// (轉職剛畢業的基準線),2~5階各自新增一種,疊加生效不是取代。
const TIER_BONUS_TEXT: Record<JobTier, string | null> = {
  1: null,
  2: `主動技能觸發額外 +${Math.round(TIER2_BONUS_COIN_MULT * 100)}% 金幣`,
  3: `主動技能觸發額外 +${Math.round(TIER3_BONUS_EXP_MULT * 100)}% 經驗`,
  4: `主動技能觸發額外 +${TIER4_BONUS_FLAT_COINS} 金幣`,
  5: `${Math.round(TIER5_EXTRA_DAMAGE_CHANCE * 100)}% 機率額外造成一記重擊(削減戰鬥剩餘時間 ${Math.round(TIER5_EXTRA_DAMAGE_CUT_RATIO * 100)}%)`,
};

interface TierBrowsePanelProps {
  currentTier: JobTier;
  viewingTier: JobTier;
  onSelectTier: (tier: JobTier) => void;
}

// 依階級瀏覽:5個階級分頁,不管目前實際晉升到第幾階,都可以先切過去看那一階自己的技能
// 等級/敘述/升級按鈕(見 SkillPanel.tsx——這裡選的 viewingTier 直接驅動整張技能卡片,
// 不是另外開一張獨立預覽卡)。這個元件現在只負責分頁列本身+晉升解鎖的階級加成說明。
export function TierBrowsePanel({ currentTier, viewingTier, onSelectTier }: TierBrowsePanelProps) {
  const bonusText = TIER_BONUS_TEXT[viewingTier];

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>依階級瀏覽:選哪一階,下面的技能卡片就顯示那一階自己的等級/升級</Text>
      <View style={styles.tabRow}>
        {TIERS.map((t) => {
          const reached = t <= currentTier;
          const isSelected = t === viewingTier;
          return (
            <Pressable
              key={t}
              style={[styles.tab, isSelected && styles.tabSelected, !reached && styles.tabLocked]}
              onPress={() => onSelectTier(t)}
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>{t}階</Text>
              {t === currentTier && <Text style={styles.tabCurrentMark}>現階</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.bonusRow}>
        {viewingTier > currentTier
          ? `Lv.${TIER_UNLOCK_LEVELS[viewingTier]} 解鎖資格,尚未晉升到此階`
          : (bonusText ?? '轉職起點,尚無額外加成')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  hint: {
    color: '#6a6a75',
    fontSize: 10,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: '#4a4456',
  },
  tabLocked: {
    opacity: 0.55,
  },
  tabLabel: {
    color: '#8a8a95',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelSelected: {
    color: '#f2f2f2',
  },
  tabCurrentMark: {
    color: '#c9a94f',
    fontSize: 8,
  },
  bonusRow: {
    color: '#8fd4a8',
    fontSize: 11,
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
});
