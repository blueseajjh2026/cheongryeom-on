const C = CHEONGRYEOM_CONTENT;
const DB = CheongDB;
const $ = s => document.querySelector(s);

let code = null;
let control = null;
let myAnswers = { written: {}, practical: {}, team: {role:null, report:null} };
let myPledge = null;
let me = null;
let unsubs = [];
let submitting = false;

// 실시간 화면 갱신이 일어나도 학생이 선택한 답이 사라지지 않도록 문항별 임시선택을 보관
const pendingChoices = {};
const practicalDrafts = {};
let teamRoleDraft = {choice:null,note:''};
let teamReportDraft = {issues:[],criteria:[],conflictResponse:null,twistResponse:null,vendor:null,reason:''};
let timerTicker = null;

const stageCharacter = {
  waiting: 'character-listen.png',
  intro: 'character-explain.png',
  written: 'character-warning.png',
  practical: 'character-tablet.png',
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

function choiceHTML(opts, existing, pending) {
  return `<div class="choices">${
    opts.map((x, i) => {
      const isSelected = existing?.choice === i || (!existing && pending === i);
      return `<button class="choice ${isSelected ? 'selected' : ''}"
        data-choice="${i}" ${existing ? 'disabled' : ''}>
        <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
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
    };
  });
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

  const roleEv = CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team, myAnswers?.team?.role);
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

  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team,myAnswers?.team?.role);
  const teamPub=me?.teamId?control?.teamScores?.[me.teamId]:null;
  const teamBase=Number(teamPub?.teamScore||0);
  const teamScore=teamPub?Math.round(teamBase*0.8+roleEv.score*0.2):0;
  const teamComplete=!!teamPub;
  const pl=myPledge?.text?100:0;

  const total=Math.round(w*S.writtenWeight/100+p*S.practicalWeight/100+teamScore*S.teamWeight/100+pl*S.pledgeWeight/100);
  const qualification=total>=S.leaderTotal&&p>=S.leaderPractical&&teamScore>=S.leaderTeam?'청렴 리더':'청렴 서포터';
  const missingQuestions=(C.written.length-writtenAnswered)+(C.practical.length-practicalAnswered)+(myAnswers?.team?.role?0:1);
  return {w,p,team:teamScore,teamBase,roleScore:roleEv.score,teamComplete,pl,total,qualification,writtenAnswered,practicalAnswered,practicalTaskScores,missingQuestions};
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
  const i = Math.max(0, stageIdx(control?.stage || 'waiting'));
  const p = Math.round(i / (stages.length - 1) * 100);
  $('#studentStage').textContent = stages[i]?.name || '수험등록';
  $('#studentPct').textContent = p + '%';
  $('#studentBar').style.width = p + '%';
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
  ${ex ? `<div class="feedback good"><b>✓ 작업물 제출 완료</b><br>이 과제는 확정되었습니다. 교사의 안내에 따라 다음 과제로 이동하세요.</div>` : ''}`;
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
      <div class="mini-choice-grid">${['A','B','C','NONE'].map(v => `<button type="button" class="mini-choice ${d.conflictVendor===v?'selected':''}" data-conflict="${v}">${v==='NONE'?'없음':`업체 ${v}`}</button>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>03</span><div><b>비교기준 설정</b><small>구매 결정에 반영할 기준을 선택하세요.</small></div></div>
      <div class="criteria-grid">${q.criteria.map(c => `<label class="criteria-chip ${d.criteria.includes(c.key)?'selected':''}"><input type="checkbox" data-criteria="${c.key}" ${d.criteria.includes(c.key)?'checked':''}><span>${c.label}</span></label>`).join('')}</div>
      <div class="vendor-table"><div class="vendor-head"><span>업체</span><span>가격</span><span>품질</span><span>배송</span></div>${q.vendors.map((v,i)=>`<div class="vendor-row"><b>${v.id} · ${v.name}</b><span>${v.price}</span><span>${v.quality}</span><span>${v.delivery}</span></div>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>04</span><div><b>구매계획 작성</b><small>최종업체와 처리방식을 결정하고 근거를 남기세요.</small></div></div>
      <label class="work-label">선정업체</label><div class="mini-choice-grid">${q.vendors.map((v,i)=>`<button type="button" class="mini-choice ${d.selectedVendor!==null&&Number(d.selectedVendor)===i?'selected':''}" data-vendor="${i}">${v.id} · ${v.name}</button>`).join('')}</div>
      <label class="work-check"><input id="disclosureCheck" type="checkbox" ${d.disclosure?'checked':''}><span>이해관계가 있는 업체가 있다면 그 사실을 기록에 공개하고 동일 기준으로 검토하겠습니다.</span></label>
      <label class="work-label" for="practicalReason">선정사유 및 처리기록</label><textarea id="practicalReason" class="work-textarea" maxlength="300" placeholder="비교한 기준과 업체를 선정한 이유를 구체적으로 기록하세요.">${escapeHTML(d.reason)}</textarea>
    </section>`;
}

function renderSequence(q, d) {
  const map = Object.fromEntries(q.actions.map(a=>[a.id,a]));
  return `${practicalHeader(q, mine('practical', q.id))}
    <div class="work-context">${q.context}</div>
    <section class="work-section"><div class="work-section-title"><span>01</span><div><b>정산자료 확인</b><small>증빙 누락 항목을 확인하세요.</small></div></div>
      <div class="ledger-table">${q.ledger.map(x=>`<div class="ledger-row ${x.proof?'':'missing'}"><b>${x.item}</b><span>${x.amount}</span><span>${x.proof?'✅ 증빙 있음':'⚠️ 증빙 없음'}</span></div>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>02</span><div><b>처리절차 구성</b><small>필요하다고 판단한 카드를 실제 처리 순서대로 4개 선택하세요.</small></div></div>
      <div class="sequence-selected">${d.order.length?d.order.map((id,i)=>`<button type="button" class="sequence-slot" data-remove-action="${id}"><span>${i+1}</span>${map[id]?.text||id}<small>눌러서 제거</small></button>`).join(''):'<div class="sequence-empty">아래 처리카드를 눌러 순서를 구성하세요.</div>'}</div>
      <div class="action-bank">${q.actions.map(a=>`<button type="button" class="action-card ${d.order.includes(a.id)?'used':''}" data-action="${a.id}" ${d.order.includes(a.id)||d.order.length>=4?'disabled':''}><span>＋</span>${a.text}</button>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>03</span><div><b>정산의견 기록</b><small>증빙 누락 사실을 어떻게 처리할지 기록하세요.</small></div></div>
      <textarea id="sequenceNote" class="work-textarea" maxlength="300" placeholder="사실확인, 보고, 재발급, 실제 정산 등의 처리 근거를 적어보세요.">${escapeHTML(d.note)}</textarea>
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
  const totals = q.candidates.map(c=>({id:c.id,total:candidateTotal(q,d,c.id)})).sort((a,b)=>b.total-a.total);
  return `${practicalHeader(q, mine('practical', q.id))}
    <div class="work-context">${q.context}</div>
    <section class="work-section"><div class="work-section-title"><span>01</span><div><b>평가기준 확인</b><small>모든 지원자에게 같은 배점을 적용합니다.</small></div></div>
      <div class="rubric-strip">${q.rubricFields.map(f=>`<span><b>${f.label}</b>${f.max}점</span>`).join('')}</div>
    </section>
    <section class="work-section"><div class="work-section-title"><span>02</span><div><b>지원자료 채점</b><small>${d.revealed?'1차 채점이 확정되었습니다.':'지원자료만 보고 각 항목의 점수를 입력하세요.'}</small></div></div>
      <div class="candidate-list">${q.candidates.map(c=>`<article class="candidate-card"><div class="candidate-head"><b>${c.name}</b><strong>${candidateTotal(q,d,c.id)}점</strong></div><p>${c.profile}</p><div class="candidate-sliders">${q.rubricFields.map(f=>{const val=Number(scores?.[c.id]?.[f.key]||0);return `<label><span>${f.label}<b data-score-label="${c.id}:${f.key}">${val}</b> / ${f.max}</span><input type="range" min="0" max="${f.max}" step="1" value="${val}" data-candidate="${c.id}" data-field="${f.key}" ${d.revealed?'disabled':''}></label>`}).join('')}</div></article>`).join('')}</div>
      ${!d.revealed?`<button id="revealRelationBtn" class="btn soft large full" ${panelScoresComplete(q,d)?'':'disabled'}>1차 채점 확정 → 추가정보 확인</button>`:`<div class="work-alert"><b>⚠️ 추가정보</b><span>${q.extraInfo}</span></div>`}
    </section>
    ${d.revealed?`<section class="work-section"><div class="work-section-title"><span>03</span><div><b>이해관계 상황 처리</b><small>1차 점수는 잠겼습니다. 이제 처리방식을 결정하세요.</small></div></div>
      <div class="locked-result">현재 1위 <b>지원자 ${totals[0]?.id}</b> · ${totals[0]?.total||0}점 <small>동점이면 교사의 추가 절차에 따릅니다.</small></div>
      <div class="response-list">${q.responses.map((x,i)=>`<button type="button" class="response-card ${d.response!==null&&Number(d.response)===i?'selected':''}" data-response="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div>
      <label class="work-label" for="panelReason">최종 판단근거</label><textarea id="panelReason" class="work-textarea" maxlength="300" placeholder="친분 관계와 평가기준을 어떻게 다뤘는지 근거를 적어보세요.">${escapeHTML(d.reason)}</textarea>
    </section>`:''}`;
}

function practicalReady(q,d) {
  if (q.kind==='procurement') return !!d.conflictVendor && d.criteria.length>=2 && d.selectedVendor!==null && Number.isInteger(Number(d.selectedVendor)) && String(d.reason||'').trim().length>=8;
  if (q.kind==='sequence') return d.order.length===4 && String(d.note||'').trim().length>=8;
  return d.revealed && d.response!==null && Number.isInteger(Number(d.response)) && String(d.reason||'').trim().length>=8;
}

function renderPractical(q, ex) {
  if (ex) {
    const ev=CHEONGRYEOM_EVALUATE_PRACTICAL(q,ex);
    return `${practicalHeader(q, ex)}${practicalScorecardHTML(q,ex)}`;
  }
  const d=practicalDraft(q);
  const body=q.kind==='procurement'?renderProcurement(q,d):q.kind==='sequence'?renderSequence(q,d):renderPanel(q,d);
  const ready=practicalReady(q,d) && !practicalExpired();
  return `${body}<div class="work-submit-sticky"><div><b>작업물 제출</b><small>${practicalExpired()?'시간이 종료되어 제출할 수 없습니다.':ready?'필수 작업이 완료되었습니다. 제출 후 수정할 수 없습니다.':'필수 작업을 모두 완성하면 제출할 수 있습니다.'}</small></div><button id="submitPracticalBtn" class="btn primary large" ${ready?'':'disabled'}>${practicalExpired()?'작업시간 종료':'작업물 최종 제출'}</button></div>`;
}

function bindPractical(q, ex) {
  if (ex) return;
  const d=practicalDraft(q);
  document.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{const id=b.dataset.doc;if(!d.openedDocs.includes(id))d.openedDocs.push(id);d.activeDoc=id;render();});
  document.querySelectorAll('[data-conflict]').forEach(b=>b.onclick=()=>{d.conflictVendor=b.dataset.conflict;render();});
  document.querySelectorAll('[data-criteria]').forEach(x=>x.onchange=()=>{const k=x.dataset.criteria;d.criteria=x.checked?[...new Set([...d.criteria,k])]:d.criteria.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-vendor]').forEach(b=>b.onclick=()=>{d.selectedVendor=Number(b.dataset.vendor);render();});
  const dc=$('#disclosureCheck'); if(dc) dc.onchange=()=>{d.disclosure=dc.checked;};
  const pr=$('#practicalReason'); if(pr) pr.oninput=()=>{d.reason=pr.value;const btn=$('#submitPracticalBtn');if(btn)btn.disabled=!practicalReady(q,d)||practicalExpired();};
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(d.order.length<4&&!d.order.includes(b.dataset.action)){d.order.push(b.dataset.action);render();}});
  document.querySelectorAll('[data-remove-action]').forEach(b=>b.onclick=()=>{d.order=d.order.filter(x=>x!==b.dataset.removeAction);render();});
  const sn=$('#sequenceNote'); if(sn) sn.oninput=()=>{d.note=sn.value;const btn=$('#submitPracticalBtn');if(btn)btn.disabled=!practicalReady(q,d)||practicalExpired();};
  document.querySelectorAll('[data-candidate]').forEach(x=>x.oninput=()=>{const cid=x.dataset.candidate,f=x.dataset.field;d.scores[cid][f]=Number(x.value);const l=document.querySelector(`[data-score-label="${cid}:${f}"]`);if(l)l.textContent=x.value;const card=x.closest('.candidate-card');if(card){const t=card.querySelector('.candidate-head strong');if(t)t.textContent=candidateTotal(q,d,cid)+'점';}const rb=$('#revealRelationBtn');if(rb)rb.disabled=!panelScoresComplete(q,d);});
  const rr=$('#revealRelationBtn'); if(rr) rr.onclick=()=>{if(!panelScoresComplete(q,d))return;d.lockedScores=JSON.parse(JSON.stringify(d.scores));d.revealed=true;render();};
  document.querySelectorAll('[data-response]').forEach(b=>b.onclick=()=>{d.response=Number(b.dataset.response);render();});
  const pa=$('#panelReason'); if(pa) pa.oninput=()=>{d.reason=pa.value;const btn=$('#submitPracticalBtn');if(btn)btn.disabled=!practicalReady(q,d)||practicalExpired();};
  const sb=$('#submitPracticalBtn'); if(sb) sb.onclick=()=>submitPractical(q);
}

async function submitPractical(q) {
  if (submitting || practicalExpired()) return;
  const d=practicalDraft(q);
  if(!practicalReady(q,d)) return toast('필수 작업을 모두 완성해주세요.');
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


function teamRoleConfig(){ return C.team.roles?.[me?.teamRoleKey] || null; }
function teamPublished(){ return me?.teamId ? control?.teamScores?.[me.teamId] : null; }
function teamRoleScorecardHTML(){
  const ev=CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team,myAnswers?.team?.role);
  if(!myAnswers?.team?.role) return '';
  return `<div class="team-role-result"><b>개인 역할수행 ${ev.score}점</b>${scoreRowsHTML(ev.details)}</div>`;
}
function supplementalHTML(){
  if(me?.teamRoleKey!=='records') return '';
  const size=Number(me?.teamSize||4); const arr=[];
  if(size<4) arr.push(C.team.supplemental.operations);
  if(size<3) arr.push(C.team.supplemental.purchase);
  if(size<2) arr.push(C.team.supplemental.finance);
  return arr.length?`<div class="team-supplement"><b>인원 부족 보완 지급자료</b>${arr.map(x=>`<p>${x}</p>`).join('')}</div>`:'';
}
function teamRoleCardHTML(){
  const role=teamRoleConfig(); if(!role) return '<div class="waiting"><h2>팀 편성 대기</h2><p>교사가 팀을 편성하면 나의 역할과 지급정보가 표시됩니다.</p></div>';
  const ex=myAnswers?.team?.role;
  return `<section class="team-role-card"><div class="team-role-head"><span>${role.icon}</span><div><small>${me?.teamLabel||me?.teamId||'팀'} · 개인 역할</small><h3>${role.name}</h3></div></div><div class="team-secret"><b>🔐 나에게만 지급된 정보</b><p>${role.secret}</p></div>${supplementalHTML()}${ex?`<div class="feedback good"><b>✓ 핵심정보 공유 완료</b><br>이제 팀원들의 정보를 듣고 공동판단에 참여하세요.</div>${teamRoleScorecardHTML()}`:`<label class="work-label">팀에 반드시 공유할 핵심정보</label><div class="response-list">${role.options.map((x,i)=>`<button type="button" class="response-card ${teamRoleDraft.choice!==null&&Number(teamRoleDraft.choice)===i?'selected':''}" data-team-role-choice="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><label class="work-label">내가 팀에 공유한 내용 기록</label><textarea id="teamRoleNote" class="work-textarea" maxlength="220" placeholder="팀원에게 실제로 전달한 핵심정보를 내 말로 기록하세요.">${escapeHTML(teamRoleDraft.note)}</textarea><button id="submitTeamRoleBtn" class="btn primary large full" ${teamRoleDraft.choice===null||String(teamRoleDraft.note).trim().length<8?'disabled':''}>핵심정보 공유 완료</button>`}</section>`;
}
function teamReportReady(){const d=teamReportDraft;return d.issues.length>=4&&d.criteria.length>=4&&d.conflictResponse!==null&&d.twistResponse!==null&&d.vendor&&String(d.reason||'').trim().length>=15;}
function teamReportHTML(){
  if(me?.teamRoleKey!=='records') return `<div class="team-wait-report"><img class="official-character" src="assets/official/character-listen.png" alt=""><h3>팀 최종보고서 협의 중</h3><p><b>${me?.teamLabel||''} 기록·조정 담당</b>이 휴대폰에 팀의 합의내용을 입력합니다. 다른 팀원은 문제점·기준·돌발상황 대응이 정확히 기록되도록 함께 확인하세요.</p></div>`;
  const ex=myAnswers?.team?.report;
  if(ex) return `<div class="feedback good"><b>✓ 팀 최종보고서 제출 완료</b><br>교사가 팀 채점을 공개할 때까지 기다려주세요.</div>`;
  const d=teamReportDraft;
  return `<section class="team-report"><div class="work-section-title"><span>01</span><div><b>문제점 종합</b><small>팀원들이 공유한 정보에서 반드시 관리해야 할 문제를 선택하세요.</small></div></div><div class="criteria-grid">${C.team.issues.map(x=>`<label class="criteria-chip ${d.issues.includes(x.key)?'selected':''}"><input type="checkbox" data-team-issue="${x.key}" ${d.issues.includes(x.key)?'checked':''}><span>${x.label}</span></label>`).join('')}</div><div class="work-section-title"><span>02</span><div><b>공정한 판단기준</b><small>최종 결정에 실제로 적용할 기준을 선택하세요.</small></div></div><div class="criteria-grid">${C.team.criteria.map(x=>`<label class="criteria-chip ${d.criteria.includes(x.key)?'selected':''}"><input type="checkbox" data-team-criterion="${x.key}" ${d.criteria.includes(x.key)?'checked':''}><span>${x.label}</span></label>`).join('')}</div><div class="work-section-title"><span>03</span><div><b>이해관계 처리</b><small>B업체와 준비위원장의 친척관계를 어떻게 처리할지 결정하세요.</small></div></div><div class="response-list">${C.team.conflictResponses.map((x,i)=>`<button type="button" class="response-card ${d.conflictResponse!==null&&Number(d.conflictResponse)===i?'selected':''}" data-team-conflict="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><div class="team-vendor-table">${C.team.vendors.map(v=>`<div><b>${v.id} · ${v.name}</b><span>${v.price}</span><span>품질 ${v.quality}</span><span>${v.delivery}</span></div>`).join('')}</div><div class="work-section-title"><span>04</span><div><b>돌발상황 대응</b><small>새로운 정보가 들어온 뒤 기존 판단을 어떻게 처리할지 정하세요.</small></div></div><div class="work-alert"><b>⚠️ 추가정보</b><span>${C.team.twist}</span></div><div class="response-list">${C.team.twistResponses.map((x,i)=>`<button type="button" class="response-card ${d.twistResponse!==null&&Number(d.twistResponse)===i?'selected':''}" data-team-twist="${i}"><span>${i+1}</span>${x}</button>`).join('')}</div><div class="work-section-title"><span>05</span><div><b>최종 의사결정 보고서</b><small>팀의 최종 선정업체와 판단근거를 기록하세요.</small></div></div><label class="work-label">최종 선정업체</label><div class="mini-choice-grid">${C.team.vendors.map(v=>`<button type="button" class="mini-choice ${d.vendor===v.id?'selected':''}" data-team-vendor="${v.id}">${v.id} · ${v.name}</button>`).join('')}</div><label class="work-label">최종 판단근거</label><textarea id="teamReportReason" class="work-textarea" maxlength="420" placeholder="예산, 납기, 이해관계 처리, 돌발상황, 최종선정 사유를 하나의 보고서처럼 기록하세요.">${escapeHTML(d.reason)}</textarea><button id="submitTeamReportBtn" class="btn primary large full" ${teamReportReady()?'':'disabled'}>팀 작업물 최종 제출</button></section>`;
}
function teamScorecardHTML(){
  const pub=teamPublished(); if(!pub) return `<div class="waiting"><h3>팀 채점 대기</h3><p>교사가 팀별 작업결과를 채점·공개하면 결과가 표시됩니다.</p></div>`;
  const roleEv=CHEONGRYEOM_EVALUATE_TEAM_ROLE(C.team,myAnswers?.team?.role); const composite=Math.round(Number(pub.teamScore||0)*0.8+roleEv.score*0.2);
  return `<section class="team-score-card"><div class="work-result-head"><div><span>${me?.teamLabel||'우리 팀'} 종합작업 결과</span><h3>팀 수행 80% + 개인 역할 20%</h3></div><strong>${composite}<small>/100</small></strong></div><div class="team-score-formula"><span>팀 수행 <b>${pub.teamScore}</b></span><span>개인 역할 <b>${roleEv.score}</b></span><span>개인 반영점수 <b>${composite}</b></span></div>${scoreRowsHTML(pub.details||[])}<div class="feedback info"><b>협업 평가의 의미</b><br>팀이 만든 공동 결과와 내가 맡은 역할의 수행 정도를 함께 반영했습니다.</div></section>`;
}
function renderTeam(){
  if(!me?.teamId) return waiting('팀 편성 대기','교사가 종합 팀 실기용 팀을 편성하고 있습니다.');
  const phase=control?.teamPhase||'briefing';
  const phaseLabel={briefing:'① 분산정보 공유',twist:'② 돌발상황 대응',report:'③ 공동보고서 작성',scored:'④ 팀 작업결과'}[phase]||'팀 실기';
  return `<div class="work-exam-head"><div><span class="stage-tag">종합 팀 작업형</span><h2>${C.team.title}</h2><p>${C.team.objective}</p></div><div class="work-code"><small>과제번호</small><b>${C.team.code}</b></div></div><div class="team-phase-banner"><b>${me.teamLabel||me.teamId}</b><span>${phaseLabel}</span><small>${me.teamRoleName||''}</small></div><div class="work-context">${C.team.context}</div>${teamRoleCardHTML()}${phase==='twist'||phase==='report'||phase==='scored'?`<div class="work-alert team-twist"><b>⚠️ 돌발상황 공개</b><span>${C.team.twist}</span></div>`:''}${phase==='report'?teamReportHTML():''}${phase==='scored'?teamScorecardHTML():''}`;
}
function bindTeam(){
  document.querySelectorAll('[data-team-role-choice]').forEach(b=>b.onclick=()=>{teamRoleDraft.choice=Number(b.dataset.teamRoleChoice);render();});
  const rn=$('#teamRoleNote'); if(rn) rn.oninput=()=>{teamRoleDraft.note=rn.value;const b=$('#submitTeamRoleBtn');if(b)b.disabled=teamRoleDraft.choice===null||rn.value.trim().length<8;};
  const rb=$('#submitTeamRoleBtn'); if(rb) rb.onclick=submitTeamRole;
  document.querySelectorAll('[data-team-issue]').forEach(x=>x.onchange=()=>{const k=x.dataset.teamIssue;teamReportDraft.issues=x.checked?[...new Set([...teamReportDraft.issues,k])]:teamReportDraft.issues.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-team-criterion]').forEach(x=>x.onchange=()=>{const k=x.dataset.teamCriterion;teamReportDraft.criteria=x.checked?[...new Set([...teamReportDraft.criteria,k])]:teamReportDraft.criteria.filter(v=>v!==k);render();});
  document.querySelectorAll('[data-team-conflict]').forEach(b=>b.onclick=()=>{teamReportDraft.conflictResponse=Number(b.dataset.teamConflict);render();});
  document.querySelectorAll('[data-team-twist]').forEach(b=>b.onclick=()=>{teamReportDraft.twistResponse=Number(b.dataset.teamTwist);render();});
  document.querySelectorAll('[data-team-vendor]').forEach(b=>b.onclick=()=>{teamReportDraft.vendor=b.dataset.teamVendor;render();});
  const tr=$('#teamReportReason'); if(tr) tr.oninput=()=>{teamReportDraft.reason=tr.value;const b=$('#submitTeamReportBtn');if(b)b.disabled=!teamReportReady();};
  const sr=$('#submitTeamReportBtn'); if(sr) sr.onclick=submitTeamReport;
}
async function submitTeamRole(){
  if(submitting||myAnswers?.team?.role)return; const role=teamRoleConfig(); if(!role||teamRoleDraft.choice===null||teamRoleDraft.note.trim().length<8)return;
  const b=$('#submitTeamRoleBtn');submitting=true;if(b){b.disabled=true;b.textContent='저장 중...';}
  try{await DB.submitAnswer(code,'team','role',{choice:Number(teamRoleDraft.choice),work:{teamId:me.teamId,roleKey:me.teamRoleKey,note:teamRoleDraft.note.trim()}});await syncMyResult();toast('핵심정보 공유를 완료했습니다.');}catch(e){toast('역할정보 저장 중 오류가 발생했습니다.');if(b){b.disabled=false;b.textContent='핵심정보 공유 완료';}}finally{submitting=false;}
}
async function submitTeamReport(){
  if(submitting||myAnswers?.team?.report||me?.teamRoleKey!=='records'||!teamReportReady())return;
  const b=$('#submitTeamReportBtn');submitting=true;if(b){b.disabled=true;b.textContent='팀 보고서 저장 중...';}
  const vendorIndex=C.team.vendors.findIndex(v=>v.id===teamReportDraft.vendor);
  try{await DB.submitAnswer(code,'team','report',{choice:vendorIndex,work:{teamId:me.teamId,issues:[...teamReportDraft.issues],criteria:[...teamReportDraft.criteria],conflictResponse:Number(teamReportDraft.conflictResponse),twistResponse:Number(teamReportDraft.twistResponse),vendor:teamReportDraft.vendor,reason:teamReportDraft.reason.trim()}});toast('팀 최종보고서를 제출했습니다.');}catch(e){toast('팀 보고서 저장 중 오류가 발생했습니다.');if(b){b.disabled=false;b.textContent='팀 작업물 최종 제출';}}finally{submitting=false;}
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
    h = `<span class="stage-tag">오리엔테이션</span>
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
      ${choiceHTML(q.options, ex, pending)}
      ${!ex ? `<div class="student-submit">
        <button id="submitBtn" class="btn primary large full" ${pending == null ? 'disabled' : ''}>
          답안 제출
        </button>
      </div>` : ''}
      ${ex
        ? (control.reveal
          ? `<div class="feedback ${ex.correct ? 'good' : 'info'}">
              <b>${ex.correct ? '정답입니다.' : '해설을 확인해보세요.'}</b><br>${q.ex}
            </div>`
          : `<div class="feedback info">✓ 답안 제출 완료<br>교사가 해설을 공개하면 설명을 확인할 수 있습니다.</div>`)
        : ''}`;
  }

  if (stage === 'practical') {
    const ex = mine('practical', q.id);
    h = renderPractical(q, ex);
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
    h = `<span class="stage-tag">최종 미션</span>
      <h2>나의 청렴 실천약속</h2>
      <div class="student-context">
        학교생활에서 오늘부터 직접 실천할 수 있는 청렴 행동 한 가지를 구체적으로 적어주세요.
      </div>
      <div class="pledge-area">
        <textarea id="pledgeText" maxlength="160" placeholder="예: 모둠활동에서 친한 친구 의견만 편들지 않고 모두의 의견을 같은 기준으로 듣겠습니다.">${myPledge?.text || ''}</textarea>
        <div class="student-submit">
          <button id="pledgeBtn" class="btn primary large full">
            ${myPledge ? '실천약속 수정' : '실천약속 서명'}
          </button>
        </div>
      </div>`;
  }

  if (stage === 'result') {
    const s = scores();
    const t = integrityType();
    const missingNotice = s.missingQuestions > 0 || !s.teamComplete || s.pl === 0
      ? `<div class="feedback info">
          <b>채점 안내</b><br>
          ${s.missingQuestions > 0 ? `시간 내 제출하지 못한 ${s.missingQuestions}개 문항은 0점으로 반영되었습니다.<br>` : ''}
          ${!s.teamComplete ? '종합 팀 실기 결과가 공개되지 않은 경우 팀 실기 점수는 0점으로 반영됩니다.<br>' : ''}${s.pl === 0 ? '청렴 실천약속 미제출은 0점으로 반영되었습니다.' : ''}
        </div>`
      : '';

    h = `<span class="stage-tag">자격판정</span>
      <h2>평가가 종료되었습니다.</h2>
      <div class="score-box">
        <div class="score-main"><span>종합 청렴역량 점수</span><strong>${s.total}</strong></div>
        <div class="score-grid">
          <div><span>필기</span><b>${s.w}</b></div>
          <div><span>실기</span><b>${s.p}</b></div>
          <div><span>팀 실기</span><b>${s.team}</b></div>
          <div><span>실천</span><b>${s.pl}</b></div>
        </div>
      </div>
      ${practicalBreakdownHTML(s)}
      ${s.teamComplete?teamScorecardHTML():''}
      ${missingNotice}
      ${typeCardHTML(t)}
      <div id="certificate" class="certificate ${s.qualification === '청렴 리더' ? 'leader' : ''}">
        <img src="assets/official/ci-education.png" alt="국가청렴권익교육원">
        <div class="cert-type">교육용 청렴역량 인증 프로그램</div>
        <h2>${s.qualification}</h2>
        <div class="cert-name">${me?.studentName || '청렴ON 도전자'}</div>
        <div class="cert-integrity-type">${t.symbol} ${t.name} · ${t.figure}</div>
        <div class="cert-text">
          위 학생은 청렴ON 교육과정을 통해<br>
          정직·약속·배려·책임·절제·공정의 가치를 이해하고<br>
          생활 속 청렴을 실천하기 위한 교육과정에 참여하였으므로<br>
          <b>${s.qualification}</b>로 인증합니다.
        </div>
        <div class="cert-date">${new Date().toLocaleDateString('ko-KR')}</div>
      </div>
      <div class="student-submit">
        <button id="saveCert" class="btn ${s.qualification === '청렴 리더' ? 'gold' : 'primary'} full">
          자격증 이미지 저장
        </button>
      </div>
      <div class="feedback info">※ 실제 국가기술자격이 아닌 교육용 청렴역량 인증입니다.</div>`;
  }

  $('#studentContent').innerHTML = h;
  bindChoices();
  if (stage === 'practical' && q) bindPractical(q, mine('practical', q.id));
  if (stage === 'team') bindTeam();
  updateTimerDisplay();

  if ($('#submitBtn')) $('#submitBtn').onclick = submit;
  if ($('#pledgeBtn')) $('#pledgeBtn').onclick = savePledge;
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
  const t = $('#pledgeText').value.trim();
  if (t.length < 8) return toast('실천약속을 조금 더 구체적으로 적어주세요.');

  await DB.savePledge(code, t);
  await syncMyResult();
  toast('실천약속을 저장했습니다.');
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
    a.download = `청렴ON_${scores().qualification}_${me?.studentName || '자격증'}.png`;
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
      render();
    }),
    DB.on(`pledges/${DB.uid}`, code, v => {
      myPledge = v || null;
      render();
    }),
    DB.on(`participants/${DB.uid}`, code, v => {
      me = v || me;
      render();
    })
  ];

  myAnswers = { written: {}, practical: {}, team: {role:null, report:null} };

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
  unsubs.push(DB.on(`answers/team/report/${DB.uid}`, code, v => { myAnswers.team.report=v||null; render(); }));

  setInterval(() => DB.heartbeat(code), 25000);
}

async function join() {
  const c = $('#joinCode').value.trim();
  let name = $('#studentName').value.trim().replace(/\s+/g, ' ');

  if (!/^\d{6}$/.test(c)) return toast('6자리 참여코드를 확인해주세요.');
  if (name.length < 2 || name.length > 20) return toast('학생 이름을 정확히 입력해주세요.');
  if (!/^[가-힣A-Za-z ]+$/.test(name)) return toast('이름에는 한글·영문과 띄어쓰기만 사용할 수 있습니다.');

  try {
    await DB.joinRoom(c, name, $('#schoolLevel').value);
    code = c;
    me = {
      studentName: name,
      schoolLevel: $('#schoolLevel').value
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
    $('#studentStatus').textContent = '실시간 연결 · v6.0 팀종합실기';
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
