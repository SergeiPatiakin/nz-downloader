import util from 'util'
import path from 'path'
import fs from 'fs'

import moment from 'moment'
import { BrowserWindow, dialog, IpcMain } from 'electron'
import Imap from 'node-imap'
// eslint-disable-next-line
const MailParser = require('mailparser-mit').MailParser

import {
  JobCreateParams,
  JobCreateResult,
  DatabaseState,
  EmailStatus,
  ImapTestResult,
  Job,
  MailboxConfiguration,
  SaveLocation
} from '../iso/api-types'
import * as logger from './logger'
import { DatabaseService } from './database'
import { isRuleMatch } from './rules'
import { getSaveFileName } from './fs-utils'
import { getSearchCriteria } from './imap-utils'


export class ApiService {
  private jobIdSeq = 1
  private jobs: Array<Job> = []
  private mainWindow: BrowserWindow | undefined
  private databaseService: DatabaseService
  public setMainWindow = (mainWindow: BrowserWindow) => { this.mainWindow = mainWindow }

  private dbRead = async (event: any, arg: any): Promise<DatabaseState> => {
    logger.log('db-read', arg)
    const dbState = await this.databaseService.readDb()
    return dbState
  }

  private dbWrite = async (event: any, arg: DatabaseState): Promise<DatabaseState> => {
    logger.log('db-write', arg)
    await this.databaseService.writeDb(arg)
    return arg
  }

