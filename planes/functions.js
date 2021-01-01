var canvas  = null ;
var context = null ;
var nRow = 3 ;
var nCol = 5 ;

var cw = 1500 ;
var ch = 1500 ;
var sw = cw/nCol ;
var sh = ch/nRow ;

var results = [] ;
var pi = Math.PI ;

var failed_mission = false ;

var mute = false ;

var nBullets =   10 ;
var nPlanes  = 1000 ;
var nFailedPlanes = nPlanes ;

var plane_color = 'rgb( 50,150, 50)' ;
var plane_color = 'rgb(100,225,100)' ;
//var plane_color = 'rgb(120,149,40)' ;
var bullet_color     = 'rgb(255,255,  0)' ;
var bullet_color_hit = 'rgb(255,  0,  0)' ;
var UFO_color1 = 'purple' ;
var UFO_color2 = 'blueviolet' ;

var show_UFO = false ;
var UFO_fp = null ;

var map_index         = 0 ; // Map counter so that each map has different flight paths
var map_counter       = 0 ; // Render counter
var map_steps         = 150 ; // Numbers of renders to perform
var map_delay         =  25 ; // ms between renders
var map_fightsPerStep = nPlanes/map_steps ;
var battle_planes = [] ; // Planes flying around the channel
var RAF_bases = [ [0.1*cw,0.3*ch] , [0.2*cw,0.5*ch] , [0.3*cw,0.4*ch] , [0.4*cw,0.3*ch] ] ;

var button_x1 = 0.10*cw ;
var button_x2 = 0.90*cw ;
var button_y1 = 0.60*cw ;
var button_y2 = 0.70*cw ;

var nArmour = 5 ;
var nArmourUsed = 0 ;

var game_state = 'start' ;

var pFail_leftWing  = 0.05 ;
var pFail_rightWing = 0.05 ;
var pFail_cockpit   = 0.9  ;
var pFail_fuselage  = 0.1  ;
var pFail_noseCone  = 0.8  ;
var pFail_tail      = 0.9  ;

var cum_plane_1      = new plane_object() ;
var cum_plane_2      = new plane_object() ;
var cum_plane_3      = new plane_object() ;
var cum_plane_4      = new plane_object() ;

cum_plane_1.x = cw*(-0.25+1.5*-0.00) ;
cum_plane_2.x = cw*(-0.25+1.5*-0.25) ;
cum_plane_3.x = cw*(-0.25+1.5*-0.50) ;
cum_plane_4.x = cw*(-0.25+1.5*-0.75) ;

cum_plane_1.bullets = fire_bullets(cum_plane_1) ;
cum_plane_2.bullets = fire_bullets(cum_plane_2) ;
cum_plane_3.bullets = fire_bullets(cum_plane_3) ;
cum_plane_4.bullets = fire_bullets(cum_plane_4) ;

var cumulative_plane = new plane_object() ;
var average_plane    = new plane_object() ;
var painting_plane   = new plane_object() ;
var surviving_planes = [] ;

var average_plane_x0     = 0.25*cw ;
var average_plane_y0     = 0.40*cw ;
var average_plane_scale  = 0.2 *cw ;

var painting_plane_x0    = 0.75*cw ;
var painting_plane_y0    = 0.40*cw ;
var painting_plane_scale = 0.2 *cw ;

var counter = 0 ;
var nCounts = 100 ;
var delay = 50 ;

var pattern_camouflage = null ;
var gradient_panel     = null ;

function start(){
  if(getParameterByName('ufo')){
    show_UFO = true ;
    UFO_fp = new flightpath(0.8*cw, -0.2*ch, 0.1*cw, 0.4*cw, -0.2*pi) ;
  }

  canvas  = Get('canvas_planes') ;
  context = canvas.getContext('2d') ;
  context.lineCap = 'round' ;
  
  gradient_panel = context.createLinearGradient(0,0,1.0*cw,1.0*ch) ;
  gradient_panel.addColorStop(0.0, 'grey'  ) ;
  gradient_panel.addColorStop(0.5, 'white' ) ;
  gradient_panel.addColorStop(1.0, 'silver') ;
  
  draw_start_screen(context) ;
  
  canvas.addEventListener("contextmenu", function(e){ e.preventDefault() ; }, false) ;
  canvas.addEventListener('mousedown', click_canvas) ;
  
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
  
  Get('a_mute').addEventListener('click', toggle_mute) ;
  
  Get('img_camouflage').addEventListener('load', make_camo_pattern()) ;
  heartbeat() ;
}

function toggle_mute(){
  mute = !mute ;
  if(mute){
    Get('a_mute').innerHTML = 'Unmute' ;
  }
  else{
    Get('a_mute').innerHTML = 'Mute' ;
  }
}

function make_camo_pattern(){
  var img_camouflage = Get('img_camouflage') ;
  pattern_camouflage = context.createPattern(img_camouflage, 'repeat') ;
}
  
function heartbeat(){
  counter++ ;
  if(game_state=='cumulative') draw_cumulative_planes_proxy() ;
  window.setTimeout(heartbeat, delay) ;
}

function piece_object(name, pFail){
  this.name = name ;
  this.pFail = pFail ;
  this.failed = false ;
  this.color = plane_color ;
  this.armour = 0 ;
  this.draw = function(context, scale, mode, max_density){
    context.beginPath() ;
    this.make_path(context, scale) ;
    context.strokeStyle = 'rgb(0,0,0)' ;
    if(mode.indexOf('outline')!=-1){
      context.lineWidth = Math.max(2,scale*0.02) ;
      context.stroke() ;
    }
    if(mode.indexOf('fill')!=-1){
      context.fillStyle = this.color ;
      if(mode.indexOf('camo')!=-1){
        context.fillStyle = pattern_camouflage ;
      }
      //context.fillStyle = 'rgba(200,100,100,0.5)' ;
      //if(this.failed) context.fillStyle = 'rgb(255,100,100)' ;
      if(mode.indexOf('density')!=-1){
        var rho = this.density/max_density ;
        var r = 255 ;
        var g = floor(255*(1-rho)) ;
        var b = floor(255*(1-rho)) ;
        r = 127+floor(128*(1-rho)) ;
        g = 127+floor(128*(1-rho)) ;
        b = 127+floor(128*(1-rho)) ;
        context.fillStyle = 'rgb('+r+','+g+','+b+')' ;
      }
      context.fill() ;
    }
    if(mode.indexOf('armour')!=-1){
      var ax = this.ax*scale ;
      var ay = this.ay*scale ;
      var cx = this.cx*scale ;
      var cy = this.cy*scale ;
      var  r = 0.15*scale ;
      
      context.lineWidth = 2 ;
      context.strokeStyle = 'rgb(0,0,0)' ;
      context.beginPath() ;
      context.moveTo(ax,ay) ;
      context.lineTo(cx,cy) ;
      context.stroke() ;
      context.beginPath() ;
      context.fillStyle = 'rgb(0,0,0)' ;
      context.arc(cx, cy, 0.2*r, 0, 2*pi, true) ;
      context.fill() ;
      
      context.beginPath() ;
      context.lineWidth = 4 ;
      context.fillStyle = 'rgb(150,150,150)' ;
      context.beginPath() ;
      context.moveTo(ax-r,ay-r) ;
      context.lineTo(ax+r,ay-r) ;
      context.lineTo(ax+r,ay+0.5*r) ;
      context.arc(ax, ay+0.5*r, r, 0, pi, false) ;
      context.lineTo(ax-r,ay-r) ;
      context.closePath() ;
      context.fill() ;
      context.stroke() ;
      
      context.textAlign = 'center' ;
      context.textBaseline = 'middle' ;
      context.fillStyle = 'rgb(255,255,255)' ;
      context.font = 0.4*r+'px arial , sans-serif' ;
      context.fillText(this.name, ax, ay-0.6*r) ;
      
      context.closePath() ;
      context.textAlign = 'center' ;
      context.textBaseline = 'middle' ;
      context.fillStyle = 'rgb(255,255,255)' ;
      context.font = 1.25*r+'px arial , sans-serif' ;
      context.fillText(this.armour, ax, ay+0.4*r) ;
    }
  }
  this.armour_contains_point = function(x,y){
    var r = 0.15 ;
    var x1 = this.ax-r ;
    var x2 = this.ax+r ;
    var y1 = this.ay-r ;
    var y2 = this.ay+r ;
    if(is_in_circle(x, y, this.ax, this.ay+0.5*r, r)) return true ;
    if(x>=x1 && x<=x2 && y>=y1 && y<=y2)  return true ;
    return false ;
  }
  this.contains_point = function(x,y){ return false ; }
  this.area = -1 ;
  this.density = 0 ;
  this.nBullets = 0 ;
}

