(function(){
const cfg=window.CHEONGRYEOM_FIREBASE||{};
const configured=cfg.apiKey&&!String(cfg.apiKey).startsWith('YOUR_')&&cfg.databaseURL&&!String(cfg.databaseURL).includes('YOUR_PROJECT');
let db=null,auth=null,uid=null,idToken=null,transport='auto';
const isWindowsPC=/Windows NT/i.test(navigator.userAgent||'');
const isTeacherPage=/\/teacher\.html$/i.test(window.location?.pathname||'');
const useHttpsFallback=isWindowsPC&&isTeacherPage;
const restBase=String(cfg.databaseURL||'').replace(/\/+$/,'');

function withTimeout(promise,ms,message){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{
      timer=setTimeout(()=>{
        const e=new Error(message||'SERVER_TIMEOUT');
        e.code='SERVER_TIMEOUT';
        reject(e);
      },ms);
    })
  ]).finally(()=>clearTimeout(timer));
}

function encodedPath(path=''){
  return String(path).split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

async function refreshIdToken(force=false){
  if(!auth?.currentUser)throw new Error('AUTH_REQUIRED');
  idToken=await withTimeout(auth.currentUser.getIdToken(force),15000,'서버 인증정보 확인이 지연되고 있습니다.');
  return idToken;
}

async function restRequest(method,code,path='',payload,allowAuthRetry=true){
  if(!idToken)await refreshIdToken();
  const suffix=encodedPath(path);
  const url=`${restBase}/rooms/${encodeURIComponent(code)}${suffix?'/'+suffix:''}.json?auth=${encodeURIComponent(idToken)}`;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);

  try{
    const response=await fetch(url,{
      method,
      cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:payload===undefined?undefined:JSON.stringify(payload),
      signal:controller.signal
    });

    if(response.status===401&&allowAuthRetry){
      await refreshIdToken(true);
      return restRequest(method,code,path,payload,false);
    }

    const text=await response.text();
    let data=null;
    if(text){
      try{data=JSON.parse(text);}catch(_){data=text;}
    }

    if(!response.ok){
      const detail=typeof data==='object'&&data?.error?data.error:`서버 오류(${response.status})`;
      const e=new Error(detail);
      e.code=/permission denied/i.test(String(detail))?'PERMISSION_DENIED':`HTTP_${response.status}`;
      throw e;
    }

    return data;
  }catch(e){
    if(e?.name==='AbortError'){
      const timeoutError=new Error('일반 HTTPS 방식에서도 Firebase 서버 응답이 지연되고 있습니다.');
      timeoutError.code='SERVER_TIMEOUT';
      throw timeoutError;
    }
    if(!e?.code&&e instanceof TypeError)e.code='NETWORK_ERROR';
    throw e;
  }finally{
    clearTimeout(timer);
  }
}

async function init(){
  if(!configured)throw new Error('FIREBASE_NOT_CONFIGURED');
  if(!firebase.apps.length)firebase.initializeApp(cfg);

  if(isWindowsPC&&!useHttpsFallback&&firebase.database?.INTERNAL?.forceLongPolling){
    try{firebase.database.INTERNAL.forceLongPolling();transport='long-polling';}catch(e){console.warn('Firebase long-polling 설정을 적용하지 못했습니다.',e);}
  }

  auth=firebase.auth();
  db=firebase.database();
  const cred=await withTimeout(auth.signInAnonymously(),15000,'실시간 서버 인증 응답이 지연되고 있습니다.');
  uid=cred.user.uid;

  if(useHttpsFallback){
    idToken=await withTimeout(cred.user.getIdToken(),15000,'서버 인증정보 확인이 지연되고 있습니다.');
    transport='https-polling';
  }

  return {uid,db,transport};
}

const roomRef=(code,path='')=>db.ref(`rooms/${code}${path?'/'+path:''}`);

async function roomExists(code){
  if(transport==='https-polling')return (await restRequest('GET',code,'meta'))!==null;
  return (await withTimeout(roomRef(code,'meta').once('value'),15000,'수업방 확인 중 서버 응답이 지연되고 있습니다.')).exists();
}

