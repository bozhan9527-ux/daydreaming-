import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import { secondarySkillTriggerIntervalSeconds, SKILL_LABELS, skillTriggerIntervalSeconds } from '../game/skills';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const FLASH_WINDOW_MS = 900;
const TILE_SIZE = 60;
const BORDER_THICKNESS = 3;
const CLOCK_TICK_MS = 250;

interface SkillTileProps {
  kind: '主動' | '被動';
  archetype: Archetype;
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

function SkillTile({ kind, archetype, level, timerStartedAt, intervalSeconds, justTriggered, now }: SkillTileProps) {
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
            <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={4} />
          </View>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{justTriggered ? '發動!' : `${secondsLeft}s`}</Text>
          </View>
          <View style={styles.kindTag}>
            <Text style={styles.kindTagText}>{kind}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.caption} numberOfLines={1}>
        {SKILL_LABELS[archetype]} Lv.{level}
      </Text>
    </View>
  );
}

export function SkillTracker() {
  // 這個 component 讀 Date.now() 這種 impure 值來畫即時倒數,React Compiler 的自動記憶化
  // 看不出來要在 forceTick 變動時重算(forceTick 的值本身沒被用在畫面上,只是拿來逼重新渲染),
  // 結果會把整棵JSX樹凍結在第一次渲染的結果、秒數/外框永遠不動,所以整個 component 選擇跳出編譯優化。
  'use no memo';

  const job = useGameState((state) => state.job);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skills = useGameState((state) => state.skills);
  const skillTimerStartedAt = useGameState((state) => state.skillTimerStartedAt);
  const secondarySkillTimerStartedAt = useGameState((state) => state.secondarySkillTimerStartedAt);
  const lastSkillTriggerAt = useGameState((state) => state.lastSkillTriggerAt);
  const lastSecondarySkillTriggerAt = useGameState((state) => state.lastSecondarySkillTriggerAt);

  // Date.now() 是 impure read,單純寫在render裡不保證每次重新渲染都被判定為「有變化」
  // (React Compiler 可能依 props/state 依賴判斷跳過重算),所以用自己的計時器強制每 250ms
  // 重新渲染一次,秒數倒數/外框進度才會確實跳動,不依賴其他欄位剛好同時變動。
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const primaryJustTriggered = lastSkillTriggerAt !== null && now - lastSkillTriggerAt < FLASH_WINDOW_MS;
  const secondaryJustTriggered = lastSecondarySkillTriggerAt !== null && now - lastSecondarySkillTriggerAt < FLASH_WINDOW_MS;

  return (
    <View style={styles.container}>
      <SkillTile
        kind="主動"
        archetype={job.archetype}
        level={skills[job.archetype]}
        timerStartedAt={skillTimerStartedAt}
        intervalSeconds={skillTriggerIntervalSeconds(skills[job.archetype])}
        justTriggered={primaryJustTriggered}
        now={now}
      />
      {secondaryJob && (
        <SkillTile
          kind="被動"
          archetype={secondaryJob}
          level={skills[secondaryJob]}
          timerStartedAt={secondarySkillTimerStartedAt}
          intervalSeconds={secondarySkillTriggerIntervalSeconds(skills[secondaryJob])}
          justTriggered={secondaryJustTriggered}
          now={now}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  tileGroup: {
    alignItems: 'center',
    gap: 4,
  },
  tileWrapper: {
    width: TILE_SIZE + BORDER_THICKNESS * 2,
    height: TILE_SIZE + BORDER_THICKNESS * 2,
    position: 'relative',
    borderWidth: BORDER_THICKNESS,
    borderColor: '#3a3a45',
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
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
    fontSize: 10,
    maxWidth: TILE_SIZE + 20,
    textAlign: 'center',
  },
});
