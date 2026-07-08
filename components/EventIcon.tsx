import { Rarity } from '../game/trigger';
import { getEventIcon } from '../game/sprites/eventIcons';
import { PixelSprite } from './PixelSprite';

interface EventIconProps {
  rarity: Rarity;
  pixelSize?: number;
}

export function EventIcon({ rarity, pixelSize = 4 }: EventIconProps) {
  const { frame, palette } = getEventIcon(rarity);
  return <PixelSprite frame={frame} palette={palette} pixelSize={pixelSize} />;
}
