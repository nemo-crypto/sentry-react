import React, { useState, useSyncExternalStore } from 'react'
import { Sentry, remoteEnabled, captureDemoError, capturePrivateData, runDemoTask } from './monitoring'
import { eventStore } from './event-store'
function CrashPanel() {
  const [crash, setCrash] = useState(false)
  if (crash) throw new Error('Demo：组件渲染失败')
  return <button onClick={() => setCrash(true)}>触发组件崩溃</button>
}
export default function App() {
  const events = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null)
  const active = events.find(item => item.id === selected) || events[0]
  async function task() { setBusy(true); try { await runDemoTask(); setNotice('模拟任务完成，事务由 SDK 处理。') } finally { setBusy(false) } }
  async function flush() { const done = await Sentry.flush(3000); setNotice(done ? 'SDK 当前发送队列已处理；远端入库仍需在 Sentry 中核验。' : '等待发送超时，请检查网络或 transport。') }
  return <main className="lab">
    <header><a className="brand" href="/">◈ <strong>Sentry Lab</strong></a><span className="mode">{remoteEnabled ? '真实 DSN 模式' : '本地体验 · 无外部上报'}</span></header>
    <section className="hero"><div className="eyebrow">REACT OBSERVABILITY PLAYGROUND</div><h1>让异常，变得可观察。</h1><p>亲手触发错误、恢复组件、追踪任务，再查看 SDK 实际处理过的事件。</p></section>
    <section className="stats"><article><span>接入方式</span><strong>{remoteEnabled ? 'Sentry 项目' : 'Local transport'}</strong><small>真实 React SDK，默认不发送网络事件</small></article><article><span>当前事件</span><strong data-testid="event-count">{events.length}</strong><small>只保留当前页面最近 20 条</small></article><article><span>采集范围</span><strong>Errors + Traces</strong><small>Replay 默认关闭，隐私处理开启</small></article></section>
    <div className="workspace"><section className="scenarios"><div className="section-title"><h2>选择一个实验</h2><span>01 — 04</span></div>
      <article className="card"><span className="step">01 / CAPTURE</span><h3>捕获业务异常</h3><p>携带当前操作的标签、上下文与面包屑，定位出错环节。</p><button onClick={captureDemoError}>捕获演示异常</button></article>
      <article className="card"><span className="step">02 / RECOVER</span><h3>组件错误边界</h3><p>局部渲染失败时展示降级界面，保留整个工作台。</p><Sentry.ErrorBoundary fallback={({ resetError }) => <div role="alert" className="fallback"><p>演示组件发生异常，其他区域仍可操作。</p><button onClick={resetError}>恢复组件</button></div>}><CrashPanel /></Sentry.ErrorBoundary></article>
      <article className="card"><span className="step">03 / TRACE</span><h3>记录异步任务</h3><p>一个模拟任务和嵌套 span，演示耗时与执行关系。</p><button disabled={busy} onClick={task}>{busy ? '任务执行中…' : '运行性能示例'}</button></article>
      <article className="card"><span className="step">04 / PRIVACY</span><h3>检查事件脱敏</h3><p>使用虚构 token、邮箱和请求参数，验证敏感字段的处理结果。</p><button onClick={capturePrivateData}>生成脱敏示例</button></article>
    </section><section className="inspector"><div className="section-title"><h2>事件观察台</h2><button className="text-button" onClick={() => { eventStore.clear(); setSelected(null) }}>清空记录</button></div>
      {!events.length ? <div className="empty"><span>◎</span><h3>等待第一个事件</h3><p>点击左侧实验按钮，这里将显示事件信息。</p></div> : <><div className="event-list" aria-label="事件列表">{events.map(item => <button key={item.id} className={active?.id === item.id ? 'event selected' : 'event'} onClick={() => setSelected(item.id)}><span>{item.title}</span><small>{item.time} · {item.type} · {item.status}</small></button>)}</div><div className="payload-head">处理后的事件 JSON</div><pre data-testid="event-payload">{JSON.stringify(active?.payload, null, 2)}</pre></>}
      <div className="inspector-foot"><button onClick={flush}>等待发送队列完成</button><p role="status">{notice || '本地接收只证明 SDK 与 transport 流程，不代表远端 Sentry 入库。'}</p></div>
    </section></div><footer>单次初始化 · 可恢复错误边界 · 明确的采集范围<span>React + Sentry SDK</span></footer>
  </main>
}
