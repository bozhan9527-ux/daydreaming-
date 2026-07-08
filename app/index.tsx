import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeroSprite } from '../components/HeroSprite';
import { JobSelector } from '../components/JobSelector';
import { GameEvent } from '../game/events';
import { expToNext, MAX_LEVEL } from '../game/leveling';
import { Rarity } from '../game/trigger';
import { useGameState } from '../hooks/useGameState';

const RARITY_LABEL: Record<Rarity, string> = {
  common: '一般反應',
  rare: '稀有畫面',
  epic: '超稀有彩蛋',
  legendary: '傳說事件',
};

export default function HomeScreen() {
  const isLoaded = useGameState((state) => state.isLoaded);
  const level = useGameState((state) => state.level);
  const levelUp = useGameState((state) => state.levelUp);
  const click = useGameState((state) => state.click);
  const lastOfflineGain = useGameState((state) => state.lastOfflineGain);

  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>載入中...</Text>
      </View>
    );
  }

  const isMaxLevel = level.level >= MAX_LEVEL;
  const needed = isMaxLevel ? 0 : expToNext(level.level);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>勇者發呆中</Text>

      {lastOfflineGain > 0 && <Text style={styles.offlineGainText}>離線期間獲得 {lastOfflineGain} 經驗值</Text>}

      <Pressable onPress={() => setLastEvent(click())}>
        <HeroSprite pixelSize={5} />
      </Pressable>

      {lastEvent !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultRarity}>{RARITY_LABEL[lastEvent.rarity]}</Text>
          <Text style={styles.resultText}>{lastEvent.payload}</Text>
        </View>
      )}

      <View style={styles.statsBox}>
        <Text style={styles.statsText}>Lv.{level.level}</Text>
        <Text style={styles.statsText}>{isMaxLevel ? '已封頂' : `${level.bankedExp} / ${needed}`}</Text>
      </View>

      <JobSelector />

      <View style={styles.levelUpRow}>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(1)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 1 級</Text>
        </Pressable>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(5)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 5 級</Text>
        </Pressable>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(10)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 10 級</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f14',
    gap: 24,
  },
  title: {
    fontSize: 20,
    color: '#f2f2f2',
  },
  offlineGainText: {
    color: '#c9a94f',
    fontSize: 13,
  },
  resultBox: {
    maxWidth: 280,
    alignItems: 'center',
    gap: 4,
  },
  resultRarity: {
    color: '#8a8a95',
    fontSize: 12,
  },
  resultText: {
    color: '#f2f2f2',
    fontSize: 14,
    textAlign: 'center',
  },
  statsBox: {
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    color: '#f2f2f2',
    fontSize: 16,
  },
  levelUpRow: {
    flexDirection: 'row',
    gap: 12,
  },
  levelUpButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
  },
  levelUpLabel: {
    color: '#f2f2f2',
  },
});
