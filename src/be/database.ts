import path from 'path'
import util from 'util'
import fs from 'fs'

import { app } from 'electron'
import moment from 'moment'
import * as E from 'fp-ts/Either'
import { failure } from 'io-ts/PathReporter'

import { DatabaseState, DatabaseStateCodec } from '../iso/api-types'

const databasePath = path.join(app.getPath('userData'), 'db.json')

const getInitialState = (): DatabaseState => ({
  migrationVersion: 1,
  initCount: 1,
  mailboxConfiguration: {
    emailAddress: '',
    password: '',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    fromFilter: '',
    subjectFilter: '',
    cursor: {
      type: 'date',
      dateString: moment.utc().format('YYYY-MM-DD'),
    },
  },
  rules: [],
  ruleIdSeq: 1,
})

export class DatabaseService {
  private status:
    | { type: 'NotInitialized' }
    | { type: 'Initializing', callbacks: Array<() => void> }
    | { type: 'Initialized' } = { type: 'NotInitialized' }
  
  private async initialize() {
    this.status = { type: 'Initializing', callbacks: []}
    if (!fs.existsSync(databasePath)) {
      // writeDb inlined
      await this._writeDb(getInitialState())
    } else {
      // Increment init count
      const state = await this._readDb()
      state.initCount++
      await this._writeDb(state)
    }
    const callbacks = this.status.callbacks
    this.status = { type: 'Initialized' }
    callbacks.forEach(c => c())
  }
  public async ensureInitialized() {
    if (this.status.type === 'NotInitialized') {
      await this.initialize()
    } else if (this.status.type === 'Initializing') {
      await new Promise(res => (this.status as any).callbacks.push(res))
    } else {
      return
    }
  }
  // Skip initialization check
  private async _writeDb(state: DatabaseState): Promise<void> {
    await util.promisify(fs.writeFile)(databasePath, JSON.stringify(state, null, 4))
  }
  public async writeDb(state: DatabaseState): Promise<void> {
    await this.ensureInitialized()
    return this._writeDb(state)
  }
  // Skip initialization check
  public async _readDb(): Promise<DatabaseState> {
    const content = await util.promisify(fs.readFile)(databasePath, 'utf8')
    const json = JSON.parse(content)
    const decodeResult = DatabaseStateCodec.decode(json)
    if (E.isLeft(decodeResult)) {
      throw new Error(`Error decoding DatabaseState: ${failure(decodeResult.left)}`)
    }
    return decodeResult.right
  }  
  public async readDb(): Promise<DatabaseState> {
    await this.ensureInitialized()
    return this._readDb()
  }
  public async resetDb() {
    await this.ensureInitialized()
    await this.writeDb(getInitialState())
  }
}
