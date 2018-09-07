function initExamplesDropDown() {
    examplesDropdown.find("option").remove()
    _.forEach(_.keys(samples), (exampleName, idx) => {
        examplesDropdown.append("<option value=\"" + exampleName + "\">" + exampleName + "</option>")
    })
}


function loadExample(exampleName, firstTime) {
    const sample = samples[exampleName];
    // reduce whitespace used for Indentation, 2 spaces is also used in the code mirror editor
    let sampleText = "(" + sample.implementation.toString().replace(/    /g, "  ") + "())";
    // the users of the playground don't care about the @formatter tag of intellij...
    sampleText = sampleText.replace(/\s*\/\/ @formatter:(on|off)/g, "")
    javaScriptEditor.setValue(sampleText)
    updateSamplesDropDown()
    if (firstTime) {
        onImplementationEditorContentChange() // can't wait for debounce on the first load as loadSamples will trigger lexAndParse
    }
    loadSamples(samplesDropdown.val())
}


function loadSamples(sampleKey) {
    const exampleKey = examplesDropdown.val();
    inputEditor.setValue(samples[exampleKey].sampleInputs[sampleKey])
    parserOutput.setValue("")
}


function updateSamplesDropDown() {
    samplesDropdown.find("option").remove()
    _.forOwn(samples[examplesDropdown.val()].sampleInputs, (exampleValue, exampleName) => {
        samplesDropdown.append("<option>" + exampleName + "</option>")
    })
}


