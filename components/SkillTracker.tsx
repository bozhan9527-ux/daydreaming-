import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Archetype } from '../game/combat';
import {
  ACTIVE_SLOT_IDS,
  ActiveSkillSlotId,
  activeSkillTriggerIntervalSeconds,
  secondaryActiveSkillTriggerIntervalSeconds,
  SKILL_SLOT_NAMES,
  SkillSlotId,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { getStudentSkillFlavor } from '../game/studentSkillTree';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const FLASH_WINDOW_MS = 900;
const TILE_SIZE = 52;
const BORDER_THICKNESS = 3;
const CLOCK_TICK_MS = 250;

interface SkillTileProps {
  tag?: string;
  archetype: Archetype;
  slot: SkillSlotId;
  label: string;
  level: number;
  timerStartedAt: number;
  intervalSeconds: number;
  justTriggered: boolean;
  now: number;
}

const RING_SIZE = TILE_SIZE + BORDER_THICKNESS * 2;
const RING_RADIUS = (RING_SIZE - BORDER_THICKNESS) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// 圓形倒數環:繞著技能圖示轉一圈,progress 0 表示剛觸發(環是空的)、1 表示即將發動(環滿了)。
// 用 react-native-svg 畫真正的圓弧,不是之前那種「4段矩形邊框裁成圓角」的近似做法。
// 從12點鐘方向(-90度)順時針掃描,呼應原本邊框倒數的方向感。
function CircularCountdown({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped);

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="#3a3a45"
        strokeWidth={BORDER_THICKNESS}
        fill="none"
      />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="#c9a94f"
        strokeWidth={BORDER_THICKNESS}
        strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        fill="none"
        // 用原生 SVG transform 字串轉 -90 度(12點鐘方向起算),不用 rotation/originX/originY
        // 那組 react-native-svg 專屬 prop——在 react-native-web 上會被轉譯成不合法的 DOM
        // 屬性(transform-XXX),跳出開發模式警告框。原生 SVG transform 屬性所有平台都吃。
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </Svg>
  );
}

function SkillTile({ tag, archetype, slot, label, level, timerStartedAt, intervalSeconds, justTriggered, now }: SkillTileProps) {
  'use no memo';
  const icon = getSkillIcon(archetype, slot, level);
  const intervalMs = intervalSeconds * 1000;
  const elapsedMs = Math.max(0, Math.min(intervalMs, now - timerStartedAt));
  const progress = intervalMs > 0 ? elapsedMs / intervalMs : 1;
  const secondsLeft = Math.max(0, Math.ceil((intervalMs - elapsedMs) / 1000));

  return (
    <View style={styles.tileGroup}>
      <View style={styles.tileWrapper}>
        <CircularCountdown progress={justTriggered ? 1 : progress} />
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

  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const job = useGameState((state) => state.job);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skillTree = useGameState((state) => state.skillTree);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const level = useGameState((state) => state.level);
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
        {ACTIVE_SLOT_IDS.map((slot: ActiveSkillSlotId) => {
          // 學生期(!hasChosenJob)還沒有主職,job.archetype 只是佔位值不代表真的職業——
          // 名稱/等級/倒數秒數改吃 studentSkillTree,圖示照樣借用 job.archetype 當視覺樣板即可。
          const slotLevel = hasChosenJob ? skillTree[job.archetype][slot] : studentSkillTree[slot];
          const label = hasChosenJob ? SKILL_SLOT_NAMES[job.archetype][slot] : getStudentSkillFlavor(level.level, slot).name;
          return (
            <SkillTile
              key={slot}
              archetype={job.archetype}
              slot={slot}
              label={label}
              level={slotLevel}
              timerStartedAt={activeSkillTimers[slot]}
              intervalSeconds={activeSkillTriggerIntervalSeconds(slot, slotLevel)}
              justTriggered={primaryJustTriggered}
              now={now}
            />
          );
        })}
      </View>
      {/* 副職輔助技能獨立一排、有自己的標籤,不跟主職的4顆混在同一排自動換行——
          4顆主動剛好能塞滿一行,加上第5顆會在窄螢幕上擠成3+2或4+1,版面亂掉。 */}
      {secondaryJob && (
        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryLabel}>副職輔助</Text>
          <SkillTile
            tag="副職"
            archetype={secondaryJob}
            slot="active1"
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
  // 圓形圖示,呼應手遊常見的技能圓餅樣式;倒數環改用 react-native-svg 畫真正的圓弧
  // (見 CircularCountdown),wrapper 不再需要 borderWidth/overflow hidden 那套裁切技巧。
  tileWrapper: {
    width: TILE_SIZE + BORDER_THICKNESS * 2,
    height: TILE_SIZE + BORDER_THICKNESS * 2,
    position: 'relative',
    alignSelf: 'center',
  },
  ringSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tile: {
    position: 'absolute',
    top: BORDER_THICKNESS,
    left: BORDER_THICKNESS,
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: TILE_SIZE / 2,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileFlash: {
    backgroundColor: '#4a4456',
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
