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
//
// 播放策略(靜音自動播放+互動後解除靜音):瀏覽器的自動播放限制擋的是「play()當下就要求
// 有聲音」,對「一開始就用靜音狀態播放」幾乎所有瀏覽器(含Android Chrome)都會直接放行,
// 不需要等使用者互動;之後在使用者第一次跟頁面互動時,只是把「已經在播放中」的媒體解除
// 靜音,這一步不受同一套限制阻擋,幾乎必然成功。比起先前「等互動才整個重新 play()、
// 可能因為手勢時機/瀏覽器差異而還是被擋下」的寫法穩定很多——這是網頁遊戲常見的標準作法。
const BGM_SOURCE = require('../assets/sounds/bgm.wav');
let musicMuted = false; // 玩家在設定畫面選的「要不要播BGM」
let gestureUnlocked = false; // 是否已經發生過一次使用者互動(用來解除自動播放限制的靜音)
let musicPlayer: ReturnType<typeof createAudioPlayer> | null = null;

function applyMusicMuteState(): void {
  if (musicPlayer) musicPlayer.muted = musicMuted || !gestureUnlocked;
}

export function setMusicMuted(value: boolean): void {
  musicMuted = value;
  applyMusicMuteState();
}

// 建立並開始播放BGM(一律先靜音,見上面策略說明)。呼叫端(hooks/useGameState.ts的load())
// 一載入完成就呼叫一次,讓BGM先在背景默默跑起來,不用等任何互動。
export function startMusic(): void {
  if (musicPlayer) {
    try {
      musicPlayer.play();
    } catch {
      // 忽略
    }
    return;
  }
  try {
    const player = createAudioPlayer(BGM_SOURCE);
    player.loop = true;
    player.muted = true;
    player.play();
    musicPlayer = player;
  } catch {
    // 平台不支援音效播放時靜默忽略,不影響核心玩法
  }
}

// 使用者第一次跟頁面互動時呼叫(見 hooks/useMusicUnlock.ts):解除上面 startMusic() 播放
// 時預設的靜音狀態。如果這時候 musicPlayer 還沒建立成功(例如 startMusic() 當初失敗過),
// 這裡會先補呼叫一次。連靜音自動播放都被瀏覽器擋下的情況(某些環境對「靜音自動播放一定
// 放行」這條規則的實作沒有那麼寬鬆)media會停在暫停狀態,所以這裡解除靜音之後還要再呼叫
// 一次 play()——這次是在真正的使用者互動當下呼叫,是目前唯一保證會成功的時機點。
export function unlockMusicOnInteraction(): void {
  gestureUnlocked = true;
  if (!musicPlayer) startMusic();
  applyMusicMuteState();
  try {
    musicPlayer?.play();
  } catch {
    // 忽略
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
