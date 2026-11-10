const scene=document.querySelector('#scene'), tools=document.querySelector('#tools'), statusLine=document.querySelector('#status');
const dialog=document.querySelector('#window'), body=document.querySelector('#body'), heading=document.querySelector('#heading');
const state={place:'title', unlocked:new Set(['bar']), clues:new Set(), dossiers:new Set(), show:false, sentence:0};
const strangerQuestionOrders=[
 [4,2,5,3,1],
 [1,4,2,3,5],
 [3,2,1,4,5],
 [1,2,4,5,3],
 [4,3,2,5,1]
];
const strangerProgress=new Map();
const strangerPassScore=3;
function strangerQuestionAt(place){
 if(!strangerProgress.has(place)){
  const order=strangerQuestionOrders[Math.floor(Math.random()*strangerQuestionOrders.length)];
  strangerProgress.set(place,{order,index:0,correct:0});
 }
 const {order,index,correct}=strangerProgress.get(place);
 return {number:order[index]??null,position:index+1,total:order.length,correct};
}
function recordStrangerAnswer(place,correct){
 if(strangerQuestionAt(place).number===null)return;
 const progress=strangerProgress.get(place);
 progress.index++;
 if(correct)progress.correct++;
}
const xmStations={
 bar:{code:'AB',flag:'bottle-tip',ready:'heard-Wirtin_1',prompt:'Hört euch zuerst die Wirtin an.',book:'Märchenbuch',notes:fairyTales,answers:[['Rotkäppchen'],['Schneewittchen','Scheewittchen'],['Hänsel und Gretel','Hänsel & Gretel'],['Aschenputtel'],['Bremen','nach Bremen']]},
 koeln:{code:'K',flag:'lock-tip',ready:'rock',prompt:'Findet zuerst Loreleys Zuhause.',book:'Köln-Reiseführer',notes:[
  ['Ankommen in Köln','Du kommst aus dem Bahnhof und willst gerade nach dem Weg fragen. Dann schaust du nach oben. Da steht er schon: der Kölner Dom! Seine zwei Türme sind so hoch, dass du beim Schauen fast deinen Hut verlierst. Der Dom ist die bekannteste Kirche der Stadt. Von dort kannst du zu Fuß ans Wasser gehen. Köln liegt am Rhein, und am Ufer kannst du den Schiffen zusehen.'],
  ['Ein Pirat bestellt ein Bier','Im Karneval sind die Straßen voll. Leute in Kostümen tanzen, und beim Umzug fliegen Süßigkeiten durch die Luft. Neben dir steht ein Pirat. Keine Sorge, der will nur ein Kölsch. So heißt das bekannte Bier aus Köln. Es kommt in einem schmalen Glas, das man eine Stange nennt. Der Pirat bestellt drei. Der Kellner bringt ihm drei Gläser und fragt: „Kommt Ihre Mannschaft auch noch?“'],
  ['Weiter am Rhein','Wenn du den Rhein weiter hinauffährst, kommst du zum Loreleyfelsen. Dort ist der Fluss eng und macht eine Kurve. Vom Ufer aus sieht das Wasser ganz ruhig aus. Aber dort fließt es schnell. Die starke Strömung macht die Fahrt für Schiffe gefährlich. Vom Land aus kannst du dir die Stelle in Ruhe ansehen. Dabei bleibt auch dein Hut trocken.']
 ],answers:[['Rhein','am Rhein'],['Karneval','Kölner Karneval','der Karneval'],['Kölsch','Kölschbier'],['Strömung','starke Strömung','die starke Strömung'],['Kölner Dom','der Kölner Dom','Dom','der Dom']]},
 hh:{code:'HH',flag:'loading-plan',ready:'heard-St_1',prompt:'Sprecht zuerst mit Störtebeker.',book:'Hafenaushang',notes:[
  ['Moin, komm mal mit','Moin! Du willst den Hafen sehen? Dann gehen wir erst mal ans Wasser. Das da ist die Elbe. An diesem Fluss liegt der Hamburger Hafen. In Altona gibt es einen Fischmarkt. Da kannst du Fisch kaufen oder einfach am Wasser spazieren gehen. Nur mit dem Fischbrötchen musst du aufpassen. Die Möwen hier fragen nicht, ob sie mal probieren dürfen.'],
  ['Der Michel und die alten Speicher','Siehst du den hohen Kirchturm da drüben? Das ist Sankt Michaelis. Hier sagen wir einfach Michel. Spart Zeit, wenn es regnet und du jemandem den Weg erklären musst. Weiter am Wasser stehen viele alte Lagerhäuser aus rotem Backstein. Das Viertel heißt Speicherstadt. Früher kamen Waren aus vielen Ländern hier an. Die Leute haben sie in den Häusern gelagert. So viele Treppen! Da bin ich froh, dass ich heute nur mein Fischbrötchen tragen muss.'],
  ['Noch ein Stück bis zur Alster','Wenn du noch trockene Füße hast, gehen wir zum Jungfernstieg. Die Straße liegt an der Binnenalster. Im Jahr 1838 bekam sie als erste Straße in Deutschland einen Belag aus Asphalt. Das war damals etwas Besonderes. Heute laufen die Leute einfach drüber. Kannste ihnen nicht übel nehmen. Wer nach Hause will, guckt selten auf die Straße und denkt: Mensch, Geschichte!']
 ],answers:[['Elbe','an der Elbe','die Elbe'],['Fischmarkt','einen Fischmarkt','Hamburger Fischmarkt'],['Michel','der Michel','Hamburger Michel'],['Speicherstadt','die Speicherstadt'],['Jungfernstieg','der Jungfernstieg']]}
};
function xmClip(station,n){return 'XM/XM_'+n+'_'+station.code;}
let xmReactions=[];
function nextXmReaction(){
 if(!xmReactions.length)xmReactions=[1,2,3,4,5];
 return xmReactions.splice(Math.floor(Math.random()*xmReactions.length),1)[0];
}
const readingPages=new Map(), readingMarks=new Set();
Object.assign(readingGlossary,{
 'Detektiven':'侦探','Auftrag':'任务','hört euch an':'听一听','Untersucht':'检查；调查',
 'sammelt Hinweise':'收集线索','eine Spur':'一条线索','Fahrkarte':'车票',
 'Leertaste':'空格键','Klickstellen zeigen':'显示可点击的位置'
});
const readingTerms=Object.keys(readingGlossary).sort((a,b)=>b.length-a.length);
const readingPattern=new RegExp('(?<![\\p{L}])('+readingTerms.join('|')+')(?![\\p{L}])','giu');
function appendReadingWords(p,paragraph,translate){
 let end=0;
 for(const match of paragraph.matchAll(readingPattern)){
  p.append(document.createTextNode(paragraph.slice(end,match.index)));
  button(p,match[0],()=>translate(match[0]),'reading-word');
  end=match.index+match[0].length;
 }
 p.append(document.createTextNode(paragraph.slice(end)));
}
function xmBook(station){
 const fairy=station.code==='AB';
 const index=readingPages.get(station.code)??0;
 const pages=station.notes;
 const current=fairy?[pages[index]]:pages;
 open(station.book);
 const reader=node('article','',body);reader.className='reading-page';
 const toolbar=node('div','',reader);toolbar.className='reading-tools';
 const translation=node('p','',reader);translation.className='reading-translation';
 translation.setAttribute('role','status');translation.hidden=true;
 function translate(word){
  const term=readingTerms.find(entry=>entry.toLowerCase()===word.trim().replace(/[.,!?„“]$/,'').toLowerCase());
  translation.hidden=false;
  translation.textContent=term?term+' · '+readingGlossary[term]:'Tippe auf ein unterstrichenes Wort, um es auf Chinesisch nachzuschlagen.';
 }
 button(toolbar,'中文 · Wort nachschlagen',()=>{
  const selection=window.getSelection();
  translate(selection&&reader.contains(selection.anchorNode)?String(selection):'');
 }).addEventListener('pointerdown',event=>event.preventDefault());
 if(fairy){
  const changePage=delta=>{readingPages.set(station.code,index+delta);xmBook(station);};
  button(toolbar,'← Zurück',()=>changePage(-1)).disabled=index===0;
  node('span',(index+1)+' / '+pages.length,toolbar);
  button(toolbar,'Weiter →',()=>changePage(1)).disabled=index===pages.length-1;
  const art=node('img','',reader);art.className='fairy-art';art.src='assets/maerchen-'+(index+1)+'.png';art.alt=pages[index][0];
 }
 if(!fairy){
  const art=node('img','',reader);art.className='fairy-art';
  art.src='assets/'+(station.code==='K'?'koeln-collage':'hamburg-collage')+'.png';
  art.alt=station.code==='K'?'Collage mit Dom, Karneval und Loreleyfelsen':'Collage mit Hafen, Fischmarkt, Michel, Speicherstadt und Binnenalster';
 }
 for(const [section,[title,text]] of current.entries()){
  node('h3',title,reader);
  for(const [i,paragraph] of text.split('\n\n').entries()){
   const row=node('div','',reader);row.className='reading-paragraph';
   const key=[station.code,index,section,i].join(':');
   const mark=button(row,'◆',()=>{
    if(readingMarks.has(key))readingMarks.delete(key);else readingMarks.add(key);
    paint();
   },'reading-marker');
   const p=node('p','',row);
   function paint(){
    const marked=readingMarks.has(key);
    row.classList.toggle('reading-marked',marked);
    mark.setAttribute('aria-pressed',String(marked));
    mark.setAttribute('aria-label',marked?'Markierung entfernen':'Absatz markieren');
   }
   paint();
   appendReadingWords(p,paragraph,translate);
  }
 }
 if(fairy&&index===2)node('p','In späteren Fassungen heißt das Haus auch Lebkuchenhaus.',reader);
 if(fairy){
  const footer=node('div','',reader);footer.className='reading-tools';
  button(footer,'← Zurück',()=>{readingPages.set(station.code,index-1);xmBook(station);}).disabled=index===0;
  button(footer,'Weiter →',()=>{readingPages.set(station.code,index+1);xmBook(station);}).disabled=index===pages.length-1;
 }
}
function xmHint(station){
 const clip=xmClip(station,7);
 speak('fremder',clip);
 if(state.clues.has('heard-'+clip))state.clues.add(station.flag);
 body.querySelector('audio').addEventListener('ended',()=>state.clues.add(station.flag),{once:true});
}
const xmCorrectLines=['Richtig. Na also.','Stimmt. Weiter.','Genau. Geht doch.','Richtig. Das lasse ich gelten.','Korrekt. Ich bin fast beeindruckt.'];
let lastXmCorrect=-1;
function xmCorrectFeedback(place){
 const index=(lastXmCorrect+1+Math.floor(Math.random()*(xmCorrectLines.length-1)))%xmCorrectLines.length;
 lastXmCorrect=index;
 message('X. Mac',xmCorrectLines[index]);
 portrait('fremder',body);
 const audio=node('audio','',body);
 audio.src='audio/XM/XM_'+(index+1)+'_R.mp3';
 audio.play().catch(()=>{});
 button(body,'Weiter',()=>strangerQuiz(place));
}
function strangerQuiz(place){
 const station=xmStations[place],question=strangerQuestionAt(place);
 if(question.number===null){
  if(question.correct>=strangerPassScore){xmHint(station);return;}
  message('X. Mac',question.correct+' von '+question.total+' richtig. Für meinen Tipp braucht ihr drei richtige Antworten.');
  button(body,'Noch einmal versuchen',()=>{strangerProgress.delete(place);strangerQuiz(place);});
  return;
 }
 const clip=xmClip(station,question.number+1);
 speak('fremder',clip);
 node('p','Frage '+question.position+' von '+question.total,body);
 const audio=body.querySelector('audio');
 const form=node('form','',body);
 const label=node('label','Antwort',form);
 const input=node('input','',label);input.required=true;input.autocomplete='off';
 const submit=node('button','Antwort prüfen',form);submit.type='submit';
 input.disabled=submit.disabled=!state.clues.has('heard-'+clip);
 audio.addEventListener('ended',()=>{input.disabled=submit.disabled=false;},{once:true});
 form.onsubmit=event=>{
  event.preventDefault();
  if(submit.disabled||!normalize(input.value))return;
  const correct=station.answers[question.number-1].some(value=>normalize(value)===normalize(input.value));
  recordStrangerAnswer(place,correct);
  if(correct){xmCorrectFeedback(place);return;}
  speak('fremder','XM/XM_'+nextXmReaction()+'_X',()=>strangerQuiz(place),'Weiter');
  const reaction=body.querySelector('audio');
  reaction.addEventListener('error',()=>{body.querySelector('button').disabled=false;},{once:true});
  reaction.play().catch(()=>{});
 };
}
function meetXm(place){
 const station=xmStations[place];
 if(!state.clues.has(station.ready)){message('X. Mac',station.prompt);return;}
 const intro=xmClip(station,1);
 if(state.clues.has('heard-'+intro)){strangerQuiz(place);return;}
 speak('fremder',intro,()=>strangerQuiz(place),'Fragen starten');
}
const places={title:['title','Die Goldene Zunge'],bar:['bar','Hamburg · Aloha-Bar'],koeln:['koeln','Kölner Spur · Loreleyfelsen'],hh:['hh','Hamburger Hafen'],rb:['rb','Riesengebirge'],hhkai:['hhkai','Hamburg · Richtplatz'],end:['end','Du bist reich'],secret:['sec_end','Leichenschmaus']};
const people={rich:'Richard',wirt:'Wirtin',lore:'Loreley',sto:'Störtebeker',rub:'Rübezahl',kai:'Mann am Kai',fremder:'X. Mac'};
const dossiers={
 lore:'Loreley ist eine Figur aus einer alten Sage. Sie sitzt auf einem hohen Felsen und kämmt ihr goldenes Haar. Dabei singt sie. Die Schiffer hören ihr zu und achten nicht mehr auf den Fluss. Der Felsen heißt heute Loreleyfelsen.',
 sto:'Klaus Störtebeker ist ein berühmter Seeräuber aus Norddeutschland. In der Sage fährt er mit seiner Mannschaft über das Meer. Gemeinsam greifen sie andere Schiffe an. Sein Name ist eng mit Hamburg verbunden.',
 rub:'Rübezahl ist ein Berggeist aus dem Riesengebirge. Das Gebirge liegt zwischen Tschechien und Polen. In manchen Geschichten hilft er armen Menschen. Wer gierig ist, bekommt von ihm eine Lektion. Auf Tschechisch heißt er Krakonoš.'
};
const evidence={
 note:['Loreleys Zettel','Ich bin heute unterwegs. Wenn du mich suchst, schau nach, wo ich heute singe. — Loreley'],
 diary:['Loreleys Tagebuch','Richard hat mir alles geglaubt. Wir haben bis zum Morgen Absinth getrunken. Er war so müde, dass er gar nicht bemerkt hat, dass ich seine Goldene Zunge gestohlen habe.'],
 advert:['Bierwerbung','Auf dem Plakat ist ein Mann mit langen Haaren und dunklem Mantel. Darunter steht: Störtebeker Pils.'],
 poker:['Pokerzettel','Störtebeker setzt die Goldene Zunge. Rübezahl setzt seinen Platz auf dem Schiff. Gewinner: Rübezahl.'],
 mountain:['Zettel von Störtebeker','Du suchst den Mann, der beim Poker gewonnen hat? Schau in seine Akte. Dort findest du ihn. — Störtebeker']
};
function node(tag,value,parent){const el=document.createElement(tag);if(value)el.textContent=value;parent?.append(el);return el;}
function button(parent,label,action,cls){const b=node('button',label,parent);b.type='button';b.onclick=action;if(cls)b.className=cls;return b;}
let titleMusic, warehouseMusic, mamaMusic;
function stopMamaMusic(){
 const music=mamaMusic;mamaMusic=null;
 if(!music)return;
 let step=5;
 const fade=setInterval(()=>{
  music.volume=.08*--step/5;
  if(!step){clearInterval(fade);music.pause();}
 },40);
}
let warehouseMuted=false;
function stopWarehouseMusic(){warehouseMusic?.pause();warehouseMusic=null;}
function open(title){stopMamaMusic();stopWarehouseMusic();dialog.classList.remove('warehouse-window');dialog.onkeydown=null;heading.textContent=title;body.replaceChildren();if(!dialog.open)dialog.showModal();}
function message(title,value){open(title);node('p',value,body);}
function portrait(id,parent){const p=node('div','',parent);p.className='portrait'+(id==='kai'?' single':'');p.style.backgroundImage='url(assets/'+(id==='fremder'?'strang_sprite':id)+'.png)';p.setAttribute('role','img');p.setAttribute('aria-label',people[id]);}
dialog.addEventListener('close',()=>{stopMamaMusic();stopWarehouseMusic();body.replaceChildren();});
function speak(id,clip,next,label){
 open(people[id]);portrait(id,body);
 const audio=node('audio','',body);audio.controls=true;audio.src='audio/'+clip+'.mp3';audio.preload='metadata';
 audio.addEventListener('error',()=>node('p','Die Aufnahme konnte nicht geladen werden. Öffnet das Gespräch erneut.',body),{once:true});
 const advance=next?button(body,label,next):null;
 if(advance)advance.disabled=!state.clues.has('heard-'+clip);
 audio.addEventListener('ended',()=>{
  state.clues.add('heard-'+clip);
  if(advance)advance.disabled=false;
 });
}
function find(id){state.clues.add(id);if(id==='note'){
 state.dossiers.add('lore');
 if(state.place==='bar')scene.querySelector('img').src='assets/bar.png';
 }if(id==='advert')state.dossiers.add('sto');if(id==='mountain')state.dossiers.add('rub');message(...evidence[id]);if(id==='advert'){const poster=node('img','',body);poster.className='poster';poster.src='assets/werbung.png';poster.alt='Störtebeker Pils – Nordisch derbe';}}
