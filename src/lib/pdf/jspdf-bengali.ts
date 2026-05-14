import type { jsPDF } from "jspdf";

const FONT_FILE = "NotoSansBengali-Regular.ttf";
const FONT_FAMILY = "DokandarBN";

let fontBase64: string | null = null;
let vfsRegistered = false;

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

async function loadFontBase64(): Promise<string> {
  if (fontBase64) return fontBase64;
  const res = await fetch(`/fonts/${FONT_FILE}`);
  if (!res.ok) {
    throw new Error("বাংলা ফন্ট লোড করা যায়নি");
  }
  const buf = await res.arrayBuffer();
  fontBase64 = uint8ToBase64(new Uint8Array(buf));
  return fontBase64;
}

/** Registers Noto Sans Bengali on the jsPDF VFS (once) and applies it to `doc`. */
export async function ensureJsPdfBengaliFont(doc: jsPDF): Promise<void> {
  const b64 = await loadFontBase64();
  if (!vfsRegistered) {
    doc.addFileToVFS(FONT_FILE, b64);
    doc.addFont(FONT_FILE, FONT_FAMILY, "normal", "normal", "Identity-H");
    vfsRegistered = true;
  }
  doc.setFont(FONT_FAMILY, "normal");
}

export async function createBengaliPdf(): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  await ensureJsPdfBengaliFont(doc);
  doc.setFontSize(11);
  return doc;
}

export function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeightMm: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeightMm;
}
