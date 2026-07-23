# 物理近戰職業彩蛋 AI 繪圖提示詞

用法跟裝備美術一樣:每一組15則對應同一階級/分支的彩蛋文案(見
`game/events/jobEggs/physicalMelee.ts`),一次生成一組15張(建議排成5x3或3x5網格方便裁切),
生成完上傳到這個資料夾,跟開發那邊說一聲檔名,由開發那邊裁切成
`assets/sprites/events/<id>.png` 正式套用(id 對照下面每張後面括號裡的編號)。

## 圖片尺寸

單張裁切後目標尺寸 **16:9 橫幅、建議 640x360px**(對照現有 `assets/sprites/events/` 已上線的
彩蛋插圖,實際裁切後大約落在 220~400px 寬、137~185px 高,顯示框用 `resizeMode="cover"`
鋪滿,只要是橫幅、不要正方形或直幅都能裁得漂亮)。如果一次生成整組5x3網格,建議整張畫布開
**3200x1080px**(每格640x360),方便等分裁切,不用另外算奇怪的比例。

## 通用風格前綴(每組生成時都要加在提示詞最前面)

反推自現有角色圖 `assets/sprites/hero/jobs/physicalMelee.png`(像素風格,不是插畫風),
務必保持像素感,不要生成成平滑插畫:

```
16-bit pixel art character illustration, chibi/SD proportions, clearly visible blocky
pixelation and hard-edged shading (no smooth gradients, no anti-aliasing blur),
muted low-saturation Morandi color palette (dusty grays, muted olive-brown, faded
blue-gray). Protagonist: young man, short messy dark navy-blue hair, tired
half-lidded droopy eyes, world-weary bored expression, wearing a worn olive-gray
work vest over a plain dark shirt, dark pants, brown work boots and gloves — looks
like an underpaid temp worker, not a fantasy hero. Retro RPG game sprite portrait
style, flat soft lighting, slightly desaturated, 16:9 landscape scene composition,
no text in image.
```

---

## 1階:工讀生(兩分支共用)

1. (job-physicalMelee-1-c01) 我盯著手機上密密麻麻的打工排班表,一臉頭痛。
2. (job-physicalMelee-1-c02) 我數著薄薄的時薪收入,表情無奈。
3. (job-physicalMelee-1-c03) 店長在我面前念個不停,我低頭沉默地聽著。
4. (job-physicalMelee-1-c04) 我站在鏡子前練習自我介紹,表情僵硬又緊張。
5. (job-physicalMelee-1-c05) 我頂著黑眼圈站在深夜的收銀台後面。
6. (job-physicalMelee-1-c06) 同事們陸續打包離職,我一個人站在空蕩蕩的店裡。
7. (job-physicalMelee-1-c07) 我拿著剛列印出來的打工證明,表情有點驕傲。
8. (job-physicalMelee-1-c08) 打卡鐘顯示遲到,我一臉懊惱地看著螢幕。
9. (job-physicalMelee-1-c09) 一個顧客對著我比手畫腳抱怨,我面無表情地應付。
10. (job-physicalMelee-1-c10) 我被一堆雜物包圍,手忙腳亂地整理。
11. (job-physicalMelee-1-r01) 店長難得對我點頭稱讚,我愣住不知所措。
12. (job-physicalMelee-1-r02) 我數著存錢筒裡的硬幣,終於湊夠買新裝備。
13. (job-physicalMelee-1-r03) 同事偷偷遞給我一杯飲料,兩人相視一笑。
14. (job-physicalMelee-1-e01) 深夜打烊後我獨自拖地,身影被路燈拉得很長,神情卻很堅定。
15. (job-physicalMelee-1-l01) 我捧著人生第一張薪資單,看著上面的數字,眼神百感交集。

## 分支A 2階:搬運工

