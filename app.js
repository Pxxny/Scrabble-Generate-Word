/* CSW24 Study Lab - dictionary stays in Csw24.txt */
const KEY='csw24-study-v1';
const state={
  words:[], wordSet:new Set(), anagramMap:new Map(), scoreMap:new Map(),
  data:loadData(), generated:[], quiz:null, typing:null, rack:null
};
const SCRABBLE={A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};
function loadData(){try{return JSON.parse(localStorage.getItem(KEY))||{cards:{},settings:{language:'en',theme:'system',accent:'#6c63ff',dashMin:5,dashMax:9,dashboardRefreshOnly:true}}}catch{return {cards:{},settings:{}}}}
function saveData(){localStorage.setItem(KEY,JSON.stringify(state.data))}
function score(w){return [...w].reduce((n,c)=>n+(SCRABBLE[c]||0),0)}
function sig(w){return [...w].sort().join('')}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function sample(a,n){return shuffle([...a]).slice(0,n)}
function esc(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
async function loadDictionary(text=null){
  try{
    if(!text){
      const r=await fetch('Csw24.txt',{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      text=await r.text();
    }
    state.words=text.split(/\r?\n/).map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z]+$/.test(x));
    state.wordSet=new Set(state.words);
    state.scoreMap=new Map(state.words.map(w=>[w,score(w)]));
    state.anagramMap=new Map();
    for(const w of state.words){const s=sig(w);if(!state.anagramMap.has(s))state.anagramMap.set(s,[]);state.anagramMap.get(s).push(w)}
    for(const a of state.anagramMap.values())a.sort();
    document.getElementById('dictStatus').textContent=`CSW24 loaded · ${state.words.length.toLocaleString()} words`;
    document.getElementById('dictInfo').textContent=`${state.words.length.toLocaleString()} words loaded. Source: Csw24.txt`;
    fillListLengths(); renderDashboard(); renderLists();
  }catch(e){
    document.getElementById('dictStatus').textContent='Dictionary not loaded';
    document.getElementById('dictInfo').textContent='Could not fetch Csw24.txt. If you opened this HTML directly, run a local server (see README) or use Load another CSW text file below.';
  }
}
function nav(page){
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  if(page==='dashboard')renderDashboard();
  if(page==='cardbox')renderCardbox();
  if(page==='lists')renderLists();
}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>nav(b.dataset.page));
document.querySelectorAll('[data-page-jump]').forEach(b=>b.onclick=()=>nav(b.dataset.pageJump));
function due(c){return !c.due || c.due<=Date.now()}
function cardFor(w){return state.data.cards[w]||(state.data.cards[w]={word:w,box:0,due:0,seen:0,correct:0,wrong:0,last:0})}
function review(w,correct){
  const c=cardFor(w);c.seen++;c.last=Date.now();
  if(correct){c.correct++;c.box=Math.min(5,c.box+1)}
  else{c.wrong++;c.box=Math.max(0,c.box-2)}
  const intervals=[0,10*60e3,60*60e3,24*3600e3,3*86400e3,7*86400e3];
  c.due=Date.now()+(correct?intervals[c.box]:intervals[0]);
  saveData();
}
function anagrams(w){return state.anagramMap.get(sig(w))||[w]}
function cardWords(){return Object.keys(state.data.cards).filter(w=>state.wordSet.has(w))}
function addCards(words){words.forEach(w=>cardFor(w));saveData();renderCardbox()}
function renderDashboard(){
  const cards=cardWords(), dueN=cards.filter(w=>due(state.data.cards[w])).length;
  const seen=cards.reduce((n,w)=>n+state.data.cards[w].seen,0), correct=cards.reduce((n,w)=>n+state.data.cards[w].correct,0);
  document.getElementById('dashboardStats').innerHTML=[
    ['Cardbox',cards.length],['Reviews',seen],['Correct',correct],['Due now',dueN]
  ].map(x=>`<div class="stat"><span class="muted">${x[0]}</span><b>${x[1].toLocaleString()}</b></div>`).join('');
  const min=+state.data.settings.dashMin||5,max=+state.data.settings.dashMax||9;
  const pool=state.words.filter(w=>w.length>=min&&w.length<=max);
  const rec=sample(pool,12);
  document.getElementById('recommendations').innerHTML=rec.map(w=>`<div class="word-tile"><div class="word">${w}</div><span class="score">${score(w)} pts</span><div class="muted">${anagrams(w).length} anagram${anagrams(w).length===1?'':'s'}</div></div>`).join('');
}
document.getElementById('refreshRecommendations').onclick=renderDashboard;
function generateWords(){
  let min=Math.max(2,+document.getElementById('genMinLen').value),max=Math.min(15,+document.getElementById('genMaxLen').value),n=+document.getElementById('genCount').value;
  let pool=state.words.filter(w=>w.length>=min&&w.length<=max);
  let arr=document.getElementById('genOrder').value==='alpha'?pool.slice(0,n):sample(pool,Math.min(n,pool.length));
  state.generated=arr; renderGenerated();
}
function renderGenerated(){
  const inc=document.getElementById('genAnagrams').checked;
  document.getElementById('generatorOutput').innerHTML=state.generated.map(w=>{
    const aa=inc?anagrams(w):[];
    return `<div class="word-card"><input class="gen-check" type="checkbox" value="${w}"><div class="word-main"><div class="word">${w}</div><div class="score">${score(w)} pts</div></div><div><div class="muted">Signature: ${sig(w)}</div>${inc?`<div class="anagrams">${aa.map(x=>`<span class="chip">${x}</span>`).join('')}</div>`:''}</div></div>`;
  }).join('');
}
document.getElementById('generateBtn').onclick=generateWords;
document.getElementById('genAnagrams').onchange=renderGenerated;
document.getElementById('genSelectAll').onclick=()=>document.querySelectorAll('.gen-check').forEach(x=>x.checked=true);
document.getElementById('genSave').onclick=()=>addCards([...document.querySelectorAll('.gen-check:checked')].map(x=>x.value));

