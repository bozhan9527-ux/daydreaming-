import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import {
  ACTIVE_SLOT_IDS,
  ActiveSkillSlotId,
  activeSkillTriggerIntervalSeconds,
  secondaryActiveSkillTriggerIntervalSeconds,
  SKILL_SLOT_NAMES,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const FLASH_WINDOW_MS = 900;
const TILE_SIZE = 52;
const BORDER_THICKNESS = 3;
const CLOCK_TICK_MS = 250;

interface SkillTileProps {
  tag?: string;
  archetype: Archetype;
  label: string;
  level: number;
  timerStartedAt: number;
  intervalSeconds: number;
  justTriggered: boolean;
  now: number;
}

// 外框倒數:4 段從左上角開始順時針填滿(上→右→下→左),progress 0 表示剛觸發、1 表示即將發動。
function BorderCountdown({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const segment = Math.min(3, Math.floor(clamped * 4));
  const segmentProgress = Math.min(1, clamped * 4 - segment);

  const topPct = segment > 0 ? 100 : segmentProgress * 100;
  const rightPct = segment > 1 ? 100 : segment === 1 ? segmentProgress * 100 : 0;
  const bottomPct = segment > 2 ? 100 : segment === 2 ? segmentProgress * 100 : 0;
  const leftPct = segment === 3 ? segmentProgress * 100 : segment > 3 ? 100 : 0;

  return (
    <>
      <View style={[styles.borderTop, { width: `${topPct}%` }]} />
      <View style={[styles.borderRight, { height: `${rightPct}%` }]} />
      <View style={[styles.borderBottom, { width: `${bottomPct}%` }]} />
      <View style={[styles.borderLeft, { height: `${leftPct}%` }]} />
    </>
  );
}

function SkillTile({ tag, archetype, label, level, timerStartedAt, intervalSeconds, justTriggered, now }: SkillTileProps) {
  'use no memo';
  const icon = getSkillIcon(archetype);
  const intervalMs = intervalSeconds * 1000;
  const elapsedMs = Math.max(0, Math.min(intervalMs, now - timerStartedAt));
  const progress = intervalMs > 0 ? elapsedMs / intervalMs : 1;
  const secondsLeft = Math.max(0, Math.ceil((intervalMs - elapsedMs) / 1000));

  return (
    <View style={styles.tileGroup}>
      <View style={styles.tileWrapper}>
        <BorderCountdown progress={justTriggered ? 1 : progress} />
        <View style={[styles.tile, justTriggered && styles.tileFlash]}>
          <View style={styles.iconWrap}>
            <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
          </View>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{justTriggered ? '發動!' : `${secondsLeft}s`}</Text>
          </View>
          {tag && (
            <View style={styles.kindTag}>
              <Text style={styles.kindTagText}>{tag}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.caption} numberOfLines={1}>
        {label} Lv.{level}
      </Text>
    </View>
  );
}

export function SkillTracker() {
  // 讀 Date.now() 這種 impure 值畫即時倒數,React Compiler 的自動記憶化看不出來要跟著
  // forceTick 重算,會把整棵JSX樹凍結在第一次渲染的結果,所以整個 component 選擇跳出編譯優化。
  'use no memo';

  const job = useGameState((state) => state.job);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skillTree = useGameState((state) => state.skillTree);
  const activeSkillTimers = useGameState((state) => state.activeSkillTimers);
  const secondarySkillTimerStartedAt = useGameState((state) => state.secondarySkillTimerStartedAt);
  const lastSkillTriggerAt = useGameState((state) => state.lastSkillTriggerAt);
  const lastSecondarySkillTriggerAt = useGameState((state) => state.lastSecondarySkillTriggerAt);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const primaryJustTriggered = lastSkillTriggerAt !== null && now - lastSkillTriggerAt < FLASH_WINDOW_MS;
  const secondaryJustTriggered = lastSecondarySkillTriggerAt !== null && now - lastSecondarySkillTriggerAt < FLASH_WINDOW_MS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {ACTIVE_SLOT_IDS.map((slot: ActiveSkillSlotId) => (
          <SkillTile
            key={slot}
            archetype={job.archetype}
            label={SKILL_SLOT_NAMES[job.archetype][slot]}
            level={skillTree[job.archetype][slot]}
            timerStartedAt={activeSkillTimers[slot]}
            intervalSeconds={activeSkillTriggerIntervalSeconds(skillTree[job.archetype][slot])}
            justTriggered={primaryJustTriggered}
            now={now}
          />
        ))}
      </View>
      {/* 副職輔助技能獨立一排、有自己的標籤,不跟主職的4顆混在同一排自動換行——
          4顆主動剛好能塞滿一行,加上第5顆會在窄螢幕上擠成3+2或4+1,版面亂掉。 */}
      {secondaryJob && (
        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryLabel}>副職輔助</Text>
          <SkillTile
            tag="副職"
            archetype={secondaryJob}
            label={SKILL_SLOT_NAMES[secondaryJob].active1}
            level={skillTree[secondaryJob].active1}
            timerStartedAt={secondarySkillTimerStartedAt}
            intervalSeconds={secondaryActiveSkillTriggerIntervalSeconds(skillTree[secondaryJob].active1)}
            justTriggered={secondaryJustTriggered}
            now={now}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryLabel: {
    color: '#8a8a95',
    fontSize: 10,
  },
  tileGroup: {
    alignItems: 'center',
    gap: 4,
    width: TILE_SIZE + BORDER_THICKNESS * 2 + 8,
  },
  tileWrapper: {
    width: TILE_SIZE + BORDER_THICKNESS * 2,
    height: TILE_SIZE + BORDER_THICKNESS * 2,
    position: 'relative',
    borderWidth: BORDER_THICKNESS,
    borderColor: '#3a3a45',
    borderRadius: 12,
    alignSelf: 'center',
  },
  tile: {
    position: 'absolute',
    top: BORDER_THICKNESS,
    left: BORDER_THICKNESS,
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileFlash: {
    backgroundColor: '#4a4456',
  },
  // 外框倒數:4 段從左上角開始順時針填滿,金色段位越長代表離發動越近,比純數字/內部遮罩更一眼看出進度。
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: BORDER_THICKNESS,
    backgroundColor: '#c9a94f',
  },
  borderRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: BORDER_THICKNESS,
    backgroundColor: '#c9a94f',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: BORDER_THICKNESS,
    backgroundColor: '#c9a94f',
  },
  borderLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: BORDER_THICKNESS,
    backgroundColor: '#c9a94f',
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  countdownText: {
    color: '#f2f2f2',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  kindTag: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  kindTagText: {
    color: '#c9a94f',
    fontSize: 8,
    fontWeight: '600',
  },
  caption: {
    color: '#f2f2f2',
    fontSize: 9,
    textAlign: 'center',
  },
});
