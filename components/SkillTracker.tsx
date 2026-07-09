import { StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import { secondarySkillTriggerInterval, SKILL_LABELS, skillTriggerInterval } from '../game/skills';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

// 剛觸發的技能徽章要閃光幾毫秒,配合 useBattleLoop 每 300ms tick 一次重新算 Date.now() 差值,
// 不需要額外計時器,徽章會在接下來 2-3 次 tick 內自然從亮轉暗。
const FLASH_WINDOW_MS = 900;

const TILE_SIZE = 60;

// 用「這場戰鬥剩多久 + 還差幾場戰鬥(以目前這場的時長當估計值)」換算成秒數倒數——
// 觸發機制本身還是擊殺數(game/skills.ts),這裡只是給 UI 一個看得懂的秒數估計,
// 不是改動實際觸發邏輯,所以每次擊殺重置區間時秒數會自然跳動,不會不準到離譜。
function estimateSecondsRemaining(remainingKills: number, fightDurationMs: number | null, fightElapsedMs: number): number {
  if (remainingKills <= 0) return 0;
  const avgFightMs = fightDurationMs ?? 3000;
  const currentFightRemainingMs = fightDurationMs !== null ? Math.max(0, fightDurationMs - fightElapsedMs) : 0;
  const additionalFights = Math.max(0, remainingKills - 1);
  const totalMs = currentFightRemainingMs + additionalFights * avgFightMs;
  return Math.max(0, Math.ceil(totalMs / 1000));
}

interface SkillTileProps {
  kind: '主動' | '被動';
  archetype: Archetype;
  level: number;
  killsSinceTrigger: number;
  interval: number;
  justTriggered: boolean;
  fightDurationMs: number | null;
  fightElapsedMs: number;
}

function SkillTile({
  kind,
  archetype,
  level,
  killsSinceTrigger,
  interval,
  justTriggered,
  fightDurationMs,
  fightElapsedMs,
}: SkillTileProps) {
  const icon = getSkillIcon(archetype);
  const remainingKills = Math.max(0, interval - killsSinceTrigger);
  const ratio = Math.min(1, killsSinceTrigger / interval);
  // 疊在圖示上方、由滿到空的暗色遮罩,呈現「還沒集滿」的部分,隨進度往上縮,是圖像化倒數
  // 的主要視覺(數字秒數是輔助,遮罩才是一眼就看得出「快好了沒」的東西)。
  const overlayHeight = (1 - ratio) * TILE_SIZE;
  const seconds = estimateSecondsRemaining(remainingKills, fightDurationMs, fightElapsedMs);

  return (
    <View style={styles.tileGroup}>
      <View style={[styles.tile, justTriggered && styles.tileFlash]}>
        <View style={styles.iconWrap}>
          <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={4} />
        </View>
        {!justTriggered && overlayHeight > 0 && <View style={[styles.cooldownOverlay, { height: overlayHeight }]} />}
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>{justTriggered ? '發動!' : `${seconds}s`}</Text>
        </View>
        <View style={styles.kindTag}>
          <Text style={styles.kindTagText}>{kind}</Text>
        </View>
      </View>
      <Text style={styles.caption} numberOfLines={1}>
        {SKILL_LABELS[archetype]} Lv.{level}
      </Text>
    </View>
  );
}

export function SkillTracker() {
  const job = useGameState((state) => state.job);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skills = useGameState((state) => state.skills);
  const skillKillsSinceTrigger = useGameState((state) => state.skillKillsSinceTrigger);
  const secondarySkillKillsSinceTrigger = useGameState((state) => state.secondarySkillKillsSinceTrigger);
  const lastSkillTriggerAt = useGameState((state) => state.lastSkillTriggerAt);
  const lastSecondarySkillTriggerAt = useGameState((state) => state.lastSecondarySkillTriggerAt);
  const currentEncounter = useGameState((state) => state.currentEncounter);
  const fightElapsedMs = useGameState((state) => state.fightElapsedMs);

  const now = Date.now();
  const primaryJustTriggered = lastSkillTriggerAt !== null && now - lastSkillTriggerAt < FLASH_WINDOW_MS;
  const secondaryJustTriggered = lastSecondarySkillTriggerAt !== null && now - lastSecondarySkillTriggerAt < FLASH_WINDOW_MS;
  const fightDurationMs = currentEncounter ? currentEncounter.fightDurationMs : null;

  return (
    <View style={styles.container}>
      <SkillTile
        kind="主動"
        archetype={job.archetype}
        level={skills[job.archetype]}
        killsSinceTrigger={skillKillsSinceTrigger}
        interval={skillTriggerInterval(skills[job.archetype])}
        justTriggered={primaryJustTriggered}
        fightDurationMs={fightDurationMs}
        fightElapsedMs={fightElapsedMs}
      />
      {secondaryJob && (
        <SkillTile
          kind="被動"
          archetype={secondaryJob}
          level={skills[secondaryJob]}
          killsSinceTrigger={secondarySkillKillsSinceTrigger}
          interval={secondarySkillTriggerInterval(skills[secondaryJob])}
          justTriggered={secondaryJustTriggered}
          fightDurationMs={fightDurationMs}
          fightElapsedMs={fightElapsedMs}
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
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    backgroundColor: '#2a2a35',
    borderWidth: 2,
    borderColor: '#3a3a45',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileFlash: {
    backgroundColor: '#4a4456',
    borderColor: '#c9a94f',
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 由上往下蓋住的暗色遮罩,高度隨冷卻進度縮小,圖像化呈現「還差多少」,比純數字/長條更直覺。
  cooldownOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(15, 15, 20, 0.75)',
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
