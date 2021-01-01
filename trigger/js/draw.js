// Simple function to clear the canvas.
function clear_canvas(context){
  context.fillStyle = eventDisplay_fillColor ;
  context.fillRect(0,0,cw,ch) ;
}

// This function draws a detector with no activity in it.  This can then be used to speed
// up drawing of the detector with activity in it.
function make_eventDisplay_base(){
  //return ;
  var canvas_base = Get('canvas_eventDisplay_hidden') ;
  var context_base = canvas_base.getContext('2d') ;
  
  //context_base.drawImage(Get('img_CMSPhoto'),  0, 0) ;
  
  context_base.fillStyle = 'rgba(255,255,255,0.25)' ;
  //context_base.fillRect(0,0,cw,ch) ;
  
  detector.draw(context_base) ;
}

function draw_eventDisplay_base_old(context){
  context.drawImage(Get('canvas_eventDisplay_hidden'),0,0) ;
}

function draw_eventDisplay_base(context){
  context.drawImage(Get('img_detectorBase'),0,0,cw,ch) ;
}

function draw_eventDisplay(collision, context){
  // Clear the canvas so we start with a clean black background.
  clear_canvas(context) ;
  
  // Draw the base image.
  draw_eventDisplay_base(context) ;
  
  // For debugging purposes, we can draw a mesh of cells.
  if(game.underlay_cells) draw_cells(context) ;
  
  // Draw the active segments over the top.
  detector.draw_active_segments(context) ;
  
  // Draw the tracks next.  So far these are only decorative.
  collision.draw_tracks(context, -1) ;
  
  // Now the jets.  These are collections of tracks of the same colour.
  // decorative so far.
  collision.draw_jets(context, -1) ;
  
  // Draw the main particles last, as we need the player to see these very clearly.
  if(game.difficulty!='pro'){
    collision.draw_main_particles(context, -1) ;
  }
  
  //collision.draw_interaction_point(context) ;
  
  // For debugging purposes, we can draw a mesh of cells again, this time on top of the
  // detector components and particles.
  if(game.overlay_cells) draw_cells(context) ;
}

function draw_eventDisplay_step_proxy(){
  if(game.kill_drawStep){
    var time_left = collision_delay*(100-game.draw_step)/100 ;
    window.setTimeout(collision_breather, time_left) ;
    return ;
  }
  var collision = game.current_shift.current_collision ;
  if(game.draw_step==0){
    var canvas_hidden = Get('canvas_eventDisplay_hidden_activity') ;
    var context_hidden = canvas_hidden.getContext('2d') ;
    draw_eventDisplay_step0(collision, context_hidden) ;
  }
  else{
    draw_eventDisplay_step(collision, context, game.draw_step*game.draw_step_scale) ;
  }
  
  if(game.paused==false){
    var nSteps = collision_delay/delay_drawStep ;
    var dStep = 100/nSteps ;
    game.draw_step += dStep ;
    game.draw_step = floor(game.draw_step) ;
  }
  if(game.draw_step<=100){
    window.setTimeout(draw_eventDisplay_step_proxy, delay_drawStep) ;
  }
  else{
    window.setTimeout(collision_breather, delay_drawStep) ;
  }
}

function draw_eventDisplay_step0(collision, context){
  // Clear the canvas so we start with a clean black background.
  clear_canvas(context) ;
  
  // Draw the base image.
  draw_eventDisplay_base(context) ;
  
  // For debugging purposes, we can draw a mesh of cells.
  if(game.underlay_cells) detector.draw_cells(context) ;
  
  // Draw the active segments over the top.
  detector.draw_active_segments(context) ;
  
  // Draw the tracks next.  So far these are only decorative.
  collision.draw_tracks(context, -1) ;
  
  // Now the jets.  These are collections of tracks of the same colour.
  // decorative so far.
  collision.draw_jets(context, -1) ;
}

function draw_eventDisplay_step(collision, context, step){
  context.drawImage(Get('canvas_eventDisplay_hidden_activity'),0,0) ;
  
  // For debugging purposes, we can draw a mesh of cells.
  //if(game.underlay_cells) draw_cells(context) ;
  
  // Draw the active segments over the top.
  //detector.draw_active_segments(context) ;
  
  // Draw the main particles last, as we need the player to see these very clearly.
  if(game.difficulty!='pro'){
    collision.draw_main_particles(context, step) ;
  }
  
  // For debugging purposes, we can draw a mesh of cells again, this time on top of the
  // detector components and particles.
  //if(game.overlay_cells) draw_cells(context) ;
}

