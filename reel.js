/* ---------- scroll-scrubbed reel ---------- */
(function(){
    "use strict";
    const FRAME_BASE = 'https://cdn.jsdelivr.net/gh/en100798-ai/frame_for_portfolio@main/frames/frame_';
    const FRAME_COUNT = 244;
    const SRC = Array.from({length: FRAME_COUNT}, (_, i) => FRAME_BASE + String(i+1).padStart(3,'0') + '.jpg');
    const N = SRC.length;
    const V1_FRAMES = 122;
    const V1FRAC = Math.min(1, V1_FRAMES / N);

   const vCanvas = document.getElementById('video'), vCtx = vCanvas.getContext('2d');
    const tCanvas = document.getElementById('textLayer'), tCtx = tCanvas.getContext('2d');
    const track = document.getElementById('track');

   let W=0, H=0, DPR=Math.min(window.devicePixelRatio||1,2);
    const images=new Array(N); let imgW=1928, imgH=1072, current=-1;

   const CAPTIONS=[
     { lines:[ {text:'Design',size:128,italic:false,weight:400},
              {text:'is not decoration',size:64,italic:false,weight:400,gap:74} ],
            x:0.105, y:0.46, align:'left', range:[0.10,0.185,0.44,0.52] },
     { lines:[ {text:'It’s business',size:64,italic:true,weight:400},
              {text:'infrastructure',size:64,italic:true,weight:400,gap:59} ],
            x:0.10, y:0.64, align:'left', range:[0.60,0.70,0.92,1.0] }
       ];

   const BLOCK=7; let cols=0, rows=0, thresh=null;
    function buildGrid(){ cols=Math.ceil(W/BLOCK)+1; rows=Math.ceil(H/BLOCK)+1;
                             thresh=new Float32Array(cols*rows); for(let i=0;i<thresh.length;i++) thresh[i]=Math.random(); }

   const off=document.createElement('canvas'); const offCtx=off.getContext('2d');

   function resize(){
         W=window.innerWidth; H=window.innerHeight; DPR=Math.min(window.devicePixelRatio||1,2);
         for(const c of [vCanvas,tCanvas,off]){ c.width=Math.round(W*DPR); c.height=Math.round(H*DPR); }
         vCtx.setTransform(DPR,0,0,DPR,0,0); tCtx.setTransform(DPR,0,0,DPR,0,0); offCtx.setTransform(DPR,0,0,DPR,0,0);
         buildGrid(); current=-1; render(true);
   }
    function drawFrame(idx){
          const img=images[idx]; if(!img||!img.complete||!img.naturalWidth) return;
          const iw=img.naturalWidth||imgW, ih=img.naturalHeight||imgH;
          const s=Math.max(W/iw,H/ih), dw=iw*s, dh=ih*s, dx=(W-dw)/2, dy=(H-dh)/2;
          vCtx.clearRect(0,0,W,H); vCtx.drawImage(img,dx,dy,dw,dh);
    }
    function drawCaption(cap,p,alpha){
          if(alpha<=0.001) return;
          offCtx.clearRect(0,0,W,H); offCtx.textBaseline='alphabetic'; offCtx.textAlign=cap.align;
          offCtx.fillStyle='#fff'; offCtx.shadowColor='rgba(0,0,0,0.25)'; offCtx.shadowBlur=Math.round(W*0.012);
          let y=H*cap.y;
          for(const ln of cap.lines){ const fs=Math.round(ln.size); if(ln.gap) y+=ln.gap;
                                           offCtx.font=(ln.italic?'italic ':'')+(ln.weight||400)+' '+fs+"px 'Reading Wogue', Georgia, serif";
                                           offCtx.fillText(ln.text, W*cap.x, y); y+=fs*0.08; }
          offCtx.shadowBlur=0;
          const soft=0.14, pp=p*(1+soft);
          for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){
                  const t=thresh[r*cols+c]; let a=(pp-t)/soft; if(a<=0) continue; if(a>1) a=1;
                  tCtx.globalAlpha=a*alpha;
                  const sx=Math.round(c*BLOCK*DPR), sy=Math.round(r*BLOCK*DPR), b=Math.round(BLOCK*DPR);
                  tCtx.drawImage(off, sx,sy,b,b, c*BLOCK,r*BLOCK,BLOCK,BLOCK);
          }}
          tCtx.globalAlpha=1;
    }

   function captionState(cap,gp){
         const [a,b,cc,d]=cap.range; if(gp<a) return {p:0,alpha:0};
         let p=gp<b?(gp-a)/(b-a):1, alpha;
         if(gp<=cc) alpha=1; else if(gp<d) alpha=1-(gp-cc)/(d-cc); else alpha=0;
         return {p,alpha};
   }
    let lastGP=-1;
    function render(force){
          const maxScroll=track.offsetHeight-window.innerHeight;
          const top=track.offsetTop;
          const gp=maxScroll>0?Math.min(1,Math.max(0,(window.scrollY-top)/maxScroll)):0;
          const idx=Math.min(N-1,Math.max(0,Math.round(gp*(N-1))));
          if(idx!==current){ drawFrame(idx); current=idx; }
          if(force||gp!==lastGP){
                  tCtx.clearRect(0,0,W,H);
                  const gp1=V1FRAC>0?Math.min(1.3,gp/V1FRAC):gp;
                  for(const cap of CAPTIONS){ const st=captionState(cap,gp1); if(st.alpha>0) drawCaption(cap,st.p,st.alpha); }
                  lastGP=gp;
          }
    }
    let ticking=false;
    function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(()=>{ render(false); ticking=false; }); } }

   let loaded=0;
    function preload(){
          for(let i=0;i<N;i++){
                  const img=new Image();
                  img.onload=img.onerror=()=>{ loaded++; if(i===0){ imgW=img.naturalWidth||imgW; imgH=img.naturalHeight||imgH; } if(loaded===N) start(); };
                  img.src=SRC[i]; images[i]=img;
          }
    }
    async function start(){
          try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; }catch(e){}
          resize();
          window.addEventListener('scroll', onScroll, {passive:true});
          window.addEventListener('resize', resize);
          render(true);
          const rl=document.getElementById('reelLoading'); if(rl){ rl.classList.add('hide'); setTimeout(()=>rl.remove(),600); }
    }
    preload();
})();
