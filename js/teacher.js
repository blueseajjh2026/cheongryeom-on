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
  k === 'practical' ? C.practical :
  k === 'process' ? C.process : [];

const item = () => items(control.stage)[Number(control.index || 0)] || null;

const stageCharacter = {
  waiting: 'character-greeting.png',
  intro: 'character-explain.png',
  written: 'character-warning.png',
  practical: 'character-tablet.png',
  process: 'character-listen.png',
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
  let answered = 0;
  let total = C.written.length + C.practical.length + C.process.length;

  C.written.forEach(q => {
    if (answers?.written?.[q.id]?.[uid]) answered++;
  });
  C.practical.forEach(q => {
    if (answers?.practical?.[q.id]?.[uid]) answered++;
  });
  C.process.forEach(q => {
    if (answers?.process?.[q.id]?.[uid]) answered++;
  });

  return { answered, total };
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
            ${p.schoolLevel === 'high' ? '고등학생' : '중학생'} ·
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
    b.onclick = () => go(b.dataset.key, 0);
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
  const sums = Object.fromEntries(
    C.virtues.map(v => [v.key, { s: 0, n: 0 }])
  );

  C.written.forEach(q => {
    const a = answers?.written?.[q.id]?.[uid];
    if (!a) return;

    Object.entries(q.impact || {}).forEach(([k, v]) => {
      sums[k].s += (a.choice === q.correct ? v : Math.round(v * 0.3));
      sums[k].n++;
    });
  });

  C.practical.forEach(q => {
    const a = answers?.practical?.[q.id]?.[uid];
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
  const S = C.scoring;

  let writtenCorrect = 0;
  let writtenAnswered = 0;

  C.written.forEach(q => {
    const a = answers?.written?.[q.id]?.[uid];
    if (a) writtenAnswered++;
    if (a?.choice === q.correct) writtenCorrect++;
  });

  const w = Math.round(writtenCorrect / C.written.length * 100);

  let practicalSum = 0;
  let practicalAnswered = 0;

  C.practical.forEach(q => {
    const a = answers?.practical?.[q.id]?.[uid];
    if (Number.isInteger(a?.choice)) {
      practicalAnswered++;
      practicalSum += Number(q.options[a.choice]?.score || 0);
    }
  });

  const p = Math.round(practicalSum / C.practical.length);

  let processAnswered = 0;
  C.process.forEach(q => {
    if (answers?.process?.[q.id]?.[uid]) processAnswered++;
  });

  const pr = Math.round(processAnswered / C.process.length * 100);
  const pl = pledges?.[uid]?.text ? 100 : 0;

  const total = Math.round(
    w * S.writtenWeight / 100 +
    p * S.practicalWeight / 100 +
    pr * S.processWeight / 100 +
    pl * S.pledgeWeight / 100
  );

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
    h = `<span class="eyebrow">${q.title} · ${Number(control.index) + 1}/${C.practical.length}</span>
      <h2>${q.q}</h2>
      <p class="context-box">${q.context}</p>
      <div class="option-grid">${
        q.options.map((x, i) =>
          `<div class="option-view"><b>${String.fromCharCode(65 + i)}.</b> ${x.text}</div>`
        ).join('')
      }</div>`;
  }

  if (control.stage === 'process') {
    h = `<span class="eyebrow">${q.title} · 1회 판단</span>
      <h2>${q.q}</h2>
      <p class="context-box">${q.context}</p>
      <div class="option-grid">${
        q.options.map((x, i) =>
          `<div class="option-view"><b>${String.fromCharCode(65 + i)}.</b> ${x}</div>`
        ).join('')
      }</div>
      <div class="change-box">
        <b>응답 후 토론 질문</b><br>
        ${q.discussion.join(' · ')}
      </div>
      <div class="feedback info">
        학생은 문항당 한 번만 제출합니다. 제출 후에는 변경할 수 없습니다.
      </div>`;
  }

  if (control.stage === 'diagnosis') {
    h = `<span class="eyebrow">DIAGNOSIS</span>
      <h2>6대 청렴역량을 함께 확인합니다.</h2>
      <p class="context-box">
        학생들의 필기·실기 선택을 바탕으로 정직·약속·배려·책임·절제·공정의 학급 평균을 확인합니다.
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
    const missing = rs.reduce((a, b) => a + b.missingQuestions + (b.pl === 0 ? 1 : 0), 0);

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
    labels = q.options.map(o => o.text);
  } else if (control.stage === 'process') {
    list = ans('process', q.id);
    labels = q.options;
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
    locked: false
  });
}

async function next() {
  const a = items(control.stage);
  const i = Number(control.index || 0);

  if (a.length && i < a.length - 1) {
    return DB.setControl(code, {
      index: i + 1,
      reveal: false,
      phase: 'single'
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
      phase: 'single'
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
    '필기', '실기', '과정', '실천', '종합',
    '미응답문항수', '자격', '청렴유형', '상징역사인물',
    '상위역량1', '상위역량2', '실천약속'
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
      r.pr,
      r.pl,
      r.total,
      r.missingQuestions,
      r.qualification,
      t.name,
      t.figure,
      `${t.primary.name} ${t.primary.score}`,
      `${t.secondary.name} ${t.secondary.score}`,
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

    $('#serverStatus').textContent = '실시간 서버 연결 · v4.1';
    $('#serverStatus').classList.add('online');
    $('#roomSetup').classList.remove('hidden');

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
