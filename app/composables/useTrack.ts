export type Track = (name: string, props?: Record<string, unknown>) => void

const noop: Track = () => {}

/** Sends one named event to the visit statistics. Does nothing on the server or when tracking is not allowed. */
export function useTrack(): Track {
  if (import.meta.server) return noop
  return (useNuxtApp().$track as Track | undefined) ?? noop
}
