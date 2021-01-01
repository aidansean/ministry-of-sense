function shift_object(PNG){
  this.collisions = [] ;
  this.collision_counter = 0 ;
  this.trigger = random_trigger(PNG) ;
  
  // Statistics about the collisions.
  this.statistics = new statistics_object() ;

  this.score = 0 ;
  
  this.start = function(){
    // Draw the shift start screen.
    game.shift_counter++ ;
    if(game.shift_counter>shifts_per_game && shifts_per_game>0){
      // This code never gets called with the current settings.  It's for the "end game"
      // (eg single player mode) so we should make something cool happen here instead, such
      // as adding the player's name to a leaderboard.
      var score = game.update_score() ;
    
      // This is the only place where we use the histgoram.
      animate_histogram() ;
      return ;
    }
    
    // Update the trigger text.
    game.current_shift.trigger.update_text() ;
    
    // Reset the game state.
    game.state = 'shift_start' ;
    game.paused = true ;
    game.can_click = false ;
    window.setTimeout(game.enable_click, delay_enable_click) ;
  
    game.reset_statistics() ;
  }
  this.end = function(context){
    // Send results to the server.
    game.current_shift.trigger.send_results_to_server() ;
    
    if(game.mode=='suddenDeath'){
      collision_delay_min *= 0.9 ;
      collision_delay_max *= 0.9 ;
      collision_delay_min = Math.max(collision_delay_min, 500) ;
      collision_delay_max = Math.min(collision_delay_max,1000) ;
    }
    else if(game.mode=='pro'){
      collision_delay_min *= 0.9 ;
      collision_delay_max *= 0.8 ;
      collision_delay_min = Math.max(collision_delay_min, 250) ;
      collision_delay_max = Math.min(collision_delay_max, 500) ;
    }
    
    // Draw the shift end screen.
    set_header_and_footer_images() ;
    //Get('div_header').appendChild(Get('table_music_player')) ;
    game.current_shift.draw_end_screen(context) ;
    game.state = 'shift_end' ;
    game.paused = true ;
    game.can_click = false ;
    window.setTimeout(game.enable_click, delay_enable_click) ;
  }
  
  this.draw_start_screen = function(context){
    // This is the screen the player sees between shifts.  It's loaded many times during
    // the course of a game and we call this function many times to animate the spokes.
    context.save() ;
    clear_canvas(context) ;
    
    spokes.draw(context) ;
    
    // Some more hard coded stuff that should probably be cleaned up.
    context.fillStyle = text_color ;
    context.textBaseline = 'middle' ;
    context.textAlign = 'center' ;
    context.font = 0.11*ch+'px arial' ;
    context.fillText('NEW SHIFT!', 0.5*cw, 0.15*ch) ;
    
    context.font = 0.06*ch+'px arial' ;
    context.fillText('Fire the trigger (click) for', 0.5*cw,  0.3*ch) ;
    context.fillText('events that contain:', 0.5*cw, 0.37*ch) ;
    
    // Better function name for this?
    game.current_shift.trigger.draw_topology_on_shift_start_screen(cw, ch) ;
    
    context.fillText(game.current_shift.trigger.description, 0.5*cw, 0.62*ch) ;
    
    if(game.can_click){
      context.fillText('Click to begin.', 0.5*cw, 0.9*ch) ;
    }
    
    context.restore() ;
  }
  this.draw_end_screen = function(c){
    // This shows the player their "score" which isn't used at the moment, but could be sent
    // to the server for analysis.  As usual we call this many times to animate the spokes.
    c.save() ;
    clear_canvas(c) ;
    
    spokes.draw(c) ;
    
    // We should probably write some simple function to write text on screen so we don't
     // need to hard code so much stuff like this.  We have plenty of space on the canvas
    // and we can play around with different statistics etc.
    // Consider adding some "friendly" graphics to say things like "Good job!" with a
    // smiley person.
    c.fillStyle = text_color ;
    c.textAlign = 'center' ;
    c.font = 0.11*ch+'px arial' ;
    c.fillText('Shift summary:', 0.5*cw, 0.125*ch) ;
    
    c.font = 0.06*ch+'px arial' ;
    c.fillText('Events saved: '       + this.statistics.values['total_savedEvents'] , 0.5*cw, 0.25*ch) ;
    c.fillText('Correct clicks: '     + this.statistics.values['true_positives'   ] , 0.5*cw, 0.32*ch) ;
    c.fillText('Incorrect clicks: '   + this.statistics.values['false_positives'  ] , 0.5*cw, 0.39*ch) ;
    c.fillText('Collisions missed: '  + this.statistics.values['false_negatives'  ] , 0.5*cw, 0.46*ch) ;
    //context.fillText('Collisions ignored: ' + this.statistics.values['true_negatives'   ] , 0.5*cw, 0.53*ch) ;
    c.font = 0.1*ch+'px arial' ;
    c.fillText('Score: ' + ((100/collisions_per_shift)*this.statistics.score()).toPrecision(3) + '%' , 0.5*cw, 0.62*ch) ;
    
    c.font = 0.04*ch+'px arial' ;
    c.fillText('Thank you for contributing to science!'       , 0.5*cw, 0.72*ch) ;
    c.fillText('With your help we\'ll find the Higgs boson!'  , 0.5*cw, 0.77*ch) ;
    
    if(game.can_click){
      // Finish with instructions about how to pass on to the next player, if this is
      // needed.
      // We can add different modes (multiplayer etc.)
      c.font = 0.06*ch+'px arial' ;
      c.fillText('Click to start the next shift.', 0.5*cw, 0.9*ch) ;
      c.font = 0.03*ch+'px arial' ;
      c.fillText('(Feel free to pass to the next player when you are ready)', 0.5*cw, 0.95*ch) ;
    }
    c.restore() ;
  }
}
