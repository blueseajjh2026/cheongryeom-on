const C = CHEONGRYEOM_CONTENT;
const DB = CheongDB;
const $ = s => document.querySelector(s);

let code = null;
let control = { stage: 'waiting', index: 0, phase: 'pre', reveal: false };
let participants = {};
let presence = {};
let answers = {};
let pledges = {};
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
let unsubs = [];

const toast = t => {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 1800);
};

const stages = C.stages;
function trackForKey(key){return CHEONGRYEOM_TRACK(key||'business');}
function trackForUid(uid){return trackForKey(participants?.[uid]?.trackKey);}
function trackQuestion(uid,stage,index=Number(control?.index||0)){const tr=trackForUid(uid);const arr=stage==='written'?tr.written:stage==='practical'?tr.practical:[];return arr[index]||null;}
function trackTeamForGroup(group){return trackForKey(group?.trackKey||group?.members?.[0]?.trackKey).team;}
const stageIdx = k => stages.findIndex(s => s.key === k);

const items = k =>
  k === 'written' ? C.written :
  k === 'practical' ? C.practical : [];

const item = () => items(control.stage)[Number(control.index || 0)] || null;

const stageCharacter = {
  waiting: 'character-greeting.png',
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

function charBox(stage) {
  const f = stageCharacter[stage] || 'character-guide.png';
  return `<div class="teacher-char character-panel">
    <img class="official-character" src="assets/official/${f}" alt="국민권익위원회 캐릭터">
  </div>`;
}

function responseProgress(uid) {
  let answered=0; const total=C.written.length+C.practical.length+3;
  C.written.forEach(q=>{if(answers?.written?.[q.id]?.[uid])answered++;});
  C.practical.forEach(q=>{if(answers?.practical?.[q.id]?.[uid])answered++;});
  if(answers?.team?.role?.[uid])answered++;
  if(answers?.team?.mid?.[uid])answered++;
  if(answers?.team?.report?.[uid])answered++;
  return {answered,total};
}

function renderRoster() {
  const ids = Object.keys(participants || {}).sort((a, b) =>
    String(participants[a]?.studentName || '')
      .localeCompare(String(participants[b]?.studentName || ''), 'ko')
  );

  $('#roster').innerHTML = ids.length
    ? ids.map(uid => {
        const p = participants[uid] || {};
        const r = calcStudent(uid);
        const rp = responseProgress(uid);
        const atResult = control.stage === 'result';

        return `<div class="roster-item ${atResult ? 'done' : ''}">
          <b>${p.studentName || '이름 미확인'}</b>
          <span>
            ${p.trackName?`<span class="track-chip">${p.trackName}</span>`:'전공미선택'} ${p.teamLabel?`${p.teamLabel} · ${p.teamRoleName} · `:''}
            ${atResult ? `${r.documentType==='응시확인서'?'응시확인서':r.qualification} · ${r.total}점 · ${typeForUser(uid).name}` : `응답 ${rp.answered}/${rp.total}`}
          </span>
        </div>`;
      }).join('')
    : '<div class="empty" style="grid-column:1/-1;min-height:80px">아직 등록한 학생이 없습니다.</div>';
}

function studentURL() {
  const u = new URL('student.html', location.href);
  u.searchParams.set('room', code);
  return u.href;
}

function renderNav() {
  $('#stageNav').innerHTML = stages.map((s, i) =>
    `<button class="stage-btn ${s.key === control.stage ? 'active' : ''}" data-key="${s.key}">
      <span>${i + 1}</span>${s.name}
    </button>`
  ).join('');

  document.querySelectorAll('.stage-btn').forEach(b => {
    b.onclick = () => { const target=b.dataset.key; if(control.stage==='team'&&stageIdx(target)>stageIdx('team')&&control.teamPhase!=='scored') return toast('종합평가 채점·피드백 공개 후 다음 단계로 이동하세요.'); go(target,0); };
  });
}

function renderQR() {
  const q = $('#qr');
  q.innerHTML = '';

  if (window.QRCode) {
    new QRCode(q, {
      text: studentURL(),
      width: 170,
      height: 170,
      colorDark: '#063b5c',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    q.innerHTML = '<div class="helper">QR 라이브러리를 불러오지 못했습니다.<br>학생 링크 복사 버튼을 사용하세요.</div>';
  }
}

function ans(stage, key) {
  return Object.values(answers?.[stage]?.[key] || {});
}

function bars(labels, list) {
  const a = Array(labels.length).fill(0);

  list.forEach(x => {
    if (Number.isInteger(x.choice) && a[x.choice] != null) a[x.choice]++;
  });

  const n = list.length;

  return labels.map((l, i) => {
    const p = n ? Math.round(a[i] / n * 100) : 0;
    return `<div class="bar-row">
      <b class="bar-letter">${String.fromCharCode(65 + i)}</b>
      <div class="bar-track" title="${l}">
        <div class="bar-fill" style="width:${p}%"></div>
      </div>
      <span class="bar-value">${a[i]}명 · ${p}%</span>
    </div>`;
  }).join('');
}

const teacherWrittenCoaching = {
  honesty:'사실·수치·기록을 그대로 확인하고 보고하는 연습',
  promise:'시간 압박 속에서도 절차·기한·안전기준을 지키는 연습',
  care:'결정이 동료·고객·사용자·생명·환경에 미치는 영향까지 보는 연습',
  responsibility:'발견 → 보고 → 조치 → 기록까지 끝까지 완성하는 연습',
  restraint:'친분·선물·개인 편의를 직무판단에서 분리하는 연습',
  fairness:'공개된 기준을 세우고 누구에게나 동일하게 적용하는 연습'
};
function writtenCompForUser(uid){
  const sums=Object.fromEntries(C.virtues.map(v=>[v.key,{s:0,n:0}]));
  const tr=trackForUid(uid);
  tr.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(!a)return;Object.entries(q.impact||{}).forEach(([k,v])=>{if(!sums[k])return;sums[k].s+=(a.choice===q.correct?v:Math.round(v*.3));sums[k].n++;});});
  return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v.n?Math.round(v.s/v.n):0]));
}
function writtenFeedbackForUser(uid){
  const tr=trackForUid(uid), values=writtenCompForUser(uid);
  let answered=0,correct=0;tr.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(a)answered++;if(a?.choice===q.correct)correct++;});
  const ranked=C.virtues.map(v=>({...v,score:Number(values[v.key]||0)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
  return {values,answered,correct,strengths:ranked.slice(0,2),growth:ranked[ranked.length-1]};
}
function writtenClassValues(){
  const ids=Object.keys(participants||{}), out=Object.fromEntries(C.virtues.map(v=>[v.key,0]));
  ids.forEach(uid=>{const c=writtenCompForUser(uid);C.virtues.forEach(v=>out[v.key]+=c[v.key]||0);});
  C.virtues.forEach(v=>out[v.key]=ids.length?Math.round(out[v.key]/ids.length):0);return out;
}

const teacherPracticalCoaching = {
  honesty:'종합평가에서 사실·수치·기록을 다른 의견과 구분해 정확히 활용하도록 안내',
  promise:'납기·안전·보안·위생 등 반드시 지켜야 할 기준을 먼저 찾도록 안내',
  care:'다른 부서·고객·사용자에게 미치는 영향까지 함께 비교하도록 안내',
  responsibility:'문제발견 → 질문 → 새정보 반영 → 최종근거 기록까지 완성하도록 안내',
  restraint:'친분·상급자 선호·개인 편의를 공개된 직무기준과 분리하도록 안내',
  fairness:'조원 의견이 달라도 같은 기준을 적용하고 판단변경 이유를 설명하도록 안내'
};
function preTeamCompForUser(uid){
  const sums=Object.fromEntries(C.virtues.map(v=>[v.key,{s:0,n:0}])); const tr=trackForUid(uid);
  tr.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(!a)return;Object.entries(q.impact||{}).forEach(([k,v])=>{if(!sums[k])return;sums[k].s+=(a.choice===q.correct?v:Math.round(v*.3));sums[k].n++;});});
  tr.practical.forEach(q=>{const a=answers?.practical?.[q.id]?.[uid];if(!a)return;const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);Object.entries(ev.impact||{}).forEach(([k,v])=>{if(!sums[k])return;sums[k].s+=Number(v||0);sums[k].n++;});});
  return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v.n?Math.round(v.s/v.n):0]));
}
function practicalFeedbackForUser(uid){
  const tr=trackForUid(uid); const values=preTeamCompForUser(uid);
  const tasks=tr.practical.map((q,i)=>{const a=answers?.practical?.[q.id]?.[uid];const ev=a?CHEONGRYEOM_EVALUATE_PRACTICAL(q,a):{score:0,details:[]};return {index:i+1,answered:!!a,score:a?ev.score:0,details:ev.details||[]};});
  const average=Math.round(tasks.reduce((a,b)=>a+b.score,0)/Math.max(1,tr.practical.length));
  const ranked=C.virtues.map(v=>({...v,score:Number(values[v.key]||0)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
  return {tasks,average,complete:tasks.filter(x=>x.answered).length,values,strengths:ranked.slice(0,2),growth:ranked[ranked.length-1]};
}
function practicalClassValues(){
  const ids=Object.keys(participants||{}), out=Object.fromEntries(C.virtues.map(v=>[v.key,0]));
  ids.forEach(uid=>{const c=preTeamCompForUser(uid);C.virtues.forEach(v=>out[v.key]+=c[v.key]||0);});
  C.virtues.forEach(v=>out[v.key]=ids.length?Math.round(out[v.key]/ids.length):0);return out;
}
function teacherTeamHowToHTML(){
  return `<div class="teacher-team-how"><header><span>다음 평가 운영방법</span><h3>전공맞춤 직무상황 종합평가 · 무이동 디지털 직무회의</h3><p>학생은 각자 다른 직무정보를 분석해 1차 자료를 제출하고, 팀 상황판을 확인한 뒤 <b>돌발상황 전 중간판단을 한 번 확정</b>합니다. 이후 새로운 조건을 반영해 전원이 최종판단을 제출합니다.</p></header><div class="teacher-team-how-grid six"><span><b>① 랜덤 팀 편성</b>같은 전공 3~5명 중심 · 부족 역할 겸임</span><span><b>② 1차 자료·상황판</b>근거·위험도·1차추천·확인질문 자동 취합</span><span><b>③ 중간판단 제출</b>조원정보를 본 뒤 돌발상황 전 판단 확정</span><span><b>④ 돌발상황</b>새 조건을 전원에게 동시 공개</span><span><b>⑤ 전원 최종판단</b>모든 조원이 직접 최종 근거 제출</span><span><b>⑥ 채점·종합피드백</b>팀 판단 80% + 개인기여 20% · 활동 제언</span></div></div>`;
}

function compForUser(uid) {
  const sums=Object.fromEntries(C.virtues.map(v=>[v.key,{s:0,n:0}]));
  const tr=trackForUid(uid);
  tr.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(!a)return;Object.entries(q.impact||{}).forEach(([k,v])=>{sums[k].s+=(a.choice===q.correct?v:Math.round(v*.3));sums[k].n++;});});
  tr.practical.forEach(q=>{const a=answers?.practical?.[q.id]?.[uid];if(!a)return;const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);Object.entries(ev.impact||{}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});});
  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_MEMBER(tr.team,answers?.team?.role?.[uid],answers?.team?.report?.[uid]);
  Object.entries(roleEv.impact||{}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});
  const p=participants?.[uid]; const pub=p?.teamId?control?.teamScores?.[p.teamId]:null;
  Object.entries(pub?.impact||{}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});
  return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v.n?Math.round(v.s/v.n):0]));
}

