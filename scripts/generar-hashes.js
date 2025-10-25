const bcrypt = require('bcryptjs');

async function generarHashes() {
  const usuarios = [
    { username: 'admin', password: 'admin' },
    { username: 'cfernandez', password: 'carlos123' },
    { username: 'mgonzalez', password: 'maria123' },
    { username: 'pramirez', password: 'pedro123' },
    { username: 'amartinez', password: 'ana123' }
  ];

  console.log('Generando hashes bcrypt...\n');

  for (const user of usuarios) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`${user.username} (password: ${user.password}):`);
    console.log(`"passwordHash": "${hash}"`);
    console.log('');
  }
}

generarHashes().catch(console.error);
