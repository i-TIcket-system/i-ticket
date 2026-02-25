#!/usr/bin/env python3
"""
Generate ICAER-2026-E391DA Resubmission PDF with i-Ticket teal theme.
Uses Python-markdown for MD→HTML conversion, then puppeteer for HTML→PDF.

Usage:
    python scripts/generate-insa-resubmission-pdf.py
"""

import json
import os
import subprocess
import sys
import tempfile

import markdown

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
MD_FILE = os.path.join(ROOT, "docs", "insa-audit", "ICAER-2026-E391DA-Resubmission.md")
OUTPUT_DIR = os.path.join(ROOT, "docs", "insa-audit", "pdf")
HTML_FILE = os.path.join(OUTPUT_DIR, "ICAER-2026-E391DA-Resubmission.html")
PDF_FILE = os.path.join(OUTPUT_DIR, "ICAER-2026-E391DA-Resubmission.pdf")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. Convert Markdown → HTML
# ---------------------------------------------------------------------------
print("Reading markdown...")
with open(MD_FILE, "r", encoding="utf-8") as f:
    md_text = f.read()

# Skip cover metadata (H1, H2, metadata table, TOC) — already shown on cover page
if '## 1. Application Overview' in md_text:
    md_text = '## 1. Application Overview' + md_text.split('## 1. Application Overview', 1)[1]

html_body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "toc"],
    extension_configs={"toc": {"toc_depth": "2-3"}},
)

