// src/data/acSpecs.ts
export const acSpecs = {
  // 畳数 : { series : { unitPrice: number; coolW: number; heatW: number } }
  6: {
    XS: { unitPrice: 0, coolW: 425, heatW: 440 },
    EX: { unitPrice: 0, coolW: 520, heatW: 450 },
    J:  { unitPrice: 0, coolW: 635, heatW: 470 },
  },
  8: {
    XS: { unitPrice: 0, coolW: 500, heatW: 515 },
    EX: { unitPrice: 0, coolW: 640, heatW: 620 },
    J:  { unitPrice: 0, coolW: 680, heatW: 630 },
  },
  10: {
    XS: { unitPrice: 0, coolW: 515, heatW: 690 },
    EX: { unitPrice: 0, coolW: 770, heatW: 870 },
    J:  { unitPrice: 0, coolW: 770, heatW: 870 },
  },
  14: {
    XS: { unitPrice: 0, coolW: 960, heatW: 1160 },
    EX: { unitPrice: 0, coolW: 1340, heatW: 1340 },
    J:  { unitPrice: 0, coolW: 1380, heatW: 1400 },
  },
  18: {
    XS: { unitPrice: 0, coolW: 1580, heatW: 1500 },
    EX: { unitPrice: 0, coolW: 2280, heatW: 2150 },
    J:  { unitPrice: 0, coolW: 2280, heatW: 2030 },
  },
};

export const kWhCostWithTax = 31; // 円/kWh
