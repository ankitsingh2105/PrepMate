# HTTPS Setup for WebRTC Development

## Why HTTPS is Required

WebRTC's `getUserMedia()` (camera/microphone access) requires a **secure context** (HTTPS) in modern browsers. This is why:

- ✅ **prepmate.in** works (HTTPS)
- ❌ **localhost** doesn't work (HTTP)

## Quick Setup (Choose One Method)

### Method 1: Using mkcert (Recommended - Easier)

1. **Install mkcert**:
   ```bash
   # Windows (using chocolatey)
   choco install mkcert
   
   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Install the root certificate**:
   ```bash
   mkcert -install
   ```

3. **Generate localhost certificate**:
   ```bash
   mkcert localhost
   ```

4. **Move certificates to certs folder**:
   ```bash
   mkdir certs
   move localhost.pem certs/
   move localhost-key.pem certs/
   ```

### Method 2: Using OpenSSL (Manual)

1. **Run the certificate generator**:
   ```bash
   npm run generate-certs
   ```

2. **If OpenSSL is not installed**:
   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
   - macOS: `brew install openssl`
   - Linux: `sudo apt-get install openssl`

## Running the HTTPS Server

1. **Generate certificates first** (if not done):
   ```bash
   npm run generate-certs
   ```

2. **Start HTTPS server**:
   ```bash
   npm run start:https
   ```

3. **Access your app**:
   - Backend: https://localhost:3000
   - Frontend: https://localhost:5173 (if using Vite with HTTPS)

## Frontend HTTPS Setup (Vite)

If you want your frontend to also use HTTPS, update your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    https: true,
    host: 'localhost',
    port: 5173
  }
})
```

## Troubleshooting

### Certificate Errors
- **"Not Secure" warning**: This is normal for localhost development
- **Click "Advanced" → "Proceed to localhost"** in your browser
- **Accept the certificate** when prompted

### Port Already in Use
- Change the port in `https-server.js`:
  ```javascript
  httpsServer.listen(3001, () => {
    console.log("🚀 HTTPS Server listening on port 3001");
  });
  ```

### Browser Still Blocking Camera
- Make sure you're using `https://` not `http://`
- Check browser console for security errors
- Try a different browser (Chrome/Edge work best)

## Production vs Development

- **Development**: Use self-signed certificates (localhost)
- **Production**: Use proper SSL certificates (Let's Encrypt, etc.)

## Security Note

⚠️ **Never use self-signed certificates in production!** These are only for local development.

## Quick Test

1. Start HTTPS server: `npm run start:https`
2. Open https://localhost:3000 in browser
3. Accept the security warning
4. Test WebRTC - camera/microphone should now work!

## Alternative: Use HTTP for Development Only

If you don't want to set up HTTPS, you can temporarily disable the security requirement:

```javascript
// In your browser console (NOT recommended for production)
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || 
  navigator.mediaDevices.webkitGetUserMedia || 
  navigator.mediaDevices.mozGetUserMedia;
```

**Note**: This only works in some browsers and is not recommended for production use.
