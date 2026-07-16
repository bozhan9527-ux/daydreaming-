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

  return <Image source={source} style={{ height, width: height * aspectRatio }} resizeMode="contain" />;
}
