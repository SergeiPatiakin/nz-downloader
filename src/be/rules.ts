import { Rule } from "../iso/api-types"

export const isRuleMatch = (r: Rule, a: {fileName: string, content: Buffer | string}) => 
  r.type === 'filename-starts-with' && a.fileName && a.fileName.startsWith(r.operand) ||
  r.type === 'filename-matches-regex' && a.fileName && RegExp(r.operand, 'i').test(a.fileName)

