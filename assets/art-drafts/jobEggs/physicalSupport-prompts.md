# 物理輔助職業彩蛋 AI 繪圖提示詞

用法跟前兩份一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/physicalSupport.ts`),一次生成一組15張(建議排成5x3或3x5網格方便
裁切),生成完上傳到這個資料夾,跟開發那邊說一聲檔名,由開發那邊裁切成
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

## 1階:超商店員(兩分支共用)

1. (job-physicalSupport-1-c01) 他站在關東煮鍋前,一臉疲憊地攪拌著湯汁。
2. (job-physicalSupport-1-c02) 客人比手畫腳問路,他熟練地指著廁所方向。
3. (job-physicalSupport-1-c03) 深夜的便利商店裡,他頂著黑眼圈站在收銀台後。
4. (job-physicalSupport-1-c04) 他結帳結到手軟,面前排著長長的人龍。
5. (job-physicalSupport-1-c05) 他捧著報廢的關東煮當晚餐,吃得心滿意足。
6. (job-physicalSupport-1-c06) 客人比手畫腳抱怨退貨,他一臉為難地應對。
7. (job-physicalSupport-1-c07) 他手裡拿著一長串待辦清單,滿臉無奈。
8. (job-physicalSupport-1-c08) 他彎腰補貨,貨架堆得比人還高。
9. (job-physicalSupport-1-c09) 打烊後他獨自拖地,店裡空無一人。
10. (job-physicalSupport-1-c10) 他對著收銀機的錯帳數字抓頭。
11. (job-physicalSupport-1-r01) 熟客笑著跟他打招呼,他也露出難得的笑容。
12. (job-physicalSupport-1-r02) 他牽著迷路的老太太走向公車站,老太太塞給他一顆糖。
13. (job-physicalSupport-1-r03) 他數著存錢筒裡的硬幣,一臉期待。
14. (job-physicalSupport-1-e01) 深夜的便利商店只剩他一人值班,窗外空無一人的街道映在玻璃上。
15. (job-physicalSupport-1-l01) 拉下鐵門的瞬間,他望著空蕩的街道,露出平靜的微笑。

## 分支A 2階:餐廳服務生

1. (job-physicalSupport-A-2-c01) 他端著一疊餐盤,手臂微微顫抖。
2. (job-physicalSupport-A-2-c02) 客人指著菜單抱怨,他耐心地陪笑解釋。
3. (job-physicalSupport-A-2-c03) 尖峰時段他在餐桌間快步穿梭,忙得團團轉。
4. (job-physicalSupport-A-2-c04) 他數著薄薄的小費,無奈苦笑。
5. (job-physicalSupport-A-2-c05) 好幾桌客人同時喊他,他手忙腳亂地應付。
6. (job-physicalSupport-A-2-c06) 一盤湯打翻在地,他尷尬地道歉並收拾。
7. (job-physicalSupport-A-2-c07) 客滿的餐廳裡他忙得暈頭轉向。
8. (job-physicalSupport-A-2-c08) 收工後他癱坐在椅子上,臉頰肌肉僵硬。
9. (job-physicalSupport-A-2-c09) 他熟練地背誦菜單內容給客人聽。
10. (job-physicalSupport-A-2-c10) 端了一整天餐盤,他癱坐著不想再動。
11. (job-physicalSupport-A-2-r01) 客人特地寫了張感謝小卡給他。
12. (job-physicalSupport-A-2-r02) 他微笑著幫一對吵架的情侶緩頰,兩人反而請他喝飲料。
13. (job-physicalSupport-A-2-r03) 他捧著意外收到的高額小費,驚喜地笑了。
14. (job-physicalSupport-A-2-e01) 深夜他一邊收拾空桌,一邊想著今天服務過的每張笑臉。
15. (job-physicalSupport-A-2-l01) 打烊後獨自擦拭桌子的他,在昏黃燈光下露出溫柔又疲憊的神情。

## 分支A 3階:護理師

1. (job-physicalSupport-A-3-c01) 他熟練地為病患量血壓,神情專注。
2. (job-physicalSupport-A-3-c02) 他握著針筒,手法俐落精準。
3. (job-physicalSupport-A-3-c03) 他埋首在交班報告的文件堆裡。
4. (job-physicalSupport-A-3-c04) 深夜病患按鈴,他瞬間從疲憊中清醒。
5. (job-physicalSupport-A-3-c05) 值班室裡他捧著泡麵狼吞虎嚥。
6. (job-physicalSupport-A-3-c06) 他脫下磨損的護理鞋,揉著發痛的腳。
7. (job-physicalSupport-A-3-c07) 激動的家屬對他訴說擔憂,他耐心安撫。
8. (job-physicalSupport-A-3-c08) 他熟練地為病患換藥,神情專注。
9. (job-physicalSupport-A-3-c09) 他終於喝上一口水,如釋重負。
10. (job-physicalSupport-A-3-c10) 他脫下口罩,臉上留著深深的壓痕。
11. (job-physicalSupport-A-3-r01) 出院的病患緊緊握著他的手道謝。
12. (job-physicalSupport-A-3-r02) 深夜他陪著害怕的孩子聊天,直到孩子安心睡去。
13. (job-physicalSupport-A-3-r03) 主管難得對他點頭稱讚,他一臉意外。
14. (job-physicalSupport-A-3-e01) 值完一整輪大夜班的他站在窗邊,望著天邊微亮的曙光。
15. (job-physicalSupport-A-3-l01) 送走康復出院的病患後,他站在走廊裡露出釋然的微笑。

## 分支A 4階:健身教練

1. (job-physicalSupport-A-4-c01) 他對著學員大喊加油,自己也揮汗如雨。
2. (job-physicalSupport-A-4-c02) 學員抱怨訓練太累,他一臉理所當然地聳肩。
3. (job-physicalSupport-A-4-c03) 他手裡拿著寫滿密密麻麻課表的板夾。
4. (job-physicalSupport-A-4-c04) 他親自示範動作,肌肉線條緊繃。
5. (job-physicalSupport-A-4-c05) 他看著帳單苦笑,身後是滿滿的健身器材。
6. (job-physicalSupport-A-4-c06) 健身房簡陋的伙食前,他還是硬吃下去補充體力。
7. (job-physicalSupport-A-4-c07) 他看著手錶,對遲到的學員露出無奈的表情。
8. (job-physicalSupport-A-4-c08) 他聲嘶力竭地喊著加油,喉嚨沙啞。
9. (job-physicalSupport-A-4-c09) 學員猛力舉重,他在旁邊緊張地護著。
10. (job-physicalSupport-A-4-c10) 收工後他一個人站在空蕩的健身房裡發呆。
11. (job-physicalSupport-A-4-r01) 學員瘦身成功,紅著眼眶向他道謝。
12. (job-physicalSupport-A-4-r02) 他接到新學員的電話,鬆了一口氣。
13. (job-physicalSupport-A-4-r03) 學員感激地看著他,他也露出感動的神情。
14. (job-physicalSupport-A-4-e01) 深夜的健身房裡,他獨自對著鏡子喊出那句熟悉的加油。
15. (job-physicalSupport-A-4-l01) 看著學員完成從未想過能做到的動作,他露出比學員還開心的笑容。

## 分支A 5階:急診室王牌護理長

1. (job-physicalSupport-A-5-c01) 警報聲響起,他率先衝向急診室。
2. (job-physicalSupport-A-5-c02) 他快速為傷患進行檢傷分類,神情冷靜銳利。
3. (job-physicalSupport-A-5-c03) 他一邊處理傷患,一邊指導慌張的新人。
4. (job-physicalSupport-A-5-c04) 整晚沒有坐下的他靠著牆稍作喘息。
5. (job-physicalSupport-A-5-c05) 值班表貼滿整面牆,他望著嘆氣。
6. (job-physicalSupport-A-5-c06) 崩潰的家屬前,他仍保持冷靜安撫著。
7. (job-physicalSupport-A-5-c07) 他熟練地推著急救設備車衝向病房。
8. (job-physicalSupport-A-5-c08) 交班時他聲音沙啞卻仍仔細交代每個細節。
9. (job-physicalSupport-A-5-c09) 同仁對他投以信賴的眼神,他只是疲憊地笑笑。
10. (job-physicalSupport-A-5-c10) 他脫下手套,手指已經泡得發皺。
11. (job-physicalSupport-A-5-r01) 家屬感激地跪下,他連忙扶起他們。
12. (job-physicalSupport-A-5-r02) 他捧著院方頒發的獎狀,神情五味雜陳。
13. (job-physicalSupport-A-5-r03) 新人敬佩地看著他,他只是淡然地笑笑。
14. (job-physicalSupport-A-5-e01) 連續搶救多位病患後,他站在空蕩的走廊裡,望著天花板深深呼出一口氣。
15. (job-physicalSupport-A-5-l01) 深夜病房終於安靜下來,他靜靜坐在護理站,眼神裡是深深的疲憊與堅定。

## 分支B 2階:空服員

1. (job-physicalSupport-B-2-c01) 他推著餐車,職業化的微笑下藏著疲憊。
2. (job-physicalSupport-B-2-c02) 亂流來襲,他穩穩端住托盤,神情鎮定。
3. (job-physicalSupport-B-2-c03) 他頂著時差的倦容站在艙門邊迎賓。
4. (job-physicalSupport-B-2-c04) 乘客按鈴不停,他保持標準的微笑應對。
5. (job-physicalSupport-B-2-c05) 他脫下高跟鞋揉著發痛的腳。
6. (job-physicalSupport-B-2-c06) 他推銷著免稅商品,笑容professional卻疲憊。
7. (job-physicalSupport-B-2-c07) 他對著麥克風唸著滾瓜爛熟的廣播詞。
8. (job-physicalSupport-B-2-c08) 長途航班結束,他的微笑肌肉僵硬地維持著。
9. (job-physicalSupport-B-2-c09) 他熟練地示範安全動作,姿勢標準。
10. (job-physicalSupport-B-2-c10) 落地後他拖著疲憊的行李箱走出機艙。
11. (job-physicalSupport-B-2-r01) 他讀著乘客寫的感謝信,露出感動的笑容。
12. (job-physicalSupport-B-2-r02) 一個小孩害怕飛行,他蹲下安撫,孩子下機前給了他一個擁抱。
13. (job-physicalSupport-B-2-r03) 他驚喜地體驗了一次商務艙服務的視角。
14. (job-physicalSupport-B-2-e01) 他站在異國機場的窗邊,望著陌生的天空,神情有些疲憊的鄉愁。
15. (job-physicalSupport-B-2-l01) 降落後看著乘客滿臉笑容走出機艙,他也露出欣慰的笑容。

## 分支B 3階:居家照護員

1. (job-physicalSupport-B-3-c01) 他小心翼翼地為長輩翻身,神情專注。
2. (job-physicalSupport-B-3-c02) 他耐心陪著長輩聊天,認真傾聽。
3. (job-physicalSupport-B-3-c03) 他熟練地為長輩換尿布,動作俐落。
4. (job-physicalSupport-B-3-c04) 長輩固執地拒絕吃藥,他耐心地連哄帶勸。
5. (job-physicalSupport-B-3-c05) 深夜他從睡夢中驚醒去照顧長輩。
6. (job-physicalSupport-B-3-c06) 他望著薄薄的薪資單,神情複雜。
7. (job-physicalSupport-B-3-c07) 長輩誤把他認成親人,他笑著沒有糾正。
8. (job-physicalSupport-B-3-c08) 他耐心地協助長輩做復健運動。
9. (job-physicalSupport-B-3-c09) 一天下來他揉著痠痛的腰背。
10. (job-physicalSupport-B-3-c10) 收工回家的他比被照顧的長輩還疲憊。
11. (job-physicalSupport-B-3-r01) 長輩的家人包了紅包感謝他的照顧。
12. (job-physicalSupport-B-3-r02) 長輩拉著他的手道謝,他眼眶微微泛紅。
13. (job-physicalSupport-B-3-r03) 他驚喜地發現長輩偷偷替他準備了點心。
14. (job-physicalSupport-B-3-e01) 深夜他陪著熟睡的長輩坐著,窗外月色安靜。
15. (job-physicalSupport-B-3-l01) 送走安詳離世的長輩後,他站在空蕩的房間裡,神情平靜又感傷。

## 分支B 4階:物理治療師

1. (job-physicalSupport-B-4-c01) 他為病患做關節鬆動術,自己的關節也隱隱作響。
2. (job-physicalSupport-B-4-c02) 他手裡拿著寫滿療程的板夾,神情專注。
3. (job-physicalSupport-B-4-c03) 病患痛得皺眉,他仍溫和堅定地繼續。
4. (job-physicalSupport-B-4-c04) 他為病患按摩到手指痠痛,自己卻無暇顧及。
5. (job-physicalSupport-B-4-c05) 診間外排著長長的候診人潮。
6. (job-physicalSupport-B-4-c06) 他親自示範復健動作,神情認真。
7. (job-physicalSupport-B-4-c07) 病患進步的笑容,是他最大的成就感來源。
8. (job-physicalSupport-B-4-c08) 一天做完多場療程,他講話有氣無力。
9. (job-physicalSupport-B-4-c09) 病患抱怨疼痛,他溫和地解釋復健的必要。
10. (job-physicalSupport-B-4-c10) 收工後他揉著自己僵硬的肩膀。
11. (job-physicalSupport-B-4-r01) 病患重新站起來走路,他跟著紅了眼眶。
12. (job-physicalSupport-B-4-r02) 診所門口排起長長的候診隊伍,他驚訝又欣慰。
13. (job-physicalSupport-B-4-r03) 他收到病患親手做的感謝卡片,露出感動的笑容。
14. (job-physicalSupport-B-4-e01) 深夜診間只剩他一人,回想著今天幫助過的每一位病患。
15. (job-physicalSupport-B-4-l01) 看著最頑固的病患終於能自己走出診間,他望著病患的背影,眼神堅定又欣慰。

## 分支B 5階:奧運隨隊防護員

1. (job-physicalSupport-B-5-c01) 賽前他比選手還緊張地來回踱步。
2. (job-physicalSupport-B-5-c02) 他手裡拿著滿滿的國際賽事行程表。
3. (job-physicalSupport-B-5-c03) 選手受傷倒下,他第一個衝上場救援。
4. (job-physicalSupport-B-5-c04) 帶著時差的倦容,他仍認真準備下一場比賽。
5. (job-physicalSupport-B-5-c05) 選手拿下獎牌,他在場邊激動地握拳。
6. (job-physicalSupport-B-5-c06) 他扛著比行李還重的裝備箱走進賽場。
7. (job-physicalSupport-B-5-c07) 鏡頭只對著選手,他默默地站在角落。
8. (job-physicalSupport-B-5-c08) 選手緊張到吃不下飯,他也陪著坐在一旁。
9. (job-physicalSupport-B-5-c09) 他咬牙忍著自己的痠痛,繼續照顧選手。
10. (job-physicalSupport-B-5-c10) 空蕩的選手村裡,他望著遠方,想起家的方向。
11. (job-physicalSupport-B-5-r01) 選手奪牌後第一個擁抱給了他,他感動得說不出話。
12. (job-physicalSupport-B-5-r02) 他捧著協會頒發的幕後功臣獎牌,笑容靦腆。
13. (job-physicalSupport-B-5-r03) 新進防護員敬佩地看著他,他只是謙虛地笑笑。
14. (job-physicalSupport-B-5-e01) 征戰過無數場國際賽事的他,靜靜看著選手訓練,眼神裡滿是感同身受。
15. (job-physicalSupport-B-5-l01) 站在頒獎台下望著選手戴上金牌,他露出比任何人都欣慰的笑容。
