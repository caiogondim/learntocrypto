var jsonStream = require('duplex-json-stream')
var net = require('net')
var util = require('util')
var writeFile = util.promisify(require('fs').writeFile)
var log = require('./log.json')

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

  log.push({
    cmd: 'deposit',
    value
  })

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

  log.push({
    cmd: 'withdraw',
    value: value * -1
  })

  await writeFile(
    __dirname + '/log.json',
    JSON.stringify(log, null, 2)
  )
}

