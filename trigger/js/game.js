// This object keeps track of the game so we don't have as many global variables flying
// around as we used to.

function statistics_object(){
  // This object holds all the useful information about the numbers of successes etc.
  this.fields = ['true_positives', 'true_negatives', 'false_positives', 'false_negatives', 'total_events', 'higgsy_events', 'total_savedEvents', 'total_deliveredEvents'] ;
  this.values = [] ;
  this.reset = function(){
    for(var i=0 ; i<this.fields.length ; i++){
      this.values[this.fields[i]] = 0 ;
    }
  }
  this.reset() ;
  
  this.add_statistics = function(other){
    for(var i=0 ; i<this.fields.length ; i++){
      this.values[this.fields[i]] += other.values[this.fields[i]] ;
    }
  }
  
  this.score = function(){
    var result = this.values['true_positives']+this.values['true_negatives'] - 0.5*(this.values['false_positives']+this.values['false_negatives']) ;
    if(result<0) result = 0 ;
    return result ;
  }
}

function player_object(){
  this.list_of_names = player_names ;
  this.name = this.list_of_names[floor(random()*this.list_of_names.length)] ;
}

function game_object(){
  this.state = 'preamble' ;
  this.mode = 'collaborative' ;
  this.difficulty = 'easy' ;
  
  this.ws = false ;
  this.use_ws = use_ws ;
  if(this.use_ws){
    this.ws = new WebSocket('ws://www.ministryofsense.com:8080/') ;
    this.ws.onopen = function(e){
      console.log("Connection established!") ;
      game.ws.send('type:triggerPush') ;
    } ;
    this.ws.onmessage = function(e){} ;
  }
  
  this.ajax = false ;
  this.use_ajax = use_ajax ;
  if(this.use_ajax){
    this.ajax = new ajax_object() ;
  }
  
  this.paused = true ;
  this.muted  = false ;
  this.can_click = true ;
  this.team_name = 'neutral' ;
  
  this.player = new player_object() ;
  
  // Settings for animating the event display.
  // This is expressed as percentage of how "complete" the animation is.  Once this is
  // > 100% the animation stops.
  this.draw_step = 0 ;
  // Allow the user to turn off the animations if they get annoying etc.
  this.animate_eventDisplay = true ;
  // Allow the app to stop the animation.
  this.kill_drawStep = false ;
  // This is used to "speed up" the animation.  A scale of 2 will go through the
  // animation twice as quickly, and when it reaches 100% it'll stay at the end.
  this.draw_step_scale = 2 ;
  
  this.seed = floor(1e9*random()) ;
  this.PNG = new psuedorandom_number_generator() ;
  this.PNG.set_seed(this.seed) ;
  this.current_shift = null ;
  this.shift_counter = 0 ;
  this.shifts = [] ;
  
  // For debugging, show the cells on the canvas.
  this.underlay_cells = false ;
  this. overlay_cells = false ;
  
  // Statistics about the collisions.
  this.statistics = new statistics_object() ;

  this.score = 0 ;
  
  this.reset_statistics = function(){
    this.statistics.reset() ;
  }
  
  this.update_statistics = function(){
    this.reset_statistics() ;
    for(var i=0 ; i<this.shifts.length ; i++){
      this.statistics.add_statistics(this.shifts[i].statistics) ;
    }
    this.statistics.add_statistics(this.current_shift.statistics) ;
  }
  
  this.update_score = function(){
    this.update_statistics() ;
    this.score = this.statistics.score() ;
    Get('td_score').innerHTML = this.score ;
    return this.score ;
  }
  
  this.write_statistics = function(){
    this.update_statistics() ;
    for(var i=0 ; i<this.statistics.fields.length ; i++){
      if(Get('span_'+this.statistics.fields[i])){
        Get('span_'+this.statistics.fields[i]).innerHTML = this.statistics.values[this.statistics.fields[i]] ;
      }
    }
  }
  
  this.toggle_pause = function(){ this.paused = !this.paused ; }
  this.toggle_mute  = function(){ this.muted  = !this.muted  ; }
  
  this.start_shift = function(){
    game.current_shift = new shift_object(this.PNG) ;
    game.current_shift.start(context) ;
  }
  this.end_shift = function(){
    game.current_shift.end(context) ;
    game.shifts.push(game.current_shift) ;
  }
  this.enable_click = function(){ game.can_click = true ; }
  
  this.draw_game_over_screen = function(){
    draw_eventDisplay(this.current_shift.current_collision, context) ;
    this.current_shift.trigger.draw_failure(context) ;
    
    this.update_statistics() ;
    var score = this.statistics.values['true_positives'] + this.statistics.values['true_negatives'] ;
    
    var divWrapper = Get('div_eventDisplay') ;
    divWrapper.innerHTML = '<br />' ;
    divWrapper.style.backgroundSize = '750px 750px' ;
    divWrapper.style.backgroundImage = 'url('+canvas.toDataURL()+')' ;
    
    var divTmp = Create('div') ;
    divTmp.className = 'game_over' ;
    
    var h2 = Create('h2') ;
    h2.className = 'game_over' ;
    h2.innerHTML = 'Game over!' ;
    divTmp.innerHTML = '<br />' ;
    divTmp.appendChild(h2) ;
    
    var p = Create('p') ;
    p.className = 'game_over' ;
    p.innerHTML = this.game_over_message ;
    divTmp.appendChild(p) ;
    
    var p2 = Create('p') ;
    p2.className = 'game_over_score' ;
    p2.innerHTML = 'Score = ' +score + ' collisions' ;
    divTmp.appendChild(p2) ;
    divWrapper.appendChild(divTmp) ;
    
    divTmp = Create('div') ;
    divTmp.className = 'game_over' ;
    
    var button = Create('button') ;
    button.innerHTML = 'Submit score' ;
    button.className = 'game_over' ;
    button.id = 'button_submitScore' ;
    button.addEventListener('click', submit_score_suddenDeath) ;
    divTmp.appendChild(button) ;
    
    button = Create('button') ;
    button.innerHTML = 'Return home' ;
    button.className = 'game_over' ;
    button.id = 'button_returnHome' ;
    button.addEventListener('click', home_screen) ;
    divTmp.appendChild(button) ;
    
    divWrapper.appendChild(divTmp) ;
    
    Get('div_playSpace').appendChild(divWrapper) ;
    Get('div_hidden'   ).appendChild(Get('canvas_eventDisplay')) ;
  }
}

