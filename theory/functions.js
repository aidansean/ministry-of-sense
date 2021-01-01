var canvas  = null ;
var context = null ;
var nRow = 5 ;
var nCol = 5 ;

var cw = 750 ;
var ch = 750 ;
var cells = [] ;

var sw = cw/nCol ;
var sh = ch/nRow ;

var nExcluded_correct = {'ATLAS':0, 'CMS':0, 'CERN':0} ;
var nExcluded_incorrect = {'ATLAS':0, 'CMS':0, 'CERN':0} ;
var scores = {'ATLAS':0, 'CMS':0, 'CERN':0} ;
var multipliers = {'ATLAS':1, 'CMS':1, 'CERN':1} ;
var team_colors = {'ATLAS':'rgb(236,103, 29) ', 'CMS':'rgb( 17,133,193)', 'CERN':'rgb(0,0,0)'} ;

// Particle masses
var mEl = 0.10005 ;
var mMu = 0.105 ;
var mPi = 0.137 ;
var mPh = 0.00000001 ;
var mTau = 1.777 ;
var mH = 126 ;
var mZ = 91.2 ;

var pi = Math.PI ;

function draw_arrow(x1, y1, x2, y2, sw, sh){
  context.save() ;
  context.fillStyle   = 'rgb(0,0,0)' ;
  context.strokeStyle = 'rgb(0,0,0)' ;
  
  var theta = atan2(x2-x1,y2-y1) ;
  var r = sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)) ;
  context.translate(x1,y1) ;
  context.rotate(-theta) ;
  
  context.beginPath() ;
  context.moveTo(0,r) ;
  context.lineTo( 0.025*sw, r-0.05*sh) ;
  context.lineTo(-0.025*sw, r-0.05*sh) ;
  context.lineTo(0,r) ;
  context.fill() ;
  
  context.beginPath() ;
  context.moveTo(0,r) ;
  context.lineTo(0,0) ;
  context.stroke() ;
  
  context.restore() ;
}

function particle_position(x, y, r, name){
  this.p = particle_settings[name] ;
  this.x = x ;
  this.y = y ;
  this.r = r ;
  this.draw = function(){
    draw_particle_head(context, this.x , this.y , this.r/5, this.p.color, this.p.symbol, this.p.headShape) ;
  }
}
function join_particles(p1, p2){
  var dx = p1.x-p2.x ;
  var dy = p1.y-p2.y ;
  var dr = sqrt(dx*dx+dy*dy) ;
  dx /= dr ;
  dy /= dr ;
   
  var x1 = p1.x - p1.r*dx ;
  var y1 = p1.y - p1.r*dy ;
  var x2 = p2.x + p2.r*dx ;
  var y2 = p2.y + p2.r*dy ;
    
  draw_arrow(x1, y1, x2, y2, sw, sh) ;
}

