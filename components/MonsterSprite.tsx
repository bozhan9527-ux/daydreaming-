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

// AI 圖原生比例落差很大(從瘦長 0.6 到寬扁 2.18 都有)。預設高度固定 = height 參數、寬度依
// 原生比例算;但寬度不能無限吃版面,超過寬度上限時「整張等比縮小」到寬度上限為止(寧可
// 這隻怪物整體矮一點,也不要裁掉牠的身體部位)——不裁圖、不擠壓變形,單純整體 contain 縮放。
const MAX_WIDTH_RATIO = 1.5; // 寬度上限 = height 參數的這個倍率

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
  const scaledHeight = height * (art.scale ?? 1);
  const maxWidth = scaledHeight * MAX_WIDTH_RATIO;
  const naturalWidth = scaledHeight * aspectRatio;
  const displayHeight = naturalWidth > maxWidth ? maxWidth / aspectRatio : scaledHeight;
  const displayWidth = naturalWidth > maxWidth ? maxWidth : naturalWidth;

  return <Image source={source} style={{ height: displayHeight, width: displayWidth }} resizeMode="contain" />;
}
