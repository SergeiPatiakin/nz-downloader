import { ipcRenderer, shell } from "electron"
import { default as React, useState } from "react"
import styled from "styled-components"

import { JobCreateParams, JobCreateResult, DatabaseState, Job } from "../../iso/api-types"
import { ButtonGroupSt, GreenButtonSt, MainPaneSt, RedButtonSt, YellowButtonSt } from "../common"
import playImg from '../assets/play.png'
import stopImg from '../assets/stop.png'

interface Props {
  dbState: DatabaseState
  setDbState: (dbState: DatabaseState) => void
  setNavigationEnabled: (navigationEnabled: boolean) => void
}

const EmailStatusDivSt = styled.div`
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  background-color: white;
  border: 1px solid black;
  width: calc(100% - 8px);
  padding: 8px;
  font-size: 12px;
`

const EmailDetailContainer = styled.div`
  display: flex;
`

const EmailDetailCell = styled.div`

`

const ErrorStatusDivSt = styled.div`
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  background-color: pink;
  border: 1px solid black;
  width: calc(100% - 8px);
  padding-left: 8px;
  font-size: 12px;
`

const SuccessStatusDivSt = styled.div`
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  background-color: lightgreen;
  border: 1px solid black;
  width: calc(100% - 8px);
  padding-left: 8px;
  font-size: 12px;
`

const StatusPreSt = styled.pre``

const AttachmentStatusDivSt = styled.div`
  border-radius: 4px;
  margin-bottom: 4px;
  position: relative;
  background-color: white;
  border: 1px solid black;
  width: calc(100% - 8px);
  padding-left: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
`

const AttachmentStatusFilenamePSt = styled.p`
  margin-top: 0px;
  margin-bottom: 0px;
`

const AttachmentStatusDirPSt = styled.p`
  margin-top: 0px;
  margin-bottom: 0px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

const ruleCountToColors = (ruleCount: number): { backgroundColor: string, color: string } => {
  if (ruleCount <= 0) {
    return { backgroundColor: 'white', color: 'black' }
  }
  if (ruleCount <= 1) {
    return { backgroundColor: 'lightgreen', color: 'black' }
  }
  return { backgroundColor: 'green', color: 'white' }
}

export const StartPage = (props: Props) => {
  const [job, setJob] = useState<Job | undefined>()

  return <MainPaneSt>
    <ButtonGroupSt>
      <RedButtonSt 
        style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(job && !job.completed ? {} : { backgroundColor: 'gray', cursor: 'default'}),
        }}
        onClick={() => {
          if (!(job && !job.completed)) {
            return
          }
          ipcRenderer.invoke('job-cancel', job.id)
        }}
      >
        <img src={stopImg} width="24px" height="24px" style={job && !job.completed ? {} : { opacity: '0.5' }} />
        Stop
      </RedButtonSt>
      <YellowButtonSt 
        style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(job && !job.completed ? { backgroundColor: 'gray', cursor: 'wait'} : {}),
        }}
        onClick={() => {
          if (job && !job.completed) {
            return
          }
          const params: JobCreateParams = { dryRun: true }
          setJob(undefined)
          ipcRenderer.invoke('job-create', params).then(async (r: JobCreateResult) => {
            props.setNavigationEnabled(false)
            while (true) {
              await new Promise (resolve => setTimeout(resolve, 500))
              const job = await ipcRenderer.invoke('job-read', r.id) as Job
              setJob(job)
              if (job.completed) {
                break
              }
            }
            props.setNavigationEnabled(true)
          })
        }}
      >
        <img src={playImg} width="24px" height="24px" style={job && !job.completed ? { opacity: '0.5' } : {}} />
        Preview
      </YellowButtonSt>
      <GreenButtonSt
        style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(job && !job.completed ? { backgroundColor: 'gray', cursor: 'wait'} : {}),
        }}
        onClick={() => {
          if (job && !job.completed) {
            return
          }
          const params: JobCreateParams = { dryRun: false }
          setJob(undefined)
          ipcRenderer.invoke('job-create', params).then(async (r: JobCreateResult) => {
            props.setNavigationEnabled(false)
            while (true) {
              await new Promise (resolve => setTimeout(resolve, 500))
              const job = await ipcRenderer.invoke('job-read', r.id) as Job
              setJob(job)
              if (job.completed) {
                break
              }
            }
            // Refresh database state
            const dbState = await ipcRenderer.invoke('db-read') as DatabaseState
            props.setDbState(dbState)

            props.setNavigationEnabled(true)
          })
        }}
      >
        <img src={playImg} width="24px" height="24px" style={job && !job.completed ? { opacity: '0.5' } : {}} />
        Run
      </GreenButtonSt>
    </ButtonGroupSt>
    <div style={{ marginBottom: '8px'}} />
    {job && job.messages.map((s, sIdx) => {
      if (s.type === 'success') {
        return <SuccessStatusDivSt key={sIdx}>
          <StatusPreSt>{s.message}</StatusPreSt>
        </SuccessStatusDivSt>
      }
      if (s.type === 'error') {
        return <ErrorStatusDivSt key={sIdx}>
          <StatusPreSt>{s.message}</StatusPreSt>
        </ErrorStatusDivSt>
      }
      if (s.type === 'email-status') {
        return <EmailStatusDivSt key={sIdx}>
          <EmailDetailContainer>
            <EmailDetailCell style={{ width: '50px' }}>From:</EmailDetailCell>
            <EmailDetailCell style={{ flexGrow: 1 }}>{s.from}</EmailDetailCell>
          </EmailDetailContainer>
          <EmailDetailContainer style={{ marginBottom: '4px'}}>
            <EmailDetailCell style={{ width: '50px' }}>Subject:</EmailDetailCell>
            <EmailDetailCell style={{ flexGrow: 1 }}>{s.subject}</EmailDetailCell>
          </EmailDetailContainer>
          {s.attachments.map((a, aIdx) => {
            const { backgroundColor, color } = ruleCountToColors(a.saveLocations.length)
            return <AttachmentStatusDivSt key={aIdx} style={{ backgroundColor, color }}>
              <AttachmentStatusFilenamePSt>{a.fileName}</AttachmentStatusFilenamePSt>
              {a.saveLocations.map((saveLocation, idx) => 
                <AttachmentStatusDirPSt key={idx} onClick={() => {
                  if (job.dryRun) {
                    shell.openPath(saveLocation.directoryPath)
                  } else {
                    shell.showItemInFolder(saveLocation.filePath)
                  }
                }}>→ {saveLocation.directoryPath}</AttachmentStatusDirPSt>
              )}
            </AttachmentStatusDivSt>
          })}
        </EmailStatusDivSt>
      }
    })}
  </MainPaneSt>
}
