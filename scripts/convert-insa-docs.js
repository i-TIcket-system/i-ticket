#!/usr/bin/env node
/**
 * Convert INSA audit Markdown documents to a single branded PDF.
 * Uses md-to-pdf (Puppeteer/Chromium) + pikepdf compression.
 * i-Ticket theme with logo header, watermark, and branded footer.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'insa-audit');
const OUTPUT_DIR = path.join(DOCS_DIR, 'pdf');
const COMBINED_MD = path.join(OUTPUT_DIR, '_combined.md');
const RAW_PDF = path.join(OUTPUT_DIR, '_raw.pdf');
const COMBINED_PDF = path.join(OUTPUT_DIR, 'i-Ticket-INSA-Audit-Documentation.pdf');

const FILES = [
  '4.2.1a-Data-Flow-Diagram.md',
  '4.2.1b-System-Architecture-Diagram.md',
  '4.2.1c-Entity-Relationship-Diagram.md',
  '4.2.2-Features-of-Web-Application.md',
  '4.2.3-Testing-Scope.md',
  '4.2.4-Security-Functionality-Document.md',
  '4.2.5-Secure-Coding-Standards.md',
  '5.4.1-API-Request-Response-Samples.md',
  '5.4.2-API-Documentation.md',
  '5.4.3-API-Types.md',
  '5.4.4-API-Endpoints-and-Functionality.md',
  '5.4.5-Authentication-Mechanism.md',
  '5.4.6-Third-Party-Integrations.md',
  '5.4.7-Compliance-and-Regulatory-Requirements.md',
  '5.4.8-Authorization-and-Access-Control.md',
  '5.4.9-Test-Accounts.md',
  '6-Contact-Information.md',
];

// i-Ticket brand colors
const B = {
  tealDark: '#0d4f5c',
  tealBrand: '#1A9A8C',
  tealMid: '#0e9494',
  tealLight: '#20c4c4',
  tealPale: '#e8f7f6',
  ink: '#1a2a2d',
  inkLight: '#4a6a6e',
  inkMuted: '#7a9a9e',
};

/**
 * Parse filename into document number + title.
 * e.g. '4.2.1a-Data-Flow-Diagram.md' → { num: '4.2.1a', title: 'Data Flow Diagram' }
 */
function parseDocInfo(filename) {
  const base = filename.replace('.md', '');
  const match = base.match(/^([\d.]+[a-z]?)-(.+)$/);
  if (!match) return { num: base, title: base };
  const num = match[1];
  const title = match[2].replace(/-/g, ' ');
  return { num, title };
}

/**
 * Generate a section divider page using the working page-break class approach.
 * Divider content sits between two page-break divs.
 */
