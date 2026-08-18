window.CHEONGRYEOM_CONTENT={
  virtues:[
    {key:'honesty',name:'정직',tag:'진실을 위한',desc:'사실을 숨기거나 꾸미지 않고 진실하게 말하고 행동하는 태도'},
    {key:'promise',name:'약속',tag:'함께 지키는',desc:'타인과의 약속뿐 아니라 공동체의 규칙과 질서를 지키는 태도'},
    {key:'care',name:'배려',tag:'공공(모두)을 위한',desc:'친한 사람만이 아니라 더 많은 사람의 입장과 이익을 고려하는 태도'},
    {key:'responsibility',name:'책임',tag:'내 몫을 다하는',desc:'맡은 일을 끝까지 수행하고 결과에 대해 책임지는 태도'},
    {key:'restraint',name:'절제',tag:'욕심을 조절하는',desc:'내 것과 남의 것을 구분하고 사적 욕심을 조절하는 태도'},
    {key:'fairness',name:'공정',tag:'치우치지 않는',desc:'친분이나 편견보다 합리적이고 공개된 기준으로 판단하는 태도'}
  ],
  stages:[
    {key:'waiting',name:'수험등록',short:'등록'},
    {key:'intro',name:'오리엔테이션',short:'OT'},
    {key:'written',name:'필기평가',short:'필기'},
    {key:'practical',name:'작업형 실기',short:'실기'},
    {key:'process',name:'과정평가',short:'과정'},
    {key:'diagnosis',name:'역량진단',short:'진단'},
    {key:'pledge',name:'청렴실천',short:'실천'},
    {key:'result',name:'자격판정',short:'결과'}
  ],
  intro:{
    title:'청렴은 아는 것에서 끝나지 않습니다. 실제 상황을 처리하는 과정에서 역량이 드러납니다.',
    body:'필기에서는 청렴의 기본 기준을 확인하고, 작업형 실기에서는 지급자료를 검토해 기준을 적용하고 기록을 작성한 뒤 작업물을 제출합니다. 이후 토론·성찰·실천을 거쳐 나의 청렴역량을 확인합니다.'
  },
  written:[
    {id:'w1',virtue:'honesty',q:'생성형 AI로 수행평가 초안을 만들었습니다. 가장 정직한 제출 방식에 가까운 것은?',options:['AI가 만든 내용을 거의 그대로 제출한다.','AI를 사용했다는 사실은 굳이 말하지 않는다.','학교 지침을 확인하고, 사용한 부분을 밝힌 뒤 내 생각과 검토를 거쳐 다시 작성한다.','문장 몇 개만 바꾸면 내가 쓴 글과 같으므로 그대로 제출한다.'],correct:2,ex:'도구를 사용하는 것 자체보다 사용 사실과 범위를 숨기고 결과물을 자신의 성과처럼 제시하는지가 핵심입니다.',impact:{honesty:100,responsibility:55}},
    {id:'w2',virtue:'promise',q:'친구들과 정한 모둠 온라인 회의 시간에 다른 약속이 생겼습니다. 가장 적절한 행동은?',options:['아무 말 없이 참석하지 않는다.','친한 친구에게만 개인적으로 말한다.','가능한 빨리 모두에게 알리고 새로운 시간을 함께 조정한다.','회의가 중요하지 않다고 생각되면 나중에 자료만 받는다.'],correct:2,ex:'약속은 시간을 지키는 것뿐 아니라 지키기 어려운 상황이 생겼을 때 상대방에게 미리 알리고 함께 조정하는 책임까지 포함합니다.',impact:{promise:100,responsibility:55}},
    {id:'w3',virtue:'care',q:'모둠 발표에서 한 친구가 말이 느려 계속 의견을 내지 못하고 있습니다. 공공을 위한 배려에 가장 가까운 행동은?',options:['시간이 부족하므로 발표를 잘하는 친구들끼리 결정한다.','그 친구의 의견을 대신 추측해서 반영한다.','발언 기회를 만들고 충분히 기다린 뒤, 모둠 전체가 함께 결정한다.','친한 친구가 원하면 그 친구에게 발언 시간을 더 준다.'],correct:2,ex:'배려는 특정 사람만 편들어 주는 것이 아니라 모두가 참여할 수 있도록 조건을 만들어 공동의 이익을 고려하는 태도입니다.',impact:{care:100,fairness:45}},
    {id:'w4',virtue:'responsibility',q:'내가 맡은 모둠 자료조사가 예상보다 늦어져 발표 준비에 차질이 생길 것 같습니다. 가장 책임 있는 행동은?',options:['문제가 커지기 전까지 말하지 않는다.','늦어진 사실과 현재 진행상황을 공유하고, 완료 계획이나 대안을 제시한다.','인터넷 글을 그대로 복사해 빨리 끝낸다.','다른 친구가 대신 해결하도록 기다린다.'],correct:1,ex:'책임은 맡은 일을 하는 것뿐 아니라 문제가 생겼을 때 숨기지 않고 해결 과정과 결과까지 감당하는 태도입니다.',impact:{responsibility:100,honesty:60}},
    {id:'w5',virtue:'restraint',q:'학교 행사 준비비로 산 물품이 남았습니다. 개인적으로 갖고 싶은 물건이 하나 있습니다. 가장 적절한 행동은?',options:['금액이 작다면 가져가도 된다.','행사에 많이 기여했으니 보상으로 가져간다.','공동 물품의 처리 기준을 확인하고 승인된 방식으로 처리한다.','친구들이 괜찮다고 하면 가져간다.'],correct:2,ex:'절제는 내 것과 공동의 것을 구분하고, 개인의 욕심보다 정해진 기준을 따르는 태도와 연결됩니다.',impact:{restraint:100,responsibility:50}},
    {id:'w6',virtue:'fairness',q:'학생회 지원자 중 친한 친구가 있습니다. 가장 공정한 선발 방식은?',options:['친구가 평소 좋은 사람이므로 높은 점수를 준다.','지원자에게 평가기준을 미리 공개하고 모든 지원자에게 같은 기준을 적용한다.','친구는 오해를 살 수 있으니 무조건 낮은 점수를 준다.','모두 똑같이 대우하기 위해 지원 내용을 보지 않고 추첨한다.'],correct:1,ex:'공정은 친분의 영향을 배제하는 동시에, 합리적이고 공개된 기준을 일관되게 적용하는 것을 의미합니다.',impact:{fairness:100,honesty:40}}
  ],
  practical:[
    {
      id:'p1',kind:'procurement',title:'작업형 제1과제 · 공정한 예산집행',code:'P-01',timeLimitSec:300,
      objective:'지급자료를 검토하고 이해관계를 확인한 뒤, 공정한 기준에 따라 구매계획을 완성하십시오.',
      context:'학급 축제 부스 물품 구매 담당자입니다. 사용 가능한 예산은 300,000원이며, 세 업체의 견적과 학교의 예산집행 기준이 지급되었습니다.',
      deliverables:['지급자료 확인','이해관계 확인','비교기준 설정','업체 선정','처리방식 및 선정사유 기록'],
      docs:[
        {id:'rule',icon:'📘',title:'자료 1 · 예산집행 기준',body:'① 필요한 물품을 예산 범위 안에서 구매합니다. ② 가격만이 아니라 품질·납기 등 합리적인 기준을 함께 비교할 수 있습니다. ③ 담당자와 개인적 이해관계가 있는 업체가 있으면 그 사실을 공개하고 동일한 기준으로 검토해야 합니다. ④ 선정 과정과 사유를 기록으로 남깁니다.'},
        {id:'A',icon:'📄',title:'자료 2 · 행복문구 견적서',body:'총액 268,000원 · 품질 4/5 · 배송: 다음 날 오전 · 미개봉 반품 가능 · 담당자와의 이해관계 없음'},
        {id:'B',icon:'📄',title:'자료 3 · 드림상사 견적서',body:'총액 251,000원 · 품질 4/5 · 배송: 2일 후 · 불량품 교환 가능 · 담당자와의 이해관계 없음'},
        {id:'C',icon:'📄',title:'자료 4 · 우리문구 견적서',body:'총액 262,000원 · 품질 5/5 · 배송: 당일 · 미개봉 반품 가능 · 친구의 삼촌이 운영 · 사은품 20개 제공 제안'}
      ],
      criteria:[
        {key:'price',label:'가격'},{key:'quality',label:'품질'},{key:'delivery',label:'배송·납기'},{key:'conflict',label:'이해관계'}
      ],
      vendors:[
        {id:'A',name:'행복문구',price:'268,000원',quality:'4/5',delivery:'다음 날 오전'},
        {id:'B',name:'드림상사',price:'251,000원',quality:'4/5',delivery:'2일 후'},
        {id:'C',name:'우리문구',price:'262,000원',quality:'5/5',delivery:'당일'}
      ],
      rubric:['자료검토 10','이해관계 확인 20','비교기준 적용 20','최종판단 20','공개·기록 15','선정사유 15']
    },
    {
      id:'p2',kind:'sequence',title:'작업형 제2과제 · 증빙누락 처리',code:'P-02',timeLimitSec:300,
      objective:'정산자료와 메시지를 확인하고, 증빙이 누락된 지출을 투명하게 처리하는 절차를 순서대로 완성하십시오.',
      context:'축제 정산을 하던 중 게임물품 47,000원의 영수증이 보이지 않습니다. 물품을 구매한 친구가 “다른 영수증 금액에 조금 섞으면 아무도 몰라.”라고 말했습니다.',
      ledger:[
        {item:'장식품',amount:'82,000원',proof:true},{item:'음료',amount:'56,000원',proof:true},{item:'게임물품',amount:'47,000원',proof:false},{item:'인쇄비',amount:'38,000원',proof:true}
      ],
      actions:[
        {id:'fact',text:'구매내역·금액 등 사실관계를 먼저 확인한다.'},
        {id:'reissue',text:'판매처에 영수증 재발급이 가능한지 확인한다.'},
        {id:'report',text:'담당자에게 증빙 누락 사실을 그대로 보고한다.'},
        {id:'actual',text:'실제 지출액대로 기록하고 증빙 누락 상태와 처리결과를 남긴다.'},
        {id:'mix',text:'다른 영수증 금액에 47,000원을 나누어 포함한다.'},
        {id:'hide',text:'금액이 크지 않으므로 해당 지출을 기록에서 빼고 넘어간다.'}
      ],
      rubric:['적정 절차 선택 60','처리순서 20','정산의견 20','부적정 처리 선택 시 감점']
    },
    {
      id:'p3',kind:'panel',title:'작업형 제3과제 · 공정한 학생대표 선발',code:'P-03',timeLimitSec:420,
      objective:'공개된 평가표에 따라 지원자를 직접 채점한 뒤, 추가로 알게 된 친분 관계에도 동일한 기준을 유지할 수 있는지 판단하십시오.',
      context:'학급 대표 1명을 선발하는 심사위원입니다. 지원자의 이름은 가리고 A·B·C로 표시했습니다. 먼저 지원자료만 보고 채점한 후 추가정보를 확인합니다.',
      rubricFields:[
        {key:'plan',label:'활동계획',max:40},{key:'responsibility',label:'책임감',max:30},{key:'collaboration',label:'협업경험',max:20},{key:'presentation',label:'발표내용',max:10}
      ],
      candidates:[
        {id:'A',name:'지원자 A',profile:'활동계획에 일정·예산이 구체적으로 제시됨. 학급 행사 총무 2회. 협업 프로젝트 2회. 발표 핵심이 명확함.',reference:{plan:35,responsibility:27,collaboration:16,presentation:8}},
        {id:'B',name:'지원자 B',profile:'아이디어는 참신하나 일정 계획이 다소 부족함. 맡은 역할을 성실히 수행한 기록이 있음. 협업 프로젝트 3회. 발표 전달력이 좋음.',reference:{plan:30,responsibility:25,collaboration:19,presentation:9}},
        {id:'C',name:'지원자 C',profile:'활동계획이 구체적이고 안전대책까지 포함함. 학교행사 책임자 경험 2회. 협업 프로젝트 2회. 발표가 안정적임.',reference:{plan:36,responsibility:29,collaboration:17,presentation:8}}
      ],
      extraInfo:'추가정보: 지원자 C는 당신과 가장 친한 친구입니다.',
      responses:[
        '친분 관계를 공개하고, 이미 정한 평가기준과 점수를 그대로 유지한다.',
        '친구의 장점을 더 잘 아니까 지원자 C에게 가점을 추가한다.',
        '오해가 생길 수 있으므로 지원자 C를 평가대상에서 자동 제외한다.',
        '부담되므로 내가 한 평가를 모두 취소하고 다른 학생에게 넘긴다.'
      ],
      rubric:['기준표에 따른 채점 50','이해관계 인식 10','동일기준 유지 25','판단근거 기록 15']
    }
  ],
  process:[
    {id:'d1',title:'청렴 판단 LAB ① 친구와 규칙',context:'친한 친구가 학교 규칙을 어긴 사실을 알게 되었습니다. 친구는 “우리 사이인데 말하지 않을 거지?”라고 부탁합니다.',q:'친구의 잘못을 선생님에게 알리는 것은 청렴한 행동일까요?',options:['그렇다','아니다','상황에 따라 다르다'],discussion:['규칙 위반으로 피해를 보는 사람이 있는가?','친구를 배려하는 것과 잘못을 숨기는 것은 어떻게 다른가?','공정·책임·배려가 충돌한다면 어떤 기준이 필요한가?']},
    {id:'d2',title:'청렴 판단 LAB ② 단체 채팅방',context:'반 단체 채팅방에서 시험 범위와 관련된 미확인 정보가 빠르게 퍼지고 있습니다. 출처를 묻는 친구에게 누군가 “다들 알고 있으니 그냥 믿어”라고 말합니다.',q:'확실하지 않은 정보를 전달하지 않는 것도 청렴과 관련이 있을까요?',options:['그렇다','아니다','상황에 따라 다르다'],discussion:['정보를 전달하는 사람에게 어떤 책임이 있는가?','사실 확인이 필요한 이유는 무엇인가?','정직과 책임은 온라인 공간에서 어떻게 나타나는가?']}
  ],
  scoring:{writtenWeight:30,practicalWeight:40,processWeight:20,pledgeWeight:10,leaderTotal:85,leaderPractical:80}
};

