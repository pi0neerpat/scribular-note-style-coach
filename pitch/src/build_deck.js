const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Scribular';
pptx.subject = 'Pitch deck';
pptx.title = 'Scribular — Local AI, made usable';
pptx.company = 'Scribular';
pptx.lang = 'en-US';
pptx.theme = { headFontFace: 'Cambria', bodyFontFace: 'Arial', lang: 'en-US' };
pptx.defineSlideMaster({
  title: 'LIGHT', background: { color: 'FFFFFF' },
  objects: [
    { text: { text: 'SCRIBULAR', options: { x: 0.52, y: 7.1, w: 2, h: 0.22, fontFace: 'Arial', fontSize: 10, bold: true, charSpacing: 1.8, color: '527366', margin: 0 } } },
    { text: { text: 'PRIVATE BY DESIGN  ·  HUMAN BY DEFAULT', options: { x: 7.6, y: 7.1, w: 5.2, h: 0.22, fontFace: 'Arial', fontSize: 10, charSpacing: 0.8, color: '71857C', align: 'right', margin: 0 } } },
  ],
  masterName: 'LIGHT'
});
pptx.defineSlideMaster({ title: 'DARK', background: { color: '143D32' }, objects: [], masterName: 'DARK' });
const C = { forest:'143D32', forest2:'235947', ink:'1E332B', muted:'60766D', sage:'A9C9B8', mint:'DDEFE6', pale:'F1F7F3', coral:'B44832', white:'FFFFFF', line:'B9D1C5', gold:'E7C88D' };
const SW=13.333, SH=7.5;
const out=path.join(__dirname,'..','output');
function t(slide,text,x,y,w,h,opt={}) { slide.addText(text,{x,y,w,h,margin:0,fontFace:opt.fontFace||'Arial',fontSize:opt.fontSize||16,color:opt.color||C.ink,breakLine:false,fit:'shrink',valign:opt.valign||'mid',bold:opt.bold||false,italic:opt.italic||false,align:opt.align||'left',charSpacing:opt.charSpacing||0,transparency:0,paraSpaceAfterPt:0,hyperlink:opt.hyperlink,bullet:opt.bullet, ...opt}); }
function rect(s,x,y,w,h,fill,line=fill,r=0.1,extra={}) { s.addShape(r ? pptx.ShapeType.roundRect : pptx.ShapeType.rect,{x,y,w,h,rectRadius:r,fill:{color:fill},line:{color:line,transparency:line===fill?100:0,width:1},...extra}); }
function ln(s,x1,y1,x2,y2,color,width=1,dash='solid') { s.addShape(pptx.ShapeType.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,dashType:dash,beginArrowType:'none',endArrowType:'none'}}); }
function circ(s,x,y,d,fill,line=fill) { s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:fill},line:{color:line,width:1}}); }
function notes(s,body){s.addNotes(body.replace(/\\n/g,'\n'))}
function addBridge(s,{x=1.05,y=4.55,w=11.15,complete=false,showLabels=true,large=false}={}) {
  const deckY=y+0.3, span=w, steps=complete?5:4, stepW=span/steps, bridgeColor=complete?'BFDCCB':C.forest2;
  // Water and abutments
  ln(s,x,deckY+0.67,x+w,deckY+0.67,'D9E9E0',1.2);
  rect(s,x-0.04,deckY-0.03,0.25,0.93,C.forest2,C.forest2,0.02);
  rect(s,x+w-0.21,deckY-0.03,0.25,0.93,C.forest2,C.forest2,0.02);
  // walk surface bridge segments
  for(let i=0;i<steps;i++){
    const missing=!complete && i===steps-1;
    const sx=x+i*stepW;
    if(missing){
      ln(s,sx+0.02,deckY+0.3,sx+stepW-0.16,deckY+0.3,'E57861',7,'dash');
      circ(s,sx+stepW-0.12,deckY+0.19,0.22,C.white,'E57861');
      if(showLabels) t(s,'BUILT TODAY',sx+0.03,deckY-0.34,stepW-0.05,0.24,{fontSize:11.5,bold:true,color:C.coral,align:'center'});
    } else {
      ln(s,sx,deckY+0.3,sx+stepW,deckY+0.3,bridgeColor,8);
      if(i>0 || complete){
        const cx=sx+stepW/2;
        s.addShape(pptx.ShapeType.arc,{x:cx-stepW*0.44,y:deckY+0.31,w:stepW*0.88,h:0.72,angleRange:[180,0],line:{color:C.sage,width:2},fill:{color:C.white,transparency:100}});
      }
    }
  }
  // deck rail + supports
  ln(s,x,deckY+0.14,x+w-(complete?0:stepW),deckY+0.14,bridgeColor,2);
  for(let i=0;i<=steps;i++){
    const bx=x+i*stepW;
    if(!complete && i===steps-1) continue;
    ln(s,bx,deckY+0.14,bx,deckY+0.29,bridgeColor,1.3);
  }
  if(showLabels){
    const labels=complete?['LOCAL · PRIVATE','EASY TO USE','CLINICIAN REVIEWED','SELF-SERVICE STYLE']:['LOCAL · PRIVATE','EASY TO USE','CLINICIAN REVIEWED','SELF-SERVICE STYLE'];
    for(let i=0;i<4;i++){
      const slotW=w/4-0.15, slotX=x+i*w/4+0.075;
      t(s,labels[i],slotX,deckY+0.83,slotW,0.3,{fontSize:12,bold:true,color:bridgeColor,align:'center'});
    }
  }
}
function baseLight(){return pptx.addSlide('LIGHT')}