function makeDividerPage(docInfo) {
  return `
<div class="page-break"></div>

<div class="section-divider">
<div class="sd-logo"><svg width="60" height="60" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="${B.tealBrand}" stroke-width="48" fill="none"/><rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="${B.tealBrand}"/></svg></div>
<div class="sd-label">DOCUMENT</div>
<div class="sd-number">${docInfo.num}</div>
<div class="sd-line"></div>
<div class="sd-title">${docInfo.title}</div>
<div class="sd-subtitle">i-Ticket Platform — INSA Security Audit Documentation</div>
</div>

<div class="page-break"></div>

`;
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Combining ${FILES.length} documents into branded PDF...`);

  // 1. Combine all markdown files with divider pages between them
  let combined = '';
  for (let i = 0; i < FILES.length; i++) {
    const content = fs.readFileSync(path.join(DOCS_DIR, FILES[i]), 'utf-8');
    const docInfo = parseDocInfo(FILES[i]);

    // Page break between documents (no dividers here — added via pikepdf later)
    if (i > 0) combined += '\n\n<div class="page-break"></div>\n\n';
    combined += content;
  }

  // 2. Frontmatter with header/footer
  const frontmatter = `---
pdf_options:
  format: A4
  margin:
    top: "90px"
    bottom: "70px"
    left: "45px"
    right: "45px"
  displayHeaderFooter: true
  headerTemplate: |
    <div style="width:100%;display:flex;align-items:center;padding:8px 45px;border-bottom:2px solid ${B.tealBrand};font-family:Segoe UI,Calibri,Arial,sans-serif;">
      <svg width="22" height="22" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="${B.tealBrand}" stroke-width="48" fill="none"/><rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="${B.tealBrand}"/></svg>
      <span style="margin-left:8px;font-size:12px;font-weight:600;color:${B.tealDark};"><span style="color:${B.tealBrand}">i</span>-Ticket</span>
      <span style="margin-left:6px;font-size:6px;color:${B.inkMuted};letter-spacing:1.2px;text-transform:uppercase;">INSA Security Audit</span>
      <span style="flex:1"></span>
      <span style="font-size:7px;color:${B.inkMuted};">v2.14.0 | i-ticket.et | Feb 2026</span>
    </div>
  footerTemplate: |
    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:6px 45px;border-top:1.5px solid ${B.tealBrand};font-family:Segoe UI,Calibri,Arial,sans-serif;font-size:7px;color:${B.inkLight};">
      <span>Confidential — i-Ticket Platform</span>
      <span style="color:${B.tealDark};font-weight:600;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      <span>Prepared for INSA</span>
    </div>
  printBackground: true
stylesheet:
  - _styles.css
---

`;

  // 3. CSS — solid colors only (no gradients = smaller PDF)
  const css = `
.page-break {
  page-break-after: always;
  break-after: page;
  height: 0;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Calibri, Arial, sans-serif;
  font-size: 10.5px;
  line-height: 1.55;
  color: ${B.ink};
}

/* Watermark */
body::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 320px;
  background-image: url("data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="${B.tealBrand}" stroke-width="48" fill="none"/><rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="${B.tealBrand}"/></svg>`)}");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.035;
  z-index: -1;
  pointer-events: none;
}

h1 {
  font-size: 20px;
  font-weight: 700;
  color: ${B.tealDark};
  border-bottom: 3px solid ${B.tealBrand};
  padding-bottom: 6px;
  margin-top: 0;
  margin-bottom: 14px;
  page-break-after: avoid;
}
h2 {
  font-size: 14px;
  font-weight: 600;
  color: ${B.tealBrand};
  border-bottom: 1px solid ${B.tealPale};
  padding-bottom: 3px;
  margin-top: 24px;
  margin-bottom: 10px;
  page-break-after: avoid;
}
h3 {
  font-size: 12px;
  font-weight: 600;
  color: ${B.tealMid};
  margin-top: 18px;
  margin-bottom: 6px;
  page-break-after: avoid;
}
h4 {
  font-size: 11px;
  font-weight: 600;
  color: ${B.ink};
  margin-top: 12px;
  margin-bottom: 5px;
  page-break-after: avoid;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 12px 0;
  font-size: 9.5px;
  page-break-inside: auto;
}
tr { page-break-inside: avoid; }
th {
  background-color: ${B.tealDark};
  color: white;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 9px;
  letter-spacing: 0.2px;
  border: 1px solid ${B.tealDark};
}
td {
  padding: 4px 8px;
  border: 1px solid #dce8e7;
  vertical-align: top;
}
tr:nth-child(even) td {
  background-color: ${B.tealPale};
}

code {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 9px;
  background-color: ${B.tealPale};
  padding: 1px 4px;
  border-radius: 2px;
  color: ${B.tealDark};
}
pre {
  background-color: ${B.tealDark};
  color: #e0eeec;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 8.5px;
  line-height: 1.4;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  page-break-inside: avoid;
  border-left: 4px solid ${B.tealBrand};
  margin: 8px 0 12px 0;
}
pre code {
  background: none;
  padding: 0;
  color: #e0eeec;
}

hr {
  border: none;
  height: 2px;
  background-color: ${B.tealPale};
  margin: 20px 0;
}

blockquote {
  border-left: 3px solid ${B.tealBrand};
  margin: 10px 0;
  padding: 8px 14px;
  background-color: ${B.tealPale};
  color: ${B.tealDark};
  border-radius: 0 4px 4px 0;
}