window.CHEONGRYEOM_EVALUATE_PRACTICAL = function(q, answer){
  if(!q || !answer || !answer.work) return {score:0,impact:{},details:[]};
  const w=answer.work||{};
  const clamp=x=>Math.max(0,Math.min(100,Math.round(x)));
  const details=[];
  let score=0,impact={};

  if(q.kind==='procurement'){
    const opened=Array.isArray(w.openedDocs)?new Set(w.openedDocs).size:0;
    const docScore=Math.min(10, opened*2.5); score+=docScore; details.push(['지급자료 검토',Math.round(docScore),10]);
    const conflictScore=w.conflictVendor==='C'?20:0; score+=conflictScore; details.push(['이해관계 확인',conflictScore,20]);
    const selectedCriteria=new Set(Array.isArray(w.criteria)?w.criteria:[]);
    const criteriaScore=['price','quality','delivery','conflict'].reduce((a,k)=>a+(selectedCriteria.has(k)?5:0),0); score+=criteriaScore; details.push(['비교기준 적용',criteriaScore,20]);
    let decision=0;
    if(Number(w.selectedVendor)===1) decision=20;
    else if(Number(w.selectedVendor)===0) decision=16;
    else if(Number(w.selectedVendor)===2) decision=(w.conflictVendor==='C'&&w.disclosure)?12:4;
    score+=decision; details.push(['최종업체 판단',decision,20]);
    const disclosure=w.disclosure?15:0; score+=disclosure; details.push(['이해관계 공개·기록',disclosure,15]);
    const reason=String(w.reason||'').trim();
    const keywordGroups=[/가격|예산|금액/,/품질|배송|납기|조건/,/이해관계|친구|공개|기준|공정/];
    let reasonScore=reason.length>=15?6:reason.length>=8?3:0;
    reasonScore+=keywordGroups.reduce((a,r)=>a+(r.test(reason)?3:0),0);
    reasonScore=Math.min(15,reasonScore); score+=reasonScore; details.push(['선정사유 기록',reasonScore,15]);
    impact={
      fairness:clamp(conflictScore*2+criteriaScore*2+decision),
      responsibility:clamp(docScore*4+disclosure*2+reasonScore*2),
      honesty:clamp(conflictScore*3+disclosure*2),
      restraint:clamp((Number(w.selectedVendor)!==2?55:25)+criteriaScore)
    };
  }

  if(q.kind==='sequence'){
    const order=Array.isArray(w.order)?w.order:[];
    const correct=['fact','reissue','report','actual'];
    const bad=['mix','hide'];
    const includeScore=correct.reduce((a,k)=>a+(order.includes(k)?15:0),0); score+=includeScore; details.push(['적정 절차 선택',includeScore,60]);
    const orderScore=correct.reduce((a,k,i)=>a+(order[i]===k?5:0),0); score+=orderScore; details.push(['처리순서',orderScore,20]);
    const note=String(w.note||'').trim();
    let noteScore=note.length>=20?8:note.length>=8?4:0;
    [/사실|확인/,/보고|공개|알리/,/실제|정산|증빙|재발급/].forEach(r=>{if(r.test(note))noteScore+=4});
    noteScore=Math.min(20,noteScore); score+=noteScore; details.push(['정산의견',noteScore,20]);
    const penalty=bad.reduce((a,k)=>a+(order.includes(k)?25:0),0); score-=penalty;
    if(penalty) details.push(['부적정 처리 감점',-penalty,0]);
    impact={
      honesty:clamp((order.includes('report')?45:0)+(order.includes('actual')?35:0)+(noteScore)),
      responsibility:clamp((order.includes('fact')?25:0)+(order.includes('reissue')?25:0)+(order.includes('actual')?25:0)+orderScore),
      care:clamp((order.includes('reissue')?35:0)+noteScore*2),
      fairness:clamp((order.includes('actual')?55:0)+(order.includes('report')?25:0))
    };
  }

  if(q.kind==='panel'){
    const scores=w.lockedScores||w.scores||{};
    let matrixScore=0,completed=0;
    q.candidates.forEach(c=>q.rubricFields.forEach(f=>{
      const val=Number(scores?.[c.id]?.[f.key]);
      if(Number.isFinite(val)&&val>0&&val<=f.max){
        completed++;
        const ref=Number(c.reference[f.key]);
        const gap=Math.abs(val-ref);
        matrixScore += gap<=3?4.1667:gap<=6?3:gap<=10?1.5:0.5;
      }
    }));
    matrixScore=Math.min(50,matrixScore); score+=matrixScore; details.push(['기준표에 따른 채점',Math.round(matrixScore),50]);
    const reveal=w.revealed?10:0; score+=reveal; details.push(['이해관계 인식',reveal,10]);
    const responseScores=[25,0,10,8];
    const responseScore=Number.isInteger(Number(w.response))?(responseScores[Number(w.response)]||0):0;
    score+=responseScore; details.push(['동일기준 유지',responseScore,25]);
    const reason=String(w.reason||'').trim();
    let reasonScore=reason.length>=18?6:reason.length>=8?3:0;
    [/기준|동일|점수/,/친분|친구|이해관계|공개/,/공정|근거|자료/].forEach(r=>{if(r.test(reason))reasonScore+=3});
    reasonScore=Math.min(15,reasonScore); score+=reasonScore; details.push(['판단근거 기록',reasonScore,15]);
    impact={
      fairness:clamp(matrixScore+responseScore*2+reveal),
      restraint:clamp(responseScore*3+reveal),
      responsibility:clamp(matrixScore+reasonScore*2),
      honesty:clamp(reveal*5+reasonScore*2)
    };
  }

  return {score:clamp(score),impact,details};
};


