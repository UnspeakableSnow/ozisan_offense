# ブラウザFPS「おじさんオフェンス」

2023.07.01-02 サポーターズ主催ハッカソン 制作物
以後随時開発

![ロゴ](ozisanoffense_readmelogo.png)

## 現在移行作業中

旧

- docker
  - nodejs
    - server.js // バックエンド
    - HTML/CSS/JS // フロントエンド
    - Socket.io

新（計画）

- GithubPages フロントエンド - <https://unspeakablesnow.github.io/ozisan_offense_frontend/>
  - vuejs / ts
    - socket.io-client
- 無料サーバー バックエンド - <https://ozisan-offense.onrender.com>
  - node.js
    - socket.io

現在このリポジトリは移行作業中により正しく動作しないことがあります。

ブランチより`old_system(node+js)`で旧システムを閲覧、使用することができます。

## フロント構造

- APP
  - login
  - room_access
  - graphic_view
    - hud_view

## コマンド群

```powershell
npm install
npm run serve
npm run build
npm run lint
```

## 参照

<https://discourse.threejs.org/t/how-to-use-addons-in-threejs/57514/4>

## Todo

- originalマップ作製
- 当たり判定
  - 体、実装
- ヘッドショットの検出方法
  - ジオメトリを見る？
- NPCの自律行動アルゴリズム

## メモ

room_idの一文字目が&の場合ゲーム以外画面（ロビー、武器閲覧、訓練場）

---

## 素材

"de_dust2 - CS map" (<https://skfb.ly/6ACOH>) by vrchris is licensed under Creative Commons Attribution (<http://creativecommons.org/licenses/by/4.0/>).  
"Desert Eagle Reload Animation" (<https://skfb.ly/6SNAK>) by Stavich is licensed under Creative Commons Attribution-NonCommercial (<http://creativecommons.org/licenses/by-nc/4.0/>).  
"G3 Reload Animation" (<https://skfb.ly/6SSFz>) by Stavich is licensed under Creative Commons Attribution-NonCommercial (<http://creativecommons.org/licenses/by-nc/4.0/>).  
"FN FAL Reload Animation" (<https://skfb.ly/6VUVA>) by Stavich is licensed under CC Attribution-NonCommercial-NoDerivs (<http://creativecommons.org/licenses/by-nc-nd/4.0/>).  
効果音：効果音ラボ