function lines_intersect(x1, y1, x2, y2, x3, y3, x4, y4){
    var sx21 = x2 - x1 ;
    var sy21 = y2 - y1 ;
    var sx43 = x4 - x3 ;
    var sy43 = y4 - y3 ;

    var denom = sx21*sy43 - sx43*sy21 ;
    if(denom==0) return 0 ; // Collinear
    var denomPositive = (denom>0) ;

    var sx13 = x1 - x3 ;
    var sy13 = y1 - y3 ;
    var s_numer = sx21*sy13 - sy21*sx13 ;
    if((s_numer<0)==denomPositive) return 0 ; // No collision

    var t_numer = sx43*sy13 - sy43*sx13 ;
    if((t_numer<0)==denomPositive) return 0 ; // No collision

    if(((s_numer>denom)==denomPositive) || ((t_numer>denom)==denomPositive)) return 0 ; // No collision
    
    // Collision detected
    return 1 ;
}
function is_in_triangle(p, p1, p2, p3){
  var xp = p[0] ;
  var yp = p[1] ;
  var xr = -1 ;
  var yr = -1 ;
  var nCrossings = 0 ;
  if(lines_intersect(xp, yp, xr, yr, p1[0], p1[1], p2[0], p2[1])) nCrossings++ ;
  if(lines_intersect(xp, yp, xr, yr, p2[0], p2[1], p3[0], p3[1])) nCrossings++ ;
  if(lines_intersect(xp, yp, xr, yr, p3[0], p3[1], p1[0], p1[1])) nCrossings++ ;
  return (nCrossings==1) ;
}
function is_in_circle(x, y, cx, cy, r){ return ((x-cx)*(x-cx)+(y-cy)*(y-cy)<r*r) ; }

