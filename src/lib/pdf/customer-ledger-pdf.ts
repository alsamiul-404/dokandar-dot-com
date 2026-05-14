import type { jsPDF } from "jspdf";

import type { CustomerLedgerPdfInput } from "@/lib/reports/types";

import { formatBakiLabel } from "@/lib/baki/ledger";

import {
  createBengaliPdf,
  drawWrappedText,
  ensureJsPdfBengaliFont,
} from "./jspdf-bengali";

function taka(n: string): string {
  return `${n} ৳`;
}

async function paginate(
  doc: jsPDF,
  y: number,
  margin: number,
  needMm: number,
): Promise<number> {
  const bottom = doc.internal.pageSize.getHeight() - margin;
  if (y + needMm <= bottom) return y;
  doc.addPage();
  await ensureJsPdfBengaliFont(doc);
  return margin;
}

export async function downloadCustomerLedgerPdf(
  input: CustomerLedgerPdfInput,
): Promise<void> {
  const doc = await createBengaliPdf();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFontSize(18);
  doc.text("গ্রাহক খাতা — লেনদেন", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  y = drawWrappedText(doc, `দোকান: ${input.shopName}`, margin, y, contentW, 6);
  y += 2;
  y = drawWrappedText(
    doc,
    `গ্রাহক: ${input.customerName} · মোবাইল: ${input.customerPhone ?? "—"}`,
    margin,
    y,
    contentW,
    6,
  );
  y += 8;

  doc.setFontSize(14);
  y = await paginate(doc, y, margin, 12);
  doc.text(`মোট বাকি: ${taka(input.balance)}`, margin, y);
  y += 12;

  doc.setFontSize(12);
  y = await paginate(doc, y, margin, 10);
  doc.text("লেনদেনের তালিকা", margin, y);
  y += 8;

  doc.setFontSize(10);
  for (const e of input.entries) {
    const when = new Date(e.recordedAt).toLocaleString("bn-BD");
    const label = formatBakiLabel(e.entryType);
    const desc = e.description ? ` · ${e.description}` : "";
    const line = `${when} — ${label}${desc} — ${taka(e.amount)}`;
    y = await paginate(doc, y, margin, 14);
    y = drawWrappedText(doc, line, margin, y, contentW, 5);
    y += 2;
  }

  doc.save(`dokandar-baki-khata-${Date.now()}.pdf`);
}
