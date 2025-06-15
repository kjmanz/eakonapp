import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { acSpecs, kWhCostWithTax } from './data/acSpecs';
import { scenarios } from './data/scenarios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FeatureTable from './components/FeatureTable';

// 型定義
type TatamiSize = keyof typeof acSpecs;
type Series = 'XS' | 'EX' | 'J';

type CalculationResult = {
  series: Series;
  unitPrice: number;
  model?: string;
  coolKWh: number; // 年間冷房消費電力量
  heatKWh: number; // 年間暖房消費電力量
  annualElecCost: number;
  totalElecCost: number; // 期間分の電気代 (将来値上げ込み)
  totalCost: number;      // 本体 + 電気代
  monthlyCost: number;    // 月額換算
  dailyCost: number;      // 日額換算
};

const App: React.FC = () => {
  // State管理
  const defaultScenario = scenarios.find(s => s.id === 'telework') ?? scenarios[0];
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(defaultScenario.id);
  const [selectedTatami, setSelectedTatami] = useState<TatamiSize>(6);
  const [unitPrices, setUnitPrices] = useState({ XS: '', EX: '', J: '' });
  const [dailyHours, setDailyHours] = useState(defaultScenario.dailyHours);
  const [coolRatio, setCoolRatio] = useState(defaultScenario.coolRatio);
  const [years, setYears] = useState(10); // 10 or 15 年
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(window.matchMedia("(min-width: 768px)").matches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const pdfButtonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handler = () => setIsWideScreen(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const escalationRate = 0.03; // 年率上昇 3%

  // シナリオ変更時に関連 state を更新
  React.useEffect(() => {
    const sc = scenarios.find(s => s.id === selectedScenarioId);
    if (sc) {
      setDailyHours(sc.dailyHours);
      setCoolRatio(sc.coolRatio);
      if (hasCalculated) calculateResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScenarioId]);

  // 計算ロジック
  const calculateResults = () => {
    // JIS 年間消費電力量 (kWh) を基準に、
    // 1 日の運転時間スライダは 8h を基準にスケールさせる
    const weightedAnnualKWh = (coolKWh: number, heatKWh: number) =>
      (coolKWh * (coolRatio / 100) + heatKWh * (1 - coolRatio / 100)) * (dailyHours / 8);
    const annualElecYen = (coolKWh: number, heatKWh: number) =>
      weightedAnnualKWh(coolKWh, heatKWh) * kWhCostWithTax;
    
    // 期間分の電気代（年率 escalationRate で上昇）
    const escalatedTotal = (baseAnnual: number) => {
      let sum = 0;
      for (let y = 0; y < years; y++) {
        sum += baseAnnual * Math.pow(1 + escalationRate, y);
      }
      return sum;
    };
    
    // 価格をフォーマットして表示用に更新
    const formattedPrices = { ...unitPrices };
    (['XS', 'EX', 'J'] as Series[]).forEach(series => {
      if (unitPrices[series]) {
        // 全角数字を半角数字に変換
        const halfWidthValue = unitPrices[series].replace(/[０-９]/g, (char) => 
          String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
        );
        
        // 数字のみを抽出
        const numericValue = halfWidthValue.replace(/[^0-9]/g, '');
        
        if (numericValue) {
          // カンマ区切りでフォーマット
          formattedPrices[series] = new Intl.NumberFormat('ja-JP').format(parseInt(numericValue));
        }
      }
    });
    setUnitPrices(formattedPrices);
    
    const specs = acSpecs[selectedTatami];
    const results = (['XS', 'EX', 'J'] as Series[]).map(series => {
      const spec = specs[series];
      // フォーマットされた価格から数値を抽出
      const unitPrice = parseInt(formattedPrices[series].replace(/,/g, '')) || 0;
      const annualCost = annualElecYen((spec as any).coolKWh, (spec as any).heatKWh);
      const totalElec = escalatedTotal(annualCost);
      const total = unitPrice + totalElec;
      const monthly = total / (years * 12);
      const daily = total / (years * 365);
      return {
        series,
        unitPrice,
        model: (spec as any).model,
        coolKWh: (spec as any).coolKWh,
        heatKWh: (spec as any).heatKWh,
        annualElecCost: annualCost,
        totalElecCost: totalElec,
        totalCost: total,
        monthlyCost: monthly,
        dailyCost: daily,
      };
    });
    
    setCalculationResults(results);
    setHasCalculated(true);
  };

  const startPdfCreation = () => {
    setIsModalOpen(false);
    setIsPdfRendering(true);
  };

  useEffect(() => {
    if (!isPdfRendering) return;

    const generatePdf = async () => {
      if (!pdfCaptureRef.current || !toggleRef.current || !pdfButtonContainerRef.current) {
        setIsPdfRendering(false);
        return;
      }

      const pdfArea = pdfCaptureRef.current;
      const toggle = toggleRef.current;
      const pdfButtonContainer = pdfButtonContainerRef.current;

      pdfArea.classList.add('pdf-rendering');

      // 日付要素を作成
      const today = new Date();
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日作成`;
      const dateElement = document.createElement('div');
      dateElement.innerText = dateString;
      dateElement.style.position = 'absolute';
      dateElement.style.top = '2.0rem';
      dateElement.style.right = '2.0rem';
      dateElement.style.fontSize = '0.75rem';
      dateElement.style.color = '#718096';

      // PDFキャプチャ用にDOMを準備
      toggle.style.display = 'none';
      pdfButtonContainer.style.display = 'none'; // PDFボタンを非表示に
      pdfArea.style.position = 'relative'; // 日付要素の絶対配置のため
      pdfArea.appendChild(dateElement); // 日付要素を追加

      try {
        const canvas = await html2canvas(pdfArea, {
          scale: 2, // 高解像度化
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        const margin = 10;
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = contentWidth / canvasAspectRatio;

        // コンテンツが1ページに収まらない場合は、複数ページに分割（今回は1ページ想定でシンプルに）
        let finalHeight = contentHeight;
        if (finalHeight > pdfHeight - (margin * 2)) {
            finalHeight = pdfHeight - (margin * 2);
        }
        
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, finalHeight);

        const fileName = `エアコン費用シミュレーション_${customerName || 'お客様'}.pdf`;
        pdf.save(fileName);
        
      } finally {
        // DOMを元に戻す
        toggle.style.display = 'inline-flex';
        pdfButtonContainer.style.display = 'block'; // PDFボタンを再表示
        pdfArea.removeChild(dateElement); // 日付要素を削除
        pdfArea.style.position = ''; // スタイルを元に戻す
        pdfArea.classList.remove('pdf-rendering'); // PDF生成用のクラスを削除
        setCustomerName('');
        setIsPdfRendering(false);
      }
    };
    
    const timerId = setTimeout(generatePdf, 100);
    return () => clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPdfRendering]);

  // 年数変更で自動再計算
  React.useEffect(() => {
    if (hasCalculated) {
      calculateResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const cheapestSeries = useMemo(() => {
    if (!hasCalculated) return null;
    const validResults = calculationResults.filter(r => r.unitPrice > 0);
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) => 
      current.totalCost < min.totalCost ? current : min
    ).series;
  }, [calculationResults, hasCalculated]);

  const chartData = hasCalculated ? calculationResults
    .filter(r => r.unitPrice > 0)
    .map(r => ({
      series: r.series,
      cost: r.totalCost,
      isCheapest: r.series === cheapestSeries
    })) : [];

  // ① コストの最大値を計算しておく ------------- //
  const maxCost = useMemo(() => (
    chartData.length ? Math.max(...chartData.map(c => c.cost)) : 0
  ), [chartData]);

  // Y軸：10 万円刻み（0・10万・20万 …）
  const yTicks = useMemo(() => {
    if (chartData.length === 0) return [] as number[];
    const end = Math.ceil(maxCost / 100000) * 100000;
    const ticks: number[] = [];
    for (let v = 0; v <= end; v += 100000) ticks.push(v);
    return ticks;
  }, [maxCost]);

  const handlePriceChange = (series: Series, value: string) => {
    // 入力中は生の値をそのまま保存（フォーマットしない）
    setUnitPrices(prev => ({ ...prev, [series]: value }));
  };
  
  const formatCurrency = (amount: number) => 
    `¥${new Intl.NumberFormat('ja-JP').format(amount)}`;

  return (
    <div className="container mx-auto p-4 max-w-4xl" ref={pdfCaptureRef} style={{ fontSize: '16px' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Panasonicルームエアコン 費用対効果シミュレーター
        </h1>
      </div>

      <main style={{ maxWidth: '1024px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* 設定パネル */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            minWidth: 0
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                margin: 0,
              }}>
                基本設定
              </h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              {/* 設定項目グループ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {/* 畳数選択 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#4a5568', 
                    marginBottom: '0.5rem'
                  }}>
                    部屋の広さ
                  </label>
                  <select
                    value={selectedTatami}
                    onChange={(e) => setSelectedTatami(Number(e.target.value) as TatamiSize)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '1rem',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                    }}
                  >
                    {Object.keys(acSpecs).map(tatami => (
                      <option key={tatami} value={tatami}>{tatami}畳</option>
                    ))}
                  </select>
                </div>

                {/* 使い方を選ぶ */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#4a5568', 
                    marginBottom: '0.5rem'
                  }}>
                    使い方を選ぶ
                  </label>
                  <select
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '1rem',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                    }}
                  >
                    {scenarios.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 本体価格入力 */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#4a5568', 
                  marginBottom: '0.5rem'
                }}>
                  本体価格 (円)
                </label>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {(['XS', 'EX', 'J'] as Series[]).map(series => (
                    <div key={series} style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#4a5568',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                      }}>
                        {series}
                      </span>
                      <input
                        type="text"
                        value={unitPrices[series]}
                        onChange={(e) => handlePriceChange(series, e.target.value)}
                        placeholder="0"
                        style={{
                          width: '100%',
                          paddingLeft: '3.5rem',
                          paddingRight: '0.75rem',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem',
                          fontSize: '1rem',
                          textAlign: 'right',
                          border: '1px solid #cbd5e0',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 計算ボタン */}
              <div style={{
                textAlign: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={calculateResults}
                  style={{
                    backgroundColor: '#dd6b20',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c05621'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dd6b20'}
                >
                  費用を計算する
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* 結果表示 */}
          {hasCalculated && calculationResults.some(r => r.unitPrice > 0) && (
            <div id="pdf-capture-area" ref={pdfCaptureRef} style={{ 
              display: 'grid', 
              gap: '2rem', 
              padding: '1.5rem', 
              backgroundColor: 'white',
              width: isPdfRendering ? '1024px' : undefined,
            }}>
              {/* テーブル */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                minWidth: 0
              }}>
                <div style={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {years}年間の総費用比較
                  </h2>
                  {/* 期間トグル */}
                  <div ref={toggleRef} className="inline-flex rounded-md shadow-sm">
                    {[10, 15].map((y) => (
                      <button
                        key={y}
                        onClick={() => setYears(y)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: years === y ? 'white' : '#4a5568',
                          backgroundColor: years === y ? '#4299e1' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {y}年
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: 0 }}>
                  <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: isPdfRendering ? '14px' : '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f7fafc' }}>
                      <tr>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>シリーズ</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#4a5568', display: (isWideScreen || isPdfRendering) ? 'table-cell' : 'none', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>品番</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>本体価格</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>年間消費電力量</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>{years}年総費用</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>一月に換算</th>
                        <th style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4a5568', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>一日に換算</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationResults.filter(r => r.unitPrice > 0).map((result) => {
                        return (
                          <tr
                            key={result.series}
                            style={{
                              borderTop: '1px solid #e2e8f0',
                              backgroundColor: 'white'
                            }}
                          >
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', fontWeight: '600', color: '#2d3748', borderRight: '1px solid #e2e8f0' }}>
                              {result.series}
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', color: '#4a5568', display: (isWideScreen || isPdfRendering) ? 'table-cell' : 'none', borderRight: '1px solid #e2e8f0' }}>
                              {result.model ?? '—'}
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', color: '#4a5568', borderRight: '1px solid #e2e8f0' }}>
                              {formatCurrency(result.unitPrice)}
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', color: '#4a5568', borderRight: '1px solid #e2e8f0' }}>
                              {result.coolKWh + result.heatKWh}kWh
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: '600', color: '#2d3748', borderRight: '1px solid #e2e8f0' }}>
                              {formatCurrency(Math.round(result.totalCost))}
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: '600', color: '#2d3748', borderRight: '1px solid #e2e8f0' }}>
                              {formatCurrency(Math.round(result.monthlyCost))}
                            </td>
                            <td style={{ padding: isPdfRendering ? '12px' : '0.75rem', textAlign: 'right', fontWeight: '600', color: '#2d3748', borderRight: '1px solid #e2e8f0' }}>
                              {formatCurrency(Math.round(result.dailyCost))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* グラフ */}
              {chartData.length > 0 && (
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                }}>
                   <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      margin: 0
                    }}>
                      費用グラフ
                    </h3>
                  </div>
                  <div style={{ padding: '1.5rem', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="series" 
                          tick={{ fontSize: 12, fill: '#718096' }}
                          axisLine={{ stroke: '#cbd5e0' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#718096' }}
                          axisLine={{ stroke: '#cbd5e0' }}
                          tickLine={false}
                          scale="linear"
                          domain={[0, yTicks[yTicks.length - 1]]}
                          ticks={yTicks}
                          tickFormatter={(v: number) => `¥${Math.round(v / 10000)}万`}
                        />
                        {!isPdfRendering && <Tooltip 
                          formatter={(value: number) => [formatCurrency(Math.round(value)), `${years}年総費用`]}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e0',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold' }}
                        />}
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]} isAnimationActive={!isPdfRendering}>
                          {chartData.map((entry) => (
                            <Cell key={`cell-${entry.series}`} fill={'#4299e1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {isPdfRendering && <FeatureTable />}

              {/* PDF作成ボタン */}
              <div ref={pdfButtonContainerRef} style={{
                textAlign: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    backgroundColor: '#38a169',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2f855a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                >
                  PDFで保存する
                </button>
              </div>
            </div>
          )}

          {/* お客様名入力モーダル */}
          {isModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                width: '90%',
                maxWidth: '400px',
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>お客様名を入力してください</h3>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="例：山田 太郎"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      backgroundColor: '#718096',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={startPdfCreation}
                    style={{
                      backgroundColor: '#38a169',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    PDF作成
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 計算式説明 */}
          <div style={{ 
            backgroundColor: '#f7fafc', 
            borderRadius: '8px', 
            padding: '1rem',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#718096', margin: 0 }}>
              電気代 = (冷房kWh × {coolRatio}% + 暖房kWh × {100-coolRatio}%) × ( {dailyHours}h ÷ 8h ) × ¥{kWhCostWithTax}/kWh
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App; 