function decay_chain(name, chain, failure_mode){
  this.name  = name ;
  this.chain = chain ;
  this.failure_mode = failure_mode ;
  
  this.draw = function(x, y, sw, sh){
    context.save() ;
    context.lineWidth = 2 ;
    
    var H  = new particle_position(x+0.2*sw, y+0.5*sh, 0.15*sw, 'Higgs') ;
    H.draw() ;
    for(var i=0 ; i<this.chain.length ; i++){
      var yTmp = y + 0.2*sh + 0.6*sh*i/(this.chain.length-1) ;
      if(this.chain[i]=='e'){
        var e = new particle_position(x+0.8*sw, yTmp, 0.07*sw, 'electron') ;
        e.draw() ;
        join_particles(H,e) ;
      }
      else if(this.chain[i]=='m'){
        var m = new particle_position(x+0.8*sw, yTmp, 0.07*sw, 'muon') ;
        m.draw() ;
        join_particles(H,m) ;
      }
      else if(this.chain[i]=='Zee'){
        var Zee = new particle_position(x+0.5*sw, yTmp, 0.09*sw, 'Z') ;
        var e1  = new particle_position(x+0.8*sw, yTmp-0.1*sh, 0.08*sw, 'electron') ;
        var e2  = new particle_position(x+0.8*sw, yTmp+0.1*sh, 0.08*sw, 'electron') ;
        Zee.draw() ;
        e1 .draw() ;
        e2 .draw() ;
        join_particles(  H, Zee) ;
        join_particles(Zee,  e1) ;
        join_particles(Zee,  e2) ;
      }
      else if(this.chain[i]=='Zmm'){
        var Zmm = new particle_position(x+0.5*sw, yTmp, 0.09*sw, 'Z') ;
        var m1  = new particle_position(x+0.8*sw, yTmp-0.1*sh, 0.08*sw, 'muon') ;
        var m2  = new particle_position(x+0.8*sw, yTmp+0.1*sh, 0.08*sw, 'muon') ;
        Zmm.draw() ;
        m1 .draw() ;
        m2 .draw() ;
        join_particles(  H, Zmm) ;
        join_particles(Zmm,  m1) ;
        join_particles(Zmm,  m2) ;
      }
      else if(this.chain[i]=='Zem'){
        var Zem = new particle_position(x+0.5*sw, yTmp, 0.09*sw, 'Z') ;
        var e1  = new particle_position(x+0.8*sw, yTmp-0.1*sh, 0.08*sw, 'electron') ;
        var m2  = new particle_position(x+0.8*sw, yTmp+0.1*sh, 0.08*sw, 'muon'    ) ;
        Zem.draw() ;
        e1 .draw() ;
        m2 .draw() ;
        join_particles(  H, Zem) ;
        join_particles(Zem,  e1) ;
        join_particles(Zem,  m2) ;
      }
    }
    
    context.restore() ;
  }
}

function shuffle(arr){
  var n = arr.length ;
  for(var i=0 ; i<2*n ; i++){
    var i1 = floor(random()*n) ;
    var i2 = floor(random()*n) ;
    var value = arr[i1] ;
    arr[i1] = arr[i2] ;
    arr[i2] = value ;
  }
  return arr ;
}

var valid_decays = [] ;
valid_decays.push(new decay_chain('HToZeeZee', ['Zee','Zee'], 'NONE')) ;
valid_decays.push(new decay_chain('HToZeeZmm', ['Zee','Zmm'], 'NONE')) ;
valid_decays.push(new decay_chain('HToZmmZee', ['Zmm','Zee'], 'NONE')) ;
valid_decays.push(new decay_chain('HToZmmZmm', ['Zmm','Zmm'], 'NONE')) ;

var invalid_decays = [] ;
invalid_decays.push(new decay_chain('HToee'    , ['e','e'        ], 'SLOW'  )) ;
invalid_decays.push(new decay_chain('HTomm'    , ['m','m'        ], 'SLOW'  )) ;
invalid_decays.push(new decay_chain('HToem'    , ['e','m'        ], 'LFV'   )) ;
invalid_decays.push(new decay_chain('HToeZee'  , ['e','Zee'      ], 'LFV'   )) ;
invalid_decays.push(new decay_chain('HToeZmm'  , ['e','Zmm'      ], 'LFV'   )) ;
invalid_decays.push(new decay_chain('HTomZee'  , ['m','Zee'      ], 'LFV'   )) ;
invalid_decays.push(new decay_chain('HTomZmm'  , ['m','Zmm'      ], 'LFV'   )) ;
invalid_decays.push(new decay_chain('HToeee'   , ['e','e','e'    ], 'CHARGE')) ;
invalid_decays.push(new decay_chain('HToeem'   , ['e','e','m'    ], 'CHARGE')) ;
invalid_decays.push(new decay_chain('HToemm'   , ['e','m','m'    ], 'CHARGE')) ;
invalid_decays.push(new decay_chain('HTommm'   , ['m','m','m'    ], 'CHARGE')) ;
invalid_decays.push(new decay_chain('HToeeee'  , ['e','e','e','e'], 'TREE'  )) ;
invalid_decays.push(new decay_chain('HToeeem'  , ['e','e','e','m'], 'TREE'  )) ;
invalid_decays.push(new decay_chain('HToeemm'  , ['e','e','m','m'], 'TREE'  )) ;
invalid_decays.push(new decay_chain('HToemmm'  , ['e','m','m','m'], 'TREE'  )) ;
invalid_decays.push(new decay_chain('HTommmm'  , ['m','m','m','m'], 'TREE'  )) ;
invalid_decays.push(new decay_chain('HToZemZem', ['Zem','Zem'    ], 'ZDECAY')) ;