function startQuiz(){
  let n=Math.min(100,Math.max(1,+document.getElementById('quizCount').value)), mode=document.getElementById('quizMode').value;
  let src=document.getElementById('quizSource').value;
  let pool=src==='cardbox'?cardWords().filter(w=>due(state.data.cards[w])):state.words;
  if(!pool.length)pool=state.words;
  const words=sample(pool,Math.min(n,pool.length));
  state.quiz={words,index:0,mode,order:document.getElementById('quizAnagramOrder').value,revealed:false,selected:[]};
  renderQuiz();
}
function renderQuiz(){
  const q=state.quiz;if(!q||q.index>=q.words.length){finishQuiz();return}
  const w=q.words[q.index], aa=anagrams(w);
  let prompt=q.mode==='anagram'?(q.order==='alpha'?sig(w):shuffle([...w]).join('')):w;
  let body='';
  if(q.mode==='flashcard')body=`<div class="quiz-word">${w}</div><div class="muted">Score ${score(w)} · ${q.index+1}/${q.words.length}</div><div class="quiz-actions"><button id="reveal">Show</button></div><div id="answer" class="hidden"><div class="anagrams">${aa.map(x=>`<span class="chip">${x}</span>`).join('')}</div><div class="quiz-actions"><button class="bad" id="wrong">Again</button><button class="primary" id="right">Got it</button></div></div>`;
  else if(q.mode==='anagram')body=`<div class="muted">Find all valid words for these letters · ${q.index+1}/${q.words.length}</div><div class="quiz-word">${prompt}</div><input id="quizInput" class="quiz-input" autocomplete="off" autofocus placeholder="Type a word or press Enter"><div class="feedback" id="quizFeedback"></div><div id="found" class="anagrams"></div><div class="quiz-actions"><button id="anagramReveal">Show Answer</button><button id="nextQuiz" class="primary">Next</button></div>`;
  else body=`<div class="muted">Active Recall · ${q.index+1}/${q.words.length}</div><div class="quiz-word">${sig(w)}</div><input id="quizInput" class="quiz-input" autocomplete="off" autofocus placeholder="Type the word"><div class="feedback" id="quizFeedback"></div><div class="quiz-actions"><button id="checkRecall" class="primary">Check</button></div>`;
  document.getElementById('quizArea').innerHTML=`<div class="quiz-card">${body}</div>`;
  bindQuiz(w);
}
function bindQuiz(w){
  const q=state.quiz;
  const next=ok=>{review(w,ok);q.index++;renderQuiz()};
  if(q.mode==='flashcard'){
    document.getElementById('reveal').onclick=()=>document.getElementById('answer').classList.remove('hidden');
    document.getElementById('wrong').onclick=()=>next(false);document.getElementById('right').onclick=()=>next(true);
  }else if(q.mode==='active'){
    const inp=document.getElementById('quizInput'),fb=document.getElementById('quizFeedback');
    const check=()=>{const ok=inp.value.trim().toUpperCase()===w;fb.innerHTML=ok?`<span class="good">Correct — ${w}</span>`:`<span class="bad">Answer: ${w}</span>`;review(w,ok);document.getElementById('checkRecall').textContent='Next';document.getElementById('checkRecall').onclick=()=>{q.index++;renderQuiz()};};
    document.getElementById('checkRecall').onclick=check;inp.onkeydown=e=>{if(e.key==='Enter')check()};
  }else{
    const inp=document.getElementById('quizInput'),found=document.getElementById('found'),fb=document.getElementById('quizFeedback'), set=new Set();
    const submit=()=>{let v=inp.value.trim().toUpperCase();if(!v)return;if(anagrams(w).includes(v)){set.add(v);found.innerHTML=[...set].sort().map(x=>`<span class="chip">${x}</span>`).join('');fb.textContent='Found!'}else fb.textContent='Not in this anagram group';inp.value=''};
    inp.onkeydown=e=>{if(e.key==='Enter')submit()};
    document.getElementById('anagramReveal').onclick=()=>{found.innerHTML=anagrams(w).map(x=>`<span class="chip">${x}</span>`).join('');fb.textContent='Answer revealed'};
    document.getElementById('nextQuiz').onclick=()=>next(set.size===anagrams(w).length);
  }
}
function finishQuiz(){document.getElementById('quizArea').innerHTML=`<div class="panel"><h2>Quiz complete 🎉</h2><p>Review results are saved automatically in LocalStorage.</p><button class="primary" onclick="startQuiz()">Quiz Again</button></div>`;renderDashboard()}
document.getElementById('startQuiz').onclick=startQuiz;

