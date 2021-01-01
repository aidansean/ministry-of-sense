var canvas = null ;

function start(){
  // Set the global variables.
  
  // Apply the style to be neutral.  This is done so that we only need to set a single
  // colour in settings.js and make the style function as complex as we like.
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
}

function draw_icons(){
  draw_name_icon() ;
  draw_collab_icon() ;
  draw_oneChance_icon() ;
  draw_pro_icon() ;
  draw_story_icon() ;
  draw_vs_icon() ;
}

function draw_name_icon(){
  canvas = Get('canvas_name') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = teams['ATLAS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  context.fillStyle = 'white' ;
  context.save() ;
  context.translate(0.5*w, 0.5*h) ;
  context.scale(1.25, 1) ;
  context.beginPath() ;
  context.arc(0, 0, 0.3*w, 0, Math.PI*2, false) ;
  context.fill() ;
  context.restore() ;
  
  context.fillStyle = 'white' ;
  context.beginPath() ;
  context.moveTo(0.7*w, 0.4*h) ;
  context.lineTo(0.9*w, 0.9*h) ;
  context.lineTo(0.4*w, 0.6*h) ;
  context.closePath() ;
  context.fill() ;
}
function draw_collab_icon(){
  canvas = Get('canvas_collaborative') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = teams['ATLAS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  context.fillStyle = teams['CMS'].color ;
  context.moveTo(0.7*w, 0.0*h) ;
  context.lineTo(1.0*w, 0.0*h) ;
  context.lineTo(1.0*w, 1.0*h) ;
  context.lineTo(0.3*w, 1.0*h) ;
  context.lineTo(0.7*w, 0.0*h) ;
  context.fill() ;
  
  context.font = 0.4*w + 'px arial' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillStyle = 'white' ;
  context.fillText('A', 0.25*w, 0.3*h) ;
  context.fillText('C', 0.75*w, 0.7*h) ;
  
  context.font = 0.2*w + 'px arial' ;
  context.fillText('vs', 0.5*w, 0.5*h) ;
}
function draw_oneChance_icon(){
  canvas = Get('canvas_oneChance') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = 'rgb(150,150,150)' ;
  context.fillStyle = teams['ATLAS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  context.font = 0.8*w + 'px arial' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillStyle = 'white' ;
  context.fillText('1', 0.5*w, 0.5*h) ;
}
function draw_pro_icon(){
  canvas = Get('canvas_pro') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = 'rgb(150,150,150)' ;
  context.fillStyle = teams['CMS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  context.font = 0.8*w + 'px arial' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillStyle = 'white' ;
  context.fillText('1', 0.5*w, 0.5*h) ;
  
  context.font = 0.4*w + 'px arial' ;
  context.fillText('+', 0.75*w, 0.25*h) ;
}
function draw_vs_icon(){
  canvas = Get('canvas_vs') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = teams['ATLAS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  context.fillStyle = teams['CMS'].color ;
  context.moveTo(0.7*w, 0.0*h) ;
  context.lineTo(1.0*w, 0.0*h) ;
  context.lineTo(1.0*w, 1.0*h) ;
  context.lineTo(0.3*w, 1.0*h) ;
  context.lineTo(0.7*w, 0.0*h) ;
  context.fill() ;
  
  context.font = 0.2*w + 'px arial' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillStyle = 'white' ;
  context.fillText('You' , 0.25*w, 0.25*h) ;
  context.fillText('Them', 0.72*w, 0.75*h) ;
  
  context.font = 0.2*w + 'px arial' ;
  context.fillText('vs', 0.5*w, 0.5*h) ;
}
function draw_story_icon(){
  canvas = Get('canvas_story') ;
  var context = canvas.getContext('2d') ;
  var w = canvas.width  ;
  var h = canvas.height ;
  context.fillStyle = teams['ATLAS'].color ;
  context.fillRect(0, 0, w, h) ;
  
  var n = 5 ;
  for(var i=0 ; i<n ; i++){
    context.fillStyle = 'white' ;
    var x = 0.1*w+i*0.15*w ;
    var y = 0.1*h+i*0.11*h ;
    var dx = 0.02*w ;
    var dy = 0.02*h ;
    var bw = 0.2*w ;
    var bh = 0.3*h ;
    context.fillRect(x-dx, y-dy, bw+2*dx, bh+2*dy) ;
    context.fillStyle = teams['CMS'].color ;
    context.fillRect(x, y, bw, bh) ;
    
    context.font = 0.2*w + 'px arial' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillStyle = 'white' ;
    context.fillText(n-i, x+0.5*bw, y+0.5*bh) ;
  }
}

