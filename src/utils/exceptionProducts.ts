import { JAN_CHECK_SKU_MAP } from './janCheckProducts';

/**
 * 【選べる】シリーズに該当する商品のリスト。
 * @deprecated Use isJanCheckRequired or isSpecialQuantityCalculationRequired from janCheckProducts instead.
 * 
 */

export const SELECTABLE_SERIES_SKU_MAP: { [key: string]: boolean } = JAN_CHECK_SKU_MAP;
