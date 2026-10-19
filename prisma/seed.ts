import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash: hash },
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, deadline: null },
  });

  console.log(`Seeded admin "${username}" and default settings.`);
}

main().finally(() => prisma.$disconnect());
