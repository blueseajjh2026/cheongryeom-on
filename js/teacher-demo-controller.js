(function(){
'use strict';
function setup(){const s=document.getElementById('serverStatus');if(s){s.textContent='v8.8.3';s.classList.add('online')}const title=document.getElementById('roomTitleInput');if(title)title.value='청렴ON 심사위원 가상수업 · 25명';const note=document.createElement('div');note.className='privacy-note';note.style.margin='0 0 14px';note.innerHTML='<b>심사용 운영 시뮬레이션</b><br>실제 교육에서는 교사용 PC와 학생 개인 휴대폰이 실시간으로 연결되어 단계 제어·응답·피드백·팀 협업이 함께 진행됩니다. 이 화면은 심사를 위해 5대 전공별 가상학생 25명의 수업 흐름을 한 화면에서 확인할 수 있도록 구성했으며 서버에는 저장되지 않습니다.';const setupBlock=document.getElementById('roomSetup');if(setupBlock)setupBlock.parentNode.insertBefore(note,setupBlock);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,80));else setTimeout(setup,80);
})();
