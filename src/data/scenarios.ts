export type Scenario = {
  id: string;
  label: string; // UI 表示用
  desc: string;  // 補足説明
  dailyHours: number;
  coolRatio: number; // 冷房比率 0-100
};

export const scenarios: Scenario[] = [
  { id: 'bedroom',  label: '夜だけ運転',           desc: '🛌 寝室',              dailyHours: 8,  coolRatio: 70 },
  { id: 'living',   label: '夕方〜夜中心',         desc: '👨‍👩‍👧‍👦 リビング団らん',    dailyHours: 10, coolRatio: 40 },
  { id: 'telework', label: '平日日中＋夜',         desc: '💼 テレワーク',          dailyHours: 12, coolRatio: 50 },
  { id: 'pet',      label: 'ほぼ終日運転',         desc: '🐶 ペット留守番',        dailyHours: 24, coolRatio: 60 },
  { id: 'eco',      label: '短時間のみ',           desc: '🌅 朝晩だけエコ運転',      dailyHours: 4,  coolRatio: 30 },
];