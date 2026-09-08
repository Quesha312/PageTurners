'use strict';

const get = function(k){return localStorage.getItem(k);};
const set = function(k,v){return localStorage.setItem(k,v);};
const rm  = function(k){return localStorage.removeItem(k);};
const $   = function(id){return document.getElementById(id);};
const rnd = function(k){return DM[k][Math.floor(Math.random()*DM[k].length)];};

const S = {
  name:'', streak:{count:0,lastDate:null}, prog:{}, lastBk:null,
  sessSec:0, sessDone:false, timerOn:false, timerH:null,
  bkId:null, pages:[], pg:0
};

const LS = {
  save:function(){
    try{
      set('n',S.name); set('str',JSON.stringify(S.streak));
      set('prg',JSON.stringify(S.prog)); set('lbk',String(S.lastBk||''));
      set('ses',JSON.stringify({d:isoToday(),s:S.sessSec,done:S.sessDone}));
    }catch(e){}
  },
  load:function(){
    try{
      S.name=get('n')||'';
      S.streak=JSON.parse(get('str')||'{"count":0,"lastDate":null}');
      S.prog=JSON.parse(get('prg')||'{}');
      S.lastBk=Number(get('lbk'))||null;
      var sess=JSON.parse(get('ses')||'{}'),t=isoToday();
      if(sess.d===t){S.sessSec=sess.s||0;S.sessDone=sess.done||false;}
    }catch(e){}
  },
  cachePages:function(id,pages){
    try{set('pg_'+id,JSON.stringify(pages));}
    catch(e){
      for(var i=0;i<BOOKS.length;i++){if(get('pg_'+BOOKS[i].id)&&BOOKS[i].id!==id){rm('pg_'+BOOKS[i].id);break;}}
      try{set('pg_'+id,JSON.stringify(pages));}catch(e2){}
    }
  },
  getPages:function(id){try{var r=get('pg_'+id);return r?JSON.parse(r):null;}catch(e){return null;}}
};

function isoToday(){return new Date().toISOString().slice(0,10);}
function isoYest(){var d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}
function last7(){
  return Array.from({length:7},function(_,i){
    var d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10);
  });
}

function applyStreak(){
  var t=isoToday(),y=isoYest(),ld=S.streak.lastDate;
  if(ld===t)return;
  S.streak={count:ld===y?S.streak.count+1:1,lastDate:t};
  LS.save();
}

var DM={
  w:["Hi! I'm Dewey! \uD83E\uDD89 Ready to explore some amazing books?","Books are like magic doors \u2014 let's open one! \u2728","Welcome to PageTurners! I've been waiting! \uD83D\uDCDA"],
  h0:["Start your streak today \u2014 just 20 minutes! \uD83D\uDD25","A great adventure is waiting for you!","Every book is a new world to explore! \uD83C\uDF0D"],
  hs:["You're on a streak \u2014 keep it going! \uD83D\uDD25","Your brain is leveling up! \uD83E\uDDE0","You're a true bookworm! \uD83D\uDCDA"],
  s:["Your 20-minute adventure begins now! \uD83C\uDF89","Timer started! Let's dive in! \uD83D\uDCD6","Ready\u2026 set\u2026 read! \uD83D\uDE80"],
  m10:["Halfway there! You're doing amazing! \uD83C\uDF1F","10 minutes down \u2014 keep it up! \uD83D\uDD25","You're on a roll! \uD83D\uDCDA"],
  m18:["Almost done! Just 2 more minutes! \u23F0","Final stretch \u2014 you've got this! \uD83D\uDCAA","Nearly 20 minutes! Incredible! \uD83C\uDF1F"],
  done:["You did it! 20 whole minutes! \uD83C\uDF89","Incredible reading session! \uD83D\uDCDA\u2728","You're a reading superstar! \u2B50"],
  tap:["Hi there! Keep reading! \uD83D\uDCD6","Tap \u203A to go forward!","You're doing great! \uD83E\uDD89","Did you know owls love books? \uD83D\uDE04"],
  err:["That book is being shy. Try again! \uD83E\uDD89","Having trouble loading. Check your WiFi! \uD83D\uDCF6"]
};

