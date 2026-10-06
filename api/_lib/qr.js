import QRCode from 'qrcode';

const qrLib = (QRCode && QRCode.default) ? QRCode.default : QRCode;

// Generates pure vector SVG without any native canvas / C++ dependencies
export async function generateQrSvg(text) {
  try {
    if (!qrLib || typeof qrLib.toString !== 'function') {
      console.warn('QRCode library toString method not available');
      return '';
    }
    return await qrLib.toString(text, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    return '';
  }
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
