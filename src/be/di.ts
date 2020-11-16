import { ipcMain } from 'electron'

import { ApiService } from './api';
import { DatabaseService } from "./database";

const databaseService = new DatabaseService()
export const getDatabaseService = (): DatabaseService => databaseService

const apiService = new ApiService({ databaseService, ipcMain })
export const getApiService = (): ApiService => apiService
