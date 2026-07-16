import { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getCompanionById } from '../game/companions';
import { getAttackEffect } from '../game/sprites/attackEffects';
import { getCompanionFrame } from '../game/sprites/companions';
import { getItemById } from '../game/equipment';
import { getItemIcon } from '../game/sprites/equipmentIcons';
import { getMonsterFrame } from '../game/sprites/monsters';
import { useGameState } from '../hooks/useGameState';
import { HeroWalkSprite } from './HeroWalkSprite';
import { PixelSprite } from './PixelSprite';
import { getWeaponIconForItem } from './weaponIcons';

// 場景畫布尺寸固定不變:不管角色/特效怎麼換,SCENE_HEIGHT 都是同一個數字,版面不會因為
// 內容增減而跳動。背景圖(含關卡/小關文字)改由外層 MainVisual 統一繪製並往下延伸到按鈕區,
// 這裡維持透明,只負責角色/怪物/特效的定位。
const SCENE_HEIGHT = 130;
const SCENE_MAX_WIDTH = 320;
// 怪物原生畫布高度不像勇者本體固定(勇者56列),120種一般怪物/5階段魔王/大魔王的列數
// 從60列到72列都有——原本用固定 pixelSize(4/3)是配合最高列數(72)算出來的保守值,
// 比勇者的1.75小了快31%,一般怪物視覺份量明顯不足。改成「目標畫面高度固定、pixelSize
// 反推」:MONSTER_TARGET_HEIGHT 是怪物在畫面上實際的像素高度上限,列數少的一般怪物會分到
// 比較大的 pixelSize(視覺跟勇者持平甚至更搶眼),列數最多的大魔王會自動分到比較小的
// pixelSize,兩種都不會超出 SCENE_HEIGHT 固定畫布、被 overflow:hidden 切掉。
// 95px 是量過 SCENE_HEIGHT(130)扣掉 monsterSlot 的 bottom 偏移(20)跟 progressTrack
// 高度(約10)之後,能安全放進去的量,跟勇者在1.75時的實際畫面高度(56*1.75=98px)相近。
const MONSTER_TARGET_HEIGHT = 95;
const COMPANION_PIXEL_SIZE = 1;
const GROUND_PATTERN_WIDTH = 40;
const GROUND_SCROLL_DURATION = 1400;

// 技能特效從勇者側往怪物側移動一趟再收回:去程 EFFECT_TRAVEL_MS、停留在怪物旁邊 EFFECT_HOLD_MS
// 後瞬間收回原位。跟 SkillTracker 的技能格倒數綁同一個 lastSkillTriggerAt 時間戳,只在
// 技能真的觸發那一刻播一次,不是整場戰鬥從頭到尾一直循環——普通攻擊改由 WeaponSwingEffect 負責。
const EFFECT_TRAVEL_MS = 420;
const EFFECT_HOLD_MS = 120;
const EFFECT_REST_MS = 460;
const EFFECT_TRAVEL_DISTANCE = 88;
const HIT_REACT_DELAY_MS = EFFECT_TRAVEL_MS - 60;
const HIT_REACT_PUNCH_MS = 90;
const HIT_REACT_SETTLE_MS = 160;
const HIT_REACT_CYCLE_MS = EFFECT_TRAVEL_MS + EFFECT_HOLD_MS + EFFECT_REST_MS;
// 技能特效觸發後畫面上要「亮」多久,跟 SkillTracker.tsx 的 FLASH_WINDOW_MS 用同一個數字,
// 兩邊各自維護一份是延續本專案「小型常數依 per-file 慣例各自複製」的既有作法。
const SKILL_FLASH_WINDOW_MS = 900;
// 普通攻擊:武器揮動的短循環,不等技能觸發,只要還在戰鬥中就會一直揮,呈現「持續輸出」的基礎攻擊。
const SWING_CYCLE_MS = 700;
const SWING_OUT_MS = 160;
const SWING_BACK_MS = 220;
// 主手還沒裝備任何武器時(新玩家開局常見狀態)沒有武器圖示可以揮,退回一個赤手空拳的
// 揮擊小圖示,普通攻擊的揮動動作才不會在還沒買武器前直接整個消失不見。
const FIST_FRAME = ['.X.', 'XXX', '.X.'];
const FIST_PALETTE: Record<string, string> = { X: '#d8c9a8' };
// 主手武器有 AI 圖示的話優先顯示 AI 圖(見 components/weaponIcons.ts),沒有才 fallback
// 回程式產生圖示/赤手空拳。位置維持跟舊版程式特效完全相同的固定插槽(swingSlot),
// 不管職業/姿勢一律同一個位置,不個別校準。
const AI_WEAPON_ICON_HEIGHT = 48;

