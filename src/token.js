const { createToken, Lexer } = require("chevrotain")

// ----------------- lexer -----------------
export const Comment = createToken({
  name: "Comment",
  pattern: /(#|\/\/)[^\n\r]*/,
  group: Lexer.SKIPPED
})
export const LCurly = createToken({ name: "LCurly", label: '{', pattern: /{/ })
export const RCurly = createToken({ name: "RCurly", label: '}', pattern: /}/ })
export const LSquare = createToken({ name: "LSquare", label: '[', pattern: /\[/ })
export const RSquare = createToken({ name: "RSquare", label: ']', pattern: /]/ })
export const LParen = createToken({name: 'LParen', label: '(', pattern: /\(/})
export const RParen = createToken({name: 'RParen', label: ')', pattern: /\)/})
export const Comma = createToken({ name: "Comma", label: ',', pattern: /,/ })
export const PI = createToken({name: 'PI', label: 'pi', pattern: /pi/})
export const U = createToken({name: 'U', label: 'U', pattern: /U/})
export const CX = createToken({name: 'CX', label: 'CX', pattern: /CX/})
export const gate = createToken({name: 'gate', label: 'gate', pattern: /gate/})
export const barrier = createToken({name: 'barrier', label: 'barrier', pattern: /barrier/})
export const qreg = createToken({name: 'qreg', label: 'qreg', pattern: /qreg/})
export const creg = createToken({name: 'creg', label: 'creg', pattern: /creg/})
export const measure = createToken({name: 'measure', label: 'measure', pattern: /measure/})
export const Semi = createToken({name: 'Semi', label: ';', pattern: /;/})
export const MeasureOP = createToken({name: 'MeasureOP', label: '->', pattern: /\-\>/})
export const Reset = createToken({name: 'Reset', label: 'reset', pattern: /reset/})
export const Opaque = createToken({name: 'Opaque', label: 'opaque', pattern: /opaque/})
export const IF = createToken({name: 'IF', label: 'if', pattern: /if/})
export const EQUAL = createToken({name: 'EQUAL', label: '==', pattern: /==/})
export const LanguageDecl = createToken({name: 'LanguageDecl', label: 'Language', pattern: /IBMQASM/})
export const Include = createToken({name: 'Include', label: 'include', pattern: /include/})
export const StringLiteral = createToken({name: 'StringLiteral', label: 'String', pattern: /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/})

// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
// actual Tokens that can appear in the text
export const AdditionOperator = createToken({
  name: "AdditionOperator",
  pattern: Lexer.NA
})
export const Plus = createToken({
  name: "Plus",
  label: '+',
  pattern: /\+/,
  categories: AdditionOperator
})
export const Minus = createToken({
  name: "Minus",
  label: '-',
  pattern: /-/,
  categories: AdditionOperator
})

export const MultiplicationOperator = createToken({
  name: "MultiplicationOperator",
  pattern: Lexer.NA
})
export const Multi = createToken({
  name: "Multi",
  label: '*',
  pattern: /\*/,
  categories: MultiplicationOperator
})
export const Div = createToken({
  name: "Div",
  label: '/',
  pattern: /\//,
  categories: MultiplicationOperator
})
export const Pow = createToken({
  name: 'Pow',
  label: '^',
  pattern: /\^/,
  categories: MultiplicationOperator
})

export const UnaryOP = createToken({
  name: 'UnaryOP',
  pattern: /(sin|cos|tan|exp|ln|sqrt)/
})

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-z][a-zA-Z0-9_]*/
})

export const RealNumberLiteral = createToken({
  name: "RealNumberLiteral",
  pattern: /([0-9]+\.[0-9]*|[0-9]*\.[0-9]+)([eE][-+]?[0-9]+)?/
})

export const IntegerLiteral = createToken({
  name: 'IntegerLiteral',
  label: 'int',
  pattern: /([1-9]+[0-9]*|0)/
})

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  label: 'whitespace',
  pattern: /[ \t\n\r]+/,
  // ignore whitespace
  group: Lexer.SKIPPED
})

export default [
  // literal
  Comment,
  WhiteSpace,
  RealNumberLiteral,
  IntegerLiteral,
  LanguageDecl,
  Include,
  StringLiteral,
  PI,
  UnaryOP,
  // delimitors
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Comma,
  LParen,
  RParen,
  Semi,
  EQUAL,
  MeasureOP,
  // internal quantum operator
  U,
  CX,
  barrier,
  gate,
  qreg,
  creg,
  measure,
  Reset,
  Opaque,

  // math operators
  AdditionOperator,
  Plus,
  Minus,
  MultiplicationOperator,
  Multi,
  Div,
  Pow,

  IF,

  Identifier,
]
