// src/data/acSpecs.ts
export const acSpecs = {
  // 畳数 : { series : { unitPrice: number; model?: string; coolKWh: number; heatKWh: number } }
  6: {
    XS: { unitPrice: 0, model: 'CS-XS225D', coolKWh: 168, heatKWh: 426 },
    EX: { unitPrice: 0, model: 'CS-EX225D', coolKWh: 208, heatKWh: 474 },
    J:  { unitPrice: 0, model: 'CS-J225D',  coolKWh: 225, heatKWh: 492 },
  },
  8: {
    XS: { unitPrice: 0, model: 'CS-XS255D', coolKWh: 190, heatKWh: 486 },
    EX: { unitPrice: 0, model: 'CS-EX255D', coolKWh: 244, heatKWh: 571 },
    J:  { unitPrice: 0, model: 'CS-J255D',  coolKWh: 252, heatKWh: 563 },
  },
  10: {
    XS: { unitPrice: 0, model: 'CS-XS285D', coolKWh: 203, heatKWh: 543 },
    EX: { unitPrice: 0, model: 'CS-EX285D', coolKWh: 278, heatKWh: 635 },
    J:  { unitPrice: 0, model: 'CS-J285D',  coolKWh: 265, heatKWh: 648 },
  },
  14: {
    XS: { unitPrice: 0, model: 'CS-XS405D2', coolKWh: 297, heatKWh: 769 },
    EX: { unitPrice: 0, model: 'CS-EX405D2', coolKWh: 454, heatKWh: 922 },
    J:  { unitPrice: 0, model: 'CS-J405D2',  coolKWh: 463, heatKWh: 1081 },
  },
  18: {
    XS: { unitPrice: 0, model: 'CS-XS565D2', coolKWh: 473, heatKWh: 1182 },
    EX: { unitPrice: 0, model: 'CS-EX565D2', coolKWh: 648, heatKWh: 1470 },
    J:  { unitPrice: 0, model: 'CS-J565D2',  coolKWh: 648, heatKWh: 1470 },
  },
};

export const kWhCostWithTax = 31; // 円/kWh
