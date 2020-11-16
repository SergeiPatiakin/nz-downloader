import * as React from 'react'
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ipcRenderer } from 'electron'

import { DatabaseState, Rule } from '../iso/api-types'
import { MailboxPage } from './pages/mailbox-page'
import { RulesPage } from './pages/rules-page'
import { UpsertRuleModal } from './modals/upsert-rule-modal'
import { ModalState } from './common'
import { StartPage } from './pages/start-page'

const PageSt = styled.div`
  width: 100%;
  min-width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0px;
`

const NavigationPaneSt = styled.div`
  height: 50px;
  min-height: 50px;
  max-height: 50px;
  width: 100%;
  min-width: 100%;
  background-color: blue;
  display: flex;
  align-items: center;
`

const NavigationLinkContainerSt = styled.div`
  padding: 4px;
`

interface NavigationLinkProps {
  isEnabled: boolean
}

const NavigationLinkSt = styled.p`
  color: white;
  ${(props: NavigationLinkProps) => props.isEnabled ? `
    &:hover {
      background-color: yellow;
      color: black;
    }
    cursor: pointer;
  ` : ''}

  font-size: 18px;
  line-height: 24px;
  
  margin: 0px;
  border-radius: 4px;
`

type NavigationPage = 'mailbox' | 'rules' | 'start'

const Overlay = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 100;
  opacity: 0.5;
  background-color: black;
`

const App = () => {
  const [dbState, setDbState] = useState<DatabaseState | undefined>()
  const [navigationPage, setNavigationPage] = useState<NavigationPage>('mailbox')
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' })
  const [navigationEnabled, setNavigationEnabled] = useState<boolean>(true)

  useEffect(() => {
    ipcRenderer.invoke('db-read')
      .then((ds: DatabaseState) => {
        setDbState(ds)
      })
  }, [])
  if (!dbState) {
    return <PageSt>Loading...</PageSt>
  }
  return <>
    <PageSt>
      {modalState.type === 'none'
        ? null
        : <>
          <Overlay />
          {modalState.type === 'create-rule'
            && <UpsertRuleModal
              ruleUpsertArg={{ type: 'create', ruleIdSeq: dbState.ruleIdSeq }}
              onCommit={(rule: Rule) => {
                const newDbState: DatabaseState = {
                  ...dbState,
                  rules: [...dbState.rules, rule],
                  ruleIdSeq: dbState.ruleIdSeq + 1,
                }
                ipcRenderer.invoke('db-write', newDbState)
                  .then((dbState: DatabaseState) => {
                    setDbState(dbState)
                    setModalState({ type: 'none'})
                  })
              }}
              onCancel={() => setModalState({ type: 'none'})}
            />
          }
          {modalState.type === 'update-rule'
            && <UpsertRuleModal
              ruleUpsertArg={{ type: 'update', rule: dbState.rules.find(r => r.id === modalState.ruleId)! }}
              onCommit={(rule: Rule) => {
                const newDbState: DatabaseState = {
                  ...dbState,
                  rules: dbState.rules.map(r => r.id === rule.id ? rule : r),
                }
                ipcRenderer.invoke('db-write', newDbState)
                  .then((dbState: DatabaseState) => {
                    setDbState(dbState)
                    setModalState({ type: 'none'})
                  })
              }}
              onCancel={() => setModalState({ type: 'none'})}
            />
          }
        </>
      }
      <NavigationPaneSt>
        <NavigationLinkContainerSt>
          <NavigationLinkSt
            onClick={() => navigationEnabled && navigationPage !== 'mailbox' && setNavigationPage('mailbox')}
            isEnabled={navigationEnabled && navigationPage !== 'mailbox'}
          >
            Mailbox
          </NavigationLinkSt>
        </NavigationLinkContainerSt>
        <NavigationLinkContainerSt>
          <NavigationLinkSt
            onClick={() => navigationEnabled && navigationPage !== 'rules' && setNavigationPage('rules')}
            isEnabled={navigationEnabled && navigationPage !== 'rules'}
          >
            Rules
          </NavigationLinkSt>
        </NavigationLinkContainerSt>
        <NavigationLinkContainerSt>
          <NavigationLinkSt
            onClick={() => navigationEnabled && navigationPage !== 'start' && setNavigationPage('start')}
            isEnabled={navigationEnabled && navigationPage !== 'start'}
          >
            Start
          </NavigationLinkSt>
        </NavigationLinkContainerSt>
      </NavigationPaneSt>
      {(() => {
        switch (navigationPage) {
          case 'mailbox':
            return <MailboxPage dbState={dbState} setDbState={setDbState} />
          case 'rules':
            return <RulesPage dbState={dbState} setDbState={setDbState} setModalState={setModalState} />
          case 'start':
            return <StartPage dbState={dbState} setDbState={setDbState} setNavigationEnabled={setNavigationEnabled} />
        }
      })()}
    </PageSt>
  </>
}

export default App
