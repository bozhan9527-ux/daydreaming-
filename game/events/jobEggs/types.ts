import { Archetype, JobBranch, JobTier } from '../../combat';
import { GameEvent } from '../types';

// 職業彩蛋:轉職到對應職業(含分支/階級)後才會加進彩蛋反應池,見 game/trigger.ts 的
// 觸發池整合邏輯(併入對應稀有度池,不是另開一組機率)。tier1 兩分支尚未分岔(見
// game/combat.ts 的 JOB_TITLES,1階兩分支共用同一個稱號),branch 固定填 null,兩分支
// 共用同一組15則;tier2起才各分支獨立一組15則(branch 填 'A'/'B')。
export interface JobGameEvent extends GameEvent {
  archetype: Archetype;
  branch: JobBranch | null;
  tier: JobTier;
}

// 學生彩蛋:畢業前(!hasChosenJob)就會加進彩蛋反應池,不綁六大職業(見
// game/studentSkillTree.ts 的 STUDENT_SKILL_FLAVOR),只分 tier1(Lv1,新生)/
// tier2(Lv10,風雲人物)兩組,沒有分支概念。
export interface StudentGameEvent extends GameEvent {
  studentTier: 1 | 2;
}