shuffle(invalid_decays) ;

var chosen_decays = [] ;
for(var i=0 ; i<valid_decays.length ; i++){
  chosen_decays.push(valid_decays[i]) ;
}
var counter = 0 ;
while(chosen_decays.length<nRow*nCol){
  chosen_decays.push(invalid_decays[counter%invalid_decays.length]) ;
  counter++ ;
}
shuffle(chosen_decays) ;



function particle_settings_object(mass, charge, color, symbol, lineWidth, rCutoff, headShape){
  this.mass      = mass      ;
  this.charge    = charge    ;
  this.color     = color     ;
  this.symbol    = symbol    ;
  this.lineWidth = lineWidth ;
  this.rCutoff   = rCutoff   ;
  this.headShape = headShape ;
}

var particle_names = ['muon','electron','photon','tau','pion'] ;

var particle_settings = [] ;
particle_settings['muon'    ] = new particle_settings_object(mMu , 1, 'rgb(255,100,100)', '\u03BC', 2, 0.95*cw, 4) ;
particle_settings['electron'] = new particle_settings_object(mEl , 1, 'rgb(  0,200,  0)', 'e'     , 2, 0.51*cw, 6) ;
particle_settings['photon'  ] = new particle_settings_object(mPh , 0, 'rgb(  0,  0,  0)', '\u03B3', 2, 0.51*cw,-4) ;
particle_settings['tau'     ] = new particle_settings_object(mMu , 1, 'rgb(150, 57,239)', '\u03C4', 2, 0.65*cw,-6) ;
particle_settings['pion'    ] = new particle_settings_object(mPi , 1, 'rgb(150,  0,  0)', '\u03C0', 2, 0.65*cw,-5) ;

particle_settings['Higgs'   ] = new particle_settings_object(mH  , 0, 'gold'            , 'H'     , 2, 0.65*cw, 1) ;
particle_settings['Z'       ] = new particle_settings_object(mZ  , 0, 'rgb(150,150,150)', 'Z'     , 2, 0.65*cw, 1) ;

