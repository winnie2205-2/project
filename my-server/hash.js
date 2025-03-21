const bcrypt = require('bcryptjs');

async function hashPassword() {
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('🔒 Hashed Password:', hashedPassword);
}

hashPassword();
