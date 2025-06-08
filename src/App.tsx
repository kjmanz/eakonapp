import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { acSpecs, kWhCostWithTax } from './data/acSpecs'

type Series = 'XS' | 'EX' | 'J'
type Tatami = 6 | 8 | 10 | 14 | 18

interface YearlyData {
  year: number;
  XS: number;
  EX: number;
  J: number;
}

const annualElec = (kWh: number, hours: number, kwhCost: number) =>
  kWh * hours * 365 * kwhCost

const totalCost = (price: number, kWh: number, hours: number, years: number, kwhCost: number) =>
  price + annualElec(kWh, hours, kwhCost) * years

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)

function App() {
  const [prices, setPrices] = useState<Record<Series, string>>({
    XS: '',
    EX: '',
    J: ''
  })
  const [tatami, setTatami] = useState<Tatami>(6)
  const [hours, setHours] = useState<number>(8)
  const [kwhCost, setKwhCost] = useState<number>(kWhCostWithTax)

  const seriesData = Object.entries(acSpecs[tatami]).map(([series, specs]) => ({
    series,
    unitPrice: Number(prices[series as Series]) || 0,
    annualElec: annualElec(specs.hourlyKWh, hours, kwhCost),
    tenYearTotal: totalCost(Number(prices[series as Series]) || 0, specs.hourlyKWh, hours, 10, kwhCost)
  }))



  const yearlyData: YearlyData[] = Array.from({ length: 15 }, (_, i) => {
    const year = i + 1
    return {
      year,
      XS: totalCost(Number(prices.XS) || 0, acSpecs[tatami].XS.hourlyKWh, hours, year, kwhCost),
      EX: totalCost(Number(prices.EX) || 0, acSpecs[tatami].EX.hourlyKWh, hours, year, kwhCost),
      J: totalCost(Number(prices.J) || 0, acSpecs[tatami].J.hourlyKWh, hours, year, kwhCost)
    }
  })

  const handlePriceChange = (series: Series, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setPrices(prev => ({
        ...prev,
        [series]: value
      }))
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="content-wrapper">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ヘッダー */}
            <motion.header variants={cardVariants} className="section-spacing">
              <div className="card-content" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="header-title">
                  エアコン10年総費用シミュレーター
                </h1>
                <p className="header-subtitle">XS / EX / J シリーズ比較</p>
                <div className="header-line"></div>
              </div>
            </motion.header>

            {/* 入力設定カード */}
            <motion.div variants={cardVariants} className="card section-spacing">
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="section-title">設定</h2>
                  <div className="section-line"></div>
                </div>
                
                <div style={{ width: '100%', maxWidth: '64rem', margin: '0 auto' }}>
                  
                  {/* 畳数・電気代 横並び */}
                  <div className="input-row" style={{ marginBottom: '2rem' }}>
                    
                    {/* 畳数選択 */}
                    <div className="input-container">
                      <label className="input-label">畳数</label>
                      <select
                        value={tatami}
                        onChange={(e) => setTatami(Number(e.target.value) as Tatami)}
                        className="input-field"
                        style={{ cursor: 'pointer' }}
                      >
                        {[6, 8, 10, 14, 18].map((size) => (
                          <option key={size} value={size}>{size}畳</option>
                        ))}
                      </select>
                    </div>

                    {/* 電気代入力 */}
                    <div className="input-container">
                      <label className="input-label">電気代単価</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={kwhCost}
                          onChange={e => setKwhCost(Number(e.target.value))}
                          className="input-field"
                          style={{ paddingRight: '5rem' }}
                        />
                        <span className="input-suffix">円/kWh</span>
                      </div>
                    </div>
                  </div>

                  {/* 使用時間スライダー */}
                  <div className="input-group">
                    <div className="slider-container">
                      <label className="slider-label">
                        1日の使用時間: <span className="slider-value">{hours}</span>時間
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="slider"
                      />
                      <div className="slider-labels">
                        <span>1時間</span>
                        <span>24時間</span>
                      </div>
                    </div>
                  </div>

                  {/* 本体価格入力 */}
                  <div className="input-group">
                    <h3 className="input-label" style={{ marginBottom: '2rem' }}>本体価格</h3>
                    <div className="price-grid">
                      {(['XS', 'EX', 'J'] as Series[]).map((series) => (
                        <motion.div 
                          key={series}
                          whileHover={{ scale: 1.05, y: -8 }}
                          whileTap={{ scale: 0.95 }}
                          className="price-card"
                        >
                          <label className="price-card-label">
                            {series}シリーズ
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={prices[series]}
                              onChange={(e) => handlePriceChange(series, e.target.value)}
                              placeholder="価格を入力"
                              className="price-input"
                            />
                            <span className="input-suffix">円</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 費用比較表カード */}
            <motion.div variants={cardVariants} className="card section-spacing">
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="section-title">費用比較表</h2>
                  <div className="section-line"></div>
                </div>
                
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>シリーズ</th>
                        <th>本体価格</th>
                        <th>年間電気代</th>
                        <th>10年総費用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seriesData.map((data, index) => (
                        <motion.tr 
                          key={data.series} 
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                        >
                          <td className="series-cell">{data.series}</td>
                          <td>{formatCurrency(data.unitPrice)}</td>
                          <td>{formatCurrency(data.annualElec)}</td>
                          <td className="total-cell">{formatCurrency(data.tenYearTotal)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* グラフカード */}
            <motion.div variants={cardVariants} className="card section-spacing">
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="section-title">10年総費用比較</h2>
                  <div className="section-line"></div>
                </div>
                
                <div className="chart-container">
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer>
                      <BarChart data={seriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis 
                          dataKey="series" 
                          tick={{ fontSize: 16, fill: '#475569', fontWeight: 'bold' }} 
                          axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 14, fill: '#475569' }} 
                          axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)} 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Bar 
                          dataKey="tenYearTotal" 
                          fill="url(#gradient1)" 
                          radius={[12, 12, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="card section-spacing">
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="section-title">1年〜15年総費用推移</h2>
                  <div className="section-line"></div>
                </div>
                
                <div className="chart-container">
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer>
                      <LineChart data={yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 14, fill: '#475569' }}
                          axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 14, fill: '#475569' }}
                          axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)} 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '18px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="XS" stroke="#3b82f6" name="XS" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="EX" stroke="#f59e0b" name="EX" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="J" stroke="#10b981" name="J" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 計算式カード */}
            <motion.div variants={cardVariants} className="formula-card section-spacing">
              <div className="formula-content">
                <h3 className="formula-title">💡 電気代の計算方法</h3>
                <p className="formula-text">
                  hourly kWh × {hours}h/日 × 365日 × 10年 × ¥{kwhCost}/kWh
                </p>
                <div className="formula-line"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default App 