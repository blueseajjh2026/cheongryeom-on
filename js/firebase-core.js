(function(){
const cfg=window.CHEONGRYEOM_FIREBASE||{};
const configured=cfg.apiKey&&!String(cfg.apiKey).startsWith('YOUR_')&&cfg.databaseURL&&!String(cfg.databaseURL).includes('YOUR_PROJECT');
let db=null,auth=null,uid=null;
async function init(){if(!configured)throw new Error('FIREBASE_NOT_CONFIGURED');if(!firebase.apps.length)firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.database();const cred=await auth.signInAnonymously();uid=cred.user.uid;return {uid,db};}
const roomRef=(code,path='')=>db.ref(`rooms/${code}${path?'/'+path:''}`);
async function roomExists(code){return (await roomRef(code,'meta').once('value')).exists();}
async function createRoom(code,title){if(await roomExists(code))throw new Error('이미 사용 중인 참여코드입니다.');const now=Date.now();await roomRef(code).set({meta:{hostUid:uid,title:title||'청렴ON 청렴역량 자격시험',createdAt:now,status:'open'},control:{stage:'waiting',index:0,phase:'pre',reveal:false,locked:false,updatedAt:now},publicStats:{participantCount:0}});}
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
window.CheongDB={configured,init,roomExists,createRoom,joinRoom,heartbeat,setControl,submitAnswer,savePledge,updateMe,publishStats,deleteRoom,on,once,get uid(){return uid},get db(){return db}};
})();