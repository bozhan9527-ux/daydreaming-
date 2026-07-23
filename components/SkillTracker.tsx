import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Archetype, JobTier } from '../game/combat';
import {
  ACTIVE_SLOT_IDS,
  ActiveSkillSlotId,
  activeSkillTriggerIntervalSeconds,
  effectiveSkillLevel,
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
  tier: JobTier;
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

function SkillTile({ tag, archetype, slot, label, level, tier, timerStartedAt, intervalSeconds, justTriggered, now }: SkillTileProps) {
  'use no memo';
  const icon = getSkillIcon(archetype, slot, tier);
  // 呼應參考UI設計圖「SKILL BUTTONS (STATES)」的四態:NORMAL(預設)/PRESSED(剛發動,
  // 用金色發光框強調)/COOLDOWN(倒數環本身就是這個狀態,不用額外樣式)/DISABLED(Lv.0
  // 還沒點過這個技能,整顆圖示淡化,跟「正在倒數中」的技能區分開)。全自動運作,冷卻好
  // 就直接在下次擊殺結算生效,不需要玩家點擊,所以這裡沒有「待命中/點我」這類手動狀態。
  // Lv.0 完全不參與倒數:不算 elapsed/progress,直接鎖在空環+固定文字,不會跟著時間跳動,
  // 也不會被誤認成「快好了、點一下就有反應」。
  const isDisabled = level <= 0;
  const intervalMs = intervalSeconds * 1000;
  const elapsedMs = isDisabled ? 0 : Math.max(0, Math.min(intervalMs, now - timerStartedAt));
  const progress = isDisabled ? 0 : intervalMs > 0 ? elapsedMs / intervalMs : 1;
  const secondsLeft = isDisabled ? 0 : Math.max(0, Math.ceil((intervalMs - elapsedMs) / 1000));

  const countdownLabel = isDisabled ? '未學會' : justTriggered ? '發動!' : `${secondsLeft}s`;

  return (
    <View style={styles.tileGroup}>
      <View style={styles.tileWrapper}>
        <CircularCountdown progress={isDisabled ? 0 : justTriggered ? 1 : progress} />
        <View style={[styles.tile, justTriggered && !isDisabled && styles.tileFlash, isDisabled && styles.tileDisabled]}>
          <View style={[styles.iconWrap, isDisabled && styles.iconDisabled]}>
            <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
          </View>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdownLabel}</Text>
          </View>
          {tag && (
            <View style={styles.kindTag}>
              <Text style={styles.kindTagText}>{tag}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.caption} numberOfLines={2}>
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
  const activeSkillLoadout = useGameState((state) => state.activeSkillLoadout);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const level = useGameState((state) => state.level);
  const jobTier = useGameState((state) => state.jobTier);
  const activeSkillTimers = useGameState((state) => state.activeSkillTimers);
  const studentActiveSkillTimers = useGameState((state) => state.studentActiveSkillTimers);
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
  // 圖示現在直接吃真正的職業階級(JobTier),不是技能等級——跟下面 SkillTile 顯示的
  // 「Lv.X」技能等級數字是兩件事,那個數字繼續吃 slotLevel,不受這裡影響。
  const tier = jobTier;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {ACTIVE_SLOT_IDS.map((slot: ActiveSkillSlotId) => {
          // 學生期(!hasChosenJob)還沒有主職,job.archetype 只是佔位值不代表真的職業——
          // 名稱/等級/倒數秒數改吃 studentSkillTree,圖示照樣借用 job.archetype 當視覺樣板即可。
          // 畢業後這4格改吃 activeSkillLoadout(見 game/skillTree.ts):每個位置各自指到「某個
          // 已投資過的職業技能」,不一定是目前職業自己的active1-4——空位(ref=null)一律當成
          // Lv.0處理,跟既有的「未學會」邏輯共用同一套顯示/防呆。
          const loadoutRef = hasChosenJob ? activeSkillLoadout[slot] : null;
          const tileArchetype = hasChosenJob ? (loadoutRef?.archetype ?? job.archetype) : job.archetype;
          const tileSourceSlot = hasChosenJob ? (loadoutRef?.sourceSlot ?? slot) : slot;
          const slotLevel = hasChosenJob
            ? loadoutRef
              ? effectiveSkillLevel(skillTree[loadoutRef.archetype], tier, loadoutRef.sourceSlot)
              : 0
            : studentSkillTree[slot];
          const label = hasChosenJob
            ? SKILL_SLOT_NAMES[tileArchetype][tileSourceSlot]
            : getStudentSkillFlavor(level.level, slot).name;
          return (
            <SkillTile
              key={slot}
              archetype={tileArchetype}
              slot={tileSourceSlot}
              label={label}
              level={slotLevel}
              tier={tier}
              timerStartedAt={hasChosenJob ? activeSkillTimers[slot] : studentActiveSkillTimers[slot]}
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
            level={effectiveSkillLevel(skillTree[secondaryJob], tier, 'active1')}
            tier={tier}
            timerStartedAt={secondarySkillTimerStartedAt}
            intervalSeconds={secondaryActiveSkillTriggerIntervalSeconds(effectiveSkillLevel(skillTree[secondaryJob], tier, 'active1'))}
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
    fontSize: 11,
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
  // PRESSED 態:金色發光框,呼應參考圖裡按下態圖示比平常更亮/更搶眼的處理。
  tileFlash: {
    backgroundColor: '#4a4456',
    shadowColor: '#d6a23a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  // DISABLED 態:整顆淡化,區分「還沒點過這個技能」跟「技能倒數中」。
  tileDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    opacity: 0.6,
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
    fontSize: 11,
    textAlign: 'center',
  },
});