function card_object(i, j, decay){
  this.name = i+'_'+j ;
  this.text = i+','+j ;
  this.excluded = false ;
  this.excluder = 'NONE' ;
  this.i = i ;
  this.j = j ;
  this.decay = decay ;
  this.decay.chain = shuffle(this.decay.chain) ;
  
  this.rejection_angle = -pi/2 + random()*pi ;
  
  this.draw = function(){
    context.save() ;
    
    context.fillStyle = 'rgb(255,255,255)' ;
    context.fillRect(this.j*sw, this.i*sh, sw, sh) ;
    
    context.strokeStyle = 'rgb(0,0,0)' ;
    context.strokeRect(this.j*sw, this.i*sh, sw, sh) ;
    
    var x = (this.j+0.5)*sw ;
    var y = (this.i+0.5)*sh ;
    
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ; 
    context.font = 0.15*sh + 'px arial , sans-serif' ;
    context.fillStyle = 'rgb(0,0,0)' ;
    context.fillText((this.i*nRow+this.j+1), x-0.38*sw, y-0.4*sh) ;
    
    this.decay.draw(this.j*sw, this.i*sh, sw, sh) ;
    
    if(this.excluded){
      context.fillStyle = 'rgba(255,255,255,0.75)' ;
      context.fillRect(this.j*sw, this.i*sh, sw, sh) ;
      
      if(false){
        var dy = -0.05*sh ;
        
        context.translate(x,y) ;
        context.rotate(-pi/4) ;
        context.fillStyle = 'rgb(200,0,0)' ;
        context.strokeStyle = 'rgb(200,0,0)' ;
        context.font = 0.18*sh + 'px arial , sans-serif' ;
        context.fillText('REJECTED', 0, 0+dy) ;
        
        context.font = 0.08*sh + 'px arial , sans-serif' ;
        context.fillText('by Team '+this.excluder, 0, 0.15*sh+dy) ;
        
        context.lineWidth = 0.025*sh ;
        context.beginPath() ;
        context.moveTo(-0.48*sw,-0.15*sh+dy) ;
        context.lineTo( 0.48*sw,-0.15*sh+dy) ;
        context.moveTo(-0.48*sw, 0.25*sh+dy) ;
        context.lineTo( 0.48*sw, 0.25*sh+dy) ;
        context.stroke() ;
      }
      else{
        var theta = this.rejection_angle ;
        
        context.translate(x,y) ;
        context.rotate(theta) ;
        context.fillStyle = 'rgb(200,0,0)' ;
        context.strokeStyle = 'rgb(200,0,0)' ;
        context.fillStyle   = team_colors[this.excluder] ;
        context.strokeStyle = team_colors[this.excluder] ;
        context.textAlign = 'center' ;
        context.textBaseline = 'middle' ;
        context.font = 0.2*sh + 'px arial , sans-serif' ;
        context.fillText('VOID', 0, 0) ;
        
        context.lineWidth = 0.025*sh ;
        context.beginPath() ;
        context.arc(0,0,0.4*sw,0,2*pi,true) ;
        context.stroke() ;
        
        var top_text = 'REJECTED' ;
        var bottom_text = 'BY TEAM '+this.excluder ;
        var t0 = 0.2*pi ;
        var t1 = 0.8*pi ;
        context.font = 0.08*sh + 'px arial , sans-serif' ;
        for(var i=0 ; i<top_text.length ; i++){
          var t = t0 + (t1-t0)*i/top_text.length ;
          context.save() ;
          context.translate(-0.325*sw*cos(t), -0.325*sh*sin(t)) ;
          context.rotate(t-pi/2) ;
          context.fillText(top_text[i], 0, 0) ;
          context.restore() ;
        }
        t0 = 0.1*pi ;
        t1 = 0.9*pi ;
        for(var i=0 ; i<bottom_text.length ; i++){
          var t = t0 + (t1-t0)*i/bottom_text.length ;
          context.save() ;
          context.translate(-0.325*sw*cos(t), 0.325*sh*sin(t)) ;
          context.rotate(-t+pi/2) ;
          context.fillText(bottom_text[i], 0, 0) ;
          context.restore() ;
        }
      }
      
      
      context.rotate(pi/4) ;
      context.translate(-x,-y) ;
    }
    
    context.restore() ;
  }

  this.toggle = function(){
    if(this.excluded==false){
      this.excluded = true ;
      this.excluder = 'ATLAS' ;
      if(this.decay.failure_mode=='NONE'){
        nExcluded_incorrect['ATLAS']++ ;
      }
      else{
        nExcluded_correct['ATLAS']++ ;
      }
    }
    else if(this.excluder=='ATLAS'){
      this.excluder = 'CMS' ;
      if(this.decay.failure_mode=='NONE'){
        nExcluded_incorrect['ATLAS']-- ;
        nExcluded_incorrect['CMS'  ]++ ;
      }
      else{
        nExcluded_correct['ATLAS']-- ;
        nExcluded_correct['CMS'  ]++ ;
      }
    }
    else if(this.excluder=='CMS'){
      this.excluded = false ;
      if(this.decay.failure_mode=='NONE'){
        nExcluded_incorrect['CMS']-- ;
      }
      else{
        nExcluded_correct['CMS']-- ;
      }
    }
    draw_all() ;
  }
}

