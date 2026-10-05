const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('superadmin123', 10);
  
  // ensure SUPER_ADMIN role exists
  const superAdminRole = await prisma.platformRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Master platform administrator',
      system_role: true,
    }
  });

  const existingAdmin = await prisma.platformUser.findUnique({
    where: { username: 'superadmin' }
  });

  if (existingAdmin) {
    await prisma.platformUser.update({
      where: { username: 'superadmin' },
      data: { password_hash: hash, is_active: true }
    });
  } else {
    await prisma.platformUser.create({
      data: {
        username: 'superadmin',
        display_name: 'Super Admin',
        password_hash: hash,
        roles: {
          create: [
            { role_id: superAdminRole.id }
          ]
        }
      }
    });
  }

  console.log('Superadmin reset to superadmin123');
}

main().finally(() => prisma.$disconnect());
