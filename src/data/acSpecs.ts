// src/data/acSpecs.ts
// 2026年モデル (CS-XX6D / CS-XX6D2シリーズ)
export const acSpecs = {
  // 畳数 : { series : { coolW: 冷房消費電力(W), heatW: 暖房消費電力(W) } }
  6: {
    XS: { coolW: 425, heatW: 440 },  // CS-XS226D
    EX: { coolW: 520, heatW: 450 },  // CS-EX226D
    J:  { coolW: 635, heatW: 470 },  // CS-J226D
  },
  8: {
    XS: { coolW: 500, heatW: 515 },  // CS-XS256D
    EX: { coolW: 640, heatW: 620 },  // CS-EX256D
    J:  { coolW: 680, heatW: 630 },  // CS-J256D
  },
  10: {
    XS: { coolW: 515, heatW: 690 },  // CS-XS286D
    EX: { coolW: 770, heatW: 870 },  // CS-EX286D
    J:  { coolW: 770, heatW: 870 },  // CS-J286D
  },
  12: {
    XS: { coolW: 870, heatW: 1010 },  // CS-XS366D
    EX: { coolW: 1140, heatW: 1110 }, // CS-EX366D
    J:  { coolW: 1370, heatW: 1200 }, // CS-J366D
  },
  14: {
    XS: { coolW: 960, heatW: 1160 },  // CS-XS406D2
    EX: { coolW: 1340, heatW: 1340 }, // CS-EX406D2
    J:  { coolW: 1380, heatW: 1400 }, // CS-J406D2
  },
  18: {
    XS: { coolW: 1580, heatW: 1500 }, // CS-XS566D2
    EX: { coolW: 2280, heatW: 2150 }, // CS-EX566D2
    J:  { coolW: 2370, heatW: 2030 }, // CS-J566D2
  },
  20: {
    XS: { coolW: 1900, heatW: 1750 }, // CS-XS636D2
    EX: { coolW: 2360, heatW: 2300 }, // CS-EX636D2
  },
  23: {
    XS: { coolW: 2370, heatW: 2180 }, // CS-XS716D2
    EX: { coolW: 2850, heatW: 2740 }, // CS-EX716D2
  },
  26: {
    XS: { coolW: 2800, heatW: 2600 }, // CS-XS806D2
  },
  29: {
    XS: { coolW: 3000, heatW: 3200 }, // CS-XS906D2
  },
};

export const kWhCostWithTax = 31; // 円/kWh