const endingTracks={end:'Win.mp3',secret:'Schmaus.mp3'};
let endingAudio;
function travel(place){
 if(dialog.open)dialog.close();
 titleMusic?.pause();
 titleMusic=null;
 endingAudio?.pause();
 endingAudio=null;
 state.place=place;
 render();
 if(Object.hasOwn(endingTracks,place)){
  const audio=new Audio('audio/'+endingTracks[place]);
  endingAudio=audio;
  audio.play().catch(()=>{
   if(endingAudio===audio)button(tools,'Musik abspielen',()=>audio.play().catch(()=>{}));
  });
 }
}
function hot(label,rect,action,id){
 const b=button(scene,'',action,'hot'+(id?' sprite':''));b.setAttribute('aria-label',label);
 ['left','top','width','height'].forEach((key,i)=>b.style[key]=rect[i]+'%');
 if(id)b.style.backgroundImage='url(assets/'+(id==='fremder'?'strang_sprite':id)+'.png)';
 node('span',label,b).className='tag';
}
function normalize(s){return s.toLowerCase().trim().normalize('NFC').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').replace(/oe/g,'o').replace(/ue/g,'u').replace(/ae/g,'a').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
function ask(fields,validate,success){
 const form=node('form','',body);
 const inputs=fields.map(name=>{const l=node('label',name,form);const input=node('input','',l);input.required=true;input.autocomplete='off';return input;});
 const submit=node('button','Prüfen',form);submit.type='submit';
 const feedback=node('p','',form);feedback.setAttribute('role','status');
 form.onsubmit=e=>{e.preventDefault();if(validate(inputs.map(i=>normalize(i.value))))success();else feedback.textContent='Das klingt unlogisch. Denkt weiter.';};
}
const tickets={
 bar:['note',['loreley'],['koln'],'koeln','Köln'],
 koeln:['advert',['stortebeker','stortebecker','klausstortebeker','storte'],['hamburg','hamburgerhafen','hh'],'hh','Hamburg'],
 hh:['mountain',['rubezahl'],['riesengebirge'],'rb','ins Riesengebirge']
};
function richard(){
 open('Richard von Roggenfänger');portrait('rich',body);
 if(state.place==='bar'){
  playRichardMuffle();
  node('p','Richard öffnet den Mund, aber er kann nicht sprechen. Er gibt euch einen Zettel.',body);
  node('p','Meine Goldene Zunge ist weg! Sie war in meinem Mund. Jetzt habe ich keine Zunge mehr. Darum kann ich nicht sprechen und muss Ihnen schreiben.',body);
  node('p','Die Zunge hat eine besondere Kraft. Wenn ich jemanden um etwas bitte, muss diese Person Ja sagen und tun, was ich will. Wenn ich zum Beispiel sage: „Geben Sie mir Ihr Schiff“, dann gibt sie mir das Schiff.',body);
  node('p','Ich bin Politiker. Ich muss vor vielen Menschen sprechen. Und ehrlich gesagt gefällt es mir, wenn niemand Nein zu mir sagt. Bitte bringen Sie mir die Zunge zurück. Dafür zahle ich Ihnen eine Million Euro.',body);
 }
 const ticket=tickets[state.place];if(!ticket)return;
 const [clue,names,targets,to,city]=ticket;
 if(state.unlocked.has(to)){button(body,'Zur Karte',map);return;}
 if(!state.clues.has(clue)){node('p','Findet zuerst eine Spur. Dann bezahle ich eure Fahrkarte.',body);return;}
 ask(['Wer war es wirklich?','Wo ist er?'],([name,target])=>names.includes(name)&&targets.includes(target),()=>{
 playSuccessSound('ticket');state.unlocked.add(to);message('Richard','Sehr clever, ich gebe euch das Ticket.');button(body,'Zur Karte',map);statusLine.textContent='Fahrkarte erhalten · '+city;
 });
}
function map(){
 open('Reisekarte');
 const board=node('div','',body);board.className='map';
 board.innerHTML='<svg viewBox="0 0 430 344" role="img" aria-label="Schematische Karte von Deutschland und dem Riesengebirge"><path d="M125 28L157 38 176 26 197 45 228 43 249 71 240 105 265 136 250 157 266 180 237 210 254 235 219 273 181 265 154 289 126 262 96 270 80 242 86 210 61 186 72 153 64 118 86 102 85 70 114 62Z" fill="#36346b" stroke="#a6a0da" stroke-width="2"/></svg>';
 for(const [key,label,x,y] of [['bar','Aloha-Bar',30,15],['hh','Hamburger Hafen',51,28],['koeln','Köln',21,54],['rb','Riesengebirge',76,55],['hhkai','Richtplatz',69,13]]){
 if(key==='hhkai'&&!state.unlocked.has(key))continue;
 const b=button(board,state.unlocked.has(key)?label:'???',()=>travel(key));b.disabled=!state.unlocked.has(key);b.style.left=x+'%';b.style.top=y+'%';
 }
}
function currentObjective(){
 const has=clue=>state.clues.has(clue);
 const route=tickets[state.place];
 if(route&&state.unlocked.has(route[3]))return 'Öffnet die Karte und reist zum nächsten freigeschalteten Ort.';
 if(route&&has(route[0]))return 'Schaut ins Personendossier. Meldet Richard, wen ihr sucht und wohin ihr fahren wollt.';
 switch(state.place){
  case 'bar':
   if(!has('heard-Wirtin_1'))return 'Sprecht mit Richard und hört euch die Aussage der Wirtin an.';
   return has('bottle-tip')?'Untersucht die Flaschen. Die Wirtin, die Getränkekarte und X. Mac geben euch Hinweise.':'Sprecht mit X. Mac über die Flaschen. Das Märchenbuch hilft bei seinen Fragen.';
  case 'koeln':
   if(!has('heard-Lore_1'))return 'Hört euch Loreleys Aussage an.';
   if(!has('rock'))return 'Findet heraus, wie der Felsen heißt, auf dem Loreley zu Hause ist.';
   if(!has('lock-tip'))return 'Fragt X. Mac nach dem Schloss. Der Reiseführer hilft bei seinen Fragen.';
   return has('diary')?'Zeigt Loreley das Tagebuch und hört euch ihre Antwort an.':'Öffnet das Schloss am Felsen und sucht das Tagebuch.';
  case 'hh':
   if(!has('heard-St_1'))return 'Hört euch Störtebekers Aussage an.';
   if(!has('loading-plan'))return 'Fragt X. Mac nach dem Ladeplan. Der Hafenaushang hilft bei seinen Fragen.';
   return has('poker')?'Zeigt Störtebeker den Pokerzettel.':'Klickt auf das Fass und verladet die Fässer nach X. Macs Ladeplan.';
  case 'rb':
   if(!has('heard-Ruebe_1'))return 'Hört euch an, was Rübezahl über die Zunge weiß.';
   return has('tongue')?'Setzt die Geschichte in der richtigen Reihenfolge zusammen.':'Findet das Zauberwort und öffnet Rübezahls Kiste.';
  case 'hhkai':return has('paid')?'Der Fall ist gelöst.':'Sprecht mit dem Mann am Kai.';
  default:return 'Findet Richards Goldene Zunge.';
 }
}
const mamaTopics=[
 ['Die Flaschen',2,'bar','heard-Wirtin_1'],
 ['Richards Fahrkarten',3,'bar','note'],
 ['Loreleys Zuhause',4,'koeln','heard-Lore_1'],
 ['Das Kölner Schloss',5,'koeln','rock'],
 ['Die Fässer',6,'hh','loading-plan'],
 ['Rübezahls Kiste',7,'rb','heard-Ruebe_1'],
 ['Den Fall rekonstruieren',8,'rb','tongue']
];
let mamaGreeted=false;
function playRichardMuffle(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  lockAudio??=new Context();
  const play=()=>{
   const start=lockAudio.currentTime;
   const voice=lockAudio.createOscillator(), filter=lockAudio.createBiquadFilter();
   const level=lockAudio.createGain();
   voice.type='triangle';
   voice.frequency.setValueAtTime(126,start);
   voice.frequency.linearRampToValueAtTime(164,start+.12);
   voice.frequency.linearRampToValueAtTime(94,start+.34);
   filter.type='lowpass';filter.frequency.value=420;
   level.gain.setValueAtTime(.001,start);
   level.gain.linearRampToValueAtTime(.15,start+.06);
   level.gain.exponentialRampToValueAtTime(.001,start+.36);
   voice.connect(filter).connect(level).connect(lockAudio.destination);
   voice.start(start);voice.stop(start+.37);
   voice.onended=()=>{voice.disconnect();filter.disconnect();level.disconnect();};
  };
  if(lockAudio.state==='running')play();else lockAudio.resume().then(play).catch(()=>{});
 }catch{/* Richard kann seinen Zettel auch ohne Ton zeigen. */}
}
function playPhoneCall(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  lockAudio??=new Context();
  const play=()=>{
   const start=lockAudio.currentTime;
   function tone(type,frequency,offset,length,volume){
    const oscillator=lockAudio.createOscillator(), gain=lockAudio.createGain();
    const time=start+offset;
    oscillator.type=type;oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.001,time);
    gain.gain.linearRampToValueAtTime(volume,time+.008);
    gain.gain.exponentialRampToValueAtTime(.001,time+length);
    oscillator.connect(gain).connect(lockAudio.destination);
    oscillator.start(time);oscillator.stop(time+length+.008);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
   }
   for(const [pitch,offset] of [[110,0],[82.41,.19]]){
    tone('triangle',pitch,offset,.38,.20);
    tone('sine',pitch*3.01,offset,.15,.07);
   }
   for(const time of [.65,1.25,1.85]){
    tone('sine',425,time,.32,.11);
   }
  };
  if(lockAudio.state==='running')play();else lockAudio.resume().then(play).catch(()=>{});
 }catch{/* Auch ohne Geräusche bleibt das Telefon benutzbar. */}
}
function mamaCall(topic){
 open('Mama · '+topic[0]);
 mamaMusic=new Audio('audio/Mama_Musik.mp3');
 mamaMusic.loop=true;mamaMusic.volume=.08;
 mamaMusic.play().catch(()=>{});
 const art=node('img','',body);art.className='poster';art.src='assets/mama-telefon.png';
 art.alt='Zwei Detektive in einer Telefonzelle sprechen mit Mama.';
 const audio=node('audio','',body);audio.controls=true;
 function hint(){
  audio.src='audio/Mama_'+topic[1]+'.mp3';
  audio.play().catch(()=>{});
 }
 if(!mamaGreeted){
  audio.src='audio/Mama_1.mp3';
  audio.addEventListener('ended',()=>{mamaGreeted=true;hint();},{once:true});
  audio.addEventListener('error',()=>{mamaGreeted=true;hint();},{once:true});
  audio.play().catch(()=>{});
 }else hint();
}
function mamaMenu(){
 playPhoneCall();
 open('Hilfe, Mama!');
 const available=mamaTopics.filter(([, ,place,clue])=>state.unlocked.has(place)&&state.clues.has(clue));
 if(!available.length){node('p','Hört euch zuerst am Ort um. Dann könnt ihr Mama zu einer Spur anrufen.',body);return;}
 const choices=node('div','',body);choices.className='reading-tools';
 for(const topic of available){
  const choice=button(choices,topic[0],()=>mamaCall(topic));choice.disabled=true;
  setTimeout(()=>{choice.disabled=false;},2200);
 }
}
function archive(){
 open('Ermittlungsakte');
 node('h3','Aktueller Auftrag',body);
 node('p',currentObjective(),body);
 button(body,'Hilfe, Mama!',mamaMenu);
 for(const id of state.clues)if(evidence[id])button(body,evidence[id][0],()=>find(id));
 if(![...state.clues].some(id=>evidence[id]))node('p','Noch keine Belege gefunden.',body);
}
const dossierDestinations={lore:'Loreley singt heute in Köln.',sto:'Störtebeker arbeitet heute am Hamburger Hafen.',rub:'Rübezahl ist in seiner Hütte im Riesengebirge.'};
function dossier(){
 open('Personendossier');
 if(!state.dossiers.size)node('p','Hier erscheinen Figuren, sobald ihr ihre Namen entdeckt.',body);
 for(const id of state.dossiers){node('h3',people[id],body);portrait(id,body);node('p',dossiers[id],body);node('h4','Aktuelle Spur',body);node('p',dossierDestinations[id],body);}
}
const bottleReactions={
 'Pilz Whisky':{
  trinken:'Viel Alkohol, aber keine Info!',
  essen:'Aua, das tut weh! Wer kontrolliert mich?',
  kussen:'Das war schön, aber nichts passiert.'
 },
 Absinth:{
  trinken:'Bitter! Und die Fee macht, dass die Welt sich dreht.',
  essen:'Schmeckt nicht, wer tippt da eigentlich diesen Quatsch?',
  kussen:'Klirr. Hinter der Flasche fällt ein Zettel auf den Tresen.'
 },
 'Störtebeker Pils':{
  trinken:'Ich bin jetzt ein echter Mann, selbst als Frau, aber eine Info habe ich immer noch nicht.',
  essen:'Nur echte Männer (selbst als Frau) können Störtebeker Pils essen! Merk Dir DAS!',
  kussen:'Die Flasche ist zu männlich. Sie kann nicht sagen, dass sie mich liebt!'
 },
 'Vita Cola':{
  trinken:'Spritzig, urst lecker, aber keine Info.',
  essen:'Als der Kellner das sieht, gibt es mir ein Vita-Cola Eis aus dem Kühlschrank. Urst lecker!',
  kussen:'Diese Cola sollte man häufiger küssen.'
 }
};
function barStranger(){meetXm('bar');}
function bottle(name){
 open(name);
 const form=node('form','',body);
 const label=node('label','Was willst du mit der Flasche machen?',form);
 const input=node('input','',label);input.required=true;input.autocomplete='off';
 const submit=node('button','Versuchen',form);submit.type='submit';
 const reply=node('p','',form);reply.setAttribute('role','status');
 form.onsubmit=e=>{
  e.preventDefault();
  const action=normalize(input.value);
  const reactions=bottleReactions[name];
  if(name==='Absinth'&&action==='kussen'){
   if(!state.clues.has('bottle-tip')){
    reply.textContent='Sie liebt mich nicht, sie liebt mich einfach nicht!';
    input.select();return;
   }
   find('note');const first=body.firstElementChild;
   const reaction=node('p',reactions.kussen);body.insertBefore(reaction,first);
   return;
  }
  reply.textContent=Object.hasOwn(reactions,action)?reactions[action]:'Das klappt mit der Flasche nicht. Versuch ein anderes Verb.';
  input.select();
 };
 input.focus();
}
function menu(){
 open('Getränkekarte');
 for(const [name,description] of [
 ['Pilz Whisky','Alex Pilz hat diesem Whisky seinen Namen gegeben. Er kommt aus Norddeutschland und wird in kleinen Mengen von Hand gemacht. Jede Flasche hat ihre eigene Nummer. Die Schotten dürfen gern mal probieren.'],
 ['Absinth','Man nennt mich die „Grüne Fee“. Ich schmecke nach Wermut, Anis und Fenchel. Früher war ich bei Künstlern in Paris beliebt. In manchen Ländern war ich sogar verboten. Manche Leute sagen, dass man blind wird, wenn man mich trinkt. Viel Glück beim Genuss!'],
 ['Störtebeker Bier','Ein Pils, das keine Beschreibung braucht. Echte Männer trinken Störtebeker, tolle Frauen trinken Störtebeker und die Kinder trinken Störtebekers Malzbier. Die Familie ist Störtebeker. Wir sind alle Teil der Crew. Nordisch derbe!'],
 ['Vita Cola','Die DDR-Cola. Vita Cola gibt es seit 1958. Sie kommt aus Ostdeutschland und schmeckt nach Cola mit Zitrone. Frisch, spritzig und lecker! Im Osten sagt man: Nu, das schmeckt! Der Westen darf auch trinken! Prost, mein Gutster!']]){
 node('h3',name,body);node('p',description,body);}
}
function lore(){
 speak('lore','Lore_1',state.clues.has('diary')?()=>speak('lore','Lore_2',()=>find('advert'),'Werbezettel ansehen'):undefined,'Tagebuch zeigen');
}
function sto(){
 speak('sto','St_1',state.clues.has('poker')?()=>speak('sto','St_2',()=>find('mountain'),'Zettel ansehen'):undefined,'Pokerzettel zeigen');
}
function unlockRock(){
 if(!state.clues.has('heard-Lore_1')){message('Loreleyfelsen','Hört euch zuerst Loreleys Aussage an.');return;}
 message('Nebel am Rhein','Nebel zieht auf. Wie heißt der Felsen, auf dem Loreley zu Hause ist?');
 dialog.classList.add('fog-window');
 scene.classList.add('fog');
 ask(['Name des Felsens'],([name])=>['loreleyfelsen','loreleyfels'].includes(name),()=>{
  state.clues.add('rock');scene.classList.remove('fog');dialog.classList.remove('fog-window');
  render();message('Loreleyfelsen','Der Nebel lichtet sich. Jetzt könnt ihr nach dem Tagebuch suchen.');
 });
}
dialog.addEventListener('close',()=>{scene.classList.remove('fog');dialog.classList.remove('fog-window');});
function loreLock(){
 if(state.clues.has('lore-lock')){find('diary');return;}
 if(!state.clues.has('lock-tip')){message('Das Kölner Schloss','X. Mac kennt das Schloss. Fragt ihn nach einem Hinweis.');return;}
 open('Das Kölner Schloss');
 button(body,'X. Macs Hinweis anhören',()=>xmHint(xmStations.koeln));
 const lock=node('div','',body);lock.className='symbol-lock';
 const art=node('img','',lock);art.src='assets/k_puzz.png';art.alt='Kölschglas links, Kölner Dom in der Mitte, Stadtwappen rechts';
 const counts=[0,0,0];
 ['Kölsch','Dom','Wappen'].forEach((name,i)=>{
  const tile=button(lock,'0',()=>{
   playLockClick();
   counts[i]=(counts[i]+1)%5;tile.textContent=counts[i];
   tile.setAttribute('aria-label',name+': '+counts[i]);
  },'symbol-wheel');
  tile.style.left=(23.5+i*26.5)+'%';
  tile.setAttribute('aria-label',name+': 0');
 });
 const feedback=node('p','',body);feedback.setAttribute('role','status');
 button(body,'Schloss prüfen',()=>{
  if(counts[0]===3&&counts[1]===1&&counts[2]===3){
   playSuccessSound('lock');state.clues.add('lore-lock');find('diary');
  }else feedback.textContent='Das Schloss bleibt zu. Prüft die Notiz und zählt die Kronen.';
 });
}
function harborStranger(){meetXm('hh');}
const warehouse=[
 '#########','#.......#','#..#....#','#.......#','#....#..#','#.......#','#########'
];
const barrelColors=['blau','gruen','gelb'];
const dockColors=['gruen','gelb','blau'];
const dockCells=[24,20,50];
const warehouseStart={player:46,barrels:[30,33,40]};
function warehousePuzzle(){
 if(state.clues.has('poker')){find('poker');return;}
 if(!state.clues.has('loading-plan')){message('Fässer','Ich weiß noch nicht, wohin die Fässer sollen. Fragt den Fremden.');return;}
 open('Hafenlager · Fässer verladen');
 dialog.classList.add('warehouse-window');
 const room=node('div','',body);room.className='warehouse-room';
 const grid=node('div','',room);grid.className='warehouse';grid.setAttribute('role','img');
 const panel=node('div','',room);panel.className='warehouse-panel';
 node('p','Schiebt jedes Fass auf seinen Ladeplatz.',panel);
 const plan=node('audio','',panel);plan.controls=true;plan.src='audio/'+xmClip(xmStations.hh,7)+'.mp3';plan.setAttribute('aria-label','X. Macs Ladeplan');
 const music=new Audio('audio/Soko.mp3');
 warehouseMusic=music;music.loop=true;music.volume=.18;
 function updateMusic(){
  if(warehouseMusic!==music)return;
  if(warehouseMuted||(!plan.paused&&!plan.ended))music.pause();
  else music.play().catch(()=>{});
 }
 const mute=button(panel,'Lagermusik aus',()=>{
  warehouseMuted=!warehouseMuted;
  mute.textContent=warehouseMuted?'Lagermusik an':'Lagermusik aus';
  updateMusic();
 });
 if(warehouseMuted)mute.textContent='Lagermusik an';
 for(const event of ['play','pause','ended'])plan.addEventListener(event,updateMusic);
 updateMusic();
 let position=warehouseStart;
 const history=[];
 const floor=warehouse.join('');
 const controls=node('div','',panel);controls.className='warehouse-controls';
 const moves=node('p','',panel);moves.setAttribute('role','status');
 function draw(){
  grid.replaceChildren();
  for(let i=0;i<floor.length;i++){
   const cell=node('div','',grid);cell.className=floor[i]==='#'?'warehouse-wall':'warehouse-floor';
   const dock=dockCells.indexOf(i), barrel=position.barrels.indexOf(i);
   if(dock>=0){
    const marker=node('span',['GR','GE','BL'][dock],cell);
    marker.className='dock '+dockColors[dock];
   }
   if(barrel>=0){
    const cask=node('span','',cell);
    node('b',['BL','GR','GE'][barrel],cask);
    cask.className='cask '+barrelColors[barrel];
    if(position.barrels[barrel]===dockCells[barrel])cask.classList.add('placed');
   }
   if(position.player===i)node('span','',cell).className='dockhand';
  }
  const loaded=position.barrels.filter((cell,i)=>cell===dockCells[i]).length;
  moves.textContent=loaded+' von 3 richtig · '+history.length+' Züge';
  grid.setAttribute('aria-label','Hafenlager. '+moves.textContent);
 }
 function step(delta){
  const next=position.player+delta;
  if(floor[next]!=='.')return;
  const barrels=[...position.barrels], index=barrels.indexOf(next);
  if(index>=0){
   const after=next+delta;
   if(floor[after]!=='.'||barrels.includes(after))return;
   barrels[index]=after;
   playLockClick(true);
  }
  history.push(position);position={player:next,barrels};draw();
  if(barrels.every((cell,i)=>cell===dockCells[i])){playSuccessSound('beer');find('poker');}
 }
 for(const [label,delta] of [['↑ Hoch',-9],['← Links',-1],['↓ Runter',9],['→ Rechts',1]])button(controls,label,()=>step(delta));
 button(controls,'Zug zurück',()=>{if(history.length){position=history.pop();draw();}});
 button(controls,'Neu starten',()=>{history.length=0;position=warehouseStart;draw();});
 dialog.onkeydown=e=>{
  const delta={ArrowUp:-9,ArrowLeft:-1,ArrowDown:9,ArrowRight:1}[e.key];
  if(delta===undefined)return;
  e.preventDefault();step(delta);
 };
 draw();
}
let lockAudio;
const successSounds={
 ticket:[['triangle',1050,650,0,.035,.12],['sine',1568,1568,.035,.24,.18],['sine',2093,2093,.07,.21,.09]],
 lock:[['square',270,90,0,.055,.12],['triangle',140,55,.018,.11,.16]],
 beer:[['sine',120,610,0,.07,.22],['triangle',470,180,.025,.10,.12],['sine',1600,590,.065,.13,.035]]
};
function playSuccessSound(name){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  lockAudio??=new Context();
  const play=()=>{
   const now=lockAudio.currentTime;
   for(const [wave,from,to,delay,length,volume] of successSounds[name]){
    const tone=lockAudio.createOscillator(),level=lockAudio.createGain(),start=now+delay;
    tone.type=wave;
    tone.frequency.setValueAtTime(from,start);
    tone.frequency.exponentialRampToValueAtTime(to,start+length);
    level.gain.setValueAtTime(.001,start);
    level.gain.linearRampToValueAtTime(volume,start+.005);
    level.gain.exponentialRampToValueAtTime(.001,start+length);
    tone.connect(level).connect(lockAudio.destination);
    tone.start(start);tone.stop(start+length+.005);
    tone.onended=()=>{tone.disconnect();level.disconnect();};
   }
  };
  if(lockAudio.state==='running')play();else lockAudio.resume().then(play).catch(()=>{});
 }catch{/* Die Freischaltung funktioniert auch ohne Ton. */}
}

