# エアコン10年総費用シミュレーター

パナソニックエアコン2025年モデルの10年総費用をシミュレーションするWebアプリケーションです。

## 機能

- 本体価格と畳数（6/8/10/14/18畳）を入力
- XS/EX/Jシリーズの比較
- 1日あたりの使用時間（1-24時間）をスライダーで調整
- 10年総費用の計算（本体価格 + 電気代）
- グラフ表示と最安シリーズのハイライト

## 開発環境のセットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバーの起動:
```bash
npm run dev
```

3. ビルド:
```bash
npm run build
```

## データの更新方法

`src/data/acSpecs.ts`ファイルの`unitPrice`を実売価格に更新してください。

```typescript
export const acSpecs = {
  6: {
    XS: { unitPrice: 0, hourlyKWh: 0.433 }, // ここを実売価格に更新
    EX: { unitPrice: 0, hourlyKWh: 0.485 },
    J:  { unitPrice: 0, hourlyKWh: 0.553 },
  },
  // ...
};
```

## 技術スタック

- Vite + React 18 (TypeScript)
- TailwindCSS
- Recharts
- Framer Motion 