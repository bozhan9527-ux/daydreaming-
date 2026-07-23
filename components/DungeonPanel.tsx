import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import {
  availableGemDungeonTypes,
  DUNGEON_ARCHETYPES,
  DUNGEON_TAB_LABELS,
  DUNGEON_TABS,
  DUNGEON_TICKET_CAP,
  DungeonTab,
  dungeonCoinDropAmount,
  dungeonExpDropAmount,
  ENHANCE_STONE_DUNGEON_REWARD_AMOUNT,
  GEM_DUNGEON_REWARD_AMOUNT,
  msUntilNextDungeonTicket,
  SKILL_BOOK_DUNGEON_REWARD_AMOUNT,
  unlockedSkillBookDungeonTiers,
} from '../game/dungeon';
import { GEM_SPECS, GemType } from '../game/equipment';
import { MATERIAL_TIER_LABELS, MaterialTier } from '../game/materials';
import { TRANSFER_FRAGMENT_NAMES, TRANSFER_FRAGMENTS_PER_PROOF, TRANSFER_PROOF_NAMES } from '../game/transfer';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

const TICKET_CLOCK_TICK_MS = 1000;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 六分頁副本(見 game/dungeon.ts 的 DUNGEON_TABS):職業試煉之外,技能書/強化石/鑲嵌石/經驗/
// 金錢各自獨立一頁,全部共用同一組入場券池,只是分頁瀏覽,不是分開計票。
export function DungeonPanel() {
  // 入場券倒數要即時讀 Date.now(),跟 HeroHealthBar.tsx/SkillTracker.tsx 同一個坑——
  // 這個 component 要跳出 React Compiler 的自動記憶化,不然倒數會凍結在第一次渲染的結果。
  'use no memo';

  const dungeon = useGameState((state) => state.dungeon);
  const level = useGameState((state) => state.level);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const jobTier = useGameState((state) => state.jobTier);
  const transferFragments = useGameState((state) => state.transferFragments);
  const transferProofs = useGameState((state) => state.transferProofs);
  const challengeDungeon = useGameState((state) => state.challengeDungeon);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const skillBooks = useGameState((state) => state.skillBooks);
  const gemCounts = useGameState((state) => state.gemCounts);
  const challengeSkillBookDungeon = useGameState((state) => state.challengeSkillBookDungeon);
  const challengeEnhanceStoneDungeon = useGameState((state) => state.challengeEnhanceStoneDungeon);
  const challengeGemDungeon = useGameState((state) => state.challengeGemDungeon);
  const challengeExpDungeon = useGameState((state) => state.challengeExpDungeon);
  const challengeCoinDungeon = useGameState((state) => state.challengeCoinDungeon);
  const showToast = useToast((state) => state.show);

  const [activeTab, setActiveTab] = useState<DungeonTab>('job');

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), TICKET_CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const msUntilNext = msUntilNextDungeonTicket(dungeon);
  const canChallenge = dungeon.tickets > 0;

  const handleChallenge = (archetype: Archetype) => {
    // 用「碎片+證明*10」的合計判定輸贏,不能只比碎片數本身——湊滿10片會自動兌換成1個證明、
    // 碎片歸零重算,單看碎片數在「贏但剛好湊滿」那次會誤判成輸(見 game/transfer.ts 的
    // applyTransferFragmentGain)。這個合計只有打贏才會 +1,是可靠的輸贏判定依據。
    const beforeTotal = (transferFragments[archetype] ?? 0) + (transferProofs[archetype] ?? 0) * TRANSFER_FRAGMENTS_PER_PROOF;
    challengeDungeon(archetype);
    const after = useGameState.getState();
    const afterTotal =
      (after.transferFragments[archetype] ?? 0) + (after.transferProofs[archetype] ?? 0) * TRANSFER_FRAGMENTS_PER_PROOF;
    if (afterTotal > beforeTotal) {
      showToast(`打贏${ARCHETYPE_LABELS[archetype]}試煉!獲得一片${TRANSFER_FRAGMENT_NAMES[archetype]}`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const handleSkillBookChallenge = (tier: MaterialTier) => {
    const before = skillBooks[tier];
    challengeSkillBookDungeon(tier);
    const after = useGameState.getState().skillBooks[tier];
    if (after > before) {
      showToast(`打贏${MATERIAL_TIER_LABELS[tier]}技能書副本!獲得 ${SKILL_BOOK_DUNGEON_REWARD_AMOUNT} 本${MATERIAL_TIER_LABELS[tier]}技能書`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const handleEnhanceStoneChallenge = () => {
    const before = enhanceStones[0];
    challengeEnhanceStoneDungeon();
    const after = useGameState.getState().enhanceStones[0];
    if (after > before) {
      showToast(`打贏強化石副本!獲得 ${ENHANCE_STONE_DUNGEON_REWARD_AMOUNT} 個初階強化石`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const handleGemChallenge = (gemType: GemType) => {
    const before = gemCounts[gemType][0];
    challengeGemDungeon(gemType);
    const after = useGameState.getState().gemCounts[gemType][0];
    if (after > before) {
      showToast(`打贏鑲嵌石副本!獲得 ${GEM_DUNGEON_REWARD_AMOUNT} 個${GEM_SPECS[gemType].name}`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const handleExpChallenge = () => {
    const before = level.bankedExp;
    challengeExpDungeon();
    const after = useGameState.getState().level.bankedExp;
    if (after > before || useGameState.getState().level.level > level.level) {
      showToast(`打贏經驗副本!獲得 ${dungeonExpDropAmount(level.level)} 經驗`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const handleCoinChallenge = () => {
    const before = useGameState.getState().coins;
    challengeCoinDungeon();
    const after = useGameState.getState().coins;
    if (after > before) {
      showToast(`打贏金錢副本!獲得 ${dungeonCoinDropAmount(level.level)} 金幣`);
    } else {
      showToast('試煉失敗,勇者暫時撤退');
    }
  };

  const unlockedTiers = unlockedSkillBookDungeonTiers(hasChosenJob, jobTier);
  const todayGemTypes = availableGemDungeonTypes(new Date().getDay());

  return (
    <View style={styles.container}>
      <View style={styles.ticketRow}>
        <Text style={styles.ticketLabel}>入場券</Text>
        <Text style={styles.ticketValue}>
          {dungeon.tickets}/{DUNGEON_TICKET_CAP}
        </Text>
        {msUntilNext !== null && <Text style={styles.ticketCountdown}>下一張 {formatCountdown(msUntilNext)}</Text>}
      </View>

      <View style={styles.tabRow}>
        {DUNGEON_TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabLabel} numberOfLines={1}>
              {DUNGEON_TAB_LABELS[tab]}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'job' &&
        DUNGEON_ARCHETYPES.map((archetype) => {
          const fragmentCount = transferFragments[archetype] ?? 0;
          const proofCount = transferProofs[archetype] ?? 0;
          return (
            <View key={archetype} style={styles.card}>
              <Text style={styles.cardTitle}>{ARCHETYPE_LABELS[archetype]}試煉</Text>
              <Text style={styles.cardProgress}>
                {TRANSFER_FRAGMENT_NAMES[archetype]} {fragmentCount}/{TRANSFER_FRAGMENTS_PER_PROOF}｜{TRANSFER_PROOF_NAMES[archetype]} x
                {proofCount}
              </Text>
              <Pressable
                style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
                onPress={() => handleChallenge(archetype)}
                disabled={!canChallenge}
              >
                <Text style={styles.challengeLabel}>挑戰</Text>
              </Pressable>
            </View>
          );
        })}

      {activeTab === 'skillBook' &&
        unlockedTiers.map((tier) => (
          <View key={tier} style={styles.card}>
            <Text style={styles.cardTitle}>{MATERIAL_TIER_LABELS[tier]}技能書副本</Text>
            <Text style={styles.cardProgress}>
              打贏保證掉落 {SKILL_BOOK_DUNGEON_REWARD_AMOUNT} 本{MATERIAL_TIER_LABELS[tier]}技能書(持有 {skillBooks[tier]} 本)
            </Text>
            <Pressable
              style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
              onPress={() => handleSkillBookChallenge(tier)}
              disabled={!canChallenge}
            >
              <Text style={styles.challengeLabel}>挑戰</Text>
            </Pressable>
          </View>
        ))}

      {activeTab === 'enhanceStone' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>強化石副本</Text>
          <Text style={styles.cardProgress}>
            打贏保證掉落 {ENHANCE_STONE_DUNGEON_REWARD_AMOUNT} 個初階強化石(持有 {enhanceStones[0]} 個)
          </Text>
          <Pressable
            style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
            onPress={handleEnhanceStoneChallenge}
            disabled={!canChallenge}
          >
            <Text style={styles.challengeLabel}>挑戰</Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'gem' &&
        todayGemTypes.map((gemType) => (
          <View key={gemType} style={styles.card}>
            <Text style={styles.cardTitle}>{GEM_SPECS[gemType].name}副本</Text>
            <Text style={styles.cardProgress}>
              打贏保證掉落 {GEM_DUNGEON_REWARD_AMOUNT} 個初階{GEM_SPECS[gemType].name}(持有 {gemCounts[gemType][0]} 個)
            </Text>
            <Pressable
              style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
              onPress={() => handleGemChallenge(gemType)}
              disabled={!canChallenge}
            >
              <Text style={styles.challengeLabel}>挑戰</Text>
            </Pressable>
          </View>
        ))}

      {activeTab === 'exp' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>經驗副本</Text>
          <Text style={styles.cardProgress}>打贏保證獲得 {dungeonExpDropAmount(level.level)} 經驗</Text>
          <Pressable
            style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
            onPress={handleExpChallenge}
            disabled={!canChallenge}
          >
            <Text style={styles.challengeLabel}>挑戰</Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'coin' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>金錢副本</Text>
          <Text style={styles.cardProgress}>打贏保證獲得 {dungeonCoinDropAmount(level.level)} 金幣</Text>
          <Pressable
            style={[styles.challengeButton, !canChallenge && styles.challengeButtonDisabled]}
            onPress={handleCoinChallenge}
            disabled={!canChallenge}
          >
            <Text style={styles.challengeLabel}>挑戰</Text>
          </Pressable>
        </View>
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
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1c24',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 6,
  },
  ticketLabel: {
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '700',
  },
  ticketValue: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  ticketCountdown: {
    color: '#8a8a95',
    fontSize: 11,
  },
  // 固定寬度3欄網格:6個分頁不管文字長短都排成整齊的2排,呼應 EquipmentPanel.tsx
  // 部位篩選列的同一種排版邏輯。
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tabButton: {
    width: 88,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#4a4456',
  },
  tabLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  card: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  cardProgress: {
    color: '#8a8a95',
    fontSize: 11,
  },
  challengeButton: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4a4456',
    alignItems: 'center',
  },
  challengeButtonDisabled: {
    opacity: 0.4,
  },
  challengeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
