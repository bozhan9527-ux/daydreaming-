import { Image, StyleSheet, View } from 'react-native';

// 直接裁切自使用者提供的參考UI設計圖(DAYDREAMING UI HOME SKIN V1.0,第2節「EASTER EGG
// BANNER FRAME」),套在首頁「點擊勇者觸發反應」的彩蛋反應框上。原圖是一對高聳的柱子
// (皇冠+紫色捲軸+象牙色柱身+盾牌徽章),不是單純的方形9宮格,所以拆成「柱頭+柱身+柱底」
// 三段(柱身可縱向伸縮,柱頭/柱底維持原比例不縮放,避免皇冠/盾牌變形),左右柱裁自參考圖
// 左側原圖並鏡像產生右柱,上下再各接一段素面金色鑲邊(裁自左右柱之間,避開中央徽章紋章,
// 才能左右伸縮不露出重複的紋章圖案)。
const SCALE = 34 / 83;
const PILLAR_W = 34;
const TOP_CAP_H = Math.round(82 * SCALE);
const BOTTOM_CAP_H = Math.round(30 * SCALE);
const EDGE_TOP_H = Math.round(45 * SCALE);
const EDGE_BOTTOM_H = Math.round(27 * SCALE);

const PILLAR_L_TOP = require('../assets/sprites/ui/frames/easteregg/pillarL_top.png');
const PILLAR_L_MID = require('../assets/sprites/ui/frames/easteregg/pillarL_mid.png');
const PILLAR_L_BOTTOM = require('../assets/sprites/ui/frames/easteregg/pillarL_bottom.png');
const PILLAR_R_TOP = require('../assets/sprites/ui/frames/easteregg/pillarR_top.png');
const PILLAR_R_MID = require('../assets/sprites/ui/frames/easteregg/pillarR_mid.png');
const PILLAR_R_BOTTOM = require('../assets/sprites/ui/frames/easteregg/pillarR_bottom.png');
const EDGE_TOP = require('../assets/sprites/ui/frames/easteregg/edge_top.png');
const EDGE_BOTTOM = require('../assets/sprites/ui/frames/easteregg/edge_bottom.png');

export function EasterEggFrame() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.hEdge, { top: 0, left: PILLAR_W, right: PILLAR_W, height: EDGE_TOP_H }]}>
        <Image source={EDGE_TOP} resizeMode="stretch" style={styles.fill} />
      </View>
      <View style={[styles.hEdge, { bottom: 0, left: PILLAR_W, right: PILLAR_W, height: EDGE_BOTTOM_H }]}>
        <Image source={EDGE_BOTTOM} resizeMode="stretch" style={styles.fill} />
      </View>

      <Image source={PILLAR_L_TOP} style={[styles.pillarPiece, { top: 0, left: 0, width: PILLAR_W, height: TOP_CAP_H }]} />
      {/* RN 的 Image 就算給了 resizeMode="stretch",沒有明確 height 數值時還是會退回原圖
          原生尺寸當版面高度,單靠 top+bottom 撐不開——外面包一層 View(View 沒有原生尺寸這個
          問題)讓 top+bottom 先撐出正確高度,裡面的 Image 再用 100%/100% 貼滿。 */}
      <View style={[styles.pillarPiece, { top: TOP_CAP_H, bottom: BOTTOM_CAP_H, left: 0, width: PILLAR_W }]}>
        <Image source={PILLAR_L_MID} resizeMode="stretch" style={styles.fill} />
      </View>
      <Image source={PILLAR_L_BOTTOM} style={[styles.pillarPiece, { bottom: 0, left: 0, width: PILLAR_W, height: BOTTOM_CAP_H }]} />

      <Image source={PILLAR_R_TOP} style={[styles.pillarPiece, { top: 0, right: 0, width: PILLAR_W, height: TOP_CAP_H }]} />
      <View style={[styles.pillarPiece, { top: TOP_CAP_H, bottom: BOTTOM_CAP_H, right: 0, width: PILLAR_W }]}>
        <Image source={PILLAR_R_MID} resizeMode="stretch" style={styles.fill} />
      </View>
      <Image source={PILLAR_R_BOTTOM} style={[styles.pillarPiece, { bottom: 0, right: 0, width: PILLAR_W, height: BOTTOM_CAP_H }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pillarPiece: {
    position: 'absolute',
  },
  hEdge: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
