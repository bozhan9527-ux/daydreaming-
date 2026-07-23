# 學生彩蛋 AI 繪圖提示詞

用法跟前幾份一樣:每一組15則對應同一階級的彩蛋文案(見
`game/events/jobEggs/student.ts`),一次生成一組15張(建議排成5x3或3x5網格方便裁切),
生成完上傳到這個資料夾,跟開發那邊說一聲檔名,由開發那邊裁切成
`assets/sprites/events/<id>.png` 正式套用。

## 圖片尺寸

16:9 橫幅,單張建議 640x360px;整組15張一次生成排 5x3 網格的話畫布開 3200x1080px。

## 通用風格前綴(每組生成時都要加在提示詞最前面)

跟其他職業同一套角色設定(反推自 `assets/sprites/hero/jobs/physicalMelee.png` 的像素
風格),但學生期還沒轉職,改穿高中制服:

```
16-bit pixel art character illustration, chibi/SD proportions, clearly visible blocky
pixelation and hard-edged shading (no smooth gradients, no anti-aliasing blur),
muted low-saturation Morandi color palette (dusty grays, muted olive-brown, faded
blue-gray). Protagonist: young teenage boy, short messy dark navy-blue hair, tired
half-lidded droopy eyes, world-weary bored expression, wearing a slightly rumpled
high school uniform. Retro RPG game sprite portrait style, flat soft lighting,
slightly desaturated, 16:9 landscape scene composition, no text in image.
```

---

## tier1:新生

1. (job-student-1-c01) 他站在置物櫃前一臉茫然,手裡拿著寫著密碼的紙條。
2. (job-student-1-c02) 他站在陌生的走廊上,對照著手中的教室地圖。
3. (job-student-1-c03) 他盯著發回的考卷上大大的紅字,一臉沮喪。
4. (job-student-1-c04) 新生訓練的禮堂裡,他趴在椅背上快睡著。
5. (job-student-1-c05) 他獨自坐在角落吃著午餐,神情有些落寞。
6. (job-student-1-c06) 他手忙腳亂地整理著捲不好的制服袖子。
7. (job-student-1-c07) 導師點名念錯名字,他無奈地舉手澄清。
8. (job-student-1-c08) 他站在熱鬧的社團博覽會攤位前,猶豫不決。
9. (job-student-1-c09) 他手裡拿著板擦,一臉懊惱忘記擦黑板。
10. (job-student-1-c10) 他站在教室門口一臉困惑,顯然又走錯教室了。
11. (job-student-1-r01) 同學熱情地邀他一起吃飯,他緊張又開心地點頭。
12. (job-student-1-r02) 他驚喜地看著考卷上意外的高分。
13. (job-student-1-r03) 導師微笑著跟他打招呼,他驚訝又害羞。
14. (job-student-1-e01) 他獨自站在陌生的校園裡,午後陽光灑落,神情既緊張又充滿期待。
15. (job-student-1-l01) 開學典禮結束他走出校門,回頭望著校舍,露出青澀又堅定的笑容。

## tier2:風雲人物

1. (job-student-2-c01) 走廊上學弟妹紛紛回頭看他,他略顯不自在地低頭快走。
2. (job-student-2-c02) 校慶擺攤前他忙得滿頭大汗,笑容卻很燦爛。
3. (job-student-2-c03) 他站在成績公佈欄前,被同學簇擁著恭喜。
4. (job-student-2-c04) 眾人的目光聚焦在他身上,他卻只想找個安靜角落。
5. (job-student-2-c05) 班聯會會議上他認真發言,眼神卻不時瞄向手機。
6. (job-student-2-c06) 學弟妹排隊請他簽名,他略顯尷尬地簽著。
7. (job-student-2-c07) 校刊記者拿著錄音筆採訪他,他努力思考著回答。
8. (job-student-2-c08) 運動會上他被推上台,壓力寫在臉上。
9. (job-student-2-c09) 同學們爭相拉他同組,他露出為難又靦腆的笑容。
10. (job-student-2-c10) 放學後他獨自走在回家的路上,神情放鬆自在。
11. (job-student-2-r01) 學弟妹感激地向他道謝,他驚訝地想不起自己說過什麼。
12. (job-student-2-r02) 他捧著全校競賽的獎盃,驚喜得合不攏嘴。
13. (job-student-2-r03) 導師在班會上表揚他,他尷尬地搔著頭。
14. (job-student-2-e01) 深夜他獨自坐在書桌前,望著窗外的星空,神情平靜。
15. (job-student-2-l01) 站在畢業典禮的致詞台前,他望著台下的同學們,眼神裡有不捨也有感激。
