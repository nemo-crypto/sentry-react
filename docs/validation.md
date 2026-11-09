# 验证记录

日期：2026-11-09；Node.js 24.14.1；实际安装 @sentry/react 10.78.0。

- npm install：通过，已生成 package-lock.json。
- npm run check：2 项通过，覆盖敏感字段、请求清理和面包屑处理。
- npm run build：通过，Vite 生产产物生成成功。
- npm test：2 项单元检查 + 6 项浏览器测试通过。
- npm run dev：实际启动；浏览器验证错误捕获与本地事件观察台。

浏览器验证桌面与手机尺寸、默认没有外部请求、组件错误边界恢复、脱敏结果和包含子 span 的事务。界面截图已检查，无横向溢出。

未配置真实 DSN，未向真实 Sentry 上报，未验证服务端入库、source map 上传或 Replay 后台展示。移动端为 Chromium 模拟，不是真机。
