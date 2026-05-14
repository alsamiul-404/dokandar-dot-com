import Decimal from "decimal.js";

/** ৳ টাকা — সহজ ফরম্যাট (বাংলা সংখ্যা নয়, পড়তে সহজ) */
export function formatTaka(value: Decimal | string | number): string {
  const d = new Decimal(value);
  const n = d.toNumber();
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