var _deweyTimer=null;
function deweySpeak(msg,ms){
  if(ms===undefined)ms=4400;
  var bub=$('dewey-bubble');
  if(!bub)return;
  bub.textContent=msg;
  bub.classList.add('vis');
  clearTimeout(_deweyTimer);
  _deweyTimer=setTimeout(function(){bub.classList.remove('vis');},ms);
}
function deweyTap(){deweySpeak(rnd('tap'),3200);}

var _retryId=null;
function showS(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=$(id);if(el)el.classList.add('active');
  var dw=$('dewey-wrap');
  if(dw)dw.style.display=(id==='sh'||id==='sshelf')?'flex':'none';
  if(id==='sh')renderHome();
  if(id==='sshelf')renderShelf();
}
function setRS(st){
  var ldr=$('rldr'),pg=$('rpg'),err=$('rerr');
  [ldr,pg,err].forEach(function(e){if(e)e.classList.add('hidden');});
  if(st==='loading'&&ldr)ldr.classList.remove('hidden');
  if(st==='reading'&&pg)pg.classList.remove('hidden');
  if(st==='error'&&err)err.classList.remove('hidden');
}

function renderHome(){
  applyStreak();
  var c=S.streak.count;
  var hg=$('hgreet'),hs=$('hsub');
  if(hg)hg.textContent='Hey, '+S.name+'! \uD83D\uDC4B';
  if(hs)hs.textContent=S.sessDone?'Session done today! Great work! \u2705':'Ready to read today?';
  var ss=$('sstreak');
  if(ss)ss.textContent=c+' day streak'+(c===1?'':'s');
  var pct=Math.min(100,(S.sessSec/SESSEC)*100);
  var fill=$('hmpfill');if(fill)fill.style.width=pct+'%';
  var dotsEl=$('sdots');
  if(dotsEl){
    var days=last7(),rd=new Set();
    var t=isoToday(),y=isoYest();
    if(S.streak.lastDate===t||S.streak.lastDate===y){
      var d=new Date(S.streak.lastDate),cnt=S.streak.count;
      while(cnt-->0){rd.add(d.toISOString().slice(0,10));d.setDate(d.getDate()-1);}
    }
    dotsEl.innerHTML=days.map(function(day){return '<div class="sdot'+(rd.has(day)?' on':'')+'"></div>';}).join('');
  }
  var bdy=$('hbody');if(!bdy)return;
  var secsLeft=Math.max(0,SESSEC-S.sessSec),minsLeft=Math.ceil(secsLeft/60),html='';
  if(!S.sessDone){
    html+='<div class="today-card"><div class="t-icon p">\uD83D\uDCD6</div><div class="t-info"><div class="t-title">Today\'s Reading Goal</div><div class="t-detail">'+minsLeft+' minute'+(minsLeft===1?'':'s')+' left to earn your streak!</div><div class="miniprog" style="margin-top:8px"><div class="miniprog-fill" style="width:'+pct+'%"></div></div></div></div>';
  }else{
    html+='<div class="today-card" style="background:#d4f5e9"><div class="t-icon d">\u2705</div><div class="t-info"><div class="t-title">Today\'s Goal: Done!</div><div class="t-detail">Amazing! You read for 20 minutes today!</div></div></div>';
  }
  if(S.lastBk&&S.prog[S.lastBk]){
    var bk=BOOKS.find(function(b){return b.id===S.lastBk;});
    var p=S.prog[S.lastBk],fp=p.tot>0?Math.round((p.pg/p.tot)*100):0;
    if(bk){html+='<p class="sec-label">Continue Reading</p><div class="cont-card" onclick="openBook('+bk.id+')"><div class="cont-cover" style="background:'+bk.c+'"><img src="https://covers.openlibrary.org/b/id/'+bk.id+'-M.jpg" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" alt="'+bk.t+'"><div class="bfallback" style="display:none;background:'+bk.c+'"><span class="be">'+bk.e+'</span></div></div><div class="cont-info"><div class="cont-title">'+bk.t+'</div><div class="cont-auth">'+bk.a+'</div><div class="prog-bar"><div class="prog-fill" style="width:'+fp+'%"></div></div><div class="prog-txt">Page '+(p.pg+1)+' of '+(p.tot||'?')+'</div></div></div>';}
  }
  html+='<button class="browse-btn" onclick="showS(\'sshelf\')">\uD83D\uDCDA Browse All Books</button>';
  bdy.innerHTML=html;
  setTimeout(function(){deweySpeak(rnd(c>0?'hs':'h0'),5000);},700);
}

