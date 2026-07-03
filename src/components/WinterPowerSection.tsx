import React from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography, Chip } from '@mui/material';
import { AcUnit as SnowIcon, Bolt as BoltIcon } from '@mui/icons-material';
import type { Series } from '../App';

interface SeriesPowerData {
  series: Series;
  model: string;
  lowTempHeatingKw: number;
  apf: number;
}

interface WinterPowerSectionProps {
  data: SeriesPowerData[];
  variant?: 'screen' | 'print';
}

const seriesColors: Record<Series, string> = {
  XS: '#2563eb',
  EX: '#f59e0b',
  J: '#94a3b8',
};

// 横棒での数値比較（低温暖房能力・APF共通）
const PowerBars: React.FC<{
  data: SeriesPowerData[];
  getValue: (d: SeriesPowerData) => number;
  formatValue: (v: number) => string;
  xsBadge?: string;
  isPrint: boolean;
}> = ({ data, getValue, formatValue, xsBadge, isPrint }) => {
  const maxValue = Math.max(...data.map(getValue));
  return (
    <Stack spacing={1}>
      {data.map(d => {
        const value = getValue(d);
        const isXS = d.series === 'XS';
        return (
          <Box key={d.series}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                sx={{ width: 34, fontSize: isPrint ? '1rem' : '0.85rem', flexShrink: 0 }}
                fontWeight={isXS ? 800 : 600}
                color={isXS ? 'primary.main' : 'text.secondary'}
              >
                {d.series}
              </Typography>
              <Box sx={{ flex: 1, bgcolor: '#f1f5f9', borderRadius: 1, height: isPrint ? 26 : 22, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${(value / maxValue) * 100}%`,
                    height: '100%',
                    bgcolor: seriesColors[d.series],
                    borderRadius: 1,
                    opacity: isXS ? 1 : 0.75,
                  }}
                />
              </Box>
              <Typography
                sx={{ width: isPrint ? 76 : 64, fontSize: isPrint ? '1.05rem' : '0.9rem', textAlign: 'right', flexShrink: 0 }}
                fontWeight={isXS ? 800 : 600}
                color={isXS ? 'primary.main' : 'text.secondary'}
              >
                {formatValue(value)}
              </Typography>
              {isXS && xsBadge && (
                <Chip
                  label={xsBadge}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: isPrint ? '0.85rem' : '0.72rem', flexShrink: 0 }}
                />
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export const WinterPowerSection: React.FC<WinterPowerSectionProps> = ({ data, variant = 'screen' }) => {
  const isPrint = variant === 'print';
  const xs = data.find(d => d.series === 'XS');
  if (!xs || data.length < 2) return null;

  const others = data.filter(d => d.series !== 'XS');
  const weakestHeat = Math.min(...others.map(d => d.lowTempHeatingKw));
  const heatRatio = weakestHeat > 0 ? xs.lowTempHeatingKw / weakestHeat : null;
  const lowestApf = Math.min(...others.map(d => d.apf));

  const explainSize = isPrint ? '0.95rem' : '0.85rem';

  return (
    <Grid container spacing={2}>
      {/* 低温暖房能力 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%', borderTop: '3px solid #0ea5e9' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0f2fe', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0f9ff' }}>
            <SnowIcon sx={{ color: '#0ea5e9' }} />
            <Box>
              <Typography variant={isPrint ? 'h6' : 'subtitle1'} fontWeight="700">
                真冬の朝の「本当の暖房パワー」
              </Typography>
              <Typography variant="caption" color="text.secondary">
                低温暖房能力（外気温2℃のときに出せるパワー）
              </Typography>
            </Box>
          </Box>
          <CardContent>
            <Stack spacing={1.5}>
              <PowerBars
                data={data}
                getValue={d => d.lowTempHeatingKw}
                formatValue={v => `${v.toFixed(1)}kW`}
                xsBadge={heatRatio && heatRatio >= 1.15 ? `約${heatRatio.toFixed(1)}倍！` : undefined}
                isPrint={isPrint}
              />
              <Typography sx={{ fontSize: explainSize }} color="text.secondary">
                カタログの畳数表示は外気温7℃が基準。<strong>本当に寒い朝（外気温2℃）に出せるパワーがこの数値</strong>で、小さいエアコンほど「真冬に限って効かない」が起きます。XSは一番寒い朝にこそ差が出ます。
              </Typography>
              <Box sx={{ p: 1.25, bgcolor: '#f0f9ff', borderRadius: 1.5, border: '1px solid #bae6fd' }}>
                <Typography sx={{ fontSize: explainSize }} color="text.secondary">
                  ❄️ さらにXSは<strong>霜取り運転中も暖房が止まらない</strong>（エネチャージ）。ふつうのエアコンは真冬の朝ほど霜取りで暖房が止まり、寒い時間が生まれます。
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* APF */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%', borderTop: '3px solid #16a34a' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0fdf4' }}>
            <BoltIcon sx={{ color: '#16a34a' }} />
            <Box>
              <Typography variant={isPrint ? 'h6' : 'subtitle1'} fontWeight="700">
                電気1の力を「何倍の快適さ」に変えるか
              </Typography>
              <Typography variant="caption" color="text.secondary">
                APF（通年エネルギー消費効率）
              </Typography>
            </Box>
          </Box>
          <CardContent>
            <Stack spacing={1.5}>
              <PowerBars
                data={data}
                getValue={d => d.apf}
                formatValue={v => `${v.toFixed(1)}倍`}
                xsBadge="省エネトップ"
                isPrint={isPrint}
              />
              <Typography sx={{ fontSize: explainSize }} color="text.secondary">
                APFは<strong>電気1kW分の力で、何kW分の冷暖房を生み出せるか</strong>という効率の数値。XSは電気1の力を約{xs.apf.toFixed(1)}倍の暖かさ・涼しさに変えます（{others[others.length - 1].series}は約{lowestApf.toFixed(1)}倍）。
              </Typography>
              <Box sx={{ p: 1.25, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontSize: explainSize }} color="text.secondary">
                  🌱 同じ暖かさ・涼しさを<strong>より少ない電気で実現</strong>できるということ。だから毎月の電気代が安くなり、環境にもやさしい選択です。
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default WinterPowerSection;
