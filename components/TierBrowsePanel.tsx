import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype, JobTier, TIER_UNLOCK_LEVELS } from '../game/combat';
import {
  SkillSlotId,
  TIER2_BONUS_COIN_MULT,
  TIER3_BONUS_EXP_MULT,
  TIER4_BONUS_FLAT_COINS,
  TIER5_EXTRA_DAMAGE_CHANCE,
  TIER5_EXTRA_DAMAGE_CUT_RATIO,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const TIERS: JobTier[] = [1, 2, 3, 4, 5];
const PREVIEW_TILE_SIZE = 44;

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
  archetype: Archetype;
  slot: SkillSlotId;
}

// 依階級瀏覽:5個階級分頁,不管目前實際晉升到第幾階,都可以先看每一階的技能圖示會變成
// 什麼樣子、晉升時額外解鎖什麼加成——跟 JobSelector.tsx 選職業時的 TierList/SkillDetailPanel
// 是同一種「先看後選」精神,只是這裡看的是已經投資中的技能,不是還沒選的職業。
export function TierBrowsePanel({ archetype, slot }: TierBrowsePanelProps) {
  const currentTier = useGameState((state) => state.jobTier);
  const [viewingTier, setViewingTier] = useState<JobTier>(currentTier);

  const icon = getSkillIcon(archetype, slot, viewingTier);
  const bonusText = TIER_BONUS_TEXT[viewingTier];

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>依階級瀏覽:同一格技能升階後的圖示變化+晉升解鎖的加成</Text>
      <View style={styles.tabRow}>
        {TIERS.map((t) => {
          const reached = t <= currentTier;
          const isSelected = t === viewingTier;
          return (
            <Pressable
              key={t}
              style={[styles.tab, isSelected && styles.tabSelected, !reached && styles.tabLocked]}
              onPress={() => setViewingTier(t)}
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>{t}階</Text>
              {t === currentTier && <Text style={styles.tabCurrentMark}>現階</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.previewRow}>
        <View style={styles.previewIconWrap}>
          <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewLevelReq}>Lv.{TIER_UNLOCK_LEVELS[viewingTier]} 解鎖資格</Text>
          <Text style={styles.previewBonus}>{bonusText ?? '轉職起點,尚無額外加成'}</Text>
        </View>
      </View>
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
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  previewIconWrap: {
    width: PREVIEW_TILE_SIZE,
    height: PREVIEW_TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
    gap: 2,
  },
  previewLevelReq: {
    color: '#8a8a95',
    fontSize: 11,
  },
  previewBonus: {
    color: '#8fd4a8',
    fontSize: 11,
  },
});