function renderShelf(){
  var grid=$('bkgrid');if(!grid)return;
  grid.innerHTML=BOOKS.map(function(bk){
    var p=S.prog[bk.id],pct=p&&p.tot>0?Math.round((p.pg/p.tot)*100):0;
    return '<div class="bcard" onclick="openBook('+bk.id+')"><div class="bcover" style="background:'+bk.c+'"><img src="https://covers.openlibrary.org/b/id/'+bk.id+'-M.jpg" onerror="this.style.display=\'none\';this.parentElement.querySelector(\'.bfallback\').style.display=\'flex\'" alt="'+bk.t+'"><div class="bfallback" style="background:'+bk.c+'"><span class="be">'+bk.e+'</span><span class="bt">'+bk.t+'</span></div>'+(pct>0?'<div class="bpill">'+pct+'%</div>':'')+'</div><div class="btitle">'+bk.t+'</div><div class="bauth">'+bk.a+'</div></div>';
  }).join('');
}

function stripGb(text){
  var u=text.toUpperCase(),i,nl,j;
  var ss=['*** START OF THE PROJECT GUTENBERG','***START OF THE PROJECT GUTENBERG'];
  var es=['*** END OF THE PROJECT GUTENBERG','***END OF THE PROJECT GUTENBERG'];
  for(j=0;j<ss.length;j++){i=u.indexOf(ss[j]);if(i!==-1){nl=text.indexOf('\n',i);text=text.slice(nl+1);u=text.toUpperCase();break;}}
  for(j=0;j<es.length;j++){i=u.indexOf(es[j]);if(i!==-1){text=text.slice(0,i);break;}}
  return text.replace(/\r\n/g,'\n').trim();
}
function paginate(text){
  var words=text.replace(/\n{3,}/g,'\n\n').split(/\s+/).filter(Boolean),pages=[],i;
  for(i=0;i<words.length;i+=WPP){pages.push(words.slice(i,i+WPP).join(' '));}
  return pages.length?pages:null;
}
async function fetchPages(id){
  var base='https://www.gutenberg.org/cache/epub/'+id+'/pg'+id+'.txt';
  var urls=[base,'https://www.gutenberg.org/files/'+id+'/'+id+'-0.txt',
    'https://corsproxy.io/?'+encodeURIComponent(base),
    'https://api.allorigins.win/raw?url='+encodeURIComponent(base)];
  for(var u of urls){
    try{
      var res=await fetch(u,{signal:AbortSignal.timeout(15000)});
      if(!res.ok)continue;
      var txt=await res.text(),clean=stripGb(txt);
      if(clean.length>2000)return paginate(clean);
    }catch(e){continue;}
  }
  return null;
}