# ---------------------------------------------------------------------------
# 2. CSS — i-Ticket teal theme
# ---------------------------------------------------------------------------
CSS = """
:root {
  --teal-dark:  #0d4f5c;
  --teal-brand: #1A9A8C;
  --teal-mid:   #0e9494;
  --teal-light: #20c4c4;
  --teal-pale:  #e8f7f6;
  --ink:        #1a2a2d;
  --ink-light:  #4a6a6e;
  --ink-muted:  #7a9a9e;
  --paper:      #ffffff;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 10pt;
  line-height: 1.6;
  color: var(--ink);
  background: white;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ─── COVER PAGE ─────────────────────────────────────────────────── */
.cover-page {
  position: relative;
  width: 100%;
  height: 243mm;          /* content area = 297mm − 38px hdr − 38px ftr − 14mm − 16mm = 247mm; −4mm buffer */
  overflow: hidden;
  page-break-after: always;
  background: white;
}

/* Dark angled top block */
.cv-top {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 46%;
  background: var(--teal-dark);
  clip-path: polygon(0% 0%, 100% 0%, 100% 82%, 0% 100%);
}
/* Thin teal accent at the angle line */
.cv-angle {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 47.6%;
  clip-path: polygon(0% 97%, 100% 79.5%, 100% 82%, 0% 100%);
  background: var(--teal-brand);
}

/* Left accent stripes */
.cv-stripes {
  position: absolute; top: 0; left: 0;
  height: 100%; display: flex; flex-direction: row; gap: 3px; z-index: 10;
}
.cv-stripes .s { width: 6px; height: 100%; }
.cv-stripes .s:nth-child(1) { background: var(--teal-dark); }
.cv-stripes .s:nth-child(2) { background: var(--teal-brand); }

/* Large watermark (dark area) */
.cv-wm-lg {
  position: absolute; top: 1%; right: -4%;
  width: 320px; height: 320px;
  opacity: 0.07; z-index: 4; pointer-events: none;
}
/* Small watermark (white area) */
.cv-wm-sm {
  position: absolute; top: 62%; left: 50%;
  transform: translate(-50%, -50%);
  width: 180px; height: 180px;
  opacity: 0.035; z-index: 1; pointer-events: none;
}
.cv-wm-lg svg, .cv-wm-sm svg { width: 100%; height: 100%; }

/* Brand / logo */
.cv-brand {
  position: absolute; top: 26px; left: 44px;
  display: flex; align-items: center; gap: 12px; z-index: 5;
}
.cv-brand-name {
  font-size: 30px; font-weight: 700;
  color: white; letter-spacing: -0.5px; line-height: 1;
}
.cv-brand-name span { color: var(--teal-light); }
.cv-brand-tagline {
  font-size: 7px; color: rgba(255,255,255,0.42);
  letter-spacing: 3px; text-transform: uppercase; margin-top: 5px;
}

/* Document title */
.cv-title-block {
  position: absolute; top: 100px; left: 58px; right: 58px; z-index: 5;
}
.cv-badge {
  display: inline-block;
  background: rgba(26,154,140,0.22);
  color: var(--teal-light);
  font-size: 7.5px; font-weight: 600;
  letter-spacing: 2.8px; text-transform: uppercase;
  padding: 5px 13px; border-radius: 4px;
  border: 1px solid rgba(26,154,140,0.28);
  margin-bottom: 16px;
}
.cv-title {
  font-size: 28px; font-weight: 700;
  color: white; line-height: 1.2; letter-spacing: -0.4px; margin-bottom: 12px;
}
.cv-subtitle {
  font-size: 12.5px; color: rgba(255,255,255,0.52); line-height: 1.55;
}

/* Divider */
.cv-divider {
  position: absolute; top: 63.5%; left: 58px; right: 58px;
  height: 1px;
  background: linear-gradient(to right, var(--teal-brand), var(--teal-pale), transparent);
  z-index: 5;
}

/* Prepared for */
.cv-prepared {
  position: absolute; top: 52%; left: 58px; right: 58px; z-index: 5;
}
.cv-prepared-label {
  font-size: 7.5px; font-weight: 600; color: var(--teal-brand);
  letter-spacing: 3px; text-transform: uppercase; margin-bottom: 9px;
}
.cv-prepared-org {
  font-size: 20px; font-weight: 700; color: var(--ink); line-height: 1.3; margin-bottom: 4px;
}
.cv-prepared-dept { font-size: 13px; color: var(--ink-light); }

/* Details grid */
.cv-details {
  position: absolute; top: 68%; left: 58px; right: 58px; z-index: 5;
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px 40px;
}
.cv-d-label {
  font-size: 7px; font-weight: 600; color: var(--teal-brand);
  letter-spacing: 2px; text-transform: uppercase; margin-bottom: 3px;
}
.cv-d-value { font-size: 11.5px; font-weight: 500; color: var(--ink); line-height: 1.4; }
.cv-d-value.url { color: var(--teal-mid); }

/* Confidential notice */
.cv-confidential {
  position: absolute; top: 86%; left: 58px; right: 58px; z-index: 5;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px;
  background: var(--teal-pale); border-radius: 6px;
  border-left: 4px solid var(--teal-brand);
}
.cv-conf-text { font-size: 7.5px; color: var(--ink-light); line-height: 1.55; }
.cv-conf-text strong { color: var(--teal-dark); font-weight: 600; }

/* Decorative dots */
.cv-dots {
  position: absolute; bottom: 24px; right: 48px; z-index: 4;
  display: grid; grid-template-columns: repeat(5, 6px); gap: 7px;
}
.cv-dots .dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--teal-pale);
}
.cv-dots .dot:nth-child(3n) { background: var(--teal-brand); opacity: 0.3; }

/* ─── CONTENT PAGES ──────────────────────────────────────────────── */
.content {
  padding-top: 4mm;
}

/* Headings */
h1 {
  font-size: 17pt; font-weight: 700; color: var(--teal-dark);
  border-bottom: 2.5px solid var(--teal-brand);
  padding-bottom: 7px; margin-top: 28px; margin-bottom: 14px;
  page-break-after: avoid;
}
h1:first-child { margin-top: 0; }

h2 {
  font-size: 13pt; font-weight: 600; color: var(--teal-dark);
  border-bottom: 1.5px solid var(--teal-pale);
  padding-bottom: 5px; padding-left: 12px;
  margin-top: 26px; margin-bottom: 11px;
  position: relative;
  page-break-after: avoid;
}
h2::before {
  content: '';
  position: absolute; left: 0; top: 3px;
  width: 4px; height: 16px; background: var(--teal-brand); border-radius: 2px;
}

h3 {
  font-size: 11pt; font-weight: 600; color: var(--teal-mid);
  margin-top: 20px; margin-bottom: 9px;
  page-break-after: avoid;
}

h4 {
  font-size: 10pt; font-weight: 600; color: var(--ink);
  margin-top: 15px; margin-bottom: 7px;
  page-break-after: avoid;
}

/* Tables */
table {
  width: 100%; border-collapse: collapse;
  margin: 13px 0; font-size: 8.5pt; page-break-inside: auto;
}
th {
  background: var(--teal-dark); color: white;
  padding: 7px 10px; text-align: left;
  font-weight: 600; font-size: 8pt; letter-spacing: 0.2px;
}
td {
  padding: 5.5px 10px;
  border-bottom: 1px solid #dde8ea;
  border-right: 1px solid #f2f7f7;
  vertical-align: top; font-size: 8.5pt;
}
tr { page-break-inside: avoid; }
tr:nth-child(even) td { background: var(--teal-pale); }
tr:nth-child(odd) td  { background: white; }
/* Bold first cell in label-value tables */
td:first-child { font-weight: 500; color: var(--ink); }

/* Code */
code {
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 8pt;
  background: var(--teal-pale); color: var(--teal-dark);
  padding: 1px 5px; border-radius: 3px;
}
pre {
  background: #0d1117; color: #c9d1d9;
  padding: 12px 14px; border-radius: 6px;
  font-size: 7pt; line-height: 1.45;
  overflow-wrap: break-word; white-space: pre-wrap;
  page-break-inside: avoid;
  border-left: 3px solid var(--teal-brand);
  margin: 11px 0;
}
pre code { background: none; padding: 0; color: #c9d1d9; font-size: 7pt; }

/* Other */
p { margin-bottom: 9px; }
ul, ol { padding-left: 20px; margin-bottom: 9px; }
li { margin-bottom: 3px; }
strong { color: var(--ink); }
hr { border: none; border-top: 2px solid var(--teal-pale); margin: 18px 0; }
a { color: var(--teal-mid); text-decoration: none; }
blockquote {
  border-left: 4px solid var(--teal-brand);
  margin: 11px 0; padding: 8px 14px;
  background: var(--teal-pale); color: var(--ink-light);
  border-radius: 0 4px 4px 0;
}

/* Table of contents (generated by toc extension) */
.toc { background: var(--teal-pale); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; }
.toc ul { margin: 0; padding-left: 16px; }
.toc li { margin-bottom: 2px; font-size: 9pt; }
.toc a { color: var(--teal-dark); }

/* Print */
@media print {
  html, body { background: white; }
  @page { size: A4; margin: 14mm 20mm 16mm 20mm; }
  h1, h2, h3, h4 { page-break-after: avoid; }
  pre, table, blockquote { page-break-inside: avoid; }
  p { orphans: 3; widows: 3; }
}
"""

