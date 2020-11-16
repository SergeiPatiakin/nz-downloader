import { IpcMain } from "electron"
import { ApiService } from "../be/api"
import { DatabaseService } from "../be/database"
import { Job } from "../iso/api-types"

const createMockDatabaseService = (): DatabaseService => ({

} as any)

const createMockIpcMain = (): IpcMain => ({
  handle: jest.fn(),
} as any)

describe('ApiService', () => {
  it('service methods are wired to ipcMain', () => {
    const mockIpcMain = createMockIpcMain()
    const apiService = new ApiService({
      databaseService: createMockDatabaseService(),
      ipcMain: mockIpcMain,
    })
    expect((mockIpcMain as any).handle.mock.calls.map((args: any[]) => args[0])).toContain('db-read')
    expect((mockIpcMain as any).handle.mock.calls.map((args: any[]) => args[0])).toContain('db-write')
    expect((mockIpcMain as any).handle.mock.calls.map((args: any[]) => args[0])).toContain('job-create')
  })
  it('ApiService.jobRead reads a job', async () => {
    const apiService = new ApiService({
      databaseService: createMockDatabaseService(),
      ipcMain: createMockIpcMain(),
    })
    ;(apiService as any).jobs.push({
      id: 101,
      dryRun: false,
      completed: false,
      canceled: false,
      messages: [{
        type: 'success',
        message: 'Job 101 success',
      }],
    } as Job)
    ;(apiService as any).jobs.push({
      id: 102,
      dryRun: false,
      completed: false,
      canceled: false,
      messages: [{
        type: 'success',
        message: 'Job 102 success',
      }],
    } as Job)
    const r: Job = await (apiService as any).jobRead(undefined, 102)
    expect(r).toBeTruthy()
    expect(r.id).toBe(102)
    expect((r.messages[0] as any).message).toBe('Job 102 success')
  })
  it('ApiService.jobCancel cancels a job', async () => {
    const apiService = new ApiService({
      databaseService: createMockDatabaseService(),
      ipcMain: createMockIpcMain(),
    })
    ;(apiService as any).jobs.push({
      id: 101,
      dryRun: false,
      completed: false,
      canceled: false,
      messages: [{
        type: 'success',
        message: 'Job 101 success',
      }],
    } as Job)
    ;(apiService as any).jobs.push({
      id: 102,
      dryRun: false,
      completed: false,
      canceled: false,
      messages: [],
    } as Job)
    const r: Job | undefined = await (apiService as any).jobCancel(undefined, 102)
    expect((apiService as any).jobs[1].canceled).toBe(true)
  })
})