// 6대 청렴역량 중 상위 2개 조합으로 산출하는 15가지 '나의 청렴유형'.
// 역사 인물은 성격을 단정하는 진단이 아니라 청렴가치를 이해하기 위한 교육적 상징 연결입니다.
window.CHEONGRYEOM_TYPES = [
  {
    virtues:['honesty','promise'], name:'신뢰실천형', figure:'도산 안창호', symbol:'🤝',
    summary:'솔직함과 약속을 행동으로 옮겨 주변의 신뢰를 쌓아가는 유형입니다.',
    mission:'말한 작은 약속 하나를 오늘 행동으로 끝까지 실천해보기'
  },
  {
    virtues:['honesty','care'], name:'진심배려형', figure:'세종대왕', symbol:'💚',
    summary:'사실을 바르게 바라보면서도 상대의 어려움과 마음을 함께 살피는 유형입니다.',
    mission:'누군가의 입장을 먼저 묻고, 필요한 도움 한 가지를 직접 실천해보기'
  },
  {
    virtues:['honesty','responsibility'], name:'원칙완수형', figure:'이순신', symbol:'🛡️',
    summary:'문제를 숨기지 않고 바른 기준을 지키며 맡은 일을 끝까지 완수하는 유형입니다.',
    mission:'미루고 있던 내 몫의 일을 오늘 하나 끝까지 마무리해보기'
  },
  {
    virtues:['honesty','restraint'], name:'청렴수양형', figure:'퇴계 이황', symbol:'🌿',
    summary:'스스로에게 정직한 기준을 세우고 욕심과 충동을 조절하려는 유형입니다.',
    mission:'나에게 유리하더라도 기준에 맞지 않는 선택 한 가지를 스스로 멈춰보기'
  },
  {
    virtues:['honesty','fairness'], name:'원칙수호형', figure:'안중근', symbol:'⚖️',
    summary:'친분이나 눈치보다 사실과 원칙, 공정한 기준을 우선하려는 유형입니다.',
    mission:'친한 사람에게도 같은 기준을 적용해야 하는 상황을 한 번 실천해보기'
  },
  {
    virtues:['promise','care'], name:'신뢰나눔형', figure:'김만덕', symbol:'❤️',
    summary:'사람 사이의 신뢰를 소중히 여기며 어려운 사람과 함께하려는 유형입니다.',
    mission:'주변에서 도움이 필요한 사람에게 먼저 다가가 작은 도움을 건네보기'
  },
  {
    virtues:['promise','responsibility'], name:'약속지킴이형', figure:'도산 안창호', symbol:'📜',
    summary:'한 번 한 약속과 맡은 역할을 끝까지 지켜 신뢰를 만드는 유형입니다.',
    mission:'오늘 정한 시간과 역할 약속 하나를 정확히 지켜보기'
  },
  {
    virtues:['promise','restraint'], name:'신의절제형', figure:'퇴계 이황', symbol:'🌱',
    summary:'순간의 편리함보다 스스로 정한 약속과 기준을 지키려는 유형입니다.',
    mission:'하고 싶은 마음보다 지켜야 할 약속을 우선하는 선택을 한 번 해보기'
  },
  {
    virtues:['promise','fairness'], name:'공정신뢰형', figure:'정조', symbol:'⚖️',
    summary:'약속한 기준을 누구에게나 일관되게 적용하여 신뢰를 만드는 유형입니다.',
    mission:'모둠이나 친구 관계에서 미리 정한 기준을 모두에게 똑같이 적용해보기'
  },
  {
    virtues:['care','responsibility'], name:'공감실천형', figure:'김만덕', symbol:'🌳',
    summary:'다른 사람의 어려움을 알아차리는 데서 그치지 않고 직접 행동하는 유형입니다.',
    mission:'도움이 필요해 보이는 사람을 발견하면 내가 할 수 있는 행동 하나를 실행해보기'
  },
  {
    virtues:['care','restraint'], name:'겸손배려형', figure:'퇴계 이황', symbol:'🍃',
    summary:'내 욕심을 조금 내려놓고 상대와 공동체를 먼저 생각할 수 있는 유형입니다.',
    mission:'내가 먼저 하고 싶은 것을 한 번 양보하고 모두에게 좋은 방법을 찾아보기'
  },
  {
    virtues:['care','fairness'], name:'균형조정형', figure:'세종대왕', symbol:'⚖️',
    summary:'서로 다른 입장을 살피면서 모두가 납득할 수 있는 균형점을 찾는 유형입니다.',
    mission:'의견이 다른 두 사람의 말을 모두 듣고 공통점을 한 가지 찾아보기'
  },
  {
    virtues:['responsibility','restraint'], name:'책임완수형', figure:'이순신', symbol:'🛡️',
    summary:'어려움이나 유혹이 있어도 자신을 다스리며 맡은 임무를 끝까지 해내는 유형입니다.',
    mission:'해야 할 일을 먼저 끝낸 뒤 하고 싶은 일을 하는 순서를 한 번 실천해보기'
  },
  {
    virtues:['responsibility','fairness'], name:'공정리더형', figure:'정약용', symbol:'👑',
    summary:'맡은 책임을 다하면서 합리적이고 공정한 기준으로 문제를 해결하려는 유형입니다.',
    mission:'공동의 일을 정할 때 이유와 기준을 먼저 공개하고 결정해보기'
  },
  {
    virtues:['restraint','fairness'], name:'청렴원칙형', figure:'정약용', symbol:'🌿',
    summary:'개인적 이익을 절제하고 공동체의 기준과 공익을 우선하려는 유형입니다.',
    mission:'나에게 이익이 되는 선택과 모두에게 공정한 선택을 비교해 후자를 실천해보기'
  }
];

