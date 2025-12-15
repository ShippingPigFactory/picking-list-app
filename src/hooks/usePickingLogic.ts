// hooks/usePickingLogic.ts

import { useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";

// マスタCSVのヘッダー名定義
// ご提示いただいたB列からのヘッダーリストに基づき設定
const HEADER_MAP = {
  sku: "商品SKU",
  jan: "JAN",
  parentAsin: "親ASIN",
  setCount: "SET数",
  parentAsin2: "親ASIN-2",
  parentJan2: "親JAN-2",
  setCount2: "SET-2",
  childAsin: "子ASIN",
  productName: "親",        // リスト内に「親」が2箇所あるため、ロジック内で lastIndexOf を使用して後ろ側(SKU横)を優先します
  migrationSource: "引継ぎ元",
  migrationTarget: "引継ぎ先"
};

export function usePickingLogic(data: OrderItem[], sheet: string[][]) {
  
  const { rawPickingList, totalSingleUnits } = useMemo(() => {
    console.log("=============== usePickingLogic 再計算開始 (ヘッダー動的特定版) ===============");
    
    // シートが空、またはヘッダー行がない場合は空の結果を返す
    if (!sheet || sheet.length === 0) {
      console.warn("マスタデータが存在しません。");
      return { rawPickingList: [], totalSingleUnits: 0 };
    }

    // 1行目をヘッダーとして取得
    const headers = sheet[0];
    
    // ヘッダー名から列インデックスを特定するヘルパー関数
    const getColIndex = (key: string, defaultIdx: number) => {
      const idx = headers.indexOf(key);
      if (idx === -1) {
        console.warn(`[警告] ヘッダー "${key}" が見つかりません。デフォルトの列番号(${defaultIdx})を使用します。`);
        return defaultIdx;
      }
      return idx;
    };

    // 各カラムのインデックスを計算
    const colIdx = {
      sku: getColIndex(HEADER_MAP.sku, 16),
      jan: getColIndex(HEADER_MAP.jan, 5),
      parentAsin: getColIndex(HEADER_MAP.parentAsin, 4),
      setCount: getColIndex(HEADER_MAP.setCount, 6),
      parentAsin2: getColIndex(HEADER_MAP.parentAsin2, 7),
      parentJan2: getColIndex(HEADER_MAP.parentJan2, 8),
      setCount2: getColIndex(HEADER_MAP.setCount2, 9),
      childAsin: getColIndex(HEADER_MAP.childAsin, 10),
      
      // 「親」列は重複しているため、lastIndexOfを使って後ろ側（SKUの隣）を優先的に取得する
      productName: headers.lastIndexOf(HEADER_MAP.productName) !== -1 
        ? headers.lastIndexOf(HEADER_MAP.productName) 
        : 17, // 見つからない場合はデフォルト17
      
      migrationSource: getColIndex(HEADER_MAP.migrationSource, 21),
      migrationTarget: getColIndex(HEADER_MAP.migrationTarget, 22),
    };

    console.log("特定された列インデックス:", colIdx);

    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const productNameForItem = item['商品名'];
      const csvCount = parseInt(item["個数"], 10) || 0;

      console.group(`--- 処理開始: "${productNameForItem}" (注文数: ${csvCount}) ---`);

      if (csvCount === 0) {
        console.log("注文数が0のためスキップします。");
        console.groupEnd();
        return;
      }

      // 変数を初期化
      let jan = "";
      let parentJan: string | undefined = undefined;
      let setCount = 1;
      let productName = productNameForItem;
      let parentQuantity: number | undefined = undefined;

      // --- STEP 1: マスタ行(qRow)を特定 ---
      const itemSku = item["商品SKU"];
      const skuKanri = item["SKU管理番号"];

      console.log(`[qRow特定] 優先1(商品SKU): "${itemSku || '空'}", 優先2(SKU管理番号): "${skuKanri || '空'}" で検索`);

      // SKUカラム(colIdx.sku)を使って検索
      let qRow = 
        (itemSku && sheet.find(r => r[colIdx.sku]?.toLowerCase() === itemSku.toLowerCase())) ||
        (skuKanri && sheet.find(r => r[colIdx.sku]?.toLowerCase() === skuKanri.toLowerCase()));

      // --- STEP 1.5: 引継ぎロジック (引継ぎ元 -> 引継ぎ先) ---
      if (qRow) {
        // 引継ぎ元カラムを確認
        const sourceValue = qRow[colIdx.migrationSource];
        
        if (sourceValue && sourceValue.trim() !== "") {
          console.log(` -> [引継ぎ確認] "${HEADER_MAP.migrationSource}"列に値 "${sourceValue}" を発見。"${HEADER_MAP.migrationTarget}"列を検索します。`);
          
          // 引継ぎ先カラムが sourceValue と一致する行を探す
          const targetRow = sheet.find(r => r[colIdx.migrationTarget] === sourceValue);

          if (targetRow) {
            console.log(" -> [引継ぎ成功] 引継ぎ先の行が見つかりました。行を差し替えます。");
            qRow = targetRow;
          } else {
            console.warn(` -> [引継ぎ警告] "${HEADER_MAP.migrationTarget}"列が "${sourceValue}" の行が見つかりませんでした。元の行を使用します。`);
          }
        }
      }

      // --- STEP 2: qRowが見つかった場合の処理 ---
      if (qRow) {
        console.log(" -> [SUCCESS] 確定qRow:", qRow);

        const parentAsin = qRow[colIdx.parentAsin2]; // 親ASIN-2

        if (parentAsin && parentAsin.trim() !== '') {
          // 【セット商品の場合】
          console.log(" -> [判定] セット商品として処理します。");
          
          parentJan = qRow[colIdx.parentJan2]; // 親JAN-2
          const parentSetCount = parseInt(qRow[colIdx.setCount2] || '1', 10); // SET-2
          parentQuantity = parentSetCount * csvCount;
          
          jan = qRow[colIdx.jan]; // JAN
          setCount = parseInt(qRow[colIdx.setCount] || '1', 10); // SET数
          productName = qRow[colIdx.productName] || productNameForItem; // 親(商品名)

          const childAsin = qRow[colIdx.childAsin]; // 子ASIN
          console.log(`   -> 親JAN: ${parentJan}, 親SET数: ${parentSetCount}, 親ASIN: ${parentAsin}`);
          console.log(`   -> 子JAN: ${jan}, 子SET数: ${setCount}, 子ASIN: ${childAsin}`);

        } else {
          // 【通常商品の場合】
          console.log(" -> [判定] 通常商品として処理します。");

          const asin = qRow[colIdx.parentAsin]; // 親ASIN
          jan = qRow[colIdx.jan]; // JAN
          setCount = parseInt(qRow[colIdx.setCount] || '1', 10); // SET数
          productName = qRow[colIdx.productName] || productNameForItem; // 親(商品名)
          console.log(`   -> ASIN: ${asin}, JAN: ${jan}, SET数: ${setCount}`);
        }
        
      } else {
        console.log(" -> [FAIL] qRowが見つかりませんでした。CSVの値をデフォルトとして使用します。");
      }

      // --- STEP 4: 最終的な数量を計算 ---
      const singleUnits = setCount * csvCount;
      console.log(`【最終SET数】: ${setCount}`);
      console.log(`【最終数量】: ${singleUnits} (計算式: ${setCount} * ${csvCount})`);

      // --- 集計プロセス ---
      const mapKey = jan || productName;
      if (map.has(mapKey)) {
        const ex = map.get(mapKey)!;
        ex.個数 += csvCount;
        ex.単品換算数 += singleUnits;
        ex.親数量 = (ex.親数量 || 0) + (parentQuantity || 0);
      } else {
        map.set(mapKey, {
          商品名: productName,
          JANコード: jan,
          親JANコード: parentJan,
          個数: csvCount,
          単品換算数: singleUnits,
          親数量: parentQuantity,
        });
      }
      
      console.groupEnd();
    });
    
    const list = Array.from(map.values());
    const totalSingles = list.reduce((sum, item) => {
      const isSetProduct = item.親JANコード && item.親JANコード.trim() !== '';
      return isSetProduct ? sum + item.個数 : sum + item.単品換算数;
    }, 0);
    
    return { rawPickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  return { rawPickingList, totalSingleUnits };
}