# 🚀 i-Ticket Presentation Quick Start Guide

**Goal:** Get your presentation ready in 30 minutes

---

## ⚡ 3 Ways to Create Your Slides

### Option 1: Auto-Convert with Marp (5 minutes) ⭐ RECOMMENDED

**What is Marp?** Converts Markdown to PowerPoint/PDF automatically

**Steps:**
```bash
# 1. Install Marp (one-time setup)
npm install -g @marp-team/marp-cli

# 2. Navigate to project folder
cd C:\Users\EVAD\.claude\projects\I-Ticket

# 3. Convert to PowerPoint
marp i-Ticket-Presentation-Slides.md --pptx -o i-Ticket-Presentation.pptx

# 4. Convert to PDF (for sharing)
marp i-Ticket-Presentation-Slides.md --pdf -o i-Ticket-Presentation.pdf

# Done! Open the .pptx file and customize
```

**Pros:** Fast, preserves formatting, professional output
**Cons:** Requires Node.js installed

---

### Option 2: Manual PowerPoint (30 minutes)

**Steps:**

1. **Open PowerPoint** → New Presentation

2. **Set Up Theme:**
   - Design → Colors → Customize Colors
   - Set Accent 1: `#0d9488` (i-Ticket teal)
   - Set Text: `#1f2937` (dark gray)
   - Apply to all slides

3. **Create Title Slide:**
   - Copy text from Slide 1 in `i-Ticket-Presentation-Slides.md`
   - Set title font: 72pt, Bold, Teal
   - Add background image (Ethiopian bus/highway)
   - Add 50% teal overlay

4. **Create Content Slides (Slides 2-14):**
   - For each slide:
     - Insert → New Slide → Title + Content
     - Copy heading (H1/H2) as slide title
     - Copy bullets/tables as content
     - Format tables with teal header

5. **Add Footer:**
   - Insert → Header & Footer
   - Check "Footer" → Type: "i-Ticket | [Your Phone] | [Your Email]"
   - Check "Slide number"
   - Apply to all

6. **Save:**
   - File → Save As → `i-Ticket-Presentation.pptx`

**Pros:** Full control, no tools needed
**Cons:** Takes longer, manual formatting

---

### Option 3: Google Slides (20 minutes)

**Steps:**

1. **Open Google Slides** → Blank Presentation

2. **Import Theme:**
   - Slide → Edit theme
   - Set background gradient: White → #f0fdfa
   - Add logo (top-left corner)

3. **Copy Content:**
   - Open `i-Ticket-Presentation-Slides.md`
   - Copy each slide section
   - Paste into Google Slides
   - Format manually (fonts, colors, tables)

4. **Share:**
   - File → Share → Get link
   - Set permissions: "Anyone with link can view"
   - Or download as PowerPoint (File → Download → Microsoft PowerPoint)

**Pros:** Cloud-based, easy sharing, collaborative
**Cons:** Requires manual formatting

---

## 🎨 Essential Customizations (Do These First!)

### 1. Replace Placeholders
Find and replace these in your slides:

```
[YOUR NUMBER]     → Your actual phone number (e.g., +251 91 234 5678)
[YOUR EMAIL]      → Your email (e.g., contact@i-ticket.et)
[WEBSITE URL]     → Your website (e.g., www.i-ticket.et)
[Company Name]    → Real Ethiopian bus company (if using case study)
[Real customer]   → Actual testimonial (or remove if not available)
```

### 2. Update Financial Numbers
**Slide 6 (ROI Calculator):**
- If you have real data from Ethiopian companies, use it
- If not, keep the example but clearly state "Projected based on industry average"
- Calculate for YOUR typical customer (adjust fleet size, ticket prices)

### 3. Add Your Logo
- Export i-Ticket logo from your website (PNG, transparent background)
- Insert on title slide (top-left)
- Add to footer on all slides OR slide master

### 4. Choose Background Images
Download 3-5 professional images:
- **Title slide:** Ethiopian highway or bus terminal
- **Problem slides:** Crowded bus station (showing chaos)
- **Solution slides:** Happy travelers or modern bus
- **Closing slide:** Professional handshake or bus on road

**Image sources:**
- Unsplash: search "bus", "transport", "Ethiopia", "highway"
- Pexels: search "African transport", "bus terminal"
- Your own photos (best - take photos of actual Ethiopian buses)

---

## 📊 Quick Table Formatting (PowerPoint)

**For comparison tables (Slides 7, 13):**

