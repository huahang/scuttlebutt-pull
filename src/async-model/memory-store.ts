import i = require('iterate')
import * as u from '../utils'
import { AsyncModelStoreBase, Sources, Update, UpdateItems, ModelValueItems } from '../interfaces'

export class MemoryAsyncModelStore extends AsyncModelStoreBase {
  public store: { [key: string]: Update } = {}

  async init(): Promise<void> {
    // nothing to do here
  }

  async get(key: string): Promise<Update | undefined> {
    return this.store[key]
  }

  async set(key: string, update: Update): Promise<void> {
    this.store[key] = update
  }

  async history(sources: Sources, isAccepted?: (update: Update) => boolean): Promise<Update[]> {
    const h: Update[] = []
    i.each(this.store, function(update: Update) {
      if (isAccepted && !isAccepted(update)) return

      if (u.filter(update, sources)) {
        h.push(update)
      }
    })
    return u.sort(h)
  }

  async keys(): Promise<string[]> {
    const a = []
    for (let k in this.store) {
      const v = ((await this.get(k)) as Update)[UpdateItems.Data][ModelValueItems.Value]
      if (!u.isNil(v)) {
        a.push(k)
      }
    }
    return a
  }

  async toJSON(): Promise<Record<string, any>> {
    const o: Record<string, any> = {}
    const keys = await this.keys()
    for (let k of keys) {
      const v = ((await this.get(k)) as Update)[UpdateItems.Data][ModelValueItems.Value]
      if (!u.isNil(v)) {
        o[k] = v
      }
    }
    return o
  }
}
