import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { acSpecs } from '../data/acSpecs';
import type { Series } from '../types';

interface PlanResult {
  series: Series;
  unitPrice: number;
  installCost: number;
  annualElecCost: number;
  totalElecCost: number;
  totalCost: number;
}

interface OldACComparisonProps {
  selectedTatami: number;
  dailyHours: number;
  coolRatio: number;
  years: number;
  kWhCost: number;
  planResults: PlanResult[];
}

type SeriesSpec = { coolW: number; heatW: number };
type TatamiSpecs = Partial<Record<Series, SeriesSpec>>;

interface OldACYearProfile {
  efficiencyFactor: number;
  description: string;
}

const oldCopReference = 5.2;
const SERIES_ORDER: Series[] = ['XS', 'EX', 'J'];

const seriesMeta: Record<Series, { label: string; short: string; color: string; bg: string }> = {
  XS: { label: 'XSシリーズ（おすすめ）', short: 'XS', color: '#2563eb', bg: '#eff6ff' },
  EX: { label: 'EXシリーズ（バランス）', short: 'EX', color: '#d97706', bg: '#fffbeb' },
  J: { label: 'Jシリーズ（初期費用重視）', short: 'J', color: '#64748b', bg: '#f1f5f9' },
};

const getYearDescription = (age: number): string => {
  if (age <= 4) return '比較的新しい';
  if (age <= 8) return '省エネ性能が落ち始める時期';
  if (age <= 12) return '省エネ性能に差が出る時期';
  if (age <= 16) return '交換検討ゾーン';
  return '高消費電力ゾーン';
};

const estimateEfficiencyFactor = (age: number): number => {
  const clampedAge = Math.max(0, Math.min(age, 25));
  return Number((1 + clampedAge * 0.02 + clampedAge * clampedAge * 0.001).toFixed(3));
};

const buildOldACYearProfiles = (): Record<string, OldACYearProfile> => {
  const currentYear = new Date().getFullYear();
  const latestYear = currentYear - 2;
  const oldestYear = latestYear - 20;
  const profiles: Record<string, OldACYearProfile> = {};

  for (let year = latestYear; year >= oldestYear; year -= 1) {
    const age = currentYear - year;
    profiles[String(year)] = {
      efficiencyFactor: estimateEfficiencyFactor(age),
      description: `${age}年前 / ${getYearDescription(age)}`,
    };
  }

  return profiles;
};

const oldACYearProfiles = buildOldACYearProfiles();
const purchaseYearOptions = Object.keys(oldACYearProfiles).sort((a, b) => Number(b) - Number(a));

const formatCurrency = (amount: number) =>
  `¥${new Intl.NumberFormat('ja-JP').format(Math.round(amount))}`;

const formatYears = (value: number | null) => {
  if (value === null) return '回収不可';
  if (value <= 0) return '即回収';
  if (value > 99) return '99年以上';
  return `${value.toFixed(1)}年`;
};