# ---------------------------------------------------------------------------
# 3. Cover page HTML
# ---------------------------------------------------------------------------
LOGO_SVG_WHITE = """<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="white" stroke-width="48" fill="none"/>
  <rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="white"/>
</svg>"""

LOGO_SVG_TEAL = """<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="#1A9A8C" stroke-width="48" fill="none"/>
  <rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="#1A9A8C"/>
</svg>"""

LOCK_SVG = """<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A9A8C"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0110 0v4"/>
</svg>"""

COVER_HTML = f"""
<div class="cover-page">
  <div class="cv-stripes"><div class="s"></div><div class="s"></div></div>
  <div class="cv-top"></div>
  <div class="cv-angle"></div>

  <div class="cv-wm-lg">{LOGO_SVG_WHITE}</div>
  <div class="cv-wm-sm">{LOGO_SVG_TEAL}</div>

  <!-- Brand header -->
  <div class="cv-brand">
    <svg width="42" height="42" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="#1A9A8C" stroke-width="48" fill="none"/>
      <rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="#1A9A8C"/>
    </svg>
    <div>
      <div class="cv-brand-name"><span>i</span>-Ticket</div>
      <div class="cv-brand-tagline">Your Journey, Simplified</div>
    </div>
  </div>

  <!-- Document title -->
  <div class="cv-title-block">
    <div class="cv-badge">Security Audit &mdash; Technical Resubmission</div>
    <div class="cv-title">Web Application<br>Security Assessment</div>
    <div class="cv-subtitle">
      Consolidated technical resubmission for INSA cybersecurity compliance audit<br>
      Request ID: ICAER-2026-E391DA &nbsp;&bull;&nbsp; February 2026
    </div>
  </div>

  <div class="cv-divider"></div>

  <!-- Prepared for -->
  <div class="cv-prepared">
    <div class="cv-prepared-label">Prepared For</div>
    <div class="cv-prepared-org">Information Network Security<br>Administration (INSA)</div>
    <div class="cv-prepared-dept">Cyber Security Audit Division</div>
  </div>

  <!-- Details grid -->
  <div class="cv-details">
    <div>
      <div class="cv-d-label">Application</div>
      <div class="cv-d-value">i-Ticket Online Bus Ticketing Platform</div>
    </div>
    <div>
      <div class="cv-d-label">Version</div>
      <div class="cv-d-value">v2.14.5</div>
    </div>
    <div>
      <div class="cv-d-label">Production URL</div>
      <div class="cv-d-value url">https://i-ticket.et</div>
    </div>
    <div>
      <div class="cv-d-label">Submission Date</div>
      <div class="cv-d-value">February 2026</div>
    </div>
    <div>
      <div class="cv-d-label">Request ID</div>
      <div class="cv-d-value">ICAER-2026-E391DA</div>
    </div>
    <div>
      <div class="cv-d-label">Classification</div>
      <div class="cv-d-value">Confidential</div>
    </div>
  </div>

  <!-- Confidential badge -->
  <div class="cv-confidential">
    {LOCK_SVG}
    <div class="cv-conf-text">
      <strong>Confidential &mdash; INSA Audit Use Only.</strong> This document contains proprietary
      security architecture details, API endpoint maps, authentication mechanisms, and system configuration
      for the i-Ticket platform. Distribution is restricted to authorized INSA audit personnel only.
    </div>
  </div>

  <!-- Decorative dots -->
  <div class="cv-dots">
    {'<div class="dot"></div>' * 15}
  </div>
</div>
"""

