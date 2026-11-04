(function(root,factory){const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;else root.StudyCore=core;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function freshState(){return {version:1,answers:{},drafts:{},completed:[],currentModule:0,mode:'learn'};}
function hasAttempt(state,id){return Boolean(state.answers[id]);}
function recordChoice(state,question,index){
 if(!Number.isInteger(index)||index<0)throw new Error('Escolha uma alternativa.');
 return {...state,answers:{...state.answers,[question.id]:{type:'choice',choice:index,correct:index===question.answerIndex,attempts:(state.answers[question.id]?.attempts||0)+1}}};
}
function recordOpen(state,id,text){
 if(typeof text!=='string'||!text.trim())throw new Error('Escreva sua resposta antes de abrir a correção.');
 return {...state,answers:{...state.answers,[id]:{type:'open',text:text.trim(),correct:null,attempts:(state.answers[id]?.attempts||0)+1}}};
}
function reviewIds(state){return Object.keys(state.answers).filter(id=>state.answers[id].correct!==true);}
function selfAssess(state,id,correct){
 if(!state.answers[id]||state.answers[id].type!=='open')throw new Error('Faça uma tentativa aberta primeiro.');
 return {...state,answers:{...state.answers,[id]:{...state.answers[id],correct:Boolean(correct),selfAssessed:true}}};
}
function restoreState(raw){
 try{const s=JSON.parse(raw);if(!s||s.version!==1||!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))return freshState();
 return {...freshState(),...s,completed:Array.isArray(s.completed)?s.completed:[],drafts:s.drafts&&typeof s.drafts==='object'&&!Array.isArray(s.drafts)?s.drafts:{}};
 }catch{return freshState();}
}
return {freshState,hasAttempt,recordChoice,recordOpen,reviewIds,selfAssess,restoreState};
});
