const ratlog = require('../index')

const main = () => {
  const log = ratlog(process.stdout)

  log('app starting')

  startCounter({
    max: 2,
    log: log.tag('counter'),
    done: () => {
      log('app shutting down')
    }
  })

  log('app ready')
}

const startCounter = ({ max = 0, interval = 3000, log, done }) => {
  log('starting')

  const count = (x = 1) => {
    if (x > max) {
      log('stopped')
      done()
      return
    }

    log('counting', { count: x }, 'event')

    setTimeout(count, interval, x + 1)
  }

  log('started')

  // Run async after init is done
  setImmediate(count)
}

main()
