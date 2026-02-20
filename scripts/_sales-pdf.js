#!/usr/bin/env node
/**
 * Convert the i-Ticket Sales Presentation markdown to branded PDF.
 * Uses md-to-pdf + pikepdf compression, same theme as INSA docs.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PRES_DIR = path.join(__dirname, '..', 'docs', 'presentations');
const MD_FILE = path.join(PRES_DIR, 'i-Ticket-Sales-Presentation.md');
const OUTPUT_DIR = path.join(PRES_DIR, 'pdf');
const TEMP_MD = path.join(OUTPUT_DIR, '_sales.md');
const RAW_PDF = path.join(OUTPUT_DIR, '_raw.pdf');
const FINAL_PDF = path.join(OUTPUT_DIR, 'i-Ticket-Sales-Presentation.pdf');

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

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const content = fs.readFileSync(MD_FILE, 'utf-8');

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
      <span style="margin-left:6px;font-size:6px;color:${B.inkMuted};letter-spacing:1.2px;text-transform:uppercase;">Sales Presentation</span>
      <span style="flex:1"></span>
      <span style="font-size:7px;color:${B.inkMuted};">v2.14.0 | i-ticket.et | Feb 2026</span>
    </div>
  footerTemplate: |
    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:6px 45px;border-top:1.5px solid ${B.tealBrand};font-family:Segoe UI,Calibri,Arial,sans-serif;font-size:7px;color:${B.inkLight};">
      <span>+251 911 550 001 / +251 911 178 577</span>
      <span style="color:${B.tealDark};font-weight:600;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      <span>www.i-ticket.et</span>
    </div>
  printBackground: true
stylesheet:
  - _styles.css
---

`;

  const css = `
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
  font-size: 22px;
  font-weight: 700;
  color: ${B.tealDark};
  border-bottom: 3px solid ${B.tealBrand};
  padding-bottom: 6px;
  margin-top: 0;
  margin-bottom: 14px;
  page-break-after: avoid;
}
h2 {
  font-size: 15px;
  font-weight: 600;
  color: ${B.tealBrand};
  border-bottom: 1.5px solid ${B.tealPale};
  padding-bottom: 4px;
  margin-top: 28px;
  margin-bottom: 12px;
  page-break-after: avoid;
}
h3 {
  font-size: 12px;
  font-weight: 600;
  color: ${B.tealMid};
  margin-top: 20px;
  margin-bottom: 6px;
  page-break-after: avoid;
}
h4 {
  font-size: 11px;
  font-weight: 600;
  color: ${B.ink};
  margin-top: 14px;
  margin-bottom: 5px;
  page-break-after: avoid;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 14px 0;
  font-size: 9.5px;
  page-break-inside: auto;
}
tr { page-break-inside: avoid; }
th {
  background-color: ${B.tealDark};
  color: white;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 9px;
  letter-spacing: 0.2px;
  border: 1px solid ${B.tealDark};
}
td {
  padding: 5px 10px;
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
  font-size: 9px;
  line-height: 1.4;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  page-break-inside: avoid;
  border-left: 4px solid ${B.tealBrand};
  margin: 8px 0 14px 0;
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
  margin: 22px 0;
}

blockquote {
  border-left: 3px solid ${B.tealBrand};
  margin: 10px 0;
  padding: 8px 14px;
  background-color: ${B.tealPale};
  color: ${B.tealDark};
  border-radius: 0 4px 4px 0;
  font-style: italic;
}

ul, ol { padding-left: 22px; margin: 4px 0; }
li { margin-bottom: 3px; }
li::marker { color: ${B.tealBrand}; }

a { color: ${B.tealBrand}; text-decoration: none; }
strong { color: ${B.ink}; font-weight: 600; }
em { color: ${B.inkLight}; }
p { orphans: 3; widows: 3; margin-bottom: 7px; }

h1 + *, h2 + *, h3 + *, h4 + * { page-break-before: avoid; }
`;

  const cssPath = path.join(OUTPUT_DIR, '_styles.css');
  fs.writeFileSync(cssPath, css);
  fs.writeFileSync(TEMP_MD, frontmatter + content);

  console.log('Generating branded PDF...');

  // Generate PDF
  try {
    execSync(`npx -y md-to-pdf "${TEMP_MD}"`, {
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: OUTPUT_DIR,
    });

    const generatedPdf = TEMP_MD.replace('.md', '.pdf');
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

  // Compress using separate Python script (inline Python fails on Windows paths)
  console.log('  Compressing...');
  const pyScriptPath = path.join(OUTPUT_DIR, '_compress.py');
  const pyScript = `import pikepdf, os, sys
raw = sys.argv[1]
out = sys.argv[2]
pdf = pikepdf.open(raw)
pdf.save(out, linearize=True, compress_streams=True,
         object_stream_mode=pikepdf.ObjectStreamMode.generate,
         recompress_flate=True)
pdf.close()
pages = len(pikepdf.open(out).pages)
size = os.path.getsize(out) / 1024 / 1024
print(f'{pages} pages, {size:.1f} MB')
`;
  fs.writeFileSync(pyScriptPath, pyScript);
  try {
    const result = execSync(
      `python "${pyScriptPath}" "${RAW_PDF}" "${FINAL_PDF}"`,
      { timeout: 120000 }
    ).toString().trim();
    console.log(`\n  [OK] i-Ticket-Sales-Presentation.pdf (${result})`);
  } catch {
    console.log('  Compression failed, using raw');
    fs.copyFileSync(RAW_PDF, FINAL_PDF);
  }
  try { fs.unlinkSync(pyScriptPath); } catch {}

  // Cleanup
  try { fs.unlinkSync(TEMP_MD); } catch {}
  try { fs.unlinkSync(cssPath); } catch {}
  try { fs.unlinkSync(RAW_PDF); } catch {}

  console.log(`\nOutput: ${FINAL_PDF}`);
}

main();
