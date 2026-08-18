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
    {key:'practical',name:'실기평가',short:'실기'},
    {key:'process',name:'과정평가',short:'과정'},
    {key:'diagnosis',name:'역량진단',short:'진단'},
    {key:'pledge',name:'청렴실천',short:'실천'},
    {key:'result',name:'자격판정',short:'결과'}
  ],
  intro:{
    title:'청렴은 정답을 외우는 지식보다, 선택의 순간에 드러나는 역량입니다.',
    body:'학교생활과 디지털 환경에서 실제로 마주칠 수 있는 상황을 스스로 판단하고, 친구들의 생각과 비교·토론하며 나만의 청렴 기준을 만들어 봅니다.'
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
    {id:'p1',title:'실기 ① 축제 예산 30만 원',context:'학급 축제 부스의 회계를 맡았습니다. 친한 친구가 “우리 삼촌 가게에서 사자. 다른 곳보다 조금 비싸지만 서비스는 더 줄 거야.”라고 제안합니다.',q:'가장 먼저 어떤 판단을 하겠습니까?',options:[
      {text:'친구가 부탁했으니 그 가게에서 바로 구매한다.',score:25,impact:{fairness:20,responsibility:35,restraint:30}},
      {text:'여러 판매처의 가격·품질·조건을 같은 기준으로 비교한 뒤 결정한다.',score:100,impact:{fairness:100,responsibility:85,restraint:65}},
      {text:'친구와 관련된 가게는 무조건 제외한다.',score:72,impact:{fairness:70,responsibility:55}},
      {text:'내가 결정하면 책임이 생기므로 다른 친구에게 맡긴다.',score:42,impact:{responsibility:20,fairness:45}}
    ]},
    {id:'p2',title:'실기 ② 남은 예산 17,000원',context:'행사가 끝난 뒤 예산 17,000원이 남았습니다. 친구들이 “우리 고생했으니까 이 돈으로 음료수 사 먹자. 이 정도는 괜찮잖아.”라고 합니다.',q:'가장 청렴한 판단에 가까운 것은?',options:[
      {text:'금액이 작으므로 수고한 학생끼리 사용한다.',score:28,impact:{restraint:20,responsibility:30}},
      {text:'반 친구 과반이 찬성하면 사용한다.',score:55,impact:{fairness:50,restraint:45}},
      {text:'남은 예산의 처리 기준을 확인하고 사용내역과 잔액을 학급에 공개한다.',score:100,impact:{restraint:100,responsibility:95,honesty:80}},
      {text:'문제가 생기지 않도록 다른 학생에게 돈을 넘긴다.',score:38,impact:{responsibility:20}}
    ]},
    {id:'p3',title:'실기 ③ 사라진 영수증',context:'정산 중 친한 친구가 영수증 한 장을 잃어버렸습니다. 친구는 “다른 영수증 금액에 조금 섞어서 적으면 아무도 몰라.”라고 제안합니다.',q:'당신이라면 어떻게 하겠습니까?',options:[
      {text:'친구를 위해 이번 한 번은 모른 척한다.',score:22,impact:{honesty:15,care:35}},
      {text:'사실을 그대로 공유하고 증빙이 없어진 상황을 해결할 수 있는 방법을 함께 찾는다.',score:100,impact:{honesty:100,responsibility:95,care:70}},
      {text:'친구의 실수이므로 모든 책임을 친구에게 넘긴다.',score:62,impact:{honesty:70,responsibility:40,care:20}},
      {text:'금액이 작다면 기록에서 빼고 넘어간다.',score:30,impact:{honesty:25,responsibility:30}}
    ]}
  ],
  process:[
    {id:'d1',title:'청렴 판단 LAB ① 친구와 규칙',context:'친한 친구가 학교 규칙을 어긴 사실을 알게 되었습니다. 친구는 “우리 사이인데 말하지 않을 거지?”라고 부탁합니다.',q:'친구의 잘못을 선생님에게 알리는 것은 청렴한 행동일까요?',options:['그렇다','아니다','상황에 따라 다르다'],discussion:['규칙 위반으로 피해를 보는 사람이 있는가?','친구를 배려하는 것과 잘못을 숨기는 것은 어떻게 다른가?','공정·책임·배려가 충돌한다면 어떤 기준이 필요한가?']},
    {id:'d2',title:'청렴 판단 LAB ② 단체 채팅방',context:'반 단체 채팅방에서 시험 범위와 관련된 미확인 정보가 빠르게 퍼지고 있습니다. 출처를 묻는 친구에게 누군가 “다들 알고 있으니 그냥 믿어”라고 말합니다.',q:'확실하지 않은 정보를 전달하지 않는 것도 청렴과 관련이 있을까요?',options:['그렇다','아니다','상황에 따라 다르다'],discussion:['정보를 전달하는 사람에게 어떤 책임이 있는가?','사실 확인이 필요한 이유는 무엇인가?','정직과 책임은 온라인 공간에서 어떻게 나타나는가?']}
  ],
  scoring:{writtenWeight:30,practicalWeight:40,processWeight:20,pledgeWeight:10,leaderTotal:85,leaderPractical:80}
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