async function openBook(id){
  _retryId=id;S.bkId=id;S.lastBk=id;LS.save();
  var bk=BOOKS.find(function(b){return b.id===id;});
  $('rtitle').textContent=bk?bk.t:'Reading\u2026';
  showS('sreader');
  var pages=LS.getPages(id);
  if(!pages){
    if(EMBEDDED[id]){
      pages=paginate(EMBEDDED[id]);LS.cachePages(id,pages);
      var previewLen=pages.length;
      fetchPages(id).then(function(full){
        if(full&&full.length>previewLen){
          LS.cachePages(id,full);
          if(S.bkId===id){S.pages=full;S.prog[id].tot=full.length;renderPg();var lb=$('load-more-bar');if(lb)lb.remove();}
        }
      }).catch(function(){});
      setTimeout(function(){
        if(S.bkId===id&&S.pages.length===previewLen){
          var lb=document.createElement('div');lb.id='load-more-bar';
          lb.style.cssText='position:fixed;bottom:70px;left:0;right:0;background:var(--primary);color:white;text-align:center;padding:10px 16px;font-size:.82rem;font-weight:700;z-index:60;cursor:pointer;';
          lb.innerHTML='\uD83D\uDCD6 Showing preview \u2013 '+previewLen+' pages loaded. <u>Tap to load full book</u>';
          lb.onclick=function(){
            lb.innerHTML='\u23F3 Loading full book\u2026';
            fetchPages(id).then(function(full){
              if(full){LS.cachePages(id,full);S.pages=full;S.prog[id].tot=full.length;renderPg();lb.remove();}
              else{lb.innerHTML='\u26A0\uFE0F Couldn\'t load. Try on school WiFi with Chrome.';setTimeout(function(){lb.remove();},4000);}
            }).catch(function(){lb.innerHTML='\u26A0\uFE0F Couldn\'t load. Check connection.';setTimeout(function(){lb.remove();},4000);});
          };
          document.body.appendChild(lb);
        }
      },4000);
    }else{
      setRS('loading');pages=await fetchPages(id);if(pages)LS.cachePages(id,pages);
    }
  }
  if(!pages||!pages.length){setRS('error');return;}
  S.pages=pages;
  if(!S.prog[id])S.prog[id]={pg:0,tot:pages.length};
  else S.prog[id].tot=pages.length;
  S.pg=S.prog[id].pg||0;
  setRS('reading');renderPg();
  if(!S.sessDone){startTimer();setTimeout(function(){deweySpeak(rnd('s'),4200);},400);}
  else{setTimeout(function(){deweySpeak('Just browsing? Great taste! \uD83D\uDCDA',3500);},400);}
}
function retryBook(){if(_retryId)openBook(_retryId);}
function leaveReader(){
  stopTimer();var lb=$('load-more-bar');if(lb)lb.remove();showS('sh');
}
function renderPg(dir){
  var el=$('rpg');if(!el||!S.pages||!S.pages.length)return;
  el.className='r-pgtext'+(dir==='next'?' aR':dir==='prev'?' aL':'');
  el.textContent=S.pages[S.pg]||'';
  $('rprev').disabled=S.pg===0;
  $('rnext').disabled=S.pg===S.pages.length-1;
  $('rpginfo').textContent='Page '+(S.pg+1)+' of '+S.pages.length;
  if(!S.prog[S.bkId])S.prog[S.bkId]={pg:S.pg,tot:S.pages.length};
  else{S.prog[S.bkId].pg=S.pg;S.prog[S.bkId].tot=S.pages.length;}
  LS.save();void el.offsetHeight;
}
function nextPg(){if(S.pg<S.pages.length-1){S.pg++;renderPg('next');}}
function prevPg(){if(S.pg>0){S.pg--;renderPg('prev');}}

function startTimer(){if(S.timerOn||S.sessDone)return;S.timerOn=true;S.timerH=setInterval(tickTimer,1000);updateTimerUI();}
function stopTimer(){S.timerOn=false;clearInterval(S.timerH);S.timerH=null;}
function tickTimer(){
  S.sessSec++;LS.save();updateTimerUI();
  var rem=SESSEC-S.sessSec;
  if(rem===600)deweySpeak(rnd('m10'),4000);
  if(rem===120)deweySpeak(rnd('m18'),4000);
  if(rem<=0){stopTimer();S.sessDone=true;applyStreak();LS.save();showCel();}
}
function updateTimerUI(){
  var rem=Math.max(0,SESSEC-S.sessSec),m=Math.floor(rem/60),s=rem%60;
  var el=$('rtimer');if(el)el.textContent=m+':'+(s<10?'0':'')+s;
  var fill=$('rtfill');if(fill)fill.style.width=Math.min(100,(S.sessSec/SESSEC)*100)+'%';
}

function startReading(){
  var inp=$('ninput'),name=(inp?inp.value:'').trim();
  if(!name){
    deweySpeak('I need your name first! \uD83E\uDD89',2200);
    if(inp){inp.style.borderColor='var(--red)';setTimeout(function(){inp.style.borderColor='';},1600);}
    return;
  }
  S.name=name;LS.save();showS('sh');setTimeout(function(){deweySpeak(rnd('w'),5000);},450);
}

