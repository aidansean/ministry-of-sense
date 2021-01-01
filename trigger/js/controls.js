var touchEvent = false ;

function eventDisplayClickMouseDown(evt){
  if(touchEvent){
    touchEvent = false ;
    return ;
  }
  else{
    eventDisplayClick(evt) ;
  }
}

function eventDisplayClickTouchStart(evt){
  touchEvent = true ;
  eventDisplayClick(evt) ;
}

function eventDisplayClick(evt){
  // This function detects a click and repsonds appropriately.
  // Keep careful track of the game state- there may be a bug where the final click of a
  // shift doesn't trigger an event!
  
  if(game.can_click==false) return ;
  
  if(game.state=='game_start'){
    pick_team(evt) ;
  }
  else if(game.state=='shift_start'){
    Get('span_shiftNumber').innerHTML = game.shift_counter ;
    set_footer_toplogy() ;
    
    // Start the collision thread to deliver new events
    collision_thread() ;
    game.state = 'playing' ;
    
    // Make sure we are not paused.  Explicitly setting paused=false might be simpler.
    if(game.paused) game.toggle_pause() ;
    
    // Reset everything
    game.reset_statistics() ;
    
    return ;
  }
  else if(game.state=='shift_end'){
    game.start_shift() ;
    game.state = 'shift_start' ;
  }
  else if(game.paused){
    // Wake the game up.  Is this counterintuitive for the player?  Best ask them!
    game.toggle_pause() ;
    return ;
  }
  else if(game.state=='playing'){
    // Play the game.
    game.current_shift.trigger.fire() ;
  }
}

// Controls to pause the game.
function keyDown(evt){
  var keyDownID = window.event ? event.keyCode : (evt.keyCode != 0 ? evt.keyCode : evt.which) ;
  switch(keyDownID){
    case 80: // p
      game.toggle_pause() ;
    case 32: // Space
      break ;
  }
}