function playLockClick(wood=false){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  lockAudio??=new Context();
  const play=()=>{
   const now=lockAudio.currentTime, tick=lockAudio.createOscillator(), level=lockAudio.createGain();
   tick.type='triangle';
   tick.frequency.setValueAtTime(wood?220:1150,now);
   tick.frequency.exponentialRampToValueAtTime(wood?75:240,now+.032);
   level.gain.setValueAtTime(.14,now);
   level.gain.exponentialRampToValueAtTime(.001,now+.045);
   tick.connect(level).connect(lockAudio.destination);
   tick.start(now);tick.stop(now+.05);
   tick.onended=()=>{tick.disconnect();level.disconnect();};
  };
  if(lockAudio.state==='running')play();else lockAudio.resume().then(play).catch(()=>{});
 }catch{/* Das Schloss bleibt ohne Ton bedienbar. */}
}
function playJingle(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  const context=new Context();
  context.resume().then(()=>{
   [523.25,659.25,783.99,1046.5].forEach((pitch,i)=>{
    const note=context.createOscillator(), volume=context.createGain(), time=context.currentTime+i*.105;
    note.type='triangle';note.frequency.value=pitch;volume.gain.setValueAtTime(.11,time);
    volume.gain.exponentialRampToValueAtTime(.001,time+.25);
    note.connect(volume).connect(context.destination);note.start(time);note.stop(time+.26);
   });
   setTimeout(()=>context.close(),850);
  }).catch(()=>context.close());
 }catch{/* Die Kiste öffnet sich auch ohne Jingle. */}
}
function revealTongue(){
 state.clues.add('tongue');playJingle();
 open('Die Goldene Zunge gefunden!');
 const reward=node('img','',body);reward.className='tongue-reward';reward.src='assets/goldene-zunge.svg';reward.alt='Goldene Zunge';
 button(body,'Weiter',()=>speak('rub','Ruebe_2',sentences,'Fall rekonstruieren'));
}
function chest(){
 if(state.clues.has('tongue')){speak('rub','Ruebe_2',sentences,'Fall rekonstruieren');return;}
 if(!state.clues.has('heard-Ruebe_1')){message('Kiste','Hört euch zuerst Rübezahls Aussage an.');return;}

 message('Kiste','Wie heißt das Zauberwort? Es ist nicht „Bitte“.');
 const d=node('details','',body);node('summary','Tipp ansehen',d);node('p','In einer Sage aus Hameln spielt ein Mann Flöte und fängt damit Ratten. Wie nennt man ihn?',d);
 ask(['Zauberwort'],([word])=>word==='rattenfanger',()=>{
 revealTongue();
 });
}
const rounds=[
 ['Zuerst',['stiehlt','Loreley','Richard','die Goldene Zunge.'],['verkauft','Störtebeker','den goldenen Pantoffel.']],
 ['Danach',['nimmt','Störtebeker','die Zunge','aus Loreleys Zimmer.'],['holt','Rübezahl','den Zettel']],
 ['Beim Poker',['gewinnt','Rübezahl','die Zunge','gegen Störtebeker.'],['verliert','Loreley','den Schiffsplatz']],
 ['Am Ende',['liegt','die Zunge','in einer Kiste','im Riesengebirge.'],['verschwindet','der Zettel','in einem Fass']]
];
const reconstructionOrders=new Map();
function reconstructionOrder(round,count){
 if(!reconstructionOrders.has(round)){
  const order=Array.from({length:count},(_,i)=>i);
  for(let i=order.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [order[i],order[j]]=[order[j],order[i]];
  }
  reconstructionOrders.set(round,order);
 }
 return reconstructionOrders.get(round);
}
function sentences(){
 if(state.sentence===rounds.length){state.unlocked.add('hhkai');travel('hhkai');return;}
 const [start,solution,decoys]=rounds[state.sentence];
 const words=[...solution,...decoys],order=reconstructionOrder(state.sentence,words.length),selected=[];
 open('Satz '+(state.sentence+1)+' von '+rounds.length);
 node('p',start+' …',body);
 const slots=node('div','',body), pool=node('div','',body);slots.className='tiles slots';pool.className='tiles';
 const feedback=node('p','',body);feedback.setAttribute('role','status');
 function draw(){slots.replaceChildren();pool.replaceChildren();feedback.textContent='';
 for(const id of selected)button(slots,words[id],()=>{selected.splice(selected.indexOf(id),1);draw();});
 for(const id of order)if(!selected.includes(id))button(pool,words[id],()=>{selected.push(id);draw();});
 }
 draw();button(body,'Satz prüfen',()=>{
 if(selected.length===solution.length&&selected.every((id,i)=>id===i)){state.sentence++;sentences();}
 else feedback.textContent='Prüft, welche Bausteine zur Geschichte passen und wie der Satz weitergeht.';
 });
}
function kai(){
 if(state.clues.has('paid')){
  speak('kai','Kai_2',()=>{
   message('Eine letzte Frage','Was heißt „Leichenschmaus“ auf Chinesisch?');
   ask(['Antwort in Pinyin'],([answer])=>answer==='sangyan',()=>travel('secret'));
  },'Zum Leichenschmaus');
  return;
 }
 speak('kai','Kai_1',()=>{state.clues.add('paid');travel('end');},'Richards Nachricht öffnen');
}
const briefingText=[
 'Hört mir gut zu. Richard von Roggenfänger hat seine Goldene Zunge verloren. Ihr zwei findet sie und bringt sie ihm zurück.',
 'Richard wartet in der Aloha-Bar am Hamburger Hafen. Sprecht zuerst mit ihm. Dann hört euch an, was die Leute gesehen haben. Wenn ihr eine Spur findet, sagt Richard Bescheid. Er bezahlt die Fahrkarten.',
 'Wenn ihr gar nicht weiterkommt, ruft mich an. Aber erst denkt ihr selber nach. Die ganze Familie zählt auf euch zwei!'
];
function briefing(){
 titleMusic?.pause();
 open('Euer erster Einsatz');
 const audio=node('audio','',body);audio.controls=true;audio.src='audio/Briefing.mp3';
 audio.setAttribute('aria-label','Einsatzbrief anhören');audio.play().catch(()=>{});
 const translation=node('p','',body);translation.className='reading-translation';
 translation.setAttribute('role','status');translation.hidden=true;
 const translate=word=>{
  const term=readingTerms.find(entry=>entry.toLowerCase()===word.toLowerCase());
  translation.hidden=false;translation.textContent=word+' · '+readingGlossary[term];
 };
 const tip='Tipp: Mit der Leertaste oder „Klickstellen zeigen“ seht ihr, was ihr untersuchen könnt.';
 for(const line of [...briefingText,tip])appendReadingWords(node('p','',body),line,translate);
 button(body,'Zur Aloha-Bar',()=>travel('bar'));
}
function render(){
 const [file,name]=places[state.place];scene.replaceChildren();tools.replaceChildren();statusLine.textContent=name;
 const img=node('img','',scene);img.src='assets/'+(file==='bar'&&!state.clues.has('note')?'bar_1':file)+'.png';img.alt=name;
 if(state.place==='title'){
  button(scene,'Spiel starten',briefing,'start');
  const music=new Audio('audio/Titel.mp3');
  titleMusic=music;music.volume=.45;
  const control=button(tools,'Titelmusik abspielen',()=>{
   if(music.paused){
    if(music.ended)music.currentTime=0;
    music.play().catch(()=>{});
   }else music.pause();
  });
  for(const event of ['play','pause','ended'])music.addEventListener(event,()=>{
   control.textContent=music.paused?'Titelmusik abspielen':'Titelmusik pausieren';
  });
  music.play().catch(()=>{});
  return;
 }
 if(['end','secret'].includes(state.place)){button(scene,'Zurück zum Richtplatz',()=>travel('hhkai'),'start');return;}
 button(tools,'Karte',map);button(tools,'Akte',archive);button(tools,'Dossier',dossier);
 if(tickets[state.place])button(tools,'Richard',richard);
 button(tools,'Klickstellen zeigen',toggle);
 if(xmStations[state.place]||state.place==='rb')button(tools,'Hilfe, Mama!',mamaMenu);
 const reading=xmStations[state.place];
 if(reading){
  const read=()=>xmBook(reading);
  const objects={
   bar:['MB',[48,39,12,10]],
   koeln:['RFK',[62,82,15,10]],
   hh:['HHA',[4,39,13,12]]
  };
  const [asset,position]=objects[state.place];
  hot(reading.book,position,read,asset);
  scene.lastElementChild.classList.add('single','reading-hotspot');
  button(tools,reading.book+' lesen',read);
 }
 switch(state.place){
 case 'bar':
 hot('Richard',[8,35,12,25],richard,'rich');
 hot('Wirtin',[63,36,12,31],()=>speak('wirt','Wirtin_1'),'wirt');
 hot('Getränkekarte',[72,74,21,17],menu);
 button(tools,'Mit X. Mac sprechen',barStranger);
 hot('X. Mac',[54,36,9,24],barStranger,'fremder');
 hot('Whisky',[14,63,11,28],()=>bottle('Pilz Whisky'));
 hot('Absinth',[27,53,8,38],()=>bottle('Absinth'));
 hot('Bier',[39,59,8,32],()=>bottle('Störtebeker Pils'));
 hot('Cola',[49,61,8,30],()=>bottle('Vita Cola'));
 break;
 case 'koeln':
 hot('Loreley',[67,44,12,33],lore,'lore');
 hot('X. Mac',[49,45,10,33],()=>meetXm('koeln'),'fremder');
 button(tools,'Mit X. Mac sprechen',()=>meetXm('koeln'));
 if(state.clues.has('rock'))hot('Schloss am Tagebuch',[79,45,18,39],loreLock);
 else hot('Zum Felsen',[79,45,18,39],unlockRock);
 break;
 case 'hh':
 hot('Störtebeker',[33,42,13,40],sto,'sto');
 button(tools,'Mit X. Mac sprechen',harborStranger);
 hot('X. Mac',[66,32,12,40],harborStranger,'fremder');
 hot('Fass',[17,63,12,25],warehousePuzzle);
 break;
 case 'rb':
 hot('Rübezahl',[48,46,14,34],()=>speak('rub','Ruebe_1'),'rub');
 hot('Kiste mit Ratten',[67,64,24,29],chest);
 scene.lastElementChild.classList.add('rat-chest');
 break;
 case 'hhkai':
 button(tools,'Mann am Kai',kai);
 hot('Mann am Kai',[46,23,32,68],kai,'kai');
 scene.lastElementChild.classList.add('single');
 if(state.clues.has('paid'))button(tools,'Abspann',()=>travel('end'));
 break;
 }
}
function toggle(){state.show=!state.show;scene.classList.toggle('show',state.show);}
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!dialog.open&&!e.target.closest('button,input,textarea,select,a,[contenteditable]')&& !['title','end','secret'].includes(state.place)){e.preventDefault();toggle();}});
render();
