(function(){
const cfg=window.CHEONGRYEOM_FIREBASE||{};
const configured=cfg.apiKey&&!String(cfg.apiKey).startsWith('YOUR_')&&cfg.databaseURL&&!String(cfg.databaseURL).includes('YOUR_PROJECT');
let db=null,auth=null,uid=null,transport='auto';
const isWindowsPC=/Windows NT/i.test(navigator.userAgent||'');
function withTimeout(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{const e=new Error(message||'SERVER_TIMEOUT');e.code='SERVER_TIMEOUT';reject(e);},ms);})]).finally(()=>clearTimeout(timer));}
async function init(){
  if(!configured)throw new Error('FIREBASE_NOT_CONFIGURED');
  if(!firebase.apps.length)firebase.initializeApp(cfg);
  if(isWindowsPC&&firebase.database?.INTERNAL?.forceLongPolling){
    try{firebase.database.INTERNAL.forceLongPolling();transport='long-polling';}catch(e){console.warn('Firebase long-polling 설정을 적용하지 못했습니다.',e);}
  }
  auth=firebase.auth();
  db=firebase.database();
  const cred=await withTimeout(auth.signInAnonymously(),15000,'실시간 서버 인증 응답이 지연되고 있습니다.');
  uid=cred.user.uid;
  return {uid,db,transport};
}
const roomRef=(code,path='')=>db.ref(`rooms/${code}${path?'/'+path:''}`);
async function roomExists(code){return (await withTimeout(roomRef(code,'meta').once('value'),15000,'수업방 확인 중 서버 응답이 지연되고 있습니다.')).exists();}
async function createRoom(code,title){if(await roomExists(code))throw new Error('이미 사용 중인 참여코드입니다.');const now=Date.now();await withTimeout(roomRef(code).set({meta:{hostUid:uid,title:title||'청렴ON 청렴역량 자격시험',createdAt:now,status:'open'},control:{stage:'waiting',index:0,phase:'pre',reveal:false,locked:false,updatedAt:now},publicStats:{participantCount:0}}),15000,'수업방 저장 중 서버 응답이 지연되고 있습니다.');}
async function joinRoom(code,studentName,schoolLevel){if(!(await roomExists(code)))throw new Error('수업방을 찾을 수 없습니다.');const now=Date.now();await roomRef(code,`participants/${uid}`).update({studentName,schoolLevel,joinedAt:now});const pres=roomRef(code,`presence/${uid}`);await pres.set({studentName,at:now});pres.onDisconnect().remove();return uid;}
async function heartbeat(code){if(!uid)return;return roomRef(code,`presence/${uid}`).update({at:Date.now()});}
async function setControl(code,patch){return roomRef(code,'control').update({...patch,updatedAt:Date.now()});}
async function submitAnswer(code,stage,key,payload){return roomRef(code,`answers/${stage}/${key}/${uid}`).set({...payload,at:Date.now()});}
async function savePledge(code,text){return roomRef(code,`pledges/${uid}`).set({text,at:Date.now()});}
async function updateMe(code,patch){return roomRef(code,`participants/${uid}`).update(patch);}
async function publishStats(code,data){return roomRef(code,'publicStats').set({...data,updatedAt:Date.now()});}
async function deleteRoom(code){return roomRef(code).remove();}
function on(path,code,cb){const r=roomRef(code,path);const fn=s=>cb(s.val());r.on('value',fn);return()=>r.off('value',fn);}
function once(path,code){return roomRef(code,path).once('value').then(s=>s.val());}
window.CheongDB={configured,init,roomExists,createRoom,joinRoom,heartbeat,setControl,submitAnswer,savePledge,updateMe,publishStats,deleteRoom,on,once,get uid(){return uid},get db(){return db},get transport(){return transport}};
})();
