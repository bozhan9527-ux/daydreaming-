import { EquipmentPanel } from './EquipmentPanel';

// 商店獨立成頂層分頁(原本要先進「背包」→「裝備」子分頁→再切「商店」子檢視,三層才到得了
// 核心的花錢買裝備迴圈,UX覆盤覺得太深):直接複用 EquipmentPanel,mode="shop" 拿掉
// 「已擁有/商店」切換、只顯示可購買清單並疊價格標籤——「已擁有」瀏覽功能還在
// 「背包→裝備」原地(mode="browse"),不重複維護一份商品清單邏輯。
export function ShopTab() {
  return <EquipmentPanel mode="shop" />;
}
