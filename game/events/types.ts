import { Rarity } from '../trigger';

export type EventType = 'text' | 'image' | 'animation';

export interface GameEvent {
  id: string;
  rarity: Rarity;
  type: EventType;
  // type 'text' 時是要顯示的文字內容;image/animation 的 payload 格式待第 2 階段(美術/動畫)加入時再定義。
  payload: string;
}
