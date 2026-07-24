import { EquipmentPanel } from './EquipmentPanel';

// 商店獨立成頂層分頁(原本要先進「背包」→「裝備」子分頁→再切「商店」子檢視,三層才到得了
// 核心的花錢買裝備迴圈,UX覆盤覺得太深):直接複用 EquipmentPanel,只是預設落在「商店」
// 子檢視——「已擁有」瀏覽功能還在「背包→裝備」原地,不重複維護一份商品清單邏輯。
export function ShopTab() {
  return <EquipmentPanel initialSubView="shop" />;
}
