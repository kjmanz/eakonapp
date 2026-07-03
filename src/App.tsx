import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  CssBaseline,
  Stack,
  FormControl,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
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
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps,
  LineChart, Line, Legend, ReferenceLine, LabelList
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { acSpecs, kWhCostWithTax, type ACSpec } from './data/acSpecs';
import { OldACComparison } from './components/OldACComparison';
import { scenarios } from './data/scenarios';
import { LifestyleBenefits } from './components/LifestyleBenefits';
import type { ScenarioId } from './data/lifestyleBenefits';

// 型定義
type TatamiSize = keyof typeof acSpecs;
export type Series = 'XS' | 'EX' | 'J';

interface CalculationResult {
  series: Series;
  unitPrice: number;
  installCost: number;
  annualElecCost: number;
  totalElecCost: number;
  totalCost: number;
}

// 畳数ごとの利用可能シリーズを取得
const getAvailableSeries = (tatami: TatamiSize): Series[] => {
  const specs = acSpecs[tatami] as Partial<Record<Series, ACSpec>>;
  return (['XS', 'EX', 'J'] as Series[]).filter(s => typeof specs[s]?.unitPrice === 'number');
};

const tatamiOptions = (Object.keys(acSpecs).map(Number) as TatamiSize[]).filter(
  (tatami) => getAvailableSeries(tatami).length > 0,
);

// シリーズ機能比較データ (2026年モデル) - パナソニック公式情報に基づく
const seriesFeatures = {
  XS: {
    name: 'XSシリーズ',
    grade: 'パナソニックのお店限定',
    color: '#2563eb',
    highlight: true,
    features: {
      'ナノイーX': '48兆',
      'エネチャージ': true,
      'AI快適おまかせ': true,
      'エコロータリーコンプレッサー': true,
      'エコインバーター制御': true,
      'フィルターお掃除ロボット': '自動排出 / BOX切替',
      'もっとモード（冷房・除湿）': true,
      'ひと・ものセンサー': 'ひと・もの（居場所・活動量・在室人数）',
      'カビみはり（お部屋）': true,
      '耐塩害仕様（JRA9002）': true,
    },
  },
  EX: {
    name: 'EXシリーズ',
    grade: '奥行コンパクト',
    color: '#64748b',
    highlight: false,
    features: {
      'ナノイーX': '48兆',
      'エネチャージ': false,
      'AI快適おまかせ': 'AIモード',
      'エコロータリーコンプレッサー': false,
      'エコインバーター制御': false,
      'フィルターお掃除ロボット': '自動排出 / BOX切替',
      'もっとモード（冷房・除湿）': false,
      'ひと・ものセンサー': 'ひと（不在節電・オートオフ）',
      'カビみはり（お部屋）': false,
      '耐塩害仕様（JRA9002）': false,
    },
  },
  J: {
    name: 'Jシリーズ',
    grade: 'スタンダード',
    color: '#94a3b8',
    highlight: false,
    features: {
      'ナノイーX': '9.6兆',
      'エネチャージ': false,
      'AI快適おまかせ': false,
      'エコロータリーコンプレッサー': false,
      'エコインバーター制御': false,
      'フィルターお掃除ロボット': false,
      'もっとモード（冷房・除湿）': false,
      'ひと・ものセンサー': false,
      'カビみはり（お部屋）': false,
      '耐塩害仕様（JRA9002）': false,
    },
  },
};

const featureLabels = [
  '品番',
  '省エネ達成率（2027年度）',
  'APF（通年エネルギー消費効率）',
  '期間消費電力量（JIS C 9612:2013）',
  '低温暖房能力（外気温2℃時）',
  'ナノイーX',
  'エネチャージ',
  'AI快適おまかせ',
  'エコロータリーコンプレッサー',
  'エコインバーター制御',
  'フィルターお掃除ロボット',
  'もっとモード（冷房・除湿）',
  'ひと・ものセンサー',
  'カビみはり（お部屋）',
  '耐塩害仕様（JRA9002）',
];

const getSeriesFeatureValue = (feature: string, series: Series, spec?: ACSpec): string | boolean => {
  if (spec) {
    if (feature === '品番') return spec.model;
    if (feature === '省エネ達成率（2027年度）') return `${spec.energySavingRate}%`;
    if (feature === 'APF（通年エネルギー消費効率）') return spec.apf.toFixed(1);
    if (feature === '期間消費電力量（JIS C 9612:2013）') {
      return `${new Intl.NumberFormat('ja-JP').format(spec.periodKWh)}kWh`;
    }
    if (feature === '低温暖房能力（外気温2℃時）') {
      return `${spec.lowTempHeatingKw.toFixed(1)}kW`;
    }
  }

  const staticFeatures = seriesFeatures[series].features as Record<string, string | boolean>;
  return staticFeatures[feature] ?? '-';
};

const renderFeatureValue = (value: string | boolean) => {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon sx={{ color: '#22c55e' }} />
    ) : (
      <CancelIcon sx={{ color: '#d1d5db' }} />
    );
  }

  return (
    <Typography
      variant="body2"
      fontWeight={value !== '-' ? 600 : 400}
      color={value !== '-' ? 'text.primary' : 'text.disabled'}
    >
      {value}
    </Typography>
  );
};

// シリーズカラー
const seriesColors: Record<Series, string> = {
  XS: '#2563eb',
  EX: '#f59e0b',
  J: '#94a3b8',
};

import { theme } from './theme';

