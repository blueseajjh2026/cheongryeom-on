const C = CHEONGRYEOM_CONTENT;
const DB = CheongDB;
const $ = s => document.querySelector(s);

let code = null;
let control = null;
let myAnswers = { written: {}, practical: {}, team: {role:null, mid:null, report:null} };
let myPledge = null;
let me = null;
let unsubs = [];
let submitting = false;

// 실시간 화면 갱신이 일어나도 학생이 선택한 답이 사라지지 않도록 문항별 임시선택을 보관
const pendingChoices = {};
const practicalDrafts = {};
let teamRoleDraft = {choice:null,riskLevel:'',preliminaryVendor:null,note:'',question:''};
let teamMidDraft = {vendor:null,reason:''};
let teamReportDraft = {issues:[],criteria:[],conflictResponse:null,twistResponse:null,vendor:null,influenceUid:null,reason:''};
let timerTicker = null;

// v8.3 학생 가독성 · 100/110/120 화면확대
const STUDENT_ZOOM_KEY = 'cheongryeomStudentZoom';
function applyStudentZoom(value){
  const z = ['1','1.1','1.2'].includes(String(value)) ? String(value) : '1';
  document.documentElement.style.setProperty('--student-zoom', z);
  localStorage.setItem(STUDENT_ZOOM_KEY, z);
  document.querySelectorAll('[data-student-zoom]').forEach(b=>b.classList.toggle('active', b.dataset.studentZoom===z));
}
function bindStudentZoom(){
  applyStudentZoom(localStorage.getItem(STUDENT_ZOOM_KEY)||'1');
  document.querySelectorAll('[data-student-zoom]').forEach(b=>b.onclick=()=>applyStudentZoom(b.dataset.studentZoom));
}
function syncRequiredCounter(textarea, min){
  if(!textarea) return;
  const note = textarea.previousElementSibling;
  if(!note?.classList?.contains('required-note')) return;
  const n = textarea.value.trim().length;
  note.classList.toggle('ok', n >= min);
  const span = note.querySelector('span');
  if(span) span.textContent = `현재 ${n}/${min}자`;
}


function submitCheckHTML(id, reasons, okText='필수 항목이 모두 입력되었습니다.'){
  const items=(reasons||[]).filter(Boolean);
  if(!items.length) return `<div id="${id}" class="submit-check ok">✓ ${okText}</div>`;
  return `<div id="${id}" class="submit-check"><b>⚠️ 제출 전 확인</b><span>${items.map(x=>`· ${x}`).join('<br>')}</span></div>`;
}
function updateSubmitCheck(id, reasons, okText='필수 항목이 모두 입력되었습니다.'){
  const el=$('#'+id); if(!el)return;
  const items=(reasons||[]).filter(Boolean);
  el.classList.toggle('ok', items.length===0);
  el.innerHTML=items.length?`<b>⚠️ 제출 전 확인</b><span>${items.map(x=>`· ${x}`).join('<br>')}</span>`:`✓ ${okText}`;
}
function panelMissingScoreLabels(q,d){
  const miss=[];
  q.candidates.forEach(c=>q.rubricFields.forEach(f=>{
    const v=Number(d.scores?.[c.id]?.[f.key]||0);
    if(!(v>0&&v<=f.max)) miss.push(`${c.name} · ${f.label}`);
  }));
  return miss;
}
function practicalMissingReasons(q,d){
  const r=[];
  if(q.kind==='procurement'){
    if(!d.conflictVendor) r.push('② 이해관계 확인 항목이 미선택입니다.');
    if((d.criteria||[]).length<2) r.push(`③ 비교기준을 ${2-(d.criteria||[]).length}개 더 선택해주세요.`);
    if(d.selectedVendor===null||!Number.isInteger(Number(d.selectedVendor))) r.push('④ 선정업체가 미선택입니다.');
    const n=String(d.reason||'').trim().length;
    if(n<10) r.push(`④ 선정사유 및 처리기록을 ${10-n}글자 더 작성해주세요.`);
  } else if(q.kind==='sequence'){
    if((d.order||[]).length<4) r.push(`② 처리절차 카드를 ${4-(d.order||[]).length}개 더 선택해주세요.`);
    const n=String(d.note||'').trim().length;
    if(n<10) r.push(`③ 처리의견을 ${10-n}글자 더 작성해주세요.`);
  } else {
    if(!d.revealed){
      const miss=panelMissingScoreLabels(q,d);
      if(miss.length){
        const show=miss.slice(0,3).join(', ');
        r.push(`② 평가점수 미입력: ${show}${miss.length>3?` 외 ${miss.length-3}개`:''}`);
      }else{
        r.push('② 1차 평가 확정 후 추가정보를 확인해주세요.');
      }
    }else{
      if(d.response===null||!Number.isInteger(Number(d.response))) r.push('③ 추가정보 반영 원칙이 미선택입니다.');
      const n=String(d.reason||'').trim().length;
      if(n<10) r.push(`③ 최종 판단근거를 ${10-n}글자 더 작성해주세요.`);
    }
  }
  return r;
}
function updatePracticalSubmitState(q,d){
  const reasons=practicalExpired()?['작업시간이 종료되었습니다.']:practicalMissingReasons(q,d);
  const ready=!practicalExpired()&&reasons.length===0;
  const btn=$('#submitPracticalBtn');
  if(btn) btn.disabled=!ready;
  updateSubmitCheck('practicalSubmitCheck', reasons, '필수 작업이 모두 완료되어 제출할 수 있습니다.');
}
function teamRoleMissingReasons(){
  const d=teamRoleDraft,r=[];
  if(d.choice===null) r.push('① 핵심정보 해석 문항이 미선택입니다.');
  if(!d.riskLevel) r.push('② 위험도가 미선택입니다.');
  if(!d.preliminaryVendor) r.push('③ 1차 추천 대안이 미선택입니다.');
  const n=String(d.note||'').trim().length;
  if(n<15) r.push(`핵심근거를 ${15-n}글자 더 작성해주세요.`);
  const q=String(d.question||'').trim().length;
  if(q<8) r.push(`확인질문을 ${8-q}글자 더 작성해주세요.`);
  return r;
}
function updateTeamRoleSubmitState(){
  const reasons=teamRoleMissingReasons(),btn=$('#submitTeamRoleBtn');
  if(btn)btn.disabled=reasons.length>0;
  updateSubmitCheck('teamRoleSubmitCheck',reasons,'개인 직무분석을 제출할 수 있습니다.');
}
function teamReportMissingReasons(){
  const d=teamReportDraft,r=[],needsInfluence=(teamRoster()?.members?.length||0)>1;
  if((d.issues||[]).length<4) r.push(`① 핵심 문제를 ${4-(d.issues||[]).length}개 더 선택해주세요.`);
  if((d.criteria||[]).length<4) r.push(`② 판단기준을 ${4-(d.criteria||[]).length}개 더 선택해주세요.`);
  if(d.conflictResponse===null) r.push('③ 이해관계 처리 문항이 미선택입니다.');
  if(d.twistResponse===null) r.push('④ 돌발상황 반영 문항이 미선택입니다.');
  if(needsInfluence&&!d.influenceUid) r.push('⑤ 교차검증할 조원 정보가 미선택입니다.');
  if(!d.vendor) r.push('⑥ 최종 대안이 미선택입니다.');
  const n=String(d.reason||'').trim().length;
  if(n<20) r.push(`⑥ 최종 판단근거를 ${20-n}글자 더 작성해주세요.`);
  return r;
}
function updateTeamReportSubmitState(){
  const reasons=teamReportMissingReasons(),btn=$('#submitTeamReportBtn');
  if(btn)btn.disabled=reasons.length>0;
  updateSubmitCheck('teamReportSubmitCheck',reasons,'최종위원 의견을 제출할 수 있습니다.');
}

function activeTrackKey(){ return me?.trackKey || localStorage.getItem('cheongryeomTrack') || 'business'; }
function activateTrack(key){
  const t = CHEONGRYEOM_TRACK(key);
  C.intro=t.intro; C.written=t.written; C.practical=t.practical; C.team=t.team;
  return t;
}
function myTrack(){ return CHEONGRYEOM_TRACK(activeTrackKey()); }
activateTrack('business');

const stageCharacter = {
  waiting: 'character-listen.png',
  intro: 'character-explain.png',
  written: 'character-warning.png',
  writtenFeedback: 'character-best.png',
  practical: 'character-tablet.png',
  practicalFeedback: 'character-best.png',
  team: 'character-together.png',
  diagnosis: 'character-best.png',
  pledge: 'character-love.png',
  result: 'character-harmony.png'
};

const stages = C.stages;

const toast = t => {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 1700);
};

const stageIdx = k => stages.findIndex(s => s.key === k);

function item() {
  const a =
    control?.stage === 'written' ? C.written :
    control?.stage === 'practical' ? C.practical : [];
  return a[Number(control?.index || 0)] || null;
}

function answerKey() {
  const q = item();
  if (!q || !control) return '';
  return `${control.stage}:${q.id}`;
}

function mine(stage, key) {
  return myAnswers?.[stage]?.[key] || null;
}

function choiceHTML(opts, existing, pending, correctIndex=null) {
  return `<div class="choices">${
    opts.map((x, i) => {
      const isSelected = existing?.choice === i || (!existing && pending === i);
      const submitted=!!existing;
      const isCorrect=submitted&&Number(i)===Number(correctIndex);
      const isWrong=submitted&&isSelected&&!isCorrect;
      const stateClass=isCorrect?' answer-correct':(isWrong?' answer-wrong':'');
      const mark=isCorrect?'O':(isWrong?'X':'');
      return `<button class="choice ${isSelected ? 'selected' : ''}${stateClass}"
        data-choice="${i}" ${existing ? 'disabled' : ''}>
        <span class="choice-letter">${mark||String.fromCharCode(65 + i)}</span>
        <span>${typeof x === 'string' ? x : x.text}</span>
      </button>`;
    }).join('')
  }</div>`;
}

function bindChoices() {
  const k = answerKey();
  document.querySelectorAll('.choice:not(:disabled)').forEach(b => {
    b.onclick = () => {
      if (submitting) return;
      const choice = Number(b.dataset.choice);
      pendingChoices[k] = choice;

      document.querySelectorAll('.choice').forEach(x =>
        x.classList.toggle('selected', x === b)
      );

      const s = $('#submitBtn');
      if (s) s.disabled = false;
      const no=Number(control?.index||0)+1;
      updateSubmitCheck('writtenSubmitCheck', [], `${no}번 문항 답안 선택 완료 · 제출할 수 있습니다.`);
    };
  });
}

function virtueMeta(key){
  return C.virtues.find(v=>v.key===key)||{name:'청렴',tag:'바른 판단'};
}
const writtenTransferTips={
  honesty:'이 상황에서 사실과 기록을 바꾸지 않기 위해 내가 가장 먼저 확인해야 할 것은 무엇일까요?',
  promise:'시간이 촉박하거나 주변의 요구가 있어도 반드시 지켜야 할 절차와 기준은 무엇일까요?',
  care:'내 판단이 동료·고객·사용자·생명·환경에 어떤 영향을 줄 수 있을까요?',
  responsibility:'문제를 발견한 뒤 보고·조치·기록까지 책임 있게 마무리하려면 무엇이 필요할까요?',
  restraint:'친분·선물·개인 편의 같은 사적 요소가 내 판단에 섞이지 않았는지 돌아보세요.',
  fairness:'누구에게나 설명할 수 있는 같은 기준을 적용하려면 어떤 기준을 먼저 정해야 할까요?'
};
function writtenVirtueLinksHTML(q){
  const ranked=Object.entries(q?.impact||{}).filter(([,v])=>Number(v)>0).sort((a,b)=>Number(b[1])-Number(a[1]));
  if(!ranked.length&&q?.virtue)ranked.push([q.virtue,100]);
  return `<div class="written-virtue-links"><b>청렴 6덕목 연계</b><small>관련도 높은 순</small><div>${ranked.map(([k],i)=>{const v=virtueMeta(k);return `<span class="virtue-link-chip virtue-${escapeHTML(k)} ${i===0?'primary':''}"><em>${i+1}</em>${escapeHTML(v.name)}</span>`;}).join('')}</div></div>`;
}
function writtenInstantFeedbackHTML(q,ex){
  if(!ex)return '';
  const matched=Number(ex.choice)===Number(q.correct);
  return `<section class="instant-feedback-card written-instant-feedback ${matched?'correct':'wrong'}">
    <div class="instant-feedback-head"><div><span>답안 제출완료 · 즉시 피드백</span><h3>${matched?'정답입니다.':'오답입니다. 해설로 판단 기준을 확인해보세요.'}</h3></div><div class="written-ox ${matched?'correct':'wrong'}"><b>${matched?'O':'X'}</b><span>${matched?'정답':'오답'}</span></div></div>
    ${writtenVirtueLinksHTML(q)}
    <div class="instant-feedback-explain"><b>왜 이렇게 판단할까요?</b><p>${q.ex}</p></div>
    <div class="instant-feedback-transfer thought"><b>💡 생각해보기</b><span>${writtenTransferTips[q.virtue]||'이 상황에서 내가 지켜야 할 청렴기준은 무엇인지 한 번 더 생각해보세요.'}</span></div>
    <div class="instant-feedback-lock">제출한 답안은 확정되었습니다. 해설을 확인한 뒤 교사가 다음 문항을 열 때까지 기다려주세요.</div>
  </section>`;
}

