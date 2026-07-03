import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  CompareArrows as CompareIcon,
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

const SERIES_ORDER: Series[] = ['XS', 'EX', 'J'];

const seriesMeta: Record<Series, { label: string; color: string; bg: string }> = {
  XS: { label: 'XS（高機能）', color: '#2563eb', bg: '#eff6ff' },
  EX: { label: 'EX（バランス）', color: '#d97706', bg: '#fffbeb' },
  J: { label: 'J（初期費用重視）', color: '#64748b', bg: '#f1f5f9' },
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
  if (value === null) return '目安なし';
  if (value <= 0) return 'すぐ';
  if (value > 99) return 'かなり長期';
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

  const validPlans = useMemo(() => sortedPlans.filter((plan) => plan.unitPrice > 0), [sortedPlans]);

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
      annualCost: weightedKWh * dailyHours * 365 * kWhCost,
    };
  }, [purchaseYear, tatamiSpecs, coolRatio, dailyHours, kWhCost]);

  const proposalRows = useMemo(() => {
    if (!oldACEstimate) return [];

    return validPlans.map((plan) => {
      const initialCost = plan.unitPrice + plan.installCost;
      const monthlyElecCost = plan.annualElecCost / 12;
      const monthlySavingsVsOld = oldACEstimate.annualCost / 12 - monthlyElecCost;
      const totalDiffVsOld = oldACEstimate.annualCost * years - plan.totalCost;
      const paybackVsOld = monthlySavingsVsOld > 0 ? initialCost / (monthlySavingsVsOld * 12) : null;

      return {
        ...plan,
        initialCost,
        monthlyElecCost,
        monthlySavingsVsOld,
        totalDiffVsOld,
        paybackVsOld,
      };
    });
  }, [validPlans, oldACEstimate, years]);

  const cheapestForYears = useMemo(() => {
    if (proposalRows.length === 0) return null;
    return proposalRows.reduce((min, current) =>
      current.totalCost < min.totalCost ? current : min,
    );
  }, [proposalRows]);

  const recommendationSeries = useMemo(() => {
    if (proposalRows.length === 0) return null;

    const xs = proposalRows.find((row) => row.series === 'XS');
    const currentYear = new Date().getFullYear();
    const acAge = currentYear - Number(purchaseYear);

    if (xs) {
      const xsIsRecoverable = xs.paybackVsOld !== null && xs.paybackVsOld <= years;
      if (acAge >= 8 || xsIsRecoverable) return 'XS' as Series;
    }

    return cheapestForYears?.series ?? proposalRows[0].series;
  }, [proposalRows, purchaseYear, years, cheapestForYears]);

  const recommendationNote = useMemo(() => {
    if (!recommendationSeries) return '';
    if (recommendationSeries === 'XS') {
      return '長く使うほど電気代差が出やすく、機能面も充実しているのでおすすめです。';
    }
    if (recommendationSeries === 'EX') {
      return '初期費用と月々のバランスがよく、無理なく選びやすいプランです。';
    }
    return 'まず費用を抑えて導入したい場合に選びやすいプランです。';
  }, [recommendationSeries]);

  const xsVsExMessage = useMemo(() => {
    const xs = proposalRows.find((row) => row.series === 'XS');
    const ex = proposalRows.find((row) => row.series === 'EX');
    if (!xs || !ex) return '';

    const initialDiff = xs.initialCost - ex.initialCost;
    const monthlyDiff = xs.monthlyElecCost - ex.monthlyElecCost;

    if (initialDiff <= 0) {
      return 'XSは初期費用でも不利になりにくい条件です。';
    }

    if (monthlyDiff < 0) {
      const payback = initialDiff / (Math.abs(monthlyDiff) * 12);
      return `XSはEXより初期費用が${formatCurrency(initialDiff)}高いですが、月々${formatCurrency(
        Math.abs(monthlyDiff),
      )}安く、約${formatYears(payback)}で差額回収の目安です。`;
    }

    return 'XSは機能重視で選びやすく、快適性を優先したい方に向いています。';
  }, [proposalRows]);

  return (
    <Card>
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareIcon color="primary" />
        <Typography variant="h6" fontWeight="700">おすすめプラン比較</Typography>
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
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    今のエアコン（{purchaseYear}年製）の電気代目安
                  </Typography>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    年間 {formatCurrency(oldACEstimate.annualCost)} / 月あたり {formatCurrency(oldACEstimate.annualCost / 12)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          {proposalRows.length === 0 && (
            <Alert severity="info">チラシ価格がある畳数を選ぶと、比較結果が表示されます。</Alert>
          )}

          {proposalRows.length > 0 && oldACEstimate && (
            <>
              <TableContainer component={Card} variant="outlined">
                <Table size="small" sx={{ display: { xs: 'none', md: 'table' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>プラン</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>最初にかかる費用</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>毎月の電気代目安</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{years}年合計</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>今の機種との差</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proposalRows.map((row) => {
                      const isRecommended = recommendationSeries === row.series;
                      const isCheapest = cheapestForYears?.series === row.series;
                      const recommendationLabel = isRecommended && isCheapest ? 'おすすめ' : '機能重視';
                      const diffLabel = row.totalDiffVsOld >= 0
                        ? `${formatCurrency(row.totalDiffVsOld)} お得`
                        : `${formatCurrency(Math.abs(row.totalDiffVsOld))} 高い`;

                      return (
                        <TableRow key={row.series} sx={{ bgcolor: isRecommended ? seriesMeta[row.series].bg : 'inherit' }}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Typography fontWeight={700} sx={{ color: seriesMeta[row.series].color }}>
                                {seriesMeta[row.series].label}
                              </Typography>
                              {isRecommended && <Chip label={recommendationLabel} color="primary" size="small" />}
                              {isCheapest && <Chip label="最安" size="small" />}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700}>{formatCurrency(row.initialCost)}</Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(row.monthlyElecCost)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700}>{formatCurrency(row.totalCost)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color={row.totalDiffVsOld >= 0 ? 'success.main' : 'text.secondary'} fontWeight={700}>
                              {diffLabel}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1.5 }}>
                  <Stack spacing={1.5}>
                    {proposalRows.map((row) => {
                      const isRecommended = recommendationSeries === row.series;
                      const isCheapest = cheapestForYears?.series === row.series;
                      const recommendationLabel = isRecommended && isCheapest ? 'おすすめ' : '機能重視';
                      const diffLabel = row.totalDiffVsOld >= 0
                        ? `${formatCurrency(row.totalDiffVsOld)} お得`
                        : `${formatCurrency(Math.abs(row.totalDiffVsOld))} 高い`;

                      return (
                        <Box
                          key={`mobile-old-${row.series}`}
                          sx={{
                            p: 1.5,
                            border: '1px solid #dbe7fb',
                            borderRadius: 2,
                            bgcolor: isRecommended ? seriesMeta[row.series].bg : '#ffffff',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box>
                              <Typography fontWeight={800} sx={{ color: seriesMeta[row.series].color }}>
                                {seriesMeta[row.series].label}
                              </Typography>
                              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                                {isRecommended && <Chip label={recommendationLabel} color="primary" size="small" />}
                                {isCheapest && <Chip label="最安" size="small" />}
                              </Stack>
                            </Box>
                            <Typography fontWeight={800}>{formatCurrency(row.totalCost)}</Typography>
                          </Stack>
                          <Grid container spacing={1.25} sx={{ mt: 1 }}>
                            <Grid size={6}>
                              <Typography variant="caption" color="text.secondary">最初にかかる費用</Typography>
                              <Typography fontWeight={700}>{formatCurrency(row.initialCost)}</Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography variant="caption" color="text.secondary">月々の電気代</Typography>
                              <Typography fontWeight={700}>{formatCurrency(row.monthlyElecCost)}</Typography>
                            </Grid>
                            <Grid size={12}>
                              <Typography variant="caption" color="text.secondary">今の機種との差</Typography>
                              <Typography color={row.totalDiffVsOld >= 0 ? 'success.main' : 'text.secondary'} fontWeight={700}>
                                {diffLabel}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </TableContainer>

              <Card variant="outlined" sx={{ borderColor: '#bfdbfe', bgcolor: '#eff6ff' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700} color="primary.main">提案理由</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendationNote}
                    </Typography>
                    {xsVsExMessage && (
                      <Typography variant="body2" color="text.secondary">
                        {xsVsExMessage}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {Number(purchaseYear) <= 2014 && (
                <Alert severity={Number(purchaseYear) <= 2009 ? 'error' : 'warning'}>
                  {Number(purchaseYear) <= 2009
                    ? '15年以上経過しているため、故障リスクと電気代負担が大きい状態です。早めの交換がおすすめです。'
                    : '10年以上経過しているため、修理費と電気代を考えると交換メリットが出やすい時期です。'}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
