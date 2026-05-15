/**
 * Dev seed: default shop + user + demo data for every feature (2–3 rows each).
 * Demo products/customers upsert by SKU/phone; sales added once per shop.
 *
 * Login: OTP (dev mock 123456) | phone 8801832997080 | password 12345678
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

const PHONE = "8801832997080";
const PLAIN_PASSWORD = "12345678";
const USER_NAME = "Mohammad Al Samiul";
const SHOP_NAME = "Samiul's Store";

const DEMO_SALE_NOTE = "[seed]";

const prisma = new PrismaClient();

function daysAgo(n, hour = 14, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function dec(n) {
  return String(Number(n).toFixed(4));
}

async function ensureShopAndUser() {
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, ROUNDS);

  const existing = await prisma.user.findUnique({
    where: { phone: PHONE },
    include: { shop: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name: USER_NAME, passwordHash },
    });
    await prisma.shop.update({
      where: { id: existing.shopId },
      data: {
        name: SHOP_NAME,
        ownerName: USER_NAME,
        address: "১২৩ মার্কেট রোড, ঢাকা",
        phone: PHONE,
      },
    });
    console.log(`[seed] Updated user ${PHONE} and shop "${SHOP_NAME}".`);
    return { shopId: existing.shopId };
  }

  const shop = await prisma.shop.create({
    data: {
      name: SHOP_NAME,
      ownerName: USER_NAME,
      address: "১২৩ মার্কেট রোড, ঢাকা",
      phone: PHONE,
    },
  });

  await prisma.user.create({
    data: {
      phone: PHONE,
      name: USER_NAME,
      passwordHash,
      shopId: shop.id,
    },
  });

  console.log(`[seed] Created user ${PHONE} and shop "${SHOP_NAME}".`);
  return { shopId: shop.id };
}

async function upsertProduct(tx, shopId, def) {
  const existing = await tx.product.findFirst({
    where: { shopId, sku: def.sku },
  });

  if (existing) {
    return tx.product.update({
      where: { id: existing.id },
      data: {
        name: def.name,
        category: def.category,
        buyPrice: def.buyPrice,
        unitPrice: def.unitPrice,
        lowStockAlert: def.lowStockAlert,
        isActive: true,
      },
    });
  }

  const created = await tx.product.create({
    data: {
      shopId,
      name: def.name,
      category: def.category,
      sku: def.sku,
      buyPrice: def.buyPrice,
      unitPrice: def.unitPrice,
      stockOnHand: def.stockOnHand,
      lowStockAlert: def.lowStockAlert,
    },
  });

  await tx.stockLog.create({
    data: {
      productId: created.id,
      quantityDelta: def.stockOnHand,
      reason: "OPENING",
      note: "সিড — শুরুর মজুদ",
    },
  });

  return created;
}

async function upsertCustomer(tx, shopId, def) {
  const existing = def.phone
    ? await tx.customer.findFirst({ where: { shopId, phone: def.phone } })
    : await tx.customer.findFirst({ where: { shopId, name: def.name } });

  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        name: def.name,
        phone: def.phone ?? null,
        address: def.address ?? null,
        notes: def.notes ?? null,
      },
    });
  }

  return tx.customer.create({
    data: {
      shopId,
      name: def.name,
      phone: def.phone ?? null,
      address: def.address ?? null,
      notes: def.notes ?? null,
    },
  });
}

async function createSale(tx, { shopId, customerId, soldAt, cash, credit, notes, lines }) {
  let total = 0;
  const prepared = [];

  for (const line of lines) {
    const p = await tx.product.findFirst({
      where: { id: line.productId, shopId },
    });
    if (!p) throw new Error(`Product missing: ${line.productId}`);
    const unit = Number(p.unitPrice);
    const lineTotal = unit * line.quantity;
    total += lineTotal;
    prepared.push({
      productId: p.id,
      quantity: line.quantity,
      unitPrice: dec(unit),
      lineTotal: dec(lineTotal),
    });
  }

  const sale = await tx.sale.create({
    data: {
      shopId,
      customerId: customerId ?? null,
      totalAmount: dec(total),
      cashPaid: dec(cash),
      creditAmount: dec(credit),
      notes: `${DEMO_SALE_NOTE} ${notes ?? ""}`.trim(),
      soldAt,
      lines: { create: prepared },
    },
  });

  for (const l of prepared) {
    await tx.product.update({
      where: { id: l.productId },
      data: { stockOnHand: { decrement: l.quantity } },
    });
    await tx.stockLog.create({
      data: {
        productId: l.productId,
        saleId: sale.id,
        quantityDelta: -l.quantity,
        reason: "SALE",
      },
    });
  }

  if (credit > 0 && customerId) {
    await tx.creditEntry.create({
      data: {
        shopId,
        customerId,
        saleId: sale.id,
        amount: dec(credit),
        entryType: "SALE_CREDIT",
        description: "বিক্রয় বাকি",
        recordedAt: soldAt,
      },
    });
  }

  return sale;
}

async function seedDemoData(shopId) {
  console.log("[seed] Upserting demo data…");

  const productDefs = [
    {
      name: "আলতোফল (আতার ৬ml)",
      category: "মুদি",
      sku: "DEMO-ATAR-01",
      buyPrice: "450",
      unitPrice: "550",
      stockOnHand: 25,
      lowStockAlert: 5,
    },
    {
      name: "স্যাফল বাসমতি চাল ৫ কেজি",
      category: "ডাল-চাল",
      sku: "DEMO-CHAL-05",
      buyPrice: "320",
      unitPrice: "380",
      stockOnHand: 8,
      lowStockAlert: 10,
    },
    {
      name: "কোক ১.২৫ লিটার",
      category: "পানীয়",
      sku: "DEMO-COKE-125",
      buyPrice: "75",
      unitPrice: "95",
      stockOnHand: 50,
      lowStockAlert: 12,
    },
  ];

  const customerDefs = [
    {
      name: "করিম মিয়া",
      phone: "8801711111001",
      address: "পুরান বাজার",
      notes: "নিয়মিত গ্রাহক",
    },
    {
      name: "রহিমা খাতুন",
      phone: "8801722222002",
      notes: "সাপ্তাহিক জমা দেন",
    },
    {
      name: "শাহজাহান ট্রেডার্স",
      phone: "8801733333003",
      address: "নতুন মার্কেট",
    },
  ];

  const atar = await prisma.$transaction((tx) => upsertProduct(tx, shopId, productDefs[0]));
  const chal = await prisma.$transaction((tx) => upsertProduct(tx, shopId, productDefs[1]));
  const coke = await prisma.$transaction((tx) => upsertProduct(tx, shopId, productDefs[2]));
  const karim = await prisma.$transaction((tx) => upsertCustomer(tx, shopId, customerDefs[0]));
  const rhima = await prisma.$transaction((tx) => upsertCustomer(tx, shopId, customerDefs[1]));
  const shahjahan = await prisma.$transaction((tx) =>
    upsertCustomer(tx, shopId, customerDefs[2]),
  );

  // Baki ledger samples (skip if customer already has entries)
  for (const [customerId, entries] of [
    [
      karim.id,
      [
        {
          amount: "500.0000",
          entryType: "ADJUSTMENT",
          description: "হাতে খাতা — পুরনো বাকি",
          recordedAt: daysAgo(5),
        },
      ],
    ],
    [
      rhima.id,
      [
        {
          amount: "1200.0000",
          entryType: "ADJUSTMENT",
          description: "মাসের বাকি",
          recordedAt: daysAgo(3),
        },
        {
          amount: "-500.0000",
          entryType: "PAYMENT",
          description: "আংশিক জমা",
          recordedAt: daysAgo(1),
        },
      ],
    ],
    [
      shahjahan.id,
      [
        {
          amount: "3500.0000",
          entryType: "ADJUSTMENT",
          description: "পাইকারি বাকি",
          recordedAt: daysAgo(7),
        },
      ],
    ],
  ]) {
    const count = await prisma.creditEntry.count({ where: { customerId } });
    if (count === 0) {
      await prisma.creditEntry.createMany({
        data: entries.map((e) => ({ shopId, customerId, ...e })),
      });
    }
  }

  // Demo sales (once)
  const demoSales = await prisma.sale.count({
    where: { shopId, notes: { startsWith: DEMO_SALE_NOTE } },
  });

  if (demoSales === 0) {
    await prisma.$transaction((tx) =>
      createSale(tx, {
        shopId,
        soldAt: daysAgo(0, 10, 15),
        cash: 1140,
        credit: 0,
        notes: "নগদ বিক্রয়",
        lines: [
          { productId: atar.id, quantity: 1 },
          { productId: coke.id, quantity: 6 },
        ],
      }),
    );
    await prisma.$transaction((tx) =>
      createSale(tx, {
        shopId,
        customerId: karim.id,
        soldAt: daysAgo(0, 16, 45),
        cash: 200,
        credit: 560,
        notes: "আংশিক বাকি",
        lines: [{ productId: chal.id, quantity: 2 }],
      }),
    );
    await prisma.$transaction((tx) =>
      createSale(tx, {
        shopId,
        customerId: shahjahan.id,
        soldAt: daysAgo(1, 11, 0),
        cash: 0,
        credit: 1900,
        notes: "পাইকারি — সব বাকি",
        lines: [
          { productId: atar.id, quantity: 2 },
          { productId: coke.id, quantity: 10 },
        ],
      }),
    );
    console.log("[seed] Added 3 demo sales.");
  } else {
    console.log("[seed] Demo sales already exist — skipped.");
  }

  // One purchase log on chal if none yet
  const purchaseLog = await prisma.stockLog.count({
    where: { productId: chal.id, reason: "PURCHASE" },
  });
  if (purchaseLog === 0) {
    await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({ where: { id: chal.id } });
      await tx.product.update({
        where: { id: chal.id },
        data: { stockOnHand: (p?.stockOnHand ?? 0) + 5 },
      });
      await tx.stockLog.create({
        data: {
          productId: chal.id,
          quantityDelta: 5,
          reason: "PURCHASE",
          note: "সিড — নতুন চাল এসেছে",
        },
      });
    });
  }

  console.log("[seed] Demo summary:");
  console.log("  • 3 products (stock / low-stock / categories)");
  console.log("  • 3 baki customers + ledger");
  console.log("  • 3 sales → POS, daily sales, profit");
  console.log("  • Stock logs (opening, sale, purchase)");
}

async function main() {
  const { shopId } = await ensureShopAndUser();
  await seedDemoData(shopId);
  console.log("\n[seed] Done. Login:", PHONE, "| dev OTP: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
