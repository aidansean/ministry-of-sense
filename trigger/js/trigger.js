// This is an object for managing the trigger.  It takes numbers of muons and electrons.
// It also sends the results of the event to the server.

function trigger_object(topology, description, name){
  // topology is n array, eg ['electron','muon'].
  this.topology = topology ;
  
  this.name = name ;
  
  // Flags to keep track of the status of the trigger.
  this.fired = false ;
  this.match_collision = false ;
  this.touched = false ;
  
  // Description of the trigger to remind the user when to fire.
  this.description = description ;
  this.update_text = function(){
    Get('span_trigger_description').innerHTML = this.description ;
  }
  
  this.collisions = [] ;
    
  this.start_collision = function(){
    // Set this flag to false- the user hasn't clicked yet
    this.fired = false ;
    
    // Check to see if the event topology matches the trigger topology.
    this.match_collision = match_topologies(game.current_shift.current_collision.topology, [this.topology]) ;
    
    // Touch the trigger so that we know the game has "seen" the trigger.
    this.touched = true ;
  }
  this.fire = function(){
    // Don't allow the user to fire more than once.
    if(this.fired) return ;
    game.kill_drawStep = true ;
    
    // Now fire the trigger and draw the result on the screen
    this.fired = true ;
    this.draw_success_or_failure(context) ;
    this.sound_success() ;
    
    // Send the result via websocket.
    if(game.current_shift.trigger.match_collision){
      var seed     = game.current_shift.current_collision.seed     ;
      var topology = game.current_shift.current_collision.topology ;
      if(game.use_ws){
        var request = 'trigger:'+game.team_name+':'+seed ;
        game.ws.send(request) ;
      }
      else if(game.use_ajax){
        var topology_string = topology.join() ;
        var request = 'event_store.php?task=add_single_collision&team=' + game.team_name + '&topology=' + topology_string + '&trigger=' + this.name + '&seed=' + seed + '&playerName=' + game.player.name ;
        game.ajax.send(request) ;
      }
    }
  }
  this.send_results_to_server = function(){
    return ;
    var request = '?task=add_collisions&trigger=' + this.name + '&team=' + game.team_name + '&seeds=' ;
    for(var i=0 ; i<this.collisions.length ; i++){
      if(i>0) request += ',' ;
      request += this.collisions[i].seed ;
    }
    request = 'event_store.php'+request+'&sid=' + Math.random() ;
    game.ajax.send(request) ;
  }
  this.update_table = function(){
    // Check to see if the game knows about this trigger yet.
    if(this.touched==false) return ;
    
    if(!game.current_shift.current_collision) return ;
    
    // Follow the logic to update the statistics correctly.  It's fairly straightforward.
    if(this.fired){
      if(this.match_collision){
        // Hurray!  The user fired the trigger properly and has a true positive.
        game.current_shift.statistics.values['true_positives']++ ;
        this.collisions.push(game.current_shift.current_collision) ;
      }
      else{
        // Oops!  The user fired the trigger for an irrelevant event.
        game.current_shift.statistics.values['false_positives']++ ;
      }
      // Whatever the result, this event gets saved and so contributes to the trigger
      // budget.
      game.current_shift.statistics.values['total_savedEvents']++ ;
      
      // Check to see if the event is "Higgslike" or not.
      var Higgsy = match_topologies(game.current_shift.current_collision.topology, decay_scheme['signal'].final_state_topologies) ;
      if(Higgsy){
        game.current_shift.statistics.values['higgsy_events']++ ;
        histogram.add_mass(game.current_shift.current_collision.hMass) ;
      }
    }
    else{
      if(this.match_collision){
        // Oops!  The user missed an event.
        game.current_shift.statistics.values['false_negatives']++ ;
      }
      else{
        // Phew, we didn't want this event anyway.
        game.current_shift.statistics.values['true_negatives']++ ;
      }
    }
    // Update the number of events we've seen, whether or not we saved them.
    game.current_shift.statistics.values['total_deliveredEvents']++ ;
    
    game.write_statistics() ;
  }
  this.draw_topology_on_shift_start_screen = function(w, h){
    var Y  = 0.5*h ;
    var dX = 0.2*w  ;
    var DX = (this.topology.length-1)*dX ;
    
    for(var i=0 ; i<this.topology.length ; i++){
      var X = (this.topology.length==1) ? 0.5*w : 0.5*w - 0.5*DX + DX*i/(this.topology.length-1) ;
      var settings = particle_settings[this.topology[i]] ;
      draw_particle_head(context, X, Y, 2.0*settings.headSize, settings.color, settings.symbol, settings.headShape) ;
    }
  }
  this.draw_success_or_failure = function(context){
    // Standard stuff for a new path.
    context.save() ;
    context.beginPath() ;
    if(game.current_shift.trigger.match_collision){
      this.draw_success(context) ;
    }
    else{
      this.draw_failure(context) ;
    }
  }
  
  this.draw_success = function(context){
    // Standard stuff for a new path.
    context.save() ;
    
    context.lineCap = 'round' ;
    context.beginPath() ;
    
    // Define some variables to draw the circles etc.  We should probably put these
    // in settings.js.
    context.lineWidth = 0.1*SR ;
    // Set the stroke colour.  We need better variable names for this!
    context.strokeStyle = collision_matched_color ;
    context.arc(0.5*cw, 0.5*ch, 0.8*SR, 0, 2*pi, true) ;
    
    // Tick mark.
    context.moveTo(0.3*cw,0.6*ch) ;
    context.lineTo(0.5*cw,0.7*ch) ;
    context.lineTo(0.7*cw,0.3*ch) ;
    
    // Finish things off.
    context.stroke() ;
    context.restore() ;
  }
  this.draw_failure = function(context){
    // Standard stuff for a new path.
    context.save() ;
    
    context.lineCap = 'round' ;
    context.beginPath() ;
    
    // Define some variables to draw the circles etc.  We should probably put these
    // in settings.js.
    context.lineWidth = 0.1*SR ;
    // Set the stroke colour.  We need better variable names for this!
    context.strokeStyle = collision_notMatched_color ;
    context.arc(0.5*cw, 0.5*ch, 0.8*SR, 0, 2*pi, true) ;
    
    // Cross mark.
    context.moveTo(0.3*cw,0.7*ch) ;
    context.lineTo(0.7*cw,0.3*ch) ;
    context.moveTo(0.3*cw,0.3*ch) ;
    context.lineTo(0.7*cw,0.7*ch) ;
    
    // Finish things off.
    context.stroke() ;
    context.restore() ;
  }

  this.sound_success = function(){
    if(game.muted==true) return ;
    var id = (this.match_collision) ? 'audio_win' : 'audio_fail' ;
    var sound = Get(id) ;
    sound.volume = 0.2 ;
    sound.currentTime = 0 ;
    sound.play() ;
  }
}

