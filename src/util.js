import {
  OP_ARRAY_INDEX,
  OP_DECL_CREG,
  OP_DECL_GATE,
  OP_DECL_QREG,
  OP_GATE_OP,
  OP_INCLUDE, OP_INDEX,
  OP_MEASURE,
  OP_VERSION
} from "./opcode"

export function opToString(op, join) {
  if (Array.isArray(op)) {
    return op.map(looper => opToString(looper)).join(join || ', ')
  }
  const {code, args} = op
  switch (code) {
    case OP_VERSION: {
      return `[VERSION] ${args[0]}`
    }
    case OP_INCLUDE: {
      return `[INCLUDE] ${args[0]}`
    }
    case OP_DECL_GATE: {
      const [gatename, params, qargs, body] = args
      return `[DECL_GATE] ${gatename} (${opToString(params)}) ${opToString(qargs)} {\n ${opToString(body, '\n')} \n}`
    }
    case OP_DECL_QREG: {
      const [name, size] = args
      return `[DECL_QREG] ${name}[${size}]`
    }
    case OP_DECL_CREG: {
      const [name, size] = args
      return `[DECL_CREG] ${name}[${size}]`
    }
    case OP_GATE_OP: {
      const [gatename, params, qargs] = args
      return `[GATE_OP] ${gatename} ${opToString(params)} ${opToString(qargs)}`
    }
    case OP_MEASURE: {
      const [qreg, creg] = args
      return `[MEASURE] ${opToString(qreg)} -> ${opToString(creg)}`
    }
    case OP_ARRAY_INDEX: {
      const [id, index] = args
      return `${id}[${index}]`
    }
    case OP_INDEX: {
      const [id] = args
      return id
    }
    default: {
      return op.toString()
    }
  }
}

export function printOperations(ops) {
  if (ops && Array.isArray(ops)) {
    const str = ops.map(op => opToString(op)).join('\n')
    console.log(str)
  }
}
