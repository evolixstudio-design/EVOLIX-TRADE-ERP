const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRawUnsafe('DROP DATABASE IF EXISTS evolix_trade_dev_shadow;')
  .then(() => prisma.$executeRawUnsafe('CREATE DATABASE evolix_trade_dev_shadow;'))
  .then(() => prisma.$disconnect())
  .catch(console.error);
