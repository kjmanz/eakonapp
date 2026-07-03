// XSシリーズの機能を「暮らしの実感」に翻訳した訴求データ。
// scenarios.ts のシーンIDと紐付けて、選んだ使い方に合うカードだけを表示する。
import type { Scenario } from './scenarios';

export type ScenarioId = Scenario['id'];

export interface LifestyleBenefit {
  id: string;
  emoji: string;
  headline: string; // 暮らしの言葉（見出し）
  detail: string;   // 具体的な生活シーンの説明
  feature: string;  // 根拠となる機能名
  scenarios: ScenarioId[]; // このカードが刺さる使い方シーン
}

export const lifestyleBenefits: LifestyleBenefit[] = [
  {
    id: 'filter-free',
    emoji: '🧹',
    headline: 'フィルター掃除、10年間ゼロ',
    detail: '脚立に乗ってフィルターを外して洗う家事が丸ごとなくなります。ホコリはお掃除ロボットが自動で屋外へ排出。',
    feature: 'フィルターお掃除ロボット（ゴミ自動排出）',
    scenarios: ['bedroom', 'living', 'telework', 'pet', 'eco'],
  },
  {
    id: 'no-mold-smell',
    emoji: '🍃',
    headline: 'シーズン初めの「カビ臭い！」が起きない',
    detail: '使っていない間もお部屋とエアコン内部のカビをみはって自動でケア。久しぶりに運転しても空気がきれいなまま。',
    feature: 'カビみはり ＋ ナノイーX 48兆',
    scenarios: ['bedroom', 'living', 'eco'],
  },
  {
    id: 'indoor-laundry',
    emoji: '👕',
    headline: '梅雨の部屋干しがちゃんと乾く',
    detail: '湿度をコントロールしながら除湿するので、生乾き臭を抑えつつ、除湿で部屋が寒くなりすぎません。',
    feature: 'エネチャージ快湿制御',
    scenarios: ['living', 'telework'],
  },
  {
    id: 'warm-morning',
    emoji: '♨️',
    headline: '冬の朝、着替えとお風呂上がりが寒くない',
    detail: '足元から43℃のあたたかい風。霜取り運転中も暖房が止まらないので、寒い朝もヒヤッとしません。ヒートショック対策にも。',
    feature: '足元43℃暖房 ＋ エネチャージ',
    scenarios: ['bedroom', 'living', 'eco'],
  },
  {
    id: 'gentle-airflow',
    emoji: '🌬️',
    headline: '「私だけ寒い…」が減る',
    detail: 'ひと・ものセンサーが家族それぞれの居場所と活動量を見分けて、風を当てすぎない気配り運転をします。',
    feature: 'ひと・ものセンサー ＋ AI快適おまかせ',
    scenarios: ['living', 'telework'],
  },
  {
    id: 'good-sleep',
    emoji: '🛌',
    headline: '朝までぐっすり、のど・肌が乾きにくい',
    detail: '寝ている間の湿度を快適に保つので、朝起きたときの「のどがカラカラ」を抑えます。',
    feature: 'エネチャージ快湿制御',
    scenarios: ['bedroom'],
  },
  {
    id: 'pet-care',
    emoji: '🐶',
    headline: 'お留守番中のペットも、きれいな空気で快適',
    detail: '温度・湿度をAIが自動でキープ。ナノイーXがペットのニオイも抑えるので、帰宅したときのお部屋が違います。',
    feature: 'AI快適おまかせ ＋ ナノイーX 48兆',
    scenarios: ['pet', 'living'],
  },
];

// 家事時間の換算：フィルター掃除 月1回・約15分 と仮定
export const filterCleaningMinutesPerMonth = 15;

export const filterCleaningHoursSaved = (years: number) =>
  Math.round((filterCleaningMinutesPerMonth * 12 * years) / 60);

// 電気代差額の生活換算レート
export const dinnerOutYen = 4000;   // 家族の外食1回あたり
export const familyTripYen = 50000; // 家族旅行1回あたり
