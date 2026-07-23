import { StudentGameEvent } from './types';

// 學生彩蛋:畢業前(!hasChosenJob)套用,對應 game/studentSkillTree.ts 的
// STUDENT_SKILL_FLAVOR 兩組敘述——tier1(Lv1,新生)/tier2(Lv10,風雲人物),沒有分支。
// 每組15則(10 common/3 rare/1 epic/1 legendary)。
export const STUDENT_JOB_EGGS: StudentGameEvent[] = [
  // ── tier1:新生 ──
  { id: 'job-student-1-c01', rarity: 'common', type: 'text', studentTier: 1, payload: '剛入學連置物櫃密碼都記不熟,打怪反而記得比較快。' },
  { id: 'job-student-1-c02', rarity: 'common', type: 'text', studentTier: 1, payload: '早自習還在找教室,班上同學都已經認得我了。' },
  { id: 'job-student-1-c03', rarity: 'common', type: 'text', studentTier: 1, payload: '第一次月考就當了一科,打怪的成績單倒是漂亮多了。' },
  { id: 'job-student-1-c04', rarity: 'common', type: 'text', studentTier: 1, payload: '新生訓練聽到快睡著,魔王攻擊反而讓人清醒。' },
  { id: 'job-student-1-c05', rarity: 'common', type: 'text', studentTier: 1, payload: '午餐時間一個人吃飯,默默練了一下打怪的手速。' },
  { id: 'job-student-1-c06', rarity: 'common', type: 'text', studentTier: 1, payload: '制服穿得還不習慣,袖子永遠捲不好。' },
  { id: 'job-student-1-c07', rarity: 'common', type: 'text', studentTier: 1, payload: '導師點名念錯我的名字,我懶得糾正。' },
  { id: 'job-student-1-c08', rarity: 'common', type: 'text', studentTier: 1, payload: '社團博覽會逛了一圈,最後還是決定回家打怪。' },
  { id: 'job-student-1-c09', rarity: 'common', type: 'text', studentTier: 1, payload: '第一次值日生忘記擦黑板,被記了一筆。' },
  { id: 'job-student-1-c10', rarity: 'common', type: 'text', studentTier: 1, payload: '課表背不熟,走錯教室變成家常便飯。' },
  { id: 'job-student-1-r01', rarity: 'rare', type: 'text', studentTier: 1, payload: '同學主動找我一起吃午餐,緊張到不知道該聊什麼。' },
  { id: 'job-student-1-r02', rarity: 'rare', type: 'text', studentTier: 1, payload: '小考意外考了不錯的分數,自己都嚇了一跳。' },
  { id: 'job-student-1-r03', rarity: 'rare', type: 'text', studentTier: 1, payload: '導師難得記住我的名字,還笑著跟我打招呼。' },
  { id: 'job-student-1-e01', rarity: 'epic', type: 'text', studentTier: 1, payload: '剛入學手忙腳亂的這幾個月,我才發現,原來連跌跌撞撞的樣子,也可以被人溫柔地接住。' },
  { id: 'job-student-1-l01', rarity: 'legendary', type: 'text', studentTier: 1, payload: '開學典禮結束那天走出校門,我才明白,新生這個身分雖然生澀,卻是所有故事最珍貴的起點。' },

  // ── tier2:風雲人物 ──
  { id: 'job-student-2-c01', rarity: 'common', type: 'text', studentTier: 2, payload: '走在校園被學弟妹認出來,打怪的低調技能完全派不上用場。' },
  { id: 'job-student-2-c02', rarity: 'common', type: 'text', studentTier: 2, payload: '校慶擺攤賺了一筆,比打十隻怪還有成就感。' },
  { id: 'job-student-2-c03', rarity: 'common', type: 'text', studentTier: 2, payload: '段考奪冠,打怪的手感倒是絲毫沒受影響。' },
  { id: 'job-student-2-c04', rarity: 'common', type: 'text', studentTier: 2, payload: '風雲人物人氣爆棚,私底下還是喜歡一個人打怪。' },
  { id: 'job-student-2-c05', rarity: 'common', type: 'text', studentTier: 2, payload: '班聯會找我幫忙,我一邊開會一邊惦記著今天的打怪進度。' },
  { id: 'job-student-2-c06', rarity: 'common', type: 'text', studentTier: 2, payload: '學弟妹排隊要簽名,我只想趕快回家打怪。' },
  { id: 'job-student-2-c07', rarity: 'common', type: 'text', studentTier: 2, payload: '校刊採訪找上我,問的問題比魔王攻略還難答。' },
  { id: 'job-student-2-c08', rarity: 'common', type: 'text', studentTier: 2, payload: '運動會被推選當班代,壓力比打怪還大。' },
  { id: 'job-student-2-c09', rarity: 'common', type: 'text', studentTier: 2, payload: '同學都想跟我同組,我還是比較習慣單打獨鬥。' },
  { id: 'job-student-2-c10', rarity: 'common', type: 'text', studentTier: 2, payload: '成為風雲人物之後,唯一沒變的是回家還是要打怪。' },
  { id: 'job-student-2-r01', rarity: 'rare', type: 'text', studentTier: 2, payload: '低調的學弟妹私下謝謝我當初的一句鼓勵,我都忘了自己說過。' },
  { id: 'job-student-2-r02', rarity: 'rare', type: 'text', studentTier: 2, payload: '意外拿了全校競賽第一名,獎品比想像中還豐盛。' },
  { id: 'job-student-2-r03', rarity: 'rare', type: 'text', studentTier: 2, payload: '導師在班會上特別表揚我,我尷尬得說不出話。' },
  { id: 'job-student-2-e01', rarity: 'epic', type: 'text', studentTier: 2, payload: '成為眾人矚目的風雲人物之後,我才發現,自己心裡最踏實的時刻,還是那些一個人默默打怪的深夜。' },
  { id: 'job-student-2-l01', rarity: 'legendary', type: 'text', studentTier: 2, payload: '站上畢業致詞台前回頭望著這幾年走過的路,我才明白,所謂風雲人物,不過是把平凡的日子一天天認真活過。' },
];
