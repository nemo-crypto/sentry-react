import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeEvent } from '../src/privacy.js'

test('transaction span URL attributes remove the same query and fragment data as request URLs', () => {
  const privateUrl = 'https://example.invalid/orders?customer=private-customer#private-fragment'
  const event = {
    type: 'transaction', transaction: 'demo.load-dashboard',
    contexts: { trace: { data: { 'url.full': privateUrl, 'url.query': '?customer=private-customer', 'url.fragment': '#private-fragment' } } },
    spans: [{ op: 'http.client', data: { 'http.url': privateUrl, 'url.full': privateUrl, 'http.request.method': 'GET' } }],
  }
  const clean = sanitizeEvent(event)
  assert.equal(clean.spans[0].data['http.url'], 'https://example.invalid/orders')
  assert.equal(clean.spans[0].data['url.full'], 'https://example.invalid/orders')
  assert.equal(clean.contexts.trace.data['url.full'], 'https://example.invalid/orders')
  assert.equal(JSON.stringify(clean).includes('private-customer'), false)
  assert.equal(JSON.stringify(clean).includes('private-fragment'), false)
  assert.equal(clean.spans[0].data['http.request.method'], 'GET')
  assert.equal(event.spans[0].data['http.url'], privateUrl)
})
