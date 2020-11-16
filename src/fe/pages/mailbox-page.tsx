import moment from 'moment'
import * as React from 'react'
import { useState } from 'react'
import styled from 'styled-components'
import { ipcRenderer } from 'electron'

import { DatabaseState, ImapTestResult, MailboxConfiguration } from '../../iso/api-types'
import { ButtonGroupSt, ButtonSt, FieldHeaderSt, TextInputSt, MainPaneSt, CheckboxInputSt } from '../common'
import saveImg from '../assets/save.png'
import { nextTimestamp, previousTimestamp } from '../fe-utils'

const TestResultPreSt = styled.pre`
  white-space: pre-wrap;
  width: calc(100% - 16px);
  max-width: calc(100% - 16px);
`

interface Props {
  dbState: DatabaseState
  setDbState: (dbState: DatabaseState) => void
}

export const MailboxPage = (props: Props) => {
  const [emailAddress, setEmailAddress] = useState<string>(props.dbState.mailboxConfiguration.emailAddress)
  const [password, setPassword] = useState<string>(props.dbState.mailboxConfiguration.password)
  const [imapHost, setImapHost] = useState<string>(props.dbState.mailboxConfiguration.imapHost)
  const [imapPort, setImapPort] = useState<number>(props.dbState.mailboxConfiguration.imapPort)
  const [fromFilter, setFromFilter] = useState<string>(props.dbState.mailboxConfiguration.fromFilter)
  const [subjectFilter, setSubjectFilter] = useState<string>(props.dbState.mailboxConfiguration.subjectFilter)
  const initialCursorDateOrDatetime = props.dbState.mailboxConfiguration.cursor.type === 'date'
    ? props.dbState.mailboxConfiguration.cursor.dateString
    : props.dbState.mailboxConfiguration.cursor.lastSeenDatetime
  // Must be valid date or ISO8601 datetime
  const [cursorDateOrDatetime, setCursorDateOrDatetime] = useState<string>(initialCursorDateOrDatetime)
  const [cursorDirty, setCursorDirty] = useState<boolean>(false)
  
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const [testInProgress, setTestInProgress] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<ImapTestResult | undefined>()

  return <MainPaneSt>
    <FieldHeaderSt>Email address</FieldHeaderSt>
    <TextInputSt type='text' value={emailAddress} onChange={e => setEmailAddress(e.target.value)}/>
    <FieldHeaderSt>Email password</FieldHeaderSt>
    <TextInputSt type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}/>
    <CheckboxInputSt type='checkbox' defaultChecked={showPassword} onChange={e => setShowPassword(!showPassword)}/>
    <span>Show</span>
    <FieldHeaderSt>IMAP host</FieldHeaderSt>
    <TextInputSt type='text' value={imapHost} onChange={e => setImapHost(e.target.value)}/>
    <FieldHeaderSt>IMAP port</FieldHeaderSt>
    <TextInputSt type='number' value={imapPort} onChange={e => setImapPort(parseInt(e.target.value, 10) || 993)}/>
    <FieldHeaderSt>From filter</FieldHeaderSt>
    <TextInputSt type='text' value={fromFilter} onChange={e => setFromFilter(e.target.value)}/>
    <FieldHeaderSt>Subject filter</FieldHeaderSt>
    <TextInputSt type='text' value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}/>
    <FieldHeaderSt>Datetime filter</FieldHeaderSt>
    <ButtonGroupSt>
      <TextInputSt type='text' value={cursorDateOrDatetime} readOnly />
      <ButtonSt onClick={() => {
        const newTimestamp = previousTimestamp(cursorDateOrDatetime)
        setCursorDateOrDatetime(newTimestamp.format('YYYY-MM-DD'))
        setCursorDirty(true)
      }}>&lt;</ButtonSt>
      <ButtonSt onClick={() => {
        const newTimestamp = nextTimestamp(cursorDateOrDatetime)
        setCursorDateOrDatetime(newTimestamp.format('YYYY-MM-DD'))
        setCursorDirty(true)
      }}>&gt;</ButtonSt>
      <ButtonSt onClick={() => {
        setCursorDateOrDatetime(moment.utc().format('YYYY-MM-DD'))
        setCursorDirty(true)
      }}>Today</ButtonSt>
    </ButtonGroupSt>
    <div style={{ height: '8px'}} />
    <ButtonGroupSt>
      <ButtonSt
        style={testInProgress ? { backgroundColor: 'gray', cursor: 'wait'} : {}}
        onClick={() => {
        if (testInProgress) {
          return
        }
        setTestInProgress(true)
        const mailboxConfiguration: MailboxConfiguration = {
          emailAddress,
          password,
          imapHost,
          imapPort,
          fromFilter,
          subjectFilter,
          cursor: cursorDirty
            ? { type: 'date', dateString: cursorDateOrDatetime }
            : props.dbState.mailboxConfiguration.cursor,
        }
        ipcRenderer.invoke('imap-test', mailboxConfiguration)
          .then((testResult: ImapTestResult) => {
            setTestInProgress(false)
            setTestResult(testResult)
          })
      }}>Test</ButtonSt>
    </ButtonGroupSt>
    <div style={{ height: '8px' }}></div>
    <ButtonGroupSt>
      <ButtonSt
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => {
        const mailboxConfiguration: MailboxConfiguration = {
          emailAddress,
          password,
          imapHost,
          imapPort,
          fromFilter,
          subjectFilter,
          cursor: cursorDirty
            ? { type: 'date', dateString: cursorDateOrDatetime }
            : props.dbState.mailboxConfiguration.cursor,
        }
        ipcRenderer.invoke('db-write', {
          ...props.dbState,
          mailboxConfiguration,
        }).then((dbState: DatabaseState) => props.setDbState(dbState))
      }}>
        <img src={saveImg} width="24px" height="24px" />
        Save
      </ButtonSt>
    </ButtonGroupSt>
    {testResult &&
      <TestResultPreSt style={{ color: testResult.success ? 'green' : 'red'}}>
        {testResult.text}
      </TestResultPreSt>
    }
  </MainPaneSt>
}
