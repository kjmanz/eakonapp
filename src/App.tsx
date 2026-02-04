import React, { useState, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  InputAdornment,
  CssBaseline,
  Stack,
  FormControl,
  Chip
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Settings as SettingsIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Thermostat as ThermostatIcon,
  BarChart as ChartIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  CompareArrows as CompareIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps, Legend } from 'recharts';
import { acSpecs, kWhCostWithTax } from './data/acSpecs';

// 型定義
type TatamiSize = keyof typeof acSpecs;
type Series = 'XS' | 'EX' | 'J';

interface CalculationResult {
  series: Series;
  unitPrice: number;
  annualElecCost: number;
  totalElecCost: number;
  totalCost: number;
}

// 畳数ごとの利用可能シリーズを取得
const getAvailableSeries = (tatami: TatamiSize): Series[] => {
  const specs = acSpecs[tatami];
  return (['XS', 'EX', 'J'] as Series[]).filter(s => s in specs);
};

// シリーズ機能比較データ (2026年モデル)
const seriesFeatures = {
  XS: {
    name: 'XSシリーズ',
    grade: '最上位',
    color: '#2563eb',
    highlight: true,
    features: {
      'ナノイーX': '48兆（最高濃度）',
      'エネチャージ': true,
      'AI快適おまかせ': true,
      'フィルター自動お掃除': true,
      '内部クリーン': true,
      'においケア': true,
      '快適気流': '4方向',
      'スマホ連携': true,
      '音声操作': true,
    },
  },
  EX: {
    name: 'EXシリーズ',
    grade: '中位',
    color: '#64748b',
    highlight: false,
    features: {
      'ナノイーX': '4.8兆',
      'エネチャージ': false,
      'AI快適おまかせ': false,
      'フィルター自動お掃除': true,
      '内部クリーン': true,
      'においケア': false,
      '快適気流': '2方向',
      'スマホ連携': true,
      '音声操作': false,
    },
  },
  J: {
    name: 'Jシリーズ',
    grade: 'エントリー',
    color: '#94a3b8',
    highlight: false,
    features: {
      'ナノイーX': '-',
      'エネチャージ': false,
      'AI快適おまかせ': false,
      'フィルター自動お掃除': false,
      '内部クリーン': true,
      'においケア': false,
      '快適気流': '-',
      'スマホ連携': false,
      '音声操作': false,
    },
  },
};

const featureLabels = [
  'ナノイーX',
  'エネチャージ',
  'AI快適おまかせ',
  'フィルター自動お掃除',
  '内部クリーン',
  'においケア',
  '快適気流',
  'スマホ連携',
  '音声操作',
];

// テーマ作成 - 落ち着いたカラーパレット
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