// 底下持續往左捲動的地面刻度線,製造「勇者往右前進」的錯覺,跟戰鬥狀態無關,一直跑。
function GroundScroll() {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-GROUND_PATTERN_WIDTH, { duration: GROUND_SCROLL_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View style={styles.groundTrack}>
      <Animated.View style={[styles.groundStrip, animatedStyle]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.groundDash} />
        ))}
      </Animated.View>
    </View>
  );
}

interface AttackTravelEffectProps {
  frame: string[];
  palette: Record<string, string>;
  active: boolean;
}

// 技能特效插槽:只在技能真的觸發的那一刻(active 從 false 翻成 true 的900ms閃爍窗)
// 從勇者旁邊往怪物方向衝一趟再收回,平常戰鬥中不會一直播放——不然玩家分不出來
// 「現在是技能發動」還是「單純還在打」。持續輸出的普通攻擊改由 WeaponSwingEffect 負責。
function AttackTravelEffect({ frame, palette, active }: AttackTravelEffectProps) {
  const travel = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    travel.value = withSequence(
      withTiming(1, { duration: EFFECT_TRAVEL_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: EFFECT_HOLD_MS }),
      withTiming(0, { duration: EFFECT_REST_MS, easing: Easing.in(Easing.quad) })
    );
  }, [active, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value * EFFECT_TRAVEL_DISTANCE }],
    opacity: active ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.effectSlot, animatedStyle]}>
      <PixelSprite frame={frame} palette={palette} pixelSize={3} />
    </Animated.View>
  );
}

interface WeaponSwingEffectProps {
  frame: string[];
  palette: Record<string, string>;
  aiIcon: { source: ImageSourcePropType; aspectRatio: number } | undefined;
  active: boolean;
}

