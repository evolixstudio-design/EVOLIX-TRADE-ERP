const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Qusai5253@127.0.0.1:5432/postgres'
  });
  await client.connect();
  try {
    await client.query('CREATE DATABASE evolix_trade_dev;');
    console.log('Database created');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('Database already exists');
    } else {
      console.error(e);
    }
  }
  await client.end();
}

main();
