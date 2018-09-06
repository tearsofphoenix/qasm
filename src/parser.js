import QASMTokens, {
  Identifier, RealNumberLiteral, IntegerLiteral, UnaryOP, MultiplicationOperator,
  AdditionOperator, LSquare, Semi, StringLiteral, Include, RParen, LParen,
  LanguageDecl, PI, barrier, EQUAL, Opaque, RCurly, RSquare, qreg, LCurly, gate,
  Reset, MeasureOP, measure, creg, CX, IF, U, Comma
} from './token'
const { Lexer, Parser } = require("chevrotain")

const QASMLexer = new Lexer(QASMTokens)

// ----------------- parser -----------------
class QASMParser extends Parser {
  constructor(input) {
    super(input, QASMTokens)

    // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
    const $ = this

    $.RULE("arrayArgument", () => {
      $.CONSUME(Identifier)
      $.CONSUME(LSquare)
      $.CONSUME(IntegerLiteral)
      $.CONSUME(RSquare)
    })


    $.RULE("parenthesisExpression", () => {
      $.CONSUME(LParen)
      $.SUBRULE($.expression)
      $.CONSUME(RParen)
    })

    // Lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    $.RULE("additionExpression", () => {
      // using labels can make the CST processing easier
      $.SUBRULE($.multiplicationExpression, { LABEL: "lhs" })
      $.MANY(() => {
        // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
        $.CONSUME(AdditionOperator)
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        $.SUBRULE2($.multiplicationExpression, { LABEL: "rhs" })
      })
    })

    $.RULE("multiplicationExpression", () => {
      $.SUBRULE($.atomicExpression, { LABEL: "lhs" })
      $.MANY(() => {
        $.CONSUME(MultiplicationOperator)
        //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        $.SUBRULE2($.atomicExpression, { LABEL: "rhs" })
      })
    })

    $.RULE("atomicExpression", () => {
      $.OR([
        // parenthesisExpression has the highest precedence and thus it appears
        // in the "lowest" leaf in the expression ParseTree.
        { ALT: () => $.SUBRULE($.parenthesisExpression) },
        { ALT: () => $.CONSUME(RealNumberLiteral) },
        { ALT: () => $.CONSUME(IntegerLiteral) }
      ])
    })

    $.RULE('expression', () => {
      $.OR([
        { ALT: () => $.CONSUME(PI)},
        { ALT: () => $.CONSUME(Identifier)},
        { ALT: () => $.SUBRULE($.atomicExpression)},
        { ALT: () => {
            $.CONSUME(UnaryOP)
            $.SUBRULE($.parenthesisExpression)
          }
        },
        // { ALT: () => $.SUBRULE($.additionExpression)},
        // { ALT: () => $.SUBRULE($.multiplicationExpression)},
      ])
    })

    $.RULE('explist', () => {
      $.SUBRULE($.expression)
      $.OPTION(() => {
        $.CONSUME(Comma)
        $.SUBRULE2($.explist)
      })
    })

    $.RULE('argument', () => {
      $.CONSUME(Identifier)
      $.OPTION(() => {
        $.CONSUME(LSquare)
        $.CONSUME(IntegerLiteral)
        $.CONSUME(RSquare)
      })
    })

    $.RULE('mainprogram', () => {
      $.CONSUME(LanguageDecl)
      $.CONSUME(RealNumberLiteral)
      $.CONSUME(Semi)

      $.CONSUME(Include)
      $.CONSUME(StringLiteral)
      $.CONSUME2(Semi)

      $.SUBRULE($.program)
    })

    $.RULE('program', () => {
      $.SUBRULE2($.statement)
      $.OPTION(() => $.SUBRULE2($.program))
    })

    $.RULE('statement', () => {
      $.OR([
        { ALT: () => $.SUBRULE($.decl) },
        {
          ALT: () => {
            $.SUBRULE($.gatedecl)
            $.OPTION(() => $.SUBRULE($.goplist))
            $.CONSUME(RCurly)
          }
        },
        {
          ALT: () => {
            $.CONSUME3(Opaque)
            $.CONSUME3(Identifier)
            $.OPTION2(() => {
              $.CONSUME2(LParen)
              $.OPTION3(() => $.SUBRULE3($.idlist))
              $.CONSUME2(RParen)
            })
            $.SUBRULE4($.idlist)
            $.CONSUME3(Semi)
          }
        },
        {
          ALT: () => $.SUBRULE($.QOP)
        },
        {
          ALT: () => {
            $.CONSUME(IF)
            $.CONSUME3(LParen)
            $.CONSUME4(Identifier)
            $.CONSUME(EQUAL)
            $.CONSUME(IntegerLiteral)
            $.CONSUME3(RParen)
            $.SUBRULE2($.QOP)
          }
        },
        {
          ALT: () => {
            $.CONSUME(barrier)
            $.SUBRULE($.mixedlist)
            $.CONSUME4(Semi)
          }
        }
      ])
    })

    $.RULE('decl', () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(qreg)
          }
        },
        {
          ALT: () => {
            $.CONSUME(creg)
          }
        }
      ])

      $.CONSUME(Identifier)
      $.CONSUME(LSquare)
      $.CONSUME(IntegerLiteral)
      $.CONSUME(RSquare)
      $.CONSUME(Semi)
    })

    $.RULE('gatedecl', () => {
      $.CONSUME(gate)
      $.CONSUME(Identifier)
      $.OPTION(() => {
        $.CONSUME(LParen)
        $.OPTION2(() => $.SUBRULE($.idlist))
        $.CONSUME(RParen)
      })
      $.SUBRULE2($.idlist)
      $.CONSUME(LCurly)
    })

    $.RULE('goplist', () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.UOP)
            $.OPTION(() => $.SUBRULE($.goplist))
          }},
        {
          ALT: () => {
            $.CONSUME(barrier)
            $.SUBRULE($.idlist)
            $.CONSUME(Semi)
            $.OPTION2(() => $.SUBRULE2($.goplist))
          }
        }
      ])
    })

    $.RULE('QOP', () => {
      $.OR([
        { ALT: () => $.SUBRULE($.UOP) },
        { ALT: () => {
            $.CONSUME(measure)
            $.SUBRULE($.argument)
            $.CONSUME(MeasureOP)
            $.SUBRULE2($.argument)
            $.CONSUME(Semi)
          }
        },
        {
          ALT: () => {
            $.CONSUME(Reset)
            $.SUBRULE3($.argument)
            $.CONSUME2(Semi)
          }
        }
      ])
    })

    $.RULE('UOP', () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(U)
            $.CONSUME(LParen)
            $.SUBRULE($.explist)
            $.CONSUME(RParen)
            $.SUBRULE($.argument)
            $.CONSUME(Semi)
          }
        },
        {
          ALT: () => {
            $.CONSUME(CX)
            $.SUBRULE2($.argument)
            $.CONSUME(Comma)
            $.SUBRULE3($.argument)
            $.CONSUME2(Semi)
          }
        },
        {
          ALT: () => {
            $.CONSUME(Identifier)
            $.OPTION(() => {
              $.CONSUME2(LParen)
              $.OPTION2(() => $.SUBRULE2($.explist))
              $.CONSUME2(RParen)
            })
            $.SUBRULE($.mixedlist)
            $.CONSUME3(Semi)
          }
        }
      ])
    })

    $.RULE('idlist', () => {
      $.CONSUME(Identifier)
      $.OPTION(() => {
        $.CONSUME(Comma)
        $.SUBRULE($.idlist)
      })
    })

    $.RULE('mixedlist', () => {
      $.CONSUME(Identifier)
      $.OPTION(() => {
        $.CONSUME(LSquare)
        $.CONSUME(IntegerLiteral)
        $.CONSUME(RSquare)
      })
      $.OPTION2(() => {
        $.CONSUME(Comma)
        $.SUBRULE($.mixedlist)
      })
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

module.exports = function(text) {
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
