import { Rarity } from '../trigger';
import { COMMON_EVENTS } from './common';
import { EPIC_EVENTS } from './epic';
import { LEGENDARY_EVENTS } from './legendary';
import { RARE_EVENTS } from './rare';
import { GameEvent } from './types';

const EVENTS_BY_RARITY: Record<Rarity, GameEvent[]> = {
  common: COMMON_EVENTS,
  rare: RARE_EVENTS,
  epic: EPIC_EVENTS,
  legendary: LEGENDARY_EVENTS,
};

export function getRandomEvent(rarity: Rarity, rng: () => number = Math.random): GameEvent {
  const pool = EVENTS_BY_RARITY[rarity];
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

export type { EventType, GameEvent } from './types';
