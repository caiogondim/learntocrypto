var sodium = require('sodium-native')
var signature = process.argv[2]
var message = process.argv[3]
var publicKey = process.argv[4]

var isCorrect = sodium.crypto_sign_verify_detached(
  Buffer.from(signature, 'hex'),
  Buffer.from(message),
  Buffer.from(publicKey, 'hex')
)

console.log('correct:', isCorrect)
