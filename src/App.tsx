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

// テーマ作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f8fafc',
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
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
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
        <Card sx={{ p: 1, minWidth: 150, boxShadow: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">シリーズ: {label}</Typography>
          <Typography variant="h6" color="primary">
            {formatCurrency(payload[0].value as number)}
          </Typography>
          <Typography variant="caption" display="block">10年総費用</Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', pb: 4 }}>
        <AppBar position="static" color="default" sx={{ bgcolor: 'white', mb: 4 }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                エアコン10年総費用シミュレーター
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* 設定パネル */}
            <Grid size={12}>
              <Card sx={{
                borderRadius: 4,
                overflow: 'visible',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: '16px 16px 0 0',
                  textAlign: 'center',
                  mt: -2,
                  mx: 2,
                  position: 'relative',
                  boxShadow: '0 4px 20px 0 rgba(0,0,0,.14), 0 7px 10px -5px rgba(245, 158, 11, 0.4)'
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <SettingsIcon fontSize="large" />
                    <Typography variant="h4" component="h2" fontWeight="bold">基本設定</Typography>
                  </Stack>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
                    お客様の条件を入力してください
                  </Typography>
                </Box>

                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    {/* 畳数選択 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fcd34d' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2} justifyContent="center">
                          <HomeIcon sx={{ color: '#92400e' }} />
                          <Typography variant="h6" color="#92400e" fontWeight="bold">お部屋の畳数</Typography>
                        </Stack>
                        <FormControl fullWidth>
                          <Select
                            value={String(selectedTatami)}
                            onChange={(e) => setSelectedTatami(Number(e.target.value) as TatamiSize)}
                            sx={{ bgcolor: 'white', fontWeight: 'bold' }}
                          >
                            {Object.keys(acSpecs).map(tatami => (
                              <MenuItem key={tatami} value={tatami}>{tatami}畳</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Paper>
                    </Grid>

                    {/* 本体価格入力 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2} justifyContent="center">
                          <MoneyIcon sx={{ color: '#1e40af' }} />
                          <Typography variant="h6" color="#1e40af" fontWeight="bold">本体価格 (円)</Typography>
                        </Stack>
                        <Stack spacing={2}>
                          {availableSeries.map(series => (
                            <TextField
                              key={series}
                              label={series}
                              value={unitPrices[series]}
                              onChange={(e) => handlePriceChange(series, e.target.value)}
                              fullWidth
                              InputProps={{
                                endAdornment: <InputAdornment position="end">円</InputAdornment>,
                              }}
                              sx={{ bgcolor: 'white' }}
                              size="small"
                            />
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* スライダー設定 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack spacing={3}>
                        {/* 運転時間 */}
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #6ee7b7' }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1} justifyContent="center">
                            <TimeIcon sx={{ color: '#065f46' }} />
                            <Typography variant="subtitle1" color="#065f46" fontWeight="bold">
                              1日の運転時間: {dailyHours}時間
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
                            sx={{ color: '#10b981' }}
                          />
                        </Paper>

                        {/* 冷房比率 */}
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1} justifyContent="center">
                            <ThermostatIcon sx={{ color: '#991b1b' }} />
                            <Typography variant="subtitle1" color="#991b1b" fontWeight="bold">
                              冷房: {coolRatio}% / 暖房: {100 - coolRatio}%
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
                            sx={{ color: '#ef4444' }}
                          />
                        </Paper>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 結果表示 */}
            {calculationResults.some(r => r.unitPrice > 0) && (
              <Grid size={12}>
                <Stack spacing={4}>
                  {/* テーブル */}
                  <Card sx={{
                    borderRadius: 4,
                    overflow: 'visible',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                  }}>
                    <Box sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      borderRadius: '16px 16px 0 0',
                      textAlign: 'center',
                      mt: -2,
                      mx: 2,
                      position: 'relative',
                      boxShadow: '0 4px 20px 0 rgba(0,0,0,.14), 0 7px 10px -5px rgba(59, 130, 246, 0.4)'
                    }}>
                      <Typography variant="h4" component="h2" fontWeight="bold">💰 10年総費用比較</Typography>
                      <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>本体価格 + 10年間の電気代</Typography>
                    </Box>

                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>シリーズ</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>本体価格</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>年間電気代</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>10年総費用</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculationResults.filter(r => r.unitPrice > 0).map((result) => (
                              <TableRow key={result.series} hover>
                                <TableCell align="center">
                                  {result.series}
                                  {cheapestSeries === result.series && (
                                    <Chip label="最安" color="success" size="small" sx={{ ml: 1 }} />
                                  )}
                                </TableCell>
                                <TableCell align="right">{formatCurrency(result.unitPrice)}</TableCell>
                                <TableCell align="right">{formatCurrency(Math.round(result.annualElecCost))}</TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="bold" color="error">
                                    {formatCurrency(Math.round(result.tenYearTotal))}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  {/* グラフ */}
                  {chartData.length > 0 && (
                    <Card sx={{
                      borderRadius: 4,
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box sx={{ p: 2, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChartIcon sx={{ color: '#10b981', mr: 1 }} />
                        <Typography variant="h6" color="#047857" fontWeight="bold">比較グラフ</Typography>
                      </Box>
                      <CardContent>
                        <div style={{ height: 350, width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis dataKey="series" tick={{ fill: '#666' }} />
                              <YAxis
                                tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                tick={{ fill: '#666' }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.isCheapest ? '#10b981' : '#3b82f6'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </Grid>
            )}

            {/* 計算式説明 */}
            <Grid size={12}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                  <InfoIcon color="info" fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">計算式</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  電気代 = (冷房W × {coolRatio}% + 暖房W × {100 - coolRatio}%) × {dailyHours}h/日 × 365日 × ¥{kWhCostWithTax}/kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  10年総費用 = 本体価格 + (年間電気代 × 10年)
                </Typography>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
