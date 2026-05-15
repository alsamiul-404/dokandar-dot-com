/**
 * Default dev shop + user (idempotent).
 * Login in the app is still OTP-based; password is stored for future password flows.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

const PHONE = "8801832997080";
const PLAIN_PASSWORD = "12345678";
const USER_NAME = "Mohammad Al Samiul";
const SHOP_NAME = "Samiul's Store";

const prisma = new PrismaClient();

async function main() {
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
      data: { name: SHOP_NAME, ownerName: USER_NAME },
    });
    console.log(`[seed] Updated default user ${PHONE} and shop "${SHOP_NAME}".`);
    return;
  }

  const shop = await prisma.shop.create({
    data: {
      name: SHOP_NAME,
      ownerName: USER_NAME,
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

  console.log(`[seed] Created default user ${PHONE} and shop "${SHOP_NAME}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
    
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
