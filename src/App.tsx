import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

const App: React.FC = () => {
  // State管理
  const [selectedTatami, setSelectedTatami] = useState<TatamiSize>(6);
  const [unitPrices, setUnitPrices] = useState({ XS: '', EX: '', J: '' });
  const [dailyHours, setDailyHours] = useState(8);
  const [coolRatio, setCoolRatio] = useState(50);

  // 計算ロジック
  const calculationResults: CalculationResult[] = useMemo(() => {
    const toKWh = (w: number) => w / 1000;
    const weightedKWh = (coolW: number, heatW: number) => 
      toKWh(coolW) * (coolRatio / 100) + toKWh(heatW) * (1 - coolRatio / 100);
    const annualElecYen = (coolW: number, heatW: number) => 
      weightedKWh(coolW, heatW) * dailyHours * 365 * kWhCostWithTax;
    
    const specs = acSpecs[selectedTatami];
    return (['XS', 'EX', 'J'] as Series[]).map(series => {
      const spec = specs[series];
      const unitPrice = parseInt(unitPrices[series].replace(/,/g, '')) || 0;
      const annualCost = annualElecYen(spec.coolW, spec.heatW);
      const total = unitPrice + annualCost * 10;
      return { series, unitPrice, annualElecCost: annualCost, tenYearTotal: total };
    });
  }, [selectedTatami, unitPrices, coolRatio, dailyHours]);

  const cheapestSeries = useMemo(() => {
    const validResults = calculationResults.filter(r => r.unitPrice > 0);
    if (validResults.length === 0) return null;
    return validResults.reduce((min, current) => 
      current.tenYearTotal < min.tenYearTotal ? current : min
    ).series;
  }, [calculationResults]);

  const chartData = calculationResults
    .filter(r => r.unitPrice > 0)
    .map(r => ({
      series: r.series,
      cost: r.tenYearTotal,
      isCheapest: r.series === cheapestSeries
    }));

  const handlePriceChange = (series: Series, value: string) => {
    // 数字のみを抽出
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      setUnitPrices(prev => ({ ...prev, [series]: '' }));
      return;
    }
    
    // カンマ区切りでフォーマットして表示
    const formattedValue = new Intl.NumberFormat('ja-JP').format(parseInt(numericValue));
    setUnitPrices(prev => ({ ...prev, [series]: formattedValue }));
  };
  
  const formatCurrency = (amount: number) => 
    `¥${new Intl.NumberFormat('ja-JP').format(amount)}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* ヘッダー */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            textAlign: 'center',
            color: '#1f2937',
            margin: 0
          }}>
            エアコン10年総費用シミュレーター
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {/* 設定パネル */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            border: '2px solid #f59e0b',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '2rem', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold', 
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                ⚙️ 基本設定
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                margin: '0.5rem 0 0 0',
                opacity: 0.9
              }}>
                お客様の条件を入力してください
              </p>
            </div>
            <div style={{ padding: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {/* 畳数選択 */}
              <div style={{
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '2px solid #f59e0b'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#92400e', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  🏠 お部屋の畳数
                </label>
                <select
                  value={selectedTatami}
                  onChange={(e) => setSelectedTatami(Number(e.target.value) as TatamiSize)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    border: '3px solid #f59e0b',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    textAlign: 'center',
                    color: '#92400e'
                  }}
                >
                  {Object.keys(acSpecs).map(tatami => (
                    <option key={tatami} value={tatami}>{tatami}畳</option>
                  ))}
                </select>
              </div>

              {/* 本体価格入力 */}
              <div style={{
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '2px solid #3b82f6'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#1e40af', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  💰 本体価格 (円)
                </label>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {(['XS', 'EX', 'J'] as Series[]).map(series => (
                    <div key={series} style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#1e40af',
                        fontSize: '1rem',
                        fontWeight: '700',
                        zIndex: 1
                      }}>
                        📱 {series}
                      </span>
                      <input
                        type="text"
                        value={unitPrices[series]}
                        onChange={(e) => handlePriceChange(series, e.target.value)}
                        placeholder="販売価格"
                        style={{
                          width: '100%',
                          paddingLeft: '4rem',
                          paddingRight: '1rem',
                          paddingTop: '1rem',
                          paddingBottom: '1rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          textAlign: 'right',
                          border: '3px solid #3b82f6',
                          borderRadius: '12px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box',
                          color: '#1e40af'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* スライダー */}
              <div style={{
                backgroundColor: '#ecfdf5',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '2px solid #10b981'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#065f46', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  ⏰ 1日の運転時間: {dailyHours}時間
                </label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#a7f3d0',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.875rem', 
                  color: '#065f46', 
                  marginTop: '0.5rem',
                  fontWeight: '600'
                }}>
                  <span>1時間</span>
                  <span>24時間</span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '2px solid #ef4444'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#991b1b', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  🌡️ 冷房: {coolRatio}% : 暖房: {100 - coolRatio}%
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={coolRatio}
                    onChange={(e) => setCoolRatio(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '12px',
                      borderRadius: '6px',
                      backgroundColor: '#fecaca',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  {/* 50%の目印 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '1px',
                      height: '18px',
                      backgroundColor: '#374151',
                      pointerEvents: 'none'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      pointerEvents: 'none'
                    }}
                  >
                    50%
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.875rem', 
                  color: '#991b1b', 
                  marginTop: '1rem',
                  fontWeight: '600'
                }}>
                  <span>❄️ 暖房のみ</span>
                  <span>☀️ 冷房のみ</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* 結果表示 */}
          {calculationResults.some(r => r.unitPrice > 0) && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* テーブル */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                border: '2px solid #3b82f6',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '2rem', 
                  borderBottom: '2px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white'
                }}>
                  <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 'bold', 
                    margin: 0, 
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    💰 10年総費用比較
                  </h2>
                  <p style={{ 
                    fontSize: '1rem', 
                    margin: '0.5rem 0 0 0', 
                    textAlign: 'center',
                    opacity: 0.9
                  }}>
                    本体価格 + 10年間の電気代
                  </p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead style={{ backgroundColor: '#1e40af', color: 'white' }}>
                      <tr>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', fontSize: '1rem', fontWeight: '700', color: 'white' }}>
                          シリーズ
                        </th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: '700', color: 'white' }}>
                          本体価格
                        </th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: '700', color: 'white' }}>
                          年間電気代
                        </th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: '700', color: 'white', backgroundColor: '#dc2626' }}>
                          💡 10年総費用
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationResults.filter(r => r.unitPrice > 0).map((result, index) => {
                        return (
                          <tr
                            key={result.series}
                            style={{
                              borderTop: '2px solid #e5e7eb',
                              backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <td style={{ 
                              padding: '1rem 0.75rem', 
                              fontWeight: '700',
                              color: '#1e40af',
                              fontSize: '1.25rem',
                              textAlign: 'center'
                            }}>
                              📱 {result.series}
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#4b5563', fontSize: '1rem', fontWeight: '600' }}>
                              {formatCurrency(result.unitPrice)}
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#4b5563', fontSize: '1rem', fontWeight: '600' }}>
                              {formatCurrency(Math.round(result.annualElecCost))}
                            </td>
                            <td style={{ 
                              padding: '1rem 0.75rem', 
                              textAlign: 'right', 
                              fontWeight: 'bold',
                              fontSize: '1.25rem',
                              color: '#dc2626',
                              backgroundColor: '#fef2f2',
                              border: '2px solid #fecaca'
                            }}>
                              {formatCurrency(Math.round(result.tenYearTotal))}
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
                  borderRadius: '16px', 
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  border: '2px solid #10b981',
                  padding: '2rem'
                }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    color: 'white'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      margin: 0,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                      📊 10年総費用比較グラフ
                    </h3>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      margin: '0.5rem 0 0 0', 
                      opacity: 0.9
                    }}>
                      一目でわかる費用の違い
                    </p>
                  </div>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="series" 
                          tick={{ fontSize: 12, fill: '#374151' }}
                          axisLine={{ stroke: '#d1d5db' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#374151' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickFormatter={(value) => `¥${Math.round(value / 10000)}万`}
                          domain={[0, 2000000]}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), '10年総費用']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isCheapest ? '#10b981' : '#3b82f6'} />
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
            backgroundColor: '#eff6ff', 
            borderRadius: '8px', 
            padding: '1rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
              電気代 = (冷房W × {coolRatio}% + 暖房W × {100-coolRatio}%) × {dailyHours}h/日 × 365日 × ¥{kWhCostWithTax}/kWh
            </p>
            <p style={{ fontSize: '0.75rem', color: '#3730a3', margin: '0.25rem 0 0 0' }}>
              10年総費用 = 本体価格 + (年間電気代 × 10年)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App; 