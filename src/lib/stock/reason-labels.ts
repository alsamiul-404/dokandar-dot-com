export function stockLogReasonBn(reason: string): string {
  switch (reason) {
    case "SALE":
      return "বিক্রয়";
    case "PURCHASE":
      return "ক্রয়/যোগান";
    case "ADJUSTMENT":
      return "হাতে সমন্বয়";
    case "RETURN":
      return "ফেরত";
    case "OPENING":
      return "শুরুর মজুদ";
    default:
      return reason;
  }
}