1. (job-physicalMelee-A-2-c01) 我扛著一大疊紙箱走到一半僵住,表情寫著「這工作到底跟打魔王有什麼差別」。
2. (job-physicalMelee-A-2-c02) 我彎腰扶著自己的腰,旁邊一個小紙箱寫著「這個很輕」的字條,表情苦笑。
3. (job-physicalMelee-A-2-c03) 我癱坐在樓梯間,滿身大汗,手裡還抓著一個紙箱的邊角。
4. (job-physicalMelee-A-2-c04) 一個寫著「易碎」的紙箱裂開,裡面滾出幾顆普通石頭,我一臉無言。
5. (job-physicalMelee-A-2-c05) 我看著手上薄薄一疊鈔票苦笑,背景是剛搬完的貨車。
6. (job-physicalMelee-A-2-c06) 我扛著一台舊冰箱,滿頭大汗但表情有點得意。
7. (job-physicalMelee-A-2-c07) 我手裡捏著兩張百元鈔,露出比平常燦爛一點的笑容。
8. (job-physicalMelee-A-2-c08) 我看著自己鼓起的手臂肌肉,表情尷尬又有點驕傲。
9. (job-physicalMelee-A-2-c09) 我站在貨車旁,一臉不服氣地看著催促我的司機背影。
10. (job-physicalMelee-A-2-c10) 我站在陌生的公寓門口,看著手上的地址紙條一臉茫然。
11. (job-physicalMelee-A-2-r01) 一隻小狗對著我狂吠,我舉著紙箱一臉委屈往後退。
12. (job-physicalMelee-A-2-r02) 我攤開空空的口袋,身後是搬空的貨車,表情無奈。
13. (job-physicalMelee-A-2-r03) 我捧著一個發光的古董花瓶,表情驚訝又竊喜。
14. (job-physicalMelee-A-2-e01) 一口老舊木箱張開嘴巴模樣的裂縫,像在說話,我蹲下來一臉驚奇地聽著。
15. (job-physicalMelee-A-2-l01) 我獨自扛著一件巨大到快壓垮自己的行李箱,背影在昏黃路燈下拉得很長,神情複雜。

## 分支A 3階:工地師傅

1. (job-physicalMelee-A-3-c01) 我戴著安全帽站在鋼筋堆旁,一臉「這比我老闆好處多了」的表情。
2. (job-physicalMelee-A-3-c02) 我坐在鷹架邊緣,安全帽扣得緊緊的,神情意外放鬆。
3. (job-physicalMelee-A-3-c03) 我看著進度表上一堆延遲的紅字,聳肩一笑。
4. (job-physicalMelee-A-3-c04) 監工在我面前比手畫腳念個不停,我一臉麻木地放空。
5. (job-physicalMelee-A-3-c05) 我靠在鷹架上打瞌睡,安全帽歪到一邊。
6. (job-physicalMelee-A-3-c06) 我拿著驗收表核對牆面,表情比驗收自己人生還認真。
7. (job-physicalMelee-A-3-c07) 工班同事對我比讚,我擦著汗露出無奈笑容。
8. (job-physicalMelee-A-3-c08) 我握著灌漿管,水泥噴到臉上,表情呆滯。
9. (job-physicalMelee-A-3-c09) 我捧著鐵盒便當,眼神比看到寶藏還亮。
10. (job-physicalMelee-A-3-c10) 安全帽掉在地上滾遠,我摸著頭一臉清醒錯愕。
11. (job-physicalMelee-A-3-r01) 老闆指著藍圖比手畫腳,我一臉「你在說夢話」的表情。
12. (job-physicalMelee-A-3-r02) 我撿起一張畫著奇怪路線的圖紙,一臉困惑端詳。
13. (job-physicalMelee-A-3-r03) 監工難得對我點頭稱讚,我反而一臉懷疑。
14. (job-physicalMelee-A-3-e01) 我站在剛完工的高樓頂樓俯瞰城市,表情恍然大悟又有點惆悵。
15. (job-physicalMelee-A-3-l01) 我站在封頂的大樓前抬頭仰望,夕陽把我的影子拉得很長,神情若有所思。

