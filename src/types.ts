export type TatamiSize = 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 23 | 26 | 29;
export type Series = 'XS' | 'EX' | 'J';

export interface CalculationResult {
  series: Series;
  unitPrice: number;
  annualElecCost: number;
  totalElecCost: number;
  totalCost: number;
}