window.getCheongryeomType = function(scoreMap){
  const order = CHEONGRYEOM_CONTENT.virtues.map((v, index) => ({
    key: v.key,
    name: v.name,
    score: Number(scoreMap?.[v.key] || 0),
    order: index
  }));

  const ranked = order
    .slice()
    .sort((a,b) => (b.score - a.score) || (a.order - b.order));

  // 응답 근거가 거의 없을 때는 억지로 역사 인물을 매칭하지 않는다.
  if ((ranked[0]?.score || 0) === 0 && (ranked[1]?.score || 0) === 0) {
    return {
      name:'청렴 탐색형',
      figure:'유형 판정 보류',
      symbol:'🌱',
      summary:'아직 청렴역량 유형을 판단할 수 있는 응답이 충분하지 않습니다.',
      mission:'다음 활동에서는 시간 안에 문항을 제출하고 나의 판단 기준을 확인해보기',
      primary: ranked[0] || {key:'honesty',name:'정직',score:0},
      secondary: ranked[1] || {key:'promise',name:'약속',score:0},
      pairKey:''
    };
  }

  const top = ranked.slice(0,2);
  const idx = Object.fromEntries(
    CHEONGRYEOM_CONTENT.virtues.map((v,i)=>[v.key,i])
  );
  const keys = top.map(x=>x.key).sort((a,b)=>idx[a]-idx[b]);
  const found = CHEONGRYEOM_TYPES.find(t =>
    t.virtues[0] === keys[0] && t.virtues[1] === keys[1]
  );

  return {
    ...(found || {
      name:'청렴 성장형', figure:'역사 인물 매칭 준비 중', symbol:'🌳',
      summary:'여러 청렴가치가 고르게 나타나는 성장형입니다.',
      mission:'가장 낮은 청렴역량 한 가지를 골라 오늘 실천해보기'
    }),
    primary: top[0],
    secondary: top[1],
    pairKey: keys.join('|')
  };
};