// 1 — Human hook
{
 const s=baseLight();
 t(s,'A HUMAN PROBLEM',0.72,0.62,4,0.28,{fontSize:11,bold:true,color:C.forest2,charSpacing:1.7});
 t(s,'She became a therapist\nto help people.',0.72,1.05,7.0,1.55,{fontFace:'Cambria',fontSize:39,bold:true,color:C.forest});
 t(s,'Paperwork is getting in the way.',0.76,2.86,6.3,0.48,{fontSize:21,color:C.muted});
 // evocative desk / care path illustration, all editable shapes
 rect(s,8.2,0.95,4.35,3.75,C.pale,C.pale,0.16);
 // sun/light field
 circ(s,10.95,1.28,0.78,'EAF4EE','EAF4EE');
 // doorway and client-side room
 rect(s,11.18,2.15,0.78,1.85,'FFFFFF','A9C9B8',0.06,{line:{color:'A9C9B8',width:1.2}});
 rect(s,11.42,2.4,0.15,1.55,'DDEFE6','DDEFE6',0.02);
 // two seated figures / counseling conversation
 circ(s,10.12,2.08,0.42,C.forest2); circ(s,10.87,2.15,0.38,'D89979');
 s.addShape(pptx.ShapeType.arc,{x:9.92,y:2.42,w:0.83,h:0.8,angleRange:[180,0],line:{color:C.forest2,width:5},fill:{color:C.white,transparency:100}});
 s.addShape(pptx.ShapeType.arc,{x:10.73,y:2.48,w:0.77,h:0.73,angleRange:[180,0],line:{color:'D89979',width:5},fill:{color:C.white,transparency:100}});
 // path to client interrupted by paperwork pile
 ln(s,8.62,4.03,11.7,4.03,C.sage,2,'dash');
 // note pages
 [[8.55,3.02,-7],[8.93,2.91,4],[9.28,3.14,8]].forEach(([x,y,rot],i)=>{
   s.addShape(pptx.ShapeType.rect,{x,y,w:0.87,h:1.03,rotate:rot,fill:{color:i===1?'FFFFFF':'F7FAF8'},line:{color:'BCD0C5',width:1}});
   ln(s,x+0.15,y+0.28,x+0.65,y+0.28,'A9C9B8',1);
   ln(s,x+0.15,y+0.43,x+0.7,y+0.43,'A9C9B8',1);
   ln(s,x+0.15,y+0.58,x+0.55,y+0.58,'A9C9B8',1);
 });
 t(s,'NOTES',8.47,4.18,1.7,0.24,{fontSize:10,bold:true,color:C.muted,charSpacing:1.4,align:'center'});
 // title takeaway
 t(s,'The work she loves is on the other side of the paperwork.',0.76,5.28,9.9,0.5,{fontFace:'Cambria',fontSize:21,italic:true,color:C.forest2});
 notes(s,`[SLIDE 1]\nMy wife became a therapist because she wanted to help people. But the paperwork gets in the way, and it's draining the love she has for her profession.`);
}
// 2 — Privacy & evidence
{
 const s=baseLight();
 t(s,'PRIVACY',0.72,0.62,3,0.28,{fontSize:11,bold:true,color:C.forest2,charSpacing:1.7});
 t(s,'AI could help. Confidentiality\nchanges everything.',0.72,1.0,8.1,1.45,{fontFace:'Cambria',fontSize:38,bold:true,color:C.forest});
 t(s,'AI-using small businesses name trust and reliability as real concerns.',0.76,2.5,8.0,0.78,{fontSize:20,color:C.muted});
 // comparison chart
 t(s,'AI-RELATED CONCERNS',0.78,3.42,4.6,0.25,{fontSize:10,bold:true,color:C.muted,charSpacing:1.5});
 t(s,'Reliability & accuracy',0.78,3.92,3.1,0.3,{fontSize:16,bold:true});
 rect(s,3.98,3.94,3.15,0.24,'E5EFEA','E5EFEA',0.1);
 rect(s,3.98,3.94,1.4175,0.24,C.sage,C.sage,0.1);
 t(s,'45%',7.32,3.78,1.15,0.52,{fontSize:27,bold:true,color:C.forest2});
 t(s,'Data security & privacy',0.78,4.72,3.1,0.34,{fontSize:15.5,bold:true});
 rect(s,3.98,4.77,3.15,0.24,'E5EFEA','E5EFEA',0.1);
 rect(s,3.98,4.77,1.323,0.24,C.forest2,C.forest2,0.1);
 t(s,'42%',7.32,4.6,1.15,0.52,{fontSize:27,bold:true,color:C.forest2});
 // quote-like insight panel
 rect(s,8.85,2.7,3.75,2.48,C.forest,C.forest,0.16);
 t(s,'For therapy, privacy\nis a condition of care.',9.15,2.95,3.2,1.05,{fontFace:'Cambria',fontSize:22,bold:true,color:C.white,valign:'mid'});
 t(s,'Local processing keeps the session on the clinician’s terms.',9.15,4.15,3.2,0.75,{fontSize:15,color:'DDEFE6'});
 // Source clickable caption
 t(s,'Source: SBE Council · Small Business Technology Use Survey (Mar 2026), p. 38',0.78,5.66,8.1,0.22,{fontSize:11,color:C.muted,hyperlink:{url:'https://sbecouncil.org/wp-content/uploads/2026/03/SBE-Technology-Use-Survey-March-2026-Final-2.pdf'}});
 t(s,'Q20: n=425 AI-tool users; overall survey n=517 owners, 2–99 employees; Feb 17–23, 2026.',0.78,5.92,9.7,0.22,{fontSize:10,color:C.muted});
 notes(s,`[SLIDE 2]\nAI could help, but therapy is confidential. And its not just in therapy- In our research, privacy and security ranked as the top concern for small businesses who need AI.\n\nEDITORIAL NOTE: The cited public research does NOT support the “top concern” / #1 ranking claim. Q20 reports reliability and accuracy concerns at 45%, and data security/privacy risks at 42%, among 425 users of AI tools. Recommend saying “a major concern.” Method: online survey by TechnoMetrica using panel partners; fielded February 17–23, 2026; 517 owners at firms with 2–99 employees; stated credibility interval ±4.4 percentage points.\n\nEXACT Q20 BASE/SOURCE: “Q20. What are your company's main concerns about using AI? (Please select all that apply). Base=425 Users of AI tools, +/-5.0 PTS”. Source: SBE Council, Small Business Technology Use Survey (March 2026), printed p. 38.`);
}
// 3 — Bridge + product
{
 const s=baseLight();
 t(s,'THE GAP',0.72,0.62,3,0.28,{fontSize:11,bold:true,color:C.forest2,charSpacing:1.7});
 t(s,'Local AI exists. Making it\nuseful is the gap.',0.72,1.0,8.6,1.4,{fontFace:'Cambria',fontSize:38,bold:true,color:C.forest});
 t(s,'Scribular turns a private transcript into a draft note—and lets clinicians shape the result themselves.',0.76,2.5,8.7,0.78,{fontSize:20,color:C.muted});
 // product identity
 rect(s,9.55,0.72,3.15,1.28,C.pale,C.pale,0.18);
 circ(s,9.85,1.07,0.42,C.forest2);
 t(s,'S',9.85,1.07,0.42,0.42,{fontFace:'Cambria',fontSize:21,bold:true,color:C.white,align:'center'});
 t(s,'Scribular',10.43,0.94,2.15,0.36,{fontFace:'Cambria',fontSize:20,bold:true,color:C.forest});
 t(s,'LOCAL AI · CLINICIAN-LED',10.43,1.36,2.2,0.26,{fontSize:10,bold:true,color:C.muted});
 // Bridge labels and captions
 addBridge(s,{x:0.86,y:3.63,w:11.62,complete:false,showLabels:true});
 t(s,'Scribular today:  transcript  →  draft note',1.12,6.07,5.2,0.35,{fontSize:14,bold:true,color:C.forest2});
 t(s,'Built today:  customize in plain language',6.55,6.07,5.15,0.35,{fontSize:14,bold:true,color:C.forest2,align:'right'});
 t(s,'Today: the final segment, in the clinician’s own words.',3.2,6.5,7.0,0.28,{fontSize:12,italic:true,color:C.coral,align:'center'});
 notes(s,`[SLIDE 3]\nLocal models exist, and its no problem for big business IT departments to build and maintain it. But its a huge hurdle for small businesses. Its costly and requires technical expertise.\n\nIntroducing Scribular- it already turns a session transcript into a draft note with local processing. Today, we built self-service customization, so clinicians stop emailing us or engineering prompts by hand.`);
}
// 4 — Demo stage
{
 const s=pptx.addSlide('DARK');
 // Plain demo placeholder stage
 circ(s,0.85,0.76,0.12,C.sage); t(s,'LIVE PRODUCT WALKTHROUGH',1.08,0.7,5.2,0.24,{fontSize:11,bold:true,color:'DDEFE6',charSpacing:1.8});
 t(s,'DEMO',0.72,2.15,11.9,1.65,{fontFace:'Cambria',fontSize:96,bold:true,color:C.white,align:'center'});
 t(s,'Transcript  →  draft  →  request  →  review  →  preview  →  save',1.0,4.15,11.33,0.5,{fontSize:20,color:'DDEFE6',align:'center'});
 t(s,'A clinician stays in control at every step.',1.0,4.9,11.33,0.44,{fontSize:18,italic:true,color:'A9C9B8',align:'center'});
 t(s,'SCRIBULAR',0.86,7.04,2,0.24,{fontSize:10,bold:true,color:'BFDCCB',charSpacing:2});
 notes(s,`[SLIDE 4]\nSwitch to live Scribular demo.\nToday, we built that missing piece.\nHere is a transcript. Scribular generates a draft. She types: “Add the diagnoses, but keep the client's quotes.” Scribular shows the proposed change. She reviews it, confirms, and previews the result. If it works for her, she saves that style for future notes. If not, she stays with what she had.\nNo prompt engineering. No email thread. She decides what changes.\n\nEXACT COMMAND TO SHOW: “Add the diagnoses, but keep the client's quotes.”\n\nSAFETY RECOMMENDATION: Include only diagnoses explicitly documented in the transcript; do not infer new diagnoses.`);
}
// 5 — outcome, bridge completed
{
 const s=pptx.addSlide('DARK');
 t(s,'THE OUTCOME',0.72,0.62,3,0.28,{fontSize:11,bold:true,color:'BFDCCB',charSpacing:1.7});
 t(s,'Back to what she loves.',0.72,1.05,8.7,0.82,{fontFace:'Cambria',fontSize:40,bold:true,color:C.white});
 t(s,'From a model that runs to a tool a therapist can use.',0.76,2.03,7.0,0.9,{fontSize:20,color:'DDEFE6'});
 // bridge as hero under metric callouts
 addBridge(s,{x:0.94,y:3.87,w:11.42,complete:true,showLabels:true});
 // metrics top-right secondary focal section
 rect(s,8.45,2.0,1.74,1.17,'1B4A3C','376D58',0.12);
 t(s,'5+ hours',8.62,2.18,1.4,0.35,{fontSize:22,bold:true,color:C.white,align:'center'});
 t(s,'/ week',8.62,2.56,1.4,0.26,{fontSize:12,bold:true,color:'BFDCCB',align:'center'});
 rect(s,10.38,2.0,2.02,1.17,'1B4A3C','376D58',0.12);
 t(s,'$3,000',10.52,2.18,1.75,0.35,{fontSize:22,bold:true,color:C.white,align:'center'});
 t(s,'/ month',10.52,2.56,1.75,0.26,{fontSize:12,bold:true,color:'BFDCCB',align:'center'});
 t(s,'ILLUSTRATIVE GOAL',8.15,3.28,4.25,0.26,{fontSize:11,bold:true,color:'BFDCCB',align:'right',charSpacing:1.2});
 t(s,'Illustrative value of time: 5 hrs/week × 4 weeks × $150/hr = $3,000/month. Not cash savings; estimate is unvalidated and not a measured Scribular result.',0.78,6.42,11.7,0.46,{fontSize:11,color:'BFDCCB'});
 t(s,'More time with clients.',8.2,5.9,4.0,0.34,{fontFace:'Cambria',fontSize:21,bold:true,color:C.white,align:'right'});
 t(s,'SCRIBULAR',0.72,7.04,2,0.24,{fontSize:10,bold:true,color:'BFDCCB',charSpacing:2});
 notes(s,`[SLIDE 5]\nLocal AI gets us most of the way across the bridge. We are closing the gap between a model that runs and a tool a therapist can use.\nNow my wife can go back to doing what she loves- taking care of her clients\n\nMETRIC NOTE: “5+ hours / week” is an illustrative goal, not an achieved or measured Scribular outcome. The $3,000/month figure is an illustrative value of time based on 5 hours/week × 4 weeks/month × $150/hour. It represents time value, not cash cost savings; the estimate is unvalidated. The SBE Council survey separately reports a median five hours saved weekly by small-business owners through AI use, but this deck’s metric is not a Scribular result.`);
}

(async()=>{
 await pptx.writeFile({fileName:path.join(out,'scribular-pitch.pptx')});
})();
