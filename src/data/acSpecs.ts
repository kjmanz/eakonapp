// src/data/acSpecs.ts
export const acSpecs = {
  6: {
    XS: { unitPrice: 0, hourlyKWh: 0.433 }, // 425W+440W
    EX: { unitPrice: 0, hourlyKWh: 0.485 }, // 520W+450W
    J:  { unitPrice: 0, hourlyKWh: 0.553 }, // 635W+470W
  },
  8: {
    XS: { unitPrice: 0, hourlyKWh: 0.508 }, // 500W+515W
    EX: { unitPrice: 0, hourlyKWh: 0.630 }, // 640W+620W
    J:  { unitPrice: 0, hourlyKWh: 0.655 }, // 680W+630W
  },
  10: {
    XS: { unitPrice: 0, hourlyKWh: 0.603 }, // 515W+690W
    EX: { unitPrice: 0, hourlyKWh: 0.820 }, // 770W+870W
    J:  { unitPrice: 0, hourlyKWh: 0.820 }, // 770W+870W
  },
  14: {
    XS: { unitPrice: 0, hourlyKWh: 1.060 }, // 960W+1160W ←修正 :contentReference[oaicite:1]{index=1}
    EX: { unitPrice: 0, hourlyKWh: 1.340 }, // 1340W+1340W :contentReference[oaicite:2]{index=2}
    J:  { unitPrice: 0, hourlyKWh: 1.390 }, // 1380W+1400W :contentReference[oaicite:3]{index=3}
  },
  18: {
    XS: { unitPrice: 0, hourlyKWh: 1.540 }, // 1580W+1500W :contentReference[oaicite:4]{index=4}
    EX: { unitPrice: 0, hourlyKWh: 2.215 }, // 2280W+2150W :contentReference[oaicite:5]{index=5}
    J:  { unitPrice: 0, hourlyKWh: 2.155 }, // 2280W+2030W :contentReference[oaicite:6]{index=6}
  },
};

export const kWhCostWithTax = 31; // 円/kWh
