# 魔法遠程職業彩蛋 AI 繪圖提示詞

用法跟前幾份一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/magicRanged.ts`),一次生成一組15張(建議排成5x3或3x5網格方便裁切),
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

## 1階:電競選手/實況主(兩分支共用)

1. (job-magicRanged-1-c01) 他盯著直播畫面,聊天室裡只有寥寥幾則留言。
2. (job-magicRanged-1-c02) 排位掉分的通知彈出,他抱頭懊惱。
3. (job-magicRanged-1-c03) 他雙手飛快地敲擊鍵盤,神情專注。
4. (job-magicRanged-1-c04) 彈幕嘲諷他的操作,他無奈地聳肩。
5. (job-magicRanged-1-c05) 深夜的房間裡只有螢幕的光映著他的黑眼圈。
6. (job-magicRanged-1-c06) 他望著空蕩的贊助欄位,自己刷了個小禮物給自己。
7. (job-magicRanged-1-c07) 斷線畫面彈出,他崩潰地抓頭。
8. (job-magicRanged-1-c08) 家人探頭疑惑地看著他對著螢幕大喊。
9. (job-magicRanged-1-c09) 螢幕上彈幕飛快滾動,他努力回應著每一句。
10. (job-magicRanged-1-c10) 他的房間裡堆滿各種電競設備。
11. (job-magicRanged-1-r01) 收到觀眾的第一份禮物通知,他興奮地截圖。
12. (job-magicRanged-1-r02) 訂閱數突破里程碑,他對著鏡頭開心地傻笑。
13. (job-magicRanged-1-r03) 他打出一波精彩操作,彈幕瞬間洗版讚美。
14. (job-magicRanged-1-e01) 深夜他獨自對著攝影機說話,螢幕外沒有觀眾,他仍然認真地說著。
15. (job-magicRanged-1-l01) 關掉直播後他望著空蕩的房間,眼神裡有一絲落寞又溫暖的懷念。

## 分支A 2階:軟體工程師

1. (job-magicRanged-A-2-c01) 他盯著滿螢幕的紅色錯誤訊息,一臉頭痛。
2. (job-magicRanged-A-2-c02) 他埋首在鍵盤前修著永遠修不完的 bug。
3. (job-magicRanged-A-2-c03) 主管站在他身後催促,他手忙腳亂地打字。
4. (job-magicRanged-A-2-c04) 他桌上堆滿咖啡杯,眼神卻依然清醒。
5. (job-magicRanged-A-2-c05) 冗長的視訊會議中,他神情呆滯地聽著。
6. (job-magicRanged-A-2-c06) 程式編譯成功的瞬間,他握拳歡呼。
7. (job-magicRanged-A-2-c07) 他看著加班費明細,苦笑搖頭。
8. (job-magicRanged-A-2-c08) 他盯著同事寫的程式碼,滿臉困惑。
9. (job-magicRanged-A-2-c09) 重構程式碼到一半,他自己也顯得筋疲力盡。
10. (job-magicRanged-A-2-c10) 深夜他獨自坐在辦公室,只有電腦螢幕發著光。
11. (job-magicRanged-A-2-r01) 主管難得對他的功能豎起大拇指。
12. (job-magicRanged-A-2-r02) 找到困擾多日的 bug,他興奮地跳起來。
13. (job-magicRanged-A-2-r03) 他捧著意外的獎金通知,笑容滿面。
14. (job-magicRanged-A-2-e01) 深夜的辦公室裡,只有他的螢幕還亮著,神情專注又疲憊。
15. (job-magicRanged-A-2-l01) 看著自己寫的程式順利運作,他望向窗外的城市夜景,露出滿足的微笑。

## 分支A 3階:研究員/科學家

1. (job-magicRanged-A-3-c01) 他盯著跑不出結果的實驗數據,滿臉焦慮。
2. (job-magicRanged-A-3-c02) 他捧著被退回的論文,神情沮喪。
3. (job-magicRanged-A-3-c03) 深夜的實驗室裡只有他跟儀器的低鳴。
4. (job-magicRanged-A-3-c04) 他看著經費申請表,眉頭深鎖。
5. (job-magicRanged-A-3-c05) 他埋首在堆積如山的文獻裡。
6. (job-magicRanged-A-3-c06) 他重新設定第十次的實驗參數,神情堅定。
7. (job-magicRanged-A-3-c07) 研討會台上他緊張地擦著手心的汗。
8. (job-magicRanged-A-3-c08) 他捧著第五杯咖啡,眼神卻依然疲憊。
9. (job-magicRanged-A-3-c09) 他走出實驗室,被陽光刺得瞇起眼睛。
10. (job-magicRanged-A-3-c10) 他盯著實驗數據,神情又燃起希望。
11. (job-magicRanged-A-3-r01) 收到論文接受通知,他興奮地跳起來。
12. (job-magicRanged-A-3-r02) 指導教授難得地對他點頭稱讚。
13. (job-magicRanged-A-3-r03) 意外的實驗結果讓他眼睛一亮。
14. (job-magicRanged-A-3-e01) 深夜的實驗室裡,他望著失敗的實驗記錄,眼神卻依然堅定。
15. (job-magicRanged-A-3-l01) 期待已久的數據終於跑出來的瞬間,他望著螢幕,眼眶微微濕潤。

## 分支A 4階:駭客

1. (job-magicRanged-A-4-c01) 昏暗房間裡他專注地破解著防火牆。
2. (job-magicRanged-A-4-c02) 深夜他盯著螢幕,眼神銳利又疲憊。
3. (job-magicRanged-A-4-c03) 委託金入帳的通知,讓他鬆了一口氣。
4. (job-magicRanged-A-4-c04) 天快亮了,他還在追查漏洞的源頭。
5. (job-magicRanged-A-4-c05) 戴著兜帽的他隱身在螢幕的藍光後。
6. (job-magicRanged-A-4-c06) 一行程式碼錯誤,他懊惱地抱頭。
7. (job-magicRanged-A-4-c07) 他層層設定加密連線,只為了一件小事。
8. (job-magicRanged-A-4-c08) 客戶的緊急訊息不斷彈出,他手速加快。
9. (job-magicRanged-A-4-c09) 只有螢幕的藍光照亮他疲憊的臉。
10. (job-magicRanged-A-4-c10) 窗外天色已亮,他才驚覺熬了一整夜。
11. (job-magicRanged-A-4-r01) 幫小公司找出資安漏洞,對方感激地多付酬勞。
12. (job-magicRanged-A-4-r02) 成功攔截攻擊的瞬間,他鬆了口氣露出微笑。
13. (job-magicRanged-A-4-r03) 論壇上匿名的讚美讓他會心一笑。
14. (job-magicRanged-A-4-e01) 深夜螢幕前,他的身影隱在陰影裡,只有專注的眼神清晰可見。
15. (job-magicRanged-A-4-l01) 成功擋下攻擊的深夜,他望著窗外沉睡的城市,神情釋然。

## 分支A 5階:AI天才工程師

1. (job-magicRanged-A-5-c01) 他盯著跑了一整晚的模型訓練進度條。
2. (job-magicRanged-A-5-c02) 桌上堆著沒洗的咖啡杯,他仍專注優化演算法。
3. (job-magicRanged-A-5-c03) 媒體鏡頭前他略顯疲憊地微笑應對。
4. (job-magicRanged-A-5-c04) 投資人熱切地與他握手,他卻打著哈欠。
5. (job-magicRanged-A-5-c05) 他盯著模型的錯誤結果,若有所思。
6. (job-magicRanged-A-5-c06) 深夜的會議室裡,團隊圍著他討論。
7. (job-magicRanged-A-5-c07) 演講廳裡座無虛席,他站在台上侃侃而談。
8. (job-magicRanged-A-5-c08) 新聞標題閃過,他盯著崩潰的程式碼苦笑。
9. (job-magicRanged-A-5-c09) 被稱為天才,他默默望著滿桌的咖啡杯。
10. (job-magicRanged-A-5-c10) 他終於坐下來吃了一頓像樣的飯,神情滿足。
11. (job-magicRanged-A-5-r01) 團隊成功解決業界難題,眾人歡呼擁抱。
12. (job-magicRanged-A-5-r02) 他讀著用戶的感謝信,露出溫暖的笑容。
13. (job-magicRanged-A-5-r03) 年輕工程師崇拜地看著他,他一時語塞。
14. (job-magicRanged-A-5-e01) 他獨自站在辦公室落地窗前,望著城市燈火,神情複雜。
15. (job-magicRanged-A-5-l01) 看著自己的系統真正幫助了一個人,他露出前所未有的踏實笑容。

## 分支B 2階:資料科學家

1. (job-magicRanged-B-2-c01) 他埋首清理著雜亂的數據表格。
2. (job-magicRanged-B-2-c02) 模型跑出的結果讓他自己都嚇了一跳。
3. (job-magicRanged-B-2-c03) 主管要求的報表,他手忙腳亂地趕製。
4. (job-magicRanged-B-2-c04) 他畫出精美的圖表,卻無人聆聽地站在會議室裡。
5. (job-magicRanged-B-2-c05) 桌上堆滿咖啡杯,螢幕上是密密麻麻的數據。
6. (job-magicRanged-B-2-c06) 準確率提升的通知,他只淡淡地喝了口手搖飲料慶祝。
7. (job-magicRanged-B-2-c07) 會議上被追問數字含意,他猶豫地思考著。
8. (job-magicRanged-B-2-c08) 程式當機的瞬間,他崩潰地捂臉。
9. (job-magicRanged-B-2-c09) 同事佩服地看著他,他只是疲憊地笑笑。
10. (job-magicRanged-B-2-c10) 他揉著乾澀的眼睛離開辦公室。
11. (job-magicRanged-B-2-r01) 分析結果幫公司省下成本,主管難得請客。
12. (job-magicRanged-B-2-r02) 他發現數據裡的有趣規律,興奮得睡不著。
13. (job-magicRanged-B-2-r03) 報告受到高層肯定,他驕傲地挺起胸膛。
14. (job-magicRanged-B-2-e01) 深夜他望著螢幕上雜亂的數據,神情若有所思。
15. (job-magicRanged-B-2-l01) 看著終於乾淨的數據集,他露出踏實的微笑。

## 分支B 3階:量子物理博士生

1. (job-magicRanged-B-3-c01) 白板寫滿公式,他發現前面推導錯了,一臉懊惱。
2. (job-magicRanged-B-3-c02) 指導教授的建議讓他一臉困惑地思考。
3. (job-magicRanged-B-3-c03) 他看著薄薄的獎學金存摺,苦笑搖頭。
4. (job-magicRanged-B-3-c04) 他小心翼翼地操作著精密的量子儀器。
5. (job-magicRanged-B-3-c05) 同學一臉茫然地聽他解釋研究內容。
6. (job-magicRanged-B-3-c06) 他盯著論文進度條,一臉焦慮。
7. (job-magicRanged-B-3-c07) 深夜實驗室裡只剩他跟嗡嗡作響的儀器。
8. (job-magicRanged-B-3-c08) 口試委員銳利的提問讓他手心冒汗。
9. (job-magicRanged-B-3-c09) 白板上密密麻麻的公式,他盯著發呆。
10. (job-magicRanged-B-3-c10) 他揉著疲憊的雙眼,走出空無一人的實驗室。
11. (job-magicRanged-B-3-r01) 指導教授看著意外的實驗結果,眼睛一亮。
12. (job-magicRanged-B-3-r02) 論文通過口試那刻,他整個人癱軟在椅子上。
13. (job-magicRanged-B-3-r03) 同學紛紛前來道賀,他靦腆地笑著。
14. (job-magicRanged-B-3-e01) 他站在寫滿公式的白板前,眼神迷茫又堅定。
15. (job-magicRanged-B-3-l01) 走出口試會議室的他,望著天空,露出如釋重負的笑容。

## 分支B 4階:密碼學專家

1. (job-magicRanged-B-4-c01) 他專注地破解一組複雜的加密演算法。
2. (job-magicRanged-B-4-c02) 客戶要求的加密強度,他認真核對每個細節。
3. (job-magicRanged-B-4-c03) 密鑰算錯的瞬間,他懊惱地重新開始。
4. (job-magicRanged-B-4-c04) 深夜他審查著程式碼,眼神疲憊卻專注。
5. (job-magicRanged-B-4-c05) 會議上滿是專有名詞,他認真解釋著。
6. (job-magicRanged-B-4-c06) 客戶催促上線,他仍謹慎地反覆驗證。
7. (job-magicRanged-B-4-c07) 桌上堆滿咖啡杯,他仍專注優化演算法。
8. (job-magicRanged-B-4-c08) 他捧著同行的論文,努力理解著。
9. (job-magicRanged-B-4-c09) 找出潛在漏洞,他只是平淡地喝口冷咖啡。
10. (job-magicRanged-B-4-c10) 窗外天色已亮,他才驚覺熬了一夜。
11. (job-magicRanged-B-4-r01) 幫金融機構抓出漏洞,對方感激涕零。
12. (job-magicRanged-B-4-r02) 他的加密演算法被業界採用,神情驕傲。
13. (job-magicRanged-B-4-r03) 他讀著匿名的感謝信,露出溫暖的笑容。
14. (job-magicRanged-B-4-e01) 深夜的螢幕前,他的身影安靜而堅定。
15. (job-magicRanged-B-4-l01) 擋下攻擊後的深夜,他望著窗外,神情平靜又欣慰。

## 分支B 5階:諾貝爾獎得主

1. (job-magicRanged-B-5-c01) 他被記者簇擁著,手裡卻拿著水電費帳單。
2. (job-magicRanged-B-5-c02) 媒體採訪不斷,他偷空瞥了一眼還沒關的實驗室燈。
3. (job-magicRanged-B-5-c03) 他站在講台前苦思得獎感言,神情認真。
4. (job-magicRanged-B-5-c04) 密密麻麻的行事曆前,他嘆了口氣。
5. (job-magicRanged-B-5-c05) 年輕學者恭敬地請教,他微笑著請對方坐下。
6. (job-magicRanged-B-5-c06) 他拿著獎金支票,轉身就填了研究經費申請單。
7. (job-magicRanged-B-5-c07) 記者追問成功秘訣,他淡然地笑了笑。
8. (job-magicRanged-B-5-c08) 被封為傳奇學者,他仍熬夜盯著實驗數據。
9. (job-magicRanged-B-5-c09) 演講邀約塞滿行事曆,他望著還沒寫完的論文苦笑。
10. (job-magicRanged-B-5-c10) 他望著窗外,才想起自己好幾年沒真正休息過。
11. (job-magicRanged-B-5-r01) 當年指導過的學生特地回來感謝他。
12. (job-magicRanged-B-5-r02) 他讀著陌生年輕人的來信,眼眶微微濕潤。
13. (job-magicRanged-B-5-r03) 新一代學者眼神裡的執著,讓他想起了年輕的自己。
14. (job-magicRanged-B-5-e01) 他站在領獎台側,望著台下的人群,神情複雜。
15. (job-magicRanged-B-5-l01) 站上頒獎台的瞬間,他閉上眼,想起了無數個不肯放棄的深夜。
