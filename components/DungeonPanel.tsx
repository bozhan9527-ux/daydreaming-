import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import { DUNGEON_ARCHETYPES, DUNGEON_TICKET_CAP, msUntilNextDungeonTicket } from '../game/dungeon';
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

export function DungeonPanel() {
  // 入場券倒數要即時讀 Date.now(),跟 HeroHealthBar.tsx/SkillTracker.tsx 同一個坑——
  // 這個 component 要跳出 React Compiler 的自動記憶化,不然倒數會凍結在第一次渲染的結果。
  'use no memo';

  const dungeon = useGameState((state) => state.dungeon);
  const transferFragments = useGameState((state) => state.transferFragments);
  const transferProofs = useGameState((state) => state.transferProofs);
  const challengeDungeon = useGameState((state) => state.challengeDungeon);
  const showToast = useToast((state) => state.show);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), TICKET_CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const msUntilNext = msUntilNextDungeonTicket(dungeon);

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

  return (
    <View style={styles.container}>
      <View style={styles.ticketRow}>
        <Text style={styles.ticketLabel}>入場券</Text>
        <Text style={styles.ticketValue}>
          {dungeon.tickets}/{DUNGEON_TICKET_CAP}
        </Text>
        {msUntilNext !== null && <Text style={styles.ticketCountdown}>下一張 {formatCountdown(msUntilNext)}</Text>}
      </View>

      {DUNGEON_ARCHETYPES.map((archetype) => {
        const fragmentCount = transferFragments[archetype] ?? 0;
        const proofCount = transferProofs[archetype] ?? 0;
        const canChallenge = dungeon.tickets > 0;
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