## 分支A 4階:消防員

1. (job-physicalMelee-A-4-c01) 我率先衝進濃煙,防火衣被火光映得通紅,眼神堅定。
2. (job-physicalMelee-A-4-c02) 我握著水柱瞄準遠方,水花四濺,表情專注又疲憊。
3. (job-physicalMelee-A-4-c03) 我坐在消防車旁算著薄薄的津貼單,苦笑搖頭。
4. (job-physicalMelee-A-4-c04) 消防車呼嘯而過,我從車窗探出頭,頭盔被風吹得歪斜。
5. (job-physicalMelee-A-4-c05) 我懷裡抱著一隻嚇壞的小貓,自己也是滿臉煙灰。
6. (job-physicalMelee-A-4-c06) 我脫下防火面罩,滿臉汗水,眼神卻還很銳利。
7. (job-physicalMelee-A-4-c07) 我在值班室吃著泡麵,眼神放空又滿足。
8. (job-physicalMelee-A-4-c08) 警報燈閃爍,我從椅子上彈起,眼神瞬間清醒。
9. (job-physicalMelee-A-4-c09) 我坐在救護車旁,自己也被披上了毯子,表情虛脫。
10. (job-physicalMelee-A-4-c10) 同事拍拍我肩膀勸我休息,我擺擺手一臉倔強。
11. (job-physicalMelee-A-4-r01) 我手裡拿著一枚燒黑的戒指,望著已成廢墟的房子若有所思。
12. (job-physicalMelee-A-4-r02) 隊長拍我肩膀稱讚,我手裡的獎金信封卻薄得可憐。
13. (job-physicalMelee-A-4-r03) 一隻毛茸茸的小怪物對我鞠躬道謝,我一臉驚訝。
14. (job-physicalMelee-A-4-e01) 我站在一條望不到底、門後還是門的走廊裡,苦笑著回頭看鏡頭。
15. (job-physicalMelee-A-4-l01) 我站在剛撲滅的火場廢墟前,望著自己映在積水裡的倒影,神情複雜。

## 分支A 5階:特種部隊

1. (job-physicalMelee-A-5-c01) 我盯著一疊複雜到看不懂的任務簡報,滿臉問號。
2. (job-physicalMelee-A-5-c02) 我潛伏在暗處比出手勢,眼神銳利,身後戰果卻只值幾個小錢。
3. (job-physicalMelee-A-5-c03) 我趴在夜色中的屋頂,望遠鏡裡是熟睡的怪物。
4. (job-physicalMelee-A-5-c04) 隊友對我比手勢示意安靜,我無奈聳肩。
5. (job-physicalMelee-A-5-c05) 任務結束,我滿身泥巴地敬禮,表情哭笑不得。
6. (job-physicalMelee-A-5-c06) 我看著自己一身昂貴裝備,再看看空空的錢包,表情複雜。
7. (job-physicalMelee-A-5-c07) 我在障礙場上練到癱軟,教官在旁邊喊口令。
8. (job-physicalMelee-A-5-c08) 我舉著壞掉的夜視鏡,在黑暗中瞇眼摸索。
9. (job-physicalMelee-A-5-c09) 任務板上寫著威風的代號,我手裡卻拿著一份跑腿清單。
10. (job-physicalMelee-A-5-c10) 撤退訊號閃爍,我孤身站在原地,四下無人。
11. (job-physicalMelee-A-5-r01) 我鄭重地捧著一個普通的舊皮夾,表情哭笑不得。
12. (job-physicalMelee-A-5-r02) 我潛伏三天滿臉鬍渣,面前空無一物。
13. (job-physicalMelee-A-5-r03) 老兵們圍坐在營火旁,我的側臉在火光中顯得滄桑。
14. (job-physicalMelee-A-5-e01) 我站在一個看起來毫不起眼的路人身後守護著,神情肅穆。
15. (job-physicalMelee-A-5-l01) 我卸下裝備獨自坐在夜色中,望著遠方城市燈火,神情釋然又疲憊。

