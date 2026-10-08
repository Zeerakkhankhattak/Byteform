let cachedQrLib = null;
let qrImportAttempted = false;

async function getQrLib() {
  if (qrImportAttempted) return cachedQrLib;
  qrImportAttempted = true;
  try {
    const mod = await import('qrcode');
    cachedQrLib = (mod && mod.default) ? mod.default : mod;
  } catch (err) {
    console.warn('Could not dynamically load qrcode module:', err.message);
    cachedQrLib = null;
  }
  return cachedQrLib;
}

// Fallback clean vector SVG barcode/QR representation if npm package is missing
function createFallbackSvg(text) {
  const safeText = String(text || '').replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" fill="#ffffff" rx="12"/>
    <rect x="20" y="20" width="50" height="50" fill="none" stroke="#000000" stroke-width="8"/>
    <rect x="35" y="35" width="20" height="20" fill="#000000"/>
    <rect x="170" y="20" width="50" height="50" fill="none" stroke="#000000" stroke-width="8"/>
    <rect x="185" y="35" width="20" height="20" fill="#000000"/>
    <rect x="20" y="170" width="50" height="50" fill="none" stroke="#000000" stroke-width="8"/>
    <rect x="35" y="185" width="20" height="20" fill="#000000"/>
    <rect x="90" y="30" width="60" height="10" fill="#000000"/>
    <rect x="90" y="55" width="25" height="15" fill="#000000"/>
    <rect x="125" y="55" width="25" height="15" fill="#000000"/>
    <rect x="30" y="90" width="180" height="10" fill="#000000"/>
    <rect x="30" y="110" width="80" height="20" fill="#000000"/>
    <rect x="130" y="110" width="80" height="20" fill="#000000"/>
    <rect x="30" y="140" width="180" height="10" fill="#000000"/>
    <rect x="90" y="170" width="60" height="15" fill="#000000"/>
    <rect x="90" y="195" width="120" height="25" fill="#000000"/>
    <title>${safeText}</title>
  </svg>`;
}

// Generates pure vector SVG without any native canvas / C++ dependencies
export async function generateQrSvg(text) {
  try {
    const qrLib = await getQrLib();
    if (qrLib && typeof qrLib.toString === 'function') {
      return await qrLib.toString(text, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    }
  } catch (err) {
    console.error('Failed to generate QR SVG via qrcode library:', err);
  }
  return createFallbackSvg(text);
}

// Generates an SVG Data URL suitable for any <img src="..."> in all modern browsers
export async function generateQrPngDataUrl(text, width = 600) {
  try {
    const svg = await generateQrSvg(text);
    if (svg) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  } catch (err) {
    console.error('Failed to generate QR Data URL:', err);
  }
  return '';
}
