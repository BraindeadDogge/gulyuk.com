import type { APIRequestContext } from '@playwright/test'

export const STUB = 'http://127.0.0.1:4174'

export type Sent = { type: string, payload: { name?: string, url?: string, referrer?: string, data?: Record<string, unknown> } }

export async function log(request: APIRequestContext) {
  return (await (await request.get(`${STUB}/__log`)).json()) as { events: Sent[], hits: string[] }
}
export async function reset(request: APIRequestContext) {
  await request.post(`${STUB}/__reset`)
}
export const named = (events: Sent[], name: string) => events.filter(e => e.payload.name === name)
export const views = (events: Sent[]) => events.filter(e => !e.payload.name)
