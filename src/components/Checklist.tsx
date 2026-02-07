import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  RadioGroup,
  Radio,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Home as HomeIcon,
  Pets as PetIcon,
  ChildCare as BabyIcon,
  Spa as EcoIcon,
  CleaningServices as CleaningIcon,
  VolumeOff as QuietIcon,
  Smartphone as SmartphoneIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import type { Series } from '../types';

interface ChecklistProps {
  onRecommendedSeriesChange: (series: Series | null) => void;
}

interface ChecklistItem {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: { value: string; label: string; recommendation: Series | null }[];
  type: 'radio' | 'checkbox';
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'years',
    question: '1. 何年くらい使いたいですか？',
    icon: <CalendarIcon color="action" />,
    type: 'radio',
    options: [
      { value: '5', label: '5年まで', recommendation: 'J' },
      { value: '10', label: '10年くらい', recommendation: 'EX' },
      { value: '15', label: '15年以上', recommendation: 'XS' },
    ],
  },
  {
    id: 'seaside',
    question: '2. 海沿いにお住まいですか？',
    icon: <HomeIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'yes', label: 'はい', recommendation: 'XS' },
      { value: 'no', label: 'いいえ', recommendation: null },
    ],
  },
  {
    id: 'pet',
    question: '3. ペットを飼っていますか？',
    icon: <PetIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'yes', label: 'はい', recommendation: 'XS' },
      { value: 'no', label: 'いいえ', recommendation: null },
    ],
  },
  {
    id: 'baby_or_elderly',
    question: '4. 赤ちゃんや高齢者がいますか？',
    icon: <BabyIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'yes', label: 'はい', recommendation: 'XS' },
      { value: 'no', label: 'いいえ', recommendation: null },
    ],
  },
  {
    id: 'allergy',
    question: '5. 花粉症・アレルギーはありますか？',
    icon: <EcoIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'yes', label: 'はい', recommendation: 'XS' },
      { value: 'no', label: 'いいえ', recommendation: null },
    ],
  },
  {
    id: 'electricity_cost',
    question: '6. 月々の電気代をいくら以下に抑えたいですか？',
    icon: <EcoIcon color="action" />,
    type: 'radio',
    options: [
      { value: '5000', label: '5,000円', recommendation: 'J' },
      { value: '4000', label: '4,000円', recommendation: 'EX' },
      { value: '3000', label: '3,000円以下', recommendation: 'XS' },
    ],
  },
  {
    id: 'cleaning',
    question: '7. フィルター掃除はどれくらい手間に感じますか？',
    icon: <CleaningIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'bother', label: 'かなり負担', recommendation: 'XS' },
      { value: 'little', label: '少し負担', recommendation: 'EX' },
      { value: 'dont_care', label: '気にしない', recommendation: null },
    ],
  },
  {
    id: 'noise',
    question: '8. 夜間の運転音は気になりますか？',
    icon: <QuietIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'very', label: '非常に気になる', recommendation: 'XS' },
      { value: 'little', label: '少し気になる', recommendation: 'EX' },
      { value: 'dont_care', label: '気にしない', recommendation: null },
    ],
  },
  {
    id: 'current_ac_age',
    question: '9. 現在のエアコンの購入年は？',
    icon: <CalendarIcon color="action" />,
    type: 'radio',
    options: [
      { value: '3', label: '3年以内', recommendation: null },
      { value: '5', label: '5年以内', recommendation: 'EX' },
      { value: '10', label: '10年以上前', recommendation: 'XS' },
    ],
  },
  {
    id: 'smartphone',
    question: '10. スマホでエアコンを操作したいですか？',
    icon: <SmartphoneIcon color="action" />,
    type: 'radio',
    options: [
      { value: 'yes', label: 'はい', recommendation: 'XS' },
      { value: 'no', label: 'いいえ', recommendation: null },
    ],
  },
];

