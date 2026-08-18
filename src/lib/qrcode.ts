import QRCode from 'qrcode';

/** Renders a scannable QR pointing at the given URL as a PNG data URL. */
export async function generateQrDataUrl(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, {
    width: 512,
    margin: 1,
    color: { dark: '#171717', light: '#ffffff' },
  });
}
