// Objects for the canvases we draw onto.
var canvas  = null ;
var context = null ;

// Detector parts.
var detector = new detector_object() ;

// A histogram to draw the final results.
var histogram = null ;

// Variables to control the game.
var heartbeat_counter = 0 ;

var game = new game_object() ;

// Phone home!  We may refactor this to something more friendly (eg jQuery.)
var xmlhttp = GetXmlHttpObject() ;

function start(){
  // Set the global variables.
  canvas = Get('canvas_eventDisplay') ;
  context = canvas.getContext('2d') ;
  //context.translate(0.5,0.5) ;
  context.lineCap = 'round' ;
  
  var canvas_eventDisplay_hidden = Create('canvas') ;
  canvas_eventDisplay_hidden.id = 'canvas_eventDisplay_hidden' ;
  canvas_eventDisplay_hidden.width  = cw*drawRatio ;
  canvas_eventDisplay_hidden.height = ch*drawRatio ;
  Get('div_hidden').appendChild(canvas_eventDisplay_hidden) ;
  
  var canvas_eventDisplay_hidden_activity = Create('canvas') ;
  canvas_eventDisplay_hidden_activity.id = 'canvas_eventDisplay_hidden_activity' ;
  canvas_eventDisplay_hidden_activity.width  = cw*drawRatio ;
  canvas_eventDisplay_hidden_activity.height = ch*drawRatio ;
  Get('div_hidden').appendChild(canvas_eventDisplay_hidden_activity) ;
  
  canvas.width  = 750*drawRatio ;
  canvas.height = 750*drawRatio ;
  canvas.style.width  = '750px' ;
  canvas.style.height = '750px' ;
  
  home_screen() ;
  
  // Apply the style to be neutral.  This is done so that we only need to set a single
  // colour in settings.js and make the style function as complex as we like.
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
  
  if(getParameterByName('team')){
    if(getParameterByName('team')=='ATLAS'){
      game.team_name = 'ATLAS' ;
    }
    else if(getParameterByName('team')=='CMS'){
      game.team_name = 'CMS' ;
    }
    
    var person = prompt('Please enter your name', '') ;
    if(person!=null) game.player.name = person ;
    start_collaborative_game() ;
  }
  
  // Add eventListeners.
  document.addEventListener('keydown'   , keyDown          ) ;
  canvas  .addEventListener('mousedown' , eventDisplayClickMouseDown) ;
  canvas  .addEventListener('touchstart', eventDisplayClickTouchStart) ;
  
  Get('button_playCollaborative').addEventListener('click', start_collaborative_game) ;
  Get('button_playSuddenDeath'  ).addEventListener('click', start_suddenDeath_game  ) ;
  Get('button_playPro'          ).addEventListener('click', start_pro_game          ) ;
  //Get('button_playStory'        ).addEventListener('click', start_story_game        ) ;
  
  Get('input_name' ).addEventListener('change', checkPlayerName ) ;
  Get('button_name').addEventListener('click' , changePlayerName) ;
  
  // These are not visible, and are mainly there so we can make them visible for single
  // player mode.
  Get('span_eventsPerShift').innerHTML = collisions_per_shift ;
  Get('span_shiftsPerGame' ).innerHTML = shifts_per_game ;
  
  // Make a histogram and trigger for use later.
  histogram = new four_lepton_mass_histogram(canvas) ;
  
  window.setInterval(heartbeat, delay) ;
  
  Get('input_name').value = game.player.name ;
  
  window.setTimeout(begin, 10) ;
  
  //slides[0].draw(canvas) ;
}

function begin(){
  // Now do the expensive stuff.
  make_detector() ;
  
  // This is CPU intensive, so do it last
  detector.make_cells() ;
  for(var i=0 ; i<detector.segments.length ; i++){
    detector.segments[i].activate_cells() ;
  }
  
  make_eventDisplay_base() ;
}