function practicalLearningHTML(q,ex){
  if(!ex)return '';
  const lessons={
    procurement:{title:'공정한 선택은 “관계를 숨기지 않고 같은 기준으로 비교한 뒤 기록하는 것”입니다.',body:'이해관계가 있다는 이유만으로 자동 탈락시키거나, 반대로 친분 때문에 가점을 주는 것이 공정은 아닙니다. 이해관계를 공개하고 비용·품질·납기 등 공개된 기준을 동일하게 적용한 뒤 선정사유를 기록하는 과정이 핵심입니다.',next:'다음 과제에서는 기준을 세우는 것에서 한 걸음 더 나아가, 문제가 생겼을 때 올바른 처리절차를 끝까지 수행해보세요.'},
    sequence:{title:'누락은 추정으로 메우지 않고 “실제 확인 → 재점검 → 보고 → 실제 기록”으로 처리합니다.',body:'기록이 비어 있다고 정상으로 추정하거나 다른 기록을 복사하면 사실과 절차가 왜곡됩니다. 확인 가능한 근거를 다시 확보하고, 누락 사실과 확인 결과를 그대로 보고·기록하는 것이 책임 있는 직무처리입니다.',next:'다음 과제에서는 절차를 아는 것에서 더 나아가, 상급자나 주변의 선호가 개입해도 같은 기준을 유지해보세요.'},
    panel:{title:'압력이나 선호가 추가되어도 “처음 공개한 평가기준”은 흔들리지 않아야 합니다.',body:'추가정보는 판단에 영향을 줄 수 있는 요소로 인식하고 기록하되, 특정 사람의 선호 때문에 점수를 올리거나 반대로 일괄 감점하지 않습니다. 최초 평가를 보존하고 같은 기준과 근거로 최종 판단을 설명하는 것이 핵심입니다.',next:'종합평가에서는 이제 내 판단만으로 끝내지 않고, 다른 직무의 정보와 돌발상황까지 교차검증하여 최종 결정을 만들어보세요.'}
  };
  const l=lessons[q.kind]||{title:'제출한 작업을 직무기준과 연결해 다시 확인해보세요.',body:q.objective||'자료와 기준을 바탕으로 판단하고 그 근거를 기록하는 것이 중요합니다.',next:'다음 과제에서도 판단기준과 기록을 일관되게 적용해보세요.'};
  return `<section class="instant-feedback-card practical-instant-feedback">
    <div class="instant-feedback-head"><div><span>✓ 작업 제출완료 · 핵심 해설</span><h3>${escapeHTML(q.code)}에서 배운 직무원리</h3></div><em class="matched">학습 연결</em></div>
    <div class="instant-feedback-explain"><b>${l.title}</b><p>${l.body}</p></div>
    <div class="instant-feedback-transfer thought"><b>💡 생각해보기</b><span>${l.next}</span></div>
  </section>`;
}

function writtenComp() {
  const sums = Object.fromEntries(C.virtues.map(v => [v.key, { s: 0, n: 0 }]));
  C.written.forEach(q => {
    const a = mine('written', q.id);
    if (!a) return;
    Object.entries(q.impact || {}).forEach(([k, v]) => {
      if (!sums[k]) return;
      sums[k].s += (a.choice === q.correct ? v : Math.round(v * 0.3));
      sums[k].n++;
    });
  });
  return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v.n ? Math.round(v.s / v.n) : 0]));
}

const writtenCoaching = {
  honesty: '실기에서는 실제 수치·기록·사실을 바꾸지 않고 그대로 확인·보고하는 데 집중해보세요.',
  promise: '실기에서는 시간이 촉박해도 정해진 절차·기한·안전기준을 먼저 확인해보세요.',
  care: '실기에서는 내 선택이 동료·고객·사용자·생명·환경에 어떤 영향을 주는지도 함께 살펴보세요.',
  responsibility: '실기에서는 문제를 발견하는 데서 끝내지 말고 보고·조치·기록까지 완성해보세요.',
  restraint: '실기에서는 친분·선물·개인 편의와 같은 사적 요소를 직무판단에서 분리해보세요.',
  fairness: '실기에서는 누구에게나 설명할 수 있는 공개된 기준을 먼저 세우고 같은 방식으로 적용해보세요.'
};
function writtenFeedbackModel() {
  const values = writtenComp();
  const ranked = C.virtues.map(v=>({...v,score:Number(values[v.key]||0)})).sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name,'ko'));
  const answered=C.written.filter(q=>mine('written',q.id)).length;
  const correct=C.written.filter(q=>mine('written',q.id)?.choice===q.correct).length;
  return {values,ranked,answered,correct,strengths:ranked.slice(0,2),growth:ranked[ranked.length-1]};
}

const practicalCoaching = {
  honesty: '종합평가에서는 다른 사람의 정보와 새 조건이 생겨도 사실·수치·기록을 정확히 구분해 판단해보세요.',
  promise: '종합평가에서는 팀 의견보다 먼저 납기·안전·보안·위생처럼 반드시 지켜야 할 기준을 찾아보세요.',
  care: '종합평가에서는 내 직무뿐 아니라 다른 부서·고객·사용자에게 미칠 영향까지 함께 비교해보세요.',
  responsibility: '종합평가에서는 문제를 발견한 뒤 질문하고, 새 정보를 반영하고, 최종 근거까지 남기는 흐름을 완성해보세요.',
  restraint: '종합평가에서는 친분·상급자 선호·개인 편의가 팀 판단에 섞이지 않도록 공개된 기준과 분리해보세요.',
  fairness: '종합평가에서는 조원 의견이 달라도 공개된 기준을 동일하게 적용하고, 왜 판단을 바꿨는지 설명해보세요.'
};
function preTeamComp() {
  const sums = Object.fromEntries(C.virtues.map(v => [v.key, { s: 0, n: 0 }]));
  C.written.forEach(q => {
    const a=mine('written',q.id); if(!a)return;
    Object.entries(q.impact||{}).forEach(([k,v])=>{if(!sums[k])return;sums[k].s+=(a.choice===q.correct?v:Math.round(v*.3));sums[k].n++;});
  });
  C.practical.forEach(q => {
    const a=mine('practical',q.id); if(!a)return;
    const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);
    Object.entries(ev.impact||{}).forEach(([k,v])=>{if(!sums[k])return;sums[k].s+=Number(v||0);sums[k].n++;});
  });
  return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v.n?Math.round(v.s/v.n):0]));
}
function practicalFeedbackModel(){
  const tasks=C.practical.map((q,i)=>{const a=mine('practical',q.id);const ev=a?CHEONGRYEOM_EVALUATE_PRACTICAL(q,a):{score:0,details:[]};return {index:i+1,q,answered:!!a,score:a?ev.score:0,details:ev.details||[]};});
  const complete=tasks.filter(x=>x.answered).length;
  const average=Math.round(tasks.reduce((a,b)=>a+b.score,0)/Math.max(1,C.practical.length));
  const values=preTeamComp();
  const ranked=C.virtues.map(v=>({...v,score:Number(values[v.key]||0)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
  let bestElement=null, growthElement=null;
  const elems=[];
  tasks.forEach(t=>t.details.forEach(d=>{const max=Number(d[2]||0),got=Number(d[1]||0);if(max>0)elems.push({label:d[0],ratio:got/max,got,max,task:t.index});}));
  if(elems.length){bestElement=[...elems].sort((a,b)=>b.ratio-a.ratio||b.got-a.got)[0];growthElement=[...elems].sort((a,b)=>a.ratio-b.ratio||a.got-b.got)[0];}
  return {tasks,complete,average,values,ranked,strengths:ranked.slice(0,2),growth:ranked[ranked.length-1],bestElement,growthElement};
}
function teamHowToHTML(){
  return `<section class="team-transition-explainer">
    <div class="team-transition-title"><span>다음 평가</span><h3>전공맞춤 직무상황 종합평가</h3><p>이번에는 혼자 정답을 찾는 문제가 아닙니다. <b>각자 다른 직무정보를 분석하고, 디지털 상황판에서 서로의 판단을 교차검증한 뒤 새로운 조건까지 반영해 최종 결정을 만드는 평가</b>입니다.</p></div>
    <div class="team-how-grid six-step">
      <article><b>① 팀·역할 확인</b><span>같은 전공 3~5명 중심 랜덤팀 · 부족 역할은 겸임자료 자동배정</span></article>
      <article><b>② 1차 자료 제출</b><span>핵심정보 · 위험도 · 1차추천 · 근거 · 다른 담당자에게 할 질문 제출</span></article>
      <article><b>③ 상황판 확인·중간판단</b><span>조원의 정보와 질문을 비교한 뒤 돌발상황 전 현재 판단을 한 번 확정</span></article>
      <article><b>④ 돌발상황 재판단</b><span>새 조건이 공개되면 1차·중간 판단을 고집하지 않고 근거를 다시 검토</span></article>
      <article><b>⑤ 전원 최종의견</b><span>서기만 제출하지 않고 모든 조원이 직접 최종판단과 근거를 제출</span></article>
      <article><b>⑥ 결과·종합피드백</b><span>개인 판단의 변화와 팀 협업과정을 돌아보고 다음 직무상황의 실천방향 확인</span></article>
    </div>
    <div class="team-no-move-notice"><b>📱 자리 이동은 필요 없습니다.</b><span>교사가 단계별로 화면을 열면 각 자리에서 같은 팀의 정보가 자동 공유됩니다. 화면에 표시되는 조원 이름과 역할을 먼저 확인하세요.</span></div>
  </section>`;
}

function comp() {
  const sums = Object.fromEntries(C.virtues.map(v => [v.key, { s: 0, n: 0 }]));

  C.written.forEach(q => {
    const a = mine('written', q.id);
    if (!a) return;
    Object.entries(q.impact || {}).forEach(([k, v]) => {
      sums[k].s += (a.choice === q.correct ? v : Math.round(v * 0.3));
      sums[k].n++;
    });
  });

  C.practical.forEach(q => {
    const a = mine('practical', q.id);
    if (!a) return;
    const ev = CHEONGRYEOM_EVALUATE_PRACTICAL(q, a);
    Object.entries(ev.impact || {}).forEach(([k, v]) => {
      if (!sums[k]) return;
      sums[k].s += Number(v || 0); sums[k].n++;
    });
  });

  const roleEv = CHEONGRYEOM_EVALUATE_TEAM_MEMBER(C.team, myAnswers?.team?.role, myAnswers?.team?.report);
  Object.entries(roleEv.impact || {}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});
  const pub = me?.teamId ? control?.teamScores?.[me.teamId] : null;
  Object.entries(pub?.impact || {}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});

  return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v.n ? Math.round(v.s / v.n) : 0]));
}

function scores() {
  const S = C.scoring;
  let writtenCorrect = 0, writtenAnswered = 0;
  C.written.forEach(q => { const a=mine('written',q.id); if(a)writtenAnswered++; if(a?.choice===q.correct)writtenCorrect++; });
  const w = Math.round(writtenCorrect / C.written.length * 100);

  let practicalSum=0, practicalAnswered=0; const practicalTaskScores=[];
  C.practical.forEach(q=>{const a=mine('practical',q.id);const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);if(a)practicalAnswered++;practicalSum+=a?ev.score:0;practicalTaskScores.push({id:q.id,title:q.title,score:a?ev.score:0,answered:!!a,details:a?ev.details:[]});});
  const p=Math.round(practicalSum/C.practical.length);

  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_MEMBER(C.team,myAnswers?.team?.role,myAnswers?.team?.report);
  const teamPub=me?.teamId?control?.teamScores?.[me.teamId]:null;
  const teamBase=Number(teamPub?.teamScore||0);
  const teamScore=teamPub?Math.round(teamBase*0.8+roleEv.score*0.2):0;
  const teamComplete=!!teamPub;
  const pl=myPledge?.text?100:0;

  const total=Math.round(w*S.writtenWeight/100+p*S.practicalWeight/100+teamScore*S.teamWeight/100+pl*S.pledgeWeight/100);
  const qualification=total>=Number(S.leaderTotal||60)?'청렴 리더':total>Number(S.confirmationMax??40)?'청렴 서포터':'청렴 응시자';
  const documentType=total<=Number(S.confirmationMax??40)?'응시확인서':'청렴자격증';
  const missingQuestions=(C.written.length-writtenAnswered)+(C.practical.length-practicalAnswered)+(myAnswers?.team?.role?0:1)+(myAnswers?.team?.mid?0:1)+(myAnswers?.team?.report?0:1);
  return {w,p,team:teamScore,teamBase,roleScore:roleEv.score,teamComplete,pl,total,qualification,documentType,writtenAnswered,practicalAnswered,practicalTaskScores,missingQuestions};
}

