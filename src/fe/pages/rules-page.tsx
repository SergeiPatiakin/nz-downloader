import { ipcRenderer } from "electron"
import * as React from "react"
import styled from "styled-components"

import { DatabaseState } from "../../iso/api-types"
import { ButtonGroupSt, ButtonSt, MainPaneSt, ModalState } from "../common"
import plusImg from '../assets/plus.png'

interface Props {
  dbState: DatabaseState
  setDbState: (dbState: DatabaseState) => void
  setModalState: (modalState: ModalState) => void
}

const RulesTableSt = styled.div`
  display: table;
  font-size: 12px;
`

const RulesTableRowSt = styled.div`
  display: table-row;
  width: auto;
`

const RulesTableCellSt = styled.div`
  display: table-cell;
  border-bottom: 1px solid black;
`

export const RulesPage = (props: Props) => {
  return <MainPaneSt>
    <RulesTableSt>
      <RulesTableRowSt style={{ fontWeight: 'bold', fontSize: '14px'}}>
        <RulesTableCellSt style={{ width: '160px'}}>Condition</RulesTableCellSt>
        <RulesTableCellSt style={{ width: '200px'}}>Value</RulesTableCellSt>
        <RulesTableCellSt style={{ width: '300px'}}>Directory</RulesTableCellSt>        
        <RulesTableCellSt style={{ width: '50px'}}></RulesTableCellSt>        
        <RulesTableCellSt style={{ width: '50px'}}></RulesTableCellSt>        
      </RulesTableRowSt>
      {props.dbState.rules.map(r => <RulesTableRowSt key={r.id}>
        <RulesTableCellSt style={{ width: '160px'}}>{
          (() => {switch(r.type) {
            case 'filename-starts-with': return 'Filename starts with'
            case 'filename-matches-regex': return 'Filename matches regex'
          }})()
        }</RulesTableCellSt>
        <RulesTableCellSt style={{ width: '200px'}}>{r.operand}</RulesTableCellSt>
        <RulesTableCellSt style={{ width: '300px'}}>{r.destinationPath}</RulesTableCellSt>
        <RulesTableCellSt style={{ width: '50px'}}>
          <ButtonSt onClick={() => props.setModalState({
            type: 'update-rule',
            ruleId: r.id,
          })}>Edit</ButtonSt>
        </RulesTableCellSt>
        <RulesTableCellSt style={{ width: '50px'}}>
          <ButtonSt onClick={() => {
            const newDbState: DatabaseState = {
              ...props.dbState,
              rules: props.dbState.rules.filter(dbRule => dbRule.id !== r.id),
            }
            ipcRenderer.invoke('db-write', newDbState)
              .then((dbState: DatabaseState) => props.setDbState(dbState))
          }}>Delete</ButtonSt>
        </RulesTableCellSt>
      </RulesTableRowSt>)
      }
    </RulesTableSt>
    <div style={{ height: '8px'}} />
    <ButtonGroupSt>
      <ButtonSt
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => props.setModalState({ type: 'create-rule'})}
      >
        <img src={plusImg} width="24px" height="24px" />
        Add
      </ButtonSt>
    </ButtonGroupSt>
  </MainPaneSt>
}
