# Reddit AI Top 10 - 每日热门话题

一个简洁的网页应用，抓取 Reddit AI 领域（r/artificial 和 r/MachineLearning）的每日十大热门话题，支持一键翻译成中文。

## ✨ 功能特性

- 🔥 自动抓取 Reddit AI 社区每日 top 10 话题
- 🌐 支持一键将所有内容翻译成中文
- 🔄 一键刷新获取最新内容
- 📱 响应式设计，支持手机和桌面
- 🎨 风格与 Reddit 官网保持一致
- 💾 本地收藏功能

## 🚀 使用方法

### 方式一：直接打开（推荐）

直接双击打开 `index.html` 文件即可使用。

```bash
# 或者在浏览器中打开
open index.html
```

### 方式二：使用本地服务器

如果你想用本地服务器运行：

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# 然后访问 http://localhost:8000
```

### 方式三：部署到 Vercel / Netlify

将整个文件夹上传到 Vercel 或 Netlify 即可自动部署。

## 📁 项目结构

```
reddit-ai-top10/
├── index.html    # 主页面
├── styles.css    # Reddit 风格样式
├── app.js        # 主要逻辑
└── README.md      # 说明文档
```

## 🔧 技术栈

- **纯前端**：无需后端服务器
- **Reddit API**：使用 Reddit 公开 JSON API
- **翻译服务**：LibreTranslate（免费无需 API Key）

## ⚠️ 注意事项

1. Reddit API 有速率限制，请勿频繁刷新
2. 翻译功能依赖第三方服务（LibreTranslate）
3. 如果遇到 CORS 问题，可能需要使用浏览器扩展或代理

## 📝 自定义

### 修改目标子版块

编辑 `app.js` 中的 `SUBREDDITS` 数组：

```javascript
const SUBREDDITS = ['artificial', 'MachineLearning', 'deeplearning'];
```

### 修改显示数量

```javascript
const TOTAL_POSTS = 10;  // 修改为任意数量
```

## 📄 许可证

MIT License

---

Made with ❤️ for the AI community