## 分支B 2階:拳擊館學員

1. (job-physicalMelee-B-2-c01) 我對著沙包猛揮拳,汗水四濺,神情投入。
2. (job-physicalMelee-B-2-c02) 教練指著我鬆散的拳架搖頭,我尷尬地重新擺架式。
3. (job-physicalMelee-B-2-c03) 我跳繩跳到雙腿發抖,表情快撐不住。
4. (job-physicalMelee-B-2-c04) 我咬著護齒對著鏡子練習,表情有點滑稽認真。
5. (job-physicalMelee-B-2-c05) 賽後我狼吞虎嚥吃著三碗飯,表情滿足。
6. (job-physicalMelee-B-2-c06) 我看著陪練費帳單一臉苦惱,身後是拳擊台。
7. (job-physicalMelee-B-2-c07) 我對著鏡子練習自信的表情,自己都覺得好笑。
8. (job-physicalMelee-B-2-c08) 教練在場邊大喊加油,我氣喘吁吁地揮拳。
9. (job-physicalMelee-B-2-c09) 我站在體重計上,連呼吸都不敢用力。
10. (job-physicalMelee-B-2-c10) 我癱坐在拳擊場邊,比對手還喘。
11. (job-physicalMelee-B-2-r01) 我舉著一顆過期巧克力當獎盃,一臉哭笑不得。
12. (job-physicalMelee-B-2-r02) 教練認真地拍我肩膀稱讚,我一臉懷疑。
13. (job-physicalMelee-B-2-r03) 拳館老闆攤手表示沒錢,我無奈看著薪資表。
14. (job-physicalMelee-B-2-e01) 深夜我獨自對著鏡子出拳,眼神專注而孤獨。
15. (job-physicalMelee-B-2-l01) 友誼賽結束後我坐在角落,看著自己纏著繃帶的拳頭,若有所思。

## 分支B 3階:拳擊教練

1. (job-physicalMelee-B-3-c01) 我握著學員的拳頭調整姿勢,神情認真又溫和。
2. (job-physicalMelee-B-3-c02) 學員抱怨我太嚴格,我雙手抱胸一臉理所當然。
3. (job-physicalMelee-B-3-c03) 我看著拳館租金帳單嘆氣,拳套卻繫得更緊。
4. (job-physicalMelee-B-3-c04) 我陪練到一半忘我地打出重拳,學員在旁邊傻眼。
5. (job-physicalMelee-B-3-c05) 我看著學員的成績單,表情五味雜陳。
6. (job-physicalMelee-B-3-c06) 我在白板上畫滿訓練菜單,神情比作戰計畫還嚴肅。
7. (job-physicalMelee-B-3-c07) 我戴著磨損的舊護具,眼神卻炯炯有神。
8. (job-physicalMelee-B-3-c08) 椅子壞掉散了架,我站著繼續講解毫不在意。
9. (job-physicalMelee-B-3-c09) 學員問我為什麼還在打,我望向遠方沉默一下。
10. (job-physicalMelee-B-3-c10) 訓練結束我滿身大汗癱坐,比學員還狼狽。
11. (job-physicalMelee-B-3-r01) 我捧著一雙新拳套,笑容裡藏著一點心酸。
12. (job-physicalMelee-B-3-r02) 深夜拳館燈光下,我獨自對著空氣揮拳,窗外鄰居探頭張望。
13. (job-physicalMelee-B-3-r03) 學員對我說想活得像我一樣,我愣住後露出感動的笑。
14. (job-physicalMelee-B-3-e01) 退役多年的我仍每天走進空蕩蕩的拳館,對著鏡子擺出架式。
15. (job-physicalMelee-B-3-l01) 我站在擂台邊看著學員出拳,眼神裡有欣慰也有自己的影子。

