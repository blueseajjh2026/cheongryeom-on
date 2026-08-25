(function(){
'use strict';
function setup(){const s=document.getElementById('serverStatus');if(s){s.textContent='심사 데모 · 실제 교사용 UI';s.classList.add('online')}const title=document.getElementById('roomTitleInput');if(title)title.value='청렴ON 심사위원 가상수업 · 25명';const note=document.createElement('div');note.className='privacy-note';note.style.margin='0 0 14px';note.innerHTML='<b>심사위원 실전 데모</b><br>실제 교사용 v8.6.1 화면과 같은 CSS·콘텐츠·평가로직을 사용합니다. 수업방 개설 시 5대 전공별 가상학생 25명이 자동 입장하며 서버에는 저장되지 않습니다.';const setupBlock=document.getElementById('roomSetup');if(setupBlock)setupBlock.parentNode.insertBefore(note,setupBlock);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,80));else setTimeout(setup,80);
})();