function leftWing(){
  var p = new piece_object('Left wing', pFail_leftWing) ;
  p.x1 = -0.12 ;
  p.y1 = -0.50 ;
  p.y2 = -0.4  ;
  p.x2 = -1.1  ;
  p.y3 = -0.2  ;
  p.y4 = -0.0  ;
  p.cx = 0.5*(p.x1+p.x2) ;
  p.cy = 0.5*(p.y2+p.y3) ;
  p.r  =  0.5*abs(p.y3-p.y2) ;
  p.ax = -0.8 ;
  p.ay = -0.8 ;
  p.area = p.area = abs((p.x1-p.x2)*(p.y1-p.y2)) + 0.5*pi*p.r*p.r ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var y1 = this.y1*scale ;
    var x2 = this.x2*scale ;
    var y2 = this.y2*scale ;
    var y3 = this.y3*scale ;
    var y4 = this.y4*scale ;
    var r  = this.r *scale ;
    context.beginPath() ;
    context.moveTo(x1, y1) ;
    context.lineTo(x2, y2) ;
    context.arc(x2, y2+r, r, 1.5*pi, 0.5*pi, true ) ;
    context.lineTo(x1, y4) ;
    context.lineTo(x1, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(is_in_circle(x, y, this.x2, this.y2+this.r, this.r)) return true ;
    if(x>=this.x2 && x<=this.x1 && y>=this.y2 && y<=this.y3) return true ;
    if(is_in_triangle([x,y], [this.x1,this.y1], [this.x1,this.y2], [this.x2,this.y2])) return true ;
    if(is_in_triangle([x,y], [this.x2,this.y3], [this.x1,this.y3], [this.x1,this.y4])) return true ;
    return false ;
  }
  return p ;
}
function rightWing(){
  var p = new piece_object('Right wing', pFail_rightWing) ;
  p.x1 =  0.12 ;
  p.y1 = -0.50 ;
  p.y2 = -0.4  ;
  p.x2 =  1.1  ;
  p.y3 = -0.2  ;
  p.y4 = -0.0  ;
  p.cx =  0.5*(p.x1+p.x2) ;
  p.cy =  0.5*(p.y2+p.y3) ;
  p.r  =  0.5*abs(p.y3-p.y2) ;
  p.ax =  0.8 ;
  p.ay = -0.8 ;
  p.area = p.area = abs((p.x1-p.x2)*(p.y1-p.y2)) + 0.5*pi*p.r*p.r ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var y1 = this.y1*scale ;
    var x2 = this.x2*scale ;
    var y2 = this.y2*scale ;
    var y3 = this.y3*scale ;
    var y4 = this.y4*scale ;
    var r  = this.r *scale ;
    context.beginPath() ;
    context.moveTo(x1, y1) ;
    context.lineTo(x2, y2) ;
    context.arc(x2, y2+r, r, 1.5*pi, 0.5*pi, false) ;
    context.lineTo(x1, y4) ;
    context.lineTo(x1, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(is_in_circle(x, y, this.x2, this.y2+this.r, this.r)) return true ;
    if(x>=this.x1 && x<=this.x2 && y>=this.y2 && y<=this.y3) return true ;
    if(is_in_triangle([x,y], [this.x1,this.y1], [this.x1,this.y2], [this.x2,this.y2])) return true ;
    if(is_in_triangle([x,y], [this.x2,this.y3], [this.x1,this.y3], [this.x1,this.y4])) return true ;
    return false ;
  }
  return p ;
}
function cockpit(){
  var p = new piece_object('Cockpit', pFail_cockpit) ;
  p.x1 = -0.12 ;
  p.y1 = -0.5  ;
  p.x2 =  0.12 ;
  p.y2 = -0.1  ;
  p.cx = 0.5*(p.x1+p.x2) ;
  p.cy = 0.5*(p.y1+p.y2) ;
  p.ax = -0.4 ;
  p.ay = -0.8 ;
  p.r = abs(p.x1-p.x2) ;
  p.area = abs((p.x1-p.x2)*(p.y1-p.y2)) ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var y1 = this.y1*scale ;
    var x2 = this.x2*scale ;
    var y2 = this.y2*scale ;
    context.beginPath() ;
    context.moveTo(x1, y1) ;
    context.lineTo(x1, y2) ;
    context.lineTo(x2, y2) ;
    context.lineTo(x2, y1) ;
    context.lineTo(x1, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(x>=this.x1 && x<=this.x2 && y>=this.y1 && y<=this.y2) return true ;
    return false ;
  }
  return p ;
}
function fuselage(){
  var p = new piece_object('Fuselage', pFail_fuselage) ;
  p.x1 = -0.12 ;
  p.x2 = -0.05 ;
  p.x3 =  0.05 ;
  p.y1 = -0.1  ;
  p.y2 =  0.05 ;
  p.x4 =  0.12 ;
  p.y3 =  0.65  ;
  p.cx = 0.5*(p.x1+p.x4) ;
  p.cy = 0.5*(p.y1+p.y3) ;
  p.ax = -0.4  ;
  p.ay =  0.25 ;
  p.r = abs(p.x1-p.x2) ;
  p.area = abs((p.x1-p.x4)*(p.y1-p.y2)) ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var x2 = this.x2*scale ;
    var x3 = this.x3*scale ;
    var y1 = this.y1*scale ;
    var y2 = this.y2*scale ;
    var x4 = this.x4*scale ;
    var y3 = this.y3*scale ;
    context.beginPath() ;
    context.moveTo(x1, y1) ;
    context.lineTo(x1, y2) ;
    context.lineTo(x2, y3) ;
    context.lineTo(x3, y3) ;
    context.lineTo(x4, y2) ;
    context.lineTo(x4, y1) ;
    context.lineTo(x1, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(x>=this.x1 && x<=this.x4 && y>=this.y1 && y<=this.y2) return true ;
    if(x>=this.x2 && x<=this.x3 && y>=this.y2 && y<=this.y3) return true ;
    if(is_in_triangle([x,y], [this.x1,this.y2], [this.x2,this.y2], [this.x2,this.y3])) return true ;
    if(is_in_triangle([x,y], [this.x4,this.y2], [this.x3,this.y3], [this.x3,this.y2])) return true ;
    return false ;
  }
  return p ;
}
function noseCone(){
  var p = new piece_object('Nosecone', pFail_noseCone) ;
  p.x1 = -0.12 ;
  p.x2 = -0.05 ;
  p.x3 =  0.05 ;
  p.x4 =  0.12 ;
  p.y1 = -0.5  ;
  p.y2 = -0.8  ;
  p.r  =  0.5*abs(p.x2-p.x3) ;
  p.cx = p.x2+p.r ;
  p.cy = 0.5*(p.y1+p.y2) ;
  p.area = 0.5*pi*p.r*p.r ;
  p.ax =  0.4 ;
  p.ay = -0.8 ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var x2 = this.x2*scale ;
    var x3 = this.x3*scale ;
    var x4 = this.x4*scale ;
    var y1 = this.y1*scale ;
    var y2 = this.y2*scale ;
    var r  = this.r *scale ;
    context.beginPath() ;
    context.moveTo(x1, y1) ;
    context.lineTo(x2, y2) ;
    context.arc(x2+r, y2, r, 1.0*pi, 0.0*pi, false) ;
    context.lineTo(x3, y2) ;
    context.lineTo(x4, y1) ;
    context.lineTo(x1, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(is_in_circle(x, y, this.x2+this.r, this.y2, this.r) && y<this.y2) return true ;
    if(x>=this.x2 && x<=this.x3 && y>=this.y2 && y<=this.y1) return true ;
    if(is_in_triangle([x,y], [this.x1,this.y1], [this.x2,this.y2], [this.x2,this.y1])) return true ;
    if(is_in_triangle([x,y], [this.x4,this.y1], [this.x3,this.y2], [this.x3,this.y1])) return true ;
    return false ;
  }
  return p ;
}
function tail(){
  var p = new piece_object('Tail', pFail_tail) ;
  p.x1 = -0.22 ;
  p.x2 = -0.05 ;
  p.x3 = -0.03 ;
  p.x4 = -0.0  ;
  p.x5 =  0.03 ;
  p.x6 =  0.05 ;
  p.x7 =  0.22 ;
  p.y1 =  0.65 ;
  p.y2 =  0.67 ;
  p.y3 =  0.78 ;
  p.y4 =  0.86 ;
  
  p.r  =  0.5*abs(p.y2-p.y4) ;
  p.cx = 0.5*(p.x1+p.x7) ;
  p.cy = 0.5*(p.y1+p.y4) ;
  p.ax = 0.4  ;
  p.ay = 0.25 ;
  p.area = abs((p.x1-p.x2)*(p.y1-p.y2))+pi*p.r*p.r ;
  p.make_path = function(context, scale){
    var x1 = this.x1*scale ;
    var x2 = this.x2*scale ;
    var x3 = this.x3*scale ;
    var x4 = this.x4*scale ;
    var x5 = this.x5*scale ;
    var x6 = this.x6*scale ;
    var x7 = this.x7*scale ;
    var y1 = this.y1*scale ;
    var y2 = this.y2*scale ;
    var y3 = this.y3*scale ;
    var y4 = this.y4*scale ;
    var  r = this.r *scale ;
    context.beginPath() ;
    context.moveTo(x2,y1) ;
    context.moveTo(x1,y2) ;
    context.arc(x1, y2+r, r, 1.5*pi, 0.5*pi, true) ;
    context.lineTo(x3, y4) ;
    context.lineTo(x4, y3) ;
    context.lineTo(x5, y4) ;
    context.lineTo(x7, y4) ;
    context.arc(x7, y2+r, r, 0.5*pi, 1.5*pi, true) ;
    context.lineTo(x7, y2) ;
    context.lineTo(x6, y1) ;
    context.lineTo(x2, y1) ;
    context.closePath() ;
  }
  p.contains_point = function(x,y){
    if(is_in_circle(x, y, this.x1, this.y2+this.r, this.r) && x<this.x1) return true ;
    if(is_in_circle(x, y, this.x7, this.y2+this.r, this.r) && x>this.x7) return true ;
    if(x>=this.x2 && x<=this.x6 && y>=this.y1 && y<=this.y3) return true ;
    if(x>=this.x1 && x<=this.x7 && y>=this.y2 && y<=this.y3) return true ;
    if(x>=this.x1 && x<=this.x3 && y>=this.y3 && y<=this.y4) return true ;
    if(x>=this.x5 && x<=this.x7 && y>=this.y3 && y<=this.y4) return true ;
    if(is_in_triangle([x,y],[this.x1,this.y2],[this.x2,this.y1],[this.x2,this.y2])) return true ;
    if(is_in_triangle([x,y],[this.x7,this.y2],[this.x6,this.y1],[this.x6,this.y2])) return true ;
    if(is_in_triangle([x,y],[this.x3,this.y4],[this.x4,this.y3],[this.x3,this.y3])) return true ;
    if(is_in_triangle([x,y],[this.x5,this.y4],[this.x4,this.y3],[this.x5,this.y3])) return true ;
    return false ;
  }
  return p ;
}

function bullet_object(x,y){
  this.x = x ;
  this.y = y ;
  this.status = false ;
  this.hit    = false ;
  this.i_piece = -1 ;
  this.color = bullet_color_hit ;
  this.fire_at_plane = function(plane){
    for(var i=0 ; i<plane.pieces.length ; i++){
      var p = plane.pieces[i] ;
      if(p.contains_point(x,y)){
        this.status = true ;
        this.i_piece = i ;
        var pHit = Math.pow(0.5, p.armour) ;
        if (random()<pHit) this.hit = true ;
        var pFail = p.pFail ;
        var fail = ((random()<pFail) && this.hit) ;
        plane.pieces[i].failed = fail ;
        if(fail) plane.failed = true ;
        break ;
      }
    }
  }
  this.draw = function(context, scale){
    if(this.status==false) return ;
    this.color = (this.hit==true) ? bullet_color_hit : bullet_color ;
    context.save() ;
    var x = this.x*scale ;
    var y = this.y*scale ;
    var r = min(scale*0.05, 5) ;
    context.fillStyle = this.color ;
    context.strokeStyle = this.color ;
    context.lineWidth = 2 ;
    context.beginPath() ;
    context.arc(x, y, r, 0, 2*pi, true) ;
    context.closePath() ;
    context.fill() ;
    context.stroke() ;
    context.restore() ;
  }
}
function fire_bullets(plane){
  var bullets = [] ;
  for(var i=0 ; i<nBullets ; i++){
    var x = -1.25+2.5*random() ;
    var y = -1.25+2.5*random() ;
    var bullet = new bullet_object(x, y) ;
    bullet.fire_at_plane(plane) ;
    bullets.push(bullet) ;
  }
  return bullets ;
}

