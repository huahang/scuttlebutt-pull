import { AsyncModel, link } from '../src'
import { delay, printAsyncKeyValue } from './utils'

const main = async function() {
  const a = new AsyncModel({ id: 'A', logger: false })
  const b = new AsyncModel({ id: 'B', logger: false, accept: { whitelist: ['foo'] } })

  // in a <-> b relationship, a is read-only and b is write-only
  const s1 = a.createStream({ name: 'a->b', logger: false })
  const s2 = b.createStream({ name: 'b->a', logger: false })

  console.log(`--- set 'foo'@${a.id}`)
  await a.set('foo', 'changed by A')

  link(s1, s2)

  await printAsyncKeyValue(a, 'foo')
  await printAsyncKeyValue(b, 'foo')

  console.log(`--- set 'foo'@${b.id}`)
  await b.set('foo', 'changed by B')

  await printAsyncKeyValue(a, 'foo')

  console.log(`--- set 'ignored'@${a.id}`)
  await a.set('ignored', 'changed by A')
  await printAsyncKeyValue(a, 'ignored')

  console.log(`--- key 'ignored' is not in B's whitelist`)
  await printAsyncKeyValue(b, 'ignored')
}

main()