function home_screen(){
  game.state = 'preamble' ;
  var hiddenDiv = Get('div_hidden') ;
  var playSpace = Get('div_playSpace') ;
  while(playSpace.childNodes.length>0){ hiddenDiv.appendChild(playSpace.childNodes[0]) ; }
  playSpace.appendChild(Get('div_playFrontPage')) ;
  teams['neutral'].apply_style() ;
}

function submit_score_suddenDeath(){
  submit_score() ;
  var button = Get('button_submitScore')
  var div = button.parentNode
  div.removeChild(button) ;
  var p = Create('p') ;
  p.className = 'submit_score' ;
  p.innerHTML = 'Score submitted!' ;
  div.insertBefore(p, Get('button_returnHome')) ;
}
function submit_score(){
  var mode = game.mode ;
  if(game.mode=='suddenDeath' && game.difficulty=='pro') mode = 'pro' ;
  var request = '?task=add_score&score=' + game.statistics.score() + '&mode=' + mode + '&username=' + game.player.name ;
  var uri = 'event_store.php'+request+'&sid=' + Math.random() ;
  xmlhttp.open('GET', uri, true) ;
  xmlhttp.send(null) ;
}

function heartbeat(){
  // A heartbeat for periodic updates.
  // Maybe reset this after a huge number so we don't get int overflow?
  heartbeat_counter++ ;
  
  // Call the next heartbeat: Now done with setInterval
  //window.setTimeout(heartbeat, delay) ;
  
  // Draw the various screens depending on the state of the game.
  if(game.state=='shift_end'   && game.current_shift) game.current_shift.draw_end_screen(context)   ;
  if(game.state=='shift_start' && game.current_shift) game.current_shift.draw_start_screen(context) ;
  if(game.state=='game_start') draw_game_start_screen(context)  ;
}

function start_collaborative_game(){
  game.state = 'game_start' ;
  if(game.team_name=='ATLAS' || game.team_name=='CMS'){
    teams[game.team_name].apply_style() ;
    game.start_shift() ;
    game.state = 'shift_start' ;
  }
  start_game('collaborative') ;
}
function start_suddenDeath_game(){
  triggers = triggers_by_mode['all'] ;
  decay_scheme = all_decay_schema['VVH'] ;
  game.shifts = [] ;
  game.reset_statistics() ;
  game.state = 'shift_start' ;
  start_game('suddenDeath') ;
  game.start_shift() ;
}
function start_pro_game(){
  game.difficulty = 'pro' ;
  start_suddenDeath_game() ;
}
function start_cosmics_game(){
  game.state = 'shift_start' ;
  detector.B1 *= 1.0 ;
  detector.B2 *= 1.0 ;
  start_game('cosmics') ;
  game.start_shift() ;
}
function start_cosmicsNoField_game(){
  game.state = 'shift_start' ;
  detector.B1 *= 0.0 ;
  detector.B2 *= 0.0 ;
  start_game('cosmics') ;
  game.start_shift() ;
}
function start_story_game(){
  game.state = 'slides' ;
  detector.B1 = B1_0 ;
  detector.B2 = B2_0 ;
  start_game('cosmics') ;
  slides[0].draw() ;
  //game.start_shift() ;
}
function start_game(mode){
  game.mode = mode ;
  Get('div_hidden'   ).appendChild(Get('div_playFrontPage'  )) ;
  Get('div_playSpace').appendChild(Get('canvas_eventDisplay')) ;
  game.can_click = true ;
}

function changePlayerName(){
  var name = Get('input_name').value ;
  game.player.name = name ;
}
function checkPlayerName(){
  var name = Get('input_name').value ;
  if(name.length>nCharsPerName){
    name = name.substr(0,nCharsPerName-1) ;
  }
}

function pick_team(evt){
  // This is a little messy, so maybe rewrite this (along with the draw functions) to make
  // it easier to change.
  
  // First get the position of the mouse on the canvas.
  // Check this for cross browser compatibility!  It's okay for Firefox, Safari, Chrome.
  var x = evt.pageX - evt.target.offsetLeft ;
  var y = evt.pageY - evt.target.offsetTop  ;
  
  // See if the user has hit a target.
  var team_names = ['ATLAS','CMS'] ;
  for(var i=0 ; i<team_names.length ; i++){
    var click = (teams[team_names[i]].box.contains(x,y)) ;
    if(click){
      game.team_name = team_names[i] ;
      game.state = 'shift_start' ;
      game.start_shift() ;
    }
  }
  teams[game.team_name].apply_style() ;
  Get('div_teamname').innerHTML = 'Team ' + teams[game.team_name].title ;
}


