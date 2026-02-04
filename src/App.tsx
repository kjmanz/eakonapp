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
  Info as InfoIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';
import { acSpecs, kWhCostWithTax } from './data/acSpecs';

// 型定義
type TatamiSize = keyof typeof acSpecs;
type Series = 'XS' | 'EX' | 'J';

interface CalculationResult {
  series: Series;
  unitPrice: number;
  annualElecCost: number;
  tenYearTotal: number;
}

// 畳数ごとの利用可能シリーズを取得
const getAvailableSeries = (tatami: TatamiSize): Series[] => {
  const specs = acSpecs[tatami];
  return (['XS', 'EX', 'J'] as Series[]).filter(s => s in specs);
};

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
      const total = unitPrice + annualCost * 10;
      return { series, unitPrice, annualElecCost: annualCost, tenYearTotal: total };
    });
  }, [selectedTatami, unitPrices, coolRatio, dailyHours, availableSeries]);

  const cheapestSeries = useMemo(() => {
    const validResults = calculationResults.filter(r => r.unitPrice > 0);
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) =>
      current.tenYearTotal < min.tenYearTotal ? current : min
    ).series;
  }, [calculationResults]);

  const chartData = useMemo(() => calculationResults
    .filter(r => r.unitPrice > 0)
    .map(r => ({
      series: r.series,
      cost: r.tenYearTotal,
      isCheapest: r.series === cheapestSeries
    })), [calculationResults, cheapestSeries]);

  const handlePriceChange = (series: Series, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue === '') {
      setUnitPrices(prev => ({ ...prev, [series]: '' }));
      return;
    }

    const formattedValue = new Intl.NumberFormat('ja-JP').format(parseInt(numericValue));
    setUnitPrices(prev => ({ ...prev, [series]: formattedValue }));
  };

  const formatCurrency = (amount: number) =>
    `¥${new Intl.NumberFormat('ja-JP').format(amount)}`;

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <Toolbar>
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                エアコン10年総費用シミュレーター
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
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  <Grid size={{ xs: 12, md: 4 }}>
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                      {/* 運転時間 */}
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

                      {/* 冷房比率 */}
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
                    </Stack>
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
                    <Typography variant="h6" fontWeight="600">10年総費用比較</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      本体価格 + 10年間の電気代
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>シリーズ</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>本体価格</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>年間電気代</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>10年総費用</TableCell>
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
                            <TableCell align="right">{formatCurrency(Math.round(result.annualElecCost))}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="700" color="primary.main">
                                {formatCurrency(Math.round(result.tenYearTotal))}
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
                  <Card>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChartIcon color="primary" />
                      <Typography variant="h6" fontWeight="600">比較グラフ</Typography>
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
                )}
              </>
            )}

            {/* 計算式説明 */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" fontWeight="600">計算式</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                電気代 = (冷房W × {coolRatio}% + 暖房W × {100 - coolRatio}%) × {dailyHours}h/日 × 365日 × ¥{kWhCostWithTax}/kWh
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                10年総費用 = 本体価格 + (年間電気代 × 10年)
              </Typography>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
