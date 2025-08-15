const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating SSL certificates for localhost...');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
    console.log('📁 Created certs directory');
}

try {
    // Generate private key
    console.log('🔑 Generating private key...');
    execSync('openssl genrsa -out certs/localhost-key.pem 2048', { stdio: 'inherit' });
    
    // Generate certificate signing request
    console.log('📝 Generating certificate signing request...');
    execSync('openssl req -new -key certs/localhost-key.pem -out certs/localhost.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
    
    // Generate self-signed certificate
    console.log('✅ Generating self-signed certificate...');
    execSync('openssl x509 -req -in certs/localhost.csr -signkey certs/localhost-key.pem -out certs/localhost.pem -days 365', { stdio: 'inherit' });
    
    // Clean up CSR file
    fs.unlinkSync(path.join(certsDir, 'localhost.csr'));
    
    console.log('🎉 SSL certificates generated successfully!');
    console.log('📁 Files created:');
    console.log('   - certs/localhost-key.pem (private key)');
    console.log('   - certs/localhost.pem (certificate)');
    console.log('');
    console.log('🚀 You can now run: node https-server.js');
    console.log('🔒 Access your app at: https://localhost:3000');
    
} catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    console.log('');
    console.log('💡 Alternative: Use mkcert (easier)');
    console.log('1. Install mkcert: https://github.com/FiloSottile/mkcert');
    console.log('2. Run: mkcert -install');
    console.log('3. Run: mkcert localhost');
    console.log('4. Rename the generated files to localhost.pem and localhost-key.pem');
}
