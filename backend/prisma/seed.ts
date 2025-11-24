import { PrismaClient, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      password: adminPassword,
      role: 'ADMIN',
      name: 'System Administrator',
    },
  });

  console.log('✔ Admin user created');

  // 2. Platform Account
  const platformAccount = await prisma.account.create({
    data: {
      type: 'PLATFORM',
      balance: 500000,
    },
  });

  console.log('✔ Platform account created with $500,000');

  // 3. Initial funding transaction  
  await prisma.transaction.create({
    data: {
      type: TransactionType.ADDING_FUNDS,
      refId: null,
      amount: 500000,
    },
  });

  console.log('✔ Initial funds transaction recorded\n');

  // 4. Test Users
  const users: { user: any; account: any }[] = [];

  const john = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
      name: 'John Doe',
    },
  });

  const johnAccount = await prisma.account.create({
    data: {
      userId: john.id,
      type: 'USER',
      balance: 0,
    },
  });

  users.push({ user: john, account: johnAccount });
  console.log('✔ Created John Doe');

  const jane = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
      name: 'Jane Smith',
    },
  });

  const janeAccount = await prisma.account.create({
    data: {
      userId: jane.id,
      type: 'USER',
      balance: 0,
    },
  });

  users.push({ user: jane, account: janeAccount });
  console.log('✔ Created Jane Smith');

  console.log('\n🎉 Seed completed!\n');
  console.log('📋 Summary:');
  console.log('  - 1 Admin user (admin@system.com / admin123)');
  console.log('  - 1 Platform account ($500,000)');
  console.log('  - 2 Test users');
  console.log('\nYou can now create loans, disburse, and make payments!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
