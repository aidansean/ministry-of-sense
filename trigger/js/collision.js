// Classes etc for handling the beam collisions.  A collision gives rise to jets, tracks,
// and other particles (so far just electrons and muons.)

var collision_parameters = {
  nJet_min      :   2,
  nJet_max      :  10,
  nTrack_min    :   5,
  nTrack_max    :  20,
  jet_pt_min    :  50 ,
  jet_pt_max    : 150 ,
  track_pt_min  :  10 ,
  track_pt_max  :  90 ,
  jet_track_dphi: 0.05*pi ,
  jet_track_pt_threshold: 30,
  prob_has_cosmics: 0.8
}

var collision_object = function(){
  // Particles in the collision.
  this.jets           = [] ;
  this.tracks         = [] ;
  this.main_particles = [] ;
  
  this.is_made = false ;
  this.is_processed = false ;
  
  this.topology = [] ;
  this.isCosmic = false ;
  
  // Give the collision a pseudorandom number generator.
  this.seed = floor(1e9*random()) ;
  this.PNG = new psuedorandom_number_generator() ;
  this.PNG.set_seed(this.seed) ;
  
  this.remake_generator = function(seed){
    this.seed = seed ;
    this.PNG = new psuedorandom_number_generator() ;
    this.PNG.set_seed(this.seed) ;
  }
  
  // If the event is a Higgs event, give it a mass and set the flag.
  this.hMass = 0 ;
  this.isHiggs = false ;
  
  this.purge = function(){
    // If we ever store events, this can be used to minimise memory use.
    this.jets    = [] ;
    this.tracks  = [] ;
    this.main_particles = [] ;
  }
  this.make_particles = function(){
    if(true==this.is_made) return ;
    // Randomly assign particles their kinematic properties.  This should be changed to
    // generate pseudorandom numbers using a seed instead, so that the spy mode sees
    // exactly the same events as they players by passing a single number around.
    // These variables should be stored in settings.js.
    
    if(this.isCosmic){
      //this.topology = (this.PNG.random()<collision_parameters.prob_has_cosmics) ? ['muon','muon'] : [] ;
      this.topology = (this.PNG.random()<collision_parameters.prob_has_cosmics) ? ['muon'] : [] ;
      var charge = (this.PNG.random()<0.5) ? -1 : 1 ;
      
      var phi = 0.5*pi-0.125*pi+this.PNG.random()*pi*0.25 ;
      var x0 = Sr*(-0.2 + 0.4*this.PNG.random()) ;
      var y0 = Sr*(-0.1 + 0.2*this.PNG.random()) ;
      for(var i=0 ; i<this.topology.length ; i++){
        if(i==1) phi += pi ;
        var muon = new particle_object(this.topology[i], charge, 30, phi, x0, y0, true) ;
        this.main_particles.push(muon) ;
        charge *= -1 ;
      }
      return ;
    }
    
    var pars = collision_parameters ;
    
    // Make some tracks and jets.
    this.nTracks = pars.nTrack_min + floor(this.PNG.random()*(pars.nTrack_max-pars.nTrack_min)) ;
    this.nJets   = pars.nJet_min   + floor(this.PNG.random()*(pars.nJet_max-pars.nJet_min)    ) ;
    
    for(var i=0 ; i<this.nTracks ; i++){
      var q = (this.PNG.random()<0.5) ? -1 : 1 ;
      var pt  = pars.track_pt_min + (pars.track_pt_max-pars.track_pt_min)*this.PNG.random() ;
      var phi = 2*pi*this.PNG.random() ;
      var color = track_color ;
      var track = new trackObject(q, mPi, pt, phi, 0, 0, color, 'pion', false) ;
      this.tracks.push(track) ;
    }
    for(var i=0 ; i<this.nJets ; i++){
      var pt = pars.jet_pt_min + (pars.jet_pt_max-pars.jet_pt_min)*this.PNG.random() ;
      var phi = 2*pi*this.PNG.random() ;
      var color = random_color(100, this.PNG) ;
      var jet = new jet_object(pt, phi, 0, 0, color, this.PNG) ;
      this.jets.push(jet) ;
    }
    var charge = (this.PNG.random()<0.5) ? -1 : 1 ;
    var phi = 0 ;
    for(var i=0 ; i<this.topology.length ; i++){
      phi = (i%2==1) ? (0.5+this.PNG.random())*pi+phi : 2*pi*this.PNG.random() ;
      this.main_particles.push(new particle_object(this.topology[i], charge, 30, phi, 0, 0, false)) ;
      charge *= -1 ;
    }
    this.is_made = true ;
  }
  this.add_tracks = function(n){
    var pars = collision_parameters ;
    for(var i=0 ; i<n ; i++){
      var q = (this.PNG.random()<0.5) ? -1 : 1 ;
      var pt  = pars.track_pt_min + (pars.track_pt_max-pars.track_pt_min)*this.PNG.random() ;
      var phi = 2*pi*this.PNG.random() ;
      var color = track_color ;
      var track = new trackObject(q, mPi, pt, phi, 0, 0, color, 'pion', false) ;
      this.tracks.push(track) ;
    }
  }
  
  this.draw_step = function(context, step){
    this.draw_tracks(context, step) ;
    this.draw_jets(context, step) ;
    this.draw_main_particles(context, step) ;
    this.draw_interaction_point(context) ;
  }
  this.draw_tracks = function(context, step){
    for(var i=0 ; i<this.tracks.length ; i++){
      this.tracks[i].draw(context, step) ;
    }
  }
  this.draw_jets = function(context, step){
    for(var i=0 ; i<this.jets.length ; i++){
      this.jets[i].draw(context, step) ;
    }
  }
  this.draw_main_particles = function(context, step){
    for(var i=0 ; i<this.main_particles.length ; i++){
      this.main_particles[i].draw(context, step) ;
    }
  }
  this.draw_interaction_point = function(context){
    context.save() ;
    context.beginPath() ;
    context.fillStyle = 'rgb(255,255,255)' ;
    context.arc(0.5*cw, 0.5*ch, 0.01*cw, 0, 2*pi, true) ;
    context.fill() ;
    context.restore() ;
  }
  
  this.end_collision = function(){
    if(game.mode=='suddenDeath'){
      var trigger = game.current_shift.trigger ;
      if(trigger.fired==true  && trigger.match_collision==false){
        game.state = 'game_over' ;
        game.game_over_message = 'You should not have clicked that collision.' ;
      }
      else if(trigger.fired==false && trigger.match_collision==true){
        game.state = 'game_over' ;
        game.game_over_message = 'Oops!  You missed a collision.' ;
      }
    }
  }
}

