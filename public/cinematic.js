/* Small, scroll-driven camera movement; no continuous JavaScript animation loop. */
(() => {
  'use strict';
  function initCinema() {
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const hero=document.querySelector('.hero');
    if(!hero)return;
    document.documentElement.classList.add('cinema-enabled');

    function prepareHeadings() {
      document.querySelectorAll('.section-heading h2,.editorial-copy h2,.menu-copy h2,.photo-intro h2').forEach(node=>{
        if(node.querySelector('.cinema-word'))return;
        const label=node.textContent.trim();
        const words=label.split(/\s+/);
        node.classList.add('cinema-heading');
        node.setAttribute('aria-label',label);
        const fragment=document.createDocumentFragment();
        words.forEach((word,index)=>{
          if(index)fragment.append(document.createTextNode(' '));
          const span=document.createElement('span');
          span.className='cinema-word';
          span.textContent=word;
          span.setAttribute('aria-hidden','true');
          span.style.setProperty('--word-delay',Math.min(index*65,455)+'ms');
          fragment.append(span);
        });
        node.replaceChildren(fragment);
      });
    }
    prepareHeadings();
    document.addEventListener('wedding:languagechange',prepareHeadings);

    let frame=0;
    function draw() {
      frame=0;
      const rect=hero.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height)));
      const moving=!reduced.matches && !document.hidden;
      // Only the foreground shifts; the shared opening portrait keeps its frame.
      hero.style.setProperty('--content-y',(moving?-progress*24:0)+'px');
      hero.style.setProperty('--content-fade',moving?String(1-Math.min(.75,progress*.85)):'1');
    }
    function schedule() {
      if(frame||document.hidden)return;
      frame=requestAnimationFrame(draw);
    }
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    reduced.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',schedule);
    draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCinema,{once:true});
  else initCinema();
})();
