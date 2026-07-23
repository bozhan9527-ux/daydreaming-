# 物理遠程職業彩蛋 AI 繪圖提示詞

用法跟物理近戰那份一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/physicalRanged.ts`),一次生成一組15張(建議排成5x3或3x5網格方便
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

## 1階:外送員(兩分支共用)

1. (job-physicalRanged-1-c01) 他盯著手機上一長串未完成的外送訂單,一臉頭痛。
2. (job-physicalRanged-1-c02) 他看著評分下降的通知,懊惱地抓頭。
3. (job-physicalRanged-1-c03) 電動車電量顯示紅燈,他推著車在路邊苦笑。
4. (job-physicalRanged-1-c04) 他捧著送錯的餐點,一臉尷尬地看著訂單備註。
5. (job-physicalRanged-1-c05) 他爬到公寓五樓,扶著牆喘氣,手上還提著外送箱。
6. (job-physicalRanged-1-c06) 他盯著手機平台介面的複雜數字,滿臉問號。
7. (job-physicalRanged-1-c07) 雨中他渾身濕透地騎著車,外送箱努力護在身前。
8. (job-physicalRanged-1-c08) 他準時把餐點交給客人,露出鬆一口氣的微笑。
9. (job-physicalRanged-1-c09) 他坐在路邊啃著冷掉的麵包,外送箱堆在旁邊。
10. (job-physicalRanged-1-c10) 他看著手機上的差評通知,一臉無言。
11. (job-physicalRanged-1-r01) 客人遞給他一疊小費,笑著說辛苦了。
12. (job-physicalRanged-1-r02) 深夜他站在一戶亮著燈的人家門口,對方微笑道謝。
13. (job-physicalRanged-1-r03) 他撿起路人掉落的錢包,轉身追上去歸還。
14. (job-physicalRanged-1-e01) 暴風雨中他仍騎著車送出最後一單,神情堅定。
15. (job-physicalRanged-1-l01) 他站在深夜空無一人的街頭,看著手機裡完成的最後一單,神情複雜。

## 分支A 2階:計程車司機

1. (job-physicalRanged-A-2-c01) 他握著方向盤看著導航顯示塞車,一臉無奈。
2. (job-physicalRanged-A-2-c02) 乘客在後座問路,他看著後照鏡苦笑。
3. (job-physicalRanged-A-2-c03) 他盯著跳動的計費表,表情緊張。
4. (job-physicalRanged-A-2-c04) 深夜車廂裡靜悄悄的,他從後照鏡緊張地觀察沉默的乘客。
5. (job-physicalRanged-A-2-c05) 他看著油價看板嘆氣,握緊方向盤。
6. (job-physicalRanged-A-2-c06) 他看著手機裡的五星評價通知,露出久違的笑容。
7. (job-physicalRanged-A-2-c07) 他熟練地倒車入庫,神情專注自信。
8. (job-physicalRanged-A-2-c08) 空車繞行的街道上,他一臉期待地張望。
9. (job-physicalRanged-A-2-c09) 乘客在後座傾訴煩惱,他一邊開車一邊點頭。
10. (job-physicalRanged-A-2-c10) 收工後他攤開地圖,一臉不敢置信地看著繞遠的路線。
11. (job-physicalRanged-A-2-r01) 他捧著乘客遺留的行李追上去,乘客感激道謝。
12. (job-physicalRanged-A-2-r02) 深夜他載著一位默默流淚的乘客,輕輕把音樂關小聲。
13. (job-physicalRanged-A-2-r03) 他驚喜地發現一條沒走過的捷徑,眼神發亮。
14. (job-physicalRanged-A-2-e01) 車上的老乘客對他露出安心的笑容,他也微笑回應。
15. (job-physicalRanged-A-2-l01) 深夜最後一位乘客下車前道謝,他坐在空蕩的車裡露出感動的神情。

## 分支A 3階:警察

1. (job-physicalRanged-A-3-c01) 他戴著警帽巡邏街頭,神情疲憊卻專注。
2. (job-physicalRanged-A-3-c02) 他手裡拿著開單本,一臉無奈地在寫。
3. (job-physicalRanged-A-3-c03) 值夜班的他頂著黑眼圈,眼神呆滯。
4. (job-physicalRanged-A-3-c04) 他爬上樹幫忙救下一隻貓,表情尷尬又認真。
5. (job-physicalRanged-A-3-c05) 他埋首在堆積如山的報告文件裡。
6. (job-physicalRanged-A-3-c06) 路人圍著他問路,他耐心地比手畫腳解釋。
7. (job-physicalRanged-A-3-c07) 同事調侃他太雞婆,他聳肩一笑帶過。
8. (job-physicalRanged-A-3-c08) 他捧著難喝的值班室咖啡,勉強喝下去。
9. (job-physicalRanged-A-3-c09) 他巡邏時看著自己在窗戶反射裡的黑眼圈苦笑。
10. (job-physicalRanged-A-3-c10) 他站在路口指揮交通,手臂痠得發抖。
11. (job-physicalRanged-A-3-r01) 一對母子向他道謝,小孩開心地抱著媽媽。
12. (job-physicalRanged-A-3-r02) 深夜他陪著一個徹夜未歸的少年走向公車站,兩人並肩沉默。
13. (job-physicalRanged-A-3-r03) 長官對他點頭肯定,他一臉意外。
14. (job-physicalRanged-A-3-e01) 他站在轄區街角,遠方似乎有什麼龐然大物正在繞道離開。
15. (job-physicalRanged-A-3-l01) 深夜送走一位迷惘的路人後,他望著漸亮的天空,神情釋然。

## 分支A 4階:職業獵人

1. (job-physicalRanged-A-4-c01) 他蹲在山林裡查看地上的獸跡,神情專注。
2. (job-physicalRanged-A-4-c02) 他站在無訊號的山頭,難得露出輕鬆的表情。
3. (job-physicalRanged-A-4-c03) 獵物逃跑後他無奈地啃著乾糧。
4. (job-physicalRanged-A-4-c04) 他揹著沉重獵槍走在崎嶇山路上,汗流浹背。
5. (job-physicalRanged-A-4-c05) 破損的帳篷下他將就地窩著過夜。
6. (job-physicalRanged-A-4-c06) 他數著微薄的委託費,望著自己破舊的靴子苦笑。
7. (job-physicalRanged-A-4-c07) 他仰望滿天星空,忘記自己原本的任務。
8. (job-physicalRanged-A-4-c08) 他踩進自己設下的陷阱,表情哭笑不得。
9. (job-physicalRanged-A-4-c09) 同行獵人對他比手勢示意安靜,他無奈點頭。
10. (job-physicalRanged-A-4-c10) 下山時他揹著沉重行囊,腳步蹣跚。
11. (job-physicalRanged-A-4-r01) 他小心翼翼抱著一隻受傷的幼獸,幼獸舔了舔他的手。
12. (job-physicalRanged-A-4-r02) 他撿起一把生鏽的舊獵刀,端詳著刀柄上陌生的名字。
13. (job-physicalRanged-A-4-r03) 委託人感激地多塞給他一筆酬勞。
14. (job-physicalRanged-A-4-e01) 山林深處,遠方的魔王正悄悄繞道避開他的方向。
15. (job-physicalRanged-A-4-l01) 山頂日出時分,他靜靜地望著遠方,神情前所未有地平靜。

## 分支A 5階:狙擊手

1. (job-physicalRanged-A-5-c01) 他趴伏在草叢裡一動不動,眼神專注地盯著遠方。
2. (job-physicalRanged-A-5-c02) 他伸手感受風向,神情冷靜精準。
3. (job-physicalRanged-A-5-c03) 透過瞄準鏡,他的視野裡只有一片安靜的荒野。
4. (job-physicalRanged-A-5-c04) 他趴了許久,腰部僵硬地微微顫抖。
5. (job-physicalRanged-A-5-c05) 任務完成後他喝下最後一口水,靜靜坐著。
6. (job-physicalRanged-A-5-c06) 他看著彈藥盒裡所剩無幾的子彈,苦笑搖頭。
7. (job-physicalRanged-A-5-c07) 他穿著偽裝服融入草叢,幾乎看不出人形。
8. (job-physicalRanged-A-5-c08) 他調整呼吸,手指緩緩靠近扳機。
9. (job-physicalRanged-A-5-c09) 撤離時他渾身僵硬地站起身。
10. (job-physicalRanged-A-5-c10) 他孤身站在無人知曉的荒野角落。
11. (job-physicalRanged-A-5-r01) 他捧著剛換來的新瞄準鏡,眼神滿足。
12. (job-physicalRanged-A-5-r02) 他趴了整晚觀察目標,對方卻早早熄燈就寢,他哭笑不得。
13. (job-physicalRanged-A-5-r03) 新人問他怕不怕孤獨,他望向遠方沉默地笑了笑。
14. (job-physicalRanged-A-5-e01) 他隱身在陰影中,無人見過他的臉,只留下傳說中的一擊。
15. (job-physicalRanged-A-5-l01) 扣下最後一次扳機後,他望著天空,神情複雜又釋然。

## 分支B 2階:貨車司機

1. (job-physicalRanged-B-2-c01) 他握著方向盤,眼神疲憊地望著漫長的公路。
2. (job-physicalRanged-B-2-c02) 他小心翼翼地固定車廂裡沉重的貨物。
3. (job-physicalRanged-B-2-c03) 休息站裡他捧著難喝的咖啡,勉強提神。
4. (job-physicalRanged-B-2-c04) 收音機重播著老歌,他一臉麻木地開著車。
5. (job-physicalRanged-B-2-c05) 他數著過路費收據,眉頭緊皺。
6. (job-physicalRanged-B-2-c06) 深夜車窗外一片漆黑,他的側臉映著儀表板微光。
7. (job-physicalRanged-B-2-c07) 他看著寫錯的送貨地址,一臉無言地調頭。
8. (job-physicalRanged-B-2-c08) 休息站的泡麵是他唯一的慰藉,他吃得很滿足。
9. (job-physicalRanged-B-2-c09) 儀表板故障燈亮起,他一臉擔憂地盯著。
10. (job-physicalRanged-B-2-c10) 收工後他沉默地靠在駕駛座上休息。
11. (job-physicalRanged-B-2-r01) 他幫路邊拋錨的車主接電瓶,對方感激地遞上飲料。
12. (job-physicalRanged-B-2-r02) 深夜遇到同行貨車閃燈致意,他也閃燈回應,露出微笑。
13. (job-physicalRanged-B-2-r03) 他驚喜地望著窗外一條風景優美的舊路。
14. (job-physicalRanged-B-2-e01) 他的貨車行駛在只有他熟悉的隱密捷徑上。
15. (job-physicalRanged-B-2-l01) 長途夜車後的日出時分,他望著窗外久違地露出笑容。

## 分支B 3階:保鑣

1. (job-physicalRanged-B-3-c01) 他挺直站崗,眼神銳利地掃視四周。
2. (job-physicalRanged-B-3-c02) 他看著雇主複雜的行程表,一臉頭痛。
3. (job-physicalRanged-B-3-c03) 悶熱的西裝下他滿頭大汗仍維持警戒姿態。
4. (job-physicalRanged-B-3-c04) 雇主嫌他表情太嚴肅,他面無表情地聳肩。
5. (job-physicalRanged-B-3-c05) 耳機裡毫無動靜,他豎耳專注等待。
6. (job-physicalRanged-B-3-c06) 深夜他睡覺時仍下意識地保持警覺。
7. (job-physicalRanged-B-3-c07) 行程延誤,他站在原地一臉無奈地等著。
8. (job-physicalRanged-B-3-c08) 戴著墨鏡的他眼神疲憊卻依然專注。
9. (job-physicalRanged-B-3-c09) 他站在人群外圍,安靜地注視全場。
10. (job-physicalRanged-B-3-c10) 收工後他才發現自己一整天沒說幾句話。
11. (job-physicalRanged-B-3-r01) 雇主難得對他說辛苦了,他愣了一下露出微笑。
12. (job-physicalRanged-B-3-r02) 他擋下一次意外推擠,雇主感激地拍拍他肩膀。
13. (job-physicalRanged-B-3-r03) 雇主的孩子送給他一張畫著他站崗身影的畫。
14. (job-physicalRanged-B-3-e01) 深夜他站在門口一整夜,無人察覺他的存在,卻穩穩守著。
15. (job-physicalRanged-B-3-l01) 雇主平安到家的那一刻,他終於卸下肩膀的緊繃,露出安心的神情。

## 分支B 4階:特技替身演員

1. (job-physicalRanged-B-4-c01) 他從高台墜落的瞬間定格,護具四散,表情鎮定。
2. (job-physicalRanged-B-4-c02) 化妝師在他臉上塗抹傷妝,他對著鏡子苦笑。
3. (job-physicalRanged-B-4-c03) 導演喊卡,他從地上狼狽地爬起來。
4. (job-physicalRanged-B-4-c04) 層層護具下他仍舊摔得鼻青臉腫。
5. (job-physicalRanged-B-4-c05) 演員在鏡頭前接受掌聲,他在角落揉著瘀青的手臂。
6. (job-physicalRanged-B-4-c06) 他看著片酬單,苦笑著搖頭。
7. (job-physicalRanged-B-4-c07) 爆破特效後他摀著耳朵,滿臉煙塵。
8. (job-physicalRanged-B-4-c08) 排練摔車動作,他摔得七葷八素。
9. (job-physicalRanged-B-4-c09) 鏡頭外他痛得說不出話,鏡頭前卻要裝作瀟灑。
10. (job-physicalRanged-B-4-c10) 收工後獨自坐在片場角落,無人問候。
11. (job-physicalRanged-B-4-r01) 導演終於記住他的名字,對他豎起大拇指。
12. (job-physicalRanged-B-4-r02) 演員私下請他吃飯,感謝他擋下危險動作。
13. (job-physicalRanged-B-4-r03) 螢幕上難得出現他的特寫鏡頭,他驚喜又緊張。
14. (job-physicalRanged-B-4-e01) 他身上傷疤斑斑,望著片場的燈光,眼神卻毫無悔意。
15. (job-physicalRanged-B-4-l01) 從高處墜落順利落地的瞬間,他仰望天空,神情釋然。

## 分支B 5階:頂尖鏢客

1. (job-physicalRanged-B-5-c01) 他騎馬押送鏢車,眼神警戒地掃視四周荒野。
2. (job-physicalRanged-B-5-c02) 委託人遞來一份沉甸甸的合約,他神情凝重。
3. (job-physicalRanged-B-5-c03) 路上的麻煩人物擋在他面前,他冷靜地按住武器。
4. (job-physicalRanged-B-5-c04) 貨物平安送達,他滿身傷痕地卸下裝備。
5. (job-physicalRanged-B-5-c05) 他數著微薄的酬勞,苦笑搖頭。
6. (job-physicalRanged-B-5-c06) 同行稱他傳說,他聳肩帶著疲憊的笑容。
7. (job-physicalRanged-B-5-c07) 馬蹄聲中他望著遠方地平線,神情堅定。
8. (job-physicalRanged-B-5-c08) 風沙滿面的他在天黑前終於抵達目的地。
9. (job-physicalRanged-B-5-c09) 委託越來越大膽,他的眼神也越來越銳利。
10. (job-physicalRanged-B-5-c10) 他望著空蕩蕩的路,想起自己很久沒為自己趕過路。
11. (job-physicalRanged-B-5-r01) 委託人塞給他一筆豐厚小費,感謝他一路的沉默陪伴。
12. (job-physicalRanged-B-5-r02) 打劫的匪徒一見他的臉便默默讓路。
13. (job-physicalRanged-B-5-r03) 新人鏢客敬畏地看著他,他只是平靜地整理裝備。
14. (job-physicalRanged-B-5-e01) 他策馬穿越荒漠,身影在夕陽下拉得很長,無人知曉他的代價。
15. (job-physicalRanged-B-5-l01) 送完傳說級的委託後,他卸下裝備獨自坐在篝火旁,神情複雜。
