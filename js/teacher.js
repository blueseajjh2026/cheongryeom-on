const C = CHEONGRYEOM_CONTENT;
const DB = CheongDB;
const $ = s => document.querySelector(s);

let code = null;
let control = { stage: 'waiting', index: 0, phase: 'pre', reveal: false };
let participants = {};
let presence = {};
let answers = {};
let pledges = {};
let unsubs = [];

const toast = t => {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 1800);
};

const stages = C.stages;
const stageIdx = k => stages.findIndex(s => s.key === k);

const items = k =>
  k === 'written' ? C.written :
  k === 'practical' ? C.practical : [];

const item = () => items(control.stage)[Number(control.index || 0)] || null;

const stageCharacter = {
  waiting: 'character-greeting.png',
  intro: 'character-explain.png',
  written: 'character-warning.png',
  practical: 'character-tablet.png',
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
  let answered=0; const total=C.written.length+C.practical.length+1;
  C.written.forEach(q=>{if(answers?.written?.[q.id]?.[uid])answered++;});
  C.practical.forEach(q=>{if(answers?.practical?.[q.id]?.[uid])answered++;});
  if(answers?.team?.role?.[uid])answered++;
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
            ${p.schoolLevel === 'high' ? '고등학생' : '중학생'} · ${p.teamLabel?`${p.teamLabel} · ${p.teamRoleName} · `:''}
            ${atResult ? `${r.qualification} · ${r.total}점 · ${typeForUser(uid).name}` : `응답 ${rp.answered}/${rp.total}`}
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
    b.onclick = () => { const target=b.dataset.key; if(control.stage==='team'&&stageIdx(target)>stageIdx('team')&&control.teamPhase!=='scored') return toast('팀 채점·결과공개 후 다음 단계로 이동하세요.'); go(target,0); };
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

function compForUser(uid) {
  const sums=Object.fromEntries(C.virtues.map(v=>[v.key,{s:0,n:0}]));
  C.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(!a)return;Object.entries(q.impact||{}).forEach(([k,v])=>{sums[k].s+=(a.choice===q.correct?v:Math.round(v*.3));sums[k].n++;});});
  C.practical.forEach(q=>{const a=answers?.practical?.[q.id]?.[uid];if(!a)return;const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);Object.entries(ev.impact||{}).forEach(([k,v])=>{if(sums[k]){sums[k].s+=Number(v||0);sums[k].n++;}});});
  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team,answers?.team?.role?.[uid]);
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
    const c = compForUser(id);
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
  const S=C.scoring; let wc=0,wa=0;
  C.written.forEach(q=>{const a=answers?.written?.[q.id]?.[uid];if(a)wa++;if(a?.choice===q.correct)wc++;});
  const w=Math.round(wc/C.written.length*100);
  let ps=0,pa=0;const practicalTaskScores=[];
  C.practical.forEach(q=>{const a=answers?.practical?.[q.id]?.[uid];const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);if(a)pa++;ps+=a?ev.score:0;practicalTaskScores.push(a?ev.score:0);});
  const p=Math.round(ps/C.practical.length);
  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team,answers?.team?.role?.[uid]);
  const part=participants?.[uid]||{}; const pub=part.teamId?control?.teamScores?.[part.teamId]:null;
  const team=pub?Math.round(Number(pub.teamScore||0)*.8+roleEv.score*.2):0;
  const pl=pledges?.[uid]?.text?100:0;
  const total=Math.round(w*S.writtenWeight/100+p*S.practicalWeight/100+team*S.teamWeight/100+pl*S.pledgeWeight/100);
  const qualification=total>=S.leaderTotal&&p>=S.leaderPractical&&team>=S.leaderTeam?'청렴 리더':'청렴 서포터';
  const missingQuestions=(C.written.length-wa)+(C.practical.length-pa)+(answers?.team?.role?.[uid]?0:1);
  return {w,p,team,roleScore:roleEv.score,teamBase:Number(pub?.teamScore||0),teamComplete:!!pub,pl,total,qualification,writtenAnswered:wa,practicalAnswered:pa,practicalTaskScores,missingQuestions};
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


