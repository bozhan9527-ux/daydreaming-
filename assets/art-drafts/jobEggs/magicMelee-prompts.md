# 魔法近戰職業彩蛋 AI 繪圖提示詞

用法跟前幾份一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/magicMelee.ts`),一次生成一組15張(建議排成5x3或3x5網格方便裁切),
生成完上傳到這個資料夾,跟開發那邊說一聲檔名,由開發那邊裁切成
`assets/sprites/events/<id>.png` 正式套用。

## 圖片尺寸

16:9 橫幅,單張建議 640x360px;整組15張一次生成排 5x3 網格的話畫布開 3200x1080px。

## 通用風格前綴(每組生成時都要加在提示詞最前面)

跟物理近戰同一套角色設定(反推自 `assets/sprites/hero/jobs/physicalMelee.png` 的像素
風格),只是換上對應職業的服裝/道具:

```
16-bit pixel art character illustration, chibi/SD proportions, clearly visible blocky
pixelation and hard-edged shading (no smooth gradients, no anti-aliasing blur),
muted low-saturation Morandi color palette (dusty grays, muted olive-brown, faded
blue-gray). Protagonist: young man, short messy dark navy-blue hair, tired
half-lidded droopy eyes, world-weary bored expression. Retro RPG game sprite
portrait style, flat soft lighting, slightly desaturated, 16:9 landscape scene
composition, no text in image.
```

---

## 1階:中二國中生(兩分支共用)

1. (job-magicMelee-1-c01) 他趴在課桌上,筆記本邊角畫滿了自創咒語符號。
2. (job-magicMelee-1-c02) 他對著鏡子擺出必殺技姿勢,身後家人一臉尷尬地路過。
3. (job-magicMelee-1-c03) 考卷發回一片紅字,他握拳一臉不服氣。
4. (job-magicMelee-1-c04) 穿著制服的他站在夕陽下,自信地望向遠方。
5. (job-magicMelee-1-c05) 上課恍神的他眼神放空,腦中似乎在想像著什麼。
6. (job-magicMelee-1-c06) 他小心翼翼地戴上一條廉價卻自認神秘的手鍊。
7. (job-magicMelee-1-c07) 同學投來奇怪的眼神,他抬頭挺胸一臉高深莫測。
8. (job-magicMelee-1-c08) 放學路上他繞進小巷,擺出戰鬥姿勢對著空氣練習。
9. (job-magicMelee-1-c09) 書包裡塞滿雜物,家長會通知單被壓在最底下。
10. (job-magicMelee-1-c10) 體育課選隊伍時他站在角落,一臉失落。
11. (job-magicMelee-1-r01) 同學好奇地圍著他問東問西,他故作神秘地笑了笑。
12. (job-magicMelee-1-r02) 他捧著存錢筒倒出的零錢,興奮地數著。
13. (job-magicMelee-1-r03) 導師難得溫和地看著他,欲言又止地笑了笑。
14. (job-magicMelee-1-e01) 深夜他伏案在寫滿設定的筆記本前,檯燈是他唯一的光。
15. (job-magicMelee-1-l01) 畢業典禮上他翻開舊筆記本,看著稚嫩的字跡露出懷念的微笑。

## 分支A 2階:阿志

1. (job-magicMelee-A-2-c01) 他叼著檳榔騎在機車上,風把頭髮吹得凌亂。
2. (job-magicMelee-A-2-c02) 檳榔攤前他跟老闆閒聊,神情輕鬆。
3. (job-magicMelee-A-2-c03) 他俐落地騎車穿梭在巷弄間,眼神銳利。
4. (job-magicMelee-A-2-c04) 朋友圍著他問近況,他故作神秘地笑而不答。
5. (job-magicMelee-A-2-c05) 他捲起袖子露出自己畫的刺青,得意地展示。
6. (job-magicMelee-A-2-c06) 陣頭朋友揪他幫忙,他擺手婉拒。
7. (job-magicMelee-A-2-c07) 夜市小吃攤前他跟老闆相談甚歡。
8. (job-magicMelee-A-2-c08) 朋友們對他豎起大拇指,他得意地抱胸。
9. (job-magicMelee-A-2-c09) 他翻著空蕩蕩的口袋,還是擺出不在乎的表情。
10. (job-magicMelee-A-2-c10) 柑仔店阿姨笑著跟他打招呼,他點頭致意。
11. (job-magicMelee-A-2-r01) 朋友遞給他一包菸表示感謝,他收下露出笑容。
12. (job-magicMelee-A-2-r02) 他在夜市彈珠台前歡呼,贏得一件裝備獎品。
13. (job-magicMelee-A-2-r03) 巷口兄弟拍拍他肩膀,說他變穩重了。
14. (job-magicMelee-A-2-e01) 深夜他站在熟悉的巷口,看著幾個朋友的身影,神情堅定。
15. (job-magicMelee-A-2-l01) 深夜騎車返家的他放慢速度,望著整條熟悉的街道,眼神溫柔。

## 分支A 3階:道士/法師

1. (job-magicMelee-A-3-c01) 他手持毛筆專注地畫符,神情肅穆。
2. (job-magicMelee-A-3-c02) 客戶焦急地詢問,他淡定地翻著曆書。
3. (job-magicMelee-A-3-c03) 他捧著昂貴的法器,苦笑著看向錢包。
4. (job-magicMelee-A-3-c04) 深夜他提著法器出門辦事,神情嚴肅。
5. (job-magicMelee-A-3-c05) 香灰灑落在他的道袍上,他不以為意地繼續作法。
6. (job-magicMelee-A-3-c06) 客戶驚嘆他算得很準,他心虛地笑了笑。
7. (job-magicMelee-A-3-c07) 穿著道袍的他擺出戰鬥姿勢,神情認真。
8. (job-magicMelee-A-3-c08) 他唸咒唸到打結,尷尬地清清嗓子重來。
9. (job-magicMelee-A-3-c09) 他為人收驚,自己卻一臉疲憊。
10. (job-magicMelee-A-3-c10) 他捧著客戶送的一箱橘子,笑得開心。
11. (job-magicMelee-A-3-r01) 一戶人家感激地包紅包給他,他推辭不掉只好收下。
12. (job-magicMelee-A-3-r02) 深夜法事圓滿結束,他鬆了口氣擦拭額頭的汗。
13. (job-magicMelee-A-3-r03) 師父難得對他點頭稱讚,他愣住反應不過來。
14. (job-magicMelee-A-3-e01) 他站在香煙裊裊的神壇前,神情肅穆又疲憊。
15. (job-magicMelee-A-3-l01) 深夜送走最後一位求助者後,他獨自坐在神壇前,神情平靜。

## 分支A 4階:命理師

1. (job-magicMelee-A-4-c01) 他攤開命盤,客戶焦急地詢問姻緣。
2. (job-magicMelee-A-4-c02) 他埋首排著八字,桌上堆滿曆書。
3. (job-magicMelee-A-4-c03) 客戶追問準不準,他神秘一笑不置可否。
4. (job-magicMelee-A-4-c04) 算命攤前排著長長的人龍,他忙碌地應對。
5. (job-magicMelee-A-4-c05) 客戶滔滔不絕訴說煩惱,他耐心地聆聽。
6. (job-magicMelee-A-4-c06) 他打著算盤精算,神情專注。
7. (job-magicMelee-A-4-c07) 客戶問流年運勢,他看著自己的命盤苦笑。
8. (job-magicMelee-A-4-c08) 他揉著痠痛的眼睛,面前是密密麻麻的命盤。
9. (job-magicMelee-A-4-c09) 客戶稱讚他說話很安定,他微笑點頭。
10. (job-magicMelee-A-4-c10) 收攤後他望著自己的命盤發呆。
11. (job-magicMelee-A-4-r01) 客戶特地回來道謝,說按他的建議做了正確的決定。
12. (job-magicMelee-A-4-r02) 老客戶熱情地介紹新客人給他。
13. (job-magicMelee-A-4-r03) 客戶如釋重負地道謝,他也跟著鬆了口氣。
14. (job-magicMelee-A-4-e01) 他望著自己的命盤,神情複雜又若有所思。
15. (job-magicMelee-A-4-l01) 收攤的夜晚他獨自翻著命盤,眼神裡帶著釋懷的微笑。

## 分支A 5階:得道仙人

1. (job-magicMelee-A-5-c01) 他盤坐在山間打坐,神情安詳。
2. (job-magicMelee-A-5-c02) 他坐在簡陋茅屋前添著柴火,神情悠然。
3. (job-magicMelee-A-5-c03) 仙風道骨的他被一隻蟑螂嚇得跳起來。
4. (job-magicMelee-A-5-c04) 他拄著拐杖走在山路上,腳步略顯疲憊。
5. (job-magicMelee-A-5-c05) 山下村民喊著響亮的道號,他只是靦腆地笑笑。
6. (job-magicMelee-A-5-c06) 他望著遠方若有所思,似乎又忘了剛悟到的道理。
7. (job-magicMelee-A-5-c07) 他挑著山泉水,肩膀被扁擔壓得微彎。
8. (job-magicMelee-A-5-c08) 弟子恭敬地請教,他也一臉沉思地思考答案。
9. (job-magicMelee-A-5-c09) 雲霧繚繞的山頭,他望著曬著的棉被滿足地笑了。
10. (job-magicMelee-A-5-c10) 打坐到一半他的肚子叫了,尷尬地睜開眼。
11. (job-magicMelee-A-5-r01) 山下村民捧著新鮮蔬果上山答謝,他感激地收下。
12. (job-magicMelee-A-5-r02) 弟子終於學會心法,他比弟子還開心地拍手。
13. (job-magicMelee-A-5-r03) 他驚喜地在山洞裡發現一顆遺落的珍貴丹藥。
14. (job-magicMelee-A-5-e01) 他坐在山巔俯瞰雲海,神情平靜又深邃。
15. (job-magicMelee-A-5-l01) 夜晚他望著山下萬家燈火,眼神溫柔又釋然。

## 分支B 2階:八家將小將

1. (job-magicMelee-B-2-c01) 他對著鏡子畫著威風的臉譜,神情專注。
2. (job-magicMelee-B-2-c02) 踩街遊行中他步伐略顯生澀,汗流浹背。
3. (job-magicMelee-B-2-c03) 師兄糾正他的步伐,他認真調整姿勢。
4. (job-magicMelee-B-2-c04) 他扛著沉重的神將裝備走在隊伍中。
5. (job-magicMelee-B-2-c05) 練習陣法的他滿身大汗,神情投入。
6. (job-magicMelee-B-2-c06) 廟會結束他癱坐在路邊,聲音沙啞。
7. (job-magicMelee-B-2-c07) 同伴笑著指出他臉譜畫歪了,他尷尬地摸臉。
8. (job-magicMelee-B-2-c08) 深夜陣頭練習,鑼鼓聲在巷弄間迴盪。
9. (job-magicMelee-B-2-c09) 卸下神將裝扮後,他只是個疲憊的普通少年。
10. (job-magicMelee-B-2-c10) 他脫下鞋子,腳底磨出好幾個水泡。
11. (job-magicMelee-B-2-r01) 老師傅難得稱讚他步伐有樣子了,他驕傲地挺起胸膛。
12. (job-magicMelee-B-2-r02) 小朋友興奮地對他扮演的神將拍手叫好。
13. (job-magicMelee-B-2-r03) 他被選為遶境主力小將,既緊張又興奮。
14. (job-magicMelee-B-2-e01) 他站在廟埕中央,臉譜下的眼神無比莊重。
15. (job-magicMelee-B-2-l01) 卸下臉譜的深夜,他望著鏡中疲憊的自己,眼神卻無比堅定。

## 分支B 3階:乩童

1. (job-magicMelee-B-3-c01) 起乩前他深吸一口氣,神情肅穆。
2. (job-magicMelee-B-3-c02) 信眾排著長長的隊伍等候問事。
3. (job-magicMelee-B-3-c03) 乩身結束後他癱坐在椅子上,全身無力。
4. (job-magicMelee-B-3-c04) 他望著捐款箱,想著修廟頂的費用。
5. (job-magicMelee-B-3-c05) 他努力向信眾轉達神明的旨意,神情專注。
6. (job-magicMelee-B-3-c06) 深夜的廟埕香煙裊裊,他獨自坐著。
7. (job-magicMelee-B-3-c07) 他捂著喉嚨,聲音沙啞地說不出話。
8. (job-magicMelee-B-3-c08) 信眾送來水果,他感激地收下。
9. (job-magicMelee-B-3-c09) 廟公在一旁念叨,他乖乖拿起掃把清掃廟埕。
10. (job-magicMelee-B-3-c10) 他癱坐在廟門口,才想起自己一整天沒吃東西。
11. (job-magicMelee-B-3-r01) 一位信眾感激涕零地跪謝,他連忙扶起對方。
12. (job-magicMelee-B-3-r02) 法事圓滿結束,廟公難得對他點頭。
13. (job-magicMelee-B-3-r03) 深夜獨自留守廟裡的他,神情異常安寧。
14. (job-magicMelee-B-3-e01) 他站在神壇前,眼神恍惚,似乎在神明與自己之間游移。
15. (job-magicMelee-B-3-l01) 深夜獨自打掃廟埕的他,在月色下顯得格外堅定。

## 分支B 4階:風水師

1. (job-magicMelee-B-4-c01) 他拿著羅盤仔細測量客戶家的方位。
2. (job-magicMelee-B-4-c02) 他忙著看別人的家,自己家卻亂糟糟的。
3. (job-magicMelee-B-4-c03) 客戶追問招財方法,他看著自己的錢包苦笑。
4. (job-magicMelee-B-4-c04) 他爬上屋頂查看方位,鄰居好奇地張望。
5. (job-magicMelee-B-4-c05) 客戶讚嘆他講得很玄,他自信地點頭。
6. (job-magicMelee-B-4-c06) 他捧著昂貴的羅盤,神情既驕傲又心疼荷包。
7. (job-magicMelee-B-4-c07) 他走遍一整棟房子勘查,腿部痠痛。
8. (job-magicMelee-B-4-c08) 客戶堅持古法擺設,他無奈地配合演出。
9. (job-magicMelee-B-4-c09) 他收下微薄的酬勞,仍認真地完成工作。
10. (job-magicMelee-B-4-c10) 他回到自己雜亂的房間,苦笑搖頭。
11. (job-magicMelee-B-4-r01) 客戶生意變好,特地帶著禮物回來道謝。
12. (job-magicMelee-B-4-r02) 老客戶熱情地介紹新案子給他。
13. (job-magicMelee-B-4-r03) 客戶說家裡氣氛變好了,他也跟著欣慰。
14. (job-magicMelee-B-4-e01) 他站在客戶家中央,環視四周,眼神若有所思。
15. (job-magicMelee-B-4-l01) 他看著客戶一家人和睦地圍坐吃飯,露出溫暖的微笑。

## 分支B 5階:一代宗師

1. (job-magicMelee-B-5-c01) 眾人尊稱他一代宗師,他卻只是提著空空的錢包苦笑。
2. (job-magicMelee-B-5-c02) 弟子成群圍繞著他,他慈祥地微笑。
3. (job-magicMelee-B-5-c03) 他翻看著滿滿的行程表,眉頭微皺。
4. (job-magicMelee-B-5-c04) 徒弟恭敬地請教,他沉思片刻才緩緩開口。
5. (job-magicMelee-B-5-c05) 他站在老舊公寓前,身後跟著慕名而來的訪客。
6. (job-magicMelee-B-5-c06) 記者前來採訪,他端出樸素的茶招待。
7. (job-magicMelee-B-5-c07) 弟子們模仿他的招牌動作,他忍不住笑了。
8. (job-magicMelee-B-5-c08) 各路人馬前來請益,他從容地泡著茶。
9. (job-magicMelee-B-5-c09) 他一如往常地在庭院裡練功,神情專注。
10. (job-magicMelee-B-5-c10) 他望著滿堂弟子,記不清每個人的名字。
11. (job-magicMelee-B-5-r01) 當年被他點化的信眾,如今帶著孩子回來感謝他。
12. (job-magicMelee-B-5-r02) 各地廟宇邀請他指導,他欣慰地點頭答應。
13. (job-magicMelee-B-5-r03) 新弟子拜師時眼神堅定,像極了當年的他。
14. (job-magicMelee-B-5-e01) 他站在庭院中央,望著滿堂弟子練功,眼神裡滿是欣慰與感慨。
15. (job-magicMelee-B-5-l01) 弟子們齊聲喊著師父的那一刻,他望著眾人,眼眶微微濕潤。
