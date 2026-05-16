const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const superPassword = await bcrypt.hash('Ethara@123', 12);
  const existing = await prisma.user.findUnique({ where: { email: 'shahnawaz2020mth@gmail.com' } });
  if (!existing) {
    const superUser = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'shahnawaz2020mth@gmail.com',
        password: superPassword,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Super admin seeded:', superUser.email);
  } else {
    console.log('Super admin already exists:', existing.email);
  }

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin seeded:', adminUser.email);
  } else {
    console.log('Admin already exists:', existingAdmin.email);
  }

  const taskerPassword = await bcrypt.hash('Tasker@123', 12);
  const existingTasker = await prisma.user.findUnique({ where: { email: 'tasker@test.com' } });
  if (!existingTasker) {
    const taskerUser = await prisma.user.create({
      data: {
        name: 'Test Tasker',
        email: 'tasker@test.com',
        password: taskerPassword,
        role: 'MEMBER',
      },
    });
    console.log('Tasker seeded:', taskerUser.email);
  } else {
    console.log('Tasker already exists:', existingTasker.email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
