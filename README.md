QASM source code parser
##Install
if using `npm`, just run  
```
npm i --save qasm
```  
or if using `yarn`:  
```
yarn add qasm
```
##How to use
This is a simple example:  
```js  
import {parse, printOperations} from 'qasm'
  
const sourceCode = '...'
// here value contains generated operations
const {tokens, value} = parse(sourceCode)
printOperations(value)

```
##Grammar diagram

##OpenQASM Specification
[https://github.com/Qiskit/openqasm](https://github.com/Qiskit/openqasm)

##License
MIT