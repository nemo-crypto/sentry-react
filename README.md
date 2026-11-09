# Sentry React 监控实验室

可直接运行的 React Demo：异常捕获、可恢复的组件错误边界、异步任务追踪、事件脱敏与 JSON 观察台。无需 Sentry 账号即可完整体验本地流程。

## 开箱即用

需要 Node.js 22.14+ 或 24 LTS，npm 10+。

```bash
npm install
npm run dev
```

打开 **http://127.0.0.1:5173**。默认无需 `.env`，使用真实 `@sentry/react` SDK 和本地 transport；事件不发送到外部 Sentry。依赖版本固定于 `package-lock.json`，可用 `npm ci` 复现。

## 可以直接体验什么

| 示例 | 操作 | 观察结果 |
| --- | --- | --- |
| 业务异常 | 捕获演示异常 | exception、scenario 标签、订单上下文与面包屑 |
| 组件崩溃 | 触发组件崩溃 → 恢复组件 | 局部错误边界降级，其他区域继续工作 |
| 性能追踪 | 运行性能示例 | `demo.load-dashboard` 事务与嵌套工作 span |
| 事件脱敏 | 生成脱敏示例 | token/password 变为 Filtered，邮箱和请求数据移除 |
| 队列处理 | 等待发送队列完成 | SDK flush 结果，不等同服务端入库保证 |

观察台保留当前页面最近 20 条已处理事件，刷新后清空。卡片、趋势和事件中使用的业务数据均为演示数据。

## 命令

```bash
npm run build          # 构建到 dist，生成隐藏 source map
npm run preview        # http://127.0.0.1:4174
npm run check          # 纯数据脱敏测试
npm run setup:browsers # 首次下载 Chromium
npm test               # 单元测试 + 自动构建/预览 + 浏览器交互测试
```

浏览器测试覆盖桌面和手机尺寸模拟，验证本地模式没有外部请求、错误边界恢复、脱敏结果及 span。测试会占用 4174，请先关闭手动预览服务。

## 切换到自己的 Sentry 项目

将 `.env.example` 复制为 `.env.local`，填写自己测试项目的公开 DSN，然后重启开发服务或重新构建。

```dotenv
VITE_SENTRY_DSN=https://PUBLIC_KEY@YOUR_SENTRY_HOST/PROJECT_ID
VITE_SENTRY_ENVIRONMENT=staging
VITE_SENTRY_RELEASE=sentry-react-demo@1.0.0
VITE_SENTRY_REPLAY=false
```

填入真实 DSN 后会使用默认网络 transport。界面只显示「已交给 SDK」，需要在 Sentry 后台核验项目、环境、release、事件 ID 和堆栈。DSN 是公开配置；`SENTRY_AUTH_TOKEN` 等管理凭据不能放在 `VITE_` 环境变量中。

Replay 默认关闭。确需演示时设置 `VITE_SENTRY_REPLAY=true`，代码开启文字、输入和媒体遮罩，错误回放采样开启；实际采集前按业务进一步验证遮罩范围。该 Demo 不启用浏览器 Profiling，也不把 SDK 版本与 Sentry 服务端版本直接一一对应。

## 实现入口

```text
src/monitoring.js  唯一 SDK 初始化、采样、transport 与演示事件
src/privacy.js     请求清理、已知敏感键过滤、URL 参数清理
src/event-store.js  内存观察台（与 Sentry 服务端相互独立）
src/App.jsx        四组交互示例和错误边界
sentry.js          保留原路径，改为有效的导出入口
```

原片段中的多次初始化、未定义变量、直接写在 JS 中的说明文字和固定外部 DSN 已移除。`initMonitoring()` 在 React render 之前执行一次，环境名称使用字符串。

## 接入现有项目

先阅读 [接入与验证指南](docs/integration.md)，再抽取 `monitoring.js` 与 `privacy.js`；观察台仅是教学工具。当前配置采用 Vite `import.meta.env`，换构建器时需要适配，不要直接复制旧 `process.env` 整个对象。

脱敏只覆盖代码列出的结构化字段和 URL 参数，不是任意文本中的秘密检测器。错误 message、业务上下文和附件仍应由业务侧控制；不要把真实凭据写进演示输入。

隐藏 source map 仍会生成在磁盘中。公开部署前应通过自己的 CI 上传至对应 release 并移除公网产物中的 `.map`；仓库没有自动上传，也没有连接真实 Sentry 验证远端入库。

<!-- BEGIN project-discovery -->
## 项目定位与实践入口

Sentry React SDK integration snippets for error monitoring, browser tracing, profiling and Session Replay. React 前端异常监控与性能追踪配置参考，需集成到宿主应用。

适合从以下入口阅读实现与接入条件：

- [SDK 配置片段](sentry.js)
- [接入边界与验证方法](README.md)
<!-- END project-discovery -->