function qasmExample() {
   const { createToken, Lexer, Parser, tokenMatcher } = chevrotain

    // OPENASM 2.0;
    const OP_VERSION = 0x01

    // include "qelib1.inc"
    const OP_INCLUDE = 0x02

    const OP_DECL_GATE = 0x03

    const OP_DECL_QREG = 0x04

    const OP_DECL_CREG = 0x05

    const OP_OPAQUE = 0x06

    const OP_U = 0x07

    const OP_CX = 0x08

    const OP_MEASURE = 0x09

    const OP_RESET = 0x10

    const OP_GATE_OP = 0x11

    const OP_TEST = 0x12

    const OP_BARRIER = 0x13

    // such as `a[1]`
    const OP_ARRAY_INDEX = 0x14

    // resolve identifier value
    const OP_INDEX = 0x15

    // sin/cos/tan/exp/ln/sqrt
    const OP_UNARY_OP = 0x16

    const OP_PLUS = 0x17

    const OP_MINUS = 0x18

    const OP_MULTIPLY = 0x19

    const OP_DIVIDE = 0x20

    const OP_POW = 0x21

    const OP_GET_LAST_OP_RESULT = 0x22

    const OP_NEGATIVE = 0x23

    // ----------------- lexer -----------------
    const Comment = createToken({
      name: "Comment",
      pattern: /(#|\/\/)[^\n\r]*/,
      group: Lexer.SKIPPED
    })
    const LCurly = createToken({ name: "LCurly", label: '{', pattern: /{/ })
    const RCurly = createToken({ name: "RCurly", label: '}', pattern: /}/ })
    const LSquare = createToken({ name: "LSquare", label: '[', pattern: /\[/ })
    const RSquare = createToken({ name: "RSquare", label: ']', pattern: /]/ })
    const LParen = createToken({name: 'LParen', label: '(', pattern: /\(/})
    const RParen = createToken({name: 'RParen', label: ')', pattern: /\)/})
    const Comma = createToken({ name: "Comma", label: ',', pattern: /,/ })
    const PI = createToken({name: 'PI', label: 'pi', pattern: /pi/})
    const U = createToken({name: 'U', label: 'U', pattern: /U/})
    const CX = createToken({name: 'CX', label: 'CX', pattern: /CX/})
    const GATE = createToken({name: 'GATE', label: 'gate', pattern: /gate/})
    const Barrier = createToken({name: 'Barrier', label: 'barrier', pattern: /barrier/})
    const QREG = createToken({name: 'QREG', label: 'qreg', pattern: /qreg/})
    const CREG = createToken({name: 'CREG', label: 'creg', pattern: /creg/})
    const Measure = createToken({name: 'Measure', label: 'measure', pattern: /measure/})
    const Semi = createToken({name: 'Semi', label: ';', pattern: /;/})
    const MeasureOP = createToken({name: 'MeasureOP', label: '->', pattern: /\-\>/})
    const Reset = createToken({name: 'Reset', label: 'reset', pattern: /reset/})
    const Opaque = createToken({name: 'Opaque', label: 'opaque', pattern: /opaque/})
    const IF = createToken({name: 'IF', label: 'if', pattern: /if/})
    const EQUAL = createToken({name: 'EQUAL', label: '==', pattern: /==/})
    const LanguageDecl = createToken({name: 'LanguageDecl', label: 'Language', pattern: /(IBMQASM|OPENQASM)/})
    const Include = createToken({name: 'Include', label: 'include', pattern: /include/})
    const StringLiteral = createToken({name: 'StringLiteral', label: 'String', pattern: /"(:?[^\\"\n\r]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/})

    // using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
    // AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
    // actual Tokens that can appear in the text
    const AdditionOperator = createToken({
      name: "AdditionOperator",
      pattern: Lexer.NA
    })
    const Plus = createToken({
      name: "Plus",
      label: '+',
      pattern: /\+/,
      categories: AdditionOperator
    })
    const Minus = createToken({
      name: "Minus",
      label: '-',
      pattern: /-/,
      categories: AdditionOperator
    })

    const MultiplicationOperator = createToken({
      name: "MultiplicationOperator",
      pattern: Lexer.NA
    })
    const Multi = createToken({
      name: "Multi",
      label: '*',
      pattern: /\*/,
      categories: MultiplicationOperator
    })
    const Div = createToken({
      name: "Div",
      label: '/',
      pattern: /\//,
      categories: MultiplicationOperator
    })
    const Pow = createToken({
      name: 'Pow',
      label: '^',
      pattern: /\^/,
      categories: MultiplicationOperator
    })

    const UnaryOP = createToken({
      name: 'UnaryOP',
      pattern: /(sin|cos|tan|exp|ln|sqrt)/
    })

    const Identifier = createToken({
      name: 'Identifier',
      pattern: /[a-z][a-zA-Z0-9_]*/
    })

    const RealNumberLiteral = createToken({
      name: "RealNumberLiteral",
      pattern: /([0-9]+\.[0-9]*|[0-9]*\.[0-9]+)([eE][-+]?[0-9]+)?/
    })

    const IntegerLiteral = createToken({
      name: 'IntegerLiteral',
      label: 'int',
      pattern: /([1-9]+[0-9]*|0)/
    })

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      label: 'whitespace',
      pattern: /[ \t\n\r]+/,
      // ignore whitespace
      group: Lexer.SKIPPED
    })

    const QASMTokens = [
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
      Barrier,
      GATE,
      QREG,
      CREG,
      Measure,
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
    class QASMParser extends Parser {
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
                const exps = $.SUBRULE($.explist)
                $.CONSUME(RParen)
                const args = $.SUBRULE($.argument)
                $.CONSUME(Semi)
                ops.push({code: OP_U, args: [exps, args]})
              }
            },
            {
              ALT: () => {
                $.CONSUME(CX)
                const arg1 = $.SUBRULE2($.argument)
                $.CONSUME(Comma)
                const arg2 = $.SUBRULE3($.argument)
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

    return {
      lexer: QASMLexer,
      parser: QASMParser,
      defaultRule: 'mainprogram'
    }
}

var samples = {

    "QASM grammar and embedded semantics": {
        implementation: qasmExample,
      sampleInputs: {
          valid: "// quantum ripple-carry adder from Cuccaro et al, quant-ph/0410184\n" +
                "IBMQASM 2.0;\n" +
            "include \"qelib1.inc\";\n" +
            "gate majority a,b,c\n" +
            "{\n" +
            "  cx c,b;\n" +
            "  cx c,a;\n" +
            "  ccx a,b,c;\n" +
            "}\n" +
            "gate unmaj a,b,c\n" +
            "{\n" +
            "  ccx a,b,c;\n" +
            "  cx c,a;\n" +
            "  cx a,b;\n" +
            "}\n" +
            "qreg cin[1];\n" +
            "qreg a[4];\n" +
            "qreg b[4];\n" +
            "qreg cout[1];\n" +
            "creg ans[5];\n" +
            "// set input states\n" +
            "x a[0]; // a = 0001\n" +
            "x b;    // b = 1111\n" +
            "// add a to b, storing result in b\n" +
            "majority cin[0],b[0],a[0];\n" +
            "majority a[0],b[1],a[1];\n" +
            "majority a[1],b[2],a[2];\n" +
            "majority a[2],b[3],a[3];\n" +
            "cx a[3],cout[0];\n" +
            "unmaj a[2],b[3],a[3];\n" +
            "unmaj a[1],b[2],a[2];\n" +
            "unmaj a[0],b[1],a[1];\n" +
            "unmaj cin[0],b[0],a[0];\n" +
            "measure b[0] -> ans[0];\n" +
            "measure b[1] -> ans[1];\n" +
            "measure b[2] -> ans[2];\n" +
            "measure b[3] -> ans[3];\n" +
            "measure cout[0] -> ans[4];\n"
      }
    },
}

