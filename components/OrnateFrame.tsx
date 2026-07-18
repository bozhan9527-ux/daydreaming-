import { Image, StyleSheet, View } from 'react-native';

// 直接裁切自使用者提供的參考UI設計圖(彈窗 POPUP WINDOW 那組),不是程式重繪的邊框。
// 原圖是單張固定尺寸(155x141)的方形花紋外框,套用到任意大小的彈窗上需要「9宮格」式
// 局部縮放,不能整張硬拉伸(角落的花紋雕飾會被拉變形)——這裡手動拆成 4 個角(原生固定
// 尺寸不縮放)+ 4 段邊(只在單一方向縮放,填滿角與角之間的空隙),疊在彈窗最上層當純視覺
// 裝飾(外層 View 設 pointerEvents="none",不影響底下內容的觸控)。四個角只實際裁到左上/
// 左下兩個乾淨的(右上角原圖裡疊了紅色 X 關閉鈕,這裡不用,右上/右下用 PIL 翻轉左下角生成,
// 四角花紋才會對稱一致)。
const CORNER_SIZE = 26;
const EDGE_THICKNESS = 9;

const CORNER_TL = require('../assets/sprites/ui/frames/popup_corner_tl.png');
const CORNER_TR = require('../assets/sprites/ui/frames/popup_corner_tr.png');
const CORNER_BL = require('../assets/sprites/ui/frames/popup_corner_bl.png');
const CORNER_BR = require('../assets/sprites/ui/frames/popup_corner_br.png');
const EDGE_TOP = require('../assets/sprites/ui/frames/popup_edge_top.png');
const EDGE_BOTTOM = require('../assets/sprites/ui/frames/popup_edge_bottom.png');
const EDGE_LEFT = require('../assets/sprites/ui/frames/popup_edge_left.png');
const EDGE_RIGHT = require('../assets/sprites/ui/frames/popup_edge_right.png');

export function OrnateFrame() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={EDGE_TOP}
        resizeMode="stretch"
        style={[styles.edgeH, { top: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_THICKNESS }]}
      />
      <Image
        source={EDGE_BOTTOM}
        resizeMode="stretch"
        style={[styles.edgeH, { bottom: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_THICKNESS }]}
      />
      <Image
        source={EDGE_LEFT}
        resizeMode="stretch"
        style={[styles.edgeV, { left: 0, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_THICKNESS }]}
      />
      <Image
        source={EDGE_RIGHT}
        resizeMode="stretch"
        style={[styles.edgeV, { right: 0, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_THICKNESS }]}
      />
      <Image source={CORNER_TL} style={[styles.corner, { top: 0, left: 0 }]} />
      <Image source={CORNER_TR} style={[styles.corner, { top: 0, right: 0 }]} />
      <Image source={CORNER_BL} style={[styles.corner, { bottom: 0, left: 0 }]} />
      <Image source={CORNER_BR} style={[styles.corner, { bottom: 0, right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  edgeH: {
    position: 'absolute',
  },
  edgeV: {
    position: 'absolute',
  },
});
