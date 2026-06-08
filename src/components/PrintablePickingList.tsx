import React from 'react';
import type { OrderItem, PickingItemRow } from "../types";
import { formatJanDisplay } from '@/utils/janDisplayHelper';
import { isSpecialQuantityCalculationRequired } from '@/utils/janCheckProducts';

interface PrintableProps {
  pickingList: PickingItemRow[];
  shippingMethod: string;
  loadedAt: string;
  totalSingleUnits: number;
  multiItemOrders: OrderItem[];
  janCheckOrders: OrderItem[];
  anomalyOrders: OrderItem[];
  shippingNotes: string[];
  uniqueOrderCount: number;
  sheet: string[][];
}

const ProductTableColGroup = () => (
  <colgroup>
    <col style={{ width: '3%' }} />
    <col style={{ width: '3%' }} />
    <col style={{ width: '3%' }} />
    <col style={{ width: '3%' }} />
    <col style={{ width: '40%' }} />
    <col style={{ width: '7%' }} />
    <col style={{ width: '5%' }} />
    <col style={{ width: '5%' }} />
    <col style={{ width: '5%' }} />
    <col style={{ width: '5%' }} />
  </colgroup>
);

// forwardRef を使って親から ref を受け取れるようにする
const PrintablePickingList = React.forwardRef<HTMLDivElement, PrintableProps>(
  ({
    pickingList,
    shippingMethod,
    loadedAt,
    totalSingleUnits,
    multiItemOrders,
    janCheckOrders,
    anomalyOrders,
    shippingNotes,
    uniqueOrderCount,
  }, ref) => {
    
    return (
      // ref はこの一番外側の div に設定する
      <div ref={ref} className="printable-container">
        <div className="picking-header">
          <h2>ピッキングリスト</h2>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <span><strong>配送方法: </strong>{shippingMethod}</span>
              {shippingNotes.length > 0 && (
                <span className="shipping-notes">
                  {' - '}{shippingNotes.join(', ')}{' - '}
                </span>
              )}
              <br />
              <span><strong>作成日時: </strong>{loadedAt}</span>
            </div>
            <div>
              <span>実施者：　　　　　　<br/></span>
              <span>確認者：</span>             
            </div>
          </div>
        </div>

        {/* 2. 作業記録エリア */}
        <div className="work-log-grid">
          {/* Row 1: Headers */}
          <div className="grid-header">ピッキング</div>
          <div className="grid-header">箱出し</div>
          <div className="grid-header"></div>

          {/* Row 2: Body Items (12 items total) */}
          {/* Group 1: ピッキング */}
          <div className="grid-label col-span1">時間</div>
          <div className="grid-input col-span4 fs16"></div>
          <div className="grid-label col-span1">個数</div>
          <div className="grid-input col-span2 fs16">{totalSingleUnits}</div>
          
          {/* Group 2: 箱出し */}
          <div className="grid-label col-span1">時間</div>
          <div className="grid-input col-span4 fs16"></div>
          <div className="grid-label col-span1">個数</div>
          <div className="grid-input col-span2 fs16">{uniqueOrderCount}</div>

          {/* Group 3: 梱包 */}
          <div className="grid-label col-span1"></div>
          <div className="grid-input col-span4 fs16"></div>
          <div className="grid-label col-span1"></div>
          <div className="grid-input col-span2 fs16"></div>
        </div>

        {/* 2.5 梱包サイズ集計エリア */}
        <div className="work-log-grid" style={{ marginTop: '0px' }}>
          {/* Row 1: Headers (8 items * 3 cols = 24 cols) */}
          {/* <div className="grid-header col-span3" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>ネコポス<br/>(封筒)</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>ネコポス<br/>(箱)</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>コンパクト</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>60サイズ</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>80サイズ</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>100サイズ</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>120サイズ</div>
          <div className="grid-header col-span3" style={{ fontSize: '0.9rem' }}>140サイズ</div> */}

          {/* Row 2: Inputs */}
          {/* <div className="grid-input col-span3" style={{ height: '25px' }}></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div>
          <div className="grid-input col-span3"></div> */}
        </div>

        {/* 1. ヘッダーだけのテーブル */}
        <table className="print-table">
          <ProductTableColGroup />
          <thead>
            <tr>
              <th className="assort"></th>
              <th className="picking"></th>
              <th className="selfCheck"></th>
              <th className="doubleCheck"></th>
              <th className="itemName"></th>
              <th className="jan"></th>
              <th className="count"></th>
              <th className="breakdown-header" colSpan={3}>内訳</th>
            </tr>
            <tr>
              <th className="assort">仕分け</th>
              <th className="picking">ピッキング</th>
              <th className="selfCheck">セルフ</th>
              <th className="doubleCheck">ダブル</th>
              <th className="itemName">商品名</th>
              <th className="jan">JAN</th>
              <th className="count" style={{ writingMode: "vertical-rl" }}>総個数</th>
              <th className="case">メーカー箱</th>
              <th className="case">1個箱</th>
              <th className="other">バラ</th>
            </tr>
          </thead>
        </table>

        {/* 2. ボディだけのテーブル（これが複数ページにまたがる） */}
        <table className="print-table">
          <ProductTableColGroup />
          <tbody>
            {pickingList.map((item, index) => (
              <tr key={`${item.JANコード}-${item.商品名}-${index}`}>
                <td className="assort"></td>
                <td className="picking"></td>
                <td className="selfCheck"></td>
                <td className="doubleCheck"></td>
                <td className="itemName">{item.商品名}</td>
                <td className="jan">
                  <span className="jan">{formatJanDisplay(item.JANコード)}</span>
                  {item.親JANコード && (
                    <>
                      <br />
                      <span className="parent-jan">({formatJanDisplay(item.親JANコード)})</span>
                    </>
                  )}
                </td>
                <td className="count">
                  <span className="count">{item.単品換算数}</span>
                  {(item.親数量 && item.親数量 > 0) ? (
                    <>
                      <br />
                      <span className="parent-quantity">({item.親数量})</span>
                    </>
                  ) : null
                  }
                </td>
                <td className="case"></td>
                <td className="case"></td>
                <td className="other"></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <table className="print-table">
          <ProductTableColGroup />
          <tbody>
            <tr>
              <td className="other">&nbsp;</td>
              <td className="picking">&nbsp;</td>
              <td className="selfCheck">&nbsp;</td>
              <td className="doubleCheck">&nbsp;</td>
              <td className="itemName">&nbsp;</td>
              <td className="jan">&nbsp;</td>
              <td className="count">&nbsp;</td>
              <td className="case">&nbsp;</td>
              <td className="case">&nbsp;</td>
              <td className="other">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* 3. フッターだけのテーブル */}
        <table className="print-table footer-table">
          <ProductTableColGroup />
          <tfoot>
            <tr className="footer-row">
              <td className="other">合計</td>
              <td className="picking"></td>
              <td className="selfCheck"></td>
              <td className="doubleCheck"></td>
              <td className="itemName"></td>
              <td className="jan"></td>
              <td className="count">{totalSingleUnits}</td>
              <td className="case"></td>
              <td className="case"></td>
              <td className="other"></td>
            </tr>
          </tfoot>
        </table>

        <hr />

        {/* 複数個注文が1件以上ある場合のみ、このセクションを描画 */}
        {multiItemOrders.length > 0 && (
          <div className="multi-order-list-container">
            <h2>複数個注文リスト</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>GoQ管理番号</th>
                  {/* <th style={{ width: '15%' }}>受注番号</th> */}
                  <th style={{ width: '15%' }}>送付先氏名</th>
                  <th style={{ flex: 1 }}>商品名</th>
                  <th style={{ width: '5%' }}>個数</th>
                  <th style={{ width: '10%' }}>JANコード</th>
                  <td className="other">チェック</td>
                </tr>
              </thead>
              <tbody>
                {multiItemOrders.map((item, index) => {
                  const isSpecialCalc = isSpecialQuantityCalculationRequired(item);
                  const displayQuantity = isSpecialCalc ? item['計算後総個数']! : item['個数'];


                  return (
                    <tr key={`${item.受注番号}-${index}`}>
                      <td>{item['GoQ管理番号']}</td>
                      {/* <td>{item['受注番号']}</td> */}
                      <td>{item['送付先氏名']}</td>
                      <td>{item['商品名']}</td>
                      <td style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>{displayQuantity}</td>
                      <td style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>{formatJanDisplay(item['JANコード'])}</td>
                      <td className="other"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* JAN確認用リストが1件以上ある場合のみ、このセクションを描画 */}
        {janCheckOrders.length > 0 && (
          <div className="multi-order-list-container" style={{ marginTop: '20px' }}>
            <h2>JAN確認用リスト</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>GoQ管理番号</th>
                  {/* <th style={{ width: '15%' }}>受注番号</th> */}
                  <th style={{ width: '15%' }}>送付先氏名</th>
                  <th style={{ flex: 1 }}>商品名</th>
                  <th style={{ width: '5%' }}>個数</th>
                  <th style={{ width: '10%' }}>JANコード</th>
                  <td className="other">チェック</td>
                </tr>
              </thead>
              <tbody>
                {janCheckOrders.map((item, index) => {
                  return (
                    <tr key={`selectable-${item.受注番号}-${index}`}>
                      <td>{item['GoQ管理番号']}</td>
                      <td>{item['送付先氏名']}</td>
                      <td>{item['商品名']}</td>
                      <td style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>{item['計算後総個数']}</td>
                      <td style={{ fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>{formatJanDisplay(item['JANコード'])}</td>
                      <td className="other"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 異常検知リストが1件以上ある場合のみ、このセクションを描画 */}
        {anomalyOrders.length > 0 && (
          <div className="multi-order-list-container" style={{ marginTop: '20px' }}>
            <h2>⚠ 異常検知リスト（マスタ未登録）</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>GoQ管理番号</th>
                  <th style={{ width: '15%' }}>送付先氏名</th>
                  <th style={{ flex: 1 }}>商品名</th>
                  <th style={{ width: '5%' }}>個数</th>
                  <th style={{ width: '18%' }}>商品SKU</th>
                  <td className="other">対応</td>
                </tr>
              </thead>
              <tbody>
                {anomalyOrders.map((item, index) => (
                  <tr key={`anomaly-${item['GoQ管理番号']}-${index}`}>
                    <td>{item['GoQ管理番号']}</td>
                    <td>{item['送付先氏名']}</td>
                    <td>{item['商品名']}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item['個数']}</td>
                    <td style={{ fontSize: '0.75rem' }}>{item['商品SKU'] || item['商品コード'] || '—'}</td>
                    <td className="other"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
);

// displayName を設定
PrintablePickingList.displayName = 'PrintablePickingList';

export default PrintablePickingList;
