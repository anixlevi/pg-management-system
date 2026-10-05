import crypto from "crypto";
import QRCode from "qrcode";

export function generateDigitalKey() {
  return `PGKEY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function keyToQrDataUrl(keyString) {
  return QRCode.toDataURL(keyString, { margin: 1, width: 260 });
}
