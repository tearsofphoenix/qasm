import {expect} from 'chai'
import fs from 'fs'
import path from 'path'
import parse from '../src/parser'
import {printOperations} from "../src/util";

describe('token test', () => {
  const content = fs.readFileSync(path.resolve(__dirname, './demo.qasm'), {encoding: 'utf8'})

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
    const [gatename, params, qargs, body] = value[0].args
    console.log(body[0])
  });
})
