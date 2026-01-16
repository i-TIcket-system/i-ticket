/**
 * Confetti animations for success states
 * Uses canvas-confetti library
 */

import confetti from 'canvas-confetti'

/**
 * Booking success confetti - Celebration burst
 */
export const bookingSuccessConfetti = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  // Ethiopian flag colors + teal theme
  const colors = [
    '#10b981', // Green (Ethiopian flag)
    '#fbbf24', // Yellow (Ethiopian flag)
    '#ef4444', // Red (Ethiopian flag)
    '#0e9494', // Teal primary
    '#20c4c4', // Teal light
  ]

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors,
  })

  fire(0.2, {
    spread: 60,
    colors,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors,
  })
}

/**
 * Payment success confetti - Side cannons
 */
export const paymentSuccessConfetti = () => {
  const end = Date.now() + 3 * 1000 // 3 seconds
  const colors = ['#0e9494', '#20c4c4', '#10b981']

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      zIndex: 9999,
    })

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      zIndex: 9999,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Quick success confetti - Subtle celebration
 */
export const quickSuccessConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#0e9494', '#20c4c4', '#10b981', '#fbbf24'],
    zIndex: 9999,
  })
}

/**
 * Holiday confetti - Ethiopian holidays special
 */
export const holidayConfetti = () => {
  const duration = 5 * 1000
  const end = Date.now() + duration

  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#ef4444'], // Ethiopian flag
      zIndex: 9999,
    })

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#ef4444'],
      zIndex: 9999,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Fireworks confetti - Special occasions
 */
export const fireworksConfetti = () => {
  const duration = 5 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#0e9494', '#20c4c4', '#10b981'],
    })

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#10b981', '#fbbf24', '#ef4444'],
    })
  }, 250)
}
