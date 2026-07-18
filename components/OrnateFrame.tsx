import { NineSliceFrame } from './NineSliceFrame';

// 直接裁切自使用者提供的參考UI設計圖(彈窗 POPUP WINDOW 那組),不是程式重繪的邊框。
// 四個角只實際裁到左上/左下兩個乾淨的(右上角原圖裡疊了紅色 X 關閉鈕,這裡不用,右上/
// 右下用 PIL 翻轉左下角生成,四角花紋才會對稱一致)。組裝邏輯見 NineSliceFrame.tsx。
const CORNER_SIZE = 26;
const EDGE_THICKNESS = 9;

const PARTS = {
  topLeft: require('../assets/sprites/ui/frames/popup_corner_tl.png'),
  topRight: require('../assets/sprites/ui/frames/popup_corner_tr.png'),
  bottomLeft: require('../assets/sprites/ui/frames/popup_corner_bl.png'),
  bottomRight: require('../assets/sprites/ui/frames/popup_corner_br.png'),
  top: require('../assets/sprites/ui/frames/popup_edge_top.png'),
  bottom: require('../assets/sprites/ui/frames/popup_edge_bottom.png'),
  left: require('../assets/sprites/ui/frames/popup_edge_left.png'),
  right: require('../assets/sprites/ui/frames/popup_edge_right.png'),
};

export function OrnateFrame() {
  return <NineSliceFrame parts={PARTS} cornerSize={CORNER_SIZE} edgeThickness={EDGE_THICKNESS} />;
}
