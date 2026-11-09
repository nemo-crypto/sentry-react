let events = []
const listeners = new Set()
function publish() { listeners.forEach(listener => listener()) }
export const eventStore = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  getSnapshot: () => events,
  record(event, status = '等待发送') {
    const item = { id: event.event_id || crypto.randomUUID(), time: new Date().toLocaleTimeString(), title: event.message || event.exception?.values?.[0]?.value || event.transaction || 'SDK 事件', type: event.type || 'error', status, payload: event }
    events = [item, ...events.filter(previous => previous.id !== item.id)].slice(0, 20)
    publish()
  },
  update(id, status) { events = events.map(item => item.id === id ? { ...item, status } : item); publish() },
  clear() { events = []; publish() }
}
