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

// 靜音開關獨立於 zustand store 之外的模組層級狀態(見 hooks/useGameState.ts 的 load()/
// toggleSound()),避免這個純命令式的播放模組要反過來 import store 造成循環依賴。
let muted = false;

export function setSoundMuted(value: boolean): void {
  muted = value;
}

// 背景音樂(見 scripts/generate-sounds.ts 的 bgm.wav,20秒的悠閒8-bit循環主題)用獨立的
// 靜音開關,不共用上面音效的 muted——玩家常見的偏好是「要音效反饋、不要一直重複的BGM」
// 或反過來,兩者分開設定比較符合預期。musicPlayer 全程只建立一次、循環播放,跟上面
// 一次性音效「播完就 remove()」的用法不同。
const BGM_SOURCE = require('../assets/sounds/bgm.wav');
let musicMuted = false;
let musicPlayer: ReturnType<typeof createAudioPlayer> | null = null;

export function setMusicMuted(value: boolean): void {
  musicMuted = value;
  if (musicPlayer) musicPlayer.volume = value ? 0 : 1;
}

// 瀏覽器的自動播放限制:頁面載入當下呼叫通常會被瀏覽器擋下,呼叫端(hooks/useGameState.ts
// 的 load()/boostCurrentFight)除了在 load() 完成後呼叫一次,也會在每次點擊勇者時重複呼叫
// 當備援,直到某一次真的成功。注意:expo-audio 的 player.playing 是「呼叫過 play()」就
// 樂觀設成 true,不代表瀏覽器真的接受播放(自動播放被擋下時它也是 true)——不能拿來判斷
// 要不要重試,所以這裡每次呼叫都直接重新 play() 一次;對已經在播放的 <audio> 元素重複呼叫
// play() 是無害的(瀏覽器不會因此重新播放或卡頓),不需要额外判斷播放狀態。
export function startMusic(): void {
  if (!musicPlayer) {
    try {
      const player = createAudioPlayer(BGM_SOURCE);
      player.loop = true;
      player.volume = musicMuted ? 0 : 1;
      musicPlayer = player;
    } catch {
      // 平台不支援音效播放時靜默忽略,不影響核心玩法
      return;
    }
  }
  try {
    musicPlayer.play();
  } catch {
    // 自動播放限制擋下時靜默忽略,下次使用者互動會再重試
  }
}

export function stopMusic(): void {
  if (!musicPlayer) return;
  try {
    musicPlayer.pause();
  } catch {
    // 忽略
  }
}

function play(key: SoundKey): void {
  if (muted) return;
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