function renderCardbox(){
 const out=document.getElementById('cardboxOutput'), words=cardWords().sort();
 if(!words.length){out.innerHTML='<div class="panel">Cardbox is empty. Save words from Generator, Quiz or Minigame.</div>';return}
 out.innerHTML=words.map(w=>{const c=state.data.cards[w];return `<div class="word-card"><input class="card-check" type="checkbox" value="${w}"><div class="word-main"><div class="word">${w}</div><div class="score">${score(w)} pts</div></div><div><div>Box ${c.box} · ${c.correct}/${c.seen} correct</div><div class="muted">${due(c)?'Due now':'Scheduled '+new Date(c.due).toLocaleString()}</div></div></div>`}).join('');
}
document.getElementById('cardSelectAll').onclick=()=>document.querySelectorAll('.card-check').forEach(x=>x.checked=true);
document.getElementById('cardDeleteSelected').onclick=()=>{document.querySelectorAll('.card-check:checked').forEach(x=>delete state.data.cards[x.value]);saveData();renderCardbox();renderDashboard()};
document.getElementById('cardStudy').onclick=()=>{nav('quiz');document.getElementById('quizSource').value='cardbox';startQuiz()};

function fillListLengths(){document.getElementById('listLen').innerHTML=Array.from({length:14},(_,i)=>`<option>${i+2}</option>`).join('')}
function renderLists(){
 if(!state.words.length)return;
 const len=+document.getElementById('listLen').value||2,type=document.getElementById('listFilterType').value,val=document.getElementById('listFilterValue').value.trim().toUpperCase(),sort=document.getElementById('listSort').value;
 let arr=state.words.filter(w=>w.length===len);
 if(type==='starts'&&val)arr=arr.filter(w=>w.startsWith(val));if(type==='ends'&&val)arr=arr.filter(w=>w.endsWith(val));if(type==='contains'&&val)arr=arr.filter(w=>w.includes(val));if(type==='all'&&val)arr=arr.filter(w=>[...val].every(c=>w.includes(c)));if(type==='score'&&val)arr=arr.filter(w=>score(w)>=+val);
 if(sort==='score')arr.sort((a,b)=>score(b)-score(a)||a.localeCompare(b));else arr.sort();
 document.getElementById('listOutput').innerHTML=arr.map(w=>`<div class="list-word"><span>${w}</span><span class="score">${score(w)}</span></div>`).join('');
}
['listLen','listFilterType','listFilterValue','listSort'].forEach(id=>document.getElementById(id).addEventListener('input',renderLists));

