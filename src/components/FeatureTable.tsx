import React from 'react';

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #cccccc',
  padding: '12px',
  textAlign: 'left',
  fontSize: '16px',
  verticalAlign: 'top',
  lineHeight: '1.5',
};

const thCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  backgroundColor: '#f7fafc',
  fontWeight: 'bold',
  fontSize: '17px',
};

const FeatureTable: React.FC = () => {
  return (
    <div style={{ marginTop: '2rem', pageBreakBefore: 'always' }}>
      <h3 style={{ 
        fontSize: '24px',
        fontWeight: 'bold', 
        margin: '0 0 1rem 0', 
        paddingBottom: '0.5rem',
        borderBottom: '2px solid #4299e1',
      }}>
        シリーズ別 機能比較
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={thCellStyle}>XSシリーズ</th>
            <th style={thCellStyle}>EXシリーズ</th>
            <th style={thCellStyle}>Jシリーズ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>省エネ指標（APF）</strong>7.1</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>5.5</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>4.9</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>エネチャージ快湿制御</strong>標準搭載</td>
            <td style={tableCellStyle}>―</td>
            <td style={tableCellStyle}>―</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>新エコロータリーコンプレッサー</strong>低摩耗・低電力</td>
            <td style={tableCellStyle}>―</td>
            <td style={tableCellStyle}>―</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>ナノイー X</strong>48 兆粒子</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>48 兆粒子</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>9.6 兆粒子</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>フィルター掃除方式</strong>ゴミ自動排出おそうじロボ</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>ゴミ自動排出おそうじロボ</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>抗菌フィルター（手動）</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>AIセンサー数／種類</strong>4 センサー（人・温度・湿度・日射）</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>3 センサー（人・日射・床温度）</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>温度センサーのみ</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>耐塩害設計</strong>ブルーフィン＋全面メッシュガード</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>ブルーフィンのみ</td>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem', color: 'transparent', userSelect: 'none' }}>&nbsp;</strong>標準アルミ</td>
          </tr>
          <tr>
            <td style={tableCellStyle}><strong style={{ display: 'block', marginBottom: '0.25rem' }}>足元 43 ℃暖房</strong>対応</td>
            <td style={tableCellStyle}>―</td>
            <td style={tableCellStyle}>―</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FeatureTable; 