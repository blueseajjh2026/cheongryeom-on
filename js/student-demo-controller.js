(function(){
'use strict';
const DB=window.CheongDB;
let dock=null;
function ensureDock(){if(dock)return dock;dock=document.createElement('div');dock.id='demoAdvanceDock';dock.innerHTML='<div><b>심사위원 데모 진행</b><span id="demoStepText">수험등록 후 실제 화면을 순서대로 체험하세요.</span></div><button type="button" id="demoAdvanceBtn" class="btn primary">다음 단계 →</button>';document.body.appendChild(dock);const st=document.createElement('style');st.textContent='#demoAdvanceDock{position:fixed;z-index:9999;left:50%;bottom:12px;transform:translateX(-50%);width:min(680px,calc(100% - 20px));display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:rgba(11,61,88,.96);color:#fff;border:1px solid rgba(255,255,255,.28);box-shadow:0 8px 24px rgba(0,0,0,.18);border-radius:10px}#demoAdvanceDock>div{min-width:0}#demoAdvanceDock b{display:block;font-size:13px}#demoAdvanceDock span{display:block;margin-top:2px;font-size:11px;opacity:.86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#demoAdvanceDock .btn{flex:0 0 auto;padding:9px 13px;background:#fff;color:#0b5f8a}@media(max-width:520px){#demoAdvanceDock{bottom:7px}#demoAdvanceDock span{max-width:220px}}';document.head.appendChild(st);document.getElementById('demoAdvanceBtn').onclick=advance;return dock;}
function pathAnswer(stage,id){try{return DB.demo.getState(code).answers?.[stage]?.[id]?.[DB.uid]||null}catch(e){return null}}
function message(s){const el=document.getElementById('demoStepText');if(el)el.textContent=s;}
async function advance(){if(typeof code==='undefined'||!code)return;const r=DB.demo.getState(code),st=control?.stage||'waiting',i=Number(control?.index||0),tr=CHEONGRYEOM_TRACK(me?.trackKey||'business');
 if(st==='waiting')return DB.setControl(code,{stage:'intro',index:0});
 if(st==='intro')return DB.setControl(code,{stage:'written',index:0,reveal:false});
 if(st==='written'){const q=tr.written[i];if(!pathAnswer('written',q.id)){toast('현재 필기문항의 답안을 먼저 제출해주세요.');return;}if(i<tr.written.length-1)return DB.setControl(code,{index:i+1,reveal:false});return DB.setControl(code,{stage:'writtenFeedback',index:0,reveal:false});}
 if(st==='writtenFeedback')return DB.setControl(code,{stage:'practical',index:0,reveal:false,timerEnd:null});
 if(st==='practical'){const q=tr.practical[i];if(!pathAnswer('practical',q.id)){toast('현재 작업형 실기를 먼저 제출해주세요.');return;}if(i<tr.practical.length-1)return DB.setControl(code,{index:i+1,timerEnd:null});return DB.setControl(code,{stage:'practicalFeedback',index:0,timerEnd:null});}
 if(st==='practicalFeedback')return DB.setControl(code,{stage:'team',index:0,teamPhase:'briefing',teamBoards:null,teamScores:null});
 if(st==='team'){const ph=control?.teamPhase||'briefing';if(ph==='briefing'){if(!r.answers?.team?.role?.[DB.uid]){toast('개인 직무분석을 먼저 제출해주세요.');return;}DB.demo.seedStudentMateAnswers(code);r.control.teamBoards=DB.demo.makeBoards(code);DB.demo.notify(code);return DB.setControl(code,{teamPhase:'board',teamBoards:r.control.teamBoards});}if(ph==='board')return DB.setControl(code,{teamPhase:'twist',teamBoards:DB.demo.makeBoards(code)});if(ph==='twist')return DB.setControl(code,{teamPhase:'decision',teamBoards:DB.demo.makeBoards(code)});if(ph==='decision'){if(!r.answers?.team?.report?.[DB.uid]){toast('나의 최종위원 의견을 먼저 제출해주세요.');return;}DB.demo.scoreStudentTeam(code);DB.demo.notify(code);return DB.setControl(code,{teamPhase:'scored',teamBoards:r.control.teamBoards,teamScores:r.control.teamScores});}if(ph==='scored')return DB.setControl(code,{stage:'diagnosis',index:0});}
 if(st==='diagnosis')return DB.setControl(code,{stage:'pledge',index:0});
 if(st==='pledge'){if(!r.pledges?.[DB.uid]?.text){toast('청렴 실천약속을 먼저 작성해 서명해주세요.');return;}return DB.setControl(code,{stage:'result',index:0});}
 if(st==='result'){toast('학생용 실전 데모의 전 과정을 완료했습니다.');}
}
function update(){ensureDock();const joined=document.getElementById('examPanel')&&!document.getElementById('examPanel').classList.contains('hidden');dock.style.display=joined?'flex':'none';if(!joined)return;const st=control?.stage||'waiting',ph=control?.teamPhase||'';const names={waiting:'교사가 오리엔테이션을 시작하는 상황을 재현합니다.',intro:'오리엔테이션 확인 후 필기평가로 이동합니다.',written:'답안을 제출한 뒤 다음 문항으로 이동합니다.',writtenFeedback:'1차 피드백 확인 후 작업형 실기로 전환합니다.',practical:'작업물을 제출한 뒤 다음 실기로 이동합니다.',practicalFeedback:'2차 피드백과 종합평가 방법을 확인합니다.',team:'직무회의 단계를 교사 제어처럼 순서대로 전환합니다.',diagnosis:'최종 역량진단을 확인합니다.',pledge:'실천약속을 서명한 뒤 자격판정으로 이동합니다.',result:'전 과정 체험 완료'};message(st==='team'?`${names.team} · 현재 ${ph}`:names[st]||'다음 단계로 이동합니다.');const b=document.getElementById('demoAdvanceBtn');if(b)b.textContent=st==='result'?'체험 완료':(st==='team'&&ph==='scored'?'역량진단 →':'다음 단계 →');}


// v8.6.2: 확대는 실제 student.js의 '가로폭 유지 글자확대' 기능을 그대로 사용합니다.
// 데모 전용 CSS zoom/width 보정은 제거했습니다. 실제 화면과 동일한 동작을 보장합니다.

setInterval(update,350);})();