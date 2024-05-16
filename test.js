// use of aes


import jose from "jose";

// Generate encryption key
const key = await jose.JWK.generate('oct', 256);

// Encrypt JWT
const jwt = 'your.jwt.token';
const encryptedJWT = await new jose.EncryptJWT({ jwt })
  .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
  .encrypt(key);

// Decrypt JWT
const decryptedJWT = await jose.jwtDecrypt(encryptedJWT, key);
console.log(decryptedJWT);


