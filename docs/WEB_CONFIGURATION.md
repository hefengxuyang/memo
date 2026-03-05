# Memo App Web Frontend

一个轻量级、响应式的备忘录管理应用前端，使用原生 HTML、CSS 和 JavaScript 构建。

## 特性

- ✨ 原生 JavaScript (ES6+)，无框架依赖
- 🎨 响应式设计，支持桌面和移动设备
- ♿ 符合可访问性标准
- 🧪 完整的测试覆盖（单元测试 + 属性测试）
- 🚀 快速加载和流畅交互

## 技术栈

- **HTML5**: 语义化标记
- **CSS3**: 现代布局（Flexbox/Grid）、CSS 变量
- **JavaScript (ES6+)**: 模块化代码
- **Jest**: 单元测试框架
- **fast-check**: 属性测试框架

## 项目结构

```
memo-frontend/
├── index.html              # 主 HTML 文件
├── css/                    # 样式文件
│   ├── variables.css       # CSS 变量
│   ├── main.css           # 主样式
│   └── components/        # 组件样式
├── js/                    # JavaScript 源码
│   ├── main.js           # 应用入口
│   ├── config.js         # 配置文件
│   ├── api-client.js     # API 客户端
│   ├── state-manager.js  # 状态管理
│   ├── task-service.js   # 业务逻辑
│   ├── ui-controller.js  # UI 控制器
│   ├── components/       # UI 组件
│   └── utils/           # 工具函数
├── tests/               # 测试文件
│   ├── unit/           # 单元测试
│   ├── property/       # 属性测试
│   └── helpers/        # 测试辅助工具
└── package.json        # 项目配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发

1. 启动后端 API 服务（默认端口 8080）
2. 启动前端开发服务器：

```bash
npm run serve
```

3. 在浏览器中打开 http://localhost:3000

### 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test:unit

# 运行属性测试
npm test:property

# 监听模式
npm test:watch

# 生成覆盖率报告
npm test:coverage
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 自动修复问题
npm run lint:fix
```

## 配置

在 `js/config.js` 中配置 API 基础 URL：

```javascript
export const config = {
  apiBaseURL: 'http://localhost:8080',
  // ...
};
```

或通过环境变量注入：

```html
<script>
  window.ENV = {
    API_BASE_URL: 'https://api.example.com'
  };
</script>
```

## API 集成

前端与后端 API 通过以下端点通信：

- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建新任务
- `PATCH /api/tasks/{id}/status` - 更新任务状态
- `DELETE /api/tasks/{id}` - 删除任务

## 浏览器支持

- Chrome/Edge: 最新 2 个版本
- Firefox: 最新 2 个版本
- Safari: 最新 2 个版本
- Mobile Safari: iOS 12+
- Chrome Mobile: 最新 2 个版本

## 开发指南

### 架构

应用采用分层架构：

1. **表示层**: UI 组件（TaskList, TaskForm, TaskItem, Notification）
2. **应用层**: TaskService（业务逻辑）、UIController（协调器）
3. **数据层**: APIClient（HTTP 请求）、StateManager（状态管理）

### 测试策略

- **单元测试**: 测试具体示例、边界情况和错误条件
- **属性测试**: 验证通用属性在所有输入下都成立
- 目标覆盖率: 行覆盖率 >80%, 函数覆盖率 >85%

## 部署

### 静态文件托管

部署到 Netlify、Vercel、GitHub Pages 或任何 CDN：

```bash
# 构建不需要特殊步骤，直接部署所有文件
```

### 与后端一起部署

将前端文件放在后端的静态文件目录中，由后端服务器一起提供服务。

## 许可证

MIT
