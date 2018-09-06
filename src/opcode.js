
// OPENASM 2.0;
export const OP_VERSION = 0x01

// include "qelib1.inc"
export const OP_INCLUDE = 0x02

export const OP_DECL_GATE = 0x03

export const OP_DECL_QREG = 0x04

export const OP_DECL_CREG = 0x05

export const OP_OPAQUE = 0x06

export const OP_U = 0x07

export const OP_CX = 0x08

export const OP_MEASURE = 0x09

export const OP_RESET = 0x10

export const OP_GATE_OP = 0x11

export const OP_TEST = 0x12

export const OP_BARRIER = 0x13

// such as `a[1]`
export const OP_ARRAY_INDEX = 0x14

// resolve identifier value
export const OP_INDEX = 0x15

// sin/cos/tan/exp/ln/sqrt
export const OP_UNARY_OP = 0x16

export const OP_PLUS = 0x17

export const OP_MINUS = 0x18

export const OP_MULTIPLY = 0x19

export const OP_DIVIDE = 0x20

export const OP_POW = 0x21

export const OP_GET_LAST_OP_RESULT = 0x22
