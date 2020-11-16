import styled from 'styled-components'

export const MainPaneSt = styled.div`
  background-color: #eeeeee;
  height: calc(100% - 50px);
  padding-left: 8px;
  padding-top: 8px;
  overflow-y: scroll;
  overflow-x: hidden;
`


export const ButtonGroupSt = styled.div`
  display: flex;
`

export const ButtonSt = styled.div`
  background-color: blue;
  color: white;
  &:hover {
    background-color: yellow;
    color: black;
  }
  padding: 4px 4px;
  border 1px solid black;
  border-radius: 4px;
  cursor: pointer;
`

export const RedButtonSt = styled.div`
  background-color: red;
  color: black;
  &:hover {
    background-color: white;
    color: black;
  }
  padding: 4px 4px;
  border 1px solid black;
  border-radius: 4px;
  cursor: pointer;
`

export const YellowButtonSt = styled.div`
  background-color: yellow;
  color: black;
  &:hover {
    background-color: white;
    color: black;
  }
  padding: 4px 4px;
  border 1px solid black;
  border-radius: 4px;
  cursor: pointer;
`

export const GreenButtonSt = styled.div`
  background-color: green;
  color: white;
  &:hover {
    background-color: white;
    color: black;
  }
  padding: 4px 4px;
  border 1px solid black;
  border-radius: 4px;
  cursor: pointer;
`

export const FieldHeaderSt = styled.p`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  margin: 0px;
`

export const TextInputSt = styled.input`
  font-size: 12px;
  line-height: 16px;
  width: 200px;
`

export const CheckboxInputSt = styled.input`
  font-size: 12px;
  line-height: 16px;
`

export const SelectSt = styled.select`
  width: 200px;
`

export const ModalTitleBarSt = styled.div`
  height: 50px;
  min-height: 50px;
  background-color: blue;
  width: 100%;
  min-width: 100%;
  padding-left: 8px;
  padding-right: 8px;
  
  border-radius: 4px 4px 0px 0px;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const ModalTitleSt = styled.p`
  color: white;
  
  font-size: 18px;
  line-height: 24px;
  
  margin: 0px;

  border-radius: 4px;

  cursor: pointer;
`


export const ModalSt = styled.div`
  background-color: white;
  opacity: 100%;
  width: 400px;
  height: 400px;

  border-radius: 4px;
  position: absolute;
  
  top: calc(50% - 200px);
  left: calc(50% - 200px);

  z-index: 200;
`

export type ModalState =
 | { type: 'none'}
 | { type: 'create-rule'}
 | { type: 'update-rule', ruleId: number }