function draw_particle_head(context, X, Y, scale, color, text, shape){
  context.save() ;
  var rho = 5 ;
  context.beginPath() ;
  if(abs(shape)<=2){
    context.arc(X, Y, rho*scale, 0, 2*pi, true) ;
  }
  else if(abs(shape)>=3){
    var extra = (shape>0) ? 0 : 0.5 ;
    shape = abs(shape) ;
    for(var i=0 ; i<shape ; i++){
      var theta = 2*pi*(i+extra)/shape ;
      var Xi = X + rho*scale*cos(theta) ;
      var Yi = Y + rho*scale*sin(theta) ;
      if(i==0){
        context.moveTo(Xi, Yi) ;
      }
      else{
        context.lineTo(Xi,Yi) ;
      }
    }
    context.closePath() ;
  }
  context.fillStyle = color ;
  var dR = 0.5*scale*rho ;
  var gradient = context.createRadialGradient(X+0.5*dR,Y-0.5*dR,0,X+0.5*dR,Y-0.5*dR,2*dR) ;
  gradient.addColorStop(0,'white') ;
  gradient.addColorStop(1,color  ) ;
  context.fillStyle = gradient ;
  context.shadowBlur = 5 ;
  context.shadowColor = 'rgb(0,0,0)' ;
  context.fill() ;
  
  //context.fillStyle = 'rgb(255,255,255)' ;
  context.strokeStyle = 'rgb(0,0,0)' ;
  context.fillStyle = 'rgb(255,255,255)' ;
  context.font = 'italic ' + (6*scale) + 'px times , serif' ;
  context.textBaseline = 'middle' ;
  context.textAlign    = 'center' ;
  //context.strokeText(text, X, Y) ;
  context.fillText(text, X, Y) ;
  context.restore() ;
}

var ws = null ;
function start(){
  canvas  = Get('canvas_grid') ;
  context = canvas.getContext('2d') ;
  context.lineCap = 'round' ;
  
  ws = new WebSocket('ws://www.ministryofsense.com:8080') ;
  ws.onopen = function(e){
    ws.send('type:theory') ;
  } ;
  
  update_stats() ;
  remake_cells() ;
  draw_all() ;
  canvas.addEventListener('mousedown', click) ;
  
  canvas.addEventListener("contextmenu", function(e){ e.preventDefault() ; }, false) ;
  
  Get('button_submit').addEventListener('click', submit_scores) ;
}

function submit_scores(){
  var message = 'theory:' + multipliers['ATLAS'] + ':' + multipliers['CMS'] ;
  ws.send(message) ;
}

function change_size(){
  var w = parseInt(Get('button_canvas_width' ).value) ;
  var h = parseInt(Get('button_canvas_height').value) ;
  resize_canvas(w,h) ;
}
function resize_canvas(w,h){
  if(w>0) cw = w ;
  if(h>0) ch = h ;
  canvas.width  = cw ;
  canvas.height = ch ;
  context.lineCap = 'round' ;
  update_cellSize() ;
  draw_all() ;
}

function u_to_px(u){ return u*canvas.clientWidth/canvas.width ; } 
function px_to_u(p){ return p*canvas.width/canvas.clientWidth ; } 

function getParameterByName(name){
  // Taken from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search) ;
  return match && decodeURIComponent(match[1].replace(/\+/g, ' ')) ;
}