async function createRoom(code,title){
  if(await roomExists(code))throw new Error('이미 사용 중인 참여코드입니다.');
  const now=Date.now();
  const room={meta:{hostUid:uid,title:title||'청렴ON 청렴역량 자격시험',createdAt:now,status:'open'},control:{stage:'waiting',index:0,phase:'pre',reveal:false,locked:false,updatedAt:now},publicStats:{participantCount:0}};
  if(transport==='https-polling')return restRequest('PUT',code,'',room);
  return withTimeout(roomRef(code).set(room),15000,'수업방 저장 중 서버 응답이 지연되고 있습니다.');
}

async function joinRoom(code,studentName,schoolLevel){
  if(!(await roomExists(code)))throw new Error('수업방을 찾을 수 없습니다.');
  const now=Date.now();
  if(transport==='https-polling'){
    await restRequest('PATCH',code,`participants/${uid}`,{studentName,schoolLevel,joinedAt:now});
    await restRequest('PUT',code,`presence/${uid}`,{studentName,at:now});
    return uid;
  }
  await roomRef(code,`participants/${uid}`).update({studentName,schoolLevel,joinedAt:now});
  const pres=roomRef(code,`presence/${uid}`);
  await pres.set({studentName,at:now});
  pres.onDisconnect().remove();
  return uid;
}

async function heartbeat(code){
  if(!uid)return;
  if(transport==='https-polling')return restRequest('PATCH',code,`presence/${uid}`,{at:Date.now()});
  return roomRef(code,`presence/${uid}`).update({at:Date.now()});
}

async function setControl(code,patch){
  const data={...patch,updatedAt:Date.now()};
  if(transport==='https-polling')return restRequest('PATCH',code,'control',data);
  return roomRef(code,'control').update(data);
}

async function submitAnswer(code,stage,key,payload){
  const data={...payload,at:Date.now()};
  if(transport==='https-polling')return restRequest('PUT',code,`answers/${stage}/${key}/${uid}`,data);
  return roomRef(code,`answers/${stage}/${key}/${uid}`).set(data);
}

async function savePledge(code,text){
  const data={text,at:Date.now()};
  if(transport==='https-polling')return restRequest('PUT',code,`pledges/${uid}`,data);
  return roomRef(code,`pledges/${uid}`).set(data);
}

async function updateMe(code,patch){
  if(transport==='https-polling')return restRequest('PATCH',code,`participants/${uid}`,patch);
  return roomRef(code,`participants/${uid}`).update(patch);
}

async function updateParticipant(code,participantUid,patch){
  if(transport==='https-polling')return restRequest('PATCH',code,`participants/${participantUid}`,patch);
  return roomRef(code,`participants/${participantUid}`).update(patch);
}

async function publishStats(code,data){
  const value={...data,updatedAt:Date.now()};
  if(transport==='https-polling')return restRequest('PUT',code,'publicStats',value);
  return roomRef(code,'publicStats').set(value);
}

async function deleteRoom(code){
  if(transport==='https-polling')return restRequest('DELETE',code);
  return roomRef(code).remove();
}

function on(path,code,cb){
  if(transport==='https-polling'){
    let active=true;
    let busy=false;
    let last='__INITIAL__';
    const poll=async()=>{
      if(!active||busy)return;
      busy=true;
      try{
        const value=await restRequest('GET',code,path);
        const serialized=JSON.stringify(value);
        if(serialized!==last){last=serialized;cb(value);}
      }catch(e){console.warn(`HTTPS 현황 조회 실패: ${path}`,e);}
      finally{busy=false;}
    };
    void poll();
    const timer=setInterval(poll,2000);
    return()=>{active=false;clearInterval(timer);};
  }
  const r=roomRef(code,path);
  const fn=s=>cb(s.val());
  r.on('value',fn);
  return()=>r.off('value',fn);
}

function once(path,code){
  if(transport==='https-polling')return restRequest('GET',code,path);
  return roomRef(code,path).once('value').then(s=>s.val());
}

window.CheongDB={configured,init,roomExists,createRoom,joinRoom,heartbeat,setControl,submitAnswer,savePledge,updateMe,updateParticipant,publishStats,deleteRoom,on,once,get uid(){return uid},get db(){return db},get transport(){return transport}};
})();
