#!/usr/bin/env node
/**
 * Build the complete INSA audit PDF with section divider pages.
 *
 * 1. Generate each document as individual PDF (md-to-pdf)
 * 2. Generate all divider pages as one PDF (Puppeteer)
 * 3. Generate cover page PDF (Puppeteer)
 * 4. Concatenate: cover + divider1 + doc1 + divider2 + doc2 + ... (pikepdf)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'insa-audit');
const PDF_DIR = path.join(DOCS_DIR, 'pdf');
const FINAL_PDF = path.join(PDF_DIR, 'i-Ticket-INSA-Audit-Documentation.pdf');
const DIVIDERS_PDF = path.join(PDF_DIR, '_dividers.pdf');
const COVER_HTML = path.join(PDF_DIR, 'cover-page.html');
const COVER_PDF = path.join(PDF_DIR, '_cover.pdf');

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

function parseDocInfo(filename) {
  const base = filename.replace('.md', '');
  const match = base.match(/^([\d.]+[a-z]?)-(.+)$/);
  if (!match) return { num: base, title: base };
  return { num: match[1], title: match[2].replace(/-/g, ' ') };
}

// Same CSS used in convert-insa-docs.js for consistent styling
function getStylesheet() {
  return `
.page-break { page-break-after: always; break-after: page; height: 0; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10.5px; line-height: 1.55; color: ${B.ink}; }
body::before {
  content: ''; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 320px; height: 320px;
  background-image: url("data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="${B.tealBrand}" stroke-width="48" fill="none"/><rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="${B.tealBrand}"/></svg>`)}");
  background-size: contain; background-repeat: no-repeat; background-position: center;
  opacity: 0.035; z-index: -1; pointer-events: none;
}
h1 { font-size: 20px; font-weight: 700; color: ${B.tealDark}; border-bottom: 3px solid ${B.tealBrand}; padding-bottom: 6px; margin-top: 0; margin-bottom: 14px; page-break-after: avoid; }
h2 { font-size: 14px; font-weight: 600; color: ${B.tealBrand}; border-bottom: 1px solid ${B.tealPale}; padding-bottom: 3px; margin-top: 24px; margin-bottom: 10px; page-break-after: avoid; }
h3 { font-size: 12px; font-weight: 600; color: ${B.tealMid}; margin-top: 18px; margin-bottom: 6px; page-break-after: avoid; }
h4 { font-size: 11px; font-weight: 600; color: ${B.ink}; margin-top: 12px; margin-bottom: 5px; page-break-after: avoid; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 9.5px; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background-color: ${B.tealDark}; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 9px; letter-spacing: 0.2px; border: 1px solid ${B.tealDark}; }
td { padding: 4px 8px; border: 1px solid #dce8e7; vertical-align: top; }
tr:nth-child(even) td { background-color: ${B.tealPale}; }
code { font-family: Consolas, 'Courier New', monospace; font-size: 9px; background-color: ${B.tealPale}; padding: 1px 4px; border-radius: 2px; color: ${B.tealDark}; }
pre { background-color: ${B.tealDark}; color: #e0eeec; padding: 12px 16px; border-radius: 6px; font-size: 8.5px; line-height: 1.4; overflow-wrap: break-word; white-space: pre-wrap; page-break-inside: avoid; border-left: 4px solid ${B.tealBrand}; margin: 8px 0 12px 0; }
pre code { background: none; padding: 0; color: #e0eeec; }
hr { border: none; height: 2px; background-color: ${B.tealPale}; margin: 20px 0; }
blockquote { border-left: 3px solid ${B.tealBrand}; margin: 10px 0; padding: 8px 14px; background-color: ${B.tealPale}; color: ${B.tealDark}; border-radius: 0 4px 4px 0; }
ul, ol { padding-left: 22px; margin: 4px 0; }
li { margin-bottom: 2px; }
li::marker { color: ${B.tealBrand}; }
a { color: ${B.tealBrand}; text-decoration: none; }
strong { color: ${B.ink}; font-weight: 600; }
em { color: ${B.inkLight}; }
p { orphans: 3; widows: 3; margin-bottom: 6px; }
h1 + *, h2 + *, h3 + *, h4 + * { page-break-before: avoid; }
`;
}

function getFrontmatter() {
  return `---
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
}

function buildDividerHtml(docs) {
  const logoSvg = `<svg width="60" height="60" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="48" width="320" height="416" rx="64" ry="64" stroke="${B.tealBrand}" stroke-width="48" fill="none"/><rect x="192" y="336" width="128" height="64" rx="32" ry="32" fill="${B.tealBrand}"/></svg>`;

  const pages = docs.map((doc, i) => `
    <div class="divider-page" ${i > 0 ? 'style="page-break-before:always;"' : ''}>
      <div class="accent-top"></div>
      <div class="content">
        <div class="logo">${logoSvg}</div>
        <div class="label">DOCUMENT</div>
        <div class="number">${doc.num}</div>
        <div class="line"></div>
        <div class="title">${doc.title}</div>
        <div class="subtitle">i-Ticket Platform — INSA Security Audit Documentation</div>
      </div>
      <div class="accent-bottom"></div>
    </div>
  `).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .divider-page {
    width: 210mm; height: 297mm;
    position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .accent-top { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${B.tealBrand}; }
  .accent-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: ${B.tealDark}; }
  .content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px; }
  .logo { margin-bottom: 36px; opacity: 0.12; }
  .label { font-size: 11px; font-weight: 600; letter-spacing: 6px; text-transform: uppercase; color: ${B.tealBrand}; margin-bottom: 14px; }
  .number { font-size: 64px; font-weight: 700; color: ${B.tealDark}; line-height: 1; margin-bottom: 24px; }
  .line { width: 80px; height: 3px; background: ${B.tealBrand}; margin-bottom: 28px; }
  .title { font-size: 24px; font-weight: 600; color: ${B.ink}; line-height: 1.3; max-width: 440px; margin-bottom: 24px; }
  .subtitle { font-size: 9px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; color: ${B.inkMuted}; }
</style>
</head><body>
${pages}
</body></html>`;
}

async function main() {
  fs.mkdirSync(PDF_DIR, { recursive: true });

  // Step 1: Generate each document as individual PDF
  console.log(`Step 1: Generating ${FILES.length} individual document PDFs...`);

  const cssPath = path.join(PDF_DIR, '_styles.css');
  fs.writeFileSync(cssPath, getStylesheet());

  const docPdfs = [];
  for (let i = 0; i < FILES.length; i++) {
    const file = FILES[i];
    const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
    const mdPath = path.join(PDF_DIR, `_doc${i}.md`);
    const pdfPath = path.join(PDF_DIR, `_doc${i}.pdf`);

    fs.writeFileSync(mdPath, getFrontmatter() + content);

    try {
      execSync(`npx -y md-to-pdf "${mdPath}"`, {
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: PDF_DIR,
      });

      if (fs.existsSync(pdfPath)) {
        const size = (fs.statSync(pdfPath).size / 1024).toFixed(0);
        const pages = execSync(`python -c "import pikepdf; print(len(pikepdf.open(r'${pdfPath.replace(/\\/g, '\\\\')}').pages))"`)
          .toString().trim();
        console.log(`  [${i + 1}/${FILES.length}] ${file}: ${pages} pages (${size} KB)`);
        docPdfs.push(pdfPath);
      } else {
        throw new Error('PDF not generated');
      }
    } catch (e) {
      console.error(`  [FAIL] ${file}: ${e.message}`);
      docPdfs.push(null);
    }

    try { fs.unlinkSync(mdPath); } catch {}
  }

  try { fs.unlinkSync(cssPath); } catch {}

  // Step 2: Generate divider pages + cover page with Puppeteer
  console.log('\nStep 2: Generating divider pages and cover page...');

  const allDocs = FILES.map(f => parseDocInfo(f));
  const dividerHtml = buildDividerHtml(allDocs);

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Divider pages
  await page.setContent(dividerHtml, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  await page.pdf({
    path: DIVIDERS_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const divPages = execSync(`python -c "import pikepdf; print(len(pikepdf.open(r'${DIVIDERS_PDF.replace(/\\/g, '\\\\')}').pages))"`)
    .toString().trim();
  console.log(`  Divider pages: ${divPages}`);

  // Cover page
  const coverHtml = fs.readFileSync(COVER_HTML, 'utf-8');
  await page.setContent(coverHtml, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 3000));
  await page.pdf({
    path: COVER_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`  Cover page: OK`);

  await browser.close();

  // Step 3: Concatenate everything with pikepdf
  console.log('\nStep 3: Assembling final PDF...');

  // Build list of PDF paths for Python
  const pdfPaths = [];
  for (let i = 0; i < FILES.length; i++) {
    pdfPaths.push(DIVIDERS_PDF.replace(/\\/g, '\\\\') + `|${i}`); // divider page index
    if (docPdfs[i]) pdfPaths.push(docPdfs[i].replace(/\\/g, '\\\\'));
  }

  const pyScript = path.join(PDF_DIR, '_assemble.py');
  fs.writeFileSync(pyScript, `
import pikepdf
import os

cover = pikepdf.open(r'${COVER_PDF.replace(/\\/g, '\\\\')}')
dividers = pikepdf.open(r'${DIVIDERS_PDF.replace(/\\/g, '\\\\')}')
merged = pikepdf.Pdf.new()

# Cover page
merged.pages.extend(cover.pages)

# For each document: divider page + document pages
doc_pdfs = ${JSON.stringify(docPdfs.map(p => p ? p.replace(/\\/g, '\\\\') : null))}

for i, doc_path in enumerate(doc_pdfs):
    # Add divider page
    merged.pages.append(dividers.pages[i])

    # Add document pages
    if doc_path:
        doc = pikepdf.open(doc_path)
        merged.pages.extend(doc.pages)
        doc.close()

final_path = r'${FINAL_PDF.replace(/\\/g, '\\\\')}'
merged.save(final_path,
    linearize=True,
    compress_streams=True,
    object_stream_mode=pikepdf.ObjectStreamMode.generate,
    recompress_flate=True)

cover.close()
dividers.close()
merged.close()

size_mb = os.path.getsize(final_path) / 1024 / 1024
total_pages = len(pikepdf.open(final_path).pages)
print(f'[OK] {total_pages} pages, {size_mb:.1f} MB')
`);

  try {
    const result = execSync(`python "${pyScript}"`, { timeout: 120000 }).toString();
    console.log(`  ${result.trim()}`);
  } catch (e) {
    console.error('  Assembly failed:', e.message);
    if (e.stderr) console.error(e.stderr.toString().substring(0, 500));
  }

  // Cleanup temp files
  try { fs.unlinkSync(DIVIDERS_PDF); } catch {}
  try { fs.unlinkSync(COVER_PDF); } catch {}
  try { fs.unlinkSync(pyScript); } catch {}
  for (const p of docPdfs) {
    if (p) try { fs.unlinkSync(p); } catch {}
  }

  console.log(`\nOutput: ${FINAL_PDF}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
