import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Archetype, getCurrentTier, JobTier } from '../game/combat';
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
import { AUTO_SKILLS_UNLOCK_LEVEL, useGameState } from '../hooks/useGameState';
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
  // Lv60 且 AUTO 開啟時是全自動(冷卻好就發動,行為跟改版前一樣);否則冷卻好只代表「可以點了」,
  // 要玩家自己點一下(armed 記到,等下次擊殺結算才真的生效)。
  autoMode: boolean;
  armed: boolean;
  onPress?: () => void;
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

function SkillTile({
  tag,
  archetype,
  slot,
  label,
  level,
  tier,
  timerStartedAt,
  intervalSeconds,
  justTriggered,
  now,
  autoMode,
  armed,
  onPress,
}: SkillTileProps) {
  'use no memo';
  const icon = getSkillIcon(archetype, slot, tier);
  // 呼應參考UI設計圖「SKILL BUTTONS (STATES)」的四態:NORMAL(預設)/PRESSED(剛發動,
  // 用金色發光框強調)/COOLDOWN(倒數環本身就是這個狀態,不用額外樣式)/DISABLED(Lv.0
  // 還沒點過這個技能,整顆圖示淡化,跟「正在倒數中」的技能區分開)。
  // Lv.0 完全不參與倒數:不算 elapsed/progress,直接鎖在空環+固定文字,不會跟著時間跳動,
  // 也不會被誤認成「快好了、點一下就有反應」。
  const isDisabled = level <= 0;
  const intervalMs = intervalSeconds * 1000;
  const elapsedMs = isDisabled ? 0 : Math.max(0, Math.min(intervalMs, now - timerStartedAt));
  const progress = isDisabled ? 0 : intervalMs > 0 ? elapsedMs / intervalMs : 1;
  const secondsLeft = isDisabled ? 0 : Math.max(0, Math.ceil((intervalMs - elapsedMs) / 1000));
  const ready = !isDisabled && secondsLeft <= 0;
  // 手動模式下冷卻好但還沒點過:用藍色發光提示「可以點了」——藍色是全站統一的「互動中/
  // 可操作」訊號色(跟裝備分頁選取插槽同一套語言,見 EquipmentPanel.tsx 的說明),金色專門
  // 留給 PRESSED 態那種「已經觸發」的慶祝感,兩者不共用同一個顏色才分得清楚差異。
  const readyToTap = !autoMode && ready && !armed && !isDisabled && !justTriggered;

  let countdownLabel: string;
  if (isDisabled) countdownLabel = '未學會';
  else if (justTriggered) countdownLabel = '發動!';
  else if (!autoMode && ready && armed) countdownLabel = '待命中';
  else if (!autoMode && ready) countdownLabel = '點我!';
  else countdownLabel = `${secondsLeft}s`;

  return (
    <View style={styles.tileGroup}>
      <Pressable style={styles.tileWrapper} onPress={onPress} disabled={!onPress}>
        <CircularCountdown progress={isDisabled ? 0 : justTriggered ? 1 : progress} />
        <View
          style={[
            styles.tile,
            justTriggered && !isDisabled && styles.tileFlash,
            isDisabled && styles.tileDisabled,
            readyToTap && styles.tileReadyToTap,
          ]}
        >
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
      </Pressable>
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
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const level = useGameState((state) => state.level);
  const activeSkillTimers = useGameState((state) => state.activeSkillTimers);
  const studentActiveSkillTimers = useGameState((state) => state.studentActiveSkillTimers);
  const secondarySkillTimerStartedAt = useGameState((state) => state.secondarySkillTimerStartedAt);
  const lastSkillTriggerAt = useGameState((state) => state.lastSkillTriggerAt);
  const lastSecondarySkillTriggerAt = useGameState((state) => state.lastSecondarySkillTriggerAt);
  const armedActiveSkills = useGameState((state) => state.armedActiveSkills);
  const armedStudentActiveSkills = useGameState((state) => state.armedStudentActiveSkills);
  const armedSecondarySkill = useGameState((state) => state.armedSecondarySkill);
  const autoSkillsEnabled = useGameState((state) => state.autoSkillsEnabled);
  const armSkill = useGameState((state) => state.armSkill);
  const armSecondarySkill = useGameState((state) => state.armSecondarySkill);
  const toggleAutoSkills = useGameState((state) => state.toggleAutoSkills);

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
  const tier = getCurrentTier(level.level);
  const autoUnlocked = level.level >= AUTO_SKILLS_UNLOCK_LEVEL;
  const autoMode = autoUnlocked && autoSkillsEnabled;

  return (
    <View style={styles.wrapper}>
      {/* AUTO 開關:Lv60 前技能不會自動觸發,冷卻好要玩家自己點技能圖示才算數(SkillTile 的
          onPress 接 armSkill/armSecondarySkill)。滿 Lv60 才解鎖這顆開關,關掉的話即使 Lv60+
          也會維持手動模式,方便玩家自己選要不要保留手動點擊的節奏感。 */}
      {autoUnlocked ? (
        <Pressable style={[styles.autoButton, autoSkillsEnabled && styles.autoButtonActive]} onPress={toggleAutoSkills}>
          <Text style={styles.autoButtonLabel}>AUTO {autoSkillsEnabled ? '開' : '關'}</Text>
        </Pressable>
      ) : (
        <Text style={styles.autoHint}>Lv{AUTO_SKILLS_UNLOCK_LEVEL} 解鎖自動戰鬥,之前技能冷卻好要自己點擊發動</Text>
      )}
      <View style={styles.container}>
        {ACTIVE_SLOT_IDS.map((slot: ActiveSkillSlotId) => {
          // 學生期(!hasChosenJob)還沒有主職,job.archetype 只是佔位值不代表真的職業——
          // 名稱/等級/倒數秒數改吃 studentSkillTree,圖示照樣借用 job.archetype 當視覺樣板即可。
          const slotLevel = hasChosenJob ? skillTree[job.archetype][slot] : studentSkillTree[slot];
          const label = hasChosenJob ? SKILL_SLOT_NAMES[job.archetype][slot] : getStudentSkillFlavor(level.level, slot).name;
          const armed = hasChosenJob ? armedActiveSkills[slot] === true : armedStudentActiveSkills[slot] === true;
          return (
            <SkillTile
              key={slot}
              archetype={job.archetype}
              slot={slot}
              label={label}
              level={slotLevel}
              tier={tier}
              timerStartedAt={hasChosenJob ? activeSkillTimers[slot] : studentActiveSkillTimers[slot]}
              intervalSeconds={activeSkillTriggerIntervalSeconds(slot, slotLevel)}
              justTriggered={primaryJustTriggered}
              now={now}
              autoMode={autoMode}
              armed={armed}
              onPress={autoMode || slotLevel <= 0 ? undefined : () => armSkill(hasChosenJob ? 'job' : 'student', slot)}
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
            tier={tier}
            timerStartedAt={secondarySkillTimerStartedAt}
            intervalSeconds={secondaryActiveSkillTriggerIntervalSeconds(skillTree[secondaryJob].active1)}
            justTriggered={secondaryJustTriggered}
            now={now}
            autoMode={autoMode}
            armed={armedSecondarySkill}
            onPress={autoMode || skillTree[secondaryJob].active1 <= 0 ? undefined : armSecondarySkill}
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
  autoButton: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#59462b',
  },
  // AUTO 開啟中用藍色(互動中訊號色,跟全站選取態同一套語言)標示,不用金色——金色留給裝飾外框。
  autoButtonActive: {
    backgroundColor: '#274357',
    borderColor: '#6ab0e0',
  },
  autoButtonLabel: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '700',
  },
  autoHint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
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
  // 手動模式下冷卻好、還沒點過:藍色發光提示「可以點了」(互動中訊號色,見上面 autoButtonActive
  // 同一套邏輯的說明)。
  tileReadyToTap: {
    shadowColor: '#6ab0e0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
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
