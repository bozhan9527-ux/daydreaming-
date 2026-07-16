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

// AI 圖原生比例落差很大(從瘦長 0.6 到寬扁 2.18 都有)。玩家判斷「這隻怪物大不大」主要看
// 站在同一條地面線上的高度(跟勇者比高矮),不是面積——面積固定但高度忽高忽低(65px~123px)
// 一樣會顯得忽大忽小。改成「高度永遠固定=height 參數」,寬度依原生比例算,但超過寬度上限的
// 部分用 resizeMode="cover" 裁掉左右兩側(不擠壓變形),不會壓縮/拉伸高度。這樣每隻怪物的
// 高度都跟勇者一致,只有極寬的怪物(例如飛行系)會被裁掉一點左右邊緣。
const MAX_WIDTH_RATIO = 1.6; // 寬度上限 = height 參數的這個倍率

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
  const displayWidth = Math.min(height * aspectRatio, height * MAX_WIDTH_RATIO);

  return <Image source={source} style={{ height, width: displayWidth }} resizeMode="cover" />;
}
