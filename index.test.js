import https from 'https'
import fs from 'fs'
import path from 'path'
import pump from 'pump'
import test from 'ava'
import ratlog from './index'

const testsuiteURL = 'https://raw.githubusercontent.com/ratlog/ratlog-spec/master/ratlog.testsuite.json'
const specFile = path.join(__dirname, 'spec.json')

let testcases

function loadTestcases (cb) {
  fs.readFile(specFile, 'utf8', (err, contents) => {
    if (err) return cb(err)
    testcases = JSON.parse(contents).generic
    cb()
  })
}

test.serial.before.cb('ensure spec.json exists', t => {
  fs.stat(specFile, err => {
    if (!err) return loadTestcases(t.end)
    console.log('downloading spec.json ...')
    https.get(testsuiteURL, res => {
      pump(res, fs.createWriteStream(specFile), () => {
        console.log('download done.')
        loadTestcases(t.end)
      })
    })
  })
})

test.serial(`testing spec.json cases correctly`, t => {
  t.plan(testcases.length)

  testcases.forEach(({data, log}) => {
    const write = line => {
      t.is(line, log, 'Input:\n\n' + JSON.stringify(data, null, 2))
    }
    const l = ratlog(write)
    l(data.message, data.fields, ...(data.tags || []))
  })
})

test('initial tag', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[tag|x|y] msg | a: 1 | b: 2\n')
  }

  const l = ratlog(write, 'tag')

  l('msg', { a: 1, b: 2 }, 'x', 'y')
})

test('tags only', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[x|y] msg\n')
  }

  const l = ratlog(write)
  l('msg', 'x', 'y')
})

test('one tag only', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[tag] msg\n')
  }

  const l = ratlog(write)

  l('msg', 'tag')
})

test('.tag()', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[a|b|x|y] msg | a: 1 | b: 2\n')
  }

  const l = ratlog(write).tag('a', 'b')

  l('msg', { a: 1, b: 2 }, 'x', 'y')
})

test('.tag().tag()', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[1|2|3|x|y] msg | a: 1 | b: 2\n')
  }

  const l = ratlog(write).tag(1).tag('2', 3)

  l('msg', { a: 1, b: 2 }, 'x', 'y')
})

test('transform using .logger()', t => {
  t.plan(1)

  const write = line => {
    t.is(line, '[x|y] msg | a: 1 | b: 2 | c\n')
  }

  const transform = log => write(ratlog.stringify({
    message: 'msg',
    tags: log.tags,
    fields: log.fields
  }))

  const l = ratlog.logger(transform)

  l('hey\nhey', { a: 1, b: 2, c: undefined }, ...'x', 'y')
})
