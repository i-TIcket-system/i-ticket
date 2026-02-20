#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlFile = process.argv[2];
const pdfFile = process.argv[3];

if (!htmlFile || !pdfFile) {
  console.error('Usage: node _html-to-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}

(async () => {
  const htmlPath = path.resolve(htmlFile);
  const pdfPath = path.resolve(pdfFile);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await browser.close();

  const size = (fs.statSync(pdfPath).size / 1024).toFixed(0);
  console.log(`OK: ${size} KB -> ${pdfPath}`);
})();
