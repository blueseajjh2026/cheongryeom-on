const C = CHEONGRYEOM_CONTENT;
const DB = CheongDB;
const $ = s => document.querySelector(s);

let code = null;
let control = null;
let myAnswers = { written: {}, practical: {}, process: {} };
let myPledge = null;
let me = null;
let unsubs = [];
let submitting = false;

// 실시간 화면 갱신이 일어나도 학생이 선택한 답이 사라지지 않도록 문항별 임시선택을 보관
const pendingChoices = {};

const stageCharacter = {
  waiting: 'character-listen.png',
  intro: 'character-explain.png',
  written: 'character-warning.png',
  practical: 'character-tablet.png',
  process: 'character-listen.png',
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
    control?.stage === 'practical' ? C.practical :
    control?.stage === 'process' ? C.process : [];
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
  const sums = Object.fromEntries(
    C.virtues.map(v => [v.key, { s: 0, n: 0 }])
  );

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
    const o = q.options[a.choice];
    Object.entries(o?.impact || {}).forEach(([k, v]) => {
      sums[k].s += v;
      sums[k].n++;
    });
  });

  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [
      k,
      v.n ? Math.round(v.s / v.n) : 0
    ])
  );
}

function scores() {
  const S = C.scoring;

  // 필기: 미응답 문항은 자동 0점
  let writtenCorrect = 0;
  let writtenAnswered = 0;
  C.written.forEach(q => {
    const a = mine('written', q.id);
    if (a) writtenAnswered++;
    if (a?.choice === q.correct) writtenCorrect++;
  });
  const w = Math.round(writtenCorrect / C.written.length * 100);

  // 실기: 각 미응답 문항을 0점으로 포함해 전체 문항 수로 평균
  let practicalSum = 0;
  let practicalAnswered = 0;
  C.practical.forEach(q => {
    const a = mine('practical', q.id);
    if (Number.isInteger(a?.choice)) {
      practicalAnswered++;
      practicalSum += Number(q.options[a.choice]?.score || 0);
    }
  });
  const p = Math.round(practicalSum / C.practical.length);

  // 과정평가: 재선택 없이 문항별 1회 제출. 미응답은 0점
  let processAnswered = 0;
  C.process.forEach(q => {
    if (mine('process', q.id)) processAnswered++;
  });
  const pr = Math.round(processAnswered / C.process.length * 100);

  // 실천약속 미제출은 0점
  const pl = myPledge?.text ? 100 : 0;

  const total = Math.round(
    w * S.writtenWeight / 100 +
    p * S.practicalWeight / 100 +
    pr * S.processWeight / 100 +
    pl * S.pledgeWeight / 100
  );

  // 시간 내 미제출은 0점으로 반영하고 결과 자체는 정상 산출
  const qualification =
    total >= S.leaderTotal && p >= S.leaderPractical
      ? '청렴 리더'
      : '청렴 서포터';

  const missingQuestions =
    (C.written.length - writtenAnswered) +
    (C.practical.length - practicalAnswered) +
    (C.process.length - processAnswered);

  return {
    w, p, pr, pl, total, qualification,
    writtenAnswered, practicalAnswered, processAnswered,
    missingQuestions
  };
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
      processScore: s.pr,
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
    const pending = pendingChoices[answerKey()];

    h = `<span class="stage-tag">실기평가 ${Number(control.index) + 1}/${C.practical.length}</span>
      <h2>${q.title}</h2>
      <div class="student-context">${q.context}</div>
      <h3>${q.q}</h3>
      ${choiceHTML(q.options, ex, pending)}
      ${!ex ? `<div class="student-submit">
        <button id="submitBtn" class="btn primary large full" ${pending == null ? 'disabled' : ''}>
          나의 선택 제출
        </button>
      </div>` : `<div class="feedback info">
        ✓ 선택이 확정되었습니다.<br>
        제출한 답안은 다시 변경할 수 없습니다.
      </div>`}`;
  }

  if (stage === 'process') {
    const ex = mine('process', q.id);
    const pending = pendingChoices[answerKey()];

    h = `<span class="stage-tag">${q.title} · 1회 판단</span>
      <h2>${q.q}</h2>
      <div class="student-context">${q.context}</div>
      ${choiceHTML(q.options, ex, pending)}
      ${!ex ? `<div class="student-submit">
        <button id="submitBtn" class="btn primary large full" ${pending == null ? 'disabled' : ''}>
          선택 제출
        </button>
      </div>` : `<div class="feedback info">
        ✓ 판단이 확정되었습니다.<br>
        친구들의 생각과 비교하며 토론해보세요.
      </div>`}`;
  }

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
    const missingNotice = s.missingQuestions > 0 || s.pl === 0
      ? `<div class="feedback info">
          <b>채점 안내</b><br>
          ${s.missingQuestions > 0 ? `시간 내 제출하지 못한 ${s.missingQuestions}개 문항은 0점으로 반영되었습니다.<br>` : ''}
          ${s.pl === 0 ? '청렴 실천약속 미제출은 0점으로 반영되었습니다.' : ''}
        </div>`
      : '';

    h = `<span class="stage-tag">자격판정</span>
      <h2>평가가 종료되었습니다.</h2>
      <div class="score-box">
        <div class="score-main"><span>종합 청렴역량 점수</span><strong>${s.total}</strong></div>
        <div class="score-grid">
          <div><span>필기</span><b>${s.w}</b></div>
          <div><span>실기</span><b>${s.p}</b></div>
          <div><span>과정</span><b>${s.pr}</b></div>
          <div><span>실천</span><b>${s.pl}</b></div>
        </div>
      </div>
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

  myAnswers = { written: {}, practical: {}, process: {} };

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

  // 과정평가도 문항당 1회만 저장
  C.process.forEach(q => {
    unsubs.push(DB.on(`answers/process/${q.id}/${DB.uid}`, code, v => {
      if (v) myAnswers.process[q.id] = v;
      else delete myAnswers.process[q.id];
      render();
    }));
  });

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
    $('#studentStatus').textContent = '실시간 연결 · v4.1';
    $('#studentStatus').classList.add('online');
    $('#joinPanel').classList.remove('hidden');
    $('#joinBtn').onclick = join;
  } catch (e) {
    $('#configError').classList.remove('hidden');
    $('#studentStatus').textContent = '연결 실패';
    $('#studentStatus').classList.add('error');
  }
})();
