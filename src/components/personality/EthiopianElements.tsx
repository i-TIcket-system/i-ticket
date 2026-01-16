/**
 * TIER 5 - ETHIOPIAN PERSONALITY ELEMENTS
 * Cultural touches and localized personality
 */

'use client'

import { useState, useEffect } from 'react'
import { Coffee, Heart, Star, Calendar, Clock, Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Ethiopian Flag Bar
 * Decorative Ethiopian flag colors
 */
export function EthiopianFlagBar({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1', className)}>
      <div className="h-1.5 w-10 rounded-full bg-[#10b981]" /> {/* Green */}
      <div className="h-1.5 w-10 rounded-full bg-[#fbbf24]" /> {/* Yellow */}
      <div className="h-1.5 w-10 rounded-full bg-[#ef4444]" /> {/* Red */}
    </div>
  )
}

/**
 * Ethiopian Time Display
 * Shows time in Ethiopian format (12-hour cycle starting at 6 AM)
 */
export function EthiopianTimeDisplay({
  date,
  showBoth = false,
  className,
}: {
  date: Date
  showBoth?: boolean
  className?: string
}) {
  const hour = date.getHours()
  const minute = date.getMinutes()

  // Ethiopian time: 6 AM = 12 (start of day), 12 PM = 6, 6 PM = 12 (start of night)
  const ethHour = hour >= 6 ? hour - 6 : hour + 6
  const ethMinute = minute

  const ethiopianTime = `${ethHour === 0 ? 12 : ethHour}:${ethMinute.toString().padStart(2, '0')}`
  const standardTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <Clock className="h-4 w-4 text-primary" />
      {showBoth ? (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{standardTime}</span>
          <span className="text-muted-foreground">({ethiopianTime} Ethiopian time)</span>
        </div>
      ) : (
        <span className="font-semibold">{standardTime}</span>
      )}
    </div>
  )
}

/**
 * Ethiopian Calendar Date
 * Shows date in Ethiopian calendar (optional)
 */
export function EthiopianCalendarBadge({
  showGregorian = true,
  className,
}: {
  showGregorian?: boolean
  className?: string
}) {
  const today = new Date()
  const gregorian = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Simplified Ethiopian date (actual conversion requires complex calculation)
  // This is a placeholder - real implementation would use ethiopic-calendar library
  const ethiopianYear = today.getFullYear() - 7

  return (
    <Badge variant="outline" className={cn('gap-2', className)}>
      <Calendar className="h-3 w-3 text-primary" />
      {showGregorian ? (
        <span className="text-xs">{gregorian} • {ethiopianYear} E.C.</span>
      ) : (
        <span className="text-xs">{gregorian}</span>
      )}
    </Badge>
  )
}

/**
 * Coffee Ceremony Easter Egg
 * Hidden coffee animation on triple-click
 */
export function CoffeeCeremonyEasterEgg() {
  const [showCoffee, setShowCoffee] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setClickCount(0), 1000)
    return () => clearTimeout(timer)
  }, [clickCount])

  useEffect(() => {
    if (clickCount === 3) {
      setShowCoffee(true)
      setTimeout(() => setShowCoffee(false), 5000)
      setClickCount(0)
    }
  }, [clickCount])

  if (!showCoffee) {
    return (
      <div
        onClick={() => setClickCount(prev => prev + 1)}
        className="inline-block cursor-default"
      >
        <Coffee className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none animate-fade-in">
      <Card className="p-8 text-center max-w-md animate-pop">
        <div className="mb-4">
          <Coffee className="h-16 w-16 text-primary mx-auto animate-bounce" />
        </div>
        <h3 className="text-2xl font-display font-semibold mb-2">
          ቡና ተቀማጥ! (Buna Tetu!)
        </h3>
        <p className="text-muted-foreground">
          Enjoy Ethiopian coffee while booking your journey!
        </p>
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary animate-float"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * Ethiopian Greeting
 * Shows appropriate greeting based on time of day
 */
export function EthiopianGreeting({
  userName,
  showAmharic = true,
  className,
}: {
  userName?: string
  showAmharic?: boolean
  className?: string
}) {
  const hour = new Date().getHours()

  let greeting = 'Hello'
  let amharicGreeting = 'ሰላም' // Selam

  if (hour >= 5 && hour < 12) {
    greeting = 'Good Morning'
    amharicGreeting = 'እንደምን አደሩ' // Endemen aderu
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon'
    amharicGreeting = 'እንደምን ዋሉ' // Endemen walu
  } else if (hour >= 17 && hour < 22) {
    greeting = 'Good Evening'
    amharicGreeting = 'እንደምን አመሹ' // Endemen ameshu
  } else {
    greeting = 'Good Night'
    amharicGreeting = 'መልካም እድር' // Melkam edir
  }

  return (
    <div className={cn('space-y-1', className)}>
      <h2 className="text-3xl font-display font-semibold">
        {greeting}{userName && `, ${userName}`}
      </h2>
      {showAmharic && (
        <p className="text-lg text-muted-foreground font-medium">
          {amharicGreeting}
        </p>
      )}
    </div>
  )
}

/**
 * Ethiopian Pattern Background
 * Decorative pattern with Ethiopian geometric motifs
 */
export function EthiopianPatternBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn('absolute inset-0 opacity-5 pointer-events-none', className)}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230e9494' fill-opacity='1'%3E%3Cpath d='M40 40L20 20v40l20-20zm0 0l20 20V20L40 40zM0 40l20-20H0v20zm0 0l20 20H0V40zm80 0L60 20h20v20zm0 0L60 60h20V40zM40 0L20 20h40L40 0zm0 80L20 60h40L40 80z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  )
}

