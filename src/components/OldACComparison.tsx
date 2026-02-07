import React, { useState, useMemo } from 'react';
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
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Slider,
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  AttachMoney as MoneyIcon,
  Spa as EcoIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  Thermostat as ThermostatIcon,
} from '@mui/icons-material';
import { acSpecs, kWhCostWithTax } from '../data/acSpecs';
import type { Series } from '../types';

interface OldACComparisonProps {
  selectedTatami?: number;
}

// 古いエアコンのCOPデータ（年式別の目安）
const oldACData: Record<string, { cop: number; powerCool: number; powerHeat: number; description: string }> = {
  '2024': { cop: 6.5, powerCool: 500, powerHeat: 480, description: '最新モデル' },
  '2023': { cop: 6.2, powerCool: 520, powerHeat: 500, description: '1年前' },
  '2022': { cop: 5.8, powerCool: 550, powerHeat: 530, description: '2年前' },
  '2021': { cop: 5.5, powerCool: 580, powerHeat: 560, description: '3年前' },
  '2020': { cop: 5.2, powerCool: 620, powerHeat: 600, description: '4年前' },
  '2019': { cop: 4.8, powerCool: 660, powerHeat: 640, description: '5年前' },
  '2018': { cop: 4.5, powerCool: 700, powerHeat: 680, description: '6年前' },
  '2017': { cop: 4.2, powerCool: 750, powerHeat: 730, description: '7年前' },
  '2016': { cop: 3.9, powerCool: 800, powerHeat: 780, description: '8年前' },
  '2015': { cop: 3.6, powerCool: 850, powerHeat: 830, description: '9年前' },
  '2014': { cop: 3.3, powerCool: 900, powerHeat: 880, description: '10年前' },
  '2013': { cop: 3.0, powerCool: 950, powerHeat: 930, description: '11年前' },
  '2012': { cop: 2.8, powerCool: 1000, powerHeat: 980, description: '12年前' },
  '2011': { cop: 2.6, powerCool: 1050, powerHeat: 1030, description: '13年前' },
  '2010': { cop: 2.4, powerCool: 1100, powerHeat: 1080, description: '14年前' },
  '2009': { cop: 2.2, powerCool: 1150, powerHeat: 1130, description: '15年前' },
  '2008': { cop: 2.0, powerCool: 1200, powerHeat: 1180, description: '16年前' },
  '2007': { cop: 1.8, powerCool: 1250, powerHeat: 1230, description: '17年前' },
  '2006': { cop: 1.6, powerCool: 1300, powerHeat: 1280, description: '18年前' },
  '2005': { cop: 1.4, powerCool: 1350, powerHeat: 1330, description: '19年前' },
  '2004': { cop: 1.2, powerCool: 1400, powerHeat: 1380, description: '20年前' },
};

// 新しいエアコンの機能データ（2026年モデル）
const seriesFeatures: Record<Series, { cop: number; nanoeX: string; autoCleaning: boolean }> = {
  XS: { cop: 6.1, nanoeX: '48兆', autoCleaning: true },
  EX: { cop: 5.8, nanoeX: '12兆', autoCleaning: true },
  J: { cop: 5.2, nanoeX: 'なし', autoCleaning: false },
};