function draw_game_start_screen(){
  // Function to draw the first screen of the game.  This is screen is only seen once,
  // but we call this function many times to animate the spokes.
  context.save() ;
  clear_canvas(context) ;
  
  spokes.draw(context) ;
  
  // Make some nice text boxes.  This was written last minute, so it should probably be
  // tided up and many variables moved to settings.js.
  context.strokeStyle = '#ffffff' ;
  context.lineWidth = 2 ;
  
  context.fillStyle = text_color ;
  context.textAlign = 'center' ;
  context.font = 0.08*ch+'px arial' ;
  context.fillText('Welcome to the'     , 0.5*cw, 0.15*ch) ;
  context.fillText('Higgs Trigger Game!', 0.5*cw, 0.27*ch) ;
  
  context.lineWidth = 1 ;
  context.font = 0.05*ch+'px arial' ;
  context.fillText('Choose your team:', 0.5*cw,  0.40*ch) ;
  
  context.font = 0.1*ch+'px arial' ;
  context.fillText('vs', 0.5*cw,  0.7*ch) ;
  
  // Draw some text boxes.
  teams['ATLAS'].draw_experiment_box(context, 'img_ATLAS') ;
  teams['CMS'  ].draw_experiment_box(context, 'img_CMS'  ) ;
  
  context.restore() ;
}

function draw_particle_head(context, X, Y, size, color, text, shape){
  context.save() ;
  
  //var rho = 5 ;
  var rho = drawRatio*size ;
  
  context.beginPath() ;
  if(abs(shape)<=2){
    context.arc(X, Y, rho, 0, 2*pi, true) ;
  }
  else if(abs(shape)>=3){
    var extra = (shape>0) ? 0 : 0.5 ;
    shape = abs(shape) ;
    for(var i=0 ; i<shape ; i++){
      var theta = 2*pi*(i+extra)/shape ;
      var Xi = X + rho*cos(theta) ;
      var Yi = Y + rho*sin(theta) ;
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
  var dR = 0.5*rho ;
  var gradient = context.createRadialGradient(X+0.75*dR,Y-0.75*dR,0,X+0.8*dR,Y-0.8*dR,2*dR) ;
  gradient.addColorStop(0,'white') ;
  gradient.addColorStop(1,color  ) ;
  context.fillStyle = gradient ;
  context.shadowBlur = size ;
  context.shadowColor = 'rgb(0,0,0)' ;
  context.fill() ;
  
  context.strokeStyle = 'rgb(0,0,0)' ;
  context.fillStyle = 'rgb(255,255,255)' ;
  context.font = 'italic ' + 1.5*(rho) + 'px times , serif' ;
  context.textBaseline = 'middle' ;
  context.textAlign    = 'center' ;
  context.shadowBlur = 0 ;
  context.strokeText(text, X, Y) ;
  context.fillText(text, X, Y) ;
  
  context.restore() ;
}

// Settings for the spinning spokes
function spokes_object(nSpokes, rate, oddColor, evenColor){
  this.nSpokes   = nSpokes   ;
  this.rate      = rate      ;
  this.oddColor  = oddColor  ;
  this.evenColor = evenColor ;
  
  this.draw = function(context){
    // This function draw the light/dark green spinning "spokes" that appear in the
    // background between shifts.
    context.save() ;
    
    // Fill the background with one colour, then draw triangles with the other.
    context.fillStyle = this.oddColor ;
    context.fillRect(0,0,cw,ch) ;
    
    // Draw the spokes in the other colour.
    context.fillStyle = this.evenColor ;
    
    // Advance phi0 so that the triangles get offset by a slightly different amount with
    // each heartbeat.
    var phi0 = this.rate*heartbeat_counter
    
    // Now loop over the spokes and draw triangles to complete the pattern.
    for(var i=0 ; i<this.nSpokes ; i+=2){
      var phi1 = phi0 + 2*pi*(i+0)/this.nSpokes ;
      var phi2 = phi0 + 2*pi*(i+1)/this.nSpokes ;
      
      // Would it cheaper to make only one path or several?
      context.beginPath() ;
    
      // Some boring maths stuff.  Yawn.
      context.moveTo(0.5*cw, 0.5*ch) ;
      context.lineTo(0.5*cw+2*cw*cos(phi1), 0.5*ch+2*cw*sin(phi1)) ;
      context.lineTo(0.5*cw+2*cw*cos(phi2), 0.5*ch+2*cw*sin(phi2)) ;
      context.lineTo(0.5*cw, 0.5*ch) ;
      context.closePath() ;
      context.fill() ;
    }
    
    context.restore() ;
  }
}
var spokes = new spokes_object(30, 0.002*2*pi, 'rgb(248,169,34)', 'rgb(254,191,36)') ;