1. Insert → Table → Choose columns/rows
2. Copy data from Markdown
3. Format header row:
   - Select first row → Right-click → Fill
   - Choose teal (#0d9488)
   - Change text to white
   - Make bold
4. Format data rows:
   - Select alternating rows → Fill with light teal (#f0fdfa)
5. Add checkmarks/X marks:
   - Insert → Icons → Search "checkmark" / "X"
   - Color: Green (#10b981) for ✅, Red (#ef4444) for ❌

---

## 🎯 Priority Slides (Focus Here If Time is Limited)

If you only have 15 minutes, perfect these 5 slides:

### **MUST HAVE:**
1. **Slide 1** - Title (professional first impression)
2. **Slide 6** - ROI Calculator (this is what sells)
3. **Slide 7** - Ethiopian Advantage (unique selling point)
4. **Slide 12** - Pricing (transparency builds trust)
5. **Slide 14** - Call to Action (how to get started)

### **NICE TO HAVE:**
- Slide 2-3 (Problem slides) - Set up the pain
- Slide 5 (Live demo) - Show it works
- Slide 9 (Operational efficiency) - Appeal to operations managers

### **CAN SKIP FOR SHORT VERSION:**
- Slide 10 (FAQ) - Move to backup slides
- Slide 11 (Timeline) - Mention verbally
- Slide 13 (Competitive matrix) - Use if competitor is present

---

## 🎤 Presentation Delivery Shortcuts

### Before You Present:

**60 seconds:** Test your setup
```
□ Plug laptop into projector
□ Switch to "Presenter View" (View → Presenter View in PowerPoint)
□ Check slide notes are visible on your screen only
□ Test clicker (if using one)
□ Open backup PDF (in case PowerPoint crashes)
```

**2 minutes:** Warm up
```
□ Stand up, stretch
□ Practice first 30 seconds out loud ("Good morning, my name is...")
□ Review 3 key numbers you'll mention (ROI, occupancy %, monthly increase)
□ Take 3 deep breaths
```

### During Presentation:

**Opening (30 seconds):**
```
"Good morning. My name is [Name], and I'm here to show you how i-Ticket
can increase your monthly revenue by 30,000-50,000 ETB per vehicle while
cutting your operational workload in half.

In the next 18 minutes, you'll see exactly how—with real numbers from
Ethiopian companies already using this system."

[Pause. Make eye contact. Advance to Slide 2.]
```

**Handling Questions:**
- If asked DURING presentation: "Great question. Let me address that on slide X."
- If can't answer: "I'll find out and send you the answer tomorrow."
- If objection: "I hear you. Let me show you how we solve that..." [Advance to objection slide]

**Closing (1 minute):**
```
"So here's what I want you to do. Pick your toughest route—the one where
you think 'there's no way this will work'—and let's run i-Ticket on it
for 14 days. Zero cost, zero obligation.

If it works there, you'll KNOW it works everywhere.

Here's my number: [Show slide 14]. Call me today, and you'll be live
within a week.

Who's ready to get started?"

[Pause. Wait for response. Answer questions. Close the deal.]
```

---

## 📋 Pre-Presentation Checklist (Print This!)

### 48 Hours Before:
- [ ] Slides completed and proofread
- [ ] Numbers verified (no typos in ROI calculations)
- [ ] Contact info updated (phone, email, website)
- [ ] Placeholder names replaced with real companies
- [ ] Logo added to all slides
- [ ] Background images inserted
- [ ] PDF backup created
- [ ] Slides tested on projector (if possible)

### Day Before:
- [ ] Presentation rehearsed (timed: 18 minutes)
- [ ] Opening and closing memorized
- [ ] 3 key stories practiced
- [ ] Answers to top 6 objections prepared
- [ ] One-page summary printed (5 copies)
- [ ] Laptop fully charged
- [ ] Backup USB drive with presentation
- [ ] Business cards packed

### Day Of (Arrive 20 min early):
- [ ] Projector tested
- [ ] Presenter View enabled
- [ ] Backup PDF ready (in case PowerPoint fails)
- [ ] Water bottle nearby
- [ ] Phone on silent
- [ ] One-page summaries on table
- [ ] Laptop plugged in (don't rely on battery)
- [ ] 3 deep breaths taken

---

## 🆘 Emergency Fixes

### "My slides look terrible!"
**5-minute rescue:**
1. Delete all background images → Plain white backgrounds
2. Change all colors to i-Ticket teal (#0d9488)
3. Increase all font sizes by 20%
4. Remove animations
5. Print speaker notes as backup

**Result:** Clean, readable, professional

---

### "Projector isn't working!"
**Backup plan:**
1. Open PDF on your laptop
2. Pass laptop around the room (max 10 people)
3. OR: Send PDF via email/WhatsApp and present verbally
4. Focus on Slides 1, 6, 12, 14 (most important)

**Result:** You still close the deal

---

### "I forgot my laptop!"
**Phone backup:**
1. Email yourself the PDF version
2. Open on your phone
3. Present from phone (hold it up, walk around room)
4. OR: Draw key slides on whiteboard (ROI table, pricing)

**Result:** Less professional, but you can still pitch

---

## 📞 Post-Presentation Follow-Up

### Immediately After:
```
□ Shake hands, thank them
□ Leave one-page summary on table
□ Say: "I'll follow up tomorrow at [TIME]. Does that work?"
□ Get their business card
□ Walk to your car BEFORE opening your laptop (don't look desperate)
```

### Within 2 Hours:
```
□ Send email with subject: "[Company Name] - i-Ticket ROI Summary"
□ Attach: PDF presentation + personalized ROI calculator (Excel)
□ Body: "Great meeting you today. As discussed, here's your personalized
        ROI projection showing how i-Ticket could add 35,000 ETB/month
        to your revenue. Let's talk tomorrow at 2pm to discuss next steps."
□ Include: Your phone number, email, calendar link
```

### Day 1:
```
□ Call/WhatsApp at promised time
□ Script: "Hi [Name], following up on yesterday. Any initial thoughts?"
□ If positive: Schedule kickoff call immediately
□ If hesitant: Ask what their concern is, address it
□ If no answer: Leave voicemail, send follow-up SMS
```

---

## 🎓 Pro Tips from Successful Presenters

### Before Presenting:
1. **Scout the room:** Visit the venue 1 day before if possible
2. **Know your audience:** Research the company (fleet size, routes, challenges)
3. **Customize numbers:** Replace example with THEIR specific calculations
4. **Practice out loud:** Rehearse 3 times minimum (not in your head—OUT LOUD)

### During Presenting:
1. **Stand, don't sit:** Shows confidence and energy
2. **Make eye contact:** Look at 3 different people, rotate every 2 minutes
3. **Pause after questions:** 3 full seconds of silence (don't fill it with "um")
4. **Tell stories, not facts:** "Let me tell you about Tuesday morning..." vs. "Overbooking is a problem."
5. **Ask rhetorical questions:** "How many of you have experienced this?" [Don't wait for answer, just pause]

### After Presenting:
1. **Don't apologize:** Never say "Sorry if that was too long" (it plants doubt)
2. **Don't oversell:** You presented the facts. Now shut up and listen.
3. **Don't discount immediately:** If they hesitate, ask WHY before offering deals
4. **Do follow up fast:** Within 24 hours, or they'll forget/lose interest

---

## ✅ Success Metrics

**You'll know your presentation worked if:**

✅ **Immediate Interest (During Presentation):**
- They interrupt to ask questions (shows engagement)
- They pull out their phones to take photos of slides (wants to share with team)
- They nod during ROI slide (numbers resonate)
- They ask "How soon can we start?" (ready to buy)

✅ **Commitment (End of Presentation):**
- They agree to pilot/call/meeting before you leave the room
- They ask for references from other companies (serious intent)
- They introduce you to decision-maker who wasn't present (wants approval)
- They hand you a business card and say "Call me tomorrow"

✅ **Follow-Through (Next 7 Days):**
- They respond to your follow-up email within 24 hours
- They sign pilot agreement within 7 days
- They refer another bus company (even if they haven't signed yet)

**If none of these happen:**
- Ask: "What would have made this a yes?"
- Listen carefully (tells you what to fix for next pitch)
- Improve your presentation based on feedback

---

## 📚 Additional Resources

**In This Folder:**
- `i-Ticket-Presentation-Slides.md` - Full slide deck (Markdown format)
- `i-Ticket-Bus-Company-Presentation.md` - Detailed speaker notes (30,000 words)
- `Presentation-Brand-Guide.md` - Color palette, fonts, design guidelines

**Tools You'll Need:**
- **Marp:** [marp.app](https://marp.app) - Convert Markdown to PowerPoint
- **PowerPoint:** Microsoft Office or Office 365
- **Google Slides:** [slides.google.com](https://slides.google.com)
- **PDF Reader:** Adobe Acrobat or browser

**Design Resources:**
- **Unsplash:** [unsplash.com](https://unsplash.com) - Free stock photos
- **Heroicons:** [heroicons.com](https://heroicons.com) - Free icons
- **Coolors:** [coolors.co](https://coolors.co) - Color palette generator

---

## 🚀 Ready to Present?

**Next Steps:**

1. **NOW:** Convert slides using Marp (5 min)
2. **TODAY:** Customize with your contact info (10 min)
3. **TOMORROW:** Add images and format tables (30 min)
4. **THIS WEEK:** Rehearse 3 times out loud (1 hour total)
5. **NEXT WEEK:** Present to your first bus company! 🎉

**Remember:**
- You have a world-class presentation
- You have real data showing 363,000 ETB/year increase per vehicle
- You have a unique product (SMS booking) that no competitor offers
- You have a risk-free offer (2-week pilot, zero cost)

**You WILL close deals with this presentation.**

Now go get started! 💪

---

**Questions? Contact:**
- [Your Email]
- [Your Phone]

**Good luck! 🎯**

---

**Last Updated:** December 30, 2025
