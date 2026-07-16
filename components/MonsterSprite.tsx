import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { getMonsterArt } from './monsterArt';

// AI 怪物美術的持續攻擊動畫:idle(站立)→windup(蓄力)→strike(出擊)三格循環播放,呼應
// HeroWalkSprite 那邊「武器持續搖擺=持續輸出」的呈現手法,不是只咬一次的觸發式動畫。跟
// HeroWalkSprite 的 open/click 用同一種「setState 換圖」做法(不是 reanimated transform,
// 因為這裡是整張圖替換,不是位移/縮放),三格各自停留時間不同(idle 站久一點,windup/strike
// 短促帶過),模擬「準備→出手」的節奏感。
const IDLE_MS = 900;
const WINDUP_MS = 220;
const STRIKE_MS = 260;

type Frame = 'idle' | 'windup' | 'strike';

const NEXT_FRAME: Record<Frame, Frame> = { idle: 'windup', windup: 'strike', strike: 'idle' };
const FRAME_DURATION: Record<Frame, number> = { idle: IDLE_MS, windup: WINDUP_MS, strike: STRIKE_MS };

// AI 圖原生比例落差很大(從瘦長 0.6 到寬扁 2.18 都有)。純用 height 反推寬度,不同怪物的
// 「視覺面積」會差很多倍(寬扁的怪物光是寬度就吃很大,瘦長的怪物反而顯得單薄),玩家感覺
// 忽大忽小不一致。改成「面積固定、依原生比例分配長寬」:h*w 這個乘積(視覺份量)在所有怪物
// 間保持一致,形狀依原生比例變(寬扁的變矮胖、瘦長的變細高),而不是形狀不變、份量亂跳。
// MAX_DIMENSION_RATIO 是安全上限,避免極端比例(例如 flying 2.18)算出的單邊長度爆出場景外。
const MAX_DIMENSION_RATIO = 1.5; // 長或寬都不能超過 height 參數的這個倍率

interface MonsterSpriteProps {
  monsterId: string;
  height: number;
}

// 沒有 AI 圖的原型(目前只有 serpent/巨蟒)回傳 null,呼叫端自行 fallback 回
// game/sprites/monsters.ts 的程式產生圖示。
export function MonsterSprite({ monsterId, height }: MonsterSpriteProps) {
  const art = getMonsterArt(monsterId);
  const [frame, setFrame] = useState<Frame>('idle');

  useEffect(() => {
    if (!art) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    function scheduleNext(current: Frame) {
      timeout = setTimeout(() => {
        if (cancelled) return;
        const next = NEXT_FRAME[current];
        setFrame(next);
        scheduleNext(next);
      }, FRAME_DURATION[current]);
    }

    setFrame('idle');
    scheduleNext('idle');
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [art, monsterId]);

  if (!art) return null;

  const source = art[frame];
  const aspectRatio = art[`${frame}AspectRatio`];

  const targetArea = height * height;
  let displayHeight = Math.sqrt(targetArea / aspectRatio);
  let displayWidth = Math.sqrt(targetArea * aspectRatio);

  const maxDimension = height * MAX_DIMENSION_RATIO;
  if (displayHeight > maxDimension) {
    displayWidth *= maxDimension / displayHeight;
    displayHeight = maxDimension;
  } else if (displayWidth > maxDimension) {
    displayHeight *= maxDimension / displayWidth;
    displayWidth = maxDimension;
  }

  return <Image source={source} style={{ height: displayHeight, width: displayWidth }} resizeMode="contain" />;
}
