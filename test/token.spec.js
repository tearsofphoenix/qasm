import {expect} from 'chai'
import fs from 'fs'
import path from 'path'
import parse from '../src/parser'

describe('token test', () => {
  const content = fs.readFileSync(path.resolve(__dirname, './demo.qasm'), {encoding: 'utf8'})

  it('should parse comment', function () {
    const {tokens} = parse(content)
    tokens.forEach(t => console.log(t))
  });
})
