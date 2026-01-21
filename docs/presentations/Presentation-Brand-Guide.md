# i-Ticket Presentation Brand Guide
## Color Palette & Design System

---

## 🎨 Official Color Palette

### Primary Colors (i-Ticket Teal)
```
Primary Teal:     #0d9488  (Headings, logos, CTAs)
Teal Light:       #14b8a6  (Accents, highlights)
Teal Lighter:     #5eead4  (Backgrounds, subtle elements)
Teal Lightest:    #f0fdfa  (Section backgrounds, cards)
```

### Secondary Colors
```
Dark Gray:        #1f2937  (Body text)
Medium Gray:      #6b7280  (Secondary text)
Light Gray:       #d1d5db  (Borders, dividers)
White:            #ffffff  (Backgrounds)
```

### Accent Colors (Use Sparingly)
```
Success Green:    #10b981  (Checkmarks, positive metrics)
Warning Red:      #ef4444  (Problems, "before" states)
Neutral Slate:    #64748b  (Tables, neutral info)
```

---

## 📐 Typography Guidelines

### Fonts (In Order of Preference)
1. **Segoe UI** (Windows default - professional, readable)
2. **Inter** (Modern, available on Google Fonts)
3. **Helvetica Neue** (Mac default)
4. **Arial** (Universal fallback)

### Font Sizes
```
Slide Title (H1):       52pt, Bold, Color: #0d9488
Section Header (H2):    38pt, SemiBold, Color: #0f766e
Subsection (H3):        28pt, SemiBold, Color: #115e59
Body Text:              26pt, Regular, Color: #1f2937
Small Text/Footer:      18pt, Regular, Color: #6b7280
```