// 普通攻擊:武器圖示在勇者手邊短促揮動(旋轉來回),不像技能特效那樣衝去怪物那邊——
// 呼應「近身揮武器造成傷害」而不是「發招打過去」的視覺差異。只要還在戰鬥中就會持續循環,
// 代表基礎攻擊一直在打,不需要對到 useBattleLoop 裡任何離散的攻擊時間點(戰鬥本來就是
// 連續進度條模型,沒有逐次的攻擊時間戳)。aiIcon 有值就疊 AI 武器圖示,沒有才退回程式產生
// 的 PixelSprite(含赤手空拳 fallback),兩者共用同一個插槽位置跟揮動動畫。
function WeaponSwingEffect({ frame, palette, aiIcon, active }: WeaponSwingEffectProps) {
  const swing = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      swing.value = 0;
      return;
    }
    swing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SWING_OUT_MS, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: SWING_BACK_MS, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: SWING_CYCLE_MS - SWING_OUT_MS - SWING_BACK_MS })
      ),
      -1,
      false
    );
  }, [active, swing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value * 50}deg` }],
    opacity: active ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.swingSlot, animatedStyle]}>
      {aiIcon ? (
        <Image
          source={aiIcon.source}
          style={{ height: AI_WEAPON_ICON_HEIGHT, width: AI_WEAPON_ICON_HEIGHT * aiIcon.aspectRatio }}
          resizeMode="contain"
        />
      ) : (
        <PixelSprite frame={frame} palette={palette} pixelSize={1.5} />
      )}
    </Animated.View>
  );
}

// legendary稀有度的怪物用一圈脈動金光跟其他稀有度拉開視覺落差——這是唯一在數值上跟common
// 差距最大的一級(見 game/heroHealth.ts 的 MONSTER_BASE_ATTACK,legendary=80 vs common=5),
// 但目前視覺上只靠怪物本身的色調(TINTS的第10組金色)區分,跟 epic 站在一起不夠搶眼。
// 只用 opacity(GPU屬性,呼應CLAUDE.md的動畫限制),不重畫怪物輪廓本身,風險最低。
const LEGENDARY_GLOW_COLOR = '#c9a94f';

function LegendaryGlow({ active }: { active: boolean }) {
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!active) return;
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.55, { duration: 900 }), withTiming(0.22, { duration: 900 })),
      -1,
      true
    );
  }, [active, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  if (!active) return null;
  return <Animated.View style={[styles.legendaryGlow, animatedStyle]} />;
}

interface MonsterHitReactionProps {
  active: boolean;
  children: React.ReactNode;
}

// 怪物受擊反應:跟 AttackTravelEffect 用同一個週期長度、延遲到特效差不多飛到的時間點才觸發,
// 短促縮放一下(punch)再彈回原尺寸,模擬「被打到震一下」,不是一直閃爍那種吵的做法。
function MonsterHitReaction({ active, children }: MonsterHitReactionProps) {
  const punch = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      punch.value = 1;
      return;
    }
    punch.value = withRepeat(
      withSequence(
        withDelay(HIT_REACT_DELAY_MS, withTiming(1.12, { duration: HIT_REACT_PUNCH_MS })),
        withTiming(1, { duration: HIT_REACT_SETTLE_MS }),
        withTiming(1, { duration: HIT_REACT_CYCLE_MS - HIT_REACT_DELAY_MS - HIT_REACT_PUNCH_MS - HIT_REACT_SETTLE_MS })
      ),
      -1,
      false
    );
  }, [active, punch]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: punch.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function BattleScene() {
  // 技能觸發閃爍窗要讀 Date.now() 這種 impure 值判斷「剛剛」,同 SkillTracker.tsx 的做法,
  // 這個 component 要跳出 React Compiler 的自動記憶化,不然 forceTick 不會觸發重算。
  'use no memo';

  const equipment = useGameState((state) => state.equipment);
  const job = useGameState((state) => state.job);
  const companions = useGameState((state) => state.companions);
  const currentEncounter = useGameState((state) => state.currentEncounter);
  const fightStartedAt = useGameState((state) => state.fightStartedAt);
  const fightElapsedMs = useGameState((state) => state.fightElapsedMs);
  const boostCurrentFight = useGameState((state) => state.boostCurrentFight);
  const lastSkillTriggerAt = useGameState((state) => state.lastSkillTriggerAt);
  const lastSecondarySkillTriggerAt = useGameState((state) => state.lastSecondarySkillTriggerAt);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  const effect = getAttackEffect(job.archetype);
  const now = Date.now();
  const skillJustTriggered =
    (lastSkillTriggerAt !== null && now - lastSkillTriggerAt < SKILL_FLASH_WINDOW_MS) ||
    (lastSecondarySkillTriggerAt !== null && now - lastSecondarySkillTriggerAt < SKILL_FLASH_WINDOW_MS);
  const mainhandId = equipment.mainhand;
  const mainhandItem = mainhandId !== undefined ? getItemById(mainhandId) : undefined;
  const proceduralIcon = mainhandItem ? getItemIcon(mainhandItem) : undefined;
  const swingFrame = proceduralIcon ? proceduralIcon.frame : FIST_FRAME;
  const swingPalette = proceduralIcon && mainhandItem ? { [proceduralIcon.fillKey]: mainhandItem.color } : FIST_PALETTE;
  const aiWeaponIcon = mainhandItem ? getWeaponIconForItem(mainhandItem) : undefined;

  const progress = currentEncounter ? Math.min(1, fightElapsedMs / currentEncounter.fightDurationMs) : 0;

  const mount = companions.equippedMountId ? getCompanionById(companions.equippedMountId) : undefined;
  const pet = companions.equippedPetId ? getCompanionById(companions.equippedPetId) : undefined;

  return (
    <View style={styles.scene}>
      {(currentEncounter?.isBoss || currentEncounter?.isFinalBoss) && (
        <Text style={styles.bossLabel}>{currentEncounter.isFinalBoss ? '⚠ 大魔王來襲' : '⚠ 魔王來襲'}</Text>
      )}

      <GroundScroll />

      {mount && (
        <View style={styles.mountSlot}>
          <PixelSprite {...getCompanionFrame(mount.id)} pixelSize={COMPANION_PIXEL_SIZE} />
        </View>
      )}

      {/* 勇者從場景正中央移到左側站位,跟右側的怪物拉開距離,中間讓給往返移動的技能特效。 */}
      <View style={styles.heroSlot}>
        <HeroWalkSprite onPress={boostCurrentFight} />
      </View>

      {pet && (
        <View style={styles.petSlot}>
          <PixelSprite {...getCompanionFrame(pet.id)} pixelSize={COMPANION_PIXEL_SIZE} />
        </View>
      )}

      <WeaponSwingEffect frame={swingFrame} palette={swingPalette} aiIcon={aiWeaponIcon} active={!!currentEncounter} />

      <AttackTravelEffect frame={effect.frame} palette={effect.palette} active={skillJustTriggered} />

      {currentEncounter && (
        <View key={fightStartedAt ?? 'none'} style={styles.monsterSlot}>
          <LegendaryGlow active={currentEncounter.rarity === 'legendary'} />
          <MonsterHitReaction active={!!currentEncounter}>
            <PixelSprite
              frame={getMonsterFrame(currentEncounter.monster.id).frame}
              palette={getMonsterFrame(currentEncounter.monster.id).palette}
              pixelSize={MONSTER_TARGET_HEIGHT / getMonsterFrame(currentEncounter.monster.id).frame.length}
            />
          </MonsterHitReaction>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: '100%',
    maxWidth: SCENE_MAX_WIDTH,
    height: SCENE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bossLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    textAlign: 'center',
    color: '#e05050',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  groundTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    height: 2,
    overflow: 'hidden',
  },
  groundStrip: {
    flexDirection: 'row',
    width: GROUND_PATTERN_WIDTH * 2,
  },
  groundDash: {
    width: 3,
    height: 2,
    marginRight: 1,
    backgroundColor: '#3a3542',
  },
  // 勇者靠左站位,不再橫跨整個場景寬度置中——固定 left 距離,搭配怪物側的 right 距離,
  // 版面才會讀成「兩邊對打、中間有空間」而不是勇者疊在怪物正前方。
  heroSlot: {
    position: 'absolute',
    left: 8,
    bottom: 20,
  },
  // 武器揮動插槽:貼在勇者手邊(heroSlot 右側),用旋轉呈現「近身揮擊」,跟中段那個
  // 衝去怪物旁邊再收回的技能特效插槽(effectSlot)刻意分開位置,兩種攻擊視覺不會疊在一起混淆。
  swingSlot: {
    position: 'absolute',
    left: 44,
    bottom: 34,
  },
  mountSlot: {
    position: 'absolute',
    left: 4,
    bottom: 12,
  },
  petSlot: {
    position: 'absolute',
    left: 0,
    bottom: 60,
  },
  monsterSlot: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    alignItems: 'center',
  },
  legendaryGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 999,
    backgroundColor: LEGENDARY_GLOW_COLOR,
  },
  // 特效插槽的靜止基準點在勇者跟怪物中間偏左,往右移動 EFFECT_TRAVEL_DISTANCE 之後
  // 大致落在怪物腳邊,呼應「打過去」的方向性。
  effectSlot: {
    position: 'absolute',
    left: 110,
    bottom: 44,
  },
  progressTrack: {
    marginTop: 6,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a2a35',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c9a94f',
  },
});
