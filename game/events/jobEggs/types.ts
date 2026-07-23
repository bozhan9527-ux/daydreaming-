import { Archetype, JobBranch, JobTier } from '../../combat';
import { GameEvent } from '../types';

// 職業彩蛋:轉職到對應職業(含分支/階級)後才會加進彩蛋反應池,見 game/trigger.ts 的
// 觸發池整合邏輯(併入對應稀有度池,不是另開一組機率)。tier1 兩分支尚未分岔,不需要職業彩蛋
// (一般反應池本來就夠用),職業彩蛋從 tier2 開始各分支獨立一組。
export interface JobGameEvent extends GameEvent {
  archetype: Archetype;
  branch: JobBranch;
  tier: Exclude<JobTier, 1>;
}