function integrityType() {
  return getCheongryeomType(comp());
}

function typeCardHTML(t, compact = false) {
  return `<section class="integrity-type-card ${compact ? 'compact' : ''}">
    <div class="integrity-type-symbol" aria-hidden="true">${t.symbol || '🌳'}</div>
    <div class="integrity-type-body">
      <span class="integrity-type-kicker">6대 청렴역량 조합 진단</span>
      <h3>나의 청렴유형 · ${t.name}</h3>
      <div class="integrity-type-figure">상징 역사 인물 <b>${t.figure}</b></div>
      <div class="integrity-type-top">
        <span>${t.primary.name} ${t.primary.score}</span>
        <span>${t.secondary.name} ${t.secondary.score}</span>
      </div>
      <p>${t.summary}</p>
      <div class="integrity-mission"><b>청렴ON 성장 미션</b><br>${t.mission}</div>
      <small>※ 역사 인물 매칭은 청렴가치 이해를 돕기 위한 교육적 상징 연결입니다.</small>
    </div>
  </section>`;
}

async function syncMyResult() {
  const s = scores();
  const c = comp();
  const t = getCheongryeomType(c);
  try {
    await DB.updateMe(code, {
      writtenScore: s.w,
      practicalScore: s.p,
      teamScore: s.team,
      pledgeScore: s.pl,
      totalScore: s.total,
      qualification: s.qualification,
      competencies: c,
      integrityType: t.name,
      historyFigure: t.figure,
      topVirtues: `${t.primary.name}·${t.secondary.name}`
    });
  } catch (e) {}
  return s;
}

function progress() {
  const stage=control?.stage||'waiting';
  const i=Math.max(0,stageIdx(stage));
  let fraction=0,label=stages[i]?.name||'수험등록';
  if(stage==='written'){
    const n=Math.min(C.written.length,Number(control?.index||0)+1);
    fraction=(n-1)/Math.max(1,C.written.length);
    label=`필기평가 · ${n}/${C.written.length}문항`;
  }else if(stage==='practical'){
    const n=Math.min(C.practical.length,Number(control?.index||0)+1);
    fraction=(n-1)/Math.max(1,C.practical.length);
    label=`작업형 실기 · ${n}/${C.practical.length}과제`;
  }else if(stage==='team'){
    const ph=control?.teamPhase||'briefing';
    const order={briefing:1,board:2,checkpoint:3,twist:4,decision:5,scored:6};
    const names={briefing:'개인 직무분석',board:'팀 상황판',checkpoint:'중간판단 제출',twist:'돌발상황',decision:'최종판단',scored:'결과·종합피드백'};
    const n=order[ph]||1; fraction=(n-1)/6; label=`종합평가 · ${n}/6 ${names[ph]||''}`;
  }else if(stage==='writtenFeedback') label='필기평가 완료 · 1차 피드백';
  else if(stage==='practicalFeedback') label='작업형 실기 완료 · 2차 피드백';
  else if(stage==='diagnosis') label='최종 청렴역량 진단';
  else if(stage==='pledge') label='나의 청렴 실천약속';
  else if(stage==='result') label='자격판정 · 교육 종료';
  const p=stage==='result'?100:Math.min(99,Math.round((i+fraction)/(stages.length-1)*100));
  $('#studentStage').textContent=label;
  $('#studentPct').textContent=p+'%';
  $('#studentBar').style.width=p+'%';
}

function waiting(title, body) {
  const f = stageCharacter[control?.stage || 'waiting'] || 'character-greeting.png';
  return `<div class="waiting">
    <img class="official-character" src="assets/official/${f}" alt="국민권익위원회 캐릭터">
    <h2>${title}</h2>
    <p>${body}</p>
  </div>`;
}


