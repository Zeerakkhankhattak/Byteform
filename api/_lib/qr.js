import QRCode from 'qrcode';

export async function generateQrPngDataUrl(text, width = 600) {
  return await QRCode.toDataURL(text, {
    width,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}

export async function generateQrSvg(text) {
  return await QRCode.toString(text, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}

export async function generateQrPngBuffer(text, width = 1024) {
  return await QRCode.toBuffer(text, {
    type: 'png',
    width,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}
