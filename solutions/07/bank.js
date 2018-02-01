var jsonStream = require('duplex-json-stream')
var net = require('net')
var util = require('util')
var writeFile = util.promisify(require('fs').writeFile)
var sodium = require('sodium-native')
var log = require('./log.json')
const genesisHash = Buffer.alloc(32).toString('hex')

verifyLogIntegrity(log)

var server = net.createServer(function (socket) {
  socket = jsonStream(socket)

  socket.on('data', async function (msg) {
    console.log('Bank received:', msg)

    switch (msg.cmd) {
      case 'balance':
        socket.end({cmd: 'balance', balance: await getBalance()})
        break
      case 'deposit':
        await deposit(msg.amount)
        socket.end({cmd: 'balance', balance: await getBalance()})
        break
      case 'withdraw':
        try {
          await withdraw(msg.amount)
          socket.end({cmd: 'withdraw', amount: msg.amount})
          break
        } catch (error) {
          socket.end({
            cmd: 'withdraw',
            amount: msg.amount,
            error: error.message
          })
        }
        break
      default:
        socket.end({cmd: 'error', msg: 'Unknown command'})
        break
    }
  })
})

server.listen(3876)

async function getBalance() {
  return log.reduce((sum, entry) => sum + entry.value, 0)
}

async function deposit(value) {
  value = parseFloat(value)

  appendToTransactionLog(value)

  await writeFile(
    __dirname + '/log.json',
    JSON.stringify(log, null, 2)
  )
}

async function withdraw(value) {
  value = parseFloat(value)

  var curBalance = await getBalance()

  if (curBalance < value) {
    throw new Error('Insuficient funds')
  }

  appendToTransactionLog(value * -1)

  await writeFile(
    __dirname + '/log.json',
    JSON.stringify(log, null, 2)
  )
}

function hashToHex(input) {
  const inputBuffer = Buffer.from(input)
  const outputBuffer = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(outputBuffer, inputBuffer)
  return outputBuffer.toString('hex')
}

function appendToTransactionLog(value) {
  const prevHash = log.length ? log[log.length - 1].hash : genesisHash

  log.push({
    value: value,
    hash: hashToHex(prevHash + JSON.stringify(value))
  })
}

function verifyLogIntegrity(log) {
  const lastHash = log[log.length - 1].hash

  const computedHash = log.reduce((prevHash, entry) => {
    const curHash = hashToHex(prevHash + JSON.stringify(entry.value))

    if (curHash !== entry.hash) {
      throw new Error('Log is inconsistent.')
    }

    return curHash
  }, genesisHash)

  if (computedHash !== lastHash) throw new Error('Log is inconsistent.')
}
