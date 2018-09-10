import {expect} from 'chai'
import fs from 'fs'
import path from 'path'
import parse from '../src/parser'
import {printOperations} from "../src/util";
import {OP_DECL_GATE, OP_U} from "../src/opcode";

describe('token test', () => {
  const content = fs.readFileSync(path.resolve(__dirname, './demo.qasm'), {encoding: 'utf8'})
  const lib = fs.readFileSync(path.resolve(__dirname, './qelib1.inc'), {encoding: 'utf8'})
  it('should parse comment', function () {
    const {tokens, value} = parse(content)
    tokens.forEach(t => console.log(t))
    console.log('----------------------------')
    printOperations(value)
  });

  it('should parse U ', function () {
    const content = `gate u3 (theta, phi, lambda) q
     { U(theta, phi, lambda) q; }
    `
    const {value} = parse(content)
    const [op] = value
    const [gatename, params, qargs, body] = op.args
    expect(value.length).to.equal(1)
    expect(op.code).to.equal(OP_DECL_GATE)
    expect(body.length).to.equal(1)
    const [uop] = body
    expect(uop.code).to.equal(OP_U)
    const [uparams] = uop.args
    expect(uparams.length).to.equal(3)
  });

  it('should parse Library', function () {
    const {lexErrors, parseErrors} = parse(lib)
    expect(lexErrors.length).to.equal(0)
    expect(parseErrors.length).to.equal(0)
  });

  it('should test reset', function () {
    const content1 = `reset q[0];`
    const c2 = `reset q;`
    const {value} = parse(content1)
    const v2 = parse(c2)
    console.log(value, v2.value)
  });
})
