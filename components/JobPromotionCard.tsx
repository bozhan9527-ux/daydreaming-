import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TIER_UNLOCK_LEVELS } from '../game/combat';
import { DUNGEON_TICKET_CAP } from '../game/dungeon';
import { nextJobTier, promotionMaterialCost } from '../game/jobPromotion';
import { MATERIAL_TIER_LABELS, MaterialTier } from '../game/materials';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

// 職業階級晉升卡片:轉職不再是等級到門檻就自動套用,改成玩家在這裡主動觸發一次晉升試煉——
// 試煉沿用轉職副本同一組入場券池(見 hooks/useGameState.ts 的 promoteJobTier),材料門檻
// 對應晉升目標階級,三個條件(等級/材料/入場券)都要當下滿足才能出手,打贏才會真的升階。
export function JobPromotionCard() {
  const jobTier = useGameState((state) => state.jobTier);
  const level = useGameState((state) => state.level);
  const dungeon = useGameState((state) => state.dungeon);
  const skillBooks = useGameState((state) => state.skillBooks);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const promoteJobTier = useGameState((state) => state.promoteJobTier);
  const showToast = useToast((state) => state.show);

  const targetTier = nextJobTier(jobTier);

  if (!targetTier) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>職業階級:{MATERIAL_TIER_LABELS[jobTier as MaterialTier]}</Text>
        <Text style={styles.maxedText}>已達最高階級,轉職之路到此為止</Text>
      </View>
    );
  }

  const materialTier = targetTier as MaterialTier;
  const cost = promotionMaterialCost(targetTier);
  const requiredLevel = TIER_UNLOCK_LEVELS[targetTier];
  const levelReady = level.level >= requiredLevel;
  const heldBooks = skillBooks[materialTier];
  const heldStones = enhanceStones[materialTier];
  const materialsReady = heldBooks >= cost.skillBooks && heldStones >= cost.enhanceStones;
  const ticketReady = dungeon.tickets > 0;
  const canPromote = levelReady && materialsReady && ticketReady;

  function handlePromote() {
    const beforeTier = jobTier;
    promoteJobTier();
    const afterTier = useGameState.getState().jobTier;
    if (afterTier > beforeTier) {
      showToast(`晉升成功!職業階級提升到${MATERIAL_TIER_LABELS[afterTier as MaterialTier]}`);
    } else {
      showToast('晉升試煉失敗,勇者暫時撤退');
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        職業階級:{MATERIAL_TIER_LABELS[jobTier as MaterialTier]} → {MATERIAL_TIER_LABELS[targetTier as MaterialTier]}
      </Text>
      <Text style={[styles.reqLine, !levelReady && styles.reqLineFail]}>
        等級需求 Lv.{requiredLevel}(目前 Lv.{level.level})
      </Text>
      <Text style={[styles.reqLine, !materialsReady && styles.reqLineFail]}>
        {cost.skillBooks} 本{MATERIAL_TIER_LABELS[materialTier]}技能書(持有 {heldBooks})｜{cost.enhanceStones} 個
        {MATERIAL_TIER_LABELS[materialTier]}強化石(持有 {heldStones})
      </Text>
      <Text style={[styles.reqLine, !ticketReady && styles.reqLineFail]}>
        入場券 {dungeon.tickets}/{DUNGEON_TICKET_CAP}
      </Text>
      <Pressable style={[styles.button, !canPromote && styles.buttonDisabled]} onPress={handlePromote} disabled={!canPromote}>
        <Text style={styles.buttonLabel}>挑戰晉升試煉</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#59462b',
  },
  title: {
    color: '#c9a94f',
    fontSize: 13,
    fontWeight: '700',
  },
  maxedText: {
    color: '#8fd4a8',
    fontSize: 12,
  },
  reqLine: {
    color: '#8a8a95',
    fontSize: 11,
  },
  reqLineFail: {
    color: '#e08a8a',
  },
  button: {
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4a4456',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
