const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const tasks = [
  {
    input: 'd:/test/mobile/assets/logo/app_icon.svg',
    output: 'd:/test/mobile/assets/logo/app_icon.png',
    width: 1024,
  },
  {
    input: 'd:/test/mobile/assets/logo/logo_symbol.svg',
    output: 'd:/test/mobile/assets/logo/logo_symbol.png',
    width: 800,
  },
  {
    input: 'd:/test/mobile/assets/logo/logo_horizontal.svg',
    output: 'd:/test/mobile/assets/logo/logo_horizontal.png',
    width: 1600,
  },
  {
    input: 'd:/test/mobile/assets/logo/logo_horizontal_dark.svg',
    output: 'd:/test/mobile/assets/logo/logo_horizontal_dark.png',
    width: 1600,
  },
];

for (const t of tasks) {
  const svg = fs.readFileSync(t.input, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: t.width,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Segoe UI',
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(t.output, pngBuffer);
  console.log(`Rendered ${t.output} (${pngBuffer.length} bytes)`);
}

// Also copy to dashboard public brand
const dashboardBrandDir = 'd:/test/dashboard/public/brand';
if (!fs.existsSync(dashboardBrandDir)) fs.mkdirSync(dashboardBrandDir, { recursive: true });

fs.copyFileSync('d:/test/mobile/assets/logo/app_icon.png', path.join(dashboardBrandDir, 'app_icon.png'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_symbol.png', path.join(dashboardBrandDir, 'logo_symbol.png'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_horizontal.png', path.join(dashboardBrandDir, 'logo_horizontal.png'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_horizontal_dark.png', path.join(dashboardBrandDir, 'logo_horizontal_dark.png'));
fs.copyFileSync('d:/test/mobile/assets/logo/app_icon.svg', path.join(dashboardBrandDir, 'app_icon.svg'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_symbol.svg', path.join(dashboardBrandDir, 'logo_symbol.svg'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_horizontal.svg', path.join(dashboardBrandDir, 'logo_horizontal.svg'));
fs.copyFileSync('d:/test/mobile/assets/logo/logo_horizontal_dark.svg', path.join(dashboardBrandDir, 'logo_horizontal_dark.svg'));

// Also set as main favicon / logo in dashboard/public
fs.copyFileSync('d:/test/mobile/assets/logo/logo_symbol.png', 'd:/test/dashboard/public/logo.png');
fs.copyFileSync('d:/test/mobile/assets/logo/app_icon.png', 'd:/test/dashboard/public/favicon.ico');

console.log('All brand assets generated and copied successfully!');
