import { StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import { secondarySkillTriggerInterval, SKILL_LABELS, skillTriggerInterval } from '../game/skills';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

// 剛觸發的技能徽章要閃光幾毫秒,配合 useBattleLoop 每 300ms tick 一次重新算 Date.now() 差值,
// 不需要額外計時器,徽章會在接下來 2-3 次 tick 內自然從亮轉暗。
const FLASH_WINDOW_MS = 900;

interface SkillBadgeProps {
  kind: '主動' | '被動';
  archetype: Archetype;
  level: number;
  killsSinceTrigger: number;
  interval: number;
  justTriggered: boolean;
}

function SkillBadge({ kind, archetype, level, killsSinceTrigger, interval, justTriggered }: SkillBadgeProps) {
  const icon = getSkillIcon(archetype);
  const remaining = Math.max(0, interval - killsSinceTrigger);
  const ratio = Math.min(1, killsSinceTrigger / interval);

  return (
    <View style={[styles.badge, justTriggered && styles.badgeFlash]}>
      <View style={styles.iconWrap}>
        <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name}>
          [{kind}] {SKILL_LABELS[archetype]} Lv.{level}
        </Text>
        <View style={styles.cooldownTrack}>
          <View style={[styles.cooldownFill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.cooldownText}>{justTriggered ? '發動!' : `還差 ${remaining} 隻`}</Text>
      </View>
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

  const now = Date.now();
  const primaryJustTriggered = lastSkillTriggerAt !== null && now - lastSkillTriggerAt < FLASH_WINDOW_MS;
  const secondaryJustTriggered = lastSecondarySkillTriggerAt !== null && now - lastSecondarySkillTriggerAt < FLASH_WINDOW_MS;

  return (
    <View style={styles.container}>
      <SkillBadge
        kind="主動"
        archetype={job.archetype}
        level={skills[job.archetype]}
        killsSinceTrigger={skillKillsSinceTrigger}
        interval={skillTriggerInterval(skills[job.archetype])}
        justTriggered={primaryJustTriggered}
      />
      {secondaryJob && (
        <SkillBadge
          kind="被動"
          archetype={secondaryJob}
          level={skills[secondaryJob]}
          killsSinceTrigger={secondarySkillKillsSinceTrigger}
          interval={secondarySkillTriggerInterval(skills[secondaryJob])}
          justTriggered={secondaryJustTriggered}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 320,
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  badgeFlash: {
    backgroundColor: '#4a4456',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  cooldownTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1c1c24',
    overflow: 'hidden',
  },
  cooldownFill: {
    height: '100%',
    backgroundColor: '#c9a94f',
  },
  cooldownText: {
    color: '#8a8a95',
    fontSize: 9,
  },
});
