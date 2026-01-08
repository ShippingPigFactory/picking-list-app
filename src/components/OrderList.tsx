import React, { useMemo } from 'react';
import type { OrderItem } from '../types';
// ▼ findJanCode を追加インポート
import { calculateSetCount, findJanCode } from '@/utils/itemCalculations';
import { SELECTABLE_SERIES_SKU_MAP } from '@/utils/exceptionProducts';

interface Props {
  data: OrderItem[];
  sheet: string[][];
  title: string;
  currentView: 'order' | 'multi'; 
}

const OrderList: React.FC<Props> = ({ data, sheet, title, currentView }) => {
  // ... (省略: excludedItems, excludedItemsCount, uniqueOrderCount のロジックはそのまま) ...

  return (
    <div className="list-wrapper">
      {/* ... (ヘッダー部分はそのまま) ... */}
      
      <div className="list-scroller">
        <table>
          <thead>
            {/* ... (th部分はそのまま) ... */}
          </thead>
          <tbody>
            {data.map((item, index) => {
              const itemCode = item['商品コード'];
              const itemSku = item['商品SKU'];

              const isFound =
                (itemCode && sheet.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase())) ||
                (itemSku && sheet.some(row => row[16]?.toLowerCase() === itemSku.toLowerCase()));

              const isExcluded = !isFound;

              let totalQuantity: number;
              
              // ▼▼▼ 修正箇所: マスタからJANを取得する ▼▼▼
              // 「注文リスト」タブの場合、ここでマスタを検索してJANを取得
              // 「複数個注文」タブの場合、page.tsxですでに計算済み(修正版)のものを使う
              let displayJan = "";

              if (currentView === 'order') {
                const setCount = calculateSetCount(item, sheet);
                const csvQuantity = parseInt(item['個数'], 10) || 0;
                totalQuantity = setCount * csvQuantity;
                
                // ★マスタからJANを取得 (見つからなければ空文字)
                displayJan = findJanCode(item, sheet);
                
                // ★ログ出力
                console.log(`[注文リスト] SKU: ${itemSku} | 注文数: ${csvQuantity} | マスタJAN: ${displayJan || '(なし)'}`);

              } else {
                totalQuantity = item['計算後総個数']!; 
                // page.tsx でマスタのみ取得するように修正されるため、そのまま使用
                displayJan = item['JANコード'];
              }
              // ▲▲▲ 修正箇所終了 ▲▲▲

              const isSelectableSeries = itemSku ? SELECTABLE_SERIES_SKU_MAP[itemSku] === true : false;

              return (
                <tr key={`${item.受注番号}-${index}`} className={isExcluded ? 'excluded-row' : ''}>
                  <td>{item['注文日時']}</td>
                  <td>{item['配送方法(複数配送先)']}</td>
                  <td>{item['GoQ管理番号']}</td>
                  <td>{item['受注番号']}</td>
                  <td>{item['送付先氏名']}</td>
                  <td className="itemName">{item['商品名']}</td>
                  {currentView === 'order' ? (
                    <>
                      <td style={{ textAlign: "center" }}>{item['個数']}</td>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>{totalQuantity}</td>
                    </>
                  ) : (
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      {isSelectableSeries ? totalQuantity : item['個数']}
                    </td>
                  )}
                  {/* ▼▼▼ 修正箇所: CSVのJANではなく、取得した displayJan を表示 ▼▼▼ */}
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {displayJan ? displayJan.slice(-4) : ''}
                  </td>
                  {/* ▲▲▲ 修正箇所終了 ▲▲▲ */}
                  <td>{item['商品コード']}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;