function make_collision(){
  // Generate a random event, populating it with main_particles.
  var r = random() ;
  if(false && r<probability_Higgs && game.mode=='collaborative'){
    return make_Higgs_collision(126) ;
  }
  else{
    var coll = new collision_object() ;
    if(game.mode=='cosmics') coll.isCosmic = true ;
    coll.topology = decay_scheme.recursively_decay(coll.PNG) ;
    return coll ;
  }
}
function make_matching_collision(topology){
  // Generate an event matching a topology, populating it with main_particles.
  var success = false ;
  var coll = null ;
  var counter = 0 ;
  while(false==success && counter<100){
    counter++ ;
    coll = new collision_object() ;
    coll.topology = decay_scheme.recursively_decay(coll.PNG) ;
    success = match_topologies(coll.topology, [topology]) ;
  }
  return coll ;
}
function make_Higgs_collision(mass){
  // This just sets the Higgs flag in the event.
  var coll = new collision_object() ;
  coll.isHiggs = true ;
  coll.topology = decay_scheme['signal'].recursively_decay(coll.PNG) ;
  coll.hMass = mass ;
  return coll ;
}

function collision_thread(){
  // Okay, now things get a bit tricky again.
  // First allow the user to click.
  
  if(game.state=='game_over'){
    game.draw_game_over_screen() ;
    return ;
  }
  
  game.can_click = true ;
  
  if(game.current_shift.collision_counter==collisions_per_shift){
    game.current_shift.trigger.update_table() ;
    window.setTimeout(game.end_shift, delay) ;
    
    // Reset the collision counter.
    game.current_shift.collision_counter = 0 ;
  }
  else if(game.paused){
    // Why do we reset the delay here?  I forget...
    collision_delay = collision_delay_max ;
    window.setTimeout(collision_thread, delay) ;
    return ;
  }
  else{
    // Update the states.
    game.current_shift.trigger.update_table() ;
    
    // Reset all the cells and segments so we can analyse the event.
    detector.start_collision() ;
    
    // Update all the detector segments so they light up properly.
    game.current_shift.current_collision = make_collision() ;
    game.current_shift.current_collision.make_particles() ;
    detector.process_collision(game.current_shift.current_collision) ;
    
    // Speed up the event as the run continues.
    var dDelay = 0.5*(collision_delay - collision_delay_min) ;
    collision_delay = collision_delay - dDelay ;
    
    // Reset the trigger flags.
    game.current_shift.trigger.start_collision() ;
    
    // Increment the counter.
    game.current_shift.collision_counter++ ;
    
    // Saving events- add an option to turn this off to reduce memory usage!
    game.current_shift.collisions.push(game.current_shift.current_collision) ;
    
    // Single player mode only.
    if(game.current_shift.collision_counter<collisions_per_shift){
      Get('span_eventNumber').innerHTML = game.current_shift.collision_counter ;
    }
    
    game.update_score() ;
    
    // Enable the user to click.
    game.enable_click() ;
    
    game.kill_drawStep = false ;
    // Draw things.  This is expensive!
    if(game.animate_eventDisplay){
      game.draw_step = 0 ;
      draw_eventDisplay_step_proxy() ;
    }
    else{
      draw_eventDisplay_step(game.current_shift.current_collision, context, -1) ;
      
      // Make the next collision.
      window.setTimeout(collision_breather, collision_delay) ;
    }
  }
}

// This function just gives the player a chance to see the result of their choice.
function collision_breather(){
  if(game.paused){
    window.setTimeout(collision_breather, delay) ;
  }
  else{
    game.can_click = false ;
    game.current_shift.current_collision.end_collision() ;
    clear_canvas(context) ;
    draw_eventDisplay_base(context) ;
    window.setTimeout(collision_thread, collision_breath) ;
  }
}

