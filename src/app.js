(()=>{
'use strict';
const COURSE=JSON.parse(document.getElementById('course-data').textContent);
COURSE.modules.forEach(m=>{m.title=m.title.replace(/^\d+\.\s*/, '');});
const Core=StudyCore,KEY='redes-tvc2-sara-v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageOK=true,raw=null;try{raw=localStorage.getItem(KEY);}catch{storageOK=false;}
let state=Core.restoreState(raw),retrying=new Set(),reviewQueue=[],reviewIndex=0,reviewFilter='due',examIndex=0,reviewStarted=false;
const questions=COURSE.modules.flatMap((m,i)=>m.questions.map(q=>({...q,moduleIndex:i,moduleTitle:m.title})));
const allQuestions=[...questions,...COURSE.examQuestions.map(q=>({...q,moduleTitle:'Simulado autoral'}))];
const byId=Object.fromEntries(allQuestions.map(q=>[q.id,q]));
state.currentModule=Math.max(0,Math.min(COURSE.modules.length-1,Number(state.currentModule)||0));
if(!['learn','review','exam','sources'].includes(state.mode))state.mode='learn';
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}updateHeader();}
function toast(text){const e=$('#toast');e.textContent=text;e.style.display='block';clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>e.style.display='none',4000);}
function updateHeader(){
 const valid=Object.entries(state.answers).filter(([id])=>byId[id]);
 $('#answered-count').textContent=valid.length;
 $('#progress-caption').textContent=`de ${allQuestions.length} questões · ${valid.filter(([,a])=>a.correct===true).length} marcadas como compreendidas`;
 $('#progress-fill').style.width=`${valid.length/allQuestions.length*100}%`;
 $('#review-count').textContent=Core.reviewIds(state).filter(id=>byId[id]).length;
 $('#storage-note').textContent=storageOK?'Salvo neste navegador · exporte para guardar uma cópia.':'Não foi possível salvar aqui. Use “Salvar progresso” antes de sair.';
 $$('.modebar button').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-current',b.dataset.mode===state.mode?'page':'false');});
}
function renderTrail(){
 $('#trail').innerHTML=COURSE.modules.map((m,i)=>{
 const done=m.questions.filter(q=>state.answers[q.id]).length;
 return `<button class="trail-item ${i===state.currentModule&&state.mode==='learn'?'active':''}" data-lesson="${i}" ${i===state.currentModule&&state.mode==='learn'?'aria-current="step"':''}><span class="trail-number">${String(i+1).padStart(2,'0')}</span><span>${esc(m.title)}<small>${done}/${m.questions.length} questões respondidas</small></span></button>`;
 }).join('');
}
function questionHTML(q,ordinal){
 const a=retrying.has(q.id)?null:state.answers[q.id];
 const draft=retrying.has(q.id)?state.drafts[q.id]??'':state.drafts[q.id]??a?.text??'';
 let field=q.type==='choice'?`<fieldset class="options" style="border:0;padding:0"><legend class="sr-only">Escolha uma alternativa</legend>${q.options.map((o,i)=>`<label class="option ${a&&i===q.answerIndex?'correct-option':''} ${a&&i===a.choice&&!a.correct?'wrong-option':''}"><input type="radio" name="${esc(q.id)}" value="${i}" ${a?.choice===i?'checked':''} ${a?'disabled':''}><span>${esc(o)}</span></label>`).join('')}</fieldset>`:`<label class="sr-only" for="answer-${esc(q.id)}">Sua resposta</label><textarea id="answer-${esc(q.id)}" data-draft="${esc(q.id)}" placeholder="Explique com suas palavras. Se houver cálculo, mostre as unidades e as etapas." ${a?'readonly':''}>${esc(draft)}</textarea>`;
 const feedback=a?`<div class="feedback ${a.correct===false?'wrong':''}"><h4>${q.type==='open'?'Compare seu raciocínio':a.correct?'Isso! Agora confira o porquê.':'Ainda não — vamos ao raciocínio.'}</h4><div>${q.answer}</div>${q.type==='open'?`<div class="criteria"><p>Minha resposta contemplou…</p><ul>${(q.criteria||[]).map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div><div class="actions"><button class="${a.correct===true?'primary':'secondary'}" data-assess="${esc(q.id)}" data-correct="true">Entendi e expliquei</button><button class="${a.correct===false?'primary':'secondary'}" data-assess="${esc(q.id)}" data-correct="false">Preciso rever</button></div><p class="feedback-note">Autoavaliação: a página não atribui nota à sua resposta discursiva.</p>`:''}<div class="actions"><button class="small-button" data-retry="${esc(q.id)}">Tentar novamente sem gabarito</button></div></div>`:'';
 return `<section class="question" data-question="${esc(q.id)}"><p class="question-meta">PAUSA PARA PRATICAR · ${esc(ordinal)} · ${q.type==='choice'?'QUIZ':'DISCURSIVA'}</p><h3>${q.prompt}</h3><form data-submit-question="${esc(q.id)}">${field}${!a?`<div class="actions"><button class="primary" type="submit">${q.type==='open'?'Comparar com a resposta':'Conferir resposta'}</button><span class="feedback-note">Tente primeiro. O gabarito vem depois.</span></div>`:''}</form>${feedback}<p class="question-source">${esc(q.source||'Questão autoral de apoio — não é uma previsão da prova.')}</p></section>`;
}
function lessonHTML(){
 const m=COURSE.modules[state.currentModule];let body='';
 m.blocks.forEach((block,i)=>{body+=`<section class="lesson-section"><p class="mini-label">ENTENDER · ${String(i+1).padStart(2,'0')}</p><h3>${esc(block.title)}</h3>${block.html}</section>`;const qi=i-1;if(qi>=0&&m.questions[qi])body+=questionHTML(m.questions[qi],qi+1);});
 m.questions.slice(Math.max(0,m.blocks.length-1)).forEach((q,j)=>{body+=questionHTML(q,Math.max(0,m.blocks.length-1)+j+1);});
 return `<header class="lesson-head"><p class="section-label">SUA TRILHA / AULA ${String(state.currentModule+1).padStart(2,'0')}</p><h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p><span class="source-pill">${esc(m.status||'Base da disciplina')}</span><p class="source-line">Base: ${esc(m.evidence)}</p></header>${body}<nav class="lesson-pagination" aria-label="Trocar de aula"><button class="secondary" data-lesson="${state.currentModule-1}" ${state.currentModule===0?'disabled':''}>← Aula anterior</button><span>${state.currentModule+1} de ${COURSE.modules.length}</span>${state.currentModule<COURSE.modules.length-1?`<button class="primary" data-lesson="${state.currentModule+1}">Próxima aula →</button>`:'<button class="primary" data-mode="review">Ir para revisão →</button>'}</nav>`;
}
function makeReview(){
 const due=new Set(Core.reviewIds(state));
 reviewQueue=questions.filter(q=>reviewFilter==='all'||reviewFilter==='due'&&due.has(q.id)||String(q.moduleIndex)===reviewFilter);
 // Intercala assuntos sem embaralhar durante uma tentativa.
 reviewQueue=reviewQueue.filter((q,i)=>i%2===0).concat(reviewQueue.filter((q,i)=>i%2!==0));reviewIndex=0;reviewStarted=true;
 for(const q of reviewQueue){retrying.add(q.id);delete state.drafts[q.id];}
}
function reviewHTML(){
 const controls=`<div class="panel-controls"><label class="sr-only" for="review-filter">O que revisar</label><select id="review-filter"><option value="due" ${reviewFilter==='due'?'selected':''}>Erros e discursivas a revisar</option><option value="all" ${reviewFilter==='all'?'selected':''}>Misturar todos os assuntos</option>${COURSE.modules.map((m,i)=>`<option value="${i}" ${String(i)===reviewFilter?'selected':''}>${esc(m.title)}</option>`).join('')}</select><button class="primary" id="start-review">${reviewStarted?'Reiniciar rodada':'Começar revisão'}</button></div>`;
 let body='';
 if(!reviewStarted)body='<div class="empty-state"><h3>Recupere da memória.</h3><p>Escolha uma rodada. Os erros e as discursivas ainda não autoavaliadas ficam na fila de revisão. Você também pode praticar tudo, mesmo antes de estudar.</p></div>';
 else if(!reviewQueue.length)body='<div class="empty-state"><h3>Nada pendente nesta seleção.</h3><p>Isso não mede domínio do conteúdo: talvez você ainda não tenha tentado as questões. Selecione “Misturar todos os assuntos” para treinar.</p></div>';
 else if(reviewIndex>=reviewQueue.length)body='<div class="empty-state"><h3>Rodada concluída.</h3><p>Os erros continuam na sua fila. Faça outra rodada ou volte à aula do assunto que precisa de atenção.</p><button class="secondary" data-mode="learn">Voltar às aulas</button></div>';
 else {const q=reviewQueue[reviewIndex];body=`<p class="review-step">QUESTÃO ${reviewIndex+1} DE ${reviewQueue.length} · ${esc(q.moduleTitle)}</p>${questionHTML(q,reviewIndex+1)}<div class="actions"><button class="primary" id="next-review" ${!state.answers[q.id]||retrying.has(q.id)?'disabled':''}>${reviewIndex===reviewQueue.length-1?'Concluir rodada':'Próxima questão →'}</button><button class="text-button" data-lesson="${q.moduleIndex}">Rever explicação desta aula</button></div>`;}
 return `<section class="panel-intro"><p class="section-label">RECUPERAR / CONECTAR / REFORÇAR</p><h2>O que ficou, sem olhar?</h2><p>Uma questão de cada vez. O gabarito reaparece só depois de uma nova tentativa.</p>${controls}</section>${body}`;
}
function examHTML(){
 const q=COURSE.examQuestions[examIndex];
 return `<section class="panel-intro"><p class="section-label">TREINO DE ESCRITA / ESTILO TVC</p><h2>Agora, como na prova.</h2><p>Questões autorais, inspiradas no formato da TVC1. Não são questões previstas nem gabarito oficial.</p></section><details class="exam-intro"><summary>O que a TVC1 ensina sobre o jeito de responder</summary><div style="padding-top:18px">${COURSE.examAnalysis}</div></details><p class="review-step">QUESTÃO ${examIndex+1} DE ${COURSE.examQuestions.length}</p>${questionHTML(q,examIndex+1)}<nav class="lesson-pagination"><button class="secondary" id="exam-prev" ${examIndex===0?'disabled':''}>← Anterior</button><span>Escreva a justificativa, não só a conclusão.</span><button class="primary" id="exam-next" ${examIndex===COURSE.examQuestions.length-1?'disabled':''}>Próxima →</button></nav><p class="endnote">Use papel para contas e tabelas. A foto da TVC1 avisa que a prova não pode ser digitada; esta página é para praticar antes.</p>`;
}
function sourcesHTML(){return `<section class="panel-intro"><p class="section-label">TRANSPARÊNCIA / ESCOPO / REFERÊNCIAS</p><h2>De onde veio o caderno.</h2><p>As aulas são explicações autorais. As referências abaixo mostram o material usado como base.</p></section><div class="scope-note"><strong>O que está confirmado:</strong> o plano marca TVC2 em 05/11/2026 e unidades 1–6. A prioridade de sub-redes e roteamento vem da Lista 02; não é uma garantia do que cairá. O plano tem cabeçalho antigo e cronograma de 2026. Mudanças comunicadas em sala precisam ser confirmadas com o professor.</div>${COURSE.sources.map((s,i)=>`<article class="source-entry"><h3>${String(i+1).padStart(2,'0')} / ${esc(s.title)}</h3><p>${esc(s.note)}</p>${s.url?`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Consultar referência</a></p>`:''}</article>`).join('')}<article class="source-entry"><h3>Sua foto da TVC1</h3><p>Base de formato: conversão de unidades, comparação de métodos, interpretação de cenário e explicações de sockets, transporte e DNS. Sem gabarito oficial. “300G” e a questão de e-mail têm ambiguidades que estão explicitadas no conteúdo.</p></article><p class="endnote">Privacidade: esta página funciona sem conexão com o Classroom. Suas respostas ficam apenas no navegador. A cópia exportada contém suas respostas; guarde-a com cuidado.</p>`;}
function render(focus=false){
 updateHeader();renderTrail();
 $('#content').innerHTML=state.mode==='learn'?lessonHTML():state.mode==='review'?reviewHTML():state.mode==='exam'?examHTML():sourcesHTML();
 if(focus){$('#content').focus({preventScroll:true});const box=$('#content').getBoundingClientRect();if(box.top<0||box.top>innerHeight*.8)window.scrollTo({top:Math.max(0,window.scrollY+box.top-22),behavior:'auto'});}
}
function navigate(mode,index){state.mode=mode;if(Number.isInteger(index)&&index>=0&&index<COURSE.modules.length)state.currentModule=index;save();render(true);}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.mode){navigate(b.dataset.mode);return;}
 if(b.dataset.lesson!==undefined){navigate('learn',Number(b.dataset.lesson));return;}
 if(b.dataset.assess){state=Core.selfAssess(state,b.dataset.assess,b.dataset.correct==='true');save();render();return;}
 if(b.dataset.retry){retrying.add(b.dataset.retry);delete state.drafts[b.dataset.retry];save();render();return;}
 if(b.id==='start-review'){makeReview();save();render();return;}
 if(b.id==='next-review'){reviewIndex++;render(true);return;}
 if(b.id==='exam-next'){examIndex++;render(true);return;}
 if(b.id==='exam-prev'){examIndex--;render(true);return;}
 if(b.id==='toggle-trail'){const e=$('#trail');const hide=e.style.display!=='none';e.style.display=hide?'none':'';b.textContent=hide?'Expandir':'Recolher';b.setAttribute('aria-expanded',String(!hide));return;}
 if(b.id==='export-btn'){const blob=new Blob([JSON.stringify({course:'DCC042-TVC2-2026',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='progresso-redes-sara.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Cópia do progresso preparada para download.');}
});
document.addEventListener('input',event=>{if(event.target.dataset.draft){state.drafts[event.target.dataset.draft]=event.target.value;save();}});
document.addEventListener('change',event=>{if(event.target.id==='review-filter'){reviewFilter=event.target.value;reviewStarted=false;render();}});
document.addEventListener('submit',event=>{
 const form=event.target.closest('form[data-submit-question]');if(!form)return;event.preventDefault();const q=byId[form.dataset.submitQuestion];
 try{if(q.type==='choice'){const checked=form.querySelector('input:checked');if(!checked)throw new Error('Escolha uma alternativa antes de conferir.');state=Core.recordChoice(state,q,Number(checked.value));}else{state=Core.recordOpen(state,q.id,form.querySelector('textarea').value);}retrying.delete(q.id);save();render();}catch(e){toast(e.message);}
});
$('.brand').addEventListener('click',e=>{e.preventDefault();navigate('learn',0);});
render();
})();
