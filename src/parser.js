import QASMTokens, {
  Identifier, RealNumberLiteral, IntegerLiteral, UnaryOP, MultiplicationOperator,
  AdditionOperator, LSquare, Semi, StringLiteral, Include, RParen, LParen,
  LanguageDecl, PI, Barrier, EQUAL, Opaque, RCurly, RSquare, QREG, LCurly, GATE,
  Reset, MeasureOP, Measure, CREG, CX, IF, U, Comma, Multi, Div, Pow, Plus, Minus
} from './token'
import {
  OP_DECL_CREG,
  OP_DECL_GATE,
  OP_DECL_QREG,
  OP_ARRAY_INDEX,
  OP_UNARY_OP,
  OP_INDEX,
  OP_VERSION,
  OP_INCLUDE,
  OP_TEST,
  OP_BARRIER,
  OP_MEASURE,
  OP_RESET,
  OP_U,
  OP_CX,
  OP_GATE_OP,
  OP_OPAQUE,
  OP_MULTIPLY,
  OP_DIVIDE,
  OP_POW, OP_GET_LAST_OP_RESULT, OP_PLUS, OP_MINUS, OP_NEGATIVE
} from "./opcode";
const { Lexer, Parser, tokenMatcher } = require("chevrotain")

const QASMLexer = new Lexer(QASMTokens)

/**
 *
 * @param {[]} source
 * @param {[]} dest
 */
function addAllTo(source, dest) {
  if (source && dest && Array.isArray(source) && Array.isArray(dest)) {
    source.forEach(v => dest.push(v))
  }
}

// ----------------- parser -----------------
/**
 * parse qasm source code into tokens
 * @class QASMParser
 */