function typeForUser(uid) {
  return getCheongryeomType(compForUser(uid));
}

function typeDistributionHTML() {
  const counts = {};
  Object.keys(participants || {}).forEach(uid => {
    const t = typeForUser(uid);
    counts[t.name] = (counts[t.name] || 0) + 1;
  });

  const rows = Object.entries(counts)
    .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0,6);

  if (!rows.length) return '';

  return `<div class="type-distribution">
    <b>학급 청렴유형 분포</b>
    <div class="type-distribution-grid">
      ${rows.map(([name,count]) =>
        `<span><strong>${name}</strong>${count}명</span>`
      ).join('')}
    </div>
    <small>역사 인물 연결은 학생별 결과 화면에서 확인할 수 있습니다.</small>
  </div>`;
}

function renderClassComp() {
  const ids = Object.keys(participants);
  const vals = Object.fromEntries(C.virtues.map(v => [v.key, 0]));

  ids.forEach(id => {
    const c = control.stage==='writtenFeedback' ? writtenCompForUser(id) : control.stage==='practicalFeedback' ? preTeamCompForUser(id) : compForUser(id);
    C.virtues.forEach(v => vals[v.key] += c[v.key] || 0);
  });

  $('#classComp').innerHTML = C.virtues.map(v => {
    const x = ids.length ? Math.round(vals[v.key] / ids.length) : 0;
    return `<div class="comp-row">
      <div class="comp-meta"><span>${v.name}</span><b>${x}</b></div>
      <div class="comp-track"><span style="width:${x}%"></span></div>
    </div>`;
  }).join('');
}

function calcStudent(uid) {
  const tr=trackForUid(uid), S=C.scoring; let wc=0,wa=0;
  tr.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(a)wa++;if(a?.choice===q.correct)wc++;});
  const w=Math.round(wc/tr.written.length*100); let ps=0,pa=0;const practicalTaskScores=[];
  tr.practical.forEach(q=>{const a=answers?.practical?.[q.id]?.[uid];const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);if(a)pa++;ps+=a?ev.score:0;practicalTaskScores.push(a?ev.score:0);});
  const p=Math.round(ps/tr.practical.length);const roleEv=CHEONGRYEOM_EVALUATE_TEAM_MEMBER(tr.team,answers?.team?.role?.[uid],answers?.team?.report?.[uid]);
  const part=participants?.[uid]||{};const pub=part.teamId?control?.teamScores?.[part.teamId]:null;const teamBase=Number(pub?.teamScore||0);const teamScore=pub?Math.round(teamBase*.8+roleEv.score*.2):0;const pl=pledges?.[uid]?.text?100:0;
  const total=Math.round(w*S.writtenWeight/100+p*S.practicalWeight/100+teamScore*S.teamWeight/100+pl*S.pledgeWeight/100);const {qualification,documentType}=CHEONGRYEOM_QUALIFICATION(total,S);
  const missingQuestions=(tr.written.length-wa)+(tr.practical.length-pa)+(answers?.team?.role?.[uid]?0:1)+(answers?.team?.mid?.[uid]?0:1)+(answers?.team?.report?.[uid]?0:1);
  return {uid,w,p,team:teamScore,teamBase,roleScore:roleEv.score,teamComplete:!!pub,pl,total,qualification,documentType,practicalTaskScores,missingQuestions};
}