export const OldACComparison: React.FC<OldACComparisonProps> = ({
  selectedTatami,
  dailyHours,
  coolRatio,
  years,
  kWhCost,
  planResults,
}) => {
  const [purchaseYear, setPurchaseYear] = useState<string>(() =>
    oldACYearProfiles['2018'] ? '2018' : (purchaseYearOptions[0] ?? ''),
  );

  const tatamiSpecs = useMemo(
    () => acSpecs[selectedTatami as keyof typeof acSpecs] as TatamiSpecs | undefined,
    [selectedTatami],
  );

  const sortedPlans = useMemo(
    () => [...planResults].sort((a, b) => SERIES_ORDER.indexOf(a.series) - SERIES_ORDER.indexOf(b.series)),
    [planResults],
  );

  const validPlans = useMemo(
    () => sortedPlans.filter((plan) => plan.unitPrice > 0),
    [sortedPlans],
  );

  const oldACEstimate = useMemo(() => {
    const yearProfile = oldACYearProfiles[purchaseYear];
    if (!yearProfile || !tatamiSpecs) return null;

    const oldReferenceSpecs = tatamiSpecs.J ?? tatamiSpecs.EX ?? tatamiSpecs.XS;
    if (!oldReferenceSpecs) return null;

    const oldPowerCool = Math.round(oldReferenceSpecs.coolW * yearProfile.efficiencyFactor);
    const oldPowerHeat = Math.round(oldReferenceSpecs.heatW * yearProfile.efficiencyFactor);

    const toKWh = (w: number) => w / 1000;
    const weightedKWh =
      toKWh(oldPowerCool) * (coolRatio / 100) + toKWh(oldPowerHeat) * (1 - coolRatio / 100);

    return {
      description: yearProfile.description,
      cop: Number(Math.max(2.6, oldCopReference / yearProfile.efficiencyFactor).toFixed(1)),
      powerCool: oldPowerCool,
      powerHeat: oldPowerHeat,
      annualCost: weightedKWh * dailyHours * 365 * kWhCost,
    };
  }, [purchaseYear, tatamiSpecs, coolRatio, dailyHours, kWhCost]);

  const proposalRows = useMemo(() => {
    if (!oldACEstimate) return [];

    return validPlans.map((plan) => {
      const initialCost = plan.unitPrice + plan.installCost;
      const annualSavingsVsOld = oldACEstimate.annualCost - plan.annualElecCost;
      const monthlySavingsVsOld = annualSavingsVsOld / 12;
      const paybackYears = annualSavingsVsOld > 0 ? initialCost / annualSavingsVsOld : null;

      return {
        ...plan,
        initialCost,
        monthlyElecCost: plan.annualElecCost / 12,
        annualSavingsVsOld,
        monthlySavingsVsOld,
        paybackYears,
      };
    });
  }, [validPlans, oldACEstimate]);

  const cheapestForYears = useMemo(() => {
    if (proposalRows.length === 0) return null;
    return proposalRows.reduce((min, current) =>
      current.totalCost < min.totalCost ? current : min,
    );
  }, [proposalRows]);

  const xsPaybackVsOther = useMemo(() => {
    const xs = proposalRows.find((row) => row.series === 'XS');
    if (!xs) return [];

    return proposalRows
      .filter((row) => row.series !== 'XS')
      .map((row) => {
        const initialDiff = xs.initialCost - row.initialCost;
        const annualDiff = row.annualElecCost - xs.annualElecCost;

        let payback: number | null = null;
        if (initialDiff <= 0) {
          payback = 0;
        } else if (annualDiff > 0) {
          payback = initialDiff / annualDiff;
        }

        return {
          baseSeries: row.series,
          initialDiff,
          annualDiff,
          payback,
        };
      });
  }, [proposalRows]);

  const recommendationSeries = useMemo(() => {
    if (proposalRows.length === 0) return null;

    const xs = proposalRows.find((row) => row.series === 'XS');
    const currentYear = new Date().getFullYear();
    const acAge = currentYear - Number(purchaseYear);

    if (xs) {
      const recoversWithinPeriod = xsPaybackVsOther.some(
        (item) => item.payback !== null && item.payback <= years,
      );
      if (acAge >= 8 || recoversWithinPeriod) return 'XS' as Series;
    }

    return cheapestForYears?.series ?? proposalRows[0].series;
  }, [proposalRows, purchaseYear, years, xsPaybackVsOther, cheapestForYears]);

  const recommendationNote = useMemo(() => {
    if (!recommendationSeries) return '';
    if (recommendationSeries === 'XS') {
      return '長期運用で回収しやすく、機能・快適性も高いのでXS推奨です。';
    }
    if (recommendationSeries === 'EX') {
      return '初期費用とランニングコストのバランス重視ならEXが有利です。';
    }
    return '初期費用最小で進めるならJが現実的です。';
  }, [recommendationSeries]);

  return (
    <Card>
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareIcon color="primary" />
        <Typography variant="h6" fontWeight="700">商談セット提案（現行比較 + 3プラン）</Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>今のエアコン購入年</InputLabel>
                <Select
                  value={purchaseYear}
                  label="今のエアコン購入年"
                  onChange={(e) => setPurchaseYear(e.target.value)}
                >
                  {purchaseYearOptions.map((year) => {
                    const data = oldACYearProfiles[year];
                    return (
                      <MenuItem key={year} value={year}>
                        {year}年（{data.description}）
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip icon={<CalendarIcon />} label={`比較期間 ${years}年`} size="small" />
                  <Chip icon={<BoltIcon />} label={`電気代単価 ${kWhCost}円/kWh`} size="small" />
                  <Chip label={`${selectedTatami}畳`} size="small" />
                  <Chip label={`1日${dailyHours}時間`} size="small" />
                  <Chip label={`冷房${coolRatio}% / 暖房${100 - coolRatio}%`} size="small" />
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {oldACEstimate && (
            <Card variant="outlined" sx={{ borderColor: '#dbe7fb', bgcolor: '#f8fbff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip label={`現在推定年間電気代 ${formatCurrency(oldACEstimate.annualCost)}`} color="warning" />
                  <Chip label={`推定COP ${oldACEstimate.cop}`} />
                  <Chip label={`冷房 ${oldACEstimate.powerCool}W / 暖房 ${oldACEstimate.powerHeat}W`} />
                  <Typography variant="body2" color="text.secondary">
                    {purchaseYear}年製（{oldACEstimate.description}）
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          {proposalRows.length === 0 && (
            <Alert severity="info">本体価格を1つ以上入力すると、現行機との比較提案を表示します。</Alert>
          )}

          {proposalRows.length > 0 && oldACEstimate && (
            <>
              <TableContainer component={Card} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>提案プラン</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>初期費用</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>月額電気代</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>年間削減（対現行）</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>投資回収</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{years}年総費用</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proposalRows.map((row) => {
                      const isRecommended = recommendationSeries === row.series;
                      const isCheapest = cheapestForYears?.series === row.series;
                      return (
                        <TableRow key={row.series} sx={{ bgcolor: isRecommended ? seriesMeta[row.series].bg : 'inherit' }}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Typography fontWeight={700} sx={{ color: seriesMeta[row.series].color }}>
                                {seriesMeta[row.series].label}
                              </Typography>
                              {isRecommended && <Chip label="商談おすすめ" color="primary" size="small" />}
                              {isCheapest && <Chip label="最安" size="small" />}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack spacing={0.2} alignItems="flex-end">
                              <Typography fontWeight={700}>{formatCurrency(row.initialCost)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                本体{formatCurrency(row.unitPrice)} + 工事{formatCurrency(row.installCost)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(row.monthlyElecCost)}</TableCell>
                          <TableCell align="right">
                            <Stack spacing={0.2} alignItems="flex-end">
                              <Typography color={row.annualSavingsVsOld > 0 ? 'success.main' : 'text.secondary'} fontWeight={700}>
                                {formatCurrency(row.annualSavingsVsOld)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                月あたり {formatCurrency(row.monthlySavingsVsOld)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{formatYears(row.paybackYears)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700}>{formatCurrency(row.totalCost)}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Card variant="outlined" sx={{ borderColor: '#bfdbfe', bgcolor: '#eff6ff' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUpIcon color="primary" fontSize="small" />
                      <Typography fontWeight={700} color="primary.main">XS差額回収シミュレーション</Typography>
                    </Stack>

                    {xsPaybackVsOther.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        XSと比較できるプランがありません。
                      </Typography>
                    )}

                    {xsPaybackVsOther.map((item) => (
                      <Box
                        key={item.baseSeries}
                        sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid #dbeafe' }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={1} useFlexGap flexWrap="wrap">
                          <Typography variant="body2" fontWeight={700}>
                            XS vs {seriesMeta[item.baseSeries].short}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            初期差額 {formatCurrency(item.initialDiff)} / 年間電気代差 {formatCurrency(item.annualDiff)}
                          </Typography>
                          <Chip
                            size="small"
                            color={item.payback !== null && item.payback <= years ? 'success' : 'default'}
                            label={`回収: ${formatYears(item.payback)}`}
                          />
                        </Stack>
                      </Box>
                    ))}

                    <Divider />

                    <Typography variant="body2" color="text.secondary">
                      <strong>{recommendationSeries ? seriesMeta[recommendationSeries].short : '-'}</strong> 推奨: {recommendationNote}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              {Number(purchaseYear) <= 2014 && (
                <Alert severity={Number(purchaseYear) <= 2009 ? 'error' : 'warning'}>
                  {Number(purchaseYear) <= 2009
                    ? '15年以上経過のため故障リスクと電気代負担が高い状態です。交換優先で提案するのが安全です。'
                    : '10年以上経過で修理費が上がりやすい時期です。電気代削減と故障リスク低減をセットで提案できます。'}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
