import React from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography, Chip } from '@mui/material';
import { Favorite as HeartIcon } from '@mui/icons-material';
import {
  lifestyleBenefits,
  filterCleaningHoursSaved,
  dinnerOutYen,
  familyTripYen,
  type ScenarioId,
} from '../data/lifestyleBenefits';

interface LifestyleBenefitsProps {
  years: number;
  scenarioId: ScenarioId | null; // null = 全カード表示
  annualSaving: number | null;   // XSと比較シリーズの年間電気代差（プラスのときのみ表示）
  comparisonSeries: string | null;
  variant?: 'screen' | 'print';
}

const formatYen = (amount: number) =>
  `¥${new Intl.NumberFormat('ja-JP').format(Math.round(amount))}`;

export const LifestyleBenefits: React.FC<LifestyleBenefitsProps> = ({
  years,
  scenarioId,
  annualSaving,
  comparisonSeries,
  variant = 'screen',
}) => {
  const isPrint = variant === 'print';

  const benefits = scenarioId
    ? lifestyleBenefits.filter(b => b.scenarios.includes(scenarioId))
    : lifestyleBenefits;

  const choreHours = filterCleaningHoursSaved(years);
  const dinnerCount = annualSaving && annualSaving > 0 ? Math.round(annualSaving / dinnerOutYen) : 0;
  const tripCount = annualSaving && annualSaving > 0 ? Math.round((annualSaving * years) / familyTripYen) : 0;

  const headlineSize = isPrint ? '1.15rem' : '1rem';
  const detailSize = isPrint ? '0.95rem' : '0.85rem';

  return (
    <Card sx={{ borderTop: '3px solid #ec4899' }}>
      {/* 印刷用はページ側にタイトルがあるためヘッダーを省略 */}
      {!isPrint && (
        <Box sx={{ p: 2, borderBottom: '1px solid #fce7f3', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fdf2f8' }}>
          <HeartIcon sx={{ color: '#ec4899' }} />
          <Box>
            <Typography variant="h6" fontWeight="700">
              XSシリーズで変わる、毎日の暮らし
            </Typography>
            <Typography variant="caption" color="text.secondary">
              電気代だけじゃない。「家事がラクになる・空気がきれい・家族が快適」のメリット
            </Typography>
          </Box>
        </Box>
      )}
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          {/* 数字で見せるハイライト：家事時間 & 生活換算 */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: dinnerCount > 0 ? 6 : 12 }}>
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #fbcfe8',
                  bgcolor: '#fdf2f8',
                  textAlign: 'center',
                }}
              >
                <Typography variant={isPrint ? 'body1' : 'body2'} fontWeight="700" color="text.secondary">
                  🧹 フィルター掃除という家事が消えます
                </Typography>
                <Typography variant={isPrint ? 'h4' : 'h5'} fontWeight="800" sx={{ color: '#db2777', mt: 0.5 }}>
                  {years}年で 約{choreHours}時間 の家事をカット
                </Typography>
                <Typography variant={isPrint ? 'body2' : 'caption'} color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  ※手動掃除を月1回・約15分として換算。ホコリは屋外へ自動排出されます
                </Typography>
              </Box>
            </Grid>
            {dinnerCount > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    height: '100%',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #bfdbfe',
                    bgcolor: '#eff6ff',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant={isPrint ? 'body1' : 'body2'} fontWeight="700" color="text.secondary">
                    💰 {comparisonSeries}との電気代の差を暮らしに換算すると…
                  </Typography>
                  <Typography variant={isPrint ? 'h4' : 'h5'} fontWeight="800" color="primary.main" sx={{ mt: 0.5 }}>
                    年間 {formatYen(annualSaving!)} ＝ 外食 約{dinnerCount}回分
                  </Typography>
                  <Typography variant={isPrint ? 'body1' : 'body2'} fontWeight="700" color="primary.main" sx={{ mt: 0.5 }}>
                    {years}年なら 家族旅行 約{tripCount}回分
                  </Typography>
                  <Typography variant={isPrint ? 'body2' : 'caption'} color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    ※外食1回{formatYen(dinnerOutYen)}・家族旅行1回{formatYen(familyTripYen)}で換算
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* 暮らしメリットカード（シーン連動） */}
          <Grid container spacing={1.5}>
            {benefits.map(benefit => (
              <Grid key={benefit.id} size={{ xs: 12, sm: 6, md: isPrint ? 6 : 4 }}>
                <Box
                  sx={{
                    height: '100%',
                    p: 1.75,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Stack spacing={0.75}>
                    <Typography sx={{ fontSize: headlineSize, fontWeight: 800, lineHeight: 1.4 }}>
                      {benefit.emoji} {benefit.headline}
                    </Typography>
                    <Typography sx={{ fontSize: detailSize }} color="text.secondary">
                      {benefit.detail}
                    </Typography>
                    <Box>
                      <Chip
                        label={benefit.feature}
                        size="small"
                        sx={{
                          bgcolor: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 600,
                          fontSize: isPrint ? '0.8rem' : '0.7rem',
                          height: 'auto',
                          py: 0.25,
                          '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.4 },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default LifestyleBenefits;
