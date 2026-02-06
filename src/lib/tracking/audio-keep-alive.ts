/**
 * Silent audio keep-alive to prevent browser from suspending JavaScript
 * when the screen is off or the tab is in background.
 *
 * Plays a near-silent audio loop using a tiny MP3 data URI.
 * Must be started from a user gesture (button click) to satisfy autoplay policy.
 */

// Minimal valid MP3 file (~200 bytes) of silence — generated as base64
// This is a 0.5 second silent MP3 frame that loops without clicks
const SILENT_MP3 =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAAHAAL0AAAAIgAAXoAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQfAAAAADSAAAAAAAAANIAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="

let audioElement: HTMLAudioElement | null = null
let isPlaying = false

/**
 * Start playing silent audio to keep the browser alive.
 * MUST be called from a user interaction event handler (click, tap).
 */
export function startAudioKeepAlive(): boolean {
  if (isPlaying && audioElement) return true

  try {
    if (!audioElement) {
      audioElement = new Audio(SILENT_MP3)
      audioElement.loop = true
      audioElement.volume = 0.01 // Near-silent but not zero (zero may be optimized away)
    }

    const playPromise = audioElement.play()
    if (playPromise) {
      playPromise
        .then(() => {
          isPlaying = true
        })
        .catch(() => {
          isPlaying = false
        })
    }

    return true
  } catch {
    return false
  }
}

/**
 * Stop the silent audio keep-alive.
 */
export function stopAudioKeepAlive(): void {
  if (audioElement) {
    audioElement.pause()
    audioElement.currentTime = 0
    isPlaying = false
  }
}

/**
 * Resume audio if it was interrupted (e.g., by visibility change).
 * Safe to call without user gesture if audio was previously started by one.
 */
export function resumeAudioKeepAlive(): void {
  if (audioElement && !isPlaying) {
    const playPromise = audioElement.play()
    if (playPromise) {
      playPromise
        .then(() => {
          isPlaying = true
        })
        .catch(() => {
          isPlaying = false
        })
    }
  }
}

/**
 * Check if the audio keep-alive is currently playing.
 */
export function isAudioKeepAliveActive(): boolean {
  return isPlaying && audioElement !== null && !audioElement.paused
}
