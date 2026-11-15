import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const dataRoot = fileURLToPath(new URL('../../app/src/data/', import.meta.url));
import ts from 'typescript';
const cache=new Map();
function load(name){const filename=path.resolve(dataRoot,name+'.ts');if(cache.has(filename))return cache.get(filename);const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext('(function(require,module,exports){'+js+'\n})',{console})(specifier=>load(path.basename(specifier)),module,module.exports);cache.set(filename,module.exports);return module.exports;}
const names=['doctors','dashboard','services','mockPatients','mockAppointments','inventory','mockClinicalData','mockUsers'];const dataset=Object.fromEntries(names.map(name=>[name,load(name)]));dataset.mockUsers.mockUsers=dataset.mockUsers.mockUsers.map(({password,...user})=>user);fs.writeFileSync(new URL('./seed-data.json',import.meta.url),JSON.stringify(dataset,null,2)+'\n');