function escapeHTML(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function practicalDraft(q) {
  if (practicalDrafts[q.id]) return practicalDrafts[q.id];
  let d;
  if (q.kind === 'procurement') {
    d = { openedDocs: [], activeDoc: null, conflictVendor: '', criteria: [], selectedVendor: null, disclosure: false, reason: '' };
  } else if (q.kind === 'sequence') {
    d = { order: [], note: '' };
  } else {
    const scores = {};
    q.candidates.forEach(c => {
      scores[c.id] = {};
      q.rubricFields.forEach(f => scores[c.id][f.key] = 0);
    });
    d = { scores, lockedScores: null, revealed: false, response: null, reason: '' };
  }
  practicalDrafts[q.id] = d;
  return d;
}

function practicalExpired() {
  return !!(control?.timerEnd && Date.now() >= Number(control.timerEnd));
}

function formatRemaining(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function studentTimerHTML(q) {
  if (!control?.timerEnd) {
    return `<div class="work-timer idle"><span>⏱ 제한시간</span><b>${Math.round(q.timeLimitSec / 60)}분</b><small>교사가 타이머를 시작하면 카운트다운됩니다.</small></div>`;
  }
  const left = Number(control.timerEnd) - Date.now();
  return `<div class="work-timer ${left <= 0 ? 'expired' : ''}"><span>⏱ 남은 작업시간</span><b id="studentTimer">${formatRemaining(left)}</b><small>${left <= 0 ? '작업시간이 종료되었습니다. 미제출 과제는 0점 처리됩니다.' : '제출 버튼을 누르는 순간 작업물이 확정됩니다.'}</small></div>`;
}

function updateTimerDisplay() {
  const el = $('#studentTimer');
  if (!el || !control?.timerEnd) return;
  const left = Number(control.timerEnd) - Date.now();
  el.textContent = formatRemaining(left);
  const wrap = el.closest('.work-timer');
  if (left <= 0 && wrap) {
    wrap.classList.add('expired');
    const b = $('#submitPracticalBtn');
    if (b) { b.disabled = true; b.textContent = '작업시간 종료'; }
  }
}

function practicalHeader(q, ex) {
  return `<div class="work-exam-head">
    <div><span class="stage-tag">작업형 실기 ${Number(control.index) + 1}/${C.practical.length}</span><h2>${q.title}</h2><p>${q.objective}</p></div>
    <div class="work-code"><small>과제번호</small><b>${q.code}</b></div>
  </div>
  ${studentTimerHTML(q)}
  <div class="work-notice"><b>수험자 유의사항</b><span>지급자료를 충분히 확인하고 작업물을 완성한 뒤 한 번만 제출합니다. 제출 후에는 수정할 수 없습니다.</span></div>
  ${ex ? `<div class="feedback good"><b>✓ 작업물 제출 완료</b><br>아래 작업결과와 핵심 해설을 확인한 뒤 교사가 다음 과제를 열 때까지 기다려주세요.</div>` : ''}`;
}

function renderProcurement(q, d) {
  const active = q.docs.find(x => x.id === d.activeDoc);
  return `${practicalHeader(q, mine('practical', q.id))}
    <div class="work-context">${q.context}</div>
    <section class="work-section"><div class="work-section-title"><span>01</span><div><b>지급자료 검토</b><small>문서를 눌러 내용을 확인하세요.</small></div></div>
      <div class="work-docs">${q.docs.map(doc => `<button type="button" class="work-doc ${d.openedDocs.includes(doc.id)?'opened':''}" data-doc="${doc.id}"><span>${doc.icon}</span><b>${doc.title}</b><small>${d.openedDocs.includes(doc.id)?'확인함':'열어보기'}</small></button>`).join('')}</div>
      ${active ? `<div class="work-document"><b>${active.title}</b><p>${active.body}</p></div>` : '<div class="work-document muted">지급자료를 선택하면 이곳에 내용이 표시됩니다.</div>'}
    </section>
    <section class="work-section"><div class="work-section-title"><span>02</span><div><b>이해관계 확인</b><small>개인적 이해관계가 있는 업체를 표시하세요.</small></div></div>
      <div class="mini-choice-grid">${['A','B','C','NONE'].map(v => { const vn=v==='NONE'?'없음':(q.vendors.find(x=>x.id===v)?.name||v); return `<button type="button" class="mini-choice ${d.conflictVendor===v?'selected':''}" data-conflict="${v}">${vn}</button>`; }).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>03</span><div><b>비교기준 설정</b><small>구매 결정에 반영할 기준을 선택하세요.</small></div></div>
      <div class="required-note ${d.criteria.length>=2?'ok':''}">※ 필수 · 비교기준을 <b>2개 이상</b> 선택해야 합니다. <span>현재 ${d.criteria.length}개 선택</span></div>
      <div class="criteria-grid">${q.criteria.map(c => `<label class="criteria-chip ${d.criteria.includes(c.key)?'selected':''}"><input type="checkbox" data-criteria="${c.key}" ${d.criteria.includes(c.key)?'checked':''}><span>${c.label}</span></label>`).join('')}</div>
      <div class="vendor-table"><div class="vendor-head">${(q.tableLabels||['대안','가격','품질','납기']).map(x=>`<span>${x}</span>`).join('')}</div>${q.vendors.map((v,i)=>`<div class="vendor-row"><b>${v.id} · ${v.name}</b><span>${v.price}</span><span>${v.quality}</span><span>${v.delivery}</span></div>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>04</span><div><b>구매계획 작성</b><small>최종업체와 처리방식을 결정하고 근거를 남기세요.</small></div></div>
      <label class="work-label">선정업체</label><div class="mini-choice-grid">${q.vendors.map((v,i)=>`<button type="button" class="mini-choice ${d.selectedVendor!==null&&Number(d.selectedVendor)===i?'selected':''}" data-vendor="${i}">${v.id} · ${v.name}</button>`).join('')}</div>
      <label class="work-check"><input id="disclosureCheck" type="checkbox" ${d.disclosure?'checked':''}><span>이해관계가 있는 업체가 있다면 그 사실을 기록에 공개하고 동일 기준으로 검토하겠습니다.</span></label>
      <label class="work-label" for="practicalReason">선정사유 및 처리기록</label>
      <div class="required-note ${String(d.reason||'').trim().length>=10?'ok':''}">※ 필수 · <b>10글자 이상</b> 작성해야 제출할 수 있습니다. <span>현재 ${String(d.reason||'').trim().length}/10자</span></div>
      <textarea id="practicalReason" class="work-textarea" maxlength="300" placeholder="비교한 기준과 업체를 선정한 이유를 구체적으로 기록하세요.">${escapeHTML(d.reason)}</textarea>
    </section>`;
}

function renderSequence(q, d) {
  const map = Object.fromEntries(q.actions.map(a=>[a.id,a]));
  const L=q.sequenceLabels||{};
  return `${practicalHeader(q, mine('practical', q.id))}
    <div class="work-context">${q.context}</div>
    <section class="work-section"><div class="work-section-title"><span>01</span><div><b>${L.reviewTitle||'업무기록 확인'}</b><small>${L.reviewHint||'누락된 항목을 확인하세요.'}</small></div></div>
      <div class="ledger-table">${q.ledger.map(x=>`<div class="ledger-row ${x.proof?'':'missing'}"><b>${x.item}</b><span>${x.amount}</span><span>${x.proof?(L.okText||'✅ 기록 있음'):(L.missingText||'⚠️ 기록 누락')}</span></div>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>02</span><div><b>${L.orderTitle||'처리절차 구성'}</b><small>${L.orderHint||'필요한 카드를 실제 처리 순서대로 4개 선택하세요.'}</small></div></div>
      <div class="sequence-selected">${d.order.length?d.order.map((id,i)=>`<button type="button" class="sequence-slot" data-remove-action="${id}"><span>${i+1}</span>${map[id]?.text||id}<small>눌러서 제거</small></button>`).join(''):'<div class="sequence-empty">아래 처리카드를 눌러 순서를 구성하세요.</div>'}</div>
      <div class="action-bank">${q.actions.map(a=>`<button type="button" class="action-card ${d.order.includes(a.id)?'used':''}" data-action="${a.id}" ${d.order.includes(a.id)||d.order.length>=4?'disabled':''}><span>＋</span>${a.text}</button>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>03</span><div><b>${L.noteTitle||'처리의견 기록'}</b><small>${L.noteHint||'확인·보고·실제 기록 원칙을 적으세요.'}</small></div></div>
      <div class="required-note ${String(d.note||'').trim().length>=10?'ok':''}">※ 필수 · ${L.noteNoun||'처리의견'}을 <b>10글자 이상</b> 작성해야 제출할 수 있습니다. <span>현재 ${String(d.note||'').trim().length}/10자</span></div>
      <textarea id="sequenceNote" class="work-textarea" maxlength="300" placeholder="${L.notePlaceholder||'확인·보고·실제 처리 근거를 적어보세요.'}">${escapeHTML(d.note)}</textarea>
    </section>`;
}

function candidateTotal(q, d, cid) {
  const source = d.lockedScores || d.scores;
  return q.rubricFields.reduce((a,f)=>a+Number(source?.[cid]?.[f.key]||0),0);
}

function panelScoresComplete(q,d) {
  return q.candidates.every(c => q.rubricFields.every(f => {
    const v=Number(d.scores?.[c.id]?.[f.key]||0);
    return v>0 && v<=f.max;
  }));
}

function renderPanel(q, d) {
  const scores = d.lockedScores || d.scores;
  const L=q.panelLabels||{};
  const totals = q.candidates.map(c=>({id:c.id,name:c.name,total:candidateTotal(q,d,c.id)})).sort((a,b)=>b.total-a.total);
  return `${practicalHeader(q, mine('practical', q.id))}
    <div class="work-context">${q.context}</div>
    <section class="work-section"><div class="work-section-title"><span>01</span><div><b>${L.criterionTitle||'평가기준 확인'}</b><small>${L.criterionHint||'모든 대상에 같은 배점을 적용합니다.'}</small></div></div>
      <div class="rubric-strip">${q.rubricFields.map(f=>`<span><b>${f.label}</b>${f.max}점</span>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>02</span><div><b>${L.materialTitle||'평가자료 채점'}</b><small>${d.revealed?'1차 평가가 확정되었습니다.':(L.materialHint||'자료와 발표내용을 보고 각 항목의 점수를 입력하세요.')}</small></div></div>
      <div class="candidate-list">${q.candidates.map(c=>`<article class="candidate-card"><div class="candidate-head"><b>${c.name}</b><strong>${candidateTotal(q,d,c.id)}점</strong></div>
        <div class="candidate-profile"><b>${L.materialLabel||'평가자료'}</b><p>${c.profile}</p></div>
        <div class="candidate-speech"><span>🎤 ${L.speechLabel||'현장 발표'}</span><p>“${c.speech}”</p></div>
        <div class="candidate-sliders">${q.rubricFields.map(f=>{const val=Number(scores?.[c.id]?.[f.key]||0);
          if(f.key==='presentation'){
            return `<div class="presentation-eval"><div class="presentation-eval-head"><span><b>${L.presentationLabel||f.label}</b> · 위 발표 멘트를 읽고 직접 채점하세요.</span><strong><b data-score-label="${c.id}:${f.key}">${val}</b> / ${f.max}점</strong></div><div class="presentation-score-grid">${Array.from({length:f.max},(_,i)=>i+1).map(n=>`<button type="button" class="presentation-score-btn ${val===n?'selected':''}" data-presentation-score="${n}" data-candidate="${c.id}" data-field="${f.key}" ${d.revealed?'disabled':''}>${n}</button>`).join('')}</div></div>`;
          }
          return `<label><span>${f.label}<b data-score-label="${c.id}:${f.key}">${val}</b> / ${f.max}</span><input type="range" min="0" max="${f.max}" step="1" value="${val}" data-candidate="${c.id}" data-field="${f.key}" ${d.revealed?'disabled':''}></label>`}).join('')}</div></article>`).join('')}</div>
      ${!d.revealed?`<button id="revealRelationBtn" class="btn soft large full" ${panelScoresComplete(q,d)?'':'disabled'}>${L.revealButton||'1차 평가 확정 → 추가정보 확인'}</button>`:`<div class="work-alert"><b>${L.extraTitle||'⚠️ 추가정보'}</b><span>${q.extraInfo}</span></div>`}
    </section>
    ${d.revealed?`<section class="work-section"><div class="work-section-title"><span>03</span><div><b>${L.decisionTitle||'추가정보 반영 원칙'}</b><small>${L.decisionHint||'1차 점수는 잠겼습니다. 기존 기준을 유지할지 판단하세요.'}</small></div></div>
      <div class="locked-result">${L.leaderLabel||'현재 1위'} <b>${totals[0]?.name || ((L.leaderNoun||'대안')+' '+(totals[0]?.id||''))}</b> · ${totals[0]?.total||0}점 <small>동점이면 교사의 추가 절차에 따릅니다.</small></div>
      <div class="response-list">${q.responses.map((x,i)=>`<button type="button" class="response-card ${d.response!==null&&Number(d.response)===i?'selected':''}" data-response="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div>
      <label class="work-label" for="panelReason">${L.reasonLabel||'최종 판단근거'}</label>
      <div class="required-note ${String(d.reason||'').trim().length>=10?'ok':''}">※ 필수 · ${L.reasonLabel||'최종 판단근거'}를 <b>10글자 이상</b> 작성해야 제출할 수 있습니다. <span>현재 ${String(d.reason||'').trim().length}/10자</span></div>
      <textarea id="panelReason" class="work-textarea" maxlength="300" placeholder="${L.reasonPlaceholder||'추가정보와 기존 평가기준을 어떻게 반영했는지 적어보세요.'}">${escapeHTML(d.reason)}</textarea>
    </section>`:''}`;
}

function practicalReady(q,d) {
  if (q.kind==='procurement') return !!d.conflictVendor && d.criteria.length>=2 && d.selectedVendor!==null && Number.isInteger(Number(d.selectedVendor)) && String(d.reason||'').trim().length>=10;
  if (q.kind==='sequence') return d.order.length===4 && String(d.note||'').trim().length>=10;
  return d.revealed && d.response!==null && Number.isInteger(Number(d.response)) && String(d.reason||'').trim().length>=10;
}

function renderPractical(q, ex) {
  if (ex) {
    const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,ex);
    return `${practicalHeader(q, ex)}${practicalScorecardHTML(q,ex)}${practicalLearningHTML(q,ex)}`;
  }
  const d=practicalDraft(q);
  const body=q.kind==='procurement'?renderProcurement(q,d):q.kind==='sequence'?renderSequence(q,d):renderPanel(q,d);
  const reasons=practicalExpired()?['작업시간이 종료되었습니다.']:practicalMissingReasons(q,d);
  const ready=reasons.length===0;
  return `${body}<div class="work-submit-sticky"><div class="work-submit-info"><b>작업물 제출</b><small>${ready?'필수 작업이 완료되었습니다.':'아래 미완료 항목을 확인해주세요.'}</small>${submitCheckHTML('practicalSubmitCheck',reasons,'필수 작업이 모두 완료되어 제출할 수 있습니다.')}</div><button id="submitPracticalBtn" class="btn primary large" ${ready?'':'disabled'}>${practicalExpired()?'작업시간 종료':'작업물 최종 제출'}</button></div>`;
}

function bindPractical(q, ex) {
  if (ex) return;
  const d=practicalDraft(q);
  document.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{const id=b.dataset.doc;if(!d.openedDocs.includes(id))d.openedDocs.push(id);d.activeDoc=id;render();});
  document.querySelectorAll('[data-conflict]').forEach(b=>b.onclick=()=>{d.conflictVendor=b.dataset.conflict;render();});
  document.querySelectorAll('[data-criteria]').forEach(x=>x.onchange=()=>{const k=x.dataset.criteria;d.criteria=x.checked?[...new Set([...d.criteria,k])]:d.criteria.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-vendor]').forEach(b=>b.onclick=()=>{d.selectedVendor=Number(b.dataset.vendor);render();});
  const dc=$('#disclosureCheck'); if(dc) dc.onchange=()=>{d.disclosure=dc.checked;};
  const pr=$('#practicalReason'); if(pr) pr.oninput=()=>{d.reason=pr.value;syncRequiredCounter(pr,10);const btn=$('#submitPracticalBtn');updatePracticalSubmitState(q,d);};
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(d.order.length<4&&!d.order.includes(b.dataset.action)){d.order.push(b.dataset.action);render();}});
  document.querySelectorAll('[data-remove-action]').forEach(b=>b.onclick=()=>{d.order=d.order.filter(x=>x!==b.dataset.removeAction);render();});
  const sn=$('#sequenceNote'); if(sn) sn.oninput=()=>{d.note=sn.value;syncRequiredCounter(sn,10);const btn=$('#submitPracticalBtn');updatePracticalSubmitState(q,d);};
  document.querySelectorAll('input[data-candidate]').forEach(x=>x.oninput=()=>{const cid=x.dataset.candidate,f=x.dataset.field;d.scores[cid][f]=Number(x.value);const l=document.querySelector(`[data-score-label="${cid}:${f}"]`);if(l)l.textContent=x.value;const card=x.closest('.candidate-card');if(card){const t=card.querySelector('.candidate-head strong');if(t)t.textContent=candidateTotal(q,d,cid)+'점';}const rb=$('#revealRelationBtn');if(rb)rb.disabled=!panelScoresComplete(q,d);updatePracticalSubmitState(q,d);});
  document.querySelectorAll('[data-presentation-score]').forEach(b=>b.onclick=()=>{const cid=b.dataset.candidate,f=b.dataset.field;d.scores[cid][f]=Number(b.dataset.presentationScore);const card=b.closest('.candidate-card');card?.querySelectorAll(`[data-presentation-score][data-candidate="${cid}"]`).forEach(x=>x.classList.toggle('selected',x===b));const l=document.querySelector(`[data-score-label="${cid}:${f}"]`);if(l)l.textContent=b.dataset.presentationScore;const t=card?.querySelector('.candidate-head strong');if(t)t.textContent=candidateTotal(q,d,cid)+'점';const rb=$('#revealRelationBtn');if(rb)rb.disabled=!panelScoresComplete(q,d);updatePracticalSubmitState(q,d);});
  const rr=$('#revealRelationBtn'); if(rr) rr.onclick=()=>{if(!panelScoresComplete(q,d))return;d.lockedScores=JSON.parse(JSON.stringify(d.scores));d.revealed=true;render();};
  document.querySelectorAll('[data-response]').forEach(b=>b.onclick=()=>{d.response=Number(b.dataset.response);render();});
  const pa=$('#panelReason'); if(pa) pa.oninput=()=>{d.reason=pa.value;syncRequiredCounter(pa,10);const btn=$('#submitPracticalBtn');updatePracticalSubmitState(q,d);};
  const sb=$('#submitPracticalBtn'); if(sb) sb.onclick=()=>submitPractical(q);
}

async function submitPractical(q) {
  if (submitting || practicalExpired()) return;
  const d=practicalDraft(q);
  if(!practicalReady(q,d)){const r=practicalMissingReasons(q,d);return toast(r[0]||'필수 작업을 확인해주세요.');}
  let choice=0;
  if(q.kind==='procurement') choice=Number(d.selectedVendor);
  if(q.kind==='panel') choice=Number(d.response);
  const payload={choice,work:JSON.parse(JSON.stringify(d))};
  const btn=$('#submitPracticalBtn');
  submitting=true;
  if(btn){btn.disabled=true;btn.textContent='작업물 저장 중...';}
  try{
    await DB.submitAnswer(code,'practical',q.id,payload);
    await syncMyResult();
    toast('작업물을 제출했습니다.');
  }catch(e){
    toast('이미 제출했거나 저장 중 오류가 발생했습니다.');
    if(btn){btn.disabled=false;btn.textContent='작업물 최종 제출';}
  }finally{submitting=false;}
}

function scoreRowsHTML(details){
  return `<div class="scorecard-rows">${(details||[]).map(d=>`<div class="scorecard-row"><span>${d[0]}</span><b>${d[1]} / ${d[2]}</b></div>`).join('')}</div>`;
}
function practicalScorecardHTML(q,ex){
  const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,ex);
  const positives=(ev.details||[]).filter(x=>x[2]>0).sort((a,b)=>(b[1]/b[2])-(a[1]/a[2]));
  const best=positives[0], low=positives[positives.length-1];
  return `<section class="work-result-card"><div class="work-result-head"><div><span>작업결과 채점표</span><h3>${q.code} · ${q.title.replace(/^작업형 제\d과제 · /,'')}</h3></div><strong>${ev.score}<small>/100</small></strong></div>${scoreRowsHTML(ev.details)}<div class="work-result-feedback"><p><b>✓ 강점</b>${best?`${best[0]} 수행이 가장 안정적이었습니다.`:'작업물을 제출했습니다.'}</p><p><b>△ 보완</b>${low&&low[2]>0?`${low[0]} 부분을 다음 판단에서 더 구체적으로 수행해보세요.`:'채점요소를 다시 확인해보세요.'}</p></div></section>`;
}
function practicalBreakdownHTML(s) {
  return `<div class="practical-breakdown"><b>개인 작업형 실기 결과</b>${s.practicalTaskScores.map((x,i)=>`<div><span>제${i+1}과제</span><strong>${x.score}</strong><small>${x.answered?'제출':'미제출 · 0점'}</small></div>`).join('')}</div>`;
}


function teamRoster(){ return me?.teamId ? control?.teamRosters?.[me.teamId] : null; }
function roleDuty(key){
  return ({records:'규정·이해관계·기록 검증',finance:'예산·비용 타당성',purchase:'대안·거래조건 비교',operations:'현장기한·운영조건 판단',verify:'품질·안전·사적요소 검증'})[key]||'직무정보 분석';
}
function teamRosterHTML(){
  const roster=teamRoster(); if(!roster?.members?.length) return '';
  const recorder=roster.members.find(x=>x.isRecorder||x.roleKey==='records');
  return `<section class="team-roster-card no-move"><div class="team-roster-head"><div><small>무이동 디지털 협업팀</small><h3>${escapeHTML(roster.teamLabel||me?.teamLabel||'우리 조')}</h3></div><div class="team-recorder-badge"><span>🗂️ 기록·검증</span><b>${escapeHTML(recorder?.studentName||'확인 중')}</b></div></div><div class="team-roster-members">${roster.members.map(x=>`<div class="team-member-chip ${x.isRecorder||x.roleKey==='records'?'recorder':''}"><b>${escapeHTML(x.studentName||'학생')}</b><span>${escapeHTML(x.roleName||'')}</span><small>${roleDuty(x.roleKey)}</small>${x.isRecorder||x.roleKey==='records'?'<em>기록담당</em>':''}</div>`).join('')}</div><p class="team-roster-guide"><b>자리 이동 없이 진행합니다.</b> 각자 맡은 직무자료를 분석해 제출하면 조원들의 판단이 <b>팀 상황판에 자동 취합</b>됩니다. 서로를 찾아 이동하거나 한 명에게 의견을 말로 몰아줄 필요가 없습니다.</p></section>`;
}
function teamRoleConfig(){ return C.team.roles?.[me?.teamRoleKey] || null; }
function teamPublished(){ return me?.teamId ? control?.teamScores?.[me.teamId] : null; }
function teamBoard(){ return me?.teamId ? control?.teamBoards?.[me.teamId] : null; }
function vendorName(id){ if(id==='HOLD') return '판단 보류'; const v=C.team.vendors?.find(x=>x.id===id); return v?`${v.id} · ${v.name}`:(id||'미선택'); }
function riskName(x){ return ({low:'낮음',mid:'보통',high:'높음'})[x]||'미선택'; }
function teamMemberEval(){ return CHEONGRYEOM_EVALUATE_TEAM_MEMBER(C.team,myAnswers?.team?.role,myAnswers?.team?.report); }
function teamRoleScorecardHTML(){
  const ev=teamMemberEval(); if(!myAnswers?.team?.role) return '';
  return `<div class="team-role-result"><b>개인 직무기여 ${ev.score}점</b>${scoreRowsHTML(ev.details)}</div>`;
}
function extraRoles(){ return Array.isArray(me?.teamExtraRoleKeys)?me.teamExtraRoleKeys:[]; }
function supplementalHTML(){
  const keys=extraRoles(); if(!keys.length) return '';
  return `<div class="team-supplement"><b>🔄 인원수에 따른 겸임 직무자료</b><p>팀이 5명이 아니어도 핵심정보가 빠지지 않도록 아래 직무자료가 자동 배정되었습니다.</p>${keys.map(k=>{const r=C.team.roles?.[k];return r?`<article><strong>${r.icon} ${escapeHTML(r.name)}</strong><span>${escapeHTML(roleDuty(k))}</span><p>${escapeHTML(r.secret)}</p></article>`:''}).join('')}</div>`;
}
function teamRoleReady(){const d=teamRoleDraft;return d.choice!==null&&!!d.riskLevel&&!!d.preliminaryVendor&&String(d.note||'').trim().length>=15&&String(d.question||'').trim().length>=8;}
function teamRoleCardHTML(){
  const role=teamRoleConfig(); if(!role) return '<div class="waiting"><h2>팀 편성 대기</h2><p>교사가 팀을 편성하면 나의 역할과 지급정보가 표시됩니다.</p></div>';
  const ex=myAnswers?.team?.role;
  if(ex){const w=ex.work||{};return `<section class="team-role-card submitted"><div class="team-role-head"><span>${role.icon}</span><div><small>${me?.teamLabel||me?.teamId||'팀'} · 나의 직무</small><h3>${role.name}</h3><p>${roleDuty(me?.teamRoleKey)}</p></div></div><div class="feedback good"><b>✓ 개인 직무분석 제출 완료</b><br>핵심판단 · 위험도 · 1차 추천 · 확인질문까지 제출했습니다. 교사가 ‘팀 상황판’을 공개하면 조원들의 분석이 한 화면에 모입니다.</div><div class="role-submission-summary"><span><b>위험도</b>${riskName(w.riskLevel)}</span><span><b>1차 추천</b>${escapeHTML(vendorName(w.preliminaryVendor))}</span><p><b>내 핵심근거</b>${escapeHTML(w.note||'')}</p><p><b>다른 직무에 확인할 질문</b>${escapeHTML(w.question||'')}</p></div>${supplementalHTML()}</section>`;}
  const d=teamRoleDraft;
  return `<section class="team-role-card"><div class="team-role-head"><span>${role.icon}</span><div><small>${me?.teamLabel||me?.teamId||'팀'} · 나의 직무</small><h3>${role.name}</h3><p>${roleDuty(me?.teamRoleKey)}</p></div></div><div class="team-secret"><b>🔐 나에게 우선 지급된 직무자료</b><p>${role.secret}</p></div>${supplementalHTML()}<div class="work-section-title"><span>01</span><div><b>핵심정보 해석</b><small>자료를 읽고 가장 타당한 직무판단을 선택하세요.</small></div></div><div class="response-list">${role.options.map((x,i)=>`<button type="button" class="response-card ${d.choice!==null&&Number(d.choice)===i?'selected':''}" data-team-role-choice="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><div class="work-section-title"><span>02</span><div><b>위험도 판단</b><small>내 직무에서 이 사안을 어느 수준으로 관리해야 하는지 판단하세요.</small></div></div><div class="mini-choice-grid risk-grid">${[['low','낮음'],['mid','보통'],['high','높음']].map(([k,l])=>`<button type="button" class="mini-choice ${d.riskLevel===k?'selected':''}" data-team-risk="${k}">${l}</button>`).join('')}</div><div class="work-section-title"><span>03</span><div><b>1차 추천 대안</b><small>아직 다른 직무정보를 보기 전, 현재 자료만으로 1차 판단하세요. 나중에 바뀌어도 됩니다.</small></div></div><div class="mini-choice-grid">${[...C.team.vendors.map(v=>v.id),'HOLD'].map(id=>`<button type="button" class="mini-choice ${d.preliminaryVendor===id?'selected':''}" data-team-pre-vendor="${id}">${escapeHTML(vendorName(id))}</button>`).join('')}</div><label class="work-label">내 직무의 핵심근거</label><div class="required-note ${String(d.note||'').trim().length>=15?'ok':''}">※ 필수 · 숫자·기준·위험 중 핵심을 <b>15글자 이상</b> 적으세요. <span>현재 ${String(d.note||'').trim().length}/15자</span></div><textarea id="teamRoleNote" class="work-textarea" maxlength="260" placeholder="예: 09:30 이전 입고가 필수이므로 납기조건을 충족하지 못하면 가격이 낮아도 선정하기 어렵다.">${escapeHTML(d.note)}</textarea><label class="work-label">다른 담당자에게 확인할 질문</label><div class="required-note ${String(d.question||'').trim().length>=8?'ok':''}">※ 필수 · 내가 가진 정보만으로 부족한 점을 <b>8글자 이상</b> 질문하세요. <span>현재 ${String(d.question||'').trim().length}/8자</span></div><textarea id="teamRoleQuestion" class="work-textarea compact" maxlength="160" placeholder="예: 구매 담당에게 B대안의 정확한 납품시간을 확인하고 싶다.">${escapeHTML(d.question)}</textarea>${submitCheckHTML('teamRoleSubmitCheck',teamRoleMissingReasons(),'개인 직무분석을 제출할 수 있습니다.')}<button id="submitTeamRoleBtn" class="btn primary large full" ${teamRoleReady()?'':'disabled'}>개인 직무분석 제출</button></section>`;
}
function teamBoardHTML(){
  const b=teamBoard(), roster=teamRoster();
  if(!b?.members?.length) return `<section class="team-live-board"><div class="team-shared-screen"><span>🖥️ 팀 상황판 준비 중</span><h3>조원들의 직무분석을 취합하고 있습니다.</h3><p>교사 화면에서 ‘팀 상황판 공개’를 누르면 자리 이동 없이 모두의 판단이 이곳에 표시됩니다.</p></div></section>`;
  const done=b.members.filter(x=>x.roleSubmitted).length, midDone=b.members.filter(x=>x.midSubmitted).length, finalDone=b.members.filter(x=>x.reportSubmitted).length;
  return `<section class="team-live-board"><div class="team-board-head"><div><span>🖥️ LIVE TEAM BOARD</span><h3>${escapeHTML(b.teamLabel||me?.teamLabel||'우리 팀')} 디지털 직무회의 상황판</h3></div><strong>${done}/${b.members.length}<small>1차 자료</small></strong></div><div class="team-board-progress"><span style="width:${b.members.length?Math.round(done/b.members.length*100):0}%"></span></div><p class="team-board-guide">조원들이 각 자리에서 제출한 <b>핵심판단·위험도·1차추천·확인질문</b>이 자동으로 모였습니다. 의견이 다른 지점을 찾아 내 판단을 수정하거나 강화하세요.</p><div class="team-board-grid">${b.members.map(m=>`<article class="team-board-member ${m.uid===DB.uid?'mine':''} ${m.roleSubmitted?'done':'waiting'}"><header><div><b>${escapeHTML(m.studentName||'학생')}</b><span>${escapeHTML(m.roleName||'')}</span></div><em>${m.roleSubmitted?'분석 완료':'대기 중'}</em></header>${m.roleSubmitted?`<div class="team-board-metrics"><span><small>위험도</small><b>${riskName(m.riskLevel)}</b></span><span><small>1차 추천</small><b>${escapeHTML(vendorName(m.preliminaryVendor))}</b></span></div><p><b>핵심판단</b>${escapeHTML(m.coreJudgment||'')}</p><p><b>근거</b>${escapeHTML(m.note||'')}</p><p class="board-question"><b>확인질문</b>${escapeHTML(m.question||'')}</p>${m.midSubmitted?`<p class="board-mid"><b>중간판단</b>${escapeHTML(vendorName(m.midVendor))}<br><small>${escapeHTML(m.midReason||'')}</small></p>`:''}${m.extraRoleNames?.length?`<small class="extra-duty">겸임: ${m.extraRoleNames.map(escapeHTML).join(' · ')}</small>`:''}`:`<div class="board-waiting">아직 직무분석을 제출하지 않았습니다.</div>`}<footer>${m.reportSubmitted?'✓ 최종판단 제출':m.midSubmitted?'✓ 중간판단 제출':m.roleSubmitted?'1차 자료 제출':'제출 대기'}</footer></article>`).join('')}</div>${['checkpoint','twist','decision','scored'].includes(control?.teamPhase)?`<div class="team-final-progress">중간판단 제출 <b>${midDone}/${b.members.length}</b>${['decision','scored'].includes(control?.teamPhase)?` · 최종판단 <b>${finalDone}/${b.members.length}</b>`:''}</div>`:''}</section>`;
}

function teamMidMissingReasons(){
  const d=teamMidDraft,r=[];
  if(!d.vendor)r.push('중간 추천 대안이 미선택입니다.');
  const n=String(d.reason||'').trim().length;
  if(n<15)r.push(`팀 상황판을 보고 확인한 핵심근거를 ${15-n}글자 더 작성해주세요.`);
  return r;
}
function teamMidReady(){return teamMidMissingReasons().length===0;}
function updateTeamMidSubmitState(){
  const reasons=teamMidMissingReasons(),btn=$('#submitTeamMidBtn');
  if(btn)btn.disabled=reasons.length>0;
  updateSubmitCheck('teamMidSubmitCheck',reasons,'중간판단을 제출할 수 있습니다.');
}
function teamMidHTML(){
  const ex=myAnswers?.team?.mid;
  if(ex){const w=ex.work||{};return `<section class="team-mid-card submitted"><div class="feedback good"><b>✓ 중간판단 제출 완료</b><br>돌발상황이 공개되기 전 현재 시점의 판단이 확정되었습니다.</div><div class="role-submission-summary"><span><b>중간 추천</b>${escapeHTML(vendorName(w.vendor))}</span><p><b>상황판에서 중요하게 본 근거</b>${escapeHTML(w.reason||'')}</p></div></section>`;}
  const d=teamMidDraft;
  return `<section class="team-mid-card"><div class="team-shared-screen midpoint"><span>🧭 중간점검</span><h3>돌발상황 전에 현재 판단을 한 번 확정하세요.</h3><p>1차 자료와 팀 상황판을 함께 본 뒤, <b>현재 시점에서 가장 타당한 대안</b>을 제출합니다. 이후 돌발상황이 공개되면 이 판단이 어떻게 달라지는지 비교하게 됩니다.</p></div><label class="work-label">중간 추천 대안</label><div class="mini-choice-grid">${[...C.team.vendors.map(v=>v.id),'HOLD'].map(id=>`<button type="button" class="mini-choice ${d.vendor===id?'selected':''}" data-team-mid-vendor="${id}">${escapeHTML(vendorName(id))}</button>`).join('')}</div><label class="work-label">팀 상황판에서 중요하게 본 근거</label><div class="required-note ${String(d.reason||'').trim().length>=15?'ok':''}">※ 필수 · 조원의 정보 중 내 판단에 영향을 준 내용을 <b>15글자 이상</b> 적으세요. <span>현재 ${String(d.reason||'').trim().length}/15자</span></div><textarea id="teamMidReason" class="work-textarea compact" maxlength="260" placeholder="예: 운영 담당의 09:30 납기기준과 기록 담당의 이해관계 정보를 함께 고려했습니다.">${escapeHTML(d.reason)}</textarea>${submitCheckHTML('teamMidSubmitCheck',teamMidMissingReasons(),'중간판단을 제출할 수 있습니다.')}<button id="submitTeamMidBtn" class="btn primary large full" ${teamMidReady()?'':'disabled'}>중간판단 제출</button></section>`;
}
async function submitTeamMid(){
  if(submitting||myAnswers?.team?.mid)return;
  if(!teamMidReady())return toast(teamMidMissingReasons()[0]||'필수 항목을 확인해주세요.');
  const b=$('#submitTeamMidBtn');submitting=true;if(b){b.disabled=true;b.textContent='중간판단 저장 중...';}
  const vendorIndex=C.team.vendors.findIndex(v=>v.id===teamMidDraft.vendor);
  try{await DB.submitAnswer(code,'team','mid',{choice:vendorIndex,work:{teamId:me.teamId,vendor:teamMidDraft.vendor,reason:teamMidDraft.reason.trim()}});await syncMyResult();toast('중간판단을 제출했습니다.');}catch(e){toast('중간판단 저장 중 오류가 발생했습니다.');if(b){b.disabled=false;b.textContent='중간판단 제출';}}finally{submitting=false;}
}

function teamReportReady(){const d=teamReportDraft;const needsInfluence=(teamRoster()?.members?.length||0)>1;return d.issues.length>=4&&d.criteria.length>=4&&d.conflictResponse!==null&&d.twistResponse!==null&&d.vendor&&(!needsInfluence||d.influenceUid)&&String(d.reason||'').trim().length>=20;}
function teamDecisionHTML(){
  const ex=myAnswers?.team?.report; const roster=teamRoster();
  if(ex) return `<section class="team-decision-card"><div class="feedback good"><b>✓ 나의 최종위원 의견 제출 완료</b><br>이제 다른 조원의 제출이 끝날 때까지 기다리세요. 팀 점수는 모두의 판단을 종합하여 산출됩니다.</div></section>`;
  const d=teamReportDraft, others=(roster?.members||[]).filter(x=>x.uid!==DB.uid);
  return `<section class="team-decision-card"><div class="team-shared-screen"><span>👤 모든 조원이 직접 제출</span><h3>최종위원 의견서</h3><p>서기 한 명이 대신 작성하지 않습니다. <b>모든 조원이 동일한 상황판을 보고 자신의 최종 판단을 직접 제출</b>하며, 시스템이 팀의 합의도와 판단의 질을 함께 평가합니다.</p></div><div class="work-section-title"><span>01</span><div><b>핵심 문제 종합</b><small>팀 상황판과 지급정보를 종합해 관리해야 할 문제를 4개 이상 선택하세요.</small></div></div><div class="required-note ${d.issues.length>=4?'ok':''}">※ <b>4개 이상</b> 선택 · 현재 ${d.issues.length}개</div><div class="criteria-grid">${C.team.issues.map(x=>`<label class="criteria-chip ${d.issues.includes(x.key)?'selected':''}"><input type="checkbox" data-team-issue="${x.key}" ${d.issues.includes(x.key)?'checked':''}><span>${x.label}</span></label>`).join('')}</div><div class="work-section-title"><span>02</span><div><b>판단기준 확정</b><small>실제 최종결정에 적용할 기준을 4개 이상 선택하세요.</small></div></div><div class="required-note ${d.criteria.length>=4?'ok':''}">※ <b>4개 이상</b> 선택 · 현재 ${d.criteria.length}개</div><div class="criteria-grid">${C.team.criteria.map(x=>`<label class="criteria-chip ${d.criteria.includes(x.key)?'selected':''}"><input type="checkbox" data-team-criterion="${x.key}" ${d.criteria.includes(x.key)?'checked':''}><span>${x.label}</span></label>`).join('')}</div><div class="work-section-title"><span>03</span><div><b>이해관계 처리</b><small>${C.team.conflictPrompt||'이해관계를 어떻게 처리할지 결정하세요.'}</small></div></div><div class="response-list">${C.team.conflictResponses.map((x,i)=>`<button type="button" class="response-card ${d.conflictResponse!==null&&Number(d.conflictResponse)===i?'selected':''}" data-team-conflict="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><div class="team-vendor-table">${C.team.vendors.map(v=>`<div><b>${v.id} · ${v.name}</b><span>${v.price}</span><span>${C.team.qualityLabel||'품질'} ${v.quality}</span><span>${C.team.deliveryLabel||'납기'} ${v.delivery}</span></div>`).join('')}</div><div class="work-section-title"><span>04</span><div><b>돌발상황 반영</b><small>새 정보가 들어온 뒤 기존 1차 판단을 다시 검토하세요.</small></div></div><div class="work-alert"><b>⚠️ 추가정보</b><span>${C.team.twist}</span></div><div class="response-list">${C.team.twistResponses.map((x,i)=>`<button type="button" class="response-card ${d.twistResponse!==null&&Number(d.twistResponse)===i?'selected':''}" data-team-twist="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><div class="work-section-title"><span>05</span><div><b>교차검증</b><small>다른 조원의 정보 중 내 판단을 가장 크게 바꾸거나 확신시킨 정보를 선택하세요.</small></div></div>${others.length?`<div class="influence-grid">${others.map(x=>`<button type="button" class="influence-card ${d.influenceUid===x.uid?'selected':''}" data-team-influence="${x.uid}"><b>${escapeHTML(x.studentName||'학생')}</b><span>${escapeHTML(x.roleName||'')}</span><small>${roleDuty(x.roleKey)}</small></button>`).join('')}</div>`:'<div class="feedback info">1인 팀 예외 운영으로 교차검증 선택은 생략됩니다.</div>'}<div class="work-section-title"><span>06</span><div><b>최종 의사결정</b><small>돌발상황까지 반영한 최종 대안과 근거를 제출하세요.</small></div></div><label class="work-label">최종 대안</label><div class="mini-choice-grid">${C.team.vendors.map(v=>`<button type="button" class="mini-choice ${d.vendor===v.id?'selected':''}" data-team-vendor="${v.id}">${v.id} · ${v.name}</button>`).join('')}</div><label class="work-label">최종 판단근거</label><div class="required-note ${String(d.reason||'').trim().length>=20?'ok':''}">※ 팀 상황판·돌발상황·이해관계를 연결해 <b>20글자 이상</b> 작성하세요. <span>현재 ${String(d.reason||'').trim().length}/20자</span></div><textarea id="teamReportReason" class="work-textarea" maxlength="460" placeholder="예산·품질·납기·이해관계·돌발상황과 다른 조원의 정보를 어떻게 종합했는지 적으세요.">${escapeHTML(d.reason)}</textarea>${submitCheckHTML('teamReportSubmitCheck',teamReportMissingReasons(),'최종위원 의견을 제출할 수 있습니다.')}<button id="submitTeamReportBtn" class="btn primary large full" ${teamReportReady()?'':'disabled'}>나의 최종위원 의견 제출</button></section>`;
}
function teamComprehensiveFeedbackHTML(pub,memberEv){
  const details=pub?.details||[];
  const ranked=details.filter(x=>Number(x[2]||0)>0).map(x=>({label:x[0],got:Number(x[1]||0),max:Number(x[2]||0),ratio:Number(x[1]||0)/Number(x[2]||1)})).sort((a,b)=>b.ratio-a.ratio);
  const best=ranked[0],growth=ranked[ranked.length-1];
  const first=myAnswers?.team?.role?.work?.preliminaryVendor||'HOLD';
  const mid=myAnswers?.team?.mid?.work?.vendor||first;
  const final=myAnswers?.team?.report?.work?.vendor||mid;
  const changed=[first,mid,final].filter((x,i,a)=>i===0||x!==a[i-1]).length>1;
  const impact=Object.entries(pub?.impact||{}).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3);
  return `<section class="team-comprehensive-feedback"><div class="feedback-section-label"><b>종합평가 활동 피드백</b><span>정답뿐 아니라 판단이 만들어지고 수정되는 과정을 돌아봅니다.</span></div><div class="team-judgment-journey"><span><small>1차 판단</small><b>${escapeHTML(vendorName(first))}</b></span><em>→</em><span><small>중간판단</small><b>${escapeHTML(vendorName(mid))}</b></span><em>→</em><span><small>최종판단</small><b>${escapeHTML(vendorName(final))}</b></span></div><div class="team-feedback-grid"><article class="good"><span>✓ 활동에서 잘한 점</span><h3>${escapeHTML(best?.label||'직무정보 분석·공유')}</h3><p>${best?`${best.got}/${best.max}점으로 팀 수행에서 가장 안정적이었습니다.`:'각자의 직무정보를 제출하고 팀의 판단에 참여했습니다.'}</p></article><article class="growth"><span>△ 다음에 더 해볼 점</span><h3>${escapeHTML(growth?.label||'교차검증')}</h3><p>${growth?`${growth.got}/${growth.max}점이었습니다. 다음 직무상황에서는 이 부분의 근거를 더 구체적으로 확인해보세요.`:'다른 직무의 정보가 내 판단과 어떻게 연결되는지 한 번 더 설명해보세요.'}</p></article><article class="advice"><span>💡 활동 전반 제언</span><h3>${changed?'근거가 바뀌면 판단도 바꿀 수 있습니다.':'판단을 유지할 때도 근거를 다시 확인하세요.'}</h3><p>직업현장에서는 처음 선택을 고집하는 것보다 <b>새로운 사실과 다른 직무의 관점을 확인하고, 판단을 바꾸거나 유지한 이유를 기록하는 과정</b>이 중요합니다.</p></article></div>${impact.length?`<div class="team-feedback-virtues"><b>이번 활동에서 많이 활용한 청렴덕목</b><div>${impact.map(([k])=>`<span class="virtue-link-chip virtue-${escapeHTML(k)}">${escapeHTML(virtueMeta(k).name)}</span>`).join('')}</div></div>`:''}</section>`;
}
function teamScorecardHTML(){
  const pub=teamPublished(); if(!pub) return `<div class="waiting"><h3>팀 채점 대기</h3><p>교사가 팀별 작업결과를 채점·공개하면 결과가 표시됩니다.</p></div>`;
  const memberEv=teamMemberEval(); const composite=Math.round(Number(pub.teamScore||0)*0.8+memberEv.score*0.2);
  return `<section class="team-score-card"><div class="work-result-head"><div><span>${me?.teamLabel||'우리 팀'} 종합작업 결과</span><h3>팀 종합판단 80% + 개인 직무기여 20%</h3></div><strong>${composite}<small>/100</small></strong></div><div class="team-score-formula"><span>팀 종합판단 <b>${pub.teamScore}</b></span><span>개인 직무기여 <b>${memberEv.score}</b></span><span>개인 반영점수 <b>${composite}</b></span></div>${scoreRowsHTML(pub.details||[])}${pub.consensus?`<div class="consensus-result"><b>팀 최종의견 분포</b>${Object.entries(pub.consensus).map(([k,v])=>`<span>${escapeHTML(vendorName(k))} <strong>${v}명</strong></span>`).join('')}</div>`:''}<div class="feedback info"><b>종합평가의 의미</b><br>역할별 직무분석, 디지털 상황판을 통한 교차검증, 중간판단, 돌발상황 이후 각자의 최종판단과 팀 합의도를 함께 확인했습니다.</div></section>${teamComprehensiveFeedbackHTML(pub,memberEv)}`;
}
function renderTeam(){
  if(!me?.teamId) return `<span class="stage-tag">직무상황 종합평가 시작</span><h2>이번 평가는 이렇게 진행합니다.</h2>${teamHowToHTML()}${waiting('팀 편성 대기','교사가 전공분야 안에서 랜덤팀을 편성하면 조원 이름과 나의 직무가 자동으로 표시됩니다.')}`;
  const phase=control?.teamPhase||'briefing';
  const phaseLabel={briefing:'① 개인 직무분석·1차 자료 제출',board:'② 디지털 팀 상황판',checkpoint:'③ 중간판단 제출',twist:'④ 돌발상황',decision:'⑤ 전원 최종판단',scored:'⑥ 결과·종합피드백'}[phase]||'종합평가';
  let body='';
  if(phase==='briefing') body=teamRoleCardHTML();
  if(phase==='board') body=`${teamRoleCardHTML()}${teamBoardHTML()}<div class="feedback info"><b>다음 단계 안내</b><br>조원들의 정보를 충분히 비교한 뒤 교사가 ‘중간판단 제출’을 열면 돌발상황 전 판단을 한 번 확정합니다.</div>`;
  if(phase==='checkpoint') body=`${teamBoardHTML()}${teamMidHTML()}`;
  if(phase==='twist') body=`${teamBoardHTML()}${teamMidHTML()}<div class="work-alert team-twist"><b>⚠️ 돌발상황 공개</b><span>${C.team.twist}</span></div><div class="feedback info"><b>지금 할 일</b><br>1차 판단과 중간판단이 달라져도 괜찮습니다. 팀 상황판의 다른 직무정보와 새 조건이 내 판단을 어떻게 바꾸는지 검토하세요.</div>`;
  if(phase==='decision') body=`${teamBoardHTML()}<div class="work-alert team-twist"><b>⚠️ 돌발상황</b><span>${C.team.twist}</span></div>${teamDecisionHTML()}`;
  if(phase==='scored') body=`${teamBoardHTML()}${teamScorecardHTML()}`;
  return `<div class="work-exam-head"><div><span class="stage-tag">직무상황 종합평가 · 무이동 디지털 협업</span><h2>${C.team.title}</h2><p>${C.team.objective}</p></div><div class="work-code"><small>과제번호</small><b>${C.team.code}</b></div></div><div class="team-compact-flow six-step"><span class="${phase==='briefing'?'active':''}">① 1차 자료</span><span class="${phase==='board'?'active':''}">② 상황판</span><span class="${phase==='checkpoint'?'active':''}">③ 중간제출</span><span class="${phase==='twist'?'active':''}">④ 돌발상황</span><span class="${phase==='decision'?'active':''}">⑤ 최종판단</span><span class="${phase==='scored'?'active':''}">⑥ 피드백</span></div>${teamRosterHTML()}<div class="team-phase-banner"><b>${me.teamLabel||me.teamId}</b><span>${phaseLabel}</span><small>${me.teamRoleName||''}</small></div><div class="work-context">${C.team.context}</div>${body}`;
}

function bindTeam(){
  document.querySelectorAll('[data-team-role-choice]').forEach(b=>b.onclick=()=>{teamRoleDraft.choice=Number(b.dataset.teamRoleChoice);render();});
  document.querySelectorAll('[data-team-risk]').forEach(b=>b.onclick=()=>{teamRoleDraft.riskLevel=b.dataset.teamRisk;render();});
  document.querySelectorAll('[data-team-pre-vendor]').forEach(b=>b.onclick=()=>{teamRoleDraft.preliminaryVendor=b.dataset.teamPreVendor;render();});
  const rn=$('#teamRoleNote'); if(rn) rn.oninput=()=>{teamRoleDraft.note=rn.value;syncRequiredCounter(rn,15);updateTeamRoleSubmitState();};
  const rq=$('#teamRoleQuestion'); if(rq) rq.oninput=()=>{teamRoleDraft.question=rq.value;syncRequiredCounter(rq,8);updateTeamRoleSubmitState();};
  const rb=$('#submitTeamRoleBtn'); if(rb) rb.onclick=submitTeamRole;
  document.querySelectorAll('[data-team-mid-vendor]').forEach(b=>b.onclick=()=>{teamMidDraft.vendor=b.dataset.teamMidVendor;render();});
  const mr=$('#teamMidReason'); if(mr) mr.oninput=()=>{teamMidDraft.reason=mr.value;syncRequiredCounter(mr,15);updateTeamMidSubmitState();};
  const mb=$('#submitTeamMidBtn'); if(mb) mb.onclick=submitTeamMid;
  document.querySelectorAll('[data-team-issue]').forEach(x=>x.onchange=()=>{const k=x.dataset.teamIssue;teamReportDraft.issues=x.checked?[...new Set([...teamReportDraft.issues,k])]:teamReportDraft.issues.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-team-criterion]').forEach(x=>x.onchange=()=>{const k=x.dataset.teamCriterion;teamReportDraft.criteria=x.checked?[...new Set([...teamReportDraft.criteria,k])]:teamReportDraft.criteria.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-team-conflict]').forEach(b=>b.onclick=()=>{teamReportDraft.conflictResponse=Number(b.dataset.teamConflict);render();});
  document.querySelectorAll('[data-team-twist]').forEach(b=>b.onclick=()=>{teamReportDraft.twistResponse=Number(b.dataset.teamTwist);render();});
  document.querySelectorAll('[data-team-influence]').forEach(b=>b.onclick=()=>{teamReportDraft.influenceUid=b.dataset.teamInfluence;render();});
  document.querySelectorAll('[data-team-vendor]').forEach(b=>b.onclick=()=>{teamReportDraft.vendor=b.dataset.teamVendor;render();});
  const tr=$('#teamReportReason'); if(tr) tr.oninput=()=>{teamReportDraft.reason=tr.value;syncRequiredCounter(tr,20);updateTeamReportSubmitState();};
  const sr=$('#submitTeamReportBtn'); if(sr) sr.onclick=submitTeamReport;
}
async function submitTeamRole(){
  if(submitting||myAnswers?.team?.role)return; if(!teamRoleReady()){const r=teamRoleMissingReasons();return toast(r[0]||'필수 항목을 확인해주세요.');} const role=teamRoleConfig(); if(!role)return;
  const b=$('#submitTeamRoleBtn');submitting=true;if(b){b.disabled=true;b.textContent='직무분석 저장 중...';}
  try{await DB.submitAnswer(code,'team','role',{choice:Number(teamRoleDraft.choice),work:{teamId:me.teamId,roleKey:me.teamRoleKey,riskLevel:teamRoleDraft.riskLevel,preliminaryVendor:teamRoleDraft.preliminaryVendor,note:teamRoleDraft.note.trim(),question:teamRoleDraft.question.trim(),extraRoleKeys:extraRoles()}});await syncMyResult();toast('개인 직무분석을 제출했습니다.');}catch(e){toast('직무분석 저장 중 오류가 발생했습니다.');if(b){b.disabled=false;b.textContent='개인 직무분석 제출';}}finally{submitting=false;}
}
async function submitTeamReport(){
  if(submitting||myAnswers?.team?.report||control?.teamPhase!=='decision')return; if(!teamReportReady()){const r=teamReportMissingReasons();return toast(r[0]||'필수 항목을 확인해주세요.');}
  const b=$('#submitTeamReportBtn');submitting=true;if(b){b.disabled=true;b.textContent='최종의견 저장 중...';}
  const vendorIndex=C.team.vendors.findIndex(v=>v.id===teamReportDraft.vendor);
  try{await DB.submitAnswer(code,'team','report',{choice:vendorIndex,work:{teamId:me.teamId,issues:[...teamReportDraft.issues],criteria:[...teamReportDraft.criteria],conflictResponse:Number(teamReportDraft.conflictResponse),twistResponse:Number(teamReportDraft.twistResponse),vendor:teamReportDraft.vendor,influenceUid:teamReportDraft.influenceUid||null,reason:teamReportDraft.reason.trim()}});await syncMyResult();toast('나의 최종위원 의견을 제출했습니다.');}catch(e){toast('최종의견 저장 중 오류가 발생했습니다.');if(b){b.disabled=false;b.textContent='나의 최종위원 의견 제출';}}finally{submitting=false;}
}

function render() {
  if (!control) return;

  progress();

  const q = item();
  const stage = control.stage;
  let h = '';

  if (stage === 'waiting') {
    h = waiting(
      '수험등록 완료',
      '교사가 수업을 시작할 때까지 잠시 기다려주세요.'
    );
  }

  if (stage === 'intro') {
    h = `<span class="stage-tag">전공별 오리엔테이션</span><div class="my-track-banner"><b>${myTrack().icon} ${myTrack().name}</b><span>${myTrack().departments}</span></div>
      <h2>${C.intro.title}</h2>
      <div class="student-context">${C.intro.body}</div>
      <div class="student-virtues">${
        C.virtues.map(v => `<div class="student-virtue">
          <b>${v.name}</b>
          <span>${v.tag}<br>${v.desc}</span>
        </div>`).join('')
      }</div>`;
  }

  if (stage === 'written') {
    const ex = mine('written', q.id);
    const pending = pendingChoices[answerKey()];

    h = `<span class="stage-tag">필기평가 ${Number(control.index) + 1}/${C.written.length}</span>
      <h2>${q.q}</h2>
      ${choiceHTML(q.options, ex, pending, q.correct)}
      ${!ex ? `<div class="student-submit">
        ${submitCheckHTML('writtenSubmitCheck',pending==null?[`${Number(control.index)+1}번 문항이 미선택입니다. 답안을 선택해주세요.`]:[],`${Number(control.index)+1}번 문항 답안 선택 완료 · 제출할 수 있습니다.`)}
        <button id="submitBtn" class="btn primary large full" ${pending == null ? 'disabled' : ''}>
          답안 제출
        </button>
      </div>` : `<div class="written-submit-result ${Number(ex.choice)===Number(q.correct)?'correct':'wrong'}"><b>${Number(ex.choice)===Number(q.correct)?'O':'X'}</b><span>${Number(ex.choice)===Number(q.correct)?'정답 · 제출완료':'오답 · 제출완료'}</span></div>`}
      ${ex ? writtenInstantFeedbackHTML(q,ex) : ''}`;
  }

  if (stage === 'writtenFeedback') {
    const f=writtenFeedbackModel();
    const growth=f.growth;
    h = `<span class="stage-tag">필기평가 완료 · 1차 피드백</span>
      <div class="written-feedback-hero">
        <div><span>WRITTEN → PRACTICAL</span><h2>필기평가는 끝났습니다.<br>이제 <em>작업형 실기</em>로 넘어갑니다.</h2><p>필기평가에서 확인된 6대 청렴역량을 살펴보고, 작업형 실기에서 무엇을 더 의식할지 정리해보세요.</p></div>
        <div class="written-result-ring"><b>${f.correct}</b><span>/ ${C.written.length} 정답</span></div>
      </div>
      <div class="written-feedback-bars">${C.virtues.map(v=>{const x=f.values[v.key]||0;return `<div class="written-feedback-row"><div><b>${v.name}</b><span>${v.tag}</span></div><div class="written-feedback-track"><i style="width:${x}%"></i></div><strong>${x}</strong></div>`}).join('')}</div>
      <div class="written-feedback-cards">
        <article class="written-strength"><span>✓ 잘하고 있어요</span><h3>${f.strengths.map(x=>`${x.name} ${x.score}`).join(' · ')}</h3><p>${f.strengths[0]?.desc||'필기에서 강점이 확인되었습니다.'}</p></article>
        <article class="written-growth"><span>→ 실기에서 더 연습해볼 점</span><h3>${growth?.name||'청렴역량'} ${growth?.score||0}</h3><p>${writtenCoaching[growth?.key]||'다음 실기에서는 판단근거와 기록을 더 구체적으로 남겨보세요.'}</p></article>
      </div>
      <div class="written-to-practical"><b>화면 전환 안내</b><div><span><strong>필기</strong> 상황을 읽고 보기에서 판단</span><em>→</em><span><strong>실기</strong> 지급자료 확인 → 기준 설정 → 실제 처리 → 기록 제출</span></div><small>교사가 작업형 실기를 시작하면 화면이 자동으로 전환됩니다.</small></div>`;
  }

  if (stage === 'practical') {
    const ex = mine('practical', q.id);
    h = renderPractical(q, ex);
  }

  if (stage === 'practicalFeedback') {
    const f=practicalFeedbackModel(), growth=f.growth;
    h = `<span class="stage-tag">작업형 실기 완료 · 2차 피드백</span>
      <div class="practical-feedback-hero"><div><span>PRACTICAL → TEAM PRACTICAL</span><h2>작업형 실기는 끝났습니다.<br>이제 <em>직무상황 종합평가</em>로 넘어갑니다.</h2><p>세 작업형 과제에서 어떤 수행이 강했고, 직무상황 종합평가에서 무엇을 더 의식하면 좋을지 확인해보세요.</p></div><div class="practical-result-ring"><b>${f.average}</b><span>실기 평균</span><small>${f.complete}/${C.practical.length} 제출</small></div></div>
      <div class="practical-feedback-tasks">${f.tasks.map(x=>`<article class="${x.answered?'done':'missing'}"><span>P-0${x.index}</span><b>${x.answered?x.score:0}</b><small>${x.answered?'100점 기준':'미제출 · 0점'}</small></article>`).join('')}</div>
      <div class="feedback-section-label"><b>필기 + 개인실기 반영 · 2차 청렴역량</b><span>최종 점수는 종합평가까지 마친 뒤 다시 산출됩니다.</span></div>
      <div class="written-feedback-bars">${C.virtues.map(v=>{const x=f.values[v.key]||0;return `<div class="written-feedback-row"><div><b>${v.name}</b><span>${v.tag}</span></div><div class="written-feedback-track"><i style="width:${x}%"></i></div><strong>${x}</strong></div>`}).join('')}</div>
      <div class="written-feedback-cards"><article class="written-strength"><span>✓ 실기에서 잘하고 있어요</span><h3>${f.strengths.map(x=>`${x.name} ${x.score}`).join(' · ')}</h3><p>${f.bestElement?`특히 P-0${f.bestElement.task}의 ‘${f.bestElement.label}’ 수행이 안정적이었습니다.`:'제출한 작업을 기준에 따라 끝까지 수행했습니다.'}</p></article><article class="written-growth"><span>→ 종합평가에서 더 해볼 점</span><h3>${growth?.name||'청렴역량'} ${growth?.score||0}</h3><p>${practicalCoaching[growth?.key]||'다른 직무의 정보를 확인하고 새 조건을 반영해 판단근거를 더 구체적으로 남겨보세요.'}</p></article></div>
      ${teamHowToHTML()}
      <div class="transition-wait"><b>교사의 안내를 기다려주세요.</b><span>교사가 ‘전공맞춤 직무상황 종합평가’를 시작하면 화면이 자동으로 전환됩니다.</span></div>`;
  }

  if (stage === 'team') { h = renderTeam(); }

  if (stage === 'diagnosis') {
    const c = comp();
    h = `<span class="stage-tag">역량진단</span>
      <h2>나의 청렴역량은 어떤 모양일까요?</h2>
      <div class="student-context">
        점수는 나의 인격을 평가하는 값이 아니라 오늘 어떤 가치를 중심으로 판단했는지 돌아보기 위한 교육용 피드백입니다.
      </div>
      <div class="student-comp">${
        C.virtues.map(v => `<div class="comp-row">
          <div class="comp-meta"><span>${v.name}</span><b>${c[v.key] || 0}</b></div>
          <div class="comp-track"><span style="width:${c[v.key] || 0}%"></span></div>
        </div>`).join('')
      }</div>
      ${typeCardHTML(getCheongryeomType(c))}`;
  }

  if (stage === 'pledge') {
    const pledgeSubmitted = String(myPledge?.text || '').trim().length >= 10;
    h = `<span class="stage-tag">최종 미션</span>
      <h2>나의 청렴 실천약속</h2>
      <div class="student-context">
        내 전공의 미래 직업현장에서 실제로 지킬 수 있는 청렴·직업윤리 행동 한 가지를 구체적으로 적어주세요.
      </div>
      <div class="pledge-area ${pledgeSubmitted ? 'submitted' : ''}">
        <textarea id="pledgeText" maxlength="160" ${pledgeSubmitted ? 'readonly aria-readonly="true" class="pledge-submitted"' : ''} placeholder="예: 직무기준과 실제 기록이 다르면 편의보다 사실대로 보고하겠습니다.">${myPledge?.text || ''}</textarea>
        <div id="pledgeRequirement" class="required-note ${pledgeSubmitted ? 'ok pledge-complete-note' : ''}">${pledgeSubmitted ? '✓ 실천약속 제출이 완료되었습니다.' : `※ 필수 · 실천약속을 <b>10글자 이상</b> 작성해야 제출할 수 있습니다. <span>현재 ${String(myPledge?.text||'').trim().length}/10자</span>`}</div>
        <div class="student-submit">
          <button id="pledgeBtn" class="btn ${pledgeSubmitted ? 'submitted' : 'primary'} large full" ${pledgeSubmitted ? 'disabled aria-disabled="true"' : 'disabled'}>
            ${pledgeSubmitted ? '✓ 제출완료' : '실천약속 제출'}
          </button>
        </div>
      </div>`;
  }

  if (stage === 'result') {
    const s = scores();
    const t = integrityType();
    const isConfirmation=s.documentType==='응시확인서';
    const displayTitle=isConfirmation?'응시확인서':s.qualification;
    const missingNotice = s.missingQuestions > 0 || !s.teamComplete || s.pl === 0
      ? `<div class="feedback info"><b>채점 안내</b><br>${s.missingQuestions > 0 ? `시간 내 제출하지 못한 ${s.missingQuestions}개 문항은 0점으로 반영되었습니다.<br>` : ''}${!s.teamComplete ? '직무상황 종합평가 결과가 공개되지 않은 경우 팀 실기 점수는 0점으로 반영됩니다.<br>' : ''}${s.pl === 0 ? '청렴 실천약속 미제출은 0점으로 반영되었습니다.' : ''}</div>`
      : '';
    const certText=isConfirmation
      ? `위 학생은 청렴ON 교육과정에 참여하여<br>정직·약속·배려·책임·절제·공정의 가치를 탐색하고<br>직업현장의 청렴한 판단을 연습하였음을 확인합니다.<br><b>오늘의 도전을 응원합니다. 청렴은 다음 선택에서 다시 자랍니다.</b>`
      : `위 학생은 청렴ON 교육과정을 통해<br>정직·약속·배려·책임·절제·공정의 가치를 이해하고<br>직무상황에서 청렴한 판단과 실천을 수행하였으므로<br><b>${s.qualification}</b>로 인증합니다.`;
    h = `<span class="stage-tag">자격판정</span>
      <h2>평가가 종료되었습니다.</h2>
      <div id="certificate" class="certificate ${s.qualification === '청렴 리더' ? 'leader' : ''} ${isConfirmation?'confirmation':''}">
        <img src="assets/official/ci-education.png" alt="국가청렴권익교육원">
        <div class="cert-type">${isConfirmation?'청렴ON 교육 참여 확인':'교육용 청렴역량 인증 프로그램'}</div>
        <h2>${displayTitle}</h2>
        <div class="cert-name">${me?.studentName || '청렴ON 도전자'}</div><div class="cert-track">${myTrack().icon} ${myTrack().name} 직업윤리 과정</div>
        <div class="cert-integrity-type">${t.symbol} ${t.name} · ${t.figure}</div>
        <div class="cert-text">${certText}</div>
        <div class="cert-date">${new Date().toLocaleDateString('ko-KR')}</div>
      </div>
      <div class="student-submit"><button id="saveCert" class="btn ${s.qualification === '청렴 리더' ? 'gold' : 'primary'} full">${isConfirmation?'응시확인서':'자격증'} 이미지 저장</button></div>
      <div class="qualification-rule"><b>청렴ON 교육용 판정기준</b><span><em>60점 이상</em> 청렴 리더</span><span><em>41~59점</em> 청렴 서포터</span><span><em>40점 이하</em> 응시확인서</span></div>
      <div class="score-box"><div class="score-main"><span>종합 청렴역량 점수</span><strong>${s.total}</strong></div><div class="score-grid"><div><span>필기</span><b>${s.w}</b></div><div><span>실기</span><b>${s.p}</b></div><div><span>종합평가</span><b>${s.team}</b></div><div><span>실천</span><b>${s.pl}</b></div></div></div>
      ${practicalBreakdownHTML(s)}
      ${s.teamComplete?teamScorecardHTML():''}
      ${missingNotice}
      ${typeCardHTML(t)}
      <div class="feedback info">※ 실제 국가기술자격이 아닌 교육용 청렴역량 인증입니다.</div>`;
  }

  $('#studentContent').innerHTML = h;
  bindChoices();
  if (stage === 'practical' && q) bindPractical(q, mine('practical', q.id));
  if (stage === 'team') bindTeam();
  updateTimerDisplay();

  if ($('#submitBtn')) $('#submitBtn').onclick = submit;
  if ($('#pledgeBtn')) $('#pledgeBtn').onclick = savePledge;
  const pledgeTextEl = $('#pledgeText');
  if (pledgeTextEl && !pledgeTextEl.readOnly) pledgeTextEl.oninput = () => {
    const n = pledgeTextEl.value.trim().length;
    const b = $('#pledgeBtn');
    const note = $('#pledgeRequirement');
    if (b) b.disabled = n < 10;
    if (note) {
      note.classList.toggle('ok', n >= 10);
      note.innerHTML = `※ 필수 · 실천약속을 <b>10글자 이상</b> 작성해야 제출할 수 있습니다. <span>현재 ${n}/10자</span>`;
    }
  };
  if ($('#saveCert')) $('#saveCert').onclick = saveCert;
}

async function submit() {
  if (submitting) return;

  const k = answerKey();
  const selected = pendingChoices[k];
  if (selected == null) return;

  const q = item();
  const stage = control.stage;
  const key = q.id;

  const btn = $('#submitBtn');
  submitting = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = '제출 중...';
  }

  try {
    await DB.submitAnswer(code, stage, key, { choice: selected });
    delete pendingChoices[k];
    await syncMyResult();
    toast('응답을 제출했습니다.');
  } catch (e) {
    toast('이미 제출했거나 저장 중 오류가 발생했습니다.');
    if (btn) {
      btn.disabled = false;
      btn.textContent = stage === 'practical' ? '나의 선택 제출' : '답안 제출';
    }
  } finally {
    submitting = false;
  }
}

async function savePledge() {
  if (String(myPledge?.text || '').trim().length >= 10) {
    return toast('이미 제출이 완료된 실천약속입니다.');
  }
  const t = $('#pledgeText').value.trim();
  if (t.length < 10) return toast('실천약속을 10글자 이상 구체적으로 적어주세요.');

  await DB.savePledge(code, t);
  myPledge = { text: t, savedAt: Date.now() };
  await syncMyResult();
  render();
  toast('실천약속 제출이 완료되었습니다.');
}

async function saveCert() {
  const el = $('#certificate');
  if (!el) return;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    const a = document.createElement('a');
    const sc=scores();
    a.download = `청렴ON_${sc.documentType==='응시확인서'?'응시확인서':sc.qualification}_${me?.studentName || '결과'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch (e) {
    window.print();
  }
}

function subscribe() {
  unsubs = [
    DB.on('control', code, v => {
      control = v || { stage: 'waiting' };
      if (control.stage === 'process') {
        control = { ...control, stage: 'team', index: 0, teamPhase: control.teamPhase || 'briefing' };
      }
      render();
    }),
    DB.on(`pledges/${DB.uid}`, code, v => {
      myPledge = v || null;
      render();
    }),
    DB.on(`participants/${DB.uid}`, code, v => {
      me = v || me;
      if(me?.trackKey) activateTrack(me.trackKey);
      render();
    })
  ];

  myAnswers = { written: {}, practical: {}, team: {role:null, mid:null, report:null} };

  C.written.forEach(q => {
    unsubs.push(DB.on(`answers/written/${q.id}/${DB.uid}`, code, v => {
      if (v) myAnswers.written[q.id] = v;
      else delete myAnswers.written[q.id];
      render();
    }));
  });

  C.practical.forEach(q => {
    unsubs.push(DB.on(`answers/practical/${q.id}/${DB.uid}`, code, v => {
      if (v) myAnswers.practical[q.id] = v;
      else delete myAnswers.practical[q.id];
      render();
    }));
  });

  unsubs.push(DB.on(`answers/team/role/${DB.uid}`, code, v => { myAnswers.team.role=v||null; render(); }));
  unsubs.push(DB.on(`answers/team/mid/${DB.uid}`, code, v => { myAnswers.team.mid=v||null; render(); }));
  unsubs.push(DB.on(`answers/team/report/${DB.uid}`, code, v => { myAnswers.team.report=v||null; render(); }));

  setInterval(() => DB.heartbeat(code), 25000);
}

async function join() {
  const c = $('#joinCode').value.trim();
  let name = $('#studentName').value.trim().replace(/\s+/g, ' ');
  const trackKey=document.querySelector('input[name="trackKey"]:checked')?.value||'';
  const track=trackKey?CHEONGRYEOM_TRACK(trackKey):null;

  if (!/^\d{6}$/.test(c)) return toast('6자리 참여코드를 확인해주세요.');
  if (name.length < 2 || name.length > 20) return toast('학생 이름을 정확히 입력해주세요.');
  if(!trackKey||!track) return toast('나의 전공분야를 먼저 선택해주세요.');
  if (!/^[가-힣A-Za-z ]+$/.test(name)) return toast('이름에는 한글·영문과 띄어쓰기만 사용할 수 있습니다.');

  try {
    await DB.joinRoom(c, name, $('#schoolLevel').value);
    await DB.updateMe(c,{trackKey,trackName:track.name});
    localStorage.setItem('cheongryeomTrack',trackKey);
    activateTrack(trackKey);
    code = c;
    me = {
      studentName: name,
      schoolLevel: $('#schoolLevel').value, trackKey, trackName:track.name
    };

    $('#joinPanel').classList.add('hidden');
    $('#examPanel').classList.remove('hidden');

    subscribe();
    toast(`${name} 학생, 수험등록을 완료했습니다.`);
  } catch (e) {
    toast(e.message || '수업방에 입장할 수 없습니다.');
  }
}

(async () => {
  bindStudentZoom();
  const p = new URLSearchParams(location.search).get('room');
  if (p) $('#joinCode').value = p;

  if (!DB.configured) {
    $('#configError').classList.remove('hidden');
    $('#studentStatus').textContent = '준비 중';
    $('#studentStatus').classList.add('error');
    return;
  }

  try {
    await DB.init();
    $('#studentStatus').textContent = 'v8.8.1';
    $('#studentStatus').classList.add('online');
    $('#joinPanel').classList.remove('hidden');
    $('#joinBtn').onclick = join;
    if (!timerTicker) timerTicker = setInterval(updateTimerDisplay, 500);
  } catch (e) {
    $('#configError').classList.remove('hidden');
    $('#studentStatus').textContent = '연결 실패';
    $('#studentStatus').classList.add('error');
  }
})();
