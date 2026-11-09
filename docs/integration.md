# 接入与验证指南

## 初始化顺序

先初始化 SDK，再创建 React 根节点。不要在每次组件 render 时初始化；在路由组件、业务工具和错误边界中复用同一 SDK 实例。本例包含初始化保护，但实际应用仍应保持单一入口。

`src/monitoring.js` 使用 Sentry 10 系列 API，锁文件记录本次安装的准确版本。升级时以对应 SDK 文档与发行说明为准，不沿用旧版本 profiling/replay 的全部字段。

## 三类错误如何区分

- 手动捕获：业务 `catch` 中调用 `captureException`，用 `withScope` 限定本次标签，避免污染其他事件。
- React 渲染错误：使用 `Sentry.ErrorBoundary` 展示降级 UI，并提供恢复操作。
- 未捕获错误/Promise rejection：由浏览器 SDK 集成处理；错误边界并不能捕获所有异步或事件回调异常。

捕获业务异常后仍要完成业务恢复。把错误发送给监控系统不会自动重试请求或回滚操作。

## 性能示例

`startSpan` 包裹模拟异步任务，子 span 表示内部工作阶段。`forceTransaction` 用于让演示任务独立可见；真实业务应优先使用符合业务边界的 span 层次。

本地模式 100% 采样便于教学，真实 DSN 模式默认 tracesSampleRate 为 0.1，某次点击没有性能事件可能是采样结果。`tracePropagationTargets` 默认空数组，不把 tracing headers 发向任意外部接口；接入自己的 API 时显式配置，并校验 CORS。

## 本地 transport 的验证边界

SDK 执行集成、scope、面包屑、处理钩子与封装，然后调用本地 transport。观察台显示「已在本地接收」代表事件走到了该边界，不代表 DNS、网络传输、配额、服务端符号化、Replay 或项目权限已验证。

`flush(timeout)` 只等待 SDK 当前待处理队列，不强制结束所有活跃事务，也不保证服务端立即完成处理。Replay 有独立缓冲和生命周期，不能用 maxBreadcrumbs 控制其网络批量大小。

## 真实项目验收

1. 使用测试项目 DSN，确认环境名和 release 与当前构建一致。
2. 触发带唯一业务标识的错误，在后台核对事件 ID、标签、上下文。
3. 上传匹配构建的 source map，检查堆栈是否还原到源码。
4. 检查实际网络发送与配额；不要仅凭 captureException 返回 ID 就判断入库成功。
5. 如启用 Replay，实际检查输入、文字、媒体及业务字段的遮罩效果。

## 资料入口

- [Sentry React 文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [React Error Boundary](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [SDK 数据清理](https://docs.sentry.io/platforms/javascript/guides/react/configuration/filtering/)

以上为维护时参考入口；本次以已安装 SDK、本地构建与行为测试核验实现，没有连接真实服务端。