function teamGroups(){
  const groups={}; Object.entries(participants||{}).forEach(([uid,p])=>{if(!p.teamId)return;(groups[p.teamId] ||= {id:p.teamId,label:p.teamLabel||p.teamId,members:[]}).members.push({uid,...p});});
  return Object.values(groups).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
}
async function assignTeams(){
  const ids=Object.keys(participants||{}).sort((a,b)=>Number(participants[a]?.joinedAt||0)-Number(participants[b]?.joinedAt||0));
  if(!ids.length)return toast('먼저 학생이 입장해야 합니다.');
  const teamCount=Math.max(1,Math.round(ids.length/4)); const base=Math.floor(ids.length/teamCount), rem=ids.length%teamCount;
  let pos=0; const roleOrder=C.team.roleOrder;
  for(let ti=0;ti<teamCount;ti++){
    const size=base+(ti<rem?1:0); const teamId=`T${ti+1}`, teamLabel=`${ti+1}팀`;
    for(let j=0;j<size;j++){
      const uid=ids[pos++]; const rk=roleOrder[Math.min(j,roleOrder.length-1)]; const role=C.team.roles[rk];
      await DB.db.ref(`rooms/${code}/participants/${uid}`).update({teamId,teamLabel,teamSize:size,teamRoleKey:rk,teamRoleName:role.name});
    }
  }
  await DB.setControl(code,{teamPhase:'briefing',teamScores:null}); toast(`${teamCount}개 팀으로 자동 편성했습니다.`);
}
function teamReportAnswer(group){const recorder=group.members.find(m=>m.teamRoleKey==='records')||group.members[0];return recorder?answers?.team?.report?.[recorder.uid]:null;}
function teamEval(group){
  const members=group.members.map(m=>({roleKey:m.teamRoleKey,answer:answers?.team?.role?.[m.uid]}));
  const report=teamReportAnswer(group); return CHEONGRYEOM_EVALUATE_TEAM_REPORT(C.team,report,members);
}
async function setTeamPhase(phase){if(!teamGroups().length)return toast('먼저 팀을 편성해주세요.');await DB.setControl(code,{teamPhase:phase});}
async function publishTeamScores(){
  const groups=teamGroups(); if(!groups.length)return toast('먼저 팀을 편성해주세요.');
  const scores={}; groups.forEach(g=>{const ev=teamEval(g);scores[g.id]={teamLabel:g.label,teamScore:ev.score,details:ev.details,impact:ev.impact,reportSubmitted:!!teamReportAnswer(g),publishedAt:Date.now()};});
  await DB.setControl(code,{teamPhase:'scored',teamScores:scores}); toast('팀 작업결과를 채점·공개했습니다.');
}
function teamTeacherHTML(){
  const groups=teamGroups(), phase=control?.teamPhase||'briefing';
  const phaseNames={briefing:'분산정보 공유',twist:'돌발상황 공개',report:'최종보고서 작성',scored:'채점·결과공개'};
  return `<span class="eyebrow">TEAM-BASED PRACTICAL · ${C.team.code}</span><h2>${C.team.title}</h2><p class="context-box">${C.team.objective}</p><div class="team-teacher-controls"><button id="assignTeamsBtn" class="btn soft">${groups.length?'팀 재편성':'① 팀 자동편성'}</button><button id="teamTwistBtn" class="btn outline" ${!groups.length?'disabled':''}>② 돌발상황 공개</button><button id="teamReportBtn" class="btn outline" ${!groups.length?'disabled':''}>③ 최종보고서 작성</button><button id="teamScoreBtn" class="btn primary" ${!groups.length?'disabled':''}>④ 팀 채점·결과공개</button></div><div class="team-phase-teacher"><b>현재 단계</b><span>${phaseNames[phase]||phase}</span></div><div class="teacher-work-grid"><div class="teacher-work-card"><b>팀 과제 구조</b><p>팀원마다 서로 다른 정보 지급 → 말로 정보 공유 → 이해관계·기준 합의 → 돌발상황 공개 → 기록담당이 공동보고서 제출</p></div><div class="teacher-work-card"><b>최종 채점</b><p>팀 수행점수 80% + 학생 개인 역할수행 20%를 합산합니다.</p></div></div><div class="rubric-teacher"><b>팀 수행 채점요소</b><div>${C.team.reportRubric.map(x=>`<span>${x}</span>`).join('')}</div></div>${groups.length?`<div class="team-group-list">${groups.map(g=>{const roles=g.members.filter(m=>answers?.team?.role?.[m.uid]).length;const report=!!teamReportAnswer(g);const pub=control?.teamScores?.[g.id];return `<article class="team-group-card"><div class="team-group-head"><b>${g.label}</b><span>${g.members.length}명</span>${pub?`<strong>${pub.teamScore}점</strong>`:''}</div><div class="team-members">${g.members.map(m=>`<span><b>${m.studentName}</b><small>${m.teamRoleName}${answers?.team?.role?.[m.uid]?' · ✓공유':''}</small></span>`).join('')}</div><div class="team-group-foot">개인정보 공유 ${roles}/${g.members.length} · 최종보고서 ${report?'제출':'미제출'}</div>${pub?`<div class="teacher-team-score">${pub.details.map(d=>`<span>${d[0]} <b>${d[1]}/${d[2]}</b></span>`).join('')}</div>`:''}</article>`;}).join('')}</div>`:`<div class="empty">학생 입장이 끝나면 ‘팀 자동편성’을 눌러주세요. 4명 안팎으로 균형 편성됩니다.</div>`}`;
}
function bindTeacherTeam(){
  const a=$('#assignTeamsBtn');if(a)a.onclick=assignTeams;
  const t=$('#teamTwistBtn');if(t)t.onclick=()=>setTeamPhase('twist');
  const r=$('#teamReportBtn');if(r)r.onclick=()=>setTeamPhase('report');
  const s=$('#teamScoreBtn');if(s)s.onclick=publishTeamScores;
}

