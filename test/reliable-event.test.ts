import { ReliableEvent, link } from '../src'
import { delay } from './utils'

jest.setTimeout(1000)

describe('reliable-event', () => {
  it('local event', () => {
    const A = new ReliableEvent('A')
    const fired = jest.fn()
    const generalEventCallback = jest.fn()
    A.on('a', fired)
    A.on('__fired__', generalEventCallback)
    A.push('a', 'aardvark')
    expect(fired).toHaveBeenCalledWith('aardvark')
    expect(generalEventCallback).toHaveBeenCalledWith('a', 'aardvark')
  })

  it('remote event', async () => {
    const A = new ReliableEvent('A')
    const B = new ReliableEvent('B')

    const s1 = A.createStream({ name: 'a->b' })
    const s2 = B.createStream({ name: 'b->a' })

    link(s1, s2)

    const aFired = jest.fn()
    const bFired = jest.fn()

    A.on('a', aFired)
    B.on('a', bFired)

    const data = {
      A: ['a1', 'a2', 'a3'],
      B: ['b1', 'b2', 'b3'],
    }
    data.A.forEach((v) => A.push('a', v))
    data.B.forEach((v) => B.push('a', v))

    await delay(200)

    expect(aFired).toHaveBeenCalledTimes(data.A.concat(data.B).length)
    data.A.forEach((v, i) => expect(aFired).toHaveBeenNthCalledWith(i + 1, v))

    expect(bFired).toHaveBeenCalledTimes(data.A.concat(data.B).length)
    data.B.forEach((v, i) => expect(bFired).toHaveBeenNthCalledWith(data.A.length + i + 1, v))
  })

  it('isAccepted', async () => {
    const accept = { whitelist: ['a'] }
    const A = new ReliableEvent('A')
    const B = new ReliableEvent({ id: 'B', accept })

    const s1 = A.createStream({ name: 'a->b' })
    const s2 = B.createStream({ name: 'b->a' })

    link(s1, s2)

    const aFiredA = jest.fn()
    const aFiredB = jest.fn()
    const bFiredA = jest.fn()
    const bFiredB = jest.fn()

    A.on('a', aFiredA)
    A.on('b', aFiredB)

    B.on('a', bFiredA)
    B.on('b', bFiredB)

    A.push('a', 1)
    A.push('b', 1)

    await delay(50)

    expect(aFiredA).toHaveBeenCalled()
    expect(aFiredB).toHaveBeenCalled()
    expect(bFiredA).toHaveBeenCalled()
    expect(bFiredB).toBeCalledTimes(0)
  })
})