var ee_trigger = new trigger_object(['electron','electron'] , 'at least two electrons.'            , 'ee') ;
var  e_trigger = new trigger_object(['electron'           ] , 'at least one electron.'             , 'e' ) ;
var mm_trigger = new trigger_object(['muon','muon'        ] , 'at least two muons.'                , 'mm') ;
var  m_trigger = new trigger_object(['muon'               ] , 'at least one muon.'                 , 'm' ) ;
var  t_trigger = new trigger_object(['tau'                ] , 'at least one tau.'                  , 't' ) ;
var em_trigger = new trigger_object(['electron','muon'    ] , 'at least one electron and one muon.', 'em') ;
var et_trigger = new trigger_object(['electron','tau'     ] , 'at least one electron and one tau.' , 'et') ;
var mt_trigger = new trigger_object(['tau','muon'         ] , 'at least one tau and one muon.'     , 'tm') ;
var tt_trigger = new trigger_object(['tau','tau'          ] , 'at least two taus.'                 , 'tt') ;
var  p_trigger = new trigger_object(['photon'             ] , 'at least one photon.'               , 'p' ) ;
var pp_trigger = new trigger_object(['photon','photon'    ] , 'at least two photons.'              , 'pp') ;

var all_triggers = [] ;
all_triggers.push(ee_trigger) ;
all_triggers.push( e_trigger) ;
all_triggers.push(mm_trigger) ;
all_triggers.push( m_trigger) ;
all_triggers.push( t_trigger) ;
all_triggers.push(em_trigger) ;
all_triggers.push(et_trigger) ;
all_triggers.push(mt_trigger) ;
all_triggers.push(tt_trigger) ;
all_triggers.push( p_trigger) ;
all_triggers.push(pp_trigger) ;

var cosmics_triggers = [] ;
cosmics_triggers.push( m_trigger) ;

var single_lepton_triggers = [] ;
single_lepton_triggers.push(e_trigger) ;
single_lepton_triggers.push(m_trigger) ;

var EMu_triggers = [] ;
EMu_triggers.push( e_trigger) ;
EMu_triggers.push( m_trigger) ;
EMu_triggers.push(ee_trigger) ;
EMu_triggers.push(mm_trigger) ;
EMu_triggers.push(em_trigger) ;

var EMuTau_triggers = [] ;
EMuTau_triggers.push( e_trigger) ;
EMuTau_triggers.push( m_trigger) ;
EMuTau_triggers.push( t_trigger) ;
EMuTau_triggers.push(ee_trigger) ;
EMuTau_triggers.push(mm_trigger) ;
EMuTau_triggers.push(em_trigger) ;
EMuTau_triggers.push(et_trigger) ;
EMuTau_triggers.push(mt_trigger) ;
EMuTau_triggers.push(tt_trigger) ;

var triggers_by_mode = [] ;

triggers_by_mode['cosmics'   ] = cosmics_triggers ;
triggers_by_mode['WZToEMu'   ] = single_lepton_triggers ;
triggers_by_mode['EMu'       ] = EMu_triggers ;
triggers_by_mode['WZToEMuTau'] = all_triggers ;
triggers_by_mode['VV'        ] = EMuTau_triggers ;
triggers_by_mode['VVH'       ] = EMuTau_triggers ;
triggers_by_mode['all'       ] = all_triggers ;

var triggers = triggers_by_mode['EMu'    ] ;
//var triggers = triggers_by_mode['cosmics'] ;

// function to get a random trigger.  This should be edited to be tweakable in the
// settings, based on difficulty, age range etc
function random_trigger(PNG){
  return triggers[floor(PNG.random()*triggers.length)] ;
}
