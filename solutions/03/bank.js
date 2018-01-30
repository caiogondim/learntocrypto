var jsonStream = require('duplex-json-stream')
var net = require('net')

var log = []

var server = net.createServer(async function (socket) {
  socket = jsonStream(socket)

  socket.on('data', function (msg) {
    console.log('Bank received:', msg)

    switch (msg.cmd) {
      case 'balance':
        socket.end({cmd: 'balance', balance: getBalance()})
        break
      case 'deposit':
        log.push(msg)
        socket.end({cmd: 'balance', balance: getBalance()})
        break
      case 'withdraw':
        try {
          withdraw(msg.amount)
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

function getBalance() {
  return log.reduce((sum, entry) => {
    if (entry.cmd === 'deposit') {
      return sum + entry.amount
    } else if (entry.cmd === 'withdraw') {
      return sum - entry.amount
    }
  }, 0)
}

function withdraw(amount) {
  amount = parseFloat(amount)

  var curBalance = getBalance()

  if (curBalance < amount) {
    throw new Error('Insuficient funds')
  }

  log.push({
    cmd: 'withdraw',
    amount
  })
}