function startTyping(){
 let min=+typeMin.value,max=+typeMax.value, exact=typeExact.value,n=+typeCount.value;
 if(exact!=='range')min=max=+exact;
 let pool=state.words.filter(w=>w.length>=min&&w.length<=max);
 if(typeOrder.value==='alpha')pool=pool.slice().sort(); else pool=sample(pool,Math.min(n,pool.length));
 state.typing={words:pool.slice(0,n),i:0,typed:[],anagrams:typeAnagrams.checked,restart:typeRestartOnError.checked};
 renderTyping();
}
function renderTyping(){
 const t=state.typing;if(!t||t.i>=t.words.length){document.getElementById('typingArea').innerHTML=`<div class="panel"><h2>Typing complete 🎉</h2><button class="primary" onclick="startTyping()">Again</button></div>`;return}
 const w=t.words[t.i];
 document.getElementById('typingArea').innerHTML=`<div class="quiz-card"><div class="muted">${t.i+1}/${t.words.length}</div><div class="quiz-word">${w}</div><input id="typeInput" class="quiz-input" autocomplete="off" autofocus placeholder="Type the word"><div id="typedHistory" class="muted" style="margin-top:12px"></div><div id="typeFeedback" class="feedback"></div><div class="quiz-actions"><button id="typeSave">Save Word</button><button id="typeNext" class="primary">Next</button></div></div>`;
 const inp=document.getElementById('typeInput'),fb=document.getElementById('typeFeedback'),hist=document.getElementById('typedHistory');
 const submit=()=>{let v=inp.value.trim().toUpperCase();t.typed.push(v);hist.textContent='Typed: '+t.typed.join(' · ');if(v===w){fb.innerHTML='<span class="good">Correct</span>';review(w,true)}else{fb.innerHTML=`<span class="bad">Expected ${w}</span>`;if(t.restart){inp.value='';t.typed=[];hist.textContent='';return}review(w,false)}};
 inp.onkeydown=e=>{if(e.key==='Enter')submit()};
 document.getElementById('typeNext').onclick=()=>{t.i++;renderTyping()};
 document.getElementById('typeSave').onclick=()=>addCards([w]);
}
document.getElementById('startTyping').onclick=startTyping;
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.game-panel').forEach(x=>x.classList.remove('active'));document.getElementById('game-'+b.dataset.game).classList.add('active')});