## 分支B 4階:職業拳擊手

1. (job-physicalMelee-B-4-c01) 我看著簽約金支票,再看看經紀費帳單,表情失落。
2. (job-physicalMelee-B-4-c02) 我對著體重計愁眉苦臉,桌上放著沒吃的食物。
3. (job-physicalMelee-B-4-c03) 對手在我面前滔滔不絕挑釁,我面無表情。
4. (job-physicalMelee-B-4-c04) 我捧著沉甸甸的獎盃,錢包卻輕飄飄的。
5. (job-physicalMelee-B-4-c05) 麥克風包圍著我,記者逼問,我滿臉為難。
6. (job-physicalMelee-B-4-c06) 我看著訓練基地簡陋的伙食一臉無奈,還是硬吃下去。
7. (job-physicalMelee-B-4-c07) 我簽著拳套上的名字,身後是賣不完的門票海報。
8. (job-physicalMelee-B-4-c08) 賽前夜我瞪著天花板失眠,對手房間卻傳來鼾聲。
9. (job-physicalMelee-B-4-c09) 慶功宴上只有一碗泡麵,我舉杯自嘲。
10. (job-physicalMelee-B-4-c10) 我貼著繃帶走向擂台,腳步卻依然堅定。
11. (job-physicalMelee-B-4-r01) 我握著這個月的獎金支票,鬆了一口氣。
12. (job-physicalMelee-B-4-r02) 賽後對手向我伸手致謝,兩人相視一笑。
13. (job-physicalMelee-B-4-r03) 我舉著一瓶止痛藥代言海報,表情哭笑不得。
14. (job-physicalMelee-B-4-e01) 我倒地又站起,一次又一次,眼神卻越來越亮。
15. (job-physicalMelee-B-4-l01) 世界冠軍賽後我站在擂台中央大口喘氣,眼神裡是劫後餘生的釋然。

## 分支B 5階:傳說拳王

1. (job-physicalMelee-B-5-c01) 我戴著閃亮腰帶走出家門,面對的卻是一疊帳單。
2. (job-physicalMelee-B-5-c02) 粉絲對我歡呼,我望著手機裡的存款數字苦笑。
3. (job-physicalMelee-B-5-c03) 記者又問退休計畫,我笑著繫緊拳套沒有回答。
4. (job-physicalMelee-B-5-c04) 一排挑戰者站在我面前,獎金卻寫著越來越小的數字。
5. (job-physicalMelee-B-5-c05) 我站在山頂般的領獎台上,眼神卻望向遠方的低谷。
6. (job-physicalMelee-B-5-c06) 傳說級的獎盃旁,我數著薄薄的鈔票苦笑。
7. (job-physicalMelee-B-5-c07) 我依然在訓練場揮汗如雨,不因傳說之名而鬆懈。
8. (job-physicalMelee-B-5-c08) 有人問我怕不怕輸,我望向擂台深處,眼神堅定。
9. (job-physicalMelee-B-5-c09) 我扛著沉重的腰帶,肩膀微微下沉。
10. (job-physicalMelee-B-5-c10) 鎂光燈下我被封為傳奇,自己卻只是疲憊地笑笑。
11. (job-physicalMelee-B-5-r01) 我讀著一封信,眼眶微微泛紅,信紙上是曾經對手的感謝。
12. (job-physicalMelee-B-5-r02) 退休話題又被提起,我只是笑著繼續綁緊拳套。
13. (job-physicalMelee-B-5-r03) 新人挑戰者眼神銳利地看著我,我忽然想起了年輕的自己。
14. (job-physicalMelee-B-5-e01) 最後一戰前夜,我獨自摩挲著腰帶,神情五味雜陳。
15. (job-physicalMelee-B-5-l01) 我站在萬眾矚目的最高處,望著台下人群,眼神裡卻是深深的孤獨。
