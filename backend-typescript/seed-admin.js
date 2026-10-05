const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({ data: { name: 'Evolix Admin Org' } });
  }

  let user = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        organization_id: org.id,
        username: 'admin',
        display_name: 'Administrator',
        password_hash: hash,
        is_active: true
      }
    });
    console.log('Created admin user: admin / admin123');
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hash }
    });
    console.log('Updated existing admin user password: admin / admin123');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
