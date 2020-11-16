import { ipcRenderer } from 'electron'
import { default as React, useState, useEffect } from 'react'
import styled from 'styled-components'

import { Rule, RuleType } from '../../iso/api-types'
import {
  ButtonGroupSt,
  ButtonSt,
  FieldHeaderSt,
  TextInputSt,
  ModalSt,
  ModalTitleBarSt,
  ModalTitleSt,
  SelectSt
} from '../common'
import { IconClose } from '../icons'
import saveImg from '../assets/save.png'

const ModalContentSt = styled.div`
  padding-left: 8px;
  padding-top: 8px;
`

type RuleUpsertArg = {
  type: 'create',
  ruleIdSeq: number,
} | {
  type: 'update',
  rule: Rule
}

interface Props {
  ruleUpsertArg: RuleUpsertArg
  onCommit: (rule: Rule) => void
  onCancel: () => void
}

export const UpsertRuleModal = (props: Props) => {
  const rule: Rule = props.ruleUpsertArg.type === 'create' ? {
    id: props.ruleUpsertArg.ruleIdSeq,
    type: 'filename-starts-with',
    operand: '',
    destinationPath: '',
  } : props.ruleUpsertArg.rule
  const [ruleType, setRuleType] = useState(rule.type)
  const [operand, setOperand] = useState(rule.operand)
  const [operandError, setOperandError] = useState(false)
  useEffect(() => {
    if (ruleType === 'filename-matches-regex') {
      try {
        RegExp(operand)
        setOperandError(false)
      } catch (e) {
        setOperandError(true)
      }
    } else {
      setOperandError(false)
    }
  }, [ruleType, operand])
  const [dirPath, setDirPath] = useState(rule.destinationPath)

  return <ModalSt>
    <ModalTitleBarSt>
      <ModalTitleSt>{props.ruleUpsertArg.type === 'create' ? 'Create Rule' : 'Update Rule'}</ModalTitleSt>
      <div style={{cursor: 'pointer'}} onClick={() => props.onCancel()}>
        <IconClose width='16px' height='16px'/>
      </div>
    </ModalTitleBarSt>
    <ModalContentSt>
      <FieldHeaderSt>Condition</FieldHeaderSt>
      <SelectSt value={ruleType} onChange={e => setRuleType(e.target.value as RuleType)}>
        <option value="filename-starts-with">Filename starts with</option>
        <option value="filename-matches-regex">Filename matches regex</option>
      </SelectSt>
      <FieldHeaderSt>Value</FieldHeaderSt>
      <TextInputSt type='text' value={operand} onChange={e => setOperand(e.target.value)} style={
        operandError ? { borderColor: '#B11B1B', outlineColor: 'red'} : {}
      } />
      <FieldHeaderSt>Action</FieldHeaderSt>
      <SelectSt value="save-file">
        <option value="save-file">Save file to directory</option>
      </SelectSt>
      <FieldHeaderSt>Directory</FieldHeaderSt>
      <ButtonGroupSt>
        <TextInputSt type='text' value={dirPath} onChange={e => setDirPath(e.target.value)}/>
        <ButtonSt onClick={() => {
          ipcRenderer.invoke('directory-dialog-open')
            .then((s: string) => setDirPath(s))
        }}>Choose...</ButtonSt>
      </ButtonGroupSt>
      <div style={{ height: '8px'}} />
      <ButtonGroupSt>
        <ButtonSt
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => props.onCommit({
              id: rule.id,
              type: ruleType,
              operand,
              destinationPath: dirPath,
            })
          }
        >
          <img src={saveImg} width="24px" height="24px" />
          Save
        </ButtonSt>
      </ButtonGroupSt>
    </ModalContentSt>
  </ModalSt>
}