function renderContent() {
  renderNav();

  const st = stages.find(s => s.key === control.stage);
  $('#stageKicker').textContent = st?.short || '';
  $('#stageTitle').textContent = st?.name || '';

  const q = item();
  let h = '';

  $('#revealBtn').classList.toggle('hidden', control.stage !== 'written');
  $('#revealBtn').textContent = control.reveal ? '해설 숨기기' : '해설 공개';

  if (control.stage === 'waiting') {
    h = `<span class="eyebrow">READY</span>
      <h2>학생 접속을 기다리고 있습니다.</h2>
      <p class="context-box">
        학생이 QR 또는 6자리 참여코드로 입장하면 왼쪽의 등록·접속 인원이 실시간으로 증가합니다.
        모두 입장하면 다음 단계로 진행하세요.
      </p>`;
  }

  if (control.stage === 'intro') {
    h = `<span class="eyebrow">ORIENTATION</span>
      <h2>${C.intro.title}</h2>
      <p class="context-box">${C.intro.body}</p>
      <div class="option-grid">${
        C.virtues.map(v =>
          `<div class="option-view"><b>${v.name}</b> · ${v.tag}<br><small>${v.desc}</small></div>`
        ).join('')
      }</div>`;
  }

  if (control.stage === 'written') {
    h = `<span class="eyebrow">필기 ${Number(control.index) + 1}/${C.written.length}</span>
      <h2>${q.q}</h2>
      <div class="option-grid">${
        q.options.map((x, i) =>
          `<div class="option-view"><b>${String.fromCharCode(65 + i)}.</b> ${x}</div>`
        ).join('')
      }</div>
      ${control.reveal
        ? `<div class="feedback good"><b>정답 ${String.fromCharCode(65 + q.correct)}</b><br>${q.ex}</div>`
        : ''}`;
  }

  if (control.stage === 'practical') {
    h = practicalTeacherHTML(q);
  }

  if (control.stage === 'team') { h = teamTeacherHTML(); }

  if (control.stage === 'diagnosis') {
    h = `<span class="eyebrow">DIAGNOSIS</span>
      <h2>6대 청렴역량을 함께 확인합니다.</h2>
      <p class="context-box">
        학생들의 필기·개인실기·팀 종합실기 수행을 바탕으로 정직·약속·배려·책임·절제·공정의 학급 평균을 확인합니다.
        점수는 학생의 인격을 평가하는 값이 아니라 오늘의 판단 경향을 돌아보기 위한 교육용 피드백입니다.
      </p>`;
  }

  if (control.stage === 'pledge') {
    h = `<span class="eyebrow">FINAL MISSION</span>
      <h2>학교생활에서 내가 실천할 청렴 행동 한 가지</h2>
      <p class="context-box">
        학생이 자신의 언어로 구체적인 실천약속을 작성합니다.
        미제출 시 실천 점수는 0점으로 반영됩니다.
      </p>`;
  }

  if (control.stage === 'result') {
    const rs = Object.keys(participants).map(calcStudent);
    const leader = rs.filter(r => r.qualification === '청렴 리더').length;
    const supporter = rs.filter(r => r.qualification === '청렴 서포터').length;
    const avg = rs.length
      ? Math.round(rs.reduce((a, b) => a + b.total, 0) / rs.length)
      : 0;
    const missing = rs.reduce((a, b) => a + b.missingQuestions + (!b.teamComplete ? 1 : 0) + (b.pl === 0 ? 1 : 0), 0);

    h = `<span class="eyebrow">QUALIFICATION</span>
      <h2>청렴역량 자격판정</h2>
      <p class="context-box">
        정해진 시간 안에 제출하지 못한 문항은 0점으로 반영됩니다.
        학생 화면에는 개인 결과와 디지털 자격증이 표시됩니다.
      </p>
      <div class="result-summary">
        <div class="result-tile"><b>${supporter}</b><span>청렴 서포터</span></div>
        <div class="result-tile"><b>${leader}</b><span>청렴 리더</span></div>
        <div class="result-tile"><b>${avg}</b><span>학급 평균</span></div>
      </div>
      ${typeDistributionHTML()}
      ${missing
        ? `<div class="feedback info">학급 전체 미제출 항목 ${missing}건은 각각 0점으로 반영되었습니다.</div>`
        : ''}`;
  }

  $('#teacherContent').innerHTML =
    `<div class="teacher-content-grid"><div>${h}</div>${charBox(control.stage)}</div>`;
  if (control.stage === 'practical') bindTeacherPractical();
  if (control.stage === 'team') bindTeacherTeam();
  updateTeacherTimer();

  renderStats();
  renderClassComp();
  renderRoster();

  const a = items(control.stage);

  $('#prevBtn').disabled =
    stageIdx(control.stage) === 0 && Number(control.index) === 0;

  $('#nextBtn').textContent =
    control.stage === 'result'
      ? '결과 공개 중'
      : (a.length && Number(control.index) < a.length - 1
        ? '다음 문항 →'
        : '다음 단계 →');
}

