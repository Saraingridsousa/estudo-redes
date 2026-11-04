const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '../src/core.js');
test('revisão inclui erros e autoavaliações pendentes, não questões dominadas',()=>{
 const c=require(target); assert.equal(typeof c.reviewIds,'function','fila de revisão não implementada');
 let s=c.freshState();s=c.recordChoice(s,{id:'a',answerIndex:0},1);s=c.recordChoice(s,{id:'b',answerIndex:0},0);s=c.recordOpen(s,'c','Uma explicação.');
 assert.deepEqual(c.reviewIds(s),['a','c']);
 s=c.selfAssess(s,'c',true);assert.deepEqual(c.reviewIds(s),['a']);
 assert.throws(()=>c.selfAssess(s,'ausente',true),/tentativa/i);
});
test('progresso válido é restaurado e dados corrompidos voltam ao início',()=>{
 const c=require(target);assert.equal(typeof c.restoreState,'function','restauração não implementada');
 const s=c.recordChoice(c.freshState(),{id:'q1',answerIndex:1},1);
 assert.deepEqual(c.restoreState(JSON.stringify(s)),s);
 for(const raw of ['{quebrado','null','{"version":99}','{"version":1,"answers":[]}'])assert.deepEqual(c.restoreState(raw),c.freshState());
});
test('questão objetiva só registra resultado depois da tentativa', () => {
  assert.ok(fs.existsSync(target), 'motor de exercícios ainda não implementado');
  const core = require(target);
  const state = core.freshState();
  assert.equal(core.hasAttempt(state, 'q1'), false);
  const next = core.recordChoice(state, {id:'q1',answerIndex:1}, 0);
  assert.equal(core.hasAttempt(next, 'q1'), true);
  assert.equal(next.answers.q1.correct, false);
  assert.equal(state.answers.q1, undefined, 'não deve mutar estado anterior');
});
test('resposta aberta exige tentativa e não inventa nota automática', () => {
 const core=require(target); const state=core.freshState();
 assert.equal(typeof core.recordOpen, 'function', 'respostas abertas não implementadas');
 assert.throws(()=>core.recordOpen(state,'q2','   '), /resposta/i);
 const next=core.recordOpen(state,'q2','O endereço IP identifica o host e a porta o serviço.');
 assert.equal(next.answers.q2.correct, null);
 assert.match(next.answers.q2.text,/endereço/);
});
