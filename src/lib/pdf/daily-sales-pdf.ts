import type { jsPDF } from "jspdf";

import type { DailySalesReport } from "@/lib/reports/types";

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

export async function downloadDailySalesPdf(report: DailySalesReport): Promise<void> {
  const doc = await createBengaliPdf();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFontSize(18);
  doc.text("দৈনিক বিক্রয় — সারাংশ", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  y = drawWrappedText(
    doc,
    `দোকান: ${report.shopName} · তারিখ: ${report.date} · মোট বিল: ${report.saleCount}`,
    margin,
    y,
    contentW,
    6,
  );
  y += 4;

  doc.setFontSize(12);
  y = await paginate(doc, y, margin, 24);
  doc.text(`মোট বিক্রয়: ${taka(report.totalSales)}`, margin, y);
  y += 7;
  y = await paginate(doc, y, margin, 8);
  doc.text(`নগদ: ${taka(report.cash)}`, margin, y);
  y += 7;
  y = await paginate(doc, y, margin, 8);
  doc.text(`বাকি: ${taka(report.baki)}`, margin, y);
  y += 12;

  doc.setFontSize(13);
  y = await paginate(doc, y, margin, 10);
  doc.text("বিস্তারিত বিক্রয়", margin, y);
  y += 8;

  for (const sale of report.sales) {
    const time = new Date(sale.soldAt).toLocaleString("bn-BD");
    const head = `${time} · বিল ${sale.id.slice(0, 8)}… · গ্রাহক: ${sale.customerName ?? "—"}`;
    y = await paginate(doc, y, margin, 20);
    doc.setFontSize(10);
    y = drawWrappedText(doc, head, margin, y, contentW, 5);
    y += 1;
    y = await paginate(doc, y, margin, 8);
    doc.text(
      `মোট ${taka(sale.totalAmount)} · নগদ ${taka(sale.cashPaid)} · বাকি ${taka(sale.creditAmount)}`,
      margin,
      y,
    );
    y += 6;
    for (const line of sale.lines) {
      const row = `  • ${line.productName} × ${line.quantity} @ ${taka(line.unitPrice)} = ${taka(line.lineTotal)}`;
      y = await paginate(doc, y, margin, 12);
      y = drawWrappedText(doc, row, margin, y, contentW, 5);
    }
    y += 4;
  }

  y = await paginate(doc, y, margin, 14);
  doc.setFontSize(9);
  drawWrappedText(
    doc,
    "Dokandar.app — লাভ/খরচ হিসাব পৃথক রিপোর্টে (লাভ হিসাব) দেখুন।",
    margin,
    y,
    contentW,
    4,
  );

  doc.save(`dokandar-doinik-bikri-${report.date}.pdf`);
}