export class QASMParser extends Parser {
  /**
   * @constructor
   * @param {Array} input
   */
  constructor(input) {
    super(input, QASMTokens)

    // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
    const $ = this

    $.RULE("arrayArgument", () => {
      const id = $.CONSUME(Identifier)
      $.CONSUME(LSquare)
      const index = parseInt($.CONSUME(IntegerLiteral).image, 10)
      $.CONSUME(RSquare)
      return {code: OP_ARRAY_INDEX, args: [id.image, index]}
    })

    $.RULE("parenthesisExpression", () => {
      let result
      $.CONSUME(LParen)
      result = $.SUBRULE($.expression)
      $.CONSUME(RParen)
      return result
    })

    // Lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", () => {
      const ops = []
      // using labels can make the CST processing easier
      const lhs = $.SUBRULE($.multiplicationExpression, { LABEL: "lhs" })
      $.MANY(() => {
        // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
        const t = $.CONSUME(AdditionOperator)
        const op = {}
        if (tokenMatcher(t, Plus)) {
          op.code = OP_PLUS
        } else if (tokenMatcher(t, Minus)) {
          op.code = OP_MINUS
        }
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        const rhs = $.SUBRULE2($.multiplicationExpression, { LABEL: "rhs" })
        if (ops.length === 0) {
          op.args = [lhs, rhs]
        } else {
          op.args = [{code: OP_GET_LAST_OP_RESULT}, rhs]
        }
        ops.push(op)
      })
      if (ops.length === 0) {
        return lhs
      }
      return ops
    })

    $.RULE("multiplicationExpression", () => {
      const ops = []
      const lhs = $.SUBRULE($.atomicExpression, { LABEL: "lhs" })
      $.MANY(() => {
        const t = $.CONSUME(MultiplicationOperator)
        const op = {}
        if (tokenMatcher(t, Multi)) {
          op.code = OP_MULTIPLY
        } else if (tokenMatcher(t, Div)) {
          op.code = OP_DIVIDE
        } else if (tokenMatcher(t, Pow)) {
          op.code = OP_POW
        }
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        const rhs = $.SUBRULE2($.atomicExpression, { LABEL: "rhs" })
        if (ops.length === 0) {
          op.args = [lhs, rhs]
        } else {
          op.args = [{code: OP_GET_LAST_OP_RESULT}, rhs]
        }
        ops.push(op)
      })
      if (ops.length === 0) {
        return lhs
      }
      return ops
    })

    $.RULE("atomicExpression", () => {
      $.OR([
        // parenthesisExpression has the highest precedence and thus it appears
        // in the "lowest" leaf in the expression ParseTree.
        { ALT: () => $.SUBRULE($.parenthesisExpression) },
        { ALT: () => parseFloat($.CONSUME(RealNumberLiteral).image) },
        { ALT: () => parseInt($.CONSUME(IntegerLiteral).image, 10) },
        {
          ALT: () => {
            $.CONSUME(PI)
            return Math.PI
          }
        },
        {
          ALT: () => {
            const id = $.CONSUME(Identifier).image
            return {code: OP_INDEX, args: [id]}
          }
        },
        { ALT: () => {
            const func = $.CONSUME(UnaryOP)
            const arg = $.SUBRULE2($.parenthesisExpression)
            return {code: OP_UNARY_OP, args: [func.image, arg]}
          }
        },
        {
          ALT: () => {
            $.CONSUME(Minus)
            const arg = $.SUBRULE($.expression)
            return {code: OP_NEGATIVE, args: [arg]}
          }
        }
      ])
    })

    $.RULE('expression', () => $.SUBRULE($.additionExpression))

    $.RULE('explist', () => {
      const ops = $.SUBRULE($.expression)
      $.OPTION(() => {
        $.CONSUME(Comma)
        const array = $.SUBRULE2($.explist)
        addAllTo(array, ops)
      })
      return ops
    })

    $.RULE('argument', () => {
      const id = $.CONSUME(Identifier).image
      let index
      $.OPTION(() => {
        $.CONSUME(LSquare)
        index = parseInt($.CONSUME(IntegerLiteral).image, 10)
        $.CONSUME(RSquare)
      })
      if (typeof index === 'number') {
        return {code: OP_ARRAY_INDEX, args: [id, index]}
      } else {
        return {code: OP_INDEX, args: [id]}
      }
    })

    $.RULE('mainprogram', () => {
      const ops = []
      // it's option for library
      $.OPTION(() => {
        $.CONSUME(LanguageDecl)
        const version = parseFloat($.CONSUME(RealNumberLiteral).image)
        $.CONSUME(Semi)

        ops.push({code: OP_VERSION, args: [version]})

        $.CONSUME(Include)
        const libraryPath = $.CONSUME(StringLiteral).image
        $.CONSUME2(Semi)

        ops.push({code: OP_INCLUDE, args: [libraryPath]})
      })

      const array = $.SUBRULE($.program)
      return ops.concat(array)
    })

    $.RULE('program', () => {
      const ops = $.SUBRULE2($.statement)
      $.OPTION(() => {
        const array = $.SUBRULE2($.program)
        addAllTo(array, ops)
      })
      return ops
    })

    $.RULE('statement', () => {
      const ops = []
      $.OR([
        {
          ALT: () => {
            const result = $.SUBRULE($.decl)
            ops.push(result)
          }
        },
        {
          ALT: () => {
            const op = $.SUBRULE($.gatedecl)
            $.OPTION(() => {
              const body = $.SUBRULE($.goplist)
              op.args.push(body)
            })
            $.CONSUME(RCurly)
            ops.push(op)
          }
        },
        {
          ALT: () => {
            $.CONSUME3(Opaque)
            const id = $.CONSUME3(Identifier).image
            let ids1 = []
            $.OPTION2(() => {
              $.CONSUME2(LParen)
              $.OPTION3(() => ids1 = $.SUBRULE3($.idlist))
              $.CONSUME2(RParen)
            })
            const ids2 = $.SUBRULE4($.idlist)
            $.CONSUME3(Semi)
            ops.push({code: OP_OPAQUE, args: [id, ids1, ids2]})
          }
        },
        {
          ALT: () => {
            const result = $.SUBRULE($.QOP)
            addAllTo(result, ops)
          }
        },
        {
          ALT: () => {
            $.CONSUME(IF)
            $.CONSUME3(LParen)
            const id = $.CONSUME4(Identifier).image
            $.CONSUME(EQUAL)
            const target = parseInt($.CONSUME(IntegerLiteral), 10)
            $.CONSUME3(RParen)
            const qops = $.SUBRULE2($.QOP)
            ops.push({code: OP_TEST, args: [id, target, qops]})
          }
        },
        {
          ALT: () => {
            $.CONSUME(Barrier)
            const result = $.SUBRULE($.mixedlist)
            $.CONSUME4(Semi)
            ops.push({code: OP_BARRIER, args: [result]})
          }
        }
      ])

      return ops
    })

    $.RULE('decl', () => {
      let code = -1
      $.OR([
        {
          ALT: () => {
            $.CONSUME(QREG)
            code = OP_DECL_QREG
          }
        },
        {
          ALT: () => {
            $.CONSUME(CREG)
            code = OP_DECL_CREG
          }
        }
      ])

      const id = $.CONSUME(Identifier).image
      $.CONSUME(LSquare)
      const index = parseInt($.CONSUME(IntegerLiteral).image, 10)
      $.CONSUME(RSquare)
      $.CONSUME(Semi)
      return {code, args: [id, index]}
    })

    $.RULE('gatedecl', () => {
      $.CONSUME(GATE)
      const gatename = $.CONSUME(Identifier).image
      let params = []
      $.OPTION(() => {
        $.CONSUME(LParen)
        $.OPTION2(() => {
          params = $.SUBRULE($.idlist)
        })
        $.CONSUME(RParen)
      })
      const qargs = $.SUBRULE2($.idlist)
      $.CONSUME(LCurly)
      return {code: OP_DECL_GATE, args: [gatename, params, qargs]}
    })

    $.RULE('goplist', () => {
      const ops = []

      $.OR([
        {
          ALT: () => {
            const result = $.SUBRULE($.UOP)
            addAllTo(result, ops)
            $.OPTION(() => {
              const array = $.SUBRULE($.goplist)
              addAllTo(array, ops)
            })
          }},
        {
          ALT: () => {
            $.CONSUME(Barrier)
            const ids = $.SUBRULE($.idlist)
            $.CONSUME(Semi)
            ops.push({code: OP_BARRIER, args: [ids]})
            $.OPTION2(() => {
              const array = $.SUBRULE2($.goplist)
              addAllTo(array, ops)
            })
          }
        }
      ])

      return ops
    })

    $.RULE('QOP', () => {
      const ops = []
      $.OR([
        {
          ALT: () => {
            const result = $.SUBRULE($.UOP)
            addAllTo(result, ops)
          }
        },
        { ALT: () => {
            $.CONSUME(Measure)
            const q = $.SUBRULE($.argument)
            $.CONSUME(MeasureOP)
            const c = $.SUBRULE2($.argument)
            $.CONSUME(Semi)
            ops.push({code: OP_MEASURE, args: [q, c]})
          }
        },
        {
          ALT: () => {
            $.CONSUME(Reset)
            const arg = $.SUBRULE3($.argument)
            $.CONSUME2(Semi)
            ops.push({code: OP_RESET, args: [arg]})
          }
        }
      ])
      return ops
    })

    $.RULE('UOP', () => {
      const ops = []
      $.OR([
        {
          ALT: () => {
            $.CONSUME(U)
            $.CONSUME(LParen)
            const exps = $.SUBRULE($.idlist)
            $.CONSUME(RParen)
            const args = $.SUBRULE2($.argument)
            $.CONSUME(Semi)
            ops.push({code: OP_U, args: [exps, args]})
          }
        },
        {
          ALT: () => {
            $.CONSUME(CX)
            const arg1 = $.SUBRULE3($.argument)
            $.CONSUME(Comma)
            const arg2 = $.SUBRULE4($.argument)
            $.CONSUME2(Semi)
            ops.push({code: OP_CX, args: [arg1, arg2]})
          }
        },
        {
          ALT: () => {
            const gatename = $.CONSUME(Identifier).image
            let params = []
            $.OPTION(() => {
              $.CONSUME2(LParen)
              $.OPTION2(() => {
                params = $.SUBRULE2($.explist)
              })
              $.CONSUME2(RParen)
            })
            const qargs = $.SUBRULE($.mixedlist)
            $.CONSUME3(Semi)
            ops.push({code: OP_GATE_OP, args: [gatename, params, qargs]})
          }
        }
      ])

      return ops
    })

    $.RULE('idlist', () => {
      const args = []
      const id = $.CONSUME(Identifier)
      args.push({code: OP_INDEX, args: [id.image]})

      $.OPTION(() => {
        $.CONSUME(Comma)
        const array = $.SUBRULE($.idlist)
        addAllTo(array, args)
      })
      return args
    })

    $.RULE('mixedlist', () => {
      const ops = []
      const id = $.CONSUME(Identifier).image
      let index
      $.OPTION(() => {
        $.CONSUME(LSquare)
        index = parseInt($.CONSUME(IntegerLiteral).image, 10)
        $.CONSUME(RSquare)
      })
      if (typeof index === 'number') {
        ops.push({code: OP_ARRAY_INDEX, args: [id, index]})
      } else {
        ops.push({code: OP_INDEX, args: [id]})
      }
      $.OPTION2(() => {
        $.CONSUME(Comma)
        const array = $.SUBRULE($.mixedlist)
        addAllTo(array, ops)
      })
      return ops
    })
    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new QASMParser([])

/**
 * wrapped parse function, will return tokens, `value` is operations
 * @param text
 * @return {{tokens: IToken[], value: *, lexErrors: ILexingError[], parseErrors: IRecognitionException[]}}
 */
export default function (text) {
  const lexResult = QASMLexer.tokenize(text)
  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  // any top level rule may be used as an entry point
  const value = parser.mainprogram()

  return {
    tokens: lexResult.tokens,
    value: value, // this is a pure grammar, the value will always be <undefined>
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