export const Checklist: React.FC<ChecklistProps> = ({ onRecommendedSeriesChange }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allAnswered, setAllAnswered] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setAllAnswered(Object.keys(newAnswers).length === checklistItems.length);
  };

  const recommendation = useMemo(() => {
    if (!allAnswered) return null;

    const counts: Record<Series, number> = { XS: 0, EX: 0, J: 0 };

    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = checklistItems.find(q => q.id === questionId);
      if (question) {
        const option = question.options.find(o => o.value === answer);
        if (option && option.recommendation) {
          counts[option.recommendation]++;
        }
      }
    });

    // XSを優先（省エネ・機能が最も高い）
    if (counts.XS > 0) return { series: 'XS' as Series, count: counts.XS };
    if (counts.EX > 0) return { series: 'EX' as Series, count: counts.EX };
    if (counts.J > 0) return { series: 'J' as Series, count: counts.J };

    return { series: 'XS' as Series, count: 0 };
  }, [answers, allAnswered]);

  React.useEffect(() => {
    if (recommendation) {
      onRecommendedSeriesChange(recommendation.series);
    }
  }, [recommendation, onRecommendedSeriesChange]);

  const getReasonsForSeries = (series: Series): string[] => {
    const reasons: string[] = [];
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = checklistItems.find(q => q.id === questionId);
      if (question) {
        const option = question.options.find(o => o.value === answer);
        if (option && option.recommendation === series) {
          switch (question.id) {
            case 'seaside':
              reasons.push('海沿いにお住まい → 耐塩害仕様（ブルーフィン）対応');
              break;
            case 'pet':
              reasons.push('ペットがいる → エネチャージで暖房が止まらない');
              break;
            case 'baby_or_elderly':
              reasons.push('赤ちゃんや高齢者がいる → 温度ムラ最小化・ナノイーXで空気清浄');
              break;
            case 'allergy':
              reasons.push('花粉症・アレルギー → ナノイーX 48兆でアレルゲン抑制');
              break;
            case 'years':
              reasons.push('長期使用（15年以上） → 省エネ性能で電気代節約');
              break;
            case 'cleaning':
              reasons.push('フィルター掃除が負担 → 自動掃除・自動排出機能');
              break;
            case 'noise':
              reasons.push('夜間の静音性重視 → 最低19dB（図書館より静か）');
              break;
            case 'smartphone':
              reasons.push('スマホ操作 → エオリアアプリ対応');
              break;
            case 'current_ac_age':
              reasons.push('10年以上前のエアコン → 省エネ性能大幅UPで電気代節約');
              break;
          }
        }
      }
    });
    return reasons;
  };

  const seriesColors: Record<Series, string> = {
    XS: '#2563eb',
    EX: '#f59e0b',
    J: '#94a3b8',
  };

  const seriesNames: Record<Series, string> = {
    XS: 'XSシリーズ',
    EX: 'EXシリーズ',
    J: 'Jシリーズ',
  };

  return (
    <Stack spacing={3}>
      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon color="primary" />
          <Typography variant="h6" fontWeight="600">エアコン選びで失敗しないための10の質問</Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            お客様のライフスタイルに合わせて、最適なエアコンが見つかります
          </Typography>

          <Stack spacing={3}>
            {checklistItems.map((item) => (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  bgcolor: answers[item.id] ? '#f0f9ff' : 'white',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {item.icon}
                      <Typography fontWeight="600">{item.question}</Typography>
                      {answers[item.id] && (
                        <Chip label="回答済み" size="small" color="success" />
                      )}
                    </Stack>

                  <RadioGroup
                    value={answers[item.id] || ''}
                    onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                  >
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {item.options.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </Stack>
                  </RadioGroup>

                  {answers[item.id] && item.type === 'radio' && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {item.id === 'years' && '長期的な視点なら省エネ性能が重要です'}
                      {item.id === 'seaside' && '耐塩害仕様（ブルーフィン）が必須です！'}
                      {item.id === 'pet' && 'ペットの留守番中も快適に！エネチャージで暖房が止まらない'}
                      {item.id === 'baby_or_elderly' && '温度ムラ最小化・ナノイーXで空気清浄が重要です'}
                      {item.id === 'allergy' && 'ナノイーX 48兆がアレルゲンを抑制！'}
                      {item.id === 'electricity_cost' && '省エネ性能が高い機種ほど長期的にお得'}
                      {item.id === 'cleaning' && '自動掃除・自動排出機能で解決！'}
                      {item.id === 'noise' && 'XSシリーズは最低19dB（図書館より静か）'}
                      {item.id === 'current_ac_age' && '製造から10年経過で修理費用が高騰します'}
                      {item.id === 'smartphone' && 'エオリアアプリ対応で外出先から操作可能'}
                    </Typography>
                  )}
                </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {allAnswered && recommendation && (
            <Card
              elevation={0}
              sx={{
                mt: 4,
                bgcolor: '#eff6ff',
                border: '2px solid #bfdbfe',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight="700" color="primary.main" textAlign="center">
                    📊 チェック結果に基づくおすすめ
                </Typography>

                <Box
                  sx={{
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: `3px solid ${seriesColors[recommendation.series]}`,
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Typography variant="h5" fontWeight="700" color={seriesColors[recommendation.series]}>
                      ✨ {seriesNames[recommendation.series]} ✨
                    </Typography>

                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      お客様の状況に最適なシリーズです
                    </Typography>

                    {getReasonsForSeries(recommendation.series).length > 0 && (
                      <Box sx={{ width: '100%', mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          おすすめ理由:
                        </Typography>
                        <Stack spacing={1}>
                          {getReasonsForSeries(recommendation.series).map((reason, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">
                              • {reason}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 1, width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        💡 この結果を「シミュレーター」タブで詳細に確認できます
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
              </CardContent>
            </Card>
          )}

          {!allAnswered && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                あと{checklistItems.length - Object.keys(answers).length}個の質問に回答するとおすすめが表示されます
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};