/**
 * Holiday Banner
 * Shows special message during Ethiopian holidays
 */
export function HolidayBanner() {
  const [holiday, setHoliday] = useState<string | null>(null)

  useEffect(() => {
    // Check current date against Ethiopian holidays
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    // Ethiopian New Year (Enkutatash) - Sept 11
    if (month === 9 && day === 11) {
      setHoliday('Happy Ethiopian New Year! 🎊 መልካም አዲስ ዓመት!')
    }
    // Meskel (Finding of True Cross) - Sept 27
    else if (month === 9 && day === 27) {
      setHoliday('Happy Meskel! 🌼 መልካም መስቀል!')
    }
    // Timkat (Epiphany) - Jan 19
    else if (month === 1 && day === 19) {
      setHoliday('Happy Timkat! 💧 መልካም ጥምቀት!')
    }
    // Fasika (Easter) - varies, would need calculation
    // Christmas (Genna) - Jan 7
    else if (month === 1 && day === 7) {
      setHoliday('Merry Christmas! 🎄 መልካም ገና!')
    }
  }, [])

  if (!holiday) return null

  return (
    <div className="bg-gradient-to-r from-[#10b981] via-[#fbbf24] to-[#ef4444] p-4 text-center text-white animate-fade-in">
      <div className="container mx-auto">
        <p className="text-lg font-semibold">{holiday}</p>
      </div>
    </div>
  )
}

/**
 * Achievement Badge
 * Gamification element for frequent travelers
 */
export function AchievementBadge({
  type,
  title,
  description,
  icon: Icon = Star,
  unlocked = false,
}: {
  type: 'trips' | 'routes' | 'loyalty'
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  unlocked?: boolean
}) {
  return (
    <Card
      className={cn(
        'p-4 transition-all duration-300',
        unlocked
          ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 cursor-pointer hover:scale-105'
          : 'opacity-40 grayscale'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0',
            unlocked
              ? 'bg-gradient-to-br from-primary to-secondary'
              : 'bg-muted'
          )}
        >
          <Icon className={cn('h-6 w-6', unlocked ? 'text-white' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-semibold text-sm', unlocked && 'text-foreground')}>
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          {unlocked && (
            <Badge variant="secondary" className="mt-2 text-xs">
              <Heart className="h-3 w-3 mr-1 text-red-500" />
              Unlocked
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Loading Messages
 * Ethiopian-themed loading messages
 */
export function EthiopianLoadingMessage() {
  const messages = [
    'እንኳን ደህና መጡ... (Welcome...)',
    'በመጓዝ ላይ... (Traveling...)',
    'እየፈለግን ነው... (Searching...)',
    'መቀመጫዎችን እየፈተሸን... (Checking seats...)',
    'ቡና እያዘጋጀን... (Preparing coffee...)',
    'መንገዱን እየፈጠርን... (Creating your journey...)',
  ]

  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground animate-fade-in" key={messageIndex}>
        {messages[messageIndex]}
      </p>
    </div>
  )
}

/**
 * Fun Facts
 * Ethiopian travel and cultural fun facts
 */
export function FunFactCard() {
  const facts = [
    {
      emoji: '☕',
      text: 'Ethiopia is the birthplace of coffee! Legend says a goat herder discovered it when his goats became energetic after eating coffee berries.',
    },
    {
      emoji: '📅',
      text: 'Ethiopia has 13 months! The Ethiopian calendar has 12 months of 30 days plus a 13th month of 5-6 days.',
    },
    {
      emoji: '🕐',
      text: 'Ethiopian time starts at 6 AM, not midnight! So 12 o\'clock Ethiopian time is 6 AM Western time.',
    },
    {
      emoji: '🏔️',
      text: 'Ethiopia has more UNESCO World Heritage Sites than any other African country!',
    },
    {
      emoji: '🦁',
      text: 'The Ethiopian wolf is the rarest canid in the world and found only in Ethiopia.',
    },
    {
      emoji: '🌍',
      text: 'Ethiopia is the only African country that was never colonized!',
    },
  ]

  const [factIndex, setFactIndex] = useState(
    Math.floor(Math.random() * facts.length)
  )

  const handleNewFact = () => {
    setFactIndex(prev => (prev + 1) % facts.length)
  }

  const currentFact = facts[factIndex]

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{currentFact.emoji}</div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Ethiopian Fun Fact
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentFact.text}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewFact}
            className="mt-3 gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Show me another!
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Missing import
import { RefreshCw } from 'lucide-react'
