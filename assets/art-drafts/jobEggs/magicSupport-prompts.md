# 魔法輔助職業彩蛋 AI 繪圖提示詞

用法跟前幾份一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/magicSupport.ts`),一次生成一組15張(建議排成5x3或3x5網格方便裁切),
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

## 1階:藥師(兩分支共用)

1. (job-magicSupport-1-c01) 他站在藥架前仔細數著藥丸,神情專注。
2. (job-magicSupport-1-c02) 客人詢問副作用,他翻著仿單耐心解說。
3. (job-magicSupport-1-c03) 藥局前排著長長的人龍,他忙碌地應對。
4. (job-magicSupport-1-c04) 他盯著密密麻麻的藥單,眼神疲憊卻專注。
5. (job-magicSupport-1-c05) 客人堅持要買特效藥,他耐心地解釋。
6. (job-magicSupport-1-c06) 他仔細地將藥袋摺得整整齊齊。
7. (job-magicSupport-1-c07) 客人殺價,他只是無奈地笑笑。
8. (job-magicSupport-1-c08) 他調劑到手痠,依然仔細核對每一味藥。
9. (job-magicSupport-1-c09) 深夜藥局裡只剩他一人值班,白色燈光映著他的臉。
10. (job-magicSupport-1-c10) 客人抱怨藥太苦,他微笑著遞上一杯溫水。
11. (job-magicSupport-1-r01) 常客特地跑來道謝,他也露出欣慰的笑容。
12. (job-magicSupport-1-r02) 他數著存錢筒的硬幣,一臉期待。
13. (job-magicSupport-1-r03) 前輩難得稱讚他細心,他有點不好意思地笑了。
14. (job-magicSupport-1-e01) 深夜的藥局裡,他一顆顆仔細數著藥丸,神情專注又溫柔。
15. (job-magicSupport-1-l01) 拉下藥局鐵門的瞬間,他望著街道,露出平靜的微笑。

## 分支A 2階:醫生

1. (job-magicSupport-A-2-c01) 他聲音沙啞地為病患看診,神情疲憊卻專注。
2. (job-magicSupport-A-2-c02) 病患描述天馬行空的症狀,他認真地思考著。
3. (job-magicSupport-A-2-c03) 值班一整晚,他狼吞虎嚥地吃著冷掉的便當。
4. (job-magicSupport-A-2-c04) 他埋首書寫密密麻麻的病歷。
5. (job-magicSupport-A-2-c05) 白袍口袋裡塞滿各種醫療用品,略顯凌亂。
6. (job-magicSupport-A-2-c06) 深夜他從睡夢中驚醒,匆忙披上白袍。
7. (job-magicSupport-A-2-c07) 他耐心地向病患解釋病情,神情溫和。
8. (job-magicSupport-A-2-c08) 診間外排著長長的候診人潮。
9. (job-magicSupport-A-2-c09) 激動的家屬前,他仍保持冷靜的態度。
10. (job-magicSupport-A-2-c10) 下診後他才發現午餐早已冷透。
11. (job-magicSupport-A-2-r01) 康復的病患帶著水果特地回診道謝。
12. (job-magicSupport-A-2-r02) 深夜成功穩住急重症病患,他鬆了口氣。
13. (job-magicSupport-A-2-r03) 主治醫師難得地對他點頭稱讚。
14. (job-magicSupport-A-2-e01) 他站在診間裡,望著病歷,神情若有所思。
15. (job-magicSupport-A-2-l01) 深夜送走最後一位病患,他靠著牆露出疲憊又溫柔的微笑。

## 分支A 3階:心理諮商師

1. (job-magicSupport-A-3-c01) 他專注地聽著個案訴說心事,眼神溫和。
2. (job-magicSupport-A-3-c02) 個案沉默不語,他耐心地靜靜等待。
3. (job-magicSupport-A-3-c03) 他望著空出的諮商時段,神情有些落寞。
4. (job-magicSupport-A-3-c04) 諮商室裡的面紙盒堆得像小山。
5. (job-magicSupport-A-3-c05) 個案情緒激動,他仍保持沉穩的語氣。
6. (job-magicSupport-A-3-c06) 督導會議上他認真地做著筆記。
7. (job-magicSupport-A-3-c07) 他收下個案送的感謝小卡,露出溫暖的笑容。
8. (job-magicSupport-A-3-c08) 下班後他獨自坐著,整理自己紛亂的思緒。
9. (job-magicSupport-A-3-c09) 他靜靜聽著個案哭訴,眼神裡滿是同理。
10. (job-magicSupport-A-3-c10) 他望著窗外,神情疲憊又平靜。
11. (job-magicSupport-A-3-r01) 走出低潮的個案興奮地與他分享好消息。
12. (job-magicSupport-A-3-r02) 個案哭著向他道謝,他也跟著紅了眼眶。
13. (job-magicSupport-A-3-r03) 督導肯定地看著他,他鬆了口氣。
14. (job-magicSupport-A-3-e01) 他坐在空蕩的諮商室裡,神情複雜又堅定。
15. (job-magicSupport-A-3-l01) 送走終於走出陰霾的個案,他望著窗外的陽光,露出釋然的微笑。

## 分支A 4階:老中醫

1. (job-magicSupport-A-4-c01) 他專注地為病患把脈,神情沉穩。
2. (job-magicSupport-A-4-c02) 他小心翼翼地秤著藥材,一絲不苟。
3. (job-magicSupport-A-4-c03) 病患滿懷期待地看著他,他認真地診斷。
4. (job-magicSupport-A-4-c04) 藥爐冒著熱氣,他守在一旁熬藥。
5. (job-magicSupport-A-4-c05) 他忙著看診,忘記自己也該休息。
6. (job-magicSupport-A-4-c06) 病患急切地詢問,他淡然地微笑安撫。
7. (job-magicSupport-A-4-c07) 老舊藥櫃前,他熟練地抓著藥材。
8. (job-magicSupport-A-4-c08) 把脈時他若有所思,眼神深邃。
9. (job-magicSupport-A-4-c09) 他收下微薄的診金,依然認真看診。
10. (job-magicSupport-A-4-c10) 收工後他坐在診間裡,揉著自己痠痛的手腕。
11. (job-magicSupport-A-4-r01) 康復的老病患包了紅包激動道謝。
12. (job-magicSupport-A-4-r02) 老病患熱情地介紹新病患給他。
13. (job-magicSupport-A-4-r03) 病患說終於睡得安穩,他也跟著安心地笑了。
14. (job-magicSupport-A-4-e01) 他坐在藥櫃前,望著手中的藥材,神情若有所思。
15. (job-magicSupport-A-4-l01) 看著調理多年的病患健步如飛,他露出欣慰的笑容。

## 分支A 5階:神醫/華佗再世

1. (job-magicSupport-A-5-c01) 老舊診間前排著長長的求診人潮。
2. (job-magicSupport-A-5-c02) 他靜心診斷著疑難雜症,神情專注。
3. (job-magicSupport-A-5-c03) 記者堵在診所門口,他端出粗茶接待。
4. (job-magicSupport-A-5-c04) 各方名醫前來請益,他依然謙遜地先把脈。
5. (job-magicSupport-A-5-c05) 他收取親民的診金,神情淡然。
6. (job-magicSupport-A-5-c06) 疑難病患絡繹不絕,他略顯疲憊卻堅持看診。
7. (job-magicSupport-A-5-c07) 徒弟恭敬地請教,他耐心地講解。
8. (job-magicSupport-A-5-c08) 他專注地練習脈診手法。
9. (job-magicSupport-A-5-c09) 他望著窗外,才想起自己好幾年沒休過假。
10. (job-magicSupport-A-5-c10) 他坐在診間裡,神情疲憊卻堅定。
11. (job-magicSupport-A-5-r01) 被判絕症的病患康復回診,激動地跪謝。
12. (job-magicSupport-A-5-r02) 各地醫院邀他會診疑難雜症。
13. (job-magicSupport-A-5-r03) 新進學徒的認真眼神,讓他想起了當年的自己。
14. (job-magicSupport-A-5-e01) 他坐在診間裡,望著窗外,神情深邃又平靜。
15. (job-magicSupport-A-5-l01) 看著曾被判絕症的病患健康地走出診間,他露出釋然的微笑。

## 分支B 2階:獸醫

1. (job-magicSupport-B-2-c01) 他手臂上帶著新的貓抓傷痕,苦笑著繼續工作。
2. (job-magicSupport-B-2-c02) 深夜他匆忙趕往診所,懷裡抱著緊急送醫的小狗。
3. (job-magicSupport-B-2-c03) 焦急的飼主比動物本人還緊張,他耐心安撫。
4. (job-magicSupport-B-2-c04) 他小心翼翼地為兔子修剪指甲。
5. (job-magicSupport-B-2-c05) 診所裡排著各種可愛的毛小孩。
6. (job-magicSupport-B-2-c06) 他被鸚鵡啄了一口,苦笑著揉揉手指。
7. (job-magicSupport-B-2-c07) 手術服上沾滿各種動物的毛髮。
8. (job-magicSupport-B-2-c08) 飼主焦急詢問,他誠實又溫和地回答。
9. (job-magicSupport-B-2-c09) 他身上滿是動物抓咬的痕跡,依然溫柔地檢查著病患。
10. (job-magicSupport-B-2-c10) 收工後他身上還殘留著淡淡的動物氣味。
11. (job-magicSupport-B-2-r01) 康復的小狗飼主送來親手做的點心。
12. (job-magicSupport-B-2-r02) 原本怕生的貓咪主動蹭了蹭他的手。
13. (job-magicSupport-B-2-r03) 他讀著飼主寫的感謝卡,露出溫暖的笑容。
14. (job-magicSupport-B-2-e01) 他抱著一隻小動物,眼神溫柔而專注。
15. (job-magicSupport-B-2-l01) 康復的小動物開心地奔向飼主,他站在一旁露出滿足的微笑。

## 分支B 3階:芳療師

1. (job-magicSupport-B-3-c01) 他仔細調配著精油,滿室瀰漫香氣。
2. (job-magicSupport-B-3-c02) 他為客人按摩,自己的手卻先痠了。
3. (job-magicSupport-B-3-c03) 整齊的精油瓶架前,他神情若有所思。
4. (job-magicSupport-B-3-c04) 客人在按摩床上安詳睡去,他輕手輕腳地繼續。
5. (job-magicSupport-B-3-c05) 他揉著自己僵硬的肩頸。
6. (job-magicSupport-B-3-c06) 深夜他望著天花板,難以入眠。
7. (job-magicSupport-B-3-c07) 按摩室裡輕柔的音樂伴隨著他工作。
8. (job-magicSupport-B-3-c08) 他默默加重按摩力道,滿足客人的需求。
9. (job-magicSupport-B-3-c09) 他身上散發著淡淡的複合香氣。
10. (job-magicSupport-B-3-c10) 收工後他終於得空,靜靜地坐著放鬆。
11. (job-magicSupport-B-3-r01) 客人特地指名找他,說睡了最安穩的一覺。
12. (job-magicSupport-B-3-r02) 客人感動地收下他調配的專屬香氛。
13. (job-magicSupport-B-3-r03) 他收下客人贈送的珍貴精油,露出驚喜的笑容。
14. (job-magicSupport-B-3-e01) 他站在滿室精油瓶前,神情若有所思。
15. (job-magicSupport-B-3-l01) 看著客人按摩後安詳睡去的臉,他露出溫柔的微笑。

## 分支B 4階:針灸師

1. (job-magicSupport-B-4-c01) 他精準地下針,神情專注而穩定。
2. (job-magicSupport-B-4-c02) 怕痛的病患緊張地閉眼,他耐心地慢慢下針。
3. (job-magicSupport-B-4-c03) 他仔細地為銀針消毒,一絲不苟。
4. (job-magicSupport-B-4-c04) 病患扎針後安詳睡去,他輕聲退到一旁。
5. (job-magicSupport-B-4-c05) 他熟練地找準穴位,手法俐落。
6. (job-magicSupport-B-4-c06) 病患質疑地看著他,他溫和地解釋耐心的重要。
7. (job-magicSupport-B-4-c07) 他揉著自己痠痛的手指,依然專注工作。
8. (job-magicSupport-B-4-c08) 診間外排著長長的候診隊伍。
9. (job-magicSupport-B-4-c09) 病患感激地稱讚,他謙虛地微笑。
10. (job-magicSupport-B-4-c10) 收工後他想起自己的肩頸也該扎一針了。
11. (job-magicSupport-B-4-r01) 治好多年老毛病的病患激動得說不出話。
12. (job-magicSupport-B-4-r02) 老病患熱情地介紹新病患給他。
13. (job-magicSupport-B-4-r03) 病患說終於睡得安穩,他也跟著鬆了口氣。
14. (job-magicSupport-B-4-e01) 他坐在診間裡,望著滿牆的穴位圖,神情深思。
15. (job-magicSupport-B-4-l01) 看著久病的病患終於能自在行走,他露出欣慰的笑容。

## 分支B 5階:都市傳說級神醫

1. (job-magicSupport-B-5-c01) 巷子裡的小診所前排著長長的人龍。
2. (job-magicSupport-B-5-c02) 他看著手機上關於自己的傳言,哭笑不得。
3. (job-magicSupport-B-5-c03) 慕名而來的病患擠滿了整條巷子。
4. (job-magicSupport-B-5-c04) 記者堵在門口,他從後門悄悄溜出去買午餐。
5. (job-magicSupport-B-5-c05) 他坐在舊藤椅上,神情淡然地看診。
6. (job-magicSupport-B-5-c06) 他泡著一壺茶,靜心準備應對疑難雜症。
7. (job-magicSupport-B-5-c07) 徒弟好奇地問起傳說的由來,他只是搖頭一笑。
8. (job-magicSupport-B-5-c08) 他望著窗外,才想起自己好幾年沒逛過夜市了。
9. (job-magicSupport-B-5-c09) 各地民俗療法界前輩特地登門交流。
10. (job-magicSupport-B-5-c10) 新學徒敬畏的眼神,讓他想起初出茅廬的自己。
11. (job-magicSupport-B-5-r01) 跑遍各大醫院查無病因的病患,終於在他這裡找到答案。
12. (job-magicSupport-B-5-r02) 病患激動地握著他的手道謝。
13. (job-magicSupport-B-5-r03) 他望著新學徒認真的眼神,露出欣慰的微笑。
14. (job-magicSupport-B-5-e01) 他坐在舊藤椅上,望著巷口,神情平靜又深邃。
15. (job-magicSupport-B-5-l01) 看著又一位病患帶著笑容走出診所,他望著巷口的夕陽,露出滿足的微笑。
