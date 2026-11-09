// 可运行示例入口。React 应用应在 render 之前调用一次 initMonitoring()。
// 使用 Vite 的 import.meta.env；其他构建工具请显式适配环境变量。
export { initMonitoring, captureDemoError, capturePrivateData, runDemoTask, Sentry } from './src/monitoring.js'