ul, ol { padding-left: 22px; margin: 4px 0; }
li { margin-bottom: 2px; }
li::marker { color: ${B.tealBrand}; }

a { color: ${B.tealBrand}; text-decoration: none; }
strong { color: ${B.ink}; font-weight: 600; }
em { color: ${B.inkLight}; }
p { orphans: 3; widows: 3; margin-bottom: 6px; }

h1 + *, h2 + *, h3 + *, h4 + * { page-break-before: avoid; }

/* ===== SECTION DIVIDER PAGE ===== */
.section-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 180px 40px 40px 40px;
  page-break-inside: avoid;
}

.sd-logo {
  margin-bottom: 32px;
  opacity: 0.15;
}

.sd-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: ${B.tealBrand};
  margin-bottom: 12px;
}

.sd-number {
  font-size: 56px;
  font-weight: 700;
  color: ${B.tealDark};
  line-height: 1;
  margin-bottom: 20px;
}

.sd-line {
  width: 80px;
  height: 3px;
  background-color: ${B.tealBrand};
  margin: 0 auto 24px auto;
}

.sd-title {
  font-size: 22px;
  font-weight: 600;
  color: ${B.ink};
  line-height: 1.3;
  max-width: 420px;
  margin-bottom: 20px;
}

.sd-subtitle {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${B.inkMuted};
}
`;

  const cssPath = path.join(OUTPUT_DIR, '_styles.css');
  fs.writeFileSync(cssPath, css);
  fs.writeFileSync(COMBINED_MD, frontmatter + combined);

  console.log(`  Combined: ${(Buffer.byteLength(frontmatter + combined) / 1024).toFixed(0)} KB`);
  console.log('  Generating PDF...');

  // 4. Generate PDF
  try {
    execSync(`npx -y md-to-pdf "${COMBINED_MD}"`, {
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: OUTPUT_DIR,
    });

    const generatedPdf = COMBINED_MD.replace('.md', '.pdf');
    if (fs.existsSync(generatedPdf)) {
      fs.renameSync(generatedPdf, RAW_PDF);
      const rawSize = (fs.statSync(RAW_PDF).size / 1024 / 1024).toFixed(1);
      console.log(`  Raw PDF: ${rawSize} MB`);
    } else {
      throw new Error('PDF not generated');
    }
  } catch (e) {
    console.error(`  [FAIL] ${e.message}`);
    if (e.stderr) console.error(e.stderr.toString().substring(0, 500));
    process.exit(1);
  }

  // 5. Compress with pikepdf
  console.log('  Compressing with pikepdf...');
  try {
    execSync(`python -c "
import pikepdf
pdf = pikepdf.open(r'${RAW_PDF.replace(/\\/g, '\\\\')}')
pdf.save(r'${COMBINED_PDF.replace(/\\/g, '\\\\')}',
         linearize=True,
         compress_streams=True,
         stream_decode_level=pikepdf.StreamDecodeLevel.generalized,
         object_stream_mode=pikepdf.ObjectStreamMode.generate,
         recompress_flate=True)
pdf.close()
print('Compressed')
"`, { timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] });

    const finalSize = (fs.statSync(COMBINED_PDF).size / 1024 / 1024).toFixed(1);
    console.log(`\n  [OK] i-Ticket-INSA-Audit-Documentation.pdf (${finalSize} MB)`);
  } catch (e) {
    // If compression fails, just use raw
    console.log('  Compression failed, using raw PDF');
    fs.copyFileSync(RAW_PDF, COMBINED_PDF);
    const finalSize = (fs.statSync(COMBINED_PDF).size / 1024 / 1024).toFixed(1);
    console.log(`\n  [OK] i-Ticket-INSA-Audit-Documentation.pdf (${finalSize} MB)`);
  }

  // 6. Cleanup
  try { fs.unlinkSync(COMBINED_MD); } catch {}
  try { fs.unlinkSync(cssPath); } catch {}
  try { fs.unlinkSync(RAW_PDF); } catch {}

  console.log(`\nOutput: ${COMBINED_PDF}`);
  console.log('You can add your front page to the beginning of this PDF.');
}

main();
