const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.join(__dirname,'..');const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
test('conteúdo possui 10 aulas e 36 questões completas com identificadores únicos',()=>{
 assert.equal(data.modules.length,10);const qs=[...data.modules.flatMap(m=>m.questions),...data.examQuestions];assert.equal(qs.length,36);assert.equal(new Set(qs.map(q=>q.id)).size,36);
 for(const m of data.modules){assert.ok(m.evidence);assert.ok(m.blocks.length>=2);assert.ok(m.blocks.every(b=>b.html.length>200));}
 for(const q of qs){assert.ok(q.prompt&&q.answer&&q.source);if(q.type==='choice'){assert.ok(q.options.length>=3);assert.ok(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<q.options.length);}else{assert.ok(q.criteria.length>=2);}}
});
test('entrada do site público existe e corresponde à página de estudo',()=>{
 const entry=path.join(root,'index.html');assert.ok(fs.existsSync(entry),'index.html ainda não foi gerado');assert.deepEqual(fs.readFileSync(entry),fs.readFileSync(path.join(root,'Redes-TVC2.html')));
});
test('artefato é autocontido, sem URLs de login, tokens ou carregamentos externos',()=>{
 const html=fs.readFileSync(path.join(root,'Redes-TVC2.html'),'utf8');assert.ok(html.includes('id="course-data"'));assert.ok(!/\/\*(STYLE|DATA|CORE|APP)\*\//.test(html));assert.ok(!/<script[^>]+src\s*=|<link[^>]+href\s*=/i.test(html));assert.ok(!/refresh_token|client_secret|localhost:1|accounts\.google\.com|google_student_token/.test(html));
});