# ---------------------------------------------------------------------------
# 4. Build full HTML document
# ---------------------------------------------------------------------------
FULL_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>i-Ticket INSA Audit — ICAER-2026-E391DA</title>
  <style>{CSS}</style>
</head>
<body>
{COVER_HTML}
<div class="content">
{html_body}
</div>
</body>
</html>"""

# Write HTML file
with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(FULL_HTML)
print(f"HTML written: {os.path.relpath(HTML_FILE, ROOT)}")

# ---------------------------------------------------------------------------
# 5. Puppeteer script to render HTML → PDF
# ---------------------------------------------------------------------------
html_url = "file:///" + HTML_FILE.replace("\\", "/")

PUPPETEER_JS = f"""
const puppeteer = require('puppeteer');

(async () => {{
  const browser = await puppeteer.launch({{
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }});
  const page = await browser.newPage();

  await page.goto({json.dumps(html_url)}, {{ waitUntil: 'networkidle0', timeout: 30000 }});

  // Small branded header: logo + doc ref | "CONFIDENTIAL" center | page N of M
  const headerTemplate = `
    <div style="
      width: 100%; padding: 4px 20mm 0;
      display: flex; justify-content: space-between; align-items: center;
      font-family: 'Segoe UI', sans-serif; font-size: 7.5px;
      border-bottom: 1px solid #e8f7f6;
      color: #4a6a6e;
    ">
      <div style="display:flex;align-items:center;gap:7px;">
        <svg width="12" height="12" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="#1A9A8C" stroke-width="48" fill="none"/>
          <rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="#1A9A8C"/>
        </svg>
        <span style="font-weight:700;color:#0d4f5c;letter-spacing:-0.2px;">i-Ticket</span>
        <span style="color:#b0c8cc;">|</span>
        <span>Web Application Security Assessment</span>
      </div>
      <span style="color:#1A9A8C;font-weight:600;letter-spacing:0.3px;">ICAER-2026-E391DA</span>
    </div>`;

  const footerTemplate = `
    <div style="
      width: 100%; padding: 0 20mm 4px;
      display: flex; justify-content: space-between; align-items: center;
      font-family: 'Segoe UI', sans-serif; font-size: 7.5px;
      border-top: 1px solid #e8f7f6;
      color: #7a9a9e;
    ">
      <span>i-ticket.et &nbsp;&bull;&nbsp; +251 911 550 001</span>
      <span style="color:#1A9A8C;font-weight:600;letter-spacing:0.5px;">CONFIDENTIAL</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;

  await page.pdf({{
    path: {json.dumps(PDF_FILE)},
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {{
      top:    '38px',
      bottom: '38px',
      left:   '0',
      right:  '0',
    }},
  }});

  await browser.close();
  console.log('PDF generated successfully.');
}})().catch(err => {{ console.error(err); process.exit(1); }});
"""

# Write to temp file and run
with tempfile.NamedTemporaryFile(
    mode="w", suffix=".cjs", delete=False, encoding="utf-8", dir=ROOT
) as tmp:
    tmp.write(PUPPETEER_JS)
    pjs = tmp.name

print("Rendering PDF with puppeteer...")
try:
    result = subprocess.run(
        ["node", pjs],
        capture_output=True,
        text=True,
        cwd=ROOT,
        timeout=60,
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        print("STDERR:", result.stderr)
        sys.exit(1)
finally:
    os.unlink(pjs)

size_kb = os.path.getsize(PDF_FILE) / 1024
print(f"\nDone!")
print(f"  PDF  : {os.path.relpath(PDF_FILE, ROOT)}  ({size_kb:.0f} KB)")
print(f"  HTML : {os.path.relpath(HTML_FILE, ROOT)}")
