import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { acSpecs, kWhCostWithTax } from './data/acSpecs';
import { scenarios } from './data/scenarios';

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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const initialScenario = scenarios[0];
  const [selectedTatami, setSelectedTatami] = useState<TatamiSize>(6);
  const [unitPrices, setUnitPrices] = useState({ XS: '', EX: '', J: '' });
  const [dailyHours, setDailyHours] = useState(initialScenario.dailyHours);
  const [coolRatio, setCoolRatio] = useState(initialScenario.coolRatio);
  const [years, setYears] = useState(10); // 10 or 15 年
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

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

  // Y軸の目盛りを 10万円刻みに設定（対数スケールでさらに差を圧縮）
  const yTicks = useMemo(() => {
    if (chartData.length === 0) return [] as number[];
    const costs = chartData.map(c => c.cost);
    const min = 100000; // 対数スケールでは 0 を使えない
    const max = Math.ceil(Math.max(...costs) / 100000) * 100000;
    const step = 100000; // 10万円刻み
    const paddedMax = max + step * 3; // さらに余白
    const arr: number[] = [];
    for (let v = min; v <= paddedMax; v += step) arr.push(v);
    if (arr[arr.length - 1] !== paddedMax) arr.push(paddedMax);
    return arr;
  }, [chartData]);

  const handlePriceChange = (series: Series, value: string) => {
    // 入力中は生の値をそのまま保存（フォーマットしない）
    setUnitPrices(prev => ({ ...prev, [series]: value }));
  };
  
  const formatCurrency = (amount: number) => 
    `¥${new Intl.NumberFormat('ja-JP').format(amount)}`;

  // 年数オプション
  const yearOptions = [10, 15];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc', fontFamily: 'system-ui, sans-serif', color: '#2d3748' }}>
      {/* ヘッダー */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            textAlign: 'center',
            color: '#2d3748',
            margin: 0
          }}>
            エアコン総費用シミュレーター
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '1024px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* 設定パネル */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
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
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* テーブル */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    margin: 0
                  }}>
                    {years}年間の総費用比較
                  </h2>
                  {/* 期間トグル */}
                  <div style={{ display: 'inline-flex', backgroundColor: '#edf2f7', borderRadius: '6px', overflow: 'hidden' }}>
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
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f7fafc' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#718096' }}>シリーズ</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#718096' }}>品番</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096' }}>本体価格</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096', display: 'none' }}>冷房kWh/年</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096', display: 'none' }}>暖房kWh/年</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096' }}>{years}年総費用</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096' }}>一月に換算</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#718096' }}>一日に換算</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationResults.filter(r => r.unitPrice > 0).map((result) => {
                        const isCheapest = result.series === cheapestSeries;
                        return (
                          <tr
                            key={result.series}
                            style={{
                              borderTop: '1px solid #e2e8f0',
                              backgroundColor: isCheapest ? '#ebf8ff' : 'white'
                            }}
                          >
                            <td style={{ padding: '0.75rem', fontWeight: '600', color: isCheapest ? '#2b6cb0' : '#2d3748' }}>
                              {result.series}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#4a5568' }}>
                              {result.model ?? '—'}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568' }}>
                              {formatCurrency(result.unitPrice)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568', display: 'none' }}>
                              {result.coolKWh}kWh
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568', display: 'none' }}>
                              {result.heatKWh}kWh
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: isCheapest ? '#2b6cb0' : '#2d3748' }}>
                              {formatCurrency(Math.round(result.totalCost))}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: isCheapest ? '#2b6cb0' : '#2d3748' }}>
                              {formatCurrency(Math.round(result.monthlyCost))}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: isCheapest ? '#2b6cb0' : '#2d3748' }}>
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
                          scale="log"
                          tickFormatter={(value) => `¥${Math.round(value / 10000)}万`}
                          ticks={yTicks}
                          domain={yTicks.length > 1 ? [yTicks[0], yTicks[yTicks.length - 1]] : undefined}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(Math.round(value)), `${years}年総費用`]}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e0',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={`cell-${entry.series}`} fill={'#4299e1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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