function showCel(){
  var ov=$('cel-overlay');if(!ov)return;
  ov.classList.add('on');
  $('celmsg').textContent='You read for a full 20 minutes!';
  $('celstreak').textContent='\uD83D\uDD25 '+S.streak.count;
  $('cellbl').textContent='day streak'+(S.streak.count===1?'':'s')+'!';
  confetti();deweySpeak(rnd('done'),5000);
}
function closeCel(){var ov=$('cel-overlay');if(ov)ov.classList.remove('on');showS('sh');}
function confetti(){
  var colors=['#f5c842','#5c4f8a','#e8825c','#3db87a','#e94560','#9b59b6'];
  for(var i=0;i<50;i++){
    (function(i){
      var el=document.createElement('div');el.className='conf';
      el.style.cssText='left:'+Math.random()*100+'%;top:-10px;width:'+(6+Math.random()*8)+'px;height:'+(6+Math.random()*8)+'px;background:'+colors[i%colors.length]+';animation-duration:'+(2+Math.random()*2)+'s;animation-delay:'+(Math.random()*.8)+'s;';
      document.body.appendChild(el);setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},4500);
    })(i);
  }
}

function buildOwl(){
  return '<ellipse cx="40" cy="55" rx="28" ry="33" fill="#8B6914"/>'+
    '<ellipse cx="40" cy="54" rx="24" ry="28" fill="#f5c842"/>'+
    '<ellipse cx="29" cy="42" rx="13" ry="15" fill="#3d2f6b"/>'+
    '<ellipse cx="51" cy="42" rx="13" ry="15" fill="#3d2f6b"/>'+
    '<circle cx="29" cy="42" r="9" fill="#fff"/>'+
    '<circle cx="51" cy="42" r="9" fill="#fff"/>'+
    '<circle cx="31" cy="41" r="6" fill="#3d2f6b"/>'+
    '<circle cx="53" cy="41" r="6" fill="#3d2f6b"/>'+
    '<circle cx="32" cy="40" r="3" fill="#1a1a2e"/>'+
    '<circle cx="54" cy="40" r="3" fill="#1a1a2e"/>'+
    '<circle cx="33" cy="39" r="1.2" fill="#fff"/>'+
    '<circle cx="55" cy="39" r="1.2" fill="#fff"/>'+
    '<ellipse cx="40" cy="51" rx="6" ry="4" fill="#e8825c"/>'+
    '<polygon points="40,47 37,53 43,53" fill="#f5a623"/>'+
    '<ellipse cx="28" cy="27" rx="10" ry="11" fill="#8B6914"/>'+
    '<ellipse cx="52" cy="27" rx="10" ry="11" fill="#8B6914"/>'+
    '<ellipse cx="28" cy="28" rx="7" ry="8" fill="#f5c842"/>'+
    '<ellipse cx="52" cy="28" rx="7" ry="8" fill="#f5c842"/>'+
    '<rect x="22" y="13" width="36" height="5" fill="#5c4f8a" rx="2.5"/>'+
    '<polygon points="40,4 22,14 58,14" fill="#5c4f8a"/>'+
    '<line x1="58" y1="14" x2="64" y2="23" stroke="#f5c842" stroke-width="2.5" stroke-linecap="round"/>'+
    '<circle cx="64" cy="24" r="3.5" fill="#f5c842"/>'+
    '<line x1="33" y1="88" x2="27" y2="93" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>'+
    '<line x1="33" y1="88" x2="33" y2="94" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>'+
    '<line x1="33" y1="88" x2="39" y2="93" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>'+
    '<line x1="47" y1="88" x2="41" y2="93" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>'+
    '<line x1="47" y1="88" x2="47" y2="94" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>'+
    '<line x1="47" y1="88" x2="53" y2="93" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/>';
}

function init(){
  var owlHTML=buildOwl();
  document.querySelectorAll('.owl-svg').forEach(function(el){el.innerHTML=owlHTML;});
  LS.load();
  if(S.name)showS('sh');
  else{showS('sw');setTimeout(function(){deweySpeak(rnd('w'),5500);},800);}
}
init();