const App: React.FC = () => {
  // State管理
  const [selectedTatami, setSelectedTatami] = useState<TatamiSize>(6);
  const [unitPrices, setUnitPrices] = useState({ XS: '', EX: '', J: '' });
  const [dailyHours, setDailyHours] = useState(8);
  const [coolRatio, setCoolRatio] = useState(50);
  const [years, setYears] = useState(10);

  // 利用可能シリーズ
  const availableSeries = useMemo(() => getAvailableSeries(selectedTatami), [selectedTatami]);

  // 計算ロジック
  const calculationResults: CalculationResult[] = useMemo(() => {
    const toKWh = (w: number) => w / 1000;
    const weightedKWh = (coolW: number, heatW: number) =>
      toKWh(coolW) * (coolRatio / 100) + toKWh(heatW) * (1 - coolRatio / 100);
    const annualElecYen = (coolW: number, heatW: number) =>
      weightedKWh(coolW, heatW) * dailyHours * 365 * kWhCostWithTax;

    const specs = acSpecs[selectedTatami] as Record<string, { coolW: number; heatW: number }>;
    return availableSeries.map(series => {
      const spec = specs[series];
      const unitPrice = parseInt(unitPrices[series].replace(/,/g, '')) || 0;
      const annualCost = annualElecYen(spec.coolW, spec.heatW);
      const totalElecCost = annualCost * years;
      const totalCost = unitPrice + totalElecCost;
      return { series, unitPrice, annualElecCost: annualCost, totalElecCost, totalCost };
    });
  }, [selectedTatami, unitPrices, coolRatio, dailyHours, availableSeries, years]);

  const cheapestSeries = useMemo(() => {
    const validResults = calculationResults.filter(r => r.unitPrice > 0);
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) =>
      current.totalCost < min.totalCost ? current : min
    ).series;
  }, [calculationResults]);

  // 総費用グラフデータ
  const chartData = useMemo(() => calculationResults
    .filter(r => r.unitPrice > 0)
    .map(r => ({
      series: r.series,
      cost: r.totalCost,
      isCheapest: r.series === cheapestSeries
    })), [calculationResults, cheapestSeries]);

  // 費用内訳グラフデータ（積み上げ棒グラフ用）
  const stackedChartData = useMemo(() => calculationResults
    .filter(r => r.unitPrice > 0)
    .map(r => ({
      series: r.series,
      本体価格: r.unitPrice,
      電気代: Math.round(r.totalElecCost),
      total: r.totalCost,
      isCheapest: r.series === cheapestSeries
    })), [calculationResults, cheapestSeries]);

  const normalizeNumericInput = (value: string) =>
    value
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/[，．]/g, (char) => (char === '，' ? ',' : '.'));

  const handlePriceChange = (series: Series, value: string) => {
    const normalizedValue = normalizeNumericInput(value);
    const numericValue = normalizedValue.replace(/[^0-9]/g, '');

    if (numericValue === '') {
      setUnitPrices(prev => ({ ...prev, [series]: '' }));
      return;
    }

    const formattedValue = new Intl.NumberFormat('ja-JP').format(parseInt(numericValue));
    setUnitPrices(prev => ({ ...prev, [series]: formattedValue }));
  };

  const formatCurrency = (amount: number) =>
    `¥${new Intl.NumberFormat('ja-JP').format(Math.round(amount))}`;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, minWidth: 140 }}>
          <Typography variant="body2" color="text.secondary">{label}シリーズ</Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {formatCurrency(payload[0].value as number)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // 積み上げグラフ用Tooltip
  const StackedTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <Paper sx={{ p: 1.5, minWidth: 160 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{label}シリーズ</Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              本体価格: <strong>{formatCurrency(data.本体価格)}</strong>
            </Typography>
            <Typography variant="body2">
              {years}年電気代: <strong>{formatCurrency(data.電気代)}</strong>
            </Typography>
            <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 0.5, mt: 0.5 }}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                合計: {formatCurrency(data.total)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <Toolbar>
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                エアコン総費用シミュレーター
              </Typography>
            </Container>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack spacing={3}>
            {/* 設定パネル */}
            <Card>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" fontWeight="600">基本設定</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* 畳数選択 */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <HomeIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">お部屋の畳数</Typography>
                      </Stack>
                      <FormControl fullWidth size="small">
                        <Select
                          value={String(selectedTatami)}
                          onChange={(e) => setSelectedTatami(Number(e.target.value) as TatamiSize)}
                        >
                          {Object.keys(acSpecs).map(tatami => (
                            <MenuItem key={tatami} value={tatami}>{tatami}畳</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Grid>

                  {/* 本体価格入力 */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MoneyIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">本体価格</Typography>
                      </Stack>
                      <Stack spacing={1.5}>
                        {availableSeries.map(series => (
                          <TextField
                            key={series}
                            label={series}
                            value={unitPrices[series]}
                            onChange={(e) => handlePriceChange(series, e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">円</InputAdornment>,
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* スライダー設定 */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={3}>
                      {/* 比較年数 */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CalendarIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle2" color="primary.main" fontWeight="600">
                              比較年数: <strong>{years}年</strong>
                            </Typography>
                          </Stack>
                          <Slider
                            value={years}
                            onChange={(_, value) => setYears(value as number)}
                            min={1}
                            max={20}
                            step={1}
                            marks={[
                              { value: 1, label: '1年' },
                              { value: 10, label: '10年' },
                              { value: 20, label: '20年' },
                            ]}
                            size="small"
                            color="primary"
                          />
                        </Stack>
                      </Grid>

                      {/* 運転時間 */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography variant="subtitle2" color="text.secondary">
                              1日の運転時間: <strong>{dailyHours}時間</strong>
                            </Typography>
                          </Stack>
                          <Slider
                            value={dailyHours}
                            onChange={(_, value) => setDailyHours(value as number)}
                            min={1}
                            max={24}
                            step={1}
                            marks={[
                              { value: 1, label: '1h' },
                              { value: 12, label: '12h' },
                              { value: 24, label: '24h' },
                            ]}
                            size="small"
                          />
                        </Stack>
                      </Grid>

                      {/* 冷房比率 */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <ThermostatIcon fontSize="small" color="action" />
                            <Typography variant="subtitle2" color="text.secondary">
                              冷房 <strong>{coolRatio}%</strong> / 暖房 <strong>{100 - coolRatio}%</strong>
                            </Typography>
                          </Stack>
                          <Slider
                            value={coolRatio}
                            onChange={(_, value) => setCoolRatio(value as number)}
                            min={0}
                            max={100}
                            step={10}
                            marks={[
                              { value: 0, label: '暖房' },
                              { value: 50, label: '半々' },
                              { value: 100, label: '冷房' },
                            ]}
                            size="small"
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 結果表示 */}
            {calculationResults.some(r => r.unitPrice > 0) && (
              <>
                {/* テーブル */}
                <Card>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6" fontWeight="600">{years}年総費用比較</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      本体価格 + {years}年間の電気代
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>シリーズ</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>本体価格</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>年間電気代</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{years}年電気代</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>{years}年総費用</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculationResults.filter(r => r.unitPrice > 0).map((result) => (
                          <TableRow key={result.series} hover>
                            <TableCell align="center">
                              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                <Typography fontWeight="600">{result.series}</Typography>
                                {cheapestSeries === result.series && (
                                  <Chip label="最安" color="primary" size="small" />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(result.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(result.annualElecCost)}</TableCell>
                            <TableCell align="right">{formatCurrency(result.totalElecCost)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="700" color="primary.main">
                                {formatCurrency(result.totalCost)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>

                {/* グラフ */}
                {chartData.length > 0 && (
                  <Grid container spacing={3}>
                    {/* 総費用比較グラフ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: '100%' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChartIcon color="primary" />
                          <Typography variant="h6" fontWeight="600">{years}年総費用</Typography>
                        </Box>
                        <CardContent>
                          <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="series" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis
                                  tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                  tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                                  {chartData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.isCheapest ? '#2563eb' : '#94a3b8'}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* 費用内訳グラフ（積み上げ） */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: '100%' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChartIcon color="primary" />
                          <Typography variant="h6" fontWeight="600">費用内訳</Typography>
                          <Typography variant="body2" color="text.secondary">
                            （本体価格 + 電気代）
                          </Typography>
                        </Box>
                        <CardContent>
                          <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stackedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="series" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis
                                  tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                  tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip content={<StackedTooltip />} />
                                <Legend
                                  wrapperStyle={{ paddingTop: 10 }}
                                  formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                                />
                                <Bar dataKey="本体価格" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="電気代" stackId="a" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* シリーズ機能比較表 */}
                <Card>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompareIcon color="primary" />
                    <Typography variant="h6" fontWeight="600">2026年モデル シリーズ機能比較</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>機能</TableCell>
                          {availableSeries.map(series => {
                            const info = seriesFeatures[series];
                            return (
                              <TableCell
                                key={series}
                                align="center"
                                sx={{
                                  bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                  borderLeft: info.highlight ? '2px solid #2563eb' : 'none',
                                  borderRight: info.highlight ? '2px solid #2563eb' : 'none',
                                }}
                              >
                                <Stack spacing={0.5} alignItems="center">
                                  {info.highlight && (
                                    <Chip
                                      icon={<StarIcon sx={{ fontSize: 14 }} />}
                                      label="おすすめ"
                                      size="small"
                                      color="primary"
                                      sx={{ mb: 0.5 }}
                                    />
                                  )}
                                  <Typography fontWeight="700" color={info.color}>
                                    {info.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {info.grade}モデル
                                  </Typography>
                                </Stack>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* 消費電力行 */}
                        <TableRow sx={{ bgcolor: '#fefce8' }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <ThermostatIcon fontSize="small" color="action" />
                              <span>消費電力</span>
                            </Stack>
                          </TableCell>
                          {availableSeries.map(series => {
                            const info = seriesFeatures[series];
                            const specs = acSpecs[selectedTatami] as Record<string, { coolW: number; heatW: number }>;
                            const spec = specs[series];
                            const isLowest = availableSeries.every(s => {
                              const otherSpec = specs[s];
                              return spec.coolW <= otherSpec.coolW;
                            });
                            return (
                              <TableCell
                                key={series}
                                align="center"
                                sx={{
                                  bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                  borderLeft: info.highlight ? '2px solid #2563eb' : 'none',
                                  borderRight: info.highlight ? '2px solid #2563eb' : 'none',
                                }}
                              >
                                <Stack spacing={0.25}>
                                  <Typography variant="body2">
                                    冷房: <strong>{spec.coolW}W</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    暖房: <strong>{spec.heatW}W</strong>
                                  </Typography>
                                  {isLowest && (
                                    <Chip label="省エネNo.1" size="small" color="success" sx={{ mt: 0.5 }} />
                                  )}
                                </Stack>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* 本体価格行 */}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <MoneyIcon fontSize="small" color="action" />
                              <span>本体価格</span>
                            </Stack>
                          </TableCell>
                          {availableSeries.map(series => {
                            const info = seriesFeatures[series];
                            const result = calculationResults.find(r => r.series === series);
                            return (
                              <TableCell
                                key={series}
                                align="center"
                                sx={{
                                  bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                  borderLeft: info.highlight ? '2px solid #2563eb' : 'none',
                                  borderRight: info.highlight ? '2px solid #2563eb' : 'none',
                                }}
                              >
                                <Typography fontWeight="600">
                                  {result && result.unitPrice > 0
                                    ? formatCurrency(result.unitPrice)
                                    : '-'}
                                </Typography>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* N年総費用行 */}
                        <TableRow sx={{ bgcolor: '#f0f9ff' }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <MoneyIcon fontSize="small" color="primary" />
                              <span>{years}年総費用</span>
                            </Stack>
                          </TableCell>
                          {availableSeries.map(series => {
                            const info = seriesFeatures[series];
                            const result = calculationResults.find(r => r.series === series);
                            const isCheapest = cheapestSeries === series;
                            return (
                              <TableCell
                                key={series}
                                align="center"
                                sx={{
                                  bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                  borderLeft: info.highlight ? '2px solid #2563eb' : 'none',
                                  borderRight: info.highlight ? '2px solid #2563eb' : 'none',
                                }}
                              >
                                {result && result.unitPrice > 0 ? (
                                  <Stack alignItems="center" spacing={0.5}>
                                    <Typography fontWeight="700" color="primary.main">
                                      {formatCurrency(result.totalCost)}
                                    </Typography>
                                    {isCheapest && (
                                      <Chip label="最安" size="small" color="primary" />
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* 機能行 */}
                        {featureLabels.map((feature, idx) => (
                          <TableRow key={feature} sx={{ bgcolor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 500 }}>{feature}</TableCell>
                            {availableSeries.map(series => {
                              const info = seriesFeatures[series];
                              const value = info.features[feature as keyof typeof info.features];
                              return (
                                <TableCell
                                  key={series}
                                  align="center"
                                  sx={{
                                    bgcolor: info.highlight
                                      ? idx % 2 === 0 ? '#eff6ff' : '#e0f2fe'
                                      : 'inherit',
                                    borderLeft: info.highlight ? '2px solid #2563eb' : 'none',
                                    borderRight: info.highlight ? '2px solid #2563eb' : 'none',
                                  }}
                                >
                                  {typeof value === 'boolean' ? (
                                    value ? (
                                      <CheckIcon sx={{ color: '#22c55e' }} />
                                    ) : (
                                      <CancelIcon sx={{ color: '#d1d5db' }} />
                                    )
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      fontWeight={value !== '-' ? 600 : 400}
                                      color={value !== '-' ? 'text.primary' : 'text.disabled'}
                                    >
                                      {value}
                                    </Typography>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}

                        {/* XS推しメッセージ */}
                        {availableSeries.includes('XS') && (
                          <TableRow>
                            <TableCell colSpan={availableSeries.length + 1}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  bgcolor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: 2,
                                  mt: 1,
                                }}
                              >
                                <Stack direction="row" alignItems="flex-start" spacing={1}>
                                  <StarIcon sx={{ color: '#2563eb', mt: 0.25 }} />
                                  <Box>
                                    <Typography fontWeight="700" color="primary.main" gutterBottom>
                                      XSシリーズがおすすめの理由
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      • <strong>省エネ性能No.1</strong> - 消費電力が最も低く、長期間の電気代を大幅に節約<br />
                                      • <strong>ナノイーX 48兆</strong> - 最高濃度で花粉・ウイルス・カビ菌を抑制<br />
                                      • <strong>エネチャージ</strong> - 霜取り運転中も暖房が止まらない快適性<br />
                                      • <strong>AI快適おまかせ</strong> - 生活パターンを学習し自動で最適運転
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </>
            )}

            {/* 計算式説明 */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" fontWeight="600">計算式</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                年間電気代 = (冷房W × {coolRatio}% + 暖房W × {100 - coolRatio}%) × {dailyHours}h/日 × 365日 × ¥{kWhCostWithTax}/kWh
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                {years}年総費用 = 本体価格 + (年間電気代 × {years}年)
              </Typography>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
