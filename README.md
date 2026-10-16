# myfinboard.com 部署包 · 靜態版

把本目錄內**所有文件**上傳到託管平台，再到 DNS 把域名指過去即可。

## 文件清單

| 文件 | 說明 |
|---|---|
| `index.html` | 主應用（單文件 188 KB，零外部依賴） |
| `piggy.png` | 戴皇冠小豬（側欄 logo / 名字卡 / 歡迎回來） |
| `piggy-loading.png` | 載入財務數據頁小豬（WebP 已內聯進 HTML，此檔為相容兜底） |
| `icon-192.png` / `icon-512.png` | PWA 圖標（加到主屏幕用） |
| `manifest.json` | PWA 配置 |
| `sw.js` | Service Worker v17（離線可用、主屏幕秒開） |
| `.nojekyll` | 給 GitHub Pages 用，其他平台可忽略 |

---

## 方案 A：Cloudflare Pages（推薦）

免費、自帶全球 CDN、自動 HTTPS、一鍵綁域名。

1. 註冊 [cloudflare.com](https://cloudflare.com)
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 項目名填 `myfinboard`，把本目錄所有文件**拖進去**上傳
4. 部署完得到 `https://myfinboard.pages.dev`
5. **Custom domains** → **Set up a custom domain** → 填 `myfinboard.com`
6. DNS 二選一：
   - **推薦**：讓 Cloudflare 代管 DNS（它會自動加記錄），到騰訊雲後台把域名的
     DNS 服務器改成 Cloudflare 給的兩個 NS
   - 或者保留騰訊雲 DNSPod：手動加 `CNAME` `@` → `myfinboard.pages.dev`
7. 等 1-3 分鐘，訪問 `https://myfinboard.com`

## 方案 B：GitHub Pages

免費、成熟，最快上手。

1. GitHub 新建 Public 倉庫（建議命名 `myfinboard`）
2. 上傳本目錄所有文件到倉庫根目錄
3. **Settings → Pages** → Source 選 `Deploy from a branch` → Branch 選 `main`，目錄選 `/ (root)`
4. **Custom domain** 填 `myfinboard.com` → 勾選 **Enforce HTTPS**
5. 到騰訊雲 DNSPod 加記錄：
   - `@` → `CNAME` → `<你的GitHub用戶名>.github.io`
   - `www` → `CNAME` → `<你的GitHub用戶名>.github.io`
6. 等 DNS 生效（約 10 分鐘）

---

## 騰訊雲 DNSPod 記錄參考

| 主機記錄 | 類型 | 記錄值 |
|---|---|---|
| `@` | CNAME | 託管平台地址（見上方方案） |
| `www` | CNAME | 同上 |

> 根域名（`@`）若你的 DNSPod 版本不支援直接填 CNAME（CNAME Flattening），
> 改用「URL 轉發」把 `myfinboard.com` 跳轉到 `www.myfinboard.com`，再讓 www 走 CNAME。

---

## 重要說明

- **免備案**：以上方案都用境外節點，不需要 ICP 備案，配好立刻能訪問
- **無雲端同步**：靜態版數據存在瀏覽器 localStorage，換設備不會自動同步
  - 備份：頁面「我的」→「導出 JSON」
  - 搬家：新設備打開後「導入恢復」
- **隱私**：數據只在你自己的瀏覽器裡，不經過任何服務器
- **HTTPS**：兩個平台都自動簽發證書；PWA 加到主屏幕必需 HTTPS

---

## 以後想要多設備同步

靜態托管跑不了 Node 後端。屆時需要一台有磁盤的服務器
（騰訊雲輕量 / Render / Cloudflare Workers + KV），
我可以幫你把 `server.js` 改造成對應形態再遷移，域名不用動。