const App: React.FC = () => {
  // State管理
  const [selectedTatami, setSelectedTatami] = useState<TatamiSize>(6);
  const kWhCost = kWhCostWithTax;
  const [dailyHours, setDailyHours] = useState(8);
  const [coolRatio, setCoolRatio] = useState(50);
  const [years, setYears] = useState(10);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);

  // 出力用State
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [exportType, setExportType] = useState<'jpg' | 'pdf'>('pdf');

  // シミュレーター1画面に統合

  // 利用可能シリーズ
  const availableSeries = useMemo(() => getAvailableSeries(selectedTatami), [selectedTatami]);

  // 計算ロジック
  const calculationResults: CalculationResult[] = useMemo(() => {
    const toKWh = (w: number) => w / 1000;
    const weightedKWh = (coolW: number, heatW: number) =>
      toKWh(coolW) * (coolRatio / 100) + toKWh(heatW) * (1 - coolRatio / 100);
    const annualElecYen = (coolW: number, heatW: number) =>
      weightedKWh(coolW, heatW) * dailyHours * 365 * kWhCost;

    const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
    return availableSeries.map(series => {
      const spec = specs[series]!;
      const unitPrice = spec.unitPrice ?? 0;
      const annualCost = annualElecYen(spec.coolW, spec.heatW);
      const totalElecCost = annualCost * years;
      const totalCost = unitPrice + totalElecCost;
      return { series, unitPrice, installCost: 0, annualElecCost: annualCost, totalElecCost, totalCost };
    });
  }, [selectedTatami, coolRatio, dailyHours, availableSeries, years, kWhCost]);

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

  // 年数別総費用推移データ（折れ線グラフ用）- 選択した年数まで表示
  const lineChartData = useMemo(() => {
    const validResults = calculationResults.filter(r => r.unitPrice > 0);
    if (validResults.length === 0) return [];

    // 1年目から選択した年数までのデータを生成
    return Array.from({ length: years }, (_, i) => {
      const year = i + 1;
      const dataPoint: Record<string, number | string> = { year: `${year}年`, yearNum: year };

      validResults.forEach(result => {
        dataPoint[result.series] = Math.round(result.unitPrice + result.annualElecCost * year);
      });

      return dataPoint;
    });
  }, [calculationResults, years]);

  const formatCurrency = (amount: number) =>
    `¥${new Intl.NumberFormat('ja-JP').format(Math.round(amount))}`;

  // 印刷用エリアの参照（JPG用：全体、PDF用：2ページ分割）
  const printRef = useRef<HTMLDivElement>(null);
  const printPage1Ref = useRef<HTMLDivElement>(null);
  const printPage2Ref = useRef<HTMLDivElement>(null);
  const printPage3Ref = useRef<HTMLDivElement>(null);

  // 出力ダイアログを開く
  const openExportDialog = useCallback((type: 'jpg' | 'pdf') => {
    setExportType(type);
    setExportDialogOpen(true);
  }, []);

  // 出力実行
  const handleExport = useCallback(async () => {
    setExportDialogOpen(false);

    // 少し待ってからキャプチャ（名前の表示を反映させるため）
    await new Promise(resolve => setTimeout(resolve, 100));

    const fileName = customerName
      ? `エアコン比較_${customerName}様_${selectedTatami}畳_${years}年`
      : `エアコン比較_${selectedTatami}畳_${years}年`;

    if (exportType === 'jpg') {
      // JPG: 全体を1枚でキャプチャ
      if (!printRef.current) return;
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowHeight: printRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${fileName}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } else {
      // PDF: 2ページに分割（文字を大きく）
      if (!printPage1Ref.current || !printPage2Ref.current) return;

      const margin = 8;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;

      // ページ1: 費用比較テーブル + グラフ
      const canvas1 = await html2canvas(printPage1Ref.current, {
        scale: 3, // 高解像度でキャプチャ
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowHeight: printPage1Ref.current.scrollHeight,
      });
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
      const ratio1 = Math.min(pdfWidth / canvas1.width, pdfHeight / canvas1.height);
      const imgX1 = margin + (pdfWidth - canvas1.width * ratio1) / 2;
      pdf.addImage(imgData1, 'JPEG', imgX1, margin, canvas1.width * ratio1, canvas1.height * ratio1);

      // ページ2: 機能比較表
      pdf.addPage();
      const canvas2 = await html2canvas(printPage2Ref.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowHeight: printPage2Ref.current.scrollHeight,
      });
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
      const ratio2 = Math.min(pdfWidth / canvas2.width, pdfHeight / canvas2.height);
      const imgX2 = margin + (pdfWidth - canvas2.width * ratio2) / 2;
      pdf.addImage(imgData2, 'JPEG', imgX2, margin, canvas2.width * ratio2, canvas2.height * ratio2);

      // ページ3: 暮らしメリット（XSがある畳数のみ）
      if (printPage3Ref.current) {
        pdf.addPage();
        const canvas3 = await html2canvas(printPage3Ref.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollY: -window.scrollY,
          windowHeight: printPage3Ref.current.scrollHeight,
        });
        const imgData3 = canvas3.toDataURL('image/jpeg', 0.95);
        const ratio3 = Math.min(pdfWidth / canvas3.width, pdfHeight / canvas3.height);
        const imgX3 = margin + (pdfWidth - canvas3.width * ratio3) / 2;
        pdf.addImage(imgData3, 'JPEG', imgX3, margin, canvas3.width * ratio3, canvas3.height * ratio3);
      }

      pdf.save(`${fileName}.pdf`);
    }
  }, [customerName, exportType, selectedTatami, years]);

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

  // 折れ線グラフ用Tooltip
  const LineChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, minWidth: 160 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{label}目</Typography>
          <Stack spacing={0.5}>
            {payload.map((entry) => (
              <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
                {entry.name}: <strong>{formatCurrency(entry.value as number)}</strong>
              </Typography>
            ))}
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  // 折れ線グラフの差額マーカー用ラベル（線と被らないよう上部余白にピル型で表示）
  const GapLabel = (props: { viewBox?: { x?: number; y?: number }; text?: string; fontSize?: number }) => {
    const { viewBox, text = '', fontSize = 13 } = props;
    if (!viewBox || viewBox.x === undefined) return null;

    // 全角・半角を考慮したざっくり幅見積もり
    const textWidth = [...text].reduce(
      (w, ch) => w + (ch.charCodeAt(0) > 0xff ? fontSize : fontSize * 0.62),
      0,
    );
    const padX = 10;
    const pillH = fontSize + 12;
    const anchorX = viewBox.x - 4;
    const pillY = 4;
    return (
      <g>
        <rect
          x={anchorX - textWidth - padX * 2}
          y={pillY}
          width={textWidth + padX * 2}
          height={pillH}
          rx={pillH / 2}
          fill="#fef2f2"
          stroke="#fca5a5"
        />
        <text
          x={anchorX - padX}
          y={pillY + pillH / 2 + fontSize * 0.36}
          textAnchor="end"
          fill="#dc2626"
          fontSize={fontSize}
          fontWeight={700}
        >
          {text}
        </text>
      </g>
    );
  };

  // 累積差額グラフ用Tooltip
  const SavingsTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, minWidth: 200 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{label}目</Typography>
          <Stack spacing={0.5}>
            {payload.map((entry) => {
              const value = entry.value as number;
              return (
                <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
                  {entry.name}: {value >= 0
                    ? <strong>XSが {formatCurrency(value)} おトク</strong>
                    : <>XSが {formatCurrency(-value)} 高い（回収中）</>}
                </Typography>
              );
            })}
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  const validResults = useMemo(
    () => calculationResults.filter(r => r.unitPrice > 0),
    [calculationResults],
  );

  const cheapestResult = useMemo(() => {
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) =>
      current.totalCost < min.totalCost ? current : min,
    );
  }, [validResults]);

  const energyBestResult = useMemo(() => {
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) =>
      current.annualElecCost < min.annualElecCost ? current : min,
    );
  }, [validResults]);

  // XSが全シリーズ中で総費用最安になる使用年数（0 = 最初から最安、null = 逆転しない）
  const xsCheapestFromYear = useMemo(() => {
    const xs = validResults.find(r => r.series === 'XS');
    const others = validResults.filter(r => r.series !== 'XS');
    if (!xs || others.length === 0) return null;

    let requiredYears = 0;
    for (const other of others) {
      const initialDiff = xs.unitPrice - other.unitPrice;
      if (initialDiff <= 0) continue;
      const annualSaving = other.annualElecCost - xs.annualElecCost;
      if (annualSaving <= 0) return null;
      requiredYears = Math.max(requiredYears, Math.ceil(initialDiff / annualSaving));
    }
    return requiredYears;
  }, [validResults]);

  // 短期間で買い替えるなら本体価格が一番安いシリーズが有利
  const lowestPriceSeries = useMemo(() => {
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) =>
      current.unitPrice < min.unitPrice ? current : min,
    ).series;
  }, [validResults]);

  // XSと電気代が最も高いシリーズとの年間電気代差（暮らしメリット換算用）
  const xsAnnualSaving = useMemo(() => {
    const xs = validResults.find(r => r.series === 'XS');
    const others = validResults.filter(r => r.series !== 'XS');
    if (!xs || others.length === 0) return null;

    const mostExpensive = others.reduce((max, current) =>
      current.annualElecCost > max.annualElecCost ? current : max,
    );
    const saving = mostExpensive.annualElecCost - xs.annualElecCost;
    if (saving <= 0) return null;

    return { saving, comparisonSeries: mostExpensive.series };
  }, [validResults]);

  // XS以外のシリーズ一覧（差額グラフ用）
  const otherSeriesList = useMemo(
    () => validResults.filter(r => r.series !== 'XS').map(r => r.series),
    [validResults],
  );

  // XSとの累積差額データ（プラス = XSの方がおトク）
  const savingsChartData = useMemo(() => {
    const xs = validResults.find(r => r.series === 'XS');
    const others = validResults.filter(r => r.series !== 'XS');
    if (!xs || others.length === 0) return [];

    return Array.from({ length: years }, (_, i) => {
      const year = i + 1;
      const point: Record<string, number | string> = { year: `${year}年` };
      others.forEach(other => {
        point[other.series] = Math.round(
          (other.unitPrice + other.annualElecCost * year) - (xs.unitPrice + xs.annualElecCost * year),
        );
      });
      return point;
    });
  }, [validResults, years]);

  // 最終年の最安と最高の開き（折れ線グラフの差額マーカー用）
  const finalYearSpread = useMemo(() => {
    if (validResults.length < 2) return null;
    const totals = validResults.map(r => r.totalCost);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    if (max - min <= 0) return null;
    return { min, max, diff: max - min };
  }, [validResults]);

  // 使い方シーンの選択（運転時間・冷暖房比率も連動）
  const handleScenarioSelect = useCallback((id: ScenarioId) => {
    if (selectedScenario === id) {
      setSelectedScenario(null);
      return;
    }
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;
    setSelectedScenario(id);
    setDailyHours(scenario.dailyHours);
    setCoolRatio(scenario.coolRatio);
  }, [selectedScenario]);

  // 価格差を計算
  const priceDifference = useMemo(() => {
    if (validResults.length < 2) return null;

    const sorted = [...validResults].sort((a, b) => a.totalCost - b.totalCost);
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];

    return {
      cheapest: cheapest.series,
      mostExpensive: mostExpensive.series,
      difference: mostExpensive.totalCost - cheapest.totalCost,
    };
  }, [validResults]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          backgroundImage: 'linear-gradient(180deg, #eef4ff 0px, #f8fafc 220px)',
        }}
      >
        {/* ヘッダー */}
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #dbe7fb', backdropFilter: 'blur(6px)' }}
        >
          <Toolbar>
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  letterSpacing: 0,
                  textAlign: 'center',
                  fontSize: { xs: '1.32rem', sm: '1.5rem' },
                  lineHeight: 1.35,
                }}
              >
                エアコン総費用シミュレーター
              </Typography>
            </Container>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
          <Stack spacing={3}>
                {/* 設定パネル */}
                <Card>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h6" fontWeight="600">基本設定</Typography>
                  </Box>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={2}>
                          <Card variant="outlined" sx={{ borderColor: '#dbe7fb' }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                              <Stack spacing={1.25}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <HomeIcon fontSize="small" color="action" />
                                  <Typography variant="subtitle1" fontWeight={700}>お部屋の畳数</Typography>
                                </Stack>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={selectedTatami}
                                    onChange={(e) => setSelectedTatami(Number(e.target.value) as TatamiSize)}
                                  >
                                    {tatamiOptions.map(tatami => (
                                      <MenuItem key={tatami} value={tatami}>{tatami}畳</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Stack>
                            </CardContent>
                          </Card>

                          <Card variant="outlined" sx={{ borderColor: '#dbe7fb' }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                              <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <MoneyIcon fontSize="small" color="action" />
                                  <Typography variant="subtitle1" fontWeight={700}>チラシ価格</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  添付チラシの税込価格を自動反映します。
                                </Typography>
                                <Stack spacing={1}>
                                  {availableSeries.map(series => {
                                    const spec = (acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>)[series]!;
                                    return (
                                      <Box
                                        key={`flyer-price-${series}`}
                                        sx={{
                                          p: 1.25,
                                          border: '1px solid #dbe7fb',
                                          borderRadius: 2,
                                          bgcolor: series === cheapestSeries ? '#eff6ff' : '#ffffff',
                                        }}
                                      >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                          <Box>
                                            <Typography fontWeight="800">{series}シリーズ</Typography>
                                            <Typography variant="caption" color="text.secondary">{spec.model}</Typography>
                                          </Box>
                                          <Typography fontWeight="800" color="primary.main">
                                            {formatCurrency(spec.unitPrice ?? 0)}
                                          </Typography>
                                        </Stack>
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Stack>
                      </Grid>

                      <Grid size={{ xs: 12, md: 7 }}>
                        <Card variant="outlined" sx={{ borderColor: '#dbe7fb', height: '100%' }}>
                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Stack spacing={2.5}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <SettingsIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                  比較条件
                                </Typography>
                              </Stack>

                              <Card variant="outlined" sx={{ borderColor: '#e2e8f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Stack spacing={1.25}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <HomeIcon fontSize="small" color="action" />
                                      <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                                        使い方シーン（選ぶと時間・冷暖房比率も自動設定）
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                      {scenarios.map(scenario => (
                                        <Chip
                                          key={scenario.id}
                                          label={`${scenario.desc} ${scenario.label}`}
                                          size="small"
                                          clickable
                                          color={selectedScenario === scenario.id ? 'primary' : 'default'}
                                          variant={selectedScenario === scenario.id ? 'filled' : 'outlined'}
                                          onClick={() => handleScenarioSelect(scenario.id)}
                                        />
                                      ))}
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                      選んだシーンに合わせて「暮らしメリット」の表示も切り替わります
                                    </Typography>
                                  </Stack>
                                </CardContent>
                              </Card>

                              <Card variant="outlined" sx={{ borderColor: '#e2e8f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Stack spacing={1.25}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <CalendarIcon fontSize="small" color="primary" />
                                      <Typography variant="subtitle2" color="primary.main" fontWeight="700">
                                        比較年数: {years}年
                                      </Typography>
                                    </Stack>
                                    <Box sx={{ width: '100%', px: 1 }}>
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
                                        valueLabelDisplay="on"
                                        color="primary"
                                      />
                                    </Box>
                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                      {[5, 10, 15].map((value) => (
                                        <Chip
                                          key={value}
                                          label={`${value}年`}
                                          size="small"
                                          clickable
                                          color={years === value ? 'primary' : 'default'}
                                          variant={years === value ? 'filled' : 'outlined'}
                                          onClick={() => setYears(value)}
                                        />
                                      ))}
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>

                              <Card variant="outlined" sx={{ borderColor: '#e2e8f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Stack spacing={1.25}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <TimeIcon fontSize="small" color="action" />
                                      <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                                        1日の運転時間: {dailyHours}時間
                                      </Typography>
                                    </Stack>
                                    <Box sx={{ width: '100%', px: 1 }}>
                                      <Slider
                                        value={dailyHours}
                                        onChange={(_, value) => setDailyHours(value as number)}
                                        min={1}
                                        max={24}
                                        step={1}
                                        marks={[
                                          { value: 1, label: '1h' },
                                          { value: 8, label: '8h' },
                                          { value: 24, label: '24h' },
                                        ]}
                                        valueLabelDisplay="on"
                                      />
                                    </Box>
                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                      {[4, 8, 12, 24].map((value) => (
                                        <Chip
                                          key={value}
                                          label={`${value}h`}
                                          size="small"
                                          clickable
                                          color={dailyHours === value ? 'primary' : 'default'}
                                          variant={dailyHours === value ? 'filled' : 'outlined'}
                                          onClick={() => setDailyHours(value)}
                                        />
                                      ))}
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>

                              <Card variant="outlined" sx={{ borderColor: '#e2e8f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Stack spacing={1.25}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <ThermostatIcon fontSize="small" color="action" />
                                      <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                                        冷房 {coolRatio}% / 暖房 {100 - coolRatio}%
                                      </Typography>
                                    </Stack>
                                    <Box sx={{ width: '100%', px: 1 }}>
                                      <Slider
                                        value={coolRatio}
                                        onChange={(_, value) => setCoolRatio(value as number)}
                                        min={0}
                                        max={100}
                                        step={5}
                                        track={false}
                                        marks={[
                                          { value: 0, label: '暖房' },
                                          { value: 50, label: '半々' },
                                          { value: 100, label: '冷房' },
                                        ]}
                                        valueLabelDisplay="on"
                                        sx={{
                                          '& .MuiSlider-rail': {
                                            opacity: 1,
                                            background: 'linear-gradient(to right, #f97316, #3b82f6)',
                                          },
                                        }}
                                      />
                                    </Box>
                                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                      {[20, 50, 80].map((value) => (
                                        <Chip
                                          key={value}
                                          label={`冷房${value}%`}
                                          size="small"
                                          clickable
                                          color={coolRatio === value ? 'primary' : 'default'}
                                          variant={coolRatio === value ? 'filled' : 'outlined'}
                                          onClick={() => setCoolRatio(value)}
                                        />
                                      ))}
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {validResults.length > 0 && cheapestResult && energyBestResult && (
                  <Card>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      <Box>
                        <Typography variant="h6" fontWeight="700">結果まとめ</Typography>
                        <Typography variant="caption" color="text.secondary">
                          この条件（{years}年・1日{dailyHours}時間）で計算した3つのポイント
                        </Typography>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ height: '100%', p: 2, border: '1px solid #dbe7fb', borderRadius: 2, bgcolor: '#f8fbff' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="700">
                              💰 {years}年間トータルで一番おトクなのは？
                            </Typography>
                            <Typography variant="h5" fontWeight="800" color="primary.main" sx={{ mt: 0.75 }}>
                              {cheapestResult.series}シリーズ
                            </Typography>
                            <Typography variant="h6" fontWeight="800">{formatCurrency(cheapestResult.totalCost)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                              本体価格＋{years}年分の電気代の合計です。
                              {priceDifference && (
                                <>いちばん高い場合より {formatCurrency(priceDifference.difference)} おトク。</>
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ height: '100%', p: 2, border: '1px solid #dbe7fb', borderRadius: 2, bgcolor: '#f8fbff' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="700">
                              ⚡ 毎月の電気代が一番安いのは？
                            </Typography>
                            <Typography variant="h5" fontWeight="800" color="primary.main" sx={{ mt: 0.75 }}>
                              {energyBestResult.series}シリーズ
                            </Typography>
                            <Typography variant="h6" fontWeight="800">月あたり 約{formatCurrency(energyBestResult.annualElecCost / 12)}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                              1年間だと 約{formatCurrency(energyBestResult.annualElecCost)}。使う年数が長いほど差が効いてきます。
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ height: '100%', p: 2, border: '1px solid #dbe7fb', borderRadius: 2, bgcolor: '#f8fbff' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="700">
                              {xsCheapestFromYear !== null ? '⏳ 長く使うなら、どれがおトク？' : '📝 選び方のヒント'}
                            </Typography>
                            <Typography variant="h5" fontWeight="800" color="primary.main" sx={{ mt: 0.75 }}>
                              {xsCheapestFromYear !== null
                                ? xsCheapestFromYear === 0
                                  ? '何年使ってもXSシリーズ'
                                  : `${xsCheapestFromYear}年以上使うならXSシリーズ`
                                : cheapestResult.series === energyBestResult.series
                                  ? `${cheapestResult.series}シリーズがおすすめ`
                                  : `${cheapestResult.series} か ${energyBestResult.series}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                              {xsCheapestFromYear !== null
                                ? xsCheapestFromYear === 0
                                  ? '本体価格と電気代を合わせると、最初からXSが一番おトクです。'
                                  : `${lowestPriceSeries ? `それより短いなら${lowestPriceSeries}シリーズが有利。` : ''}${
                                      xsCheapestFromYear <= 13
                                        ? 'エアコンは平均13〜14年使われるので、平均的に使うご家庭ならXSが一番おトクです。'
                                        : '短めの買い替え予定なら価格重視、長く快適に使うならXSがおすすめです。'
                                    }`
                                : cheapestResult.series === energyBestResult.series
                                  ? 'トータル費用も毎月の電気代も、このシリーズが一番おトクです。'
                                : '「トータルで安い方」か「毎月の電気代が安い方」か、重視するポイントで選べます。'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* 結果表示 */}
                {validResults.length > 0 && (
                  <>
                    {/* 出力ボタン */}
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ImageIcon />}
                        onClick={() => openExportDialog('jpg')}
                        size="medium"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        JPGで保存
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<PdfIcon />}
                        onClick={() => openExportDialog('pdf')}
                        size="medium"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        PDFで保存
                      </Button>
                    </Stack>

                    {/* JPG用：全体を1つにまとめた印刷エリア */}
                    <Box ref={printRef} sx={{ bgcolor: 'white', p: 2, borderRadius: 2 }}>
                      {/* ヘッダー（印刷用） */}
                      <Box sx={{ mb: 2, pb: 1, borderBottom: '3px solid #2563eb' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          {customerName && (
                            <Typography variant="h6" fontWeight="700" color="text.primary">
                              {customerName} さま
                            </Typography>
                          )}
                          <Box sx={{ flex: 1 }} />
                        </Stack>
                        <Typography variant="h5" fontWeight="700" color="primary.main" textAlign="center">
                          エアコン {selectedTatami}畳用 シリーズ比較表
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
                          使用条件：1日{dailyHours}時間 / 冷房{coolRatio}%・暖房{100 - coolRatio}%
                        </Typography>
                      </Box>

                      {/* テーブル */}
                      <Card sx={{ mb: 2 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon color="primary" />
                          <Typography variant="h6" fontWeight="600">{years}年総費用比較</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            チラシ価格 + {years}年間の電気代
                          </Typography>
                        </Box>
                        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>シリーズ</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>チラシ価格</TableCell>
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
                        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                          <Stack spacing={1.5}>
                            {validResults.map((result) => (
                              <Box
                                key={`mobile-cost-${result.series}`}
                                sx={{
                                  p: 1.5,
                                  border: '1px solid #dbe7fb',
                                  borderRadius: 2,
                                  bgcolor: cheapestSeries === result.series ? '#eff6ff' : '#ffffff',
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="h6" fontWeight="800">{result.series}</Typography>
                                    {cheapestSeries === result.series && (
                                      <Chip label="最安" color="primary" size="small" />
                                    )}
                                  </Stack>
                                  <Typography variant="h6" fontWeight="800" color="primary.main">
                                    {formatCurrency(result.totalCost)}
                                  </Typography>
                                </Stack>
                                <Grid container spacing={1.25} sx={{ mt: 1 }}>
                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">チラシ価格</Typography>
                                    <Typography fontWeight="700">{formatCurrency(result.unitPrice)}</Typography>
                                  </Grid>
                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">年間電気代</Typography>
                                    <Typography fontWeight="700">{formatCurrency(result.annualElecCost)}</Typography>
                                  </Grid>
                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">{years}年電気代</Typography>
                                    <Typography fontWeight="700">{formatCurrency(result.totalElecCost)}</Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        {priceDifference && (
                          <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderTop: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" color="primary.main" fontWeight="600" textAlign="center">
                              {years}年間で {priceDifference.cheapest} は {priceDifference.mostExpensive} より{' '}
                              <strong>{formatCurrency(priceDifference.difference)}</strong> お得！
                            </Typography>
                          </Box>
                        )}
                      </Card>

                      {/* グラフ */}
                      {chartData.length > 0 && (
                        <Grid container spacing={3}>
                          {/* 総費用比較グラフ */}
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Card sx={{ height: '100%' }}>
                              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ChartIcon color="primary" />
                                <Typography variant="h6" fontWeight="600">{years}年総費用</Typography>
                              </Box>
                              <CardContent>
                                <Box sx={{ height: 300, width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 28, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="series" tick={{ fill: '#64748b', fontSize: 12 }} />
                                      <YAxis
                                        tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                      />
                                      <Tooltip content={<CustomTooltip />} />
                                      <Bar dataKey="cost" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={seriesColors[entry.series as Series] || '#94a3b8'}
                                          />
                                        ))}
                                        <LabelList
                                          dataKey="cost"
                                          position="top"
                                          formatter={(value: number) => `${(value / 10000).toFixed(1)}万円`}
                                          fill="#334155"
                                          fontSize={13}
                                          fontWeight={700}
                                        />
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* 年数別総費用推移グラフ（折れ線） */}
                          <Grid size={{ xs: 12, md: 7 }}>
                            <Card sx={{ height: '100%' }}>
                              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon color="primary" />
                                <Typography variant="h6" fontWeight="600">使うほど差が開く！年数別総費用</Typography>
                              </Box>
                              <CardContent>
                                <Box sx={{ height: 300, width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={lineChartData} margin={{ top: 34, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis
                                        dataKey="year"
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        interval={1}
                                      />
                                      <YAxis
                                        tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                      />
                                      <Tooltip content={<LineChartTooltip />} />
                                      <Legend
                                        wrapperStyle={{ paddingTop: 10 }}
                                        formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                                      />
                                      {finalYearSpread && (
                                        <ReferenceLine
                                          segment={[
                                            { x: `${years}年`, y: finalYearSpread.min },
                                            { x: `${years}年`, y: finalYearSpread.max },
                                          ]}
                                          stroke="#dc2626"
                                          strokeWidth={3}
                                          strokeLinecap="round"
                                          label={<GapLabel text={`${years}年で ${formatCurrency(finalYearSpread.diff)} の差！`} />}
                                        />
                                      )}
                                      {calculationResults.filter(r => r.unitPrice > 0).map((result) => (
                                        <Line
                                          key={result.series}
                                          type="monotone"
                                          dataKey={result.series}
                                          stroke={seriesColors[result.series]}
                                          strokeWidth={result.series === 'XS' ? 3 : 2}
                                          dot={{ r: result.series === 'XS' ? 4 : 3 }}
                                          activeDot={{ r: 6 }}
                                          isAnimationActive={false}
                                        />
                                      ))}
                                    </LineChart>
                                  </ResponsiveContainer>
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
                                  省エネ性能の高いXSシリーズは、長く使うほど電気代の差で元が取れます
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* XSとの累積差額グラフ */}
                          {savingsChartData.length > 0 && (
                            <Grid size={12}>
                              <Card>
                                <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MoneyIcon color="primary" />
                                  <Box>
                                    <Typography variant="h6" fontWeight="600">XSを選ぶと、いくらおトク？</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      同じ年数使った場合の総費用の差（0円より上 ＝ XSの方がおトク）
                                    </Typography>
                                  </Box>
                                </Box>
                                <CardContent>
                                  <Box sx={{ height: 280, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={savingsChartData} margin={{ top: 24, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} interval={years > 12 ? 1 : 0} />
                                        <YAxis
                                          tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                          tick={{ fill: '#64748b', fontSize: 12 }}
                                          domain={[(dataMin: number) => Math.min(dataMin, 0), (dataMax: number) => Math.max(dataMax, 0)]}
                                        />
                                        <Tooltip content={<SavingsTooltip />} />
                                        <Legend
                                          wrapperStyle={{ paddingTop: 10 }}
                                          formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                                        />
                                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} label={{ value: '0円', position: 'right', fill: '#64748b', fontSize: 11 }} />
                                        {xsCheapestFromYear !== null && xsCheapestFromYear > 0 && xsCheapestFromYear <= years && (
                                          <ReferenceLine
                                            x={`${xsCheapestFromYear}年`}
                                            stroke="#2563eb"
                                            strokeDasharray="4 4"
                                            label={{
                                              value: `${xsCheapestFromYear}年目からXSがおトク！`,
                                              position: 'top',
                                              fill: '#2563eb',
                                              fontSize: 13,
                                              fontWeight: 700,
                                            }}
                                          />
                                        )}
                                        {otherSeriesList.map(series => (
                                          <Bar key={series} dataKey={series} name={`${series}と比べて`} fill={seriesColors[series]} isAnimationActive={false}>
                                            {savingsChartData.map((entry, index) => (
                                              <Cell
                                                key={`savings-${series}-${index}`}
                                                fill={(entry[series] as number) >= 0 ? seriesColors[series] : '#cbd5e1'}
                                              />
                                            ))}
                                          </Bar>
                                        ))}
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
                                    グレーの棒 ＝ まだ本体の価格差を回収中 / 色付きの棒 ＝ XSの方がおトクになった金額
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {/* シリーズ機能比較表 */}
                      <Card>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CompareIcon color="primary" />
                          <Typography variant="h6" fontWeight="600">2026年モデル シリーズ機能比較</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ※パナソニック公式情報に基づく
                          </Typography>
                        </Box>
                        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>機能</TableCell>
                                {availableSeries.map(series => {
                                  const info = seriesFeatures[series];
                                  const spec = (acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>)[series];
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
                                            label="省エネ重視"
                                            size="small"
                                            color="primary"
                                            sx={{ mb: 0.5 }}
                                          />
                                        )}
                                        <Typography fontWeight="700" color={info.color}>
                                          {info.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {info.grade}
                                        </Typography>
                                        {spec && (
                                          <Typography variant="caption" color="text.secondary">
                                            {spec.model}
                                          </Typography>
                                        )}
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
                                  const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
                                  const spec = specs[series]!;
                                  const isLowest = availableSeries.every(s => {
                                    const otherSpec = specs[s]!;
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
                                    <span>チラシ価格</span>
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
                                    const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
                                    const value = getSeriesFeatureValue(feature, series, specs[series]);
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
                                        {renderFeatureValue(value)}
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
                                            XSシリーズが省エネ重視で選ばれる理由
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            • <strong>省エネ性能No.1</strong> - 消費電力が最も低く、長期間使うほど電気代で差がつきます<br />
                                            • <strong>ナノイーX 48兆</strong> - 最高濃度でカビ・花粉・ウイルス・PM2.5を抑制<br />
                                            • <strong>エネチャージ</strong> - 霜取り運転中も暖房が止まらず快適<br />
                                            • <strong>AI快適おまかせ</strong> - ボタン一つで運転モードと温度を自動最適化<br />
                                            • <strong>耐塩害仕様</strong> - ブルーフィンコーティングで室外機の耐久性向上
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
                        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                          <Stack spacing={1.5}>
                            {availableSeries.map(series => {
                              const info = seriesFeatures[series];
                              const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
                              const spec = specs[series]!;
                              const result = calculationResults.find(r => r.series === series);

                              return (
                                <Box
                                  key={`mobile-feature-${series}`}
                                  sx={{
                                    border: '1px solid #dbe7fb',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    bgcolor: info.highlight ? '#eff6ff' : '#ffffff',
                                  }}
                                >
                                  <Box sx={{ p: 1.5, borderBottom: '1px solid #dbe7fb' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                      <Box>
                                        <Typography variant="h6" fontWeight="800" color={info.color}>
                                          {info.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">{info.grade}</Typography>
                                        <Typography variant="body2" color="text.secondary">{spec.model}</Typography>
                                      </Box>
                                      <Stack spacing={0.5} alignItems="flex-end">
                                        {info.highlight && <Chip label="省エネ重視" size="small" color="primary" />}
                                        {cheapestSeries === series && <Chip label="最安" size="small" color="success" />}
                                      </Stack>
                                    </Stack>
                                  </Box>
                                  <Box sx={{ p: 1.5 }}>
                                    <Grid container spacing={1.25}>
                                      <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary">冷房</Typography>
                                        <Typography fontWeight="700">{spec.coolW}W</Typography>
                                      </Grid>
                                      <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary">暖房</Typography>
                                        <Typography fontWeight="700">{spec.heatW}W</Typography>
                                      </Grid>
                                      <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary">{years}年総費用</Typography>
                                        <Typography fontWeight="800" color="primary.main">
                                          {result && result.unitPrice > 0 ? formatCurrency(result.totalCost) : '-'}
                                        </Typography>
                                      </Grid>
                                      <Grid size={6}>
                                        <Typography variant="caption" color="text.secondary">APF</Typography>
                                        <Typography fontWeight="700">{spec.apf.toFixed(1)}</Typography>
                                      </Grid>
                                    </Grid>
                                    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                                      {featureLabels.filter(feature => feature !== '品番' && feature !== 'APF（通年エネルギー消費効率）').map(feature => {
                                        const value = getSeriesFeatureValue(feature, series, spec);
                                        return (
                                          <Stack
                                            key={`mobile-${series}-${feature}`}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            spacing={1.5}
                                            sx={{ py: 0.75, borderTop: '1px solid #e2e8f0' }}
                                          >
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                                              {feature}
                                            </Typography>
                                            <Box sx={{ textAlign: 'right', flexShrink: 0, maxWidth: '50%' }}>
                                              {renderFeatureValue(value)}
                                            </Box>
                                          </Stack>
                                        );
                                      })}
                                    </Stack>
                                  </Box>
                                </Box>
                              );
                            })}
                            {availableSeries.includes('XS') && (
                              <Box sx={{ p: 1.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                                <Stack direction="row" alignItems="flex-start" spacing={1}>
                                  <StarIcon sx={{ color: '#2563eb', mt: 0.25 }} />
                                  <Box>
                                    <Typography fontWeight="700" color="primary.main">
                                      XSシリーズが省エネ重視で選ばれる理由
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      電気代を抑えやすく、ナノイーX 48兆、エネチャージ、AI快適おまかせなど快適機能も充実しています。
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Card>

                      {/* 暮らしメリット（電気代以外の訴求） */}
                      {availableSeries.includes('XS') && (
                        <Box sx={{ mt: 2 }}>
                          <LifestyleBenefits
                            years={years}
                            scenarioId={selectedScenario}
                            annualSaving={xsAnnualSaving?.saving ?? null}
                            comparisonSeries={xsAnnualSaving?.comparisonSeries ?? null}
                          />
                        </Box>
                      )}
                    </Box>
                    {/* JPG用印刷エリア終了 */}

                    {/* PDF用ページ1: 費用比較 + グラフ（画面外に配置、大きな文字） */}
                    <Box
                      ref={printPage1Ref}
                      sx={{
                        position: 'absolute',
                        left: '-9999px',
                        top: 0,
                        width: '800px',
                        bgcolor: 'white',
                        p: 4,
                      }}
                    >
                      <Box sx={{ mb: 3, pb: 2, borderBottom: '4px solid #2563eb' }}>
                        {customerName && (
                          <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                            {customerName} さま
                          </Typography>
                        )}
                        <Typography variant="h3" fontWeight="700" color="primary.main" textAlign="center" sx={{ fontSize: '2.2rem' }}>
                          エアコン {selectedTatami}畳用 シリーズ比較表
                        </Typography>
                        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                          使用条件：1日{dailyHours}時間 / 冷房{coolRatio}%・暖房{100 - coolRatio}%
                        </Typography>
                      </Box>

                      {/* 費用比較テーブル */}
                      <Card sx={{ mb: 3 }}>
                        <Box sx={{ p: 2, borderBottom: '2px solid #e2e8f0' }}>
                          <Typography variant="h5" fontWeight="700" color="primary.main">
                            {years}年総費用比較
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            チラシ価格 + {years}年間の電気代
                          </Typography>
                        </Box>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>シリーズ</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>チラシ価格</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>年間電気代</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{years}年電気代</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'primary.main' }}>{years}年総費用</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {calculationResults.filter(r => r.unitPrice > 0).map((result) => (
                                <TableRow key={result.series}>
                                  <TableCell align="center">
                                    <Typography fontWeight="700" fontSize="1.1rem">{result.series}</Typography>
                                    {cheapestSeries === result.series && (
                                      <Chip label="最安" color="primary" size="small" sx={{ ml: 1 }} />
                                    )}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '1.1rem' }}>{formatCurrency(result.unitPrice)}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '1.1rem' }}>{formatCurrency(result.annualElecCost)}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '1.1rem' }}>{formatCurrency(result.totalElecCost)}</TableCell>
                                  <TableCell align="right">
                                    <Typography fontWeight="700" color="primary.main" fontSize="1.2rem">
                                      {formatCurrency(result.totalCost)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {priceDifference && (
                          <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderTop: '2px solid #e2e8f0' }}>
                            <Typography variant="h6" color="primary.main" fontWeight="700" textAlign="center">
                              {years}年間で {priceDifference.cheapest} は {priceDifference.mostExpensive} より{' '}
                              {formatCurrency(priceDifference.difference)} お得！
                            </Typography>
                          </Box>
                        )}
                      </Card>

                      {/* グラフ */}
                      {chartData.length > 0 && (
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Card>
                              <Box sx={{ p: 2, borderBottom: '2px solid #e2e8f0' }}>
                                <Typography variant="h5" fontWeight="700">{years}年総費用</Typography>
                              </Box>
                              <CardContent>
                                <Box sx={{ height: 280, width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 28, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="series" tick={{ fill: '#64748b', fontSize: 14 }} />
                                      <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}万`} tick={{ fill: '#64748b', fontSize: 14 }} />
                                      <Bar dataKey="cost" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-pdf-${index}`} fill={seriesColors[entry.series as Series] || '#94a3b8'} />
                                        ))}
                                        <LabelList
                                          dataKey="cost"
                                          position="top"
                                          formatter={(value: number) => `${(value / 10000).toFixed(1)}万円`}
                                          fill="#334155"
                                          fontSize={14}
                                          fontWeight={700}
                                        />
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid size={{ xs: 12, md: 7 }}>
                            <Card>
                              <Box sx={{ p: 2, borderBottom: '2px solid #e2e8f0' }}>
                                <Typography variant="h5" fontWeight="700">使うほど差が開く！年数別総費用</Typography>
                              </Box>
                              <CardContent>
                                <Box sx={{ height: 280, width: '100%' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={lineChartData} margin={{ top: 36, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} interval={1} />
                                      <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}万`} tick={{ fill: '#64748b', fontSize: 14 }} />
                                      <Legend wrapperStyle={{ paddingTop: 10 }} formatter={(value) => <span style={{ color: '#64748b', fontSize: 14 }}>{value}</span>} />
                                      {finalYearSpread && (
                                        <ReferenceLine
                                          segment={[
                                            { x: `${years}年`, y: finalYearSpread.min },
                                            { x: `${years}年`, y: finalYearSpread.max },
                                          ]}
                                          stroke="#dc2626"
                                          strokeWidth={3}
                                          strokeLinecap="round"
                                          label={<GapLabel text={`${years}年で ${formatCurrency(finalYearSpread.diff)} の差！`} fontSize={14} />}
                                        />
                                      )}
                                      {calculationResults.filter(r => r.unitPrice > 0).map((result) => (
                                        <Line key={`pdf-${result.series}`} type="monotone" dataKey={result.series} stroke={seriesColors[result.series]} strokeWidth={result.series === 'XS' ? 3 : 2} dot={{ r: result.series === 'XS' ? 4 : 3 }} isAnimationActive={false} />
                                      ))}
                                    </LineChart>
                                  </ResponsiveContainer>
                                </Box>
                                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                                  省エネ性能の高いXSシリーズは、長く使うほど電気代の差で元が取れます
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* XSとの累積差額グラフ（PDF用） */}
                          {savingsChartData.length > 0 && (
                            <Grid size={12}>
                              <Card>
                                <Box sx={{ p: 2, borderBottom: '2px solid #e2e8f0' }}>
                                  <Typography variant="h5" fontWeight="700">XSを選ぶと、いくらおトク？</Typography>
                                  <Typography variant="body1" color="text.secondary">
                                    同じ年数使った場合の総費用の差（0円より上 ＝ XSの方がおトク）
                                  </Typography>
                                </Box>
                                <CardContent>
                                  <Box sx={{ height: 280, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={savingsChartData} margin={{ top: 24, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} interval={years > 12 ? 1 : 0} />
                                        <YAxis
                                          tickFormatter={(value) => `${Math.round(value / 10000)}万`}
                                          tick={{ fill: '#64748b', fontSize: 14 }}
                                          domain={[(dataMin: number) => Math.min(dataMin, 0), (dataMax: number) => Math.max(dataMax, 0)]}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: 10 }} formatter={(value) => <span style={{ color: '#64748b', fontSize: 14 }}>{value}</span>} />
                                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} label={{ value: '0円', position: 'right', fill: '#64748b', fontSize: 12 }} />
                                        {xsCheapestFromYear !== null && xsCheapestFromYear > 0 && xsCheapestFromYear <= years && (
                                          <ReferenceLine
                                            x={`${xsCheapestFromYear}年`}
                                            stroke="#2563eb"
                                            strokeDasharray="4 4"
                                            label={{
                                              value: `${xsCheapestFromYear}年目からXSがおトク！`,
                                              position: 'top',
                                              fill: '#2563eb',
                                              fontSize: 14,
                                              fontWeight: 700,
                                            }}
                                          />
                                        )}
                                        {otherSeriesList.map(series => (
                                          <Bar key={`pdf-savings-${series}`} dataKey={series} name={`${series}と比べて`} fill={seriesColors[series]} isAnimationActive={false}>
                                            {savingsChartData.map((entry, index) => (
                                              <Cell
                                                key={`pdf-savings-${series}-${index}`}
                                                fill={(entry[series] as number) >= 0 ? seriesColors[series] : '#cbd5e1'}
                                              />
                                            ))}
                                          </Bar>
                                        ))}
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </Box>
                                  <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                                    グレーの棒 ＝ まだ本体の価格差を回収中 / 色付きの棒 ＝ XSの方がおトクになった金額
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </Box>

                    {/* PDF用ページ2: 機能比較表（画面外に配置、大きな文字） */}
                    <Box
                      ref={printPage2Ref}
                      sx={{
                        position: 'absolute',
                        left: '-9999px',
                        top: 0,
                        width: '800px',
                        bgcolor: 'white',
                        p: 4,
                      }}
                    >
                      <Box sx={{ mb: 3, pb: 2, borderBottom: '4px solid #2563eb' }}>
                        {customerName && (
                          <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                            {customerName} さま
                          </Typography>
                        )}
                        <Typography variant="h3" fontWeight="700" color="primary.main" textAlign="center" sx={{ fontSize: '2.2rem' }}>
                          2026年モデル シリーズ機能比較
                        </Typography>
                        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                          パナソニック エオリア {selectedTatami}畳用
                        </Typography>
                      </Box>

                      <Card>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 180 }}>機能</TableCell>
                                {availableSeries.map(series => {
                                  const info = seriesFeatures[series];
                                  const spec = (acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>)[series];
                                  return (
                                    <TableCell
                                      key={`pdf-head-${series}`}
                                      align="center"
                                      sx={{
                                        bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                        borderLeft: info.highlight ? '3px solid #2563eb' : 'none',
                                        borderRight: info.highlight ? '3px solid #2563eb' : 'none',
                                      }}
                                    >
                                      <Stack spacing={0.5} alignItems="center">
                                        {info.highlight && <Chip icon={<StarIcon sx={{ fontSize: 16 }} />} label="省エネ重視" size="small" color="primary" />}
                                        <Typography fontWeight="700" fontSize="1.2rem" color={info.color}>{info.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{info.grade}</Typography>
                                        {spec && (
                                          <Typography variant="body2" color="text.secondary">{spec.model}</Typography>
                                        )}
                                      </Stack>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {/* 消費電力 */}
                              <TableRow sx={{ bgcolor: '#fefce8' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>消費電力</TableCell>
                                {availableSeries.map(series => {
                                  const info = seriesFeatures[series];
                                  const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
                                  const spec = specs[series]!;
                                  return (
                                    <TableCell
                                      key={`pdf-power-${series}`}
                                      align="center"
                                      sx={{
                                        bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                        borderLeft: info.highlight ? '3px solid #2563eb' : 'none',
                                        borderRight: info.highlight ? '3px solid #2563eb' : 'none',
                                      }}
                                    >
                                      <Typography fontSize="1rem">冷房: <strong>{spec.coolW}W</strong></Typography>
                                      <Typography fontSize="1rem">暖房: <strong>{spec.heatW}W</strong></Typography>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              {/* 本体価格 */}
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>チラシ価格</TableCell>
                                {availableSeries.map(series => {
                                  const info = seriesFeatures[series];
                                  const result = calculationResults.find(r => r.series === series);
                                  return (
                                    <TableCell
                                      key={`pdf-price-${series}`}
                                      align="center"
                                      sx={{
                                        bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                        borderLeft: info.highlight ? '3px solid #2563eb' : 'none',
                                        borderRight: info.highlight ? '3px solid #2563eb' : 'none',
                                      }}
                                    >
                                      <Typography fontWeight="700" fontSize="1.1rem">
                                        {result && result.unitPrice > 0 ? formatCurrency(result.unitPrice) : '-'}
                                      </Typography>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              {/* 総費用 */}
                              <TableRow sx={{ bgcolor: '#f0f9ff' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{years}年総費用</TableCell>
                                {availableSeries.map(series => {
                                  const info = seriesFeatures[series];
                                  const result = calculationResults.find(r => r.series === series);
                                  return (
                                    <TableCell
                                      key={`pdf-total-${series}`}
                                      align="center"
                                      sx={{
                                        bgcolor: info.highlight ? '#eff6ff' : 'inherit',
                                        borderLeft: info.highlight ? '3px solid #2563eb' : 'none',
                                        borderRight: info.highlight ? '3px solid #2563eb' : 'none',
                                      }}
                                    >
                                      {result && result.unitPrice > 0 ? (
                                        <>
                                          <Typography fontWeight="700" color="primary.main" fontSize="1.2rem">
                                            {formatCurrency(result.totalCost)}
                                          </Typography>
                                          {cheapestSeries === series && <Chip label="最安" size="small" color="primary" sx={{ mt: 0.5 }} />}
                                        </>
                                      ) : '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              {/* 機能 */}
                              {featureLabels.map((feature, idx) => (
                                <TableRow key={`pdf-feat-${feature}`} sx={{ bgcolor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>{feature}</TableCell>
                                  {availableSeries.map(series => {
                                    const info = seriesFeatures[series];
                                    const specs = acSpecs[selectedTatami] as Partial<Record<Series, ACSpec>>;
                                    const value = getSeriesFeatureValue(feature, series, specs[series]);
                                    return (
                                      <TableCell
                                        key={`pdf-${series}-${feature}`}
                                        align="center"
                                        sx={{
                                          bgcolor: info.highlight ? (idx % 2 === 0 ? '#eff6ff' : '#e0f2fe') : 'inherit',
                                          borderLeft: info.highlight ? '3px solid #2563eb' : 'none',
                                          borderRight: info.highlight ? '3px solid #2563eb' : 'none',
                                        }}
                                      >
                                        {typeof value === 'boolean' ? (
                                          value ? <CheckIcon sx={{ color: '#22c55e', fontSize: 28 }} /> : <CancelIcon sx={{ color: '#d1d5db', fontSize: 28 }} />
                                        ) : (
                                          <Typography fontWeight={value !== '-' ? 700 : 400} fontSize="1rem" color={value !== '-' ? 'text.primary' : 'text.disabled'}>
                                            {value}
                                          </Typography>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* XS推しメッセージ */}
                        {availableSeries.includes('XS') && (
                          <Box sx={{ p: 3, bgcolor: '#eff6ff', borderTop: '2px solid #bfdbfe' }}>
                            <Stack direction="row" alignItems="flex-start" spacing={2}>
                              <StarIcon sx={{ color: '#2563eb', fontSize: 32, mt: 0.5 }} />
                              <Box>
                                <Typography variant="h6" fontWeight="700" color="primary.main" gutterBottom>
                                  XSシリーズが省エネ重視で選ばれる理由
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                  • <strong>省エネ性能No.1</strong> - 消費電力が最も低く、長期間使うほど電気代で差がつきます<br />
                                  • <strong>ナノイーX 48兆</strong> - 最高濃度でカビ・花粉・ウイルス・PM2.5を抑制<br />
                                  • <strong>エネチャージ</strong> - 霜取り運転中も暖房が止まらず快適<br />
                                  • <strong>AI快適おまかせ</strong> - ボタン一つで運転モードと温度を自動最適化<br />
                                  • <strong>耐塩害仕様</strong> - ブルーフィンコーティングで室外機の耐久性向上
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        )}
                      </Card>
                    </Box>

                    {/* PDF用ページ3: 暮らしメリット（画面外に配置、大きな文字） */}
                    {availableSeries.includes('XS') && (
                      <Box
                        ref={printPage3Ref}
                        sx={{
                          position: 'absolute',
                          left: '-9999px',
                          top: 0,
                          width: '800px',
                          bgcolor: 'white',
                          p: 4,
                        }}
                      >
                        <Box sx={{ mb: 3, pb: 2, borderBottom: '4px solid #ec4899' }}>
                          {customerName && (
                            <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                              {customerName} さま
                            </Typography>
                          )}
                          <Typography variant="h3" fontWeight="700" textAlign="center" sx={{ fontSize: '2.2rem', color: '#db2777' }}>
                            XSシリーズで変わる、毎日の暮らし
                          </Typography>
                          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                            電気代だけじゃない、「家事ラク・空気キレイ・家族快適」のメリット
                          </Typography>
                        </Box>
                        <LifestyleBenefits
                          years={years}
                          scenarioId={selectedScenario}
                          annualSaving={xsAnnualSaving?.saving ?? null}
                          comparisonSeries={xsAnnualSaving?.comparisonSeries ?? null}
                          variant="print"
                        />
                      </Box>
                    )}
                  </>
                )}

                {/* 計算式説明 */}
                <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #dbe7fb', borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
                    <InfoIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" fontWeight="700">計算式</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" display="block" textAlign="center">
                    年間電気代 = (冷房W × {coolRatio}% + 暖房W × {100 - coolRatio}%) × {dailyHours}h/日 × 365日 × 電気料金単価
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="block" textAlign="center">
                    {years}年総費用 = チラシ価格 + (年間電気代 × {years}年)
                  </Typography>
                </Paper>
            <OldACComparison
              selectedTatami={selectedTatami}
              dailyHours={dailyHours}
              coolRatio={coolRatio}
              years={years}
              kWhCost={kWhCost}
              planResults={calculationResults}
            />
            {validResults.length > 0 && (
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => openExportDialog('jpg')}
                  size="medium"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  JPGで保存
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={() => openExportDialog('pdf')}
                  size="medium"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  PDFで保存
                </Button>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      {/* 名前入力ダイアログ */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>お客様のお名前</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="お名前"
            placeholder="例: 山田太郎"
            fullWidth
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            ※ 空欄の場合は名前なしで出力されます
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExportDialogOpen(false)} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={exportType === 'pdf' ? <PdfIcon /> : <ImageIcon />}
          >
            {exportType === 'pdf' ? 'PDFを作成' : 'JPGを作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default App;