export const OldACComparison: React.FC<OldACComparisonProps> = ({ selectedTatami: _selectedTatami }) => {
  const [manufacturer, setManufacturer] = useState<'panasonic' | 'daikin' | 'mitsubishi' | 'sharp' | 'other'>('panasonic');
  const [purchaseYear, setPurchaseYear] = useState<string>('2018');
  const [selectedTatami, setSelectedTatami] = useState<number>(8);
  const [newSeries, setNewSeries] = useState<Series>('XS');
  const [dailyHours, setDailyHours] = useState(8);
  const [coolRatio, setCoolRatio] = useState(50);
  const [compared, setCompared] = useState(false);

  // acSpecsに存在する畳数のみを許可
  const availableTatami = Object.keys(acSpecs).map(Number) as number[];

  // 畳数変更時に選択中のシリーズが存在しない場合はXSに切り替え
  const handleTatamiChange = (tatami: number) => {
    setSelectedTatami(tatami);
    const specs = acSpecs[tatami as keyof typeof acSpecs] as any;
    if (specs && !specs[newSeries]) {
      // 選択中のシリーズが存在しない場合はXSに切り替え
      setNewSeries('XS');
    }
  };

  const calculateComparison = useMemo(() => {
    if (!compared || !purchaseYear || !oldACData[purchaseYear]) return null;

    const tatamiSpecs = acSpecs[selectedTatami as keyof typeof acSpecs] as any;
    if (!tatamiSpecs || !tatamiSpecs[newSeries]) return null;

    const oldAC = oldACData[purchaseYear];
    const newACSpecs = tatamiSpecs[newSeries];
    const features = seriesFeatures[newSeries];

    // 新しいエアコンのデータを統合
    const newAC = {
      cop: features.cop,
      powerCool: newACSpecs.coolW,
      powerHeat: newACSpecs.heatW,
      nanoeX: features.nanoeX,
      autoCleaning: features.autoCleaning,
    };

    // 年間電気代計算
    const toKWh = (w: number) => w / 1000;
    const weightedKWh = (coolW: number, heatW: number) =>
      toKWh(coolW) * (coolRatio / 100) + toKWh(heatW) * (1 - coolRatio / 100);

    const oldAnnualCost = weightedKWh(oldAC.powerCool, oldAC.powerHeat) * dailyHours * 365 * kWhCostWithTax;
    const newAnnualCost = weightedKWh(newAC.powerCool, newAC.powerHeat) * dailyHours * 365 * kWhCostWithTax;

    const annualSavings = oldAnnualCost - newAnnualCost;
    const tenYearSavings = annualSavings * 10;

    // フィルター掃除回数（古いエアコンは月1回、新しいのは自動）
    const oldCleaningTime = 12 * 10; // 10年で120回、1回あたり1時間
    const newCleaningTime = newAC.autoCleaning ? 0 : 6 * 10; // Jシリーズは月2回（1回30分）

    // CO2削減量（簡易計算: 1kWh = 0.5kg CO2）
    const co2Reduction = (oldAnnualCost / kWhCostWithTax - newAnnualCost / kWhCostWithTax) * 0.5 * 10;

    // 木の本数（1本で年間18kg CO2吸収）
    const treesEquivalent = co2Reduction / 18 / 10;

    return {
      oldAC,
      newAC,
      oldAnnualCost,
      newAnnualCost,
      annualSavings,
      tenYearSavings,
      oldCleaningTime,
      newCleaningTime,
      co2Reduction,
      treesEquivalent,
      powerReduction: oldAC.powerCool - newAC.powerCool,
    };
  }, [compared, purchaseYear, newSeries, selectedTatami, dailyHours, coolRatio]);

  const formatCurrency = (amount: number) =>
    `¥${new Intl.NumberFormat('ja-JP').format(Math.round(amount))}`;

  const getRecommendationLevel = (year: string): { level: number; stars: string; message: string } => {
    const currentYear = new Date().getFullYear();
    const acAge = currentYear - parseInt(year);

    if (acAge >= 20) {
      return { level: 5, stars: '★★★★★', message: '交換推奨度: 緊急（20年以上経過）' };
    } else if (acAge >= 15) {
      return { level: 5, stars: '★★★★★', message: '交換推奨度: 最高（15年以上経過）' };
    } else if (acAge >= 10) {
      return { level: 4, stars: '★★★★☆', message: '交換推奨度: 高い（10年以上経過）' };
    } else if (acAge >= 8) {
      return { level: 3, stars: '★★★☆☆', message: '交換推奨度: 中程度（8年以上経過）' };
    } else if (acAge >= 6) {
      return { level: 2, stars: '★★☆☆☆', message: '交換推奨度: 検討（6年以上経過）' };
    } else if (acAge >= 4) {
      return { level: 1, stars: '★☆☆☆☆', message: '交換推奨度: 低い（4年以上経過）' };
    } else {
      return { level: 0, stars: '☆☆☆☆☆', message: '交換推奨度: なし（3年以内）' };
    }
  };

  const recommendation = getRecommendationLevel(purchaseYear);

  // シリーズに応じた背景色
  const getSeriesBgColor = (series: Series) => {
    switch (series) {
      case 'XS': return '#eff6ff'; // 青
      case 'EX': return '#fffbeb'; // 黄
      case 'J': return '#f1f5f9'; // 灰
    }
  };

  // シリーズに応じたテキスト色
  const getSeriesTextColor = (series: Series) => {
    switch (series) {
      case 'XS': return '#2563eb'; // 青
      case 'EX': return '#d97706'; // 黄
      case 'J': return '#64748b'; // 灰
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareIcon color="primary" />
          <Typography variant="h6" fontWeight="600">今のエアコンと比較してどれくらいお得？</Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* ステップ1: 入力 */}
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight="600">ステップ1: 今お使いのエアコンの情報を入力</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>メーカー</InputLabel>
                      <Select
                        value={manufacturer}
                        label="メーカー"
                        onChange={(e) => setManufacturer(e.target.value as any)}
                      >
                        <MenuItem value="panasonic">パナソニック</MenuItem>
                        <MenuItem value="daikin">ダイキン</MenuItem>
                        <MenuItem value="mitsubishi">三菱電機</MenuItem>
                        <MenuItem value="sharp">シャープ</MenuItem>
                        <MenuItem value="other">その他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>購入年</InputLabel>
                      <Select
                        value={purchaseYear}
                        label="購入年"
                        onChange={(e) => setPurchaseYear(e.target.value)}
                      >
                        {Object.entries(oldACData).map(([year, data]) => (
                          <MenuItem key={year} value={year}>
                            {year}年（{data.description}）
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>畳数</InputLabel>
                      <Select
                        value={selectedTatami}
                        label="畳数"
                        onChange={(e) => handleTatamiChange(e.target.value as number)}
                      >
                        {availableTatami.map((tatami) => (
                          <MenuItem key={tatami} value={tatami}>
                            {tatami}畳
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>比較する新エアコン</InputLabel>
                      <Select
                        value={newSeries}
                        label="比較する新エアコン"
                        onChange={(e) => setNewSeries(e.target.value as Series)}
                      >
                        <MenuItem value="XS">XSシリーズ（最上位）</MenuItem>
                        <MenuItem value="EX" disabled={!(acSpecs[selectedTatami as keyof typeof acSpecs] as any)?.EX}>
                          EXシリーズ（中堅）{!(acSpecs[selectedTatami as keyof typeof acSpecs] as any)?.EX && '（この畳数は非対応）'}
                        </MenuItem>
                        <MenuItem value="J" disabled={!(acSpecs[selectedTatami as keyof typeof acSpecs] as any)?.J}>
                          Jシリーズ（標準）{!(acSpecs[selectedTatami as keyof typeof acSpecs] as any)?.J && '（この畳数は非対応）'}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* 選択中のシリーズ・畳数の表示 */}
                <Box sx={{ mt: 2, p: 2, bgcolor: getSeriesBgColor(newSeries), borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    選択中の条件: <strong>{selectedTatami}畳 / {newSeries}シリーズ</strong>
                  </Typography>
                </Box>

                {/* 1日の運転時間スライダー */}
                <Box sx={{ mt: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
                      { value: 8, label: '8h' },
                      { value: 12, label: '12h' },
                      { value: 24, label: '24h' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}時間`}
                  />
                </Box>

                {/* 冷房比率スライダー */}
                <Box sx={{ mt: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
                      { value: 0, label: '暖房のみ' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '冷房のみ' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setCompared(true)}
                    startIcon={<CompareIcon />}
                  >
                    比較する
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* ステップ2: 結果 */}
            {compared && calculateComparison && (
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompareIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight="600">ステップ2: 比較結果</Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>

                  {/* Before/After テーブル */}
                  <TableContainer sx={{ mb: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 700 }}>項目</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>今のエアコン</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, bgcolor: newSeries === 'XS' ? '#eff6ff' : newSeries === 'EX' ? '#fffbeb' : '#f1f5f9' }}>
                            新しいエアコン（{newSeries}）
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>差分</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>年式</TableCell>
                          <TableCell align="center">{purchaseYear}年製</TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries) }}>2026年製</TableCell>
                          <TableCell align="center">-</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell>年間電気代</TableCell>
                          <TableCell align="center">{formatCurrency(calculateComparison.oldAnnualCost)}</TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries), fontWeight: 700 }}>
                            {formatCurrency(calculateComparison.newAnnualCost)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={formatCurrency(calculateComparison.annualSavings)}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>消費電力（冷房）</TableCell>
                          <TableCell align="center">{calculateComparison.oldAC.powerCool}W</TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries) }}>{calculateComparison.newAC.powerCool}W</TableCell>
                          <TableCell align="center">
                            <Chip label={`-${calculateComparison.powerReduction}W`} color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell>COP（成績係数）</TableCell>
                          <TableCell align="center">{calculateComparison.oldAC.cop}</TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries), fontWeight: 700 }}>
                            {calculateComparison.newAC.cop}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`+${(calculateComparison.newAC.cop - calculateComparison.oldAC.cop).toFixed(1)}`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>ナノイーX</TableCell>
                          <TableCell align="center"><Typography color="error">なし</Typography></TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries), fontWeight: 700 }}>
                            {calculateComparison.newAC.nanoeX}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={calculateComparison.newAC.nanoeX === 'なし' ? '-' : '大幅UP'} color={calculateComparison.newAC.nanoeX === 'なし' ? 'default' : 'success'} size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell>フィルター掃除</TableCell>
                          <TableCell align="center">手動（月1回）</TableCell>
                          <TableCell align="center" sx={{ bgcolor: getSeriesBgColor(newSeries) }}>
                            {calculateComparison.newAC.autoCleaning ? '自動排出' : '手動（月2回）'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={calculateComparison.newAC.autoCleaning ? '手間ゼロ' : '半減'} color={calculateComparison.newAC.autoCleaning ? 'success' : 'warning'} size="small" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* 10年間メリット */}
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: getSeriesBgColor(newSeries),
                      border: `2px solid ${getSeriesTextColor(newSeries)}40`,
                      mb: 3,
                    }}
                  >
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon sx={{ color: getSeriesTextColor(newSeries) }} fontSize="small" />
                      <Typography variant="h6" fontWeight="700" sx={{ color: getSeriesTextColor(newSeries) }}>
                        📈 10年間でのトータルメリット（{newSeries}シリーズ）
                      </Typography>
                    </Box>
                    <CardContent sx={{ p: 3 }}>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card variant="outlined" sx={{ height: '100%', borderColor: 'success.light', bgcolor: '#f0fdf4' }}>
                            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                              <MoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">電気代節約</Typography>
                              <Typography variant="h5" fontWeight="700" color="success.main" sx={{ my: 0.5 }}>
                                {formatCurrency(calculateComparison.tenYearSavings)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', bgcolor: 'white', py: 0.5, px: 1, borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                                スマホ5台分
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card variant="outlined" sx={{ height: '100%', borderColor: 'info.light', bgcolor: '#eff6ff' }}>
                            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                              <TimeIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">フィルター掃除時間</Typography>
                              <Typography variant="h5" fontWeight="700" color="info.main" sx={{ my: 0.5 }}>
                                {calculateComparison.newAC.autoCleaning ? '0' : '60'}時間
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                <span style={{ textDecoration: 'line-through' }}>{calculateComparison.oldCleaningTime}時間</span> から削減
                              </Typography>
                              <Typography variant="caption" color="info.main" fontWeight="bold" sx={{ display: 'block', mt: 0.5 }}>
                                {calculateComparison.newAC.autoCleaning ? '有給15日分' : '有給7.5日分'} 相当
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card variant="outlined" sx={{ height: '100%', borderColor: 'success.main', bgcolor: '#f0fdf4' }}>
                            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                              <EcoIcon sx={{ fontSize: 32, mb: 1, color: '#16a34a' }} />
                              <Typography variant="body2" color="text.secondary">CO2削減</Typography>
                              <Typography variant="h5" fontWeight="700" sx={{ color: '#16a34a', my: 0.5 }}>
                                {calculateComparison.co2Reduction.toFixed(1)}kg
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', bgcolor: 'white', py: 0.5, px: 1, borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                                木 {calculateComparison.treesEquivalent.toFixed(0)} 本分
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card variant="outlined" sx={{ height: '100%', borderColor: 'warning.light', bgcolor: '#fffbeb' }}>
                            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                              <TrendingUpIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">交換推奨度</Typography>
                              <Typography variant="h5" fontWeight="700" color="warning.main" sx={{ my: 0.5 }}>
                                {recommendation.stars.replace(/☆/g, '')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {recommendation.message.split(': ')[1]}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* 警告メッセージ */}
                  {parseInt(purchaseYear) <= 2014 && (
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: parseInt(purchaseYear) <= 2009 ? '#fecaca' : '#fef3c7',
                        border: `1px solid ${parseInt(purchaseYear) <= 2009 ? '#ef4444' : '#fbbf24'}`,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight="600" color={parseInt(purchaseYear) <= 2009 ? '#991b1b' : '#92400e'}>
                          {parseInt(purchaseYear) <= 2009 ? '🚨 緊急' : '⚠️ 注意'}
                        </Typography>
                        <Typography variant="body2" color={parseInt(purchaseYear) <= 2009 ? '#991b1b' : '#92400e'}>
                          {parseInt(purchaseYear) <= 2009
                            ? `15年以上前のエアコンは、故障時の修理が難しく、電気代も大幅に高くなります。交換で年間${formatCurrency(calculateComparison?.annualSavings || 0)}節約可能です！`
                            : '製造から10年経過で修理費用が急騰します。「まだ使える」と思っていても、この機会に交換を！'}
                        </Typography>
                      </Stack>
                    </Card>
                  )}

                  {/* アクション */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button variant="contained" color="primary" onClick={() => setCompared(false)}>
                      条件を変更して再比較
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
