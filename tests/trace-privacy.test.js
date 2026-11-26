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

test('XHR query and fragment attributes are filtered while URL paths and timing metadata survive', () => {
  const event = { spans: [{ op: 'http.client', data: {
    url: '/checkout?customer=private-query#private-fragment',
    'http.url': 'https://example.invalid/checkout?customer=private-query#private-fragment',
    'http.query': '?customer=private-query', 'http.fragment': '#private-fragment',
    'url.path': '/checkout', 'http.status_code': 200,
  } }] }
  const clean = sanitizeEvent(event)
  assert.equal(clean.spans[0].data.url, '/checkout')
  assert.equal(clean.spans[0].data['http.query'], '[Filtered]')
  assert.equal(clean.spans[0].data['http.fragment'], '[Filtered]')
  assert.equal(clean.spans[0].data['url.path'], '/checkout')
  assert.equal(clean.spans[0].data['http.status_code'], 200)
  assert.equal(JSON.stringify(clean).includes('private-query'), false)
  assert.equal(JSON.stringify(clean).includes('private-fragment'), false)
})
