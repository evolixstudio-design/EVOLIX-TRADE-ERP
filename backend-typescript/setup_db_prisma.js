const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Qusai5253@127.0.0.1:5432/postgres' // connect to default postgres db
    }
  }
});

prisma.$executeRawUnsafe('CREATE DATABASE evolix_trade_dev;')
  .then(() => console.log('Database created'))
  .catch((e) => console.log(e.message))
  .finally(() => prisma.$disconnect());
