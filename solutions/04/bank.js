var jsonStream = require('duplex-json-stream')
var net = require('net')
var util = require('util')
var writeFile = util.promisify(require('fs').writeFile)

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
  var log = require('./log.json')

  return log.reduce((sum, entry) => {
    if (entry.cmd === 'deposit') {
      return sum + entry.amount
    } else if (entry.cmd === 'withdraw') {
      return sum - entry.amount
    }
  }, 0)
}

async function deposit(amount) {
  amount = parseFloat(amount)

  var log = require('./log.json')
  log.push({
    cmd: 'deposit',
    amount
  })

  await writeFile(
    __dirname + '/log.json',
    JSON.stringify(log, null, 2)
  )
}

async function withdraw(amount) {
  amount = parseFloat(amount)

  var curBalance = await getBalance()

  if (curBalance < amount) {
    throw new Error('Insuficient funds')
  }

  var log = require('./log.json')
  log.push({
    cmd: 'withdraw',
    amount
  })

  await writeFile(
    __dirname + '/log.json',
    JSON.stringify(log, null, 2)
  )
}

