/**
 * Offline GPS Position Queue
 *
 * Stores GPS positions in localStorage when the device is offline,
 * then batch-sends them when connectivity is restored.
 */

const QUEUE_KEY = 'iticket_gps_queue'
const MAX_QUEUE_SIZE = 1000 // ~2h 46min offline at 10s intervals (~200KB)

interface QueuedPosition {
  tripId: string
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  heading?: number
  speed?: number
  recordedAt: string // ISO string
}

/**
 * Add a GPS position to the offline queue
 */
export function enqueuePosition(position: QueuedPosition): void {
  if (typeof window === 'undefined') return

  try {
    const queue = getQueue()

    // Drop oldest positions if queue is full
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE + 1)
    }

    queue.push(position)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage might be full or unavailable
    console.warn('[GPS Queue] Failed to enqueue position')
  }
}

/**
 * Get all queued positions
 */
export function getQueue(): QueuedPosition[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as QueuedPosition[]
  } catch {
    return []
  }
}

/**
 * Clear the queue after successful batch send
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUEUE_KEY)
}

/**
 * Remove successfully sent positions from the queue
 */
export function dequeuePositions(count: number): void {
  if (typeof window === 'undefined') return

  try {
    const queue = getQueue()
    queue.splice(0, count)

    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_KEY)
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    }
  } catch {
    // Ignore
  }
}

/**
 * Send all queued positions to the server
 * Returns the number of positions successfully sent
 */
export async function flushQueue(): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let sentCount = 0

  // Send positions one at a time to reuse the existing API endpoint
  for (const position of queue) {
    try {
      const response = await fetch('/api/tracking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position),
      })

      if (response.ok || response.status === 409) {
        // 409 = duplicate, still count as processed
        sentCount++
      } else {
        // Stop on first failure (might be offline again)
        break
      }
    } catch {
      break
    }
  }

  if (sentCount > 0) {
    dequeuePositions(sentCount)
  }

  return sentCount
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return getQueue().length
}
