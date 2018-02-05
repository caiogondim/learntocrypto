var sodium = require('sodium-native')
var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
var signature = Buffer.alloc(sodium.crypto_sign_BYTES)
var message = process.argv[2]

sodium.crypto_sign_keypair(publicKey, secretKey)
sodium.crypto_sign_detached(signature, Buffer.from(message), secretKey)

console.log('message:', message)
console.log('signature:', signature.toString('hex'))
console.log('publicKey:', publicKey.toString('hex'))
