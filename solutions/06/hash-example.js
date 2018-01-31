const sodium = require('sodium-native')

const outputBuffer = Buffer.alloc(sodium.crypto_generichash_BYTES)
const inputBuffer = Buffer.from('Hello, World!')
sodium.crypto_generichash(outputBuffer, inputBuffer)
console.log(outputBuffer.toString('hex'))