function newRack(){
 const size=+rackSize.value, allow=rackBlanks.checked;
 const bag='EEEEEEEEEEEEAAAAAAAAAIIIIIIIII'+'OOOOOOOOOO'+'NNNNNNRRRRRR'+'TTTTTT'+'LLLLSSSSUUUU'+'DDDD'+'GGG'+'BBBCCCMP'+'FFHHVVWWYY'+'K'+'JQXZ';
 let r=[];for(let i=0;i<size;i++)r.push(allow&&Math.random()<.12?'_':bag[Math.floor(Math.random()*bag.length)]);
 state.rack=r;renderRack();
}
function rackCan(w,r){
 const counts={};r.forEach(c=>counts[c]=(counts[c]||0)+1);let blanks=counts._||0;
 for(const c of w){if(counts[c])counts[c]--;else if(blanks)blanks--;else return false}return true
}
function renderRack(){
 if(!state.rack)return;let answers=state.words.filter(w=>w.length<=state.rack.length&&rackCan(w,state.rack)).sort((a,b)=>b.length-a.length||a.localeCompare(b));
 document.getElementById('rackArea').innerHTML=`<div class="panel"><div class="rack">${state.rack.map(x=>`<div class="tile">${x}</div>`).join('')}</div><div class="rack-answer"><h2>${answers.length} playable words</h2><div class="anagrams">${answers.map(w=>`<span class="chip">${w} <b>${score(w)}</b></span>`).join('')}</div></div></div>`;
}
document.getElementById('newRack').onclick=newRack;

function exportData(){
 const blob=new Blob([JSON.stringify(state.data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='csw24-study-backup.json';a.click();URL.revokeObjectURL(a.href)
}
function importDataFile(file){
 const r=new FileReader();r.onload=()=>{try{state.data=JSON.parse(r.result);saveData();applySettings();renderDashboard();renderCardbox();alert('Data imported.')}catch{alert('Invalid JSON backup.')}};r.readAsText(file)
}
document.getElementById('exportData').onclick=exportData;document.getElementById('settingsExport').onclick=exportData;
document.getElementById('importData').onchange=e=>e.target.files[0]&&importDataFile(e.target.files[0]);
document.getElementById('settingsImport').onchange=e=>e.target.files[0]&&importDataFile(e.target.files[0]);
document.getElementById('resetProgress').onclick=()=>{if(confirm('Reset all Cardbox cards and progress?')){state.data.cards={};saveData();renderDashboard();renderCardbox()}};

function applySettings(){
 const s=state.data.settings||{};document.getElementById('language').value=s.language||'en';document.getElementById('theme').value=s.theme||'system';document.getElementById('accent').value=s.accent||'#6c63ff';document.getElementById('dashMin').value=s.dashMin||5;document.getElementById('dashMax').value=s.dashMax||9;document.getElementById('dashboardRefreshOnly').checked=s.dashboardRefreshOnly!==false;
 document.documentElement.style.setProperty('--accent',s.accent||'#6c63ff');document.body.classList.toggle('dark',(s.theme||'system')==='dark');
}
['language','theme','accent','dashMin','dashMax','dashboardRefreshOnly'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{state.data.settings={...state.data.settings,language:language.value,theme:theme.value,accent:accent.value,dashMin:+dashMin.value,dashMax:+dashMax.value,dashboardRefreshOnly:dashboardRefreshOnly.checked};saveData();applySettings();}));

document.getElementById('dictFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>loadDictionary(r.result);r.readAsText(f)}
document.getElementById('exportPng').onclick=()=>exportResultsImage('png');
document.getElementById('exportPdf').onclick=()=>window.print();
async function exportResultsImage(ext){
 const node=document.getElementById('generatorOutput');if(!node.innerHTML)return alert('Generate words first.');
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');const cards=[...node.children];canvas.width=1200;canvas.height=Math.max(300,cards.length*90+100);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg')||'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text')||'#111';ctx.font='bold 28px system-ui';ctx.fillText('CSW24 Generated Words',40,45);ctx.font='20px system-ui';cards.forEach((c,i)=>{const w=c.querySelector('.word')?.textContent||'';const sc=c.querySelector('.score')?.textContent||'';ctx.fillText(`${w}   ${sc}`,50,90+i*90);const chips=[...c.querySelectorAll('.chip')].map(x=>x.textContent).join(', ');ctx.font='15px system-ui';ctx.fillText(chips.slice(0,100),50,115+i*90);ctx.font='20px system-ui'});const a=document.createElement('a');a.href=canvas.toDataURL(ext==='jpg'?'image/jpeg':'image/png',.95);a.download='csw24-generated.'+(ext==='jpg'?'jpg':'png');a.click()
}
window.startQuiz=startQuiz;window.startTyping=startTyping;
applySettings();loadDictionary();