function plane_object(){
  this.bullets = [] ;
  this.pieces  = [] ;
  this.pieces.push(new  leftWing()) ;
  this.pieces.push(new rightWing()) ;
  this.pieces.push(new   cockpit()) ;
  this.pieces.push(new  fuselage()) ;
  this.pieces.push(new  noseCone()) ;
  this.pieces.push(new      tail()) ;
  this.failed = false ;
  this.add_armour = function(base_plane){
    for(var i=0 ; i<this.pieces.length ; i++){
      this.pieces[i].armour = base_plane.pieces[i].armour+0.0 ;
    }
  }
  this.draw = function(context, x, y, scale, theta, mode){    
    context.save() ;
    
    context.translate(x+0.5,y+0.5) ;
    context.rotate(theta) ;
    
    for(var i=0 ; i<this.pieces.length ; i++){
      context.strokeStyle = 'green' ;
      if(this.failed) context.strokeStyle = 'red' ;
      context.lineWidth = 2 ;
      this.pieces[i].draw(context, scale, mode, this.max_density) ;
    }
    if(mode.indexOf('bullets')!=-1){
      for(var i=0 ; i<this.bullets.length ; i++){
        if(this.bullets[i]) this.bullets[i].draw(context, scale) ;
      }
    }
    context.rotate(-theta) ;
    context.translate(-x-0.5,-y-0.5) ;
    
    context.restore() ;
  }
  this.contains_point = function(x,y){
    for(var i=0 ; i<this.pieces.length ; i++){
      if(this.pieces[i].contains_point(x,y)) return i ;
    }
    return -1 ;
  }
  this.armour_contains_point = function(x,y){
    for(var i=0 ; i<this.pieces.length ; i++){
      if(this.pieces[i].armour_contains_point(x,y)) return i ;
    }
    return -1 ;
  }
  this.max_density = 0 ;
  this.set_densities = function(){
    for(var i=0 ; i<this.bullets.length ; i++){
      if(this.bullets[i].i_piece==-1) continue ;
      this.pieces[this.bullets[i].i_piece].nBullets++ ;
    }
    for(var i=0 ; i<this.pieces.length ; i++){
      var d = this.pieces[i].nBullets/this.pieces[i].area ;
      this.pieces[i].density = d ;
      if(d>this.max_density) this.max_density = d ;
    }
  }
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

function XY_from_mouse(evt){
  var X = evt.pageX - evt.target.offsetLeft ;
  var Y = evt.pageY - evt.target.offsetTop  ;
  return [X,Y] ;
}
function click_canvas(evt){
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
  
  if(game_state=='painting'){
    var u = (X-painting_plane_x0)/painting_plane_scale ;
    var v = (Y-painting_plane_y0)/painting_plane_scale ;
    var index = painting_plane.contains_point(u,v) ;
    var armour_index = painting_plane.armour_contains_point(u,v) ;
    if(index==-1) index = armour_index ;
    if(index!=-1){
      if(rightclick && painting_plane.pieces[index].armour>0){
        nArmourUsed-- ;
        painting_plane.pieces[index].armour-- ;
      }
      else if(rightclick==false && painting_plane.pieces[index].armour>0 && nArmourUsed>=nArmour){
        nArmourUsed-- ;
        painting_plane.pieces[index].armour-- ;
      }
      else if(rightclick==false && nArmourUsed<nArmour){
        nArmourUsed++ ;
        painting_plane.pieces[index].armour++ ;
      }
      clear_canvas(context) ;
      draw_average_plane(context) ;
      draw_painting_plane(context) ;
      draw_stats_table(context) ;
    }
    context.fillStyle = 'rgb(0,0,0)' ;
    context.font = 0.05*ch + 'px arial , sans-serif' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillText('Adjust the armour distribution:', 0.5*cw, 0.05*ch) ;
    if(X>=button_x1 && X<=button_x2 && Y>=button_y1 && Y<=button_y2){
      surviving_planes = [] ;
      nFailedPlanes = 0 ;
      failed_mission = false ;
      draw_map_handle() ;
      
      //Get('p_instructions').innerHTML = 'All you can do now is watch your planes fly over the English Channel on the radar map, and hope that most of them come back in one piece...' ;
      
      game_state = 'map_running' ;
    }
  }
  else if(game_state=='start'){
    average_plane = new plane_object() ;
    
    if(surviving_planes.length/nPlanes>=0.75){
      endgame() ;
      return ;
    }
    
    for(var i=0 ; i<nPlanes ; i++){
      var plane = new plane_object() ;
      plane.add_armour(painting_plane) ;
      var bullets = fire_bullets(plane) ;
      plane.bullets = bullets ;
      if(plane.failed==false) surviving_planes.push(plane) ;
    }
    draw_grid_of_planes(context) ;
    game_state = 'grid_of_planes' ;
  }
  else if(game_state=='map_end'){
    average_plane.bullets = [] ;
    results.push(new results_object(painting_plane, floor(100*surviving_planes.length/nPlanes)+'%')) ;
    for(var i=0 ; i<surviving_planes.length ; i++){
      for(var j=0 ; j<surviving_planes[i].bullets.length ; j++){
        average_plane.bullets.push(surviving_planes[i].bullets[j]) ;
      }
    }
    average_plane.set_densities() ;
    clear_canvas(context) ;
    draw_average_plane(context) ;
    draw_painting_plane(context) ;
    draw_stats_table(context) ;
    context.fillStyle = 'rgb(0,0,0)' ;
    context.font = 0.05*ch + 'px arial , sans-serif' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillText('Adjust the armour distribution:', 0.5*cw, 0.05*ch) ;
    
    if(false==failed_mission && surviving_planes.length/nPlanes>=0.75){
      endgame() ;
      return ;
    }
    
    game_state = 'painting' ;
  }
  else if(game_state=='grid_of_planes'){
    draw_cumulative_planes(context) ;
    game_state = 'cumulative' ;
  }
  else if(game_state=='cumulative'){
    for(var i=0 ; i<surviving_planes.length ; i++){
      for(var j=0 ; j<surviving_planes[i].bullets.length ; j++){
        average_plane.bullets.push(surviving_planes[i].bullets[j]) ;
      }
    }
    average_plane.set_densities() ;
    clear_canvas(context) ;
    context.fillStyle = 'rgb(0,0,0)' ;
    context.font = 0.05*ch + 'px arial , sans-serif' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillText('Adjust the armour distribution:', 0.5*cw, 0.05*ch) ;
    draw_average_plane(context) ;
    draw_painting_plane(context) ;
    draw_stats_table(context) ;
    
    game_state = 'painting' ;
  }
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

function endgame(){
  clear_canvas(context) ;
  context.save() ;
  
  context.fillStyle = 'rgb(0,0,0)' ;
  context.fillRect(0,0,cw,ch) ;
  
  var img = Get('img_spitfires') ;
  var iw = img.width  ;
  var ih = img.height ;
  var buffer = ch-2*ih ;
  context.drawImage(img, 0, 0, iw, ih, 0, 0.5*buffer, cw, 2*ih) ;
  context.fillStyle = 'rgba(255,255,255,0.25)' ;
  context.fillStyle = 'rgb(0,0,0)' ;
  context.strokeStyle = 'rgb(255,255,255)' ;
  
  context.fillStyle = 'rgb(0,0,0)' ;
  context.strokeStyle = 'rgb(255,255,255)' ;
  context.font = 0.125*ch+'px arial , sans-serif' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  
  context.lineWidth = 4 ;
  context.fillText  ('Congratulations!', 0.5*cw, 0.08*ch) ;
  context.strokeText('Congratulations!', 0.5*cw, 0.08*ch) ;
  
  var y  = 0.65*ch ;
  var x  = 0.5*cw ;
  var w  = 0.9*cw ;
  var lh = 0.04*ch ;
  context.font = 0.03*ch+'px arial , sans-serif' ;
  context.textBaseline = 'top' ;
  var text = 'You helped win the Battle of Britain!  By placing the armour where there were fewest bullet holes you saved the RAF.  When planes get hit in these areas they are much less likely to make it back safe, so these are the areas that need to be reinforced the most.  The areas which have many bullet holes show that these areas can take quite a lot of damage before the plane is in trouble.' ;
  var h = wrapText(context, text, x, y, w, lh, false) ;
  context.fillStyle = 'rgba(255,255,255,0.9)' ;
  context.strokeStyle = 'rgb(0,0,0)' ;
  
  rounded_box_path(0.05*cw, y-0.5*lh, 0.05*cw+w, y+h+0.5*lh, lh, context) ;
  context.fill() ;
  context.stroke() ;
  
  context.fillStyle = 'rgb(0,0,0)' ;
  wrapText(context, text, x, y, w, lh, true) ;
  
  var sound = Get('audio_cheer') ;
  sound.volume = 0.5 ;
  sound.currentTime = 0 ;
  if(!mute) sound.play() ;
  
  context.restore() ;
}

function clear_canvas(context){
  context.save() ;
  context.fillStyle = 'rgb(255,255,255)' ;
  context.fillRect(0,0,cw,ch) ;
  context.restore() ;
}
function draw_start_screen(context){
  clear_canvas(context) ;
  context.save() ;
  
  context.fillStyle = 'rgb(0,0,0)' ;
  context.fillRect(0,0,cw,ch) ;
  
  var img = Get('img_spitfires') ;
  var iw = img.width  ;
  var ih = img.height ;
  var buffer = ch-2*ih ;
  context.drawImage(img, 0, 0, iw, ih, 0, 0.5*buffer, cw, 2*ih) ;
  context.fillStyle = 'rgba(255,255,255,0.25)' ;
  context.fillStyle = 'rgb(0,0,0)' ;
  context.strokeStyle = 'rgb(255,255,255)' ;
  
  context.font = 0.1*ch+'px arial , sans-serif' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.lineWidth = 4 ;
  var text = 'Save the spitfires!' ;
  context.fillText  (text, 0.5*cw, 0.1*ch) ;
  context.strokeText(text, 0.5*cw, 0.1*ch) ;
  
  var text = 'Click to start' ;
  context.fillText  (text, 0.5*cw, 0.7*ch) ;
  context.strokeText(text, 0.5*cw, 0.7*ch) ;
  context.restore() ;
}
function draw_grid_of_planes(context){
  clear_canvas(context) ;
  context.save() ;
  
  var fh = 0.02*ch ;
  var lh = fh*1.5 ;
  
  var y1 = 0.025*ch ;
  var y2 = 0.080*ch ;
  var y3 = 0.230*ch ;
  var y4 = 0.750*ch ;
  var y5 = 0.850*ch ;
  var yp = 0.48*ch ;
  
  context.textAlign = 'center' ;
  context.textBaseline = 'top' ;
  context.fillStyle = 'black' ;
  context.font = fh+'pt arial , sans-serif' ;
  var text = 'In this game you have to protect fighter planes by adding armour.' ;
  wrapText(context, text, 0.5*cw, y1, 0.8*cw, lh, true) ;
  
  var text = 'Each night the pilots fly a mission protecting Britain from the German fighter planes.  The next morning we look at the planes that came back, and where they where they were damaged by German bullets.' ;
  wrapText(context, text, 0.5*cw, y2, 0.8*cw, lh, true) ;
  
  var text = 'Here\'s a typical plane that came back from a mission:' ;
  wrapText(context, text, 0.5*cw, y3, 0.8*cw, lh, true) ;
  
  if(false){
    var img = Get('img_hurricane') ;
    var iw = img.width  ;
    var ih = img.height ;
    var s = 0.73 ;
    context.drawImage(img, 0, 0, iw, ih, 0.601*cw-0.5*s*iw, 0.4*ch-0.5*s*ih, s*iw, s*ih) ;
  }
  
  var plane = new plane_object() ;
  var bullet_1 = new bullet_object( 0.05,  0.20) ;
  var bullet_2 = new bullet_object(-0.5 , -0.20) ;
  var bullet_3 = new bullet_object( 0.4 , -0.22) ;
  bullet_1.status = true ; bullet_1.hit = false ;
  bullet_2.status = true ; bullet_2.hit = true  ;
  bullet_3.status = true ; bullet_3.hit = true  ;
  plane.bullets.push(bullet_1) ;
  plane.bullets.push(bullet_2) ;
  plane.bullets.push(bullet_3) ;
  
  plane.draw(context, 0.5*cw, yp, 0.25*cw, 0, 'outline fill camo bullets') ;
  
  var text = 'Those red circles are bullet holes that pierced the existing armour and damaged the plane, and the yellow circle is where the bullets hits the armour, but did not damage the plane.' ;
  wrapText(context, text, 0.5*cw, y4, 0.8*cw, lh, true) ;
  
  var text = 'Our goal is to get a 75% success rate.' ;
  wrapText(context, text, 0.5*cw, y5, 0.8*cw, lh, true) ;
  
  context.font = 0.05*ch+'pt arial , sans-serif' ;
  context.fillText('Click to continue', 0.5*cw, 0.9*ch) ;
  
  context.restore() ;
}
function draw_cumulative_planes_proxy(){ draw_cumulative_planes(context) ; }
function draw_cumulative_planes(context){
  clear_canvas(context) ;
  context.save() ;
  
  var fh = 0.02*ch ;
  var lh = fh*1.5 ;
  
  var y1 = 0.025*ch ;
  var y2 = 0.100*ch ;
  var y3 = 0.250*ch ;
  var y4 = 0.700*ch ;
  var yp = 0.75*ch ;
  
  context.textAlign = 'center' ;
  context.textBaseline = 'top' ;
  context.fillStyle = 'black' ;
  context.font = fh+'pt arial , sans-serif' ;
  var text = 'Each morning we look at the bullet holes from last night\'s mission and combine these to get an "average bullet density".' ;
  wrapText(context, text, 0.5*cw, y1, 0.8*cw, lh, true) ;
  
  cum_plane_1.x += cw*1.5/nCounts ;
  cum_plane_2.x += cw*1.5/nCounts ;
  cum_plane_3.x += cw*1.5/nCounts ;
  cum_plane_4.x += cw*1.5/nCounts ;
  
  if(cum_plane_1.x>0.5*cw){
    for(var i=0 ; i<cum_plane_1.bullets.length ; i++){
      cumulative_plane.bullets.push(cum_plane_1.bullets[i]) ;
    }
    cum_plane_1.bullets = [] ;
  }
  if(cum_plane_2.x>0.5*cw){
    for(var i=0 ; i<cum_plane_2.bullets.length ; i++){
      cumulative_plane.bullets.push(cum_plane_2.bullets[i]) ;
    }
    cum_plane_2.bullets = [] ;
  }
  if(cum_plane_3.x>0.5*cw){
    for(var i=0 ; i<cum_plane_4.bullets.length ; i++){
      cumulative_plane.bullets.push(cum_plane_3.bullets[i]) ;
    }
    cum_plane_3.bullets = [] ;
  }
  if(cum_plane_4.x>0.5*cw){
    for(var i=0 ; i<cum_plane_4.bullets.length ; i++){
      cumulative_plane.bullets.push(cum_plane_4.bullets[i]) ;
    }
    cum_plane_4.bullets = [] ;
  }
  cumulative_plane.draw(context, 0.5*cw, 0.35*ch, 0.25*cw, 0, 'outline fill camo bullets') ;
  
  if(cum_plane_1.x>1.25*cw){
    cum_plane_1.x -= 1.5*cw ;
    cum_plane_1.bullets = fire_bullets(cum_plane_1) ;
  }
  if(cum_plane_2.x>1.25*cw){
    cum_plane_2.x -= 1.5*cw ;
    cum_plane_2.bullets = fire_bullets(cum_plane_2) ;
  }
  if(cum_plane_3.x>1.25*cw){
    cum_plane_3.x -= 1.5*cw ;
    cum_plane_3.bullets = fire_bullets(cum_plane_3) ;
  }
  if(cum_plane_4.x>1.25*cw){
    cum_plane_4.x -= 1.5*cw ;
    cum_plane_4.bullets = fire_bullets(cum_plane_4) ;
  }
  cum_plane_1.draw(context, cum_plane_1.x, yp, 0.15*cw, 0, 'outline fill bullets') ;
  cum_plane_2.draw(context, cum_plane_2.x, yp, 0.15*cw, 0, 'outline fill bullets') ;
  cum_plane_3.draw(context, cum_plane_3.x, yp, 0.15*cw, 0, 'outline fill bullets') ;
  cum_plane_4.draw(context, cum_plane_4.x, yp, 0.15*cw, 0, 'outline fill bullets') ;
  
  context.font = 0.05*ch+'pt arial , sans-serif' ;
  context.fillText('Click to continue', 0.5*cw, 0.9*ch) ;
  
  context.restore() ;
}
function draw_average_plane(context){
  var x = average_plane_x0 ;
  var y = average_plane_y0 ;
  var s = average_plane_scale ;
  context.save() ;
  context.fillStyle = 'rgb(0,0,0)' ;
  context.font = 0.05*ch + 'px arial , sans-serif' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillText('Bullet density', 0.25*cw, 0.15*ch) ;
  average_plane.draw(context, x, y, s, 0, 'outline camo fill bullets') ;
  
  context.fillStyle = 'rgb(200,200,200)' ;
  context.strokeStyle = 'rgb(0,0,0)' ;
  context.fillRect  (button_x1, button_y1, button_x2-button_x1, button_y2-button_y1) ;
  context.strokeRect(button_x1, button_y1, button_x2-button_x1, button_y2-button_y1) ;
  context.fillStyle = 'rgb(0,0,0)' ;
  context.font = 0.05*ch + 'px arial , sans-serif' ;
  context.fillText('We\'re ready.  Chocks away!', 0.5*(button_x1+button_x2), 0.5*(button_y1+button_y2)) ;
  
  context.restore() ;
}
function draw_painting_plane(context){
  var x = painting_plane_x0 ;
  var y = painting_plane_y0 ;
  var s = painting_plane_scale ;
  context.save() ;
  context.fillStyle = 'rgb(0,0,0)' ;
  context.font = 0.05*ch + 'px arial , sans-serif' ;
  context.textAlign = 'center' ;
  context.textBaseline = 'middle' ;
  context.fillText('Remaining armour: ' + (nArmour-nArmourUsed), x, 0.15*ch) ;
  painting_plane.draw(context, x, y, s, 0, 'outline camo fill density armour') ;
  context.restore() ;
}
function draw_stats_table(context){
  var y0 = button_y2 + 0.005*ch ;
  var h  = ch - y0 ;
  var pieces = painting_plane.pieces ;
  var nPieces = pieces.length ;
  var textSize = 0.035*ch ;
  var dh = 1.5*textSize ;
  context.save() ;
  context.font = textSize+'px arial' ;
  context.fillStyle = 'black' ;
  var result = (results.length>0) ? results[results.length-1] : false ;
  
  if(result){
    for(var i=0 ; i<nPieces ; i++){
      var text = pieces[i].name ;
      var x = 0.3*cw ;
      if(i>2) x += 0.5*cw ;
      var y = ch - h + (1+(i+1)%3)*dh ;
      context.textAlign = 'right' ;
      context.fillText(text+': ', x, y) ;
      
      var x2 = x + 0.002*cw ;
      context.textAlign = 'left' ;
      context.fillText(result[i], x2, y) ;
    }
    
    context.save() ;
    var x3 = 0.5*cw ;
    var y3 = 0.93*ch ;
    context.font = 0.06*ch+'px arial' ;
    context.textAlign = 'center' ;
    context.fillText('Success rate: ' + result[result.length-1], x3, y3) ;
    context.restore() ;
  }
  
  context.restore() ;
}

function draw_stats_table_old(context){
  var y = button_y2 + 0.01*ch ;
  var h = ch - y ;
  var pieces = painting_plane.pieces ;
  var nPieces = pieces.length ;
  var dh = h/(nPieces+4) ;
  context.textAlign = 'left' ;
  context.font = 0.02*ch+'px arial' ;
  context.fillStyle = 'black' ;
  for(var i=-1 ; i<nPieces+1 ; i++){
    var text = '' ;
    if(i>=0 && i<nPieces) text = pieces[i].name ;
    if(i>=nPieces) text = 'Success' ;
    context.fillText(text, 0.1*cw, ch-h+(i+1)*dh) ;
    for(var j=0 ; j<results.length ; j++){
      if(i==-1) continue ;
      context.fillText(results[j][i], 0.25*cw+j*0.1*cw, ch-h+(i+1)*dh) ;
    }
  }
}

function results_object(plane, success){
  var arr = [] ;
  for(var i=0 ; i<plane.pieces.length ; i++){
    arr.push(plane.pieces[i].armour) ;
  }
  arr.push(success) ;
  return arr ;
}

function draw_RAF_base(context, base){
  context.save() ;
  var r = 0.01*cw ;
  var colors = [ 'rgb(0,0,138)', 'rgb(255,255,255)' , 'rgb(193,0,35)' ] ;
  for(var i=0 ; i<colors.length ; i++){
    context.beginPath() ;
    context.arc(base[0],base[1],(colors.length-i)*r,0,2*Math.PI,true) ;
    context.fillStyle = colors[i] ;
    context.fill() ;
  }
}
function draw_map_handle(){
  draw_map(context, map_counter) ;
  map_counter++ ;
  if(map_counter==map_steps){
    game_state = 'map_end' ;
    map_counter = 0 ;
    map_index++ ;
    return ;
  }
  window.setTimeout(draw_map_handle, map_delay) ;
}
function make_battle_planes(){
  battle_planes = [] ;
  for(var i=0 ; i<10 ; i++){
    var i1 = (3456+i*107+298*map_index)%RAF_bases.length ;
    var x1 = RAF_bases[i1][0] ;
    var y1 = RAF_bases[i1][1] ;
    
    var r_battle = (0.5+0.3*random())*cw ;
    var t_battle = random()*0.5*pi ;
    var x2 = r_battle*cos(t_battle) ;
    var y2 = r_battle*sin(t_battle) ;
    
    if(y2>ch) y2 = -ch+r_battle*1.25 ;
    
    var theta = atan2(y2-y1,x2-x1) ;
    var h = sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)) ;
    var fp = new flightpath(x1, y1, 0.05*ch, h, 1.5*pi+theta) ;
    battle_planes.push(fp) ;
  }
}
function draw_map(context, map_counter){
  context.save() ;
  
  if(map_counter==0){
    make_battle_planes() ;
    var id = 'audio_chocksAway' ;
    if     (map_index%3==1){ id = 'audio_offTheyGo'    ; }
    else if(map_index%3==2){ id = 'audio_comeBackSafe' ; }
    var sound = Get(id) ;
    sound.volume = 0.2 ;
    sound.currentTime = 0 ;
    if(false==mute) sound.play() ;
  }
  
  for(var i=0 ; i<map_fightsPerStep ; i++){
    var plane = new plane_object() ;
    plane.add_armour(painting_plane) ;
    var bullets = fire_bullets(plane) ;
    plane.bullets = bullets ;
    if(plane.failed){
      nFailedPlanes++ ;
      if(nFailedPlanes%50==0 && false==mute){
        var id = (Math.random()<0.5) ? 'audio_SMG' : 'audio_breakdown' ;
        var sound = Get(id) ;
        sound.volume = 0.2 ;
        sound.currentTime = 0 ;
        sound.play() ;
      }
      if(nFailedPlanes==250 && false==mute){
        var sound = Get('audio_boo') ;
        sound.volume = 0.5 ;
        sound.currentTime = 0 ;
        sound.play() ;
        failed_mission = true ;
      }
    }
    else{
      surviving_planes.push(plane) ;
    }
  }
  
  var graphics_mode = 2 ;
  if(graphics_mode==1){
    clear_canvas(context) ;
    var img = Get('img_Channel') ;
    context.drawImage(img, 0, 0, cw, ch) ;
    for(var i=0 ; i<RAF_bases.length ; i++){
      draw_RAF_base(context, RAF_bases[i]) ;
    }
  
    var textColor = 'white' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillStyle = textColor ;
    context.font = 0.05*ch+'pt arial , sans-serif' ;
    context.fillText('Success rate: ' + floor(100*(nPlanes-nFailedPlanes)/nPlanes) + '%', 0.5*cw, 0.05*ch) ;
    
    context.fillStyle = textColor ;
    context.font = 0.04*ch+'pt arial , sans-serif' ;
    wrapText(context,'All we can do now is watch and hope our boys come home safe', 0.5*cw, 0.85*ch, 0.8*cw, 0.06*ch, true) ;
    
    for(var i=0 ; i<battle_planes.length ; i++){
      if(i/battle_planes.length<nFailedPlanes/nPlanes) continue ;
      battle_planes[i].draw_position(map_counter/map_steps, 'plane') ;
    }
    
    if(show_UFO){
      draw_UFO(map_counter/map_steps) ;
    }
  
  }
  else{
    clear_canvas(context) ;
    var img = Get('img_Channel') ;
    context.drawImage(img, 0, 0, cw, ch) ;
    
    context.fillStyle = 'rgba(0,0,0,0.5)' ;
    context.fillRect(0,0,cw,ch) ;
    
    context.lineWidth = 2 ;
    context.strokeStyle = 'rgb(0,150,0)' ;
    context.beginPath() ;
    var nX = 10 ;
    var nY = 10 ;
    for(var i=0 ; i<=nX ; i++){
      context.moveTo(cw*i/nX, 0) ;
      context.lineTo(cw*i/nX,ch) ;
    }
    for(var i=0 ; i<=nY ; i++){
      context.moveTo(0 ,ch*i/nY) ;
      context.lineTo(cw,ch*i/nY) ;
    }
    context.stroke() ;
    
    context.beginPath() ;
    context.lineWidth = 5 ;
    context.moveTo(0.5*cw,0.5*ch) ;
    var t = 2*pi*counter/25 ;
    context.lineTo(0.5*cw+cw*cos(t),0.5*ch+ch*sin(t)) ;
    context.stroke() ;
    
    for(var i=0 ; i<RAF_bases.length ; i++){
      draw_RAF_base(context, RAF_bases[i]) ;
    }
    
    var textColor  = 'black' ;
    var panelColor = 'rgb(99,99,99)' ;
    var panelFill = gradient_panel ;
    
    var r0 = 0.05*cw ;
    var r1 = 0.20*cw ;
    var r2 = 0.05*cw ;
    var y1 = 0.05*ch ;
    var y2 = 0.90*ch ;
    var x1 = 0.05*ch ;
    var x2 = 0.50*ch-r1 ;
    var x3 = 0.50*ch ;
    var x4 = 0.50*ch+r1 ;
    var x5 = 0.95*ch ;
    
    for(var i=0 ; i<battle_planes.length ; i++){
      if(i/battle_planes.length<nFailedPlanes/nPlanes) continue ;
      battle_planes[i].draw_position(map_counter/map_steps, 'plane') ;
    }
    
    if(show_UFO){
      draw_UFO(map_counter/map_steps) ;
    }
    
    // Make the outer panel.
    context.fillStyle = panelFill ;
    context.fillRect(-1,-1,cw+2,y1+2) ;
    context.fillRect(-1,-1,x1+2,y2+2) ;
    context.fillRect(x5,-1,x1+2,y2+2) ;
    context.fillRect(-1, y2,cw+2,ch-y2+2) ;
    
    context.beginPath() ;
    context.moveTo(x1,y1) ;
    context.lineTo(x1+r0,y1) ;
    context.arcTo(x1,y1,x1,x1+r0,r0) ;
    context.lineTo(x1,y1) ;
    
    context.moveTo(x5,y1) ;
    context.lineTo(x5-r0,y1) ;
    context.arcTo(x5,y1,x5,y1+r0,r0) ;
    context.lineTo(x5,y1) ;
    context.fill() ;
    
    context.moveTo(x5,y2) ;
    context.lineTo(x5-r2,y2) ;
    context.arcTo(x5,y2,x5,y2-r0,r0) ;
    context.lineTo(x5,y2) ;
    context.fill() ;
    
    context.moveTo(x1,y2) ;
    context.lineTo(x1+r0,y2) ;
    context.arcTo(x1,y2,x1,y2-r0,r0) ;
    context.lineTo(x1,y2) ;
    context.fill() ;
    
    context.fillStyle = textColor ;
    context.font = 0.04*ch+'pt arial , sans-serif' ;
    context.textAlign = 'center' ;
    context.fillText('Success-o-meter', x3, y2+0.5*(ch-y2)) ;
    
    // Make the dial.
    context.fillStyle = panelFill ;
    context.fillRect(x3-r1, y2-r2-1, 2*r1, r2+2) ;
    
    context.moveTo(x3-r1   ,y2) ;
    context.lineTo(x3-r1-r2,y2) ;
    context.arcTo(x3-r1,    y2,0.5*cw-r1,y2-r2,r2) ;
    context.lineTo(x3-r1,y2) ;
    context.fill() ;
    
    context.moveTo(x3+r1   ,y2) ;
    context.lineTo(x3+r1+r2,y2) ;
    context.arcTo(x3+r1,    y2,x3+r1,y2-r2,r2) ;
    context.lineTo(x3+r1,y2) ;
    context.fill() ;
    
    context.beginPath() ;
    context.arc(x3, y2-r2, r1, 0, 1*pi, true) ;
    context.fill() ;
    
    context.beginPath() ;
    context.fillStyle = 'white' ;
    context.arc(x3, y2-r2, 0.8*r1, 0, pi, true) ;
    context.arcTo(x3-0.8*r1, y2, x3-0.8*r1+r2, y2, r2) ;
    context.lineTo(x3+0.8*r1-r2,y2) ;
    context.arcTo(x3+0.8*r1, y2, x3+0.8*r1, y2-r2, r2) ;
    context.fill() ;
    
    context.strokeStyle = 'rgb(0,0,0)' ;
    var nWedge = 8 ;
    var rho = 0.75*r1 ;
    context.lineWidth = 2 ;
    for(var i=0 ; i<=nWedge ; i++){
      context.fillStyle = 'black' ;
      if(i%2==0){
        context.font = 0.025*ch+'pt arial , sans-serif' ;
        context.textBaseline = 'middle' ;
        context.translate(x3,y2-r2) ;
        var t = pi*(-0.5+(i+0.0)/nWedge) ;
        context.rotate(-t) ;
        var f = 100-floor(100*i/nWedge) ;
        context.fillText(f+'%', 0, -r1+0.5*r2) ;
        context.rotate( t) ;
        context.translate(-x3,-(y2-r2)) ;
      }
      if(i==nWedge) continue ;
      var t0 = pi*(i+0)/nWedge ;
      var t1 = pi*(i+1)/nWedge ;
      context.beginPath() ;
      context.moveTo(x3, y2-r2) ;
      context.lineTo(x3+rho*cos(t0), y2-r2-rho*sin(t0)) ;
      context.arc(x3, y2-r2, rho, -t0, -t1, true) ;
      context.lineTo(x3,y2-r2) ;
      context.fillStyle = (0.25>1.0*i/nWedge) ? 'rgb(200,250,200)' : 'rgb(255,150,150)' ;
      context.fill() ;
      context.stroke() ;
    }
    
    context.beginPath() ;
    context.lineWidth = 5 ;
    context.moveTo(x3,y2-r2) ;
    var f = (nPlanes-nFailedPlanes)/nPlanes ;
    var t = pi*(1-f) ;
    context.lineTo(x3+0.9*rho*cos(t),y2-r2-0.9*rho*sin(t)) ;
    context.stroke() ;
    
    // Draw screws.
    context.strokeStyle = '#222222' ;
    var r = 0.02*cw ;
    var dr = 0.6*r/sqrt(2) ;
    var x0s = [2*r,cw-2*r,cw-2*r,2*r] ;
    var y0s = [2*r,2*r,ch-3*r,ch-3*r] ;
    for(var i=0 ; i<x0s.length ; ++i){
      context.beginPath() ;
      context.arc(x0s[i], y0s[i], r, 0, 2*pi, true) ;
      context.stroke() ;
      context.beginPath() ;
      context.moveTo(x0s[i]-dr,y0s[i]-dr) ;
      context.lineTo(x0s[i]+dr,y0s[i]+dr) ;
      context.moveTo(x0s[i]-dr,y0s[i]+dr) ;
      context.lineTo(x0s[i]+dr,y0s[i]-dr) ;
      context.stroke()
    }
    
  }
  context.fillStyle = panelColor ;
  context.beginPath() ;
  context.arc(x3,y2-r2,0.25*r2,0,2*pi,true) ;
  context.fill() ;
  
  context.restore() ;
}
function flightpath(x1, y1, r, h, theta, type){
  this.x1 = x1 ;
  this.y1 = y1 ;
  this.cx = 0 ;
  this.cy = h ;
  this.theta = theta ;
  this.beta = acos(r/h) ;
  this.xA =  h*cos(this.beta) ;
  this.yA =  h*sin(this.beta) ;
  this.xB = -h*cos(this.beta) ;
  this.yB =  h*sin(this.beta) ;
  this.r = r ; // Radius of turning circle
  this.h = h ; // Length to centre of turning circle
  this.l = sqrt(h*h-r*r) ; // Straight line distance
  this.s = 2*pi*this.r - 2*r*this.beta ; // Arc length of turning circle
  this.t = 2*this.l + this.s ; // Total path length
  this.draw_position = function(f, type){
    context.save() ;
    var x = -1000 ;
    var y = -1000 ;
    var angle = 0 ;
    if(f<this.l/this.t){
      context.save() ;
      var rho = f*this.t/this.l ;
      x = rho*this.xA ;
      y = rho*this.yA ;
      angle = this.beta+0.5*pi ;
    }
    else if(f<(this.l+this.s)/this.t){
      var rho = (f*this.t-this.l)/this.s ;
      var nSteps = floor(map_steps*this.s/this.t) ;
      var b0 =      this.beta ;
      var b1 = 2*pi-this.beta ;
      var db = (b1-b0)/nSteps ;
      b0 += 1*db ;
      b1 -= 1*db ;
      var beta = b0+rho*(b1-b0) ;
      x = this.cx + this.r*sin(beta) ;
      y = this.cy - this.r*cos(beta) ;
      angle = beta+0.5*pi ;
    }
    else{
      var rho = (f*this.t-this.s-this.l)/this.l ;
      x = (1-rho)*this.xB ;
      y = (1-rho)*this.yB ;
      angle = 0.5*pi-this.beta ;
    }
    
    context.translate(this.x1, this.y1) ;
    context.rotate(this.theta) ;
    
    if(type=='plane'){
      var plane = new plane_object() ;
      plane.color = 'white' ;
      plane.draw(context, x, y, 0.03*cw, angle, 'fill') ;
    }
    else if(type=='UFO'){
      context.rotate(-this.theta) ;
      context.fillStyle = UFO_color1 ;
      context.beginPath() ;
      var s = 0.010*cw ;
      context.arc(x, y, s, 0, pi, true) ;
      context.closePath() ;
      context.fill() ;
      context.beginPath() ;
      context.fillStyle = UFO_color2 ;
      context.moveTo(x-1.0*s, y+0.0*s) ;
      context.lineTo(x-1.5*s, y+0.4*s) ;
      context.lineTo(x+1.5*s, y+0.4*s) ;
      context.lineTo(x+1.0*s, y+0.0*s) ;
      context.lineTo(x-1.0*s, y+0.0*s) ;
      context.fill() ;
      context.rotate(this.theta) ;
    }
    context.rotate(-this.theta) ;
    context.translate(-this.x1, -this.y1) ;
    context.restore() ;
  }
  this.draw = function(context){
    context.beginPath() ;
    
    context.translate(this.x1, this.y1) ;
    context.rotate(this.theta) ;
    
    context.lineWidth = 5 ;
    
    context.beginPath() ;
    context.strokeStyle = 'rgb(255,255,255)' ;
    context.moveTo(0,0) ;
    context.arc(this.cx, this.cy, this.r, 1.5*pi+this.beta, 1.5*pi+2*pi-this.beta, false) ;
    context.lineTo(0,0) ;
    context.closePath() ;
    context.stroke() ;
    
    context.rotate(-this.theta) ;
    context.translate(-this.x1, -this.y1) ;
    
    context.save() ;
  }
}
function draw_UFO(f){
  UFO_fp.draw_position(f, 'UFO') ;
}

function Get(id){ return document.getElementById(id) ; }
