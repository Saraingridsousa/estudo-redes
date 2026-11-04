const fs=require('node:fs');const path=require('node:path');
const root=__dirname;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('content.json'));
const replacements={'/*STYLE*/':read('src/style.css'),'/*DATA*/':JSON.stringify(data).replace(/</g,'\\u003c'),'/*CORE*/':read('src/core.js'),'/*APP*/':read('src/app.js')};
let html=read('src/shell.html');for(const [mark,value] of Object.entries(replacements))html=html.replace(mark,()=>value);
fs.writeFileSync(path.join(root,'Redes-TVC2.html'),html,'utf8');
fs.writeFileSync(path.join(root,'index.html'),html,'utf8');
console.log(JSON.stringify({artifact:path.join(root,'Redes-TVC2.html'),modules:data.modules.length,practiceQuestions:data.modules.reduce((n,m)=>n+m.questions.length,0),examQuestions:data.examQuestions.length,bytes:Buffer.byteLength(html)}));
