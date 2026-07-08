import { createAudioPlayer } from 'expo-audio';

import { Rarity } from '../game/trigger';

const SOUND_SOURCES = {
  click: require('../assets/sounds/click.wav'),
  eventCommon: require('../assets/sounds/event-common.wav'),
  eventRare: require('../assets/sounds/event-rare.wav'),
  eventEpic: require('../assets/sounds/event-epic.wav'),
  eventLegendary: require('../assets/sounds/event-legendary.wav'),
  levelUp: require('../assets/sounds/level-up.wav'),
  skillUpgrade: require('../assets/sounds/skill-upgrade.wav'),
} as const;

type SoundKey = keyof typeof SOUND_SOURCES;

// 對應 scripts/generate-sounds.ts 產生的實際時長,播完後釋放 player 避免堆積。
const SOUND_DURATIONS_MS: Record<SoundKey, number> = {
  click: 50,
  eventCommon: 90,
  eventRare: 190,
  eventEpic: 270,
  eventLegendary: 484,
  levelUp: 370,
  skillUpgrade: 160,
};

const RARITY_TO_SOUND: Record<Rarity, SoundKey> = {
  common: 'eventCommon',
  rare: 'eventRare',
  epic: 'eventEpic',
  legendary: 'eventLegendary',
};

function play(key: SoundKey): void {
  try {
    const player = createAudioPlayer(SOUND_SOURCES[key]);
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // 音效非核心玩法,清理失敗不影響遊戲進行
      }
    }, SOUND_DURATIONS_MS[key] + 200);
  } catch {
    // 平台不支援音效播放時靜默忽略,不影響核心玩法
  }
}

export function playClick(): void {
  play('click');
}

export function playEvent(rarity: Rarity): void {
  play(RARITY_TO_SOUND[rarity]);
}

export function playLevelUp(): void {
  play('levelUp');
}

export function playSkillUpgrade(): void {
  play('skillUpgrade');
}
