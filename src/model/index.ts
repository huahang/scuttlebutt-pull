import Scuttlebutt from '..'

import i = require('iterate')
import * as u from '../utils'

import {
  ScuttlebuttOptions,
  Sources,
  Update,
  UpdateItems,
  ModelValueItems,
  ModelAccept
} from '../interfaces'

class Model extends Scuttlebutt {
  public store: { [key: string]: Update } = {}

  constructor(opts?: ScuttlebuttOptions | string) {
    super(opts)
  }

  set(k: string, v: any) {
    this.logger.info(`set('${k}', '${v}]')`)

    if (k === '__proto__') {
      return u.protoIsIllegal(this)
    }
    this.localUpdate([k, v])
    return this
  }

  get(k: string, withClock = false) {
    if (k === '__proto__') {
      return u.protoIsIllegal(this)
    }

    if (this.store[k]) {
      return withClock ? this.store[k] : this.store[k][UpdateItems.Data][ModelValueItems.Value]
    }
  }

  keys() {
    const a = []
    for (let k in this.store) {
      const v = this.get(k)
      if (!u.isNil(v)) {
        a.push(k)
      }
    }
    return a
  }

  applyUpdate(update: Update) {
    const key = update[UpdateItems.Data][ModelValueItems.Key]
    if ('__proto__' === key) {
      u.protoIsIllegal(this)
      return false
    }

    // ignore if we already have a more recent value
    if (
      'undefined' !== typeof this.store[key] &&
      this.store[key][UpdateItems.Timestamp] > update[UpdateItems.Timestamp]
    ) {
      this.emit('_remove', update)
      return false
    }

    if (this.store[key]) {
      this.emit('_remove', this.store[key])
    }

    this.store[key] = update

    this.emit.apply(this, ['update', update])
    this.emit('change', key, update[UpdateItems.Data][ModelValueItems.Value])
    this.emit('change:' + key, update[UpdateItems.Data][ModelValueItems.Value])

    return true
  }

  isAccepted(peerAccept: ModelAccept, update: Update) {
    const { blacklist, whitelist } = peerAccept
    const key = update[UpdateItems.Data][ModelValueItems.Key]
    if (blacklist && Array.isArray(blacklist)) {
      if (blacklist.includes(key)) {
        return false
      }
    }
    if (whitelist && Array.isArray(whitelist)) {
      return whitelist.includes(key) ? true : false
    }
    return true
  }

  history(peerSources: Sources, peerAccept?: ModelAccept) {
    const h: Update[] = []
    const self = this
    i.each(this.store, function(update: Update) {
      if (peerAccept && !self.isAccepted(peerAccept, update)) {
        return
      }
      if (u.filter(update, peerSources)) {
        h.push(update)
      }
    })
    this.logger.debug('  length:', h.length, h)
    return u.sort(h)
  }

  toJSON() {
    const o: Record<string, any> = {}
    for (let k in this.store) {
      const v = this.get(k)
      if (!u.isNil(v)) {
        o[k] = v
      }
    }
    return o
  }
}

export { Model }
