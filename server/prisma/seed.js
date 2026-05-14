const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const superPassword = await bcrypt.hash('Ethara@123', 12);
  const superUser = await prisma.user.upsert({
    where: { email: 'shahnawaz2020mth@gmail.com' },
    update: { name: 'Super Admin', role: 'SUPER_ADMIN' },
    create: {
      name: 'Super Admin',
      email: 'shahnawaz2020mth@gmail.com',
      password: superPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super admin seeded:', superUser.email);

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { name: 'Test Admin', role: 'ADMIN' },
    create: {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin seeded:', adminUser.email);

  const taskerPassword = await bcrypt.hash('Tasker@123', 12);
  const taskerUser = await prisma.user.upsert({
    where: { email: 'tasker@test.com' },
    update: { name: 'Test Tasker', role: 'MEMBER' },
    create: {
      name: 'Test Tasker',
      email: 'tasker@test.com',
      password: taskerPassword,
      role: 'MEMBER',
    },
  });
  console.log('Tasker seeded:', taskerUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
