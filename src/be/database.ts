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

class DatabaseLock {}

export class DatabaseService {
  private initialiazationStatus:
    | { type: 'NotInitialized' }
    | { type: 'Initializing', callbacks: Array<() => void> }
    | { type: 'Initialized' } = { type: 'NotInitialized' }
  
  private lockStatus:
    | { type: 'Unlocked' }
    | { type: 'Locked', lock: DatabaseLock, callbacks: Array<() => void> } = { type: 'Unlocked' }
  
  public async takeLock(): Promise<DatabaseLock> {
    if (this.lockStatus.type === 'Unlocked') {
      const lock = new DatabaseLock()
      this.lockStatus = { type: 'Locked', lock, callbacks: []}
      return lock
    } else {
      // Wait our turn
      await new Promise(res => (this.lockStatus as any).callbacks.push(res))
      const lock = new DatabaseLock()
      this.lockStatus = { type: 'Locked', lock, callbacks: []}
      return lock
    }
  }

  public releaseLock(lock: DatabaseLock) {
    if (this.lockStatus.type === 'Unlocked') {
      throw new Error('Cannot release lock. No lock was taken')
    } else {
      if (this.lockStatus.lock !== lock) {
        throw new Error('Cannot release lock. Another lock was taken')
      }
      if (this.lockStatus.callbacks.length === 0) {
        this.lockStatus = { type: 'Unlocked' }
      } else {
        const nextCallback = this.lockStatus.callbacks.shift()!
        // Fire and forget
        new Promise(() => nextCallback())
      }
    }
  }
  
  private async initialize() {
    this.initialiazationStatus = { type: 'Initializing', callbacks: []}
    if (!fs.existsSync(databasePath)) {
      // writeDb inlined
      await this._writeDb(getInitialState())
    } else {
      // Increment init count
      const state = await this._readDb()
      state.initCount++
      await this._writeDb(state)
    }
    const callbacks = this.initialiazationStatus.callbacks
    this.initialiazationStatus = { type: 'Initialized' }
    callbacks.forEach(c => c())
  }
  public async ensureInitialized() {
    if (this.initialiazationStatus.type === 'NotInitialized') {
      await this.initialize()
    } else if (this.initialiazationStatus.type === 'Initializing') {
      await new Promise(res => (this.initialiazationStatus as any).callbacks.push(res))
    } else {
      return
    }
  }
  // No initialization check or lock management
  private async _writeDb(state: DatabaseState): Promise<void> {
    await util.promisify(fs.writeFile)(databasePath, JSON.stringify(state, null, 4))
  }
  // Will take and release a lock if none is explicitly passed
  public async writeDb(state: DatabaseState, lock?: DatabaseLock): Promise<void> {
    await this.ensureInitialized()
    let usedLock: DatabaseLock
    if (!lock) {
      usedLock = await this.takeLock()
    } else {
      usedLock = lock
    }
    try {
      return this._writeDb(state)
    } finally {
      if (!lock) {
        this.releaseLock(usedLock)
      }
    }
  }
  // No initialization check or lock management
  public async _readDb(): Promise<DatabaseState> {
    const content = await util.promisify(fs.readFile)(databasePath, 'utf8')
    const json = JSON.parse(content)
    const decodeResult = DatabaseStateCodec.decode(json)
    if (E.isLeft(decodeResult)) {
      throw new Error(`Error decoding DatabaseState: ${failure(decodeResult.left)}`)
    }
    return decodeResult.right
  }
  // Will take and release a lock if none is explicitly passed
  public async readDb(lock?: DatabaseLock): Promise<DatabaseState> {
    await this.ensureInitialized()
    let usedLock: DatabaseLock
    if (!lock) {
      usedLock = await this.takeLock()
    } else {
      usedLock = lock
    }
    try {
      return this._readDb()
    } finally {
      if (!lock) {
        this.releaseLock(usedLock)
      }
    }
  }
  // Will take and release a lock if none is explicitly passed
  public async resetDb(lock?: DatabaseLock) {
    await this.ensureInitialized()
    await this.writeDb(getInitialState(), lock)
  }
}
