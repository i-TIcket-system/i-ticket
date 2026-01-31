const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Brand colors
  const tealDark = '#0d4f5c';
  const teal = '#0e9494';
  const tealLight = '#20c4c4';

  // Create SVG with gradient background, logo, and text
  const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${teal};stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0d7a7a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:${tealDark};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e0f7f7;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>

      <!-- Subtle pattern overlay -->
      <g opacity="0.05">
        <circle cx="100" cy="100" r="200" fill="white"/>
        <circle cx="1100" cy="530" r="250" fill="white"/>
        <circle cx="600" cy="-50" r="150" fill="white"/>
      </g>

      <!-- Logo icon (ticket/phone shape) - centered -->
      <g transform="translate(440, 120)">
        <!-- Outer rounded rectangle -->
        <rect x="48" y="24" width="160" height="208" rx="32" ry="32"
              stroke="white" stroke-width="24" fill="none"/>
        <!-- Inner button/pill shape -->
        <rect x="96" y="168" width="64" height="32" rx="16" ry="16" fill="white"/>
      </g>

      <!-- Brand name -->
      <text x="600" y="420"
            font-family="Arial, Helvetica, sans-serif"
            font-size="72"
            font-weight="bold"
            fill="white"
            text-anchor="middle">
        i-Ticket
      </text>

      <!-- Tagline -->
      <text x="600" y="480"
            font-family="Arial, Helvetica, sans-serif"
            font-size="28"
            fill="rgba(255,255,255,0.9)"
            text-anchor="middle">
        Book Bus Tickets in Ethiopia
      </text>

      <!-- Subtitle -->
      <text x="600" y="530"
            font-family="Arial, Helvetica, sans-serif"
            font-size="20"
            fill="rgba(255,255,255,0.7)"
            text-anchor="middle">
        Selam • Sky • Abay • Golden Bus and more
      </text>

      <!-- Website URL -->
      <text x="600" y="590"
            font-family="Arial, Helvetica, sans-serif"
            font-size="18"
            fill="rgba(255,255,255,0.6)"
            text-anchor="middle">
        i-ticket.et
      </text>
    </svg>
  `;

  const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');

  await sharp(Buffer.from(svgImage))
    .png()
    .toFile(outputPath);

  console.log(`✅ OG image generated: ${outputPath}`);
  console.log(`   Dimensions: ${width}x${height}`);
}

generateOGImage().catch(console.error);
