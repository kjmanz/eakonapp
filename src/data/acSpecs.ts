// src/data/acSpecs.ts
// Panasonic Eolia 2026 models.
// Values are nominal ratings from Panasonic 2026 specs (JIS C 9612:2013).
export type ACSeries = 'XS' | 'EX' | 'J';

export interface ACSpec {
  model: string;
  unitPrice?: number;
  coolW: number;
  heatW: number;
  apf: number;
  energySavingRate: number;
  periodKWh: number;
  lowTempHeatingKw: number;
}

export const acSpecs = {
  // 畳数 : { series : 2026年モデル仕様 }
  6: {
    XS: { model: 'CS-XS226D', unitPrice: 238800, coolW: 425, heatW: 440, apf: 7.0, energySavingRate: 106, periodKWh: 594, lowTempHeatingKw: 4.5 },
    EX: { model: 'CS-EX226D', unitPrice: 144100, coolW: 520, heatW: 450, apf: 6.1, energySavingRate: 92, periodKWh: 682, lowTempHeatingKw: 3.5 },
    J:  { model: 'CS-J226D', unitPrice: 97700, coolW: 635, heatW: 470, apf: 5.8, energySavingRate: 87, periodKWh: 717, lowTempHeatingKw: 2.8 },
  },
  8: {
    XS: { model: 'CS-XS256D', unitPrice: 241800, coolW: 500, heatW: 515, apf: 7.0, energySavingRate: 106, periodKWh: 676, lowTempHeatingKw: 4.7 },
    EX: { model: 'CS-EX256D', unitPrice: 166100, coolW: 640, heatW: 620, apf: 5.8, energySavingRate: 87, periodKWh: 815, lowTempHeatingKw: 3.5 },
    J:  { model: 'CS-J256D', unitPrice: 108300, coolW: 680, heatW: 630, apf: 5.8, energySavingRate: 87, periodKWh: 815, lowTempHeatingKw: 3.0 },
  },
  10: {
    XS: { model: 'CS-XS286D', unitPrice: 253200, coolW: 515, heatW: 690, apf: 7.1, energySavingRate: 107, periodKWh: 746, lowTempHeatingKw: 5.6 },
    EX: { model: 'CS-EX286D', unitPrice: 176700, coolW: 770, heatW: 870, apf: 5.8, energySavingRate: 87, periodKWh: 913, lowTempHeatingKw: 3.6 },
    J:  { model: 'CS-J286D', unitPrice: 118900, coolW: 770, heatW: 870, apf: 5.8, energySavingRate: 87, periodKWh: 913, lowTempHeatingKw: 3.4 },
  },
  12: {
    XS: { model: 'CS-XS366D', coolW: 825, heatW: 915, apf: 6.6, energySavingRate: 100, periodKWh: 1032, lowTempHeatingKw: 5.6 },
    EX: { model: 'CS-EX366D', coolW: 1370, heatW: 1200, apf: 5.0, energySavingRate: 75, periodKWh: 1362, lowTempHeatingKw: 3.7 },
    J:  { model: 'CS-J366D', coolW: 1370, heatW: 1200, apf: 4.9, energySavingRate: 74, periodKWh: 1390, lowTempHeatingKw: 3.7 },
  },
  14: {
    XS: { model: 'CS-XS406D2', unitPrice: 274400, coolW: 830, heatW: 950, apf: 7.1, energySavingRate: 107, periodKWh: 1066, lowTempHeatingKw: 9.0 },
    EX: { model: 'CS-EX406D2', unitPrice: 198700, coolW: 1340, heatW: 1340, apf: 5.5, energySavingRate: 83, periodKWh: 1376, lowTempHeatingKw: 6.2 },
    J:  { model: 'CS-J406D2', unitPrice: 144100, coolW: 1380, heatW: 1400, apf: 4.9, energySavingRate: 74, periodKWh: 1544, lowTempHeatingKw: 5.2 },
  },
  18: {
    XS: { model: 'CS-XS566D2', unitPrice: 296400, coolW: 1580, heatW: 1500, apf: 6.4, energySavingRate: 101, periodKWh: 1655, lowTempHeatingKw: 9.0 },
    EX: { model: 'CS-EX566D2', coolW: 2280, heatW: 2150, apf: 5.0, energySavingRate: 79, periodKWh: 2118, lowTempHeatingKw: 6.8 },
    J:  { model: 'CS-J566D2', coolW: 2280, heatW: 2030, apf: 5.0, energySavingRate: 79, periodKWh: 2118, lowTempHeatingKw: 6.8 },
  },
  20: {
    XS: { model: 'CS-XS636D2', unitPrice: 328100, coolW: 1880, heatW: 1630, apf: 6.2, energySavingRate: 101, periodKWh: 1922, lowTempHeatingKw: 9.0 },
    EX: { model: 'CS-EX636D2', coolW: 2200, heatW: 2320, apf: 5.0, energySavingRate: 81, periodKWh: 2383, lowTempHeatingKw: 7.3 },
  },
  23: {
    XS: { model: 'CS-XS716D2', coolW: 2340, heatW: 2230, apf: 5.9, energySavingRate: 100, periodKWh: 2276, lowTempHeatingKw: 9.0 },
    EX: { model: 'CS-EX716D2', coolW: 2850, heatW: 3200, apf: 4.5, energySavingRate: 76, periodKWh: 2984, lowTempHeatingKw: 7.3 },
  },
  26: {
    XS: { model: 'CS-XS806D2', coolW: 2850, heatW: 2600, apf: 5.5, energySavingRate: 96, periodKWh: 2751, lowTempHeatingKw: 9.0 },
  },
  29: {
    XS: { model: 'CS-XS906D2', coolW: 3000, heatW: 3150, apf: 5.1, energySavingRate: 92, periodKWh: 3338, lowTempHeatingKw: 9.4 },
  },
} as const satisfies Record<number, Partial<Record<ACSeries, ACSpec>>>;

export const kWhCostWithTax = 31; // 円/kWh