### Text Formatting
- **Bold:** Use i-Ticket teal (#0d9488) for emphasis
- **Italics:** Use for quotes and testimonials
- Line height: 1.6-1.8 for readability
- Maximum 7 bullet points per slide
- Keep text left-aligned (easier to read)

---

## 🖼️ Layout Guidelines

### Slide Structure
```
┌─────────────────────────────────────┐
│ [Header/Logo]              [Page #] │
├─────────────────────────────────────┤
│                                     │
│  Slide Title (52pt, teal)          │
│  ────────────────────────           │ ← 4px teal underline
│                                     │
│  Content Area                       │
│  • Bullet point 1                  │
│  • Bullet point 2                  │
│                                     │
│  [Visual/Chart/Image]              │
│                                     │
└─────────────────────────────────────┘
│ Footer: i-Ticket | Contact Info    │
└─────────────────────────────────────┘
```

### Spacing
- Top margin: 80px
- Side margins: 100px
- Bottom margin: 60px
- Element spacing: 30-40px between sections

### Background Options
**Option 1: Clean White**
- Background: #ffffff
- Simple, professional, high contrast

**Option 2: Subtle Gradient** (Recommended)
- Top: #ffffff
- Bottom: #f0fdfa (teal lightest)
- Creates depth without distraction

**Option 3: Split Screen**
- Left 60%: White background
- Right 40%: Teal gradient with image overlay

---

## 📊 Table Styling

### Table Headers
```
Background: Linear gradient (#0d9488 → #14b8a6)
Text: White (#ffffff), 24pt, Bold
Padding: 12px top/bottom, 16px left/right
```

### Table Rows
```
Even rows: Light teal background (#f0fdfa)
Odd rows: White background (#ffffff)
Text: Dark gray (#1f2937), 22pt
Border: 1px solid #d1d5db (light gray)
Padding: 10px all sides
```

### Number Emphasis in Tables
- **Green (#10b981)** for positive changes (↗ +15%, Revenue increase)
- **Red (#ef4444)** for problems/before states (↘ -83% time wasted)
- **Teal (#0d9488)** for neutral metrics

---

## 🎯 Icon & Visual Guidelines

### Icons
- Style: **Line icons** (not filled) for consistency
- Color: Teal (#0d9488) or dark gray (#1f2937)
- Size: 48px x 48px for main icons
- Sources:
  - Heroicons (free, matches i-Ticket UI)
  - Feather Icons
  - Font Awesome (line style)

### Checkmarks & Status Indicators
```
✅ Success:    #10b981 (green)
❌ Problem:    #ef4444 (red)
⚠️ Warning:    #f59e0b (amber)
🎯 Goal:       #0d9488 (teal)
```

### Charts & Graphs
**Color Scheme:**
- Primary data: Teal (#0d9488)
- Secondary data: Green (#10b981)
- Comparison/baseline: Gray (#6b7280)
- Negative/problems: Red (#ef4444)

**Chart Types to Use:**
- **Bar charts:** For comparisons (before/after)
- **Line charts:** For trends over time
- **Pie charts:** For revenue breakdown (max 5 segments)
- Avoid: 3D charts, excessive gradients, more than 3 colors per chart

---

## 🖼️ Image Guidelines

### Image Style
- **Real photos preferred** over illustrations
- Ethiopian context when possible (local buses, terminals, people)
- Professional quality (min 1920x1080)
- Avoid stock photos that look too "Western"

### Image Placement
- Background images: 30% opacity with teal overlay
- Side images: 40% of slide width, right-aligned
- Full-bleed images: Use sparingly (title slide, closing slide)

### Recommended Image Sources
1. **Unsplash** (free, high quality)
   - Search: "bus", "transport", "mobile payment", "Ethiopia"
2. **Pexels** (free)
3. **Custom photography** (best - take photos of actual Ethiopian buses/terminals)

### Image Overlay for Text Readability
```css
Background image → Dark overlay (40% black) → White text
OR
Background image → Teal gradient overlay (#0d9488 at 60%) → White text
```

---

## 📱 Converting to PowerPoint/Google Slides

### For Microsoft PowerPoint:

1. **Create Master Slide:**
   - Open PowerPoint → View → Slide Master
   - Set background gradient: White → #f0fdfa
   - Add header logo (top-left)
   - Add footer text (bottom)
   - Save as template

2. **Set Default Fonts:**
   - Home → Font → Set default to Segoe UI
   - Title: 52pt, Bold, #0d9488
   - Body: 26pt, Regular, #1f2937

3. **Create Color Scheme:**
   - Design → Colors → Customize Colors
   - Accent 1: #0d9488 (primary teal)
   - Accent 2: #10b981 (green)
   - Accent 3: #ef4444 (red)
   - Text: #1f2937 (dark gray)
   - Background: #ffffff (white)

4. **Import Tables:**
   - Copy table from Markdown
   - Format with "Banded Rows" style
   - Change header to teal gradient (manually)

### For Google Slides:

1. **Create Custom Theme:**
   - Slide → Edit theme
   - Set background: White or gradient (use Shape → Gradient fill)
   - Add logo to master slide

2. **Import Color Palette:**
   - Use "Custom color" picker
   - Add all i-Ticket colors to palette
   - They'll appear in color picker for quick access

3. **Font Setup:**
   - Use "Inter" font (closest to Segoe UI, available in Google Fonts)
   - If unavailable, use "Arial" or "Roboto"

4. **Collaborative Editing:**
   - Share with team for review
   - Use comment feature for feedback
   - Version history tracks all changes

---

## 🎬 Animation Guidelines

### Slide Transitions
- **Recommended:** Fade (300ms duration)
- **Acceptable:** None (clean, fast)
- **Avoid:** Wipe, Dissolve, 3D effects (too distracting)

### Element Animations
**Use sparingly - only when it adds value:**

**Good Uses:**
- Reveal bullet points one-by-one (Fade in, 200ms delay between)
- Emphasize key numbers (Zoom in, 300ms)
- Build comparison tables row-by-row

**Avoid:**
- Flying text
- Spinning elements
- Sound effects
- Automatic animations (presenter controls timing)

### Animation Timing
```
Entrance: 300ms (fast enough to feel responsive)
Emphasis: 200ms (quick attention grab)
Exit: 200ms (get out of the way quickly)
```

---

## 📋 Slide-Specific Design Tips

### Title Slide (Slide 1)
```
Layout: Full-bleed background image (Ethiopian bus/highway)
Overlay: Teal gradient at 50% opacity
Logo: Top-left, white version
Title: Centered, 72pt, White, Bold
Subtitle: 32pt, White
Contact: Bottom-right, 20pt, White
```

### Data/ROI Slides (Slides 6-9)
```
Layout: Table or chart takes 60% of slide
Background: Clean white (no distractions)
Numbers: Large (40pt+), bold, teal
Context text: Smaller (24pt), gray
Emphasis: Green for gains, red for problems
```

### Comparison Tables (Slides 7, 13)
```
Layout: Full-width table
Header row: Teal gradient background
Checkmarks: Green (#10b981)
X marks: Red (#ef4444)
Warning symbols: Amber (#f59e0b)
```

### Closing/CTA Slide (Slide 14)
```
Layout: Centered content
Background: Subtle image at 20% opacity
CTA box: White card with teal border (4px)
Phone number: 48pt, teal, bold
Email: 28pt, gray
Button styling: Teal background, white text, rounded corners
```

---

## ✅ Pre-Presentation Checklist

### Design Quality Check
- [ ] All colors match brand palette (no random colors)
- [ ] Font sizes consistent across slides
- [ ] No text smaller than 20pt
- [ ] Tables have proper formatting (teal headers)
- [ ] Images are high resolution (no pixelation)
- [ ] Logo appears on every slide (or in footer)
- [ ] Page numbers on all slides except title
- [ ] Consistent margins (80px top, 100px sides)

### Content Quality Check
- [ ] No typos or grammatical errors
- [ ] Numbers match across slides (consistency)
- [ ] Contact info updated (phone, email, website)
- [ ] Company name placeholders replaced with real names
- [ ] Testimonials attributed to real people
- [ ] All claims backed by data
- [ ] CTAs are clear and actionable

### Technical Check
- [ ] Slides are 16:9 aspect ratio (widescreen)
- [ ] File size under 50MB (for easy sharing)
- [ ] PDF backup created
- [ ] Presenter notes added to each slide
- [ ] Animations work in presentation mode
- [ ] Videos embedded (not linked externally)
- [ ] Hyperlinks tested (if any)

---

## 🎤 Presenter Display Setup

### Dual-Screen Setup (Recommended)
**Presenter Screen:**
- Current slide (large)
- Next slide preview (small, top-right)
- Speaker notes (bottom 30%)
- Timer (top-left)

**Audience Screen:**
- Full slide view
- No notes visible
- Page numbers visible

### Single-Screen Presenting
- Print speaker notes as handout (1 page per slide)
- Keep notes on phone/tablet next to laptop
- Practice timing (don't read from screen)

---

## 📤 Export & Distribution

### File Formats

**PowerPoint (.pptx):**
- Best for: Editing, presenting on Windows
- Embed fonts (File → Options → Save → Embed fonts)
- Compress images (Picture Tools → Compress Pictures → 220ppi)

**PDF (.pdf):**
- Best for: Sharing, archiving, printing
- Export with notes (File → Export → Create PDF/XPS → Options → Publish notes pages)
- Optimize for screen (smaller file size)

**Google Slides:**
- Best for: Collaboration, cloud access
- Download as PowerPoint if offline presenting
- Share with "View only" link for prospects

**Video (.mp4):**
- Best for: Remote presentations, demos
- File → Export → Create video
- Use presenter view with narration

### File Naming Convention
```
i-Ticket-Presentation-[Company Name]-[Date].pptx

Examples:
i-Ticket-Presentation-Selam-Bus-2025-12-30.pptx
i-Ticket-Presentation-Generic-2025-12.pdf
```

---

## 🔧 Quick Conversion Tools

### From Markdown to PowerPoint:

**Method 1: Marp (Recommended)**
```bash
# Install Marp CLI
npm install -g @marp-team/marp-cli

# Convert to PowerPoint
marp i-Ticket-Presentation-Slides.md --pptx -o i-Ticket.pptx

# Convert to PDF
marp i-Ticket-Presentation-Slides.md --pdf -o i-Ticket.pdf

# Live preview
marp -p i-Ticket-Presentation-Slides.md
```

**Method 2: Pandoc**
```bash
# Install pandoc (pandoc.org)
# Convert to PowerPoint
pandoc i-Ticket-Presentation-Slides.md -o i-Ticket.pptx

# Convert to Google Slides (requires rclone)
pandoc i-Ticket-Presentation-Slides.md -o i-Ticket.gdoc
```

**Method 3: Manual Copy-Paste**
- Open PowerPoint/Google Slides
- Create blank presentation with brand colors
- Copy slide content from Markdown
- Format manually (more control, more time)

---

## 🎨 Sample Slide Mockups

### Title Slide Visual Description:
```
┌────────────────────────────────────────────────────┐
│ [i-Ticket Logo]                                    │
│                                                    │
│              i-TICKET                              │ ← 72pt, White, Bold
│                                                    │
│     Modern Ticketing for Ethiopian                │ ← 36pt, White
│          Bus Companies                             │
│                                                    │
│  Real-time Slot Management | TeleBirr             │ ← 24pt, White
│      Payments | Digital Verification              │
│                                                    │
│                                                    │
│                                                    │
│              [Phone] | [Email]                     │ ← 20pt, White
└────────────────────────────────────────────────────┘
Background: Ethiopian highway image with 50% teal overlay
```

### Data Table Visual Description:
```
┌────────────────────────────────────────────────────┐
│  Your Financial Impact: Real Numbers               │ ← 52pt, Teal
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                    │
│  ┌──────────┬────────┬────────┬────────────┐     │
│  │ Metric   │ BEFORE │ AFTER  │ Change     │     │ ← Teal gradient header
│  ├──────────┼────────┼────────┼────────────┤     │
│  │Occupancy │ 76%    │ 91%    │ +15% ✅    │     │ ← Alternating rows
│  │Revenue   │6,650ETB│8,050ETB│ +21% ✅    │     │   White / Light teal
│  │No-shows  │ 12%    │ 5%     │ -58% ✅    │     │
│  └──────────┴────────┴────────┴────────────┘     │
│                                                    │
│  Net Profit Increase: +30,250 ETB/month           │ ← 36pt, Teal, Bold
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Common Issues & Fixes:

**Issue: Colors look different on projector**
- Solution: Test on actual projector before presentation
- Fallback: Increase contrast (darker text, lighter backgrounds)

**Issue: Text too small to read from back of room**
- Solution: Minimum 24pt font size, bold important numbers
- Test: View slide from 15 feet away - can you read it?

**Issue: Animations not working**
- Solution: Save as .pptx (not .ppt), ensure "Play animations" enabled

**Issue: Images not showing**
- Solution: Embed images (don't link), compress file if too large

**Issue: Font looks different on other computer**
- Solution: Embed fonts OR use system fonts (Arial, Helvetica)

---

## 📞 Support & Resources

### Design Assets
- Logo files: Contact i-Ticket marketing team
- Stock photos: [unsplash.com](https://unsplash.com)
- Icons: [heroicons.com](https://heroicons.com)
- Fonts: Segoe UI (system) or Inter (Google Fonts)

### Tools
- Marp: [marp.app](https://marp.app) - Markdown to slides
- Canva: [canva.com](https://canva.com) - Easy slide design
- Color picker: [coolors.co](https://coolors.co) - Generate palettes

### Questions?
- Design questions: [design@i-ticket.et]
- Technical support: [support@i-ticket.et]

---

**Last Updated:** December 30, 2025
**Version:** 1.0
**Maintained by:** i-Ticket Marketing Team
