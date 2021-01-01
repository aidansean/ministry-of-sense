var music = [] ;
var current_music = null ;
var current_music_index = null ;
var music_playing = false ;

function create_music_playlist(){
  music.push(Get('music_intuit'   )) ;
  music.push(Get('music_Klockworx')) ;
  current_music_index = 0 ;
  current_music = music[current_music_index] ;
  Get('span_current_song').innerHTML = 'Track ' + (current_music_index+1) ;
  Get('canvas_music_pause').style.display = 'none' ;
}

function add_music_eventListeners(){
  Get('canvas_music_previous'  ).addEventListener('click', music_previous ) ;
  Get('canvas_music_play'      ).addEventListener('click', music_play     ) ;
  Get('canvas_music_pause'     ).addEventListener('click', music_play     ) ;
  Get('canvas_music_stop'      ).addEventListener('click', music_stop     ) ;
  Get('canvas_music_next'      ).addEventListener('click', music_next     ) ;
  Get('canvas_music_sound_off' ).addEventListener('click', sounds_mute_off) ;
  Get('canvas_music_sound_on'  ).addEventListener('click', sounds_mute_on ) ;
}

function draw_music_canvases(){
  var types = ['play','pause','stop','previous','next','sound_on','sound_off'] ;
  for(var i=0 ; i<types.length ; i++){
    draw_music_canvas(types[i]) ;
  }
}

function draw_music_canvas(type){
  var canvas_music = Get('canvas_music_'+type) ;
  var context_music = canvas_music.getContext('2d') ;
  var w = 20 ;
  var h = 20 ;
  canvas_music.width  = w ;
  canvas_music.height = h ;
  context_music.fillStyle = 'rgb(255,255,255)' ;
  context_music.fillRect(0,0,w,h) ;
  context_music.fillStyle = 'rgb(0,0,0)' ;
  if(type=='play'){
    context_music.beginPath() ;
    context_music.moveTo(0.2*w, 0.2*h) ;
    context_music.lineTo(0.8*w, 0.5*h) ;
    context_music.lineTo(0.2*w, 0.8*h) ;
    context_music.closePath() ;
    context_music.fill() ;
  }
  else if(type=='pause'){
    context_music.fillRect(0.2*w,0.2*h,0.2*w,0.6*h) ;
    context_music.fillRect(0.6*w,0.2*h,0.2*w,0.6*h) ;
  }
  else if(type=='stop'){
    context_music.fillRect(0.2*w,0.2*h,0.6*w,0.6*h) ;
  }
  else if(type=='next'){
    context_music.beginPath() ;
    context_music.moveTo(0.1*w, 0.7*h) ;
    context_music.lineTo(0.5*w, 0.5*h) ;
    context_music.lineTo(0.1*w, 0.3*h) ;
    context_music.closePath() ;
    context_music.fill() ;
    context_music.fillStyle = 'rgb(0,0,0)' ;
    context_music.beginPath() ;
    context_music.moveTo(0.5*w, 0.7*h) ;
    context_music.lineTo(0.9*w, 0.5*h) ;
    context_music.lineTo(0.5*w, 0.3*h) ;
    context_music.closePath() ;
    context_music.fill() ;
  }
  else if(type=='previous'){
    context_music.beginPath() ;
    context_music.moveTo(0.5*w, 0.7*h) ;
    context_music.lineTo(0.1*w, 0.5*h) ;
    context_music.lineTo(0.5*w, 0.3*h) ;
    context_music.closePath() ;
    context_music.fill() ;
    context_music.fillStyle = 'rgb(0,0,0)' ;
    context_music.beginPath() ;
    context_music.moveTo(0.9*w, 0.7*h) ;
    context_music.lineTo(0.5*w, 0.5*h) ;
    context_music.lineTo(0.9*w, 0.3*h) ;
    context_music.closePath() ;
    context_music.fill() ;
  }
  else if(type=='sound_on'){
    context_music.beginPath() ;
    context_music.moveTo(0.2*w, 0.4*h) ;
    context_music.lineTo(0.5*w, 0.2*h) ;
    context_music.lineTo(0.5*w, 0.8*h) ;
    context_music.lineTo(0.2*w, 0.6*h) ;
    context_music.closePath() ;
    context_music.fill() ;
    
    context_music.beginPath() ;
    context_music.arc(0.5*w, 0.5*h, 0.3*w, 2*pi/6, -2*pi/6, true) ;
    context_music.stroke() ;
    context_music.beginPath() ;
    context_music.arc(0.5*w, 0.5*h, 0.2*w, 2*pi/6, -2*pi/6, true) ;
    context_music.stroke() ;
  }
  else if(type=='sound_off'){
    context_music.beginPath() ;
    context_music.moveTo(0.2*w, 0.4*h) ;
    context_music.lineTo(0.5*w, 0.2*h) ;
    context_music.lineTo(0.5*w, 0.8*h) ;
    context_music.lineTo(0.2*w, 0.6*h) ;
    context_music.closePath() ;
    context_music.fill() ;
  }
}

function sounds_mute_on(){
  game.muted = true ;
  Get('canvas_music_sound_off').style.display = ''     ;
  Get('canvas_music_sound_on' ).style.display = 'none' ;
}
function sounds_mute_off(){
  game.muted = false ;
  Get('canvas_music_sound_on' ).style.display = ''     ;
  Get('canvas_music_sound_off').style.display = 'none' ;
}

function music_previous(){
  music_stop() ;
  current_music_index = (current_music_index-1)%music.length ;
  if(current_music_index<0) current_music_index += music.length ;
  current_music = music[current_music_index] ;
  music_play() ;
  music_play() ;
}
function music_next(){
  music_stop() ;
  current_music_index = (current_music_index+1)%music.length ;
  current_music = music[current_music_index] ;
  music_play() ;
  music_play() ;
}

function music_play(){
  if(current_music){
    Get('span_current_song').innerHTML = 'Track ' + (current_music_index+1) ;
    if(music_playing){
      current_music.pause() ;
      music_playing = false ;
      Get('canvas_music_play' ).style.display = '' ;
      Get('canvas_music_pause').style.display = 'none' ;
    }
    else{
      current_music.play() ;
      music_playing = true ;
      Get('canvas_music_play' ).style.display = 'none' ;
      Get('canvas_music_pause').style.display = '' ;
    }
  }
}
function music_pause() {
  if(current_music){
    current_music.pause() ;
    Get('canvas_music_play' ).style.display = '' ;
    Get('canvas_music_pause').style.display = 'none' ;
  }
}
function music_stop(){
  if(current_music){
    current_music.pause() ;
    current_music.currentTime = 0 ;
    music_playing = false ;
    Get('canvas_music_play' ).style.display = '' ;
    Get('canvas_music_pause').style.display = 'none' ;
  }
}