function teacherTimerHTML(q){
  const end=Number(control?.timerEnd||0);
  const left=end-Date.now();
  const running=end&&left>0;
  const expired=end&&left<=0;
  const fmt=ms=>{const sec=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`};
  return `<div class="teacher-timer ${expired?'expired':''}"><div><span>작업시간</span><b id="teacherTimer">${end?fmt(left):Math.round(q.timeLimitSec/60)+'분'}</b><small>${running?'카운트다운 진행 중':expired?'시간 종료':'시작 전'}</small></div><div class="teacher-timer-actions"><button id="startTimerBtn" class="btn soft" ${running?'disabled':''}>${expired?'타이머 다시 시작':'타이머 시작'}</button><button id="endTimerBtn" class="btn outline" ${!end?'disabled':''}>시간 종료</button></div></div>`;
}

function practicalTeacherHTML(q){
  return `<span class="eyebrow">WORK-BASED PRACTICAL · ${q.code}</span>
    <h2>${q.title}</h2>
    <p class="context-box">${q.objective}</p>
    ${teacherTimerHTML(q)}
    <div class="teacher-work-grid">
      <div class="teacher-work-card"><b>작업상황</b><p>${q.context}</p></div>
      <div class="teacher-work-card"><b>제출물</b><ol>${(q.deliverables||q.rubric||[]).map(x=>`<li>${x}</li>`).join('')}</ol></div>
    </div>
    <div class="rubric-teacher"><b>채점요소</b><div>${q.rubric.map(x=>`<span>${x}</span>`).join('')}</div></div>
    <div class="feedback info">학생은 보기 하나를 고르는 대신 지급자료 검토 → 실제 작업 → 기록 작성 → 작업물 제출을 수행합니다. 제출은 1회만 가능합니다.</div>`;
}

async function startPracticalTimer(){
  const q=item(); if(!q||control.stage!=='practical') return;
  await DB.setControl(code,{timerEnd:Date.now()+Number(q.timeLimitSec||300)*1000});
}
async function endPracticalTimer(){
  if(control.stage!=='practical') return;
  await DB.setControl(code,{timerEnd:Date.now()-1000});
}
function bindTeacherPractical(){
  const st=$('#startTimerBtn'); if(st) st.onclick=startPracticalTimer;
  const et=$('#endTimerBtn'); if(et) et.onclick=endPracticalTimer;
}
function updateTeacherTimer(){
  const el=$('#teacherTimer'); if(!el||!control?.timerEnd)return;
  const ms=Number(control.timerEnd)-Date.now();
  const sec=Math.max(0,Math.ceil(ms/1000));
  el.textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  if(ms<=0){const wrap=el.closest('.teacher-timer');if(wrap)wrap.classList.add('expired');}
}


function roleDuty(key){
  return ({records:'규정·이해관계·기록 검증',finance:'예산·비용 타당성',purchase:'대안·거래조건 비교',operations:'현장기한·운영조건 판단',verify:'품질·안전·사적요소 검증'})[key]||'직무정보 분석';
}
function teacherRiskName(v){return ({low:'낮음',mid:'보통',high:'높음'})[v]||'-';}
function teacherVendorName(teamDef,id){if(!id)return '미선택';if(id==='HOLD')return '판단 보류';const v=teamDef?.vendors?.find(x=>x.id===id);return v?`${v.id} · ${v.name}`:id;}
function teamGroups(){
  const groups={}; Object.entries(participants||{}).forEach(([uid,p])=>{if(!p.teamId)return;(groups[p.teamId] ||= {id:p.teamId,label:p.teamLabel||p.teamId,trackKey:p.trackKey||'business',trackName:p.trackName||trackForKey(p.trackKey).name,members:[]}).members.push({uid,...p});});
  return Object.values(groups).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
}
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function preferredTeamSizes(n){
  if(n<=5)return [n]; let best=null;
  for(let k=Math.ceil(n/5);k<=Math.floor(n/3);k++){
    const base=Math.floor(n/k),rem=n%k,sizes=Array.from({length:k},(_,i)=>base+(i<rem?1:0));
    if(sizes.some(x=>x<3||x>5))continue;
    const score=sizes.reduce((a,x)=>a+Math.abs(x-4),0);
    if(!best||score<best.score||(score===best.score&&k<best.k))best={sizes,score,k};
  }
  return best?.sizes||[n];
}
async function assignTeams(){
  const entries=Object.entries(participants||{});if(!entries.length)return toast('먼저 학생이 입장해야 합니다.');
  if(Object.keys(answers?.team?.role||{}).length) return toast('개인 직무분석 제출이 시작된 뒤에는 팀을 재편성할 수 없습니다.');
  const buckets={};entries.forEach(([uid,p])=>{const k=p.trackKey||'business';(buckets[k] ||= []).push(uid);});
  const teamRosters={};let teamNo=0;
  for(const tl of C.trackList){const ids=shuffled(buckets[tl.key]||[]);if(!ids.length)continue;const sizes=preferredTeamSizes(ids.length);let pos=0;const teamDef=trackForKey(tl.key).team;
    for(let ti=0;ti<sizes.length;ti++){teamNo++;const size=sizes[ti],teamId=`${tl.key}-T${ti+1}`,teamLabel=`${tl.short} ${ti+1}팀`,members=[];
      for(let j=0;j<size;j++){const uid=ids[pos++],rk=teamDef.roleOrder[Math.min(j,teamDef.roleOrder.length-1)],role=teamDef.roles[rk],studentName=participants[uid]?.studentName||'학생';members.push({uid,studentName,trackKey:tl.key,roleKey:rk,roleName:role.name,isRecorder:rk==='records',extraRoleKeys:[]});}
      const assigned=new Set(members.map(x=>x.roleKey)); const missing=teamDef.roleOrder.filter(k=>!assigned.has(k));
      missing.forEach((rk,i)=>{if(members.length)members[i%members.length].extraRoleKeys.push(rk);});
      teamRosters[teamId]={teamId,teamLabel,trackKey:tl.key,trackName:tl.name,members};
      for(const m of members){await DB.db.ref(`rooms/${code}/participants/${m.uid}`).update({teamId,teamLabel,teamSize:size,teamRoleKey:m.roleKey,teamRoleName:m.roleName,teamExtraRoleKeys:m.extraRoleKeys});}
    }
  }
  await DB.setControl(code,{teamPhase:'briefing',teamScores:null,teamBoards:null,teamRosters});toast(`${teamNo}개 팀을 무작위 편성했습니다. 학생은 자리 이동 없이 화면으로 협업합니다.`);
}
function teamRoleAnswer(uid){return answers?.team?.role?.[uid]||null;}
function teamMidAnswer(uid){return answers?.team?.mid?.[uid]||null;}
function teamFinalAnswer(uid){return answers?.team?.report?.[uid]||null;}
function buildTeamBoards(){
  const boards={};
  teamGroups().forEach(g=>{const teamDef=trackTeamForGroup(g);boards[g.id]={teamId:g.id,teamLabel:g.label,trackKey:g.trackKey,trackName:g.trackName,updatedAt:Date.now(),members:g.members.map(m=>{const a=teamRoleAnswer(m.uid),w=a?.work||{},mid=teamMidAnswer(m.uid),mw=mid?.work||{},role=teamDef.roles?.[m.teamRoleKey];return {uid:m.uid,studentName:m.studentName,roleKey:m.teamRoleKey,roleName:m.teamRoleName,roleSubmitted:!!a,midSubmitted:!!mid,midVendor:mw.vendor||'',midReason:mw.reason||'',reportSubmitted:!!teamFinalAnswer(m.uid),coreJudgment:a&&role?role.options?.[Number(a.choice)]||'':'',riskLevel:w.riskLevel||'',preliminaryVendor:w.preliminaryVendor||'',note:w.note||'',question:w.question||'',extraRoleNames:(m.teamExtraRoleKeys||[]).map(k=>teamDef.roles?.[k]?.name).filter(Boolean)};})};});
  return boards;
}
let lastTeamBoardHash='',teamBoardSyncing=false;
async function syncTeamBoards(force=false){
  if(teamBoardSyncing||!teamGroups().length)return; const phase=control?.teamPhase||'briefing'; if(!force&&!['board','checkpoint','twist','decision'].includes(phase))return;
  const boards=buildTeamBoards();const stable=JSON.stringify(boards,(k,v)=>k==='updatedAt'?0:v);if(!force&&stable===lastTeamBoardHash)return;lastTeamBoardHash=stable;teamBoardSyncing=true;
  try{await DB.setControl(code,{teamBoards:boards});}finally{teamBoardSyncing=false;}
}
function teamMemberPackets(group){return group.members.map(m=>({uid:m.uid,roleKey:m.teamRoleKey,answer:teamRoleAnswer(m.uid)}));}
function teamReportPackets(group){return group.members.map(m=>({uid:m.uid,answer:teamFinalAnswer(m.uid)}));}
function teamEval(group){const teamDef=trackTeamForGroup(group);return CHEONGRYEOM_EVALUATE_TEAM_REPORT(teamDef,teamReportPackets(group),teamMemberPackets(group));}
function teamAllMembers(){return teamGroups().flatMap(g=>g.members);}
async function setTeamPhase(phase){
  if(!teamGroups().length)return toast('먼저 팀을 편성해주세요.');
  const members=teamAllMembers();
  if(phase==='board'&&Object.keys(answers?.team?.role||{}).length===0)return toast('아직 제출된 개인 직무분석이 없습니다.');
  if(phase==='checkpoint'){
    const roleDone=members.filter(m=>teamRoleAnswer(m.uid)).length;
    if(roleDone<members.length)return toast(`개인 직무분석을 ${members.length-roleDone}명이 더 제출해야 합니다.`);
  }
  if(phase==='twist'){
    const midDone=members.filter(m=>teamMidAnswer(m.uid)).length;
    if(midDone<members.length)return toast(`돌발상황 공개 전 중간판단을 ${members.length-midDone}명이 더 제출해야 합니다.`);
  }
  if(phase==='decision'&&control?.teamPhase!=='twist'&&control?.teamPhase!=='decision')return toast('먼저 돌발상황을 공개해주세요.');
  const update={teamPhase:phase}; if(['board','checkpoint','twist','decision'].includes(phase))update.teamBoards=buildTeamBoards(); await DB.setControl(code,update);
}
async function publishTeamScores(){
  const groups=teamGroups(); if(!groups.length)return toast('먼저 팀을 편성해주세요.');
  const members=teamAllMembers(),finalDone=members.filter(m=>teamFinalAnswer(m.uid)).length;
  if(finalDone<members.length)return toast(`최종판단을 ${members.length-finalDone}명이 더 제출해야 결과를 공개할 수 있습니다.`);
  const scores={};groups.forEach(g=>{const ev=teamEval(g);scores[g.id]={teamLabel:g.label,trackKey:g.trackKey,trackName:g.trackName,teamScore:ev.score,details:ev.details,impact:ev.impact,consensus:ev.consensus||{},submitted:ev.submitted||0,memberCount:g.members.length,publishedAt:Date.now()};});
  await DB.setControl(code,{teamPhase:'scored',teamScores:scores,teamBoards:buildTeamBoards()});toast('최종판단을 종합해 채점 결과와 활동 피드백을 공개했습니다.');
}
function teacherTeamFeedbackHTML(pub){
  if(!pub)return '';
  const details=(pub.details||[]).filter(x=>Number(x[2]||0)>0).map(x=>({label:x[0],got:Number(x[1]||0),max:Number(x[2]||0),ratio:Number(x[1]||0)/Number(x[2]||1)})).sort((a,b)=>b.ratio-a.ratio);
  const best=details[0],growth=details[details.length-1];
  return `<div class="teacher-team-feedback"><b>활동 종합 피드백</b><div><span><strong>강점</strong>${escapeHTML(best?.label||'직무정보 분석·공유')} · ${best?.got||0}/${best?.max||0}</span><span><strong>보완</strong>${escapeHTML(growth?.label||'교차검증')} · ${growth?.got||0}/${growth?.max||0}</span></div><p><b>제언</b> 처음의 결론을 지키는 것 자체보다, 조원의 직무정보와 새로운 사실을 확인한 뒤 판단을 바꾸거나 유지한 이유를 설명하고 기록하는 과정이 중요합니다.</p></div>`;
}
function teamTeacherHTML(){
 const groups=teamGroups(),phase=control?.teamPhase||'briefing';
 const phaseNames={briefing:'① 개인 직무분석·1차 자료 제출',board:'② 디지털 팀 상황판',checkpoint:'③ 중간판단 제출',twist:'④ 돌발상황 공개',decision:'⑤ 전원 최종판단',scored:'⑥ 채점·종합피드백'};
 const phaseStep={briefing:1,board:2,checkpoint:3,twist:4,decision:5,scored:6}[phase]||0;
 const stepBtn=(n,id,label,kind='outline',disabled=false)=>{const completed=(groups.length&&n<phaseStep)||(phase==='scored'&&n===6);const current=groups.length&&n===phaseStep;return `<button id="${id}" class="btn ${kind} team-step-btn ${completed?'completed':''} ${current?'current':''}" ${disabled?'disabled':''}>${completed?'✓ ':''}${n}. ${label}</button>`;};
 return `<span class="eyebrow">5-TRACK VOCATIONAL DIGITAL COMMITTEE</span><h2>전공맞춤 직무상황 종합평가</h2><p class="context-box"><b>무이동 디지털 직무회의 방식</b>입니다. 같은 전공 학생을 무작위로 3~5명 중심으로 편성하고, 학생은 각자의 직무자료를 분석한 뒤 팀 상황판을 확인합니다. <b>돌발상황 공개 전 ‘중간판단’을 한 번 제출</b>하여 1차 판단 → 교차검증 → 중간판단 → 돌발상황 → 최종판단의 변화과정을 분명하게 구분합니다.</p><div class="team-teacher-controls six-step">${stepBtn(1,'assignTeamsBtn','랜덤 팀 편성','soft',false)}${stepBtn(2,'teamBoardBtn','팀 상황판 공개','outline',!groups.length)}${stepBtn(3,'teamCheckpointBtn','중간판단 제출','outline',!groups.length)}${stepBtn(4,'teamTwistBtn','돌발상황 공개','outline',!groups.length)}${stepBtn(5,'teamDecisionBtn','전원 최종판단','outline',!groups.length)}${stepBtn(6,'teamScoreBtn','채점·종합피드백','outline',!groups.length)}</div><div class="team-phase-teacher prominent"><b>현재 진행단계</b><span>${groups.length?(phaseNames[phase]||phase):'팀 편성 전'}</span><small>${groups.length?'색이 표시된 버튼이 현재 단계이며 ✓ 표시는 완료 단계입니다. 돌발상황은 전원 중간판단 제출 후 공개됩니다.':'① 랜덤 팀 편성부터 시작하세요.'}</small></div>${groups.length?`<div class="team-group-list">${groups.map(g=>{const teamDef=trackTeamForGroup(g),roleDone=g.members.filter(m=>teamRoleAnswer(m.uid)).length,midDone=g.members.filter(m=>teamMidAnswer(m.uid)).length,finalDone=g.members.filter(m=>teamFinalAnswer(m.uid)).length,pub=control?.teamScores?.[g.id],dist={};g.members.forEach(m=>{const v=teamFinalAnswer(m.uid)?.work?.vendor;if(v)dist[v]=(dist[v]||0)+1;});return `<article class="team-group-card"><div class="team-group-head"><div><span class="team-track-title">${escapeHTML(g.trackName)}</span><b>${escapeHTML(g.label)}</b></div><span>${g.members.length}명</span>${pub?`<strong>${pub.teamScore}점</strong>`:''}</div><p class="context-box" style="margin:8px 0">${escapeHTML(teamDef.title)}<br><small>${escapeHTML(teamDef.context)}</small></p><div class="team-members detailed">${g.members.map(m=>{const ra=teamRoleAnswer(m.uid),w=ra?.work||{},mid=teamMidAnswer(m.uid),mw=mid?.work||{};return `<span><b>${escapeHTML(m.studentName)}</b><small>${escapeHTML(m.teamRoleName)} · ${escapeHTML(roleDuty(m.teamRoleKey))}</small>${m.teamExtraRoleKeys?.length?`<em>겸임 ${m.teamExtraRoleKeys.map(k=>teamDef.roles?.[k]?.name).filter(Boolean).map(escapeHTML).join(' · ')}</em>`:''}<i>${ra?`✓ 1차 ${escapeHTML(w.preliminaryVendor||'보류')}`:'1차 대기'}${mid?` · ✓ 중간 ${escapeHTML(mw.vendor||'보류')}`:''}${teamFinalAnswer(m.uid)?' · ✓ 최종':''}</i></span>`}).join('')}</div><div class="team-group-foot">1차 자료 <b>${roleDone}/${g.members.length}</b> · 중간판단 <b>${midDone}/${g.members.length}</b> · 최종판단 <b>${finalDone}/${g.members.length}</b></div><div class="teacher-live-board"><b>팀 직무분석 상세 상황판</b>${g.members.map(m=>{const ra=teamRoleAnswer(m.uid),w=ra?.work||{},mid=teamMidAnswer(m.uid),mw=mid?.work||{},role=teamDef.roles?.[m.teamRoleKey];if(!ra)return `<div class="teacher-live-member waiting"><header><b>${escapeHTML(m.studentName)}</b><span>${escapeHTML(m.teamRoleName)}</span></header><p>개인 직무분석 제출 대기 중</p></div>`;const core=role?.options?.[Number(ra.choice)]||'';return `<div class="teacher-live-member"><header><div><b>${escapeHTML(m.studentName)}</b><span>${escapeHTML(m.teamRoleName)} · ${escapeHTML(roleDuty(m.teamRoleKey))}</span></div><em>위험도 ${escapeHTML(teacherRiskName(w.riskLevel))} · 1차 ${escapeHTML(teacherVendorName(teamDef,w.preliminaryVendor))}</em></header><p><b>핵심판단</b>${escapeHTML(core)}</p><p><b>근거</b>${escapeHTML(w.note||'')}</p><p class="teacher-question"><b>확인질문</b>${escapeHTML(w.question||'')}</p>${mid?`<p class="teacher-mid"><b>중간판단</b>${escapeHTML(teacherVendorName(teamDef,mw.vendor))} · ${escapeHTML(mw.reason||'')}</p>`:''}</div>`}).join('')}</div>${Object.keys(dist).length?`<div class="teacher-consensus"><b>현재 최종의견</b>${Object.entries(dist).map(([k,v])=>`<span>${escapeHTML(k)}안 ${v}명</span>`).join('')}</div>`:''}${pub?`<div class="teacher-team-score">${pub.details.map(d=>`<span>${escapeHTML(d[0])} <b>${d[1]}/${d[2]}</b></span>`).join('')}</div>${teacherTeamFeedbackHTML(pub)}`:''}</article>`}).join('')}</div>`:`<div class="empty">학생이 전공분야를 선택해 입장한 뒤 ‘랜덤 팀 편성’을 눌러주세요.</div>`}`;
}
function bindTeacherTeam(){
  const a=$('#assignTeamsBtn');if(a)a.onclick=assignTeams;
  const b=$('#teamBoardBtn');if(b)b.onclick=()=>setTeamPhase('board');
  const c=$('#teamCheckpointBtn');if(c)c.onclick=()=>setTeamPhase('checkpoint');
  const t=$('#teamTwistBtn');if(t)t.onclick=()=>setTeamPhase('twist');
  const d=$('#teamDecisionBtn');if(d)d.onclick=()=>setTeamPhase('decision');
  const s=$('#teamScoreBtn');if(s)s.onclick=publishTeamScores;
}

function renderContent() {
  renderNav();

  const st = stages.find(s => s.key === control.stage);
  $('#stageKicker').textContent = st?.short || '';
  $('#stageTitle').textContent = st?.name || '';

  let h = '';
  const idx = Number(control.index || 0);
  const revealBtn=$('#revealBtn');
  if(revealBtn) revealBtn.classList.add('hidden');

  if (control.stage === 'waiting') {
    h = `<span class="eyebrow">READY</span>
      <h2>학생 접속을 기다리고 있습니다.</h2>
      <p class="context-box">
        학생은 수험등록에서 자신의 전공분야를 먼저 선택합니다. 같은 수업방 안에서도
        <b>산업기술·제조 / 디지털·콘텐츠 / 경영·금융·공공 / 관광·생활서비스 / 농생명·식품·해양</b>에 따라
        필기·실기·종합평가가 자동으로 다르게 출제됩니다.
      </p>`;
  }

  if (control.stage === 'intro') {
    h = `<span class="eyebrow">5-TRACK ORIENTATION</span>
      <h2>전공에 따라 다른 직업윤리 상황으로 시작합니다.</h2>
      <p class="context-box">학생 화면에는 자신이 선택한 전공분야의 오리엔테이션만 표시됩니다. 청렴 6대 역량은 공통으로 유지합니다.</p>
      <div class="teacher-track-overview">${C.trackList.map(tl=>{const tr=trackForKey(tl.key);return `<article class="teacher-track-card"><b>${tl.icon} ${tl.name}</b><span>${tl.departments}</span><p>${tr.intro.title}</p></article>`}).join('')}</div>`;
  }

  if (control.stage === 'written') {
    h = `<span class="eyebrow">전공맞춤 필기 ${idx + 1}/${C.written.length}</span>
      <h2>같은 시간, 전공별로 서로 다른 직업윤리 문항이 출제됩니다.</h2>
      <p class="context-box"><b>문항별 즉시 피드백 방식</b>입니다. 학생은 답안을 제출하는 순간 답안이 잠기고, 자신의 화면 아래에 해당 문항의 핵심 청렴역량과 해설이 자동 표시됩니다. 교사가 별도로 해설 버튼을 누를 필요 없이, 모든 학생이 자기 판단 직후 피드백을 확인한 다음 다음 문항으로 이동합니다.</p>
      <div class="teacher-auto-feedback-note"><span>자동 피드백</span><b>답안 제출 → 즉시 해설 → 다음 문항</b><small>제출 전 학생에게는 해설이 보이지 않으며, 제출한 답안은 변경되지 않습니다.</small></div>
      <div class="teacher-track-question-grid">${C.trackList.map(tl=>{const q=trackForKey(tl.key).written[idx];return `<article class="teacher-track-question"><div><span>${tl.icon}</span><b>${tl.short}</b></div><p>${q.q}</p><small><strong>권장 판단 ${String.fromCharCode(65+q.correct)}</strong> · ${q.ex}</small></article>`}).join('')}</div>`;
  }

  if (control.stage === 'writtenFeedback') {
    const cv=writtenClassValues();
    const ranked=C.virtues.map(v=>({...v,score:cv[v.key]||0})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
    const complete=Object.keys(participants||{}).filter(uid=>writtenFeedbackForUser(uid).answered===trackForUid(uid).written.length).length;
    h = `<span class="eyebrow">WRITTEN RESULT · TRANSITION FEEDBACK</span>
      <h2>필기 종료 · 실기 전환 피드백</h2>
      <p class="context-box"><b>문항별 즉시 피드백을 거친 뒤의 1차 종합피드백 단계</b>입니다. 학생 화면에는 필기에서 확인된 6대 청렴역량 수치, 강점 2개, 실기에서 더 연습할 역량 1개가 표시됩니다. 다음 단계부터는 보기 선택이 아니라 <b>지급자료 확인 → 기준 설정 → 실제 처리 → 기록 제출</b> 방식으로 전환됩니다.</p>
      <div class="teacher-feedback-summary"><div><span>필기 완료</span><b>${complete}/${Object.keys(participants||{}).length}명</b></div><div><span>학급 강점</span><b>${ranked[0]?.name||'-'} ${ranked[0]?.score||0}</b></div><div><span>성장 포인트</span><b>${ranked[ranked.length-1]?.name||'-'} ${ranked[ranked.length-1]?.score||0}</b></div></div>
      <div class="teacher-transition-guide"><b>다음 단계</b><strong>전공맞춤 작업형 실기 P-01 시작</strong><span>학생들이 피드백을 확인한 뒤 ‘다음 단계 →’를 눌러주세요.</span></div>`;
  }

  if (control.stage === 'practical') {
    const q0=trackForKey('business').practical[idx];
    h = `<span class="eyebrow">5-TRACK WORK-BASED PRACTICAL · P-0${idx+1}</span>
      <h2>전공맞춤 작업형 실기 ${idx+1}/${C.practical.length}</h2>
      <p class="context-box">모든 학생은 같은 작업원리(자료검토 → 기준설정 → 실제처리 → 기록)를 적용하되, 지급자료와 직무상황은 자신의 전공분야에 맞게 달라집니다. <b>각 과제를 제출하면 작업결과 채점표와 핵심 직무해설이 즉시 제공</b>되어, 앞 과제에서 배운 원리를 다음 과제에 적용하도록 구성했습니다.</p>
      ${teacherTimerHTML(q0)}
      <div class="teacher-track-practical-grid">${C.trackList.map(tl=>{const q=trackForKey(tl.key).practical[idx];return `<article class="teacher-track-practical"><div><span>${tl.icon}</span><b>${tl.short}</b></div><h3>${q.title}</h3><p>${q.context}</p><small>${q.rubric.join(' · ')}</small></article>`}).join('')}</div>`;
  }

  if (control.stage === 'practicalFeedback') {
    const ids=Object.keys(participants||{}), rows=ids.map(uid=>({uid,f:practicalFeedbackForUser(uid)}));
    const complete=rows.filter(x=>x.f.complete===trackForUid(x.uid).practical.length).length;
    const avg=rows.length?Math.round(rows.reduce((a,b)=>a+b.f.average,0)/rows.length):0;
    const cv=practicalClassValues(), ranked=C.virtues.map(v=>({...v,score:cv[v.key]||0})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
    h = `<span class="eyebrow">PRACTICAL RESULT · TEAM TRANSITION</span>
      <h2>개인 작업형 실기 종료 · 종합평가 전환 피드백</h2>
      <p class="context-box"><b>두 번째 주의환기 단계</b>입니다. 학생 화면에는 P-01~P-03 점수, 필기+개인실기까지 반영한 6대 청렴역량, 잘한 점과 다음 종합평가에서 더 연습할 점이 표시됩니다.</p>
      <div class="teacher-feedback-summary"><div><span>실기 3과제 완료</span><b>${complete}/${ids.length}명</b></div><div><span>학급 실기평균</span><b>${avg}점</b></div><div><span>종합평가 성장 포인트</span><b>${ranked[ranked.length-1]?.name||'-'} ${ranked[ranked.length-1]?.score||0}</b></div></div>
      ${teacherTeamHowToHTML()}
      <div class="teacher-transition-guide"><b>다음 단계</b><strong>전공맞춤 직무상황 종합평가 시작</strong><span>학생들이 피드백과 진행방법을 확인한 뒤 ‘다음 단계 →’를 눌러주세요.</span></div>`;
  }

  if (control.stage === 'team') {
    h = `${teacherTeamHowToHTML()}${teamTeacherHTML()}`;
  }

  if (control.stage === 'diagnosis') {
    h = `<span class="eyebrow">DIAGNOSIS</span>
      <h2>전공은 달라도 청렴역량은 하나의 기준으로 진단합니다.</h2>
      <p class="context-box">각 전공의 필기·작업형 실기·직무상황 종합평가 결과를 정직·약속·배려·책임·절제·공정의 6대 청렴역량으로 환산합니다. 점수는 인격평가가 아니라 오늘의 직업윤리 판단 경향을 돌아보기 위한 교육용 피드백입니다.</p>`;
  }

  if (control.stage === 'pledge') {
    h = `<span class="eyebrow">FINAL MISSION</span>
      <h2>나의 미래 직업현장에서 지킬 직업윤리 행동 한 가지</h2>
      <p class="context-box">학생이 자신의 전공과 미래 직업을 떠올리며 구체적인 실천약속을 직접 작성합니다. 10글자 이상 제출해야 실천 점수가 반영됩니다.</p>`;
  }

  if (control.stage === 'result') {
    const rs = Object.keys(participants).map(calcStudent);
    const leader = rs.filter(r => r.qualification === '청렴 리더').length;
    const supporter = rs.filter(r => r.qualification === '청렴 서포터').length;
    const confirmation = rs.filter(r => r.documentType === '응시확인서').length;
    const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b.total, 0) / rs.length) : 0;
    const missing = rs.reduce((a, b) => a + b.missingQuestions + (!b.teamComplete ? 1 : 0) + (b.pl === 0 ? 1 : 0), 0);
    h = `<span class="eyebrow">QUALIFICATION</span>
      <h2>예비 직업인 청렴역량 자격판정</h2>
      <p class="context-box">학생이 선택한 전공분야별 직무상황 수행결과를 공통 청렴역량으로 종합합니다. 학생 화면에는 전공분야, 개인 결과, 청렴유형과 교육용 디지털 자격이 표시됩니다.</p>
      <div class="result-summary four">
        <div class="result-tile"><b>${leader}</b><span>청렴 리더 · 80점 이상</span></div>
        <div class="result-tile"><b>${supporter}</b><span>청렴 서포터 · 60~79점</span></div>
        <div class="result-tile"><b>${confirmation}</b><span>응시확인서 · 60점 미만</span></div>
        <div class="result-tile"><b>${avg}</b><span>학급 평균</span></div>
      </div>
      ${typeDistributionHTML()}
      ${missing ? `<div class="feedback info">학급 전체 미제출 항목 ${missing}건은 각각 0점으로 반영되었습니다.</div>` : ''}`;
  }

  $('#teacherContent').innerHTML = `<div class="teacher-content-grid"><div>${h}</div>${charBox(control.stage)}</div>`;
  if (control.stage === 'practical') bindTeacherPractical();
  if (control.stage === 'team') bindTeacherTeam();
  updateTeacherTimer();

  renderStats();
  renderClassComp();
  renderRoster();

  const a = items(control.stage);
  $('#prevBtn').disabled = stageIdx(control.stage) === 0 && idx === 0;
  $('#nextBtn').textContent = control.stage === 'result'
    ? '결과 공개 중'
    : (a.length && idx < a.length - 1 ? '다음 문항 →' : '다음 단계 →');
}

function renderStats() {
  const idx = Number(control.index || 0);
  const ids = Object.keys(participants || {});

  if (control.stage === 'written') {
    let answered=0, correct=0; const byTrack={};
    ids.forEach(uid=>{
      const tr=trackForUid(uid), q=tr.written[idx], a=answers?.written?.[q.id]?.[uid];
      const k=participants[uid]?.trackKey||'business'; byTrack[k] ||= {n:0,a:0,c:0}; byTrack[k].n++;
      if(a){answered++;byTrack[k].a++;if(a.choice===q.correct){correct++;byTrack[k].c++;}}
    });
    $('#responseChip').textContent=`${answered}/${ids.length}명 응답`;
    $('#statsArea').className='';
    $('#statsArea').innerHTML=`<div class="work-live-summary"><div><span>응답</span><b>${answered}</b><small>미응답 ${Math.max(0,ids.length-answered)}명</small></div><div><span>정답</span><b>${correct}</b><small>응답자 기준 ${answered?Math.round(correct/answered*100):0}%</small></div><div><span>전공분야</span><b>${Object.keys(byTrack).length}</b><small>맞춤문항 동시 진행</small></div></div><div class="track-stats">${C.trackList.map(tl=>{const x=byTrack[tl.key]||{n:0,a:0,c:0};return `<div><b>${tl.icon} ${tl.short}</b><span>${x.a}/${x.n} 응답 · 정답 ${x.c}</span></div>`}).join('')}</div>`;
    return;
  }

  if (control.stage === 'writtenFeedback') {
    const rows=ids.map(uid=>({uid,f:writtenFeedbackForUser(uid)}));
    const complete=rows.filter(x=>x.f.answered===trackForUid(x.uid).written.length).length;
    $('#responseChip').textContent=`${complete}/${ids.length}명 필기 완료`;
    $('#statsArea').className='';
    $('#statsArea').innerHTML=rows.length?`<div class="teacher-written-feedback-list">${rows.sort((a,b)=>String(participants[a.uid]?.studentName||'').localeCompare(String(participants[b.uid]?.studentName||''),'ko')).map(({uid,f})=>{const p=participants?.[uid]||{},g=f.growth;return `<article class="teacher-written-feedback-card"><header><div><b>${escapeHTML(p.studentName||'학생')}</b><span class="track-chip">${escapeHTML(p.trackName||'')}</span></div><strong>${f.correct}/${trackForUid(uid).written.length} 정답</strong></header><div class="teacher-mini-virtues">${C.virtues.map(v=>`<span><i>${v.name}</i><b>${f.values[v.key]||0}</b></span>`).join('')}</div><p class="feedback-strength"><b>잘하고 있어요</b> ${f.strengths.map(x=>`${x.name} ${x.score}`).join(' · ')}</p><p class="feedback-growth"><b>실기 성장 포인트</b> ${g?.name||'-'} ${g?.score||0} · ${escapeHTML(teacherWrittenCoaching[g?.key]||'판단근거를 구체적으로 기록하는 연습')}</p></article>`}).join('')}</div>`:'<div class="empty">등록한 학생이 없습니다.</div>';
    return;
  }

  if (control.stage === 'practicalFeedback') {
    const rows=ids.map(uid=>({uid,f:practicalFeedbackForUser(uid)}));
    const complete=rows.filter(x=>x.f.complete===trackForUid(x.uid).practical.length).length;
    $('#responseChip').textContent=`${complete}/${ids.length}명 실기 완료`;
    $('#statsArea').className='';
    $('#statsArea').innerHTML=rows.length?`<div class="teacher-written-feedback-list practical-feedback-list">${rows.sort((a,b)=>String(participants[a.uid]?.studentName||'').localeCompare(String(participants[b.uid]?.studentName||''),'ko')).map(({uid,f})=>{const p=participants?.[uid]||{},g=f.growth;return `<article class="teacher-written-feedback-card practical-student-feedback"><header><div><b>${escapeHTML(p.studentName||'학생')}</b><span class="track-chip">${escapeHTML(p.trackName||'')}</span></div><strong>실기 평균 ${f.average}점</strong></header><div class="teacher-practical-task-mini">${f.tasks.map(x=>`<span><i>P-0${x.index}</i><b>${x.score}</b><small>${x.answered?'제출':'미제출'}</small></span>`).join('')}</div><div class="teacher-mini-virtues">${C.virtues.map(v=>`<span><i>${v.name}</i><b>${f.values[v.key]||0}</b></span>`).join('')}</div><p class="feedback-strength"><b>잘하고 있어요</b> ${f.strengths.map(x=>`${x.name} ${x.score}`).join(' · ')}</p><p class="feedback-growth"><b>종합평가 포인트</b> ${g?.name||'-'} ${g?.score||0} · ${escapeHTML(teacherPracticalCoaching[g?.key]||'다른 직무정보를 활용해 최종근거를 설명하도록 안내')}</p></article>`}).join('')}</div>`:'<div class="empty">등록한 학생이 없습니다.</div>';
    return;
  }

  if (control.stage === 'practical') {
    let submitted=0; const rows=[];
    ids.forEach(uid=>{const q=trackForUid(uid).practical[idx],a=answers?.practical?.[q.id]?.[uid];if(!a)return;submitted++;rows.push({uid,q,ev:CHEONGRYEOM_EVALUATE_PRACTICAL(q,a)});});
    const avg=rows.length?Math.round(rows.reduce((a,b)=>a+b.ev.score,0)/rows.length):0;
    const high=rows.filter(x=>x.ev.score>=80).length, mid=rows.filter(x=>x.ev.score>=60&&x.ev.score<80).length, low=rows.filter(x=>x.ev.score<60).length;
    $('#responseChip').textContent=`${submitted}/${ids.length}명 제출`;
    $('#statsArea').className='';
    $('#statsArea').innerHTML=`<div class="work-live-summary"><div><span>작업물 제출</span><b>${submitted}</b><small>미제출 ${Math.max(0,ids.length-submitted)}명</small></div><div><span>제출자 평균</span><b>${avg}</b><small>100점 기준</small></div><div><span>80점 이상</span><b>${high}</b><small>60~79 ${mid} · 60미만 ${low}</small></div></div>${rows.length?`<div class="teacher-score-list"><b>학생별 전공맞춤 작업결과</b>${rows.sort((a,b)=>String(participants[a.uid]?.studentName||'').localeCompare(String(participants[b.uid]?.studentName||''),'ko')).map(x=>`<details class="teacher-score-detail"><summary><b>${participants[x.uid]?.studentName||'학생'} <span class="track-chip">${participants[x.uid]?.trackName||''}</span></b><strong>${x.ev.score}점</strong></summary><div>${x.ev.details.map(d=>`<span>${d[0]} <b>${d[1]}/${d[2]}</b></span>`).join('')}</div></details>`).join('')}</div>`:''}`;
    return;
  }

  if (control.stage === 'team') {
    const groups=teamGroups(), roleSubmitted=Object.keys(answers?.team?.role||{}).length, reports=Object.keys(answers?.team?.report||{}).length;
    const vals=Object.values(control?.teamScores||{}), avg=vals.length?Math.round(vals.reduce((a,b)=>a+Number(b.teamScore||0),0)/vals.length):0;
    $('#responseChip').textContent=`${roleSubmitted}명 역할공유`;
    $('#statsArea').className='';
    $('#statsArea').innerHTML=`<div class="work-live-summary"><div><span>역할정보 공유</span><b>${roleSubmitted}</b><small>등록 ${ids.length}명</small></div><div><span>팀 보고서</span><b>${reports}</b><small>${groups.length}개 팀</small></div><div><span>팀 평균</span><b>${vals.length?avg:'-'}</b><small>${vals.length?'결과 공개됨':'채점 전'}</small></div></div>`;
    return;
  }

  if (control.stage === 'pledge') {
    const entries=Object.entries(pledges||{}).filter(([,v])=>String(v?.text||'').trim());
    const n=entries.length; $('#responseChip').textContent=`${n}명 제출`; $('#statsArea').className='';
    $('#statsArea').innerHTML=entries.length?`<div class="pledge-live-list">${entries.map(([uid,v])=>{const p=participants?.[uid]||{};return `<article><header><b>${escapeHTML(p.studentName||'학생')}</b><span>${escapeHTML(p.trackName||trackForUid(uid)?.name||'')}</span></header><p>${escapeHTML(v.text||'')}</p></article>`}).join('')}</div>`:`<div class="empty">아직 제출된 직업윤리 실천약속이 없습니다.</div>`; return;
  }

  $('#responseChip').textContent='집계 대기';
  $('#statsArea').className='';
  $('#statsArea').innerHTML='<div class="empty">이 단계에서는 문항 응답을 집계하지 않습니다.</div>';
}

async function go(stage, index = 0) {
  await DB.setControl(code, {
    stage,
    index,
    phase: 'single',
    reveal: false,
    locked: false,
    timerEnd: null
  });
}

async function next() {
  if(control.stage==='team'&&control.teamPhase!=='scored') return toast('먼저 팀 채점·결과공개를 완료해주세요.');
  const a = items(control.stage);
  const i = Number(control.index || 0);

  if (a.length && i < a.length - 1) {
    return DB.setControl(code, {
      index: i + 1,
      reveal: false,
      phase: 'single',
      timerEnd: null
    });
  }

  const si = stageIdx(control.stage);
  if (si < stages.length - 1) {
    return go(stages[si + 1].key, 0);
  }
}

async function prev() {
  const a = items(control.stage);
  const i = Number(control.index || 0);

  if (a.length && i > 0) {
    return DB.setControl(code, {
      index: i - 1,
      reveal: false,
      phase: 'single',
      timerEnd: null
    });
  }

  const si = stageIdx(control.stage);

  if (si > 0) {
    const prevStage = stages[si - 1].key;
    const pa = items(prevStage);
    return go(prevStage, Math.max(0, pa.length - 1));
  }
}

function subscribe() {
  unsubs.forEach(f => f());

  unsubs = [
    DB.on('control', code, v => {
      control = v || control;
      if (control.stage === 'process') {
        control = { ...control, stage: 'team', index: 0, teamPhase: control.teamPhase || 'briefing' };
        DB.setControl(code, { stage: 'team', index: 0, teamPhase: control.teamPhase, reveal: false });
      }
      renderContent();
    }),
    DB.on('participants', code, v => {
      participants = v || {};
      $('#joinedCount').textContent = Object.keys(participants).length;
      renderContent();
    }),
    DB.on('presence', code, v => {
      presence = v || {};
      $('#activeCount').textContent = Object.keys(presence).length;
    }),
    DB.on('answers', code, v => {
      answers = v || {};
      renderContent();
      if(['board','checkpoint','twist','decision'].includes(control?.teamPhase)) void syncTeamBoards(false);
    }),
    DB.on('pledges', code, v => {
      pledges = v || {};
      renderContent();
    })
  ];
}

async function create() {
  let c = $('#roomCodeInput').value.trim() ||
    String(Math.floor(100000 + Math.random() * 900000));

  if (!/^\d{6}$/.test(c)) {
    return toast('6자리 숫자로 입력해주세요.');
  }

  try {
    await DB.createRoom(c, $('#roomTitleInput').value.trim());
    code = c;

    $('#roomSetup').classList.add('hidden');
    $('#dashboard').classList.remove('hidden');
    $('#roomCode').textContent = c;

    renderQR();
    subscribe();
    toast('수업방을 개설했습니다.');
  } catch (e) {
    toast(e.message || '수업방 개설 실패');
  }
}

function csv() {
  const rows = [[
    '수험ID', '학생이름', '학교급', '전공분야',
    '필기', '개인실기', '팀실기', '개인역할', '실천', '종합',
    '미응답문항수', '자격', '청렴유형', '상징역사인물',
    '상위역량1', '상위역량2', '실기1', '실기2', '실기3', '실천약속'
  ]];

  Object.entries(participants).forEach(([uid, p]) => {
    const r = calcStudent(uid);
    const t = typeForUser(uid);

    rows.push([
      uid,
      p.studentName,
      p.schoolLevel,
      p.trackName || '경영·금융·공공',
      r.w,
      r.p,
      r.team,
      r.roleScore,
      r.pl,
      r.total,
      r.missingQuestions,
      r.qualification,
      t.name,
      t.figure,
      `${t.primary.name} ${t.primary.score}`,
      `${t.secondary.name} ${t.secondary.score}`,
      r.practicalTaskScores[0] || 0,
      r.practicalTaskScores[1] || 0,
      r.practicalTaskScores[2] || 0,
      pledges?.[uid]?.text || ''
    ]);
  });

  const data =
    '\ufeff' +
    rows.map(r =>
      r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(',')
    ).join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([data], { type: 'text/csv' })
  );
  a.download = `청렴ON_${code}_결과.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

(async () => {
  if (!DB.configured) {
    $('#configError').classList.remove('hidden');
    $('#serverStatus').textContent = '설정 필요';
    $('#serverStatus').classList.add('error');
    return;
  }

  try {
    await DB.init();

    $('#serverStatus').textContent = 'v8.8.3';
    $('#serverStatus').classList.add('online');
    $('#roomSetup').classList.remove('hidden');
    setInterval(updateTeacherTimer, 500);

    $('#createRoomBtn').onclick = create;
    $('#nextBtn').onclick = next;
    $('#prevBtn').onclick = prev;

    $('#copyLink').onclick = () =>
      navigator.clipboard.writeText(studentURL())
        .then(() => toast('학생 링크를 복사했습니다.'));

    $('#exportBtn').onclick = csv;

    $('#deleteBtn').onclick = async () => {
      if (confirm('수업방과 모든 응답을 삭제할까요?')) {
        await DB.deleteRoom(code);
        location.reload();
      }
    };
  } catch (e) {
    $('#configError').classList.remove('hidden');
    $('#serverStatus').textContent = '연결 실패';
    $('#serverStatus').classList.add('error');
  }
})();