  private directoryDialogOpen = async (event: any, arg: DatabaseState): Promise<string> => {
    logger.log('directory-dialog-open', arg)
    if (this.mainWindow) {
      const r = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory', 'createDirectory']
      })
      if (r.filePaths.length === 0) {
        return ''
      } else {
        return r.filePaths[0]
      }
    } else {
      throw new Error('No mainWindowRef')
    }
  }

  private imapTest = async (event: any, arg: MailboxConfiguration): Promise<ImapTestResult> => {
    logger.log('imap-test', arg)
    const imap = new Imap({
      user: arg.emailAddress,
      password: arg.password,
      host: arg.imapHost,
      port: arg.imapPort,
      tls: true,
      tlsOptions: { servername: arg.imapHost },
    })
    return new Promise<string>((resolve, reject) => {
      imap.once('ready', async () => {
        try {
          const box = await util.promisify<string, Imap.Box>(imap.openBox.bind(imap))('INBOX')
          
          if (!box.persistentUIDs){
            throw new Error('Mailbox does not support persistent UIDs')
          }

          const searchCriteria = getSearchCriteria({
            fromFilter: arg.fromFilter,
            subjectFilter: arg.subjectFilter,
            cursor: arg.cursor
          })

          const uids: number[] = await util.promisify(imap.search.bind(imap))(searchCriteria)
          // IMAP will always return the last message, even if it outside the UID range.
          // ( https://stackoverflow.com/questions/34706633/imap-search-by-a-uid-range-on-exchange-server-seems-to-be-broken )
          // The next line accounts for this
          const uidsToProcess = uids.filter(u => arg.cursor.type === 'uid' ? u > arg.cursor.lastSeenUid : true)

          resolve(`Success. Found ${uidsToProcess.length} emails`)
        } catch (e) {
          reject(e)
        }
      })
      imap.once('error', (err: any) => {
        logger.log('IMAP error', err)
        reject(err)
      })
      imap.once('end', () => {
        logger.log('IMAP connection ended')
        // In the happy path this will be triggered but with no effect (as we will have already resolved)
        reject(new Error('Connection ended'))
      })
      imap.connect()
    })
    .then(s => ({ success: true, text: s}))
    .catch(e => ({ success: false, text: e.toString()}))
  }

  private jobRead = async (event: any, arg: number): Promise<Job> => {
    logger.log('job-read', arg)
    const job = this.jobs.find(j => j.id === arg)
    if (!job) {
      throw new Error('Job not found')
    }
    return job
  }

  private jobCancel = async (event: any, arg: number): Promise<void> => {
    logger.log('job-cancel', arg)
    const job = this.jobs.find(j => j.id === arg)
    if (job === undefined) {
      throw new Error('Job not found')
    }
    job.canceled = true
  }

  private jobCreate = async (event: any, arg: JobCreateParams): Promise<JobCreateResult> => {
    logger.log('job-create', arg)
    const dbState = await this.databaseService.readDb()
    const imap = new Imap({
      user: dbState.mailboxConfiguration.emailAddress,
      password: dbState.mailboxConfiguration.password,
      host: dbState.mailboxConfiguration.imapHost,
      port: dbState.mailboxConfiguration.imapPort,
      tls: true,
      tlsOptions: { servername: dbState.mailboxConfiguration.imapHost },
    })
    const jobId = this.jobIdSeq++
    const job: Job = {
      id: jobId,
      dryRun: arg.dryRun,
      completed: false,
      canceled: false,
      messages: [],
    }
    this.jobs.push(job)

    // start async processing
    new Promise<void>((resolve, reject) => {
      imap.once('ready', async () => {
        try {
          const box = await util.promisify<string, Imap.Box>(imap.openBox.bind(imap))('INBOX')
          
          if (!box.persistentUIDs){
            throw new Error('Mailbox does not support persistent UIDs')
          }

          const searchCriteria = getSearchCriteria(dbState.mailboxConfiguration)

          const uids: number[] = await util.promisify(imap.search.bind(imap))(searchCriteria)
          // IMAP will always return the last message, even if it outside the UID range.
          // The next line accounts for this
          const uidsToProcess = uids.filter(u => dbState.mailboxConfiguration.cursor.type === 'uid' ? u > dbState.mailboxConfiguration.cursor.lastSeenUid : true)

          let countFilesDownloaded = 0

          for (const uid of uidsToProcess) {
            if (job.canceled) {
              throw new Error('Canceled')
            }
            try {
              const rawMessage = await new Promise((resolve, reject) => {
                const f = imap.fetch(uid, {bodies: ''})
                f.on('message', msg => {
                  msg.on('body', (stream, info) => {
                    const chunkStrings: Array<string> = []
                    stream.on('data', chunk => {
                      chunkStrings.push(chunk.toString('utf8'))
                    })
                    stream.once('end', () => {
                      resolve(chunkStrings.join(''))
                    })
                  })
                })
              })
              
              type EmailInfo = {
                fromAddress: string
                fromName: string
                subject: string
                attachments: Array<{fileName: string, content: Buffer | string}>
              }

              const emailInfo: EmailInfo = await new Promise((resolve, reject) => {
                const mailparser = new MailParser()
                mailparser.on("end", function(mailObject: any){
                  resolve({
                    fromAddress: mailObject.from[0]?.address || '' as unknown as string,
                    fromName: mailObject.from[0]?.name || '' as unknown as string,
                    subject: mailObject.subject,
                    attachments: mailObject.attachments || [],
                  })
                });
                mailparser.on('error', (e: any) => reject(e))
                mailparser.write(rawMessage)
                mailparser.end()
              })

              const emailStatus: EmailStatus = {
                type: 'email-status',
                from: `${emailInfo.fromAddress} ${emailInfo.fromName}`,
                subject: emailInfo.subject,
                attachments: [],
              }
              
              for (const a of emailInfo.attachments) {
                const matchingRules = dbState.rules.filter(r => isRuleMatch(r, a))
                const saveLocations: SaveLocation[] = []
                for (const matchingRule of matchingRules) {
                  if (!fs.existsSync(matchingRule.destinationPath)) {
                    throw new Error(`No such directory: ${matchingRule.destinationPath}`)
                  }
                  for (let i = 1;; i++) {
                    const saveFileName = getSaveFileName(a.fileName, i)
                    const savePath = path.join(matchingRule.destinationPath, saveFileName)
                    if (fs.existsSync(savePath)) {
                      continue
                    }
                    if (!arg.dryRun) {
                      fs.writeFileSync(savePath, a.content)
                    }
                    const destinationDirname = path.dirname(savePath)
                    saveLocations.push({
                      directoryPath: destinationDirname,
                      filePath: savePath,
                    })
                    break
                  }
                }
                emailStatus.attachments.push({
                  fileName: a.fileName,
                  saveLocations,
                })
                if (saveLocations.length > 0) {
                  countFilesDownloaded++
                }
              }
              job.messages.push(emailStatus)
            } catch (e) {
              job.messages.push({
                type: 'error',
                message: e.toString(),
              })
            }
          }

          if (uidsToProcess.length > 0) {
            job.messages.push({
              type: 'success',
              message: `Processed ${uidsToProcess.length} emails. Processed ${countFilesDownloaded} attachments matching a rule`
            })
            if (!arg.dryRun) {
              // Update cursor in database state
              const dbState = await this.databaseService.readDb()
              dbState.mailboxConfiguration.cursor = {
                type: 'uid',
                lastSeenUid: Math.max(...uidsToProcess),
                lastSeenDatetime: moment().format(),
              }
              await this.databaseService.writeDb(dbState)
            }
          } else {
            job.messages.push({
              type: 'success',
              message: `Processed ${uidsToProcess.length} emails`
            })
          }

          resolve(undefined)
        } catch (e) {
          job.messages.push({
            type: 'error',
            message: String(e),
          })
          reject(e)
        }
      })
      imap.once('error', (err: any) => {
        logger.log('IMAP error', err)
        reject(err)
      })
      imap.once('end', () => {
        logger.log('IMAP connection ended')
        // In the happy path this will be triggered but with no effect (as we will have already resolved)
        reject(new Error('Connection ended'))
      })
      imap.connect()
    })
    .then(s => {
      job.completed = true
    })
    .catch(e => {
      job.completed = true
    })

    return { id: jobId }
  }

  constructor(deps: { databaseService: DatabaseService, ipcMain: IpcMain }) {
    this.databaseService = deps.databaseService
    deps.ipcMain.handle('db-read', this.dbRead)
    deps.ipcMain.handle('db-write', this.dbWrite)
    deps.ipcMain.handle('directory-dialog-open', this.directoryDialogOpen)
    deps.ipcMain.handle('imap-test', this.imapTest)
    deps.ipcMain.handle('job-read', this.jobRead)
    deps.ipcMain.handle('job-cancel', this.jobCancel)
    deps.ipcMain.handle('job-create', this.jobCreate)
  }
}