function remake_cells(){
  cells = [] ;
  for(var i=0 ; i<nRow ; i++){
    cells.push([]) ;
    for(var j=0 ; j<nCol ; j++){
      cells[i].push(new card_object(i, j, chosen_decays[i*nRow+j])) ;
    }
  }
}
function XY_from_mouse(evt){
  var X = evt.pageX - evt.target.offsetLeft ;
  var Y = evt.pageY - evt.target.offsetTop  ;
  return [X,Y] ;
}
function click(evt){
  evt.preventDefault() ;
  // Is it a right click?
  var rightclick ;
  if(!evt) var evt = window.event ;
  if(evt.which) rightclick = (evt.which==3) ;
  else if(evt.button) rightclick = (evt.button==2) ;

  var XY = XY_from_mouse(evt) ;
  var X = XY[0] ;
  var Y = XY[1] ;
  X *= canvas.width /canvas.clientWidth  ;
  Y *= canvas.height/canvas.clientHeight ;
  
  var i = Math.floor( nRow*Y/ch ) ;
  var j = Math.floor( nCol*X/cw ) ;
  
  var c = cells[i][j] ;
  c.toggle() ;
  
  window.setTimeout(update_stats, 1000) ;
}
function update_stats(){
  scores['ATLAS'] = Math.max(0,nExcluded_correct['ATLAS'] - nExcluded_incorrect['ATLAS']) ;
  scores['CMS'  ] = Math.max(0,nExcluded_correct['CMS'  ] - nExcluded_incorrect['CMS'  ]) ;

  Get('td_score_ATLAS').innerHTML = scores['ATLAS'] ;
  Get('td_score_CMS'  ).innerHTML = scores['CMS'  ] ;
  
  var max_score = Math.max(scores['ATLAS'],scores['CMS']) ;
  if(scores['ATLAS']==0 && scores['CMS']==0) max_score = 1 ;
  
  multipliers['ATLAS'] = (0.5+0.5*scores['ATLAS']/max_score) ;
  multipliers['CMS'  ] = (0.5+0.5*scores['CMS'  ]/max_score) ;
  
  Get('td_multiplier_ATLAS').innerHTML = 100*multipliers['ATLAS'].toPrecision(1) + '%' ;
  Get('td_multiplier_CMS'  ).innerHTML = 100*multipliers['CMS'  ].toPrecision(1) + '%' ;
}

function wrapText(text,x,y_in,maxWidth,lineHeight,draw){
  // Taken from www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
  if(text==undefined) return 0 ;
  var words = text.split(' ') ;
  var line = '' ;
  var w = 0 ;
  var h = 0 ;
  var y = 0 ;

  for(var n=0 ; n<words.length ; n++){
    var testLine = line + words[n] + ' ' ;
    var testWidth = context.measureText(testLine).width ;
    if(testWidth>maxWidth){
      y = y_in+h ;
      if(draw) context.fillText(line, x, y) ;
      line = words[n] + ' ' ;
      h += lineHeight ;
    }
    else{
      line = testLine ;
      if(testWidth>w) w = testWidth ;
    }
  }
  y = y_in+h ;
  if(draw) context.fillText(line, x, y) ;
  h += lineHeight ;
  if(draw==-1) return w ;
  return h ;
}
function rounded_box_path(x1, y1, x2, y2, r, context){
  context.beginPath() ;
  context.moveTo(x1+r,y1) ;
  context.lineTo(x2-r,y1) ;
  context.arcTo (x2,y1,x2,y1+r,r) ;
  context.lineTo(x2,y2-r) ;
  context.arcTo (x2,y2,x2-r,y2,r)
  context.lineTo(x1+r,y2) ;
  context.arcTo (x1,y2,x1,y2-r,r)
  context.lineTo(x1,y1+r) ;
  context.arcTo (x1,y1,x1+r,y1,r)
}

function draw_all(){
  draw_grid() ;
}
function draw_grid(){
  context.fillStyle = 'rgb(255,255,255)' ;
  context.fillRect(0,0,cw,ch) ;
  for(var i=0 ; i<nCol ; i++){
    for(var j=0 ; j<nRow ; j++){
      cells[i][j].draw() ;
    }
  }
}
function Get(id){ return document.getElementById(id) ; }
