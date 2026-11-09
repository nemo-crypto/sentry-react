import * as Sentry from '@sentry/react'
import { sanitizeEvent, sanitizeBreadcrumb } from './privacy'
import { eventStore } from './event-store'
export const remoteEnabled = !!import.meta.env.VITE_SENTRY_DSN?.trim()
let initialized = false
export function initMonitoring() {
  if (initialized) return
  initialized = true
  const integrations = [Sentry.browserTracingIntegration()]
  const replay = remoteEnabled && import.meta.env.VITE_SENTRY_REPLAY === 'true'
  if (replay) integrations.push(Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true, maskAllInputs: true }))
  function prepare(event) {
    const clean = sanitizeEvent(event)
    eventStore.record(clean, remoteEnabled ? '已交给 SDK（入库待核验）' : '等待本地接收')
    return clean
  }
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN?.trim() || 'https://public@example.invalid/1',
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || 'sentry-react-demo@1.0.0',
    integrations, sendDefaultPii: false, autoSessionTracking: false,
    tracesSampleRate: remoteEnabled ? 0.1 : 1,
    tracePropagationTargets: [],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: replay ? 1 : 0,
    maxBreadcrumbs: 30,
    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSend: prepare,
    beforeSendTransaction: prepare,
    ...(!remoteEnabled ? { transport: () => ({
      send(envelope) {
        for (const [header, payload] of envelope[1]) {
          if (['event', 'transaction'].includes(header.type)) eventStore.update(payload.event_id, '已在本地接收')
        }
        return Promise.resolve({ statusCode: 200 })
      },
      flush: () => Promise.resolve(true)
    }) } : {})
  })
  Sentry.setTag('demo', 'react-observability')
}
export function captureDemoError() {
  Sentry.withScope(scope => {
    scope.setTag('scenario', 'manual-error')
    scope.setContext('demo_order', { id: 'demo-order-001', stage: 'payment-validation' })
    Sentry.addBreadcrumb({ category: 'demo', message: '点击手动异常示例', level: 'info' })
    Sentry.captureException(new Error('Demo：订单校验失败'))
  })
}
export function capturePrivateData() {
  Sentry.captureEvent({ message: 'Demo：脱敏检查', level: 'info', user: { id: 'demo-user', email: 'demo@example.invalid', ip_address: '127.0.0.1' }, extra: { token: 'demo-token-do-not-keep', nested: { password: 'demo-password' }, feature: 'privacy-preview' }, request: { url: 'https://example.invalid/orders?token=demo-query', headers: { Authorization: 'Bearer demo-secret' }, data: 'demo-body' } })
}
export async function runDemoTask() {
  await Sentry.startSpan({ name: 'demo.load-dashboard', op: 'demo.task', forceTransaction: true }, async () => {
    await Sentry.startSpan({ name: 'demo.prepare-data', op: 'demo.work' }, () => new Promise(resolve => setTimeout(resolve, 180)))
    Sentry.addBreadcrumb({ category: 'demo', message: '模拟任务完成，无真实业务请求', level: 'info' })
  })
}
export { Sentry }
