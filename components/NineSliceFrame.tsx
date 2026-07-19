import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

// 通用「9宮格」外框元件:把一張固定尺寸的花紋外框圖拆成 4 角(原生尺寸不縮放,保留花紋
// 雕飾細節)+ 4 段邊(單方向縮放,填滿角與角之間的空隙)後,疊在任意尺寸的容器上——不能
// 把整張圖直接 resizeMode="stretch" 貼滿容器,長寬比跟原圖差太多時角落花紋會被拉伸變形、
// 邊框粗細也會跟著跑掉,套在長方形插槽上尤其明顯(見 OrnateFrame.tsx 的裁切說明,兩處
// 共用同一套做法)。
export interface NineSliceParts {
  topLeft: ImageSourcePropType;
  topRight: ImageSourcePropType;
  bottomLeft: ImageSourcePropType;
  bottomRight: ImageSourcePropType;
  top: ImageSourcePropType;
  bottom: ImageSourcePropType;
  left: ImageSourcePropType;
  right: ImageSourcePropType;
}

interface NineSliceFrameProps {
  parts: NineSliceParts;
  cornerSize: number;
  edgeThickness: number;
}

export function NineSliceFrame({ parts, cornerSize, edgeThickness }: NineSliceFrameProps) {
  // RN 的 Image 就算給了 resizeMode="stretch",只用 top+bottom(或 left+right)兩個相對
  // 邊界撐版面、沒給明確的 width/height 數值時,還是會退回原圖原生尺寸當版面大小,邊框段
  // 就會卡在原生寬度貼在角落旁邊、填不滿角與角之間的空隙(留一塊沒畫到的空白)。外面包一層
  // View(View 沒有原生尺寸這個問題,top+bottom/left+right 能正常撐出正確大小)、裡面的
  // Image 再用 100%/100% 貼滿,才會真的填滿整段邊。
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.edge, { top: 0, left: cornerSize, right: cornerSize, height: edgeThickness }]}>
        <Image source={parts.top} resizeMode="stretch" style={styles.fill} />
      </View>
      <View style={[styles.edge, { bottom: 0, left: cornerSize, right: cornerSize, height: edgeThickness }]}>
        <Image source={parts.bottom} resizeMode="stretch" style={styles.fill} />
      </View>
      <View style={[styles.edge, { left: 0, top: cornerSize, bottom: cornerSize, width: edgeThickness }]}>
        <Image source={parts.left} resizeMode="stretch" style={styles.fill} />
      </View>
      <View style={[styles.edge, { right: 0, top: cornerSize, bottom: cornerSize, width: edgeThickness }]}>
        <Image source={parts.right} resizeMode="stretch" style={styles.fill} />
      </View>
      <Image source={parts.topLeft} style={[styles.corner, { top: 0, left: 0, width: cornerSize, height: cornerSize }]} />
      <Image source={parts.topRight} style={[styles.corner, { top: 0, right: 0, width: cornerSize, height: cornerSize }]} />
      <Image source={parts.bottomLeft} style={[styles.corner, { bottom: 0, left: 0, width: cornerSize, height: cornerSize }]} />
      <Image source={parts.bottomRight} style={[styles.corner, { bottom: 0, right: 0, width: cornerSize, height: cornerSize }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
  },
  edge: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
