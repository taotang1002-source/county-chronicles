/* COUNTY CHRONICLES B3 — FICTIONAL PLATFORM BEHAVIOR.
   Separate from editor and Supabase. Does not change artwork or export. */
(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const scoreEl = document.getElementById('realnessScore');
  if (!canvas || !scoreEl) return;
  const $ = id => document.getElementById(id);
  const fill = $('realnessFill'), status = $('realnessStatus');
  const tags = $('platformTags'), message = $('platformMessage');
  const activity = $('platformActivity'), toast = $('platformToast');
  const explanation = $('scoreExplanation');
  const categoryTags = { people:'#HUMAN_ELEMENT', objects:'#VINTAGE_OBJECT', buildings:'#COUNTY_ARCHITECTURE' };
  const categoryPhrases = {
    people:'HUMAN PRESENCE DETECTED. EMOTIONAL VALUE INCREASED.',
    objects:'EVERYDAY OBJECT APPROVED AS NOSTALGIC EVIDENCE.',
    buildings:'ARCHITECTURE ACCEPTED. LOCATION NOT REQUIRED.'
  };
  let toastTimer, updateTimer, lastSignature = '', suppressUntil = 0;
  let lastCounts = { images:0, text:0, categories:new Set() };
  function items() { return [...canvas.querySelectorAll('.canvas-item')]; }
  function snapshot() {
    const all = items(), images = all.filter(x=>!!x.querySelector('img'));
    const text = all.filter(x=>x.classList.contains('dialogue-item')).length;
    const categories = new Set(images.map(x=>x.dataset.category).filter(Boolean));
    return { images:images.length, text, categories, all };
  }
  function announce(line) {
    if (message) message.textContent = line;
    if (activity) {
      const entry = document.createElement('div'); entry.className='activity-entry';
      entry.textContent=line; activity.prepend(entry);
      while(activity.children.length>5) activity.lastElementChild.remove();
    }
    if(toast) {
      toast.textContent=line;toast.classList.add('visible');
      clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2700);
    }
  }
  function update() {
    const now = snapshot();
    const score = Math.min(99.9,24+now.images*9.5+now.categories.size*8.5+now.text*3);
    scoreEl.innerHTML=score.toFixed(1)+'<span>%</span>';
    if(fill) fill.style.width=score+'%';
    if(status) status.textContent=now.images===0?'INSUFFICIENT REALITY':score>=80?'PLATFORM APPROVED — PERFECTLY MEDIATED':'YOUR REALITY IS BEING OPTIMIZED';
    if(tags){
      const labels=['#COUNTYCORE','#NOSTALGIA',...[...now.categories].map(c=>categoryTags[c]).filter(Boolean)];
      tags.replaceChildren(...labels.map(t=>{const e=document.createElement('span');e.textContent=t;return e;}));
    }
    const signature=[now.images,now.text,[...now.categories].sort().join(',')].join('|');
    if(signature!==lastSignature){
      if(lastSignature && Date.now()>=suppressUntil){
        if(now.images>lastCounts.images){
          const added=[...now.categories].find(c=>!lastCounts.categories.has(c));
          announce(added ? categoryPhrases[added] : 'ANOTHER FRAGMENT ADDED. AUTHENTICITY REWARDED.');
        } else if(now.images<lastCounts.images){
          announce(now.images===0 && now.text===0?'REALITY RESET. THE PLATFORM IS STILL HERE.':'CONTENT REMOVED. YOUR NARRATIVE IS BEING RECALIBRATED.');
        } else if(now.text>lastCounts.text){
          announce('A NEW CAPTION. THE PLATFORM NOW HAS A STORY.');
        } else if(now.text<lastCounts.text){
          announce('NARRATIVE REMOVED. IMAGES REMAIN.');
        }
      }
      lastSignature=signature;
      lastCounts={images:now.images,text:now.text,categories:now.categories};
    }
  }
  const observer = new MutationObserver(mutations=>{
    // Ignore edits inside canvas items (control buttons, text typing, etc.).
    if(!mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1 && n.classList?.contains('canvas-item'))))return;
    clearTimeout(updateTimer);updateTimer=setTimeout(update,45);
  });
  observer.observe(canvas,{childList:true});
  update();
  scoreEl.addEventListener('click',()=>{
    if(explanation){explanation.hidden=!explanation.hidden;
      if(!explanation.hidden) announce('THE SCORE MEASURES CONFORMITY, NOT REALITY.');}
  });
  $('makeAnotherCountyBtn')?.addEventListener('click',()=>{
    suppressUntil=Date.now()+1200;
    announce('ALGORITHM ENGINE™: A MORE SHAREABLE MEMORY IS BEING GENERATED.');
    setTimeout(()=>{
      update();
      if(snapshot().images>0) announce('YOUR NEW COUNTY HAS BEEN APPROVED. ORIGINAL LOCATION: IRRELEVANT.');
    },180);
  });
  // Only report successful uploads: observing a new card in the library avoids
  // claiming upload succeeded when user cancels or Supabase rejects the file.
  const library = document.querySelector('.library');
  if(library){
    let initialized=false;
    const libObserver=new MutationObserver(mutations=>{
      if(!initialized)return;
      if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1 && n.classList?.contains('user-material')))){
        announce('UPLOAD ACCEPTED. YOUR IMAGE IS NOW A REUSABLE PLATFORM ASSET.');
      }
    });
    libObserver.observe(library,{childList:true,subtree:true});
    // Initial loading is not an upload event.
    setTimeout(()=>{initialized=true;},2500);
  }
})();
