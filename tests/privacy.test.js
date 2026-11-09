import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeEvent, sanitizeBreadcrumb } from '../src/privacy.js'
test('移除请求敏感数据，递归处理字段，保留业务定位信息', () => {
  const source = { user: { id: 'demo', email: 'test@example.invalid' }, request: { url: 'https://example.invalid/a?token=secret#hash', headers: { Authorization: 'secret' }, data: 'private', cookies: 'private' }, extra: { token: 'secret', nested: { password: 'secret' }, order: 'demo-001' } }
  const safe = sanitizeEvent(source)
  assert.deepEqual(safe.user, { id: 'demo' })
  assert.deepEqual(safe.request, { url: 'https://example.invalid/a' })
  assert.equal(safe.extra.token, '[Filtered]')
  assert.equal(safe.extra.nested.password, '[Filtered]')
  assert.equal(safe.extra.order, 'demo-001')
  assert.equal(source.extra.token, 'secret')
})
test('面包屑删除请求体并去掉查询参数', () => {
  assert.equal(sanitizeBreadcrumb({ category: 'console', level: 'debug' }), null)
  const safe = sanitizeBreadcrumb({ category: 'fetch', data: { url: '/api?token=secret', body: 'secret' } })
  assert.deepEqual(safe.data, { url: '/api' })
})
