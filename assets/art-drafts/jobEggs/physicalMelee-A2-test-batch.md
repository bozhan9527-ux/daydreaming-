# 測試批次:物理近戰 分支A 2階(搬運工)

第一次測試整條「文案→提示詞→AI生成→裁切套用」流程用的最小批次,只有15張,對應
`game/events/jobEggs/physicalMelee.ts` 裡 `job-physicalMelee-A-2-*` 那15則。

## 風格參考

生成前可以先把這兩張已經上線的美術設定圖丟給AI繪圖工具當風格參考(調色盤/畫風一致):
- `assets/sprites/backgrounds/ai/physicalMelee_tier1.png`(物理近戰1階「工讀生」的既有設定圖)

2階還沒有既有的職業美術可以參考(tier2職業美術目前只有草稿資料夾還沒生成),所以先用1階的
畫風當基準,搬運工的角色設定(灰藍工作服、疲憊神情)則照下面的通用風格前綴描述。

## 圖片尺寸

16:9 橫幅,單張建議 640x360px;整組15張一次生成排 5x3 網格的話畫布開 3200x1080px。

## 通用風格前綴(加在每張提示詞最前面)

```
Semi-realistic anime illustration, muted low-saturation Morandi color palette
(dusty grays, soft browns, faded blues), melancholic but cute mood, slice-of-life
comedy tone. Protagonist: young man, short dark navy hair, tired half-lidded eyes,
wearing a worn dark jacket over a plain shirt, modern casual clothes (not fantasy
armor) — he looks like a bored temp worker, not a hero. Portrait/scene composition,
16:9 landscape aspect ratio, soft flat lighting, slightly desaturated, no text in
image.
```

## 15張場景提示詞

1. (job-physicalMelee-A-2-c01) 他扛著一大疊紙箱走到一半僵住,表情寫著「這工作到底跟打魔王有什麼差別」。
2. (job-physicalMelee-A-2-c02) 他彎腰扶著自己的腰,旁邊一個小紙箱寫著「這個很輕」的字條,表情苦笑。
3. (job-physicalMelee-A-2-c03) 他癱坐在樓梯間,滿身大汗,手裡還抓著一個紙箱的邊角。
4. (job-physicalMelee-A-2-c04) 一個寫著「易碎」的紙箱裂開,裡面滾出幾顆普通石頭,他一臉無言。
5. (job-physicalMelee-A-2-c05) 他看著手上薄薄一疊鈔票苦笑,背景是剛搬完的貨車。
6. (job-physicalMelee-A-2-c06) 他扛著一台舊冰箱,滿頭大汗但表情有點得意。
7. (job-physicalMelee-A-2-c07) 他手裡捏著兩張百元鈔,露出比平常燦爛一點的笑容。
8. (job-physicalMelee-A-2-c08) 他看著自己鼓起的手臂肌肉,表情尷尬又有點驕傲。
9. (job-physicalMelee-A-2-c09) 他站在貨車旁,一臉不服氣地看著催促他的司機背影。
10. (job-physicalMelee-A-2-c10) 他站在陌生的公寓門口,看著手上的地址紙條一臉茫然。
11. (job-physicalMelee-A-2-r01) 一隻小狗對著他狂吠,他舉著紙箱一臉委屈往後退。
12. (job-physicalMelee-A-2-r02) 他攤開空空的口袋,身後是搬空的貨車,表情無奈。
13. (job-physicalMelee-A-2-r03) 他捧著一個發光的古董花瓶,表情驚訝又竊喜。
14. (job-physicalMelee-A-2-e01) 一口老舊木箱張開嘴巴模樣的裂縫,像在說話,他蹲下來一臉驚奇地聽著。
15. (job-physicalMelee-A-2-l01) 他獨自扛著一件巨大到快壓垮自己的行李箱,背影在昏黃路燈下拉得很長,神情複雜。