function renderStats() {
  const q = item();
  let list = [];
  let labels = [];

  if (control.stage === 'written') {
    list = ans('written', q.id);
    labels = q.options;
  } else if (control.stage === 'practical') {
    list = ans('practical', q.id);
    const submitted = list.length;
    const total = Object.keys(participants || {}).length;
    const evals = list.map(a => CHEONGRYEOM_EVALUATE_PRACTICAL(q, a));
    const avg = evals.length ? Math.round(evals.reduce((a,b)=>a+b.score,0)/evals.length) : 0;
    const high = evals.filter(x=>x.score>=80).length;
    const mid = evals.filter(x=>x.score>=60&&x.score<80).length;
    const low = evals.filter(x=>x.score<60).length;
    $('#responseChip').textContent = `${submitted}/${total}명 제출`;
    const byUid=answers?.practical?.[q.id]||{};
    const detailList=Object.entries(byUid).sort((a,b)=>String(participants[a[0]]?.studentName||'').localeCompare(String(participants[b[0]]?.studentName||''),'ko')).map(([uid,a])=>{const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,a);return `<details class="teacher-score-detail"><summary><b>${participants[uid]?.studentName||'학생'}</b><strong>${ev.score}점</strong></summary><div>${ev.details.map(d=>`<span>${d[0]} <b>${d[1]}/${d[2]}</b></span>`).join('')}</div></details>`}).join('');
    $('#statsArea').className = '';
    $('#statsArea').innerHTML = `<div class="work-live-summary"><div><span>작업물 제출</span><b>${submitted}</b><small>미제출 ${Math.max(0,total-submitted)}명</small></div><div><span>제출자 평균</span><b>${avg}</b><small>100점 기준</small></div><div><span>80점 이상</span><b>${high}</b><small>60~79 ${mid} · 60미만 ${low}</small></div></div>${detailList?`<div class="teacher-score-list"><b>학생별 작업결과 채점표</b>${detailList}</div>`:''}`;
    return;
  } else if (control.stage === 'team') {
    const groups=teamGroups(); const roleSubmitted=Object.keys(answers?.team?.role||{}).length; const reports=Object.keys(answers?.team?.report||{}).length;
    const published=control?.teamScores||{}; const vals=Object.values(published); const avg=vals.length?Math.round(vals.reduce((a,b)=>a+Number(b.teamScore||0),0)/vals.length):0;
    $('#responseChip').textContent=`${roleSubmitted}명 역할공유`;
    $('#statsArea').className=''; $('#statsArea').innerHTML=`<div class="work-live-summary"><div><span>개인정보 공유</span><b>${roleSubmitted}</b><small>등록 ${Object.keys(participants).length}명</small></div><div><span>팀 보고서</span><b>${reports}</b><small>${groups.length}개 팀</small></div><div><span>팀 평균</span><b>${vals.length?avg:'-'}</b><small>${vals.length?'결과 공개됨':'채점 전'}</small></div></div>`; return;
  } else if (control.stage === 'pledge') {
    const n = Object.keys(pledges || {}).length;
    $('#responseChip').textContent = `${n}명 제출`;
    $('#statsArea').innerHTML =
      `<div class="empty">현재 ${n}명이 청렴 실천약속을 제출했습니다.</div>`;
    return;
  } else {
    $('#responseChip').textContent = '집계 대기';
    $('#statsArea').innerHTML =
      '<div class="empty">이 단계에서는 문항 응답을 집계하지 않습니다.</div>';
    return;
  }

  $('#responseChip').textContent = `${list.length}명 응답`;
  $('#statsArea').className = '';
  $('#statsArea').innerHTML = bars(labels, list);
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
    '수험ID', '학생이름', '학교급',
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

    $('#serverStatus').textContent = '실시간 서버 연결 · v6.0 팀종합실기';
    $('#serverStatus').classList.add('online');
    $('#roomSetup').classList.remove('hidden');
    setInterval(updateTeacherTimer, 500);

    $('#createRoomBtn').onclick = create;
    $('#nextBtn').onclick = next;
    $('#prevBtn').onclick = prev;

    $('#revealBtn').onclick = () =>
      DB.setControl(code, { reveal: !control.reveal });

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
