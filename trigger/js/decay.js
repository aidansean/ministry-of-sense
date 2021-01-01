// Particle masses
var mEl = 0.10005 ;
var mMu = 0.105 ;
var mPi = 0.137 ;
var mPh = 0.00000001 ;
var mTau = 1.777;

// Make the lowest level "fundamental" particles.
var particle_names = [] ;
particle_names.push('electron') ;
particle_names.push('pion'    ) ;
particle_names.push('muon'    ) ;
particle_names.push('tau'     ) ;
particle_names.push('photon'  ) ;

var special_particle_names = [] ;
special_particle_names.push('electron') ;
special_particle_names.push('muon'    ) ;
special_particle_names.push('tau'     ) ;
special_particle_names.push('photon'  ) ;

function particle_settings_object(mass, charge, color, symbol, lineWidth, rCutoff, headShape, headSize){
  this.mass      = mass      ;
  this.charge    = charge    ;
  this.color     = color     ;
  this.symbol    = symbol    ;
  this.lineWidth = lineWidth ;
  this.rCutoff   = rCutoff   ;
  this.headShape = headShape ;
  this.headSize  = headSize  ;
}

var plw = particleLineWidth ;
var phs = particleHeadSize  ;
var particle_settings = [] ;
particle_settings['muon'    ] = new particle_settings_object(mMu , 1, 'rgb(255,100,100)', '\u03BC', plw, 0.90*Sr, 1, phs) ;
particle_settings['electron'] = new particle_settings_object(mEl , 1, 'rgb(  0,200,  0)', 'e'     , plw, 0.51*Sr, 6, phs) ;
particle_settings['photon'  ] = new particle_settings_object(mPh , 0, 'rgb(  0,  0,  0)', '\u03B3', plw, 0.51*Sr, 5, phs) ;
particle_settings['tau'     ] = new particle_settings_object(mMu , 1, 'rgb(150, 57,239)', '\u03C4', plw, 0.65*Sr, 4, phs) ;
particle_settings['pion'    ] = new particle_settings_object(mPi , 1, 'rgb(  0,  0,  0)', '\u03BE', plw, 0.65*Sr,-4, phs) ;
function update_particle_settings(lineWidth, headSize){
  particleLineWidth = lineWidth ;
  particleHeadSize  = headSize  ;
  for(var i=0 ; i<particle_names.length ; i++){
    particle_settings[particle_names[i]].lineWidth = particleLineWidth ;
    particle_settings[particle_names[i]].headSize  = particleHeadSize  ;
  }
}


// These classes are used to recursively decay particles and pick final states.
// The particles are arranged at the bottom of the page, and should be changeable to suit
// the style of game being played.
// A random final state is chosen in the following way:
// <particle_decay_collection>.recursively_decay(<psuedorandom_number_generator>) ;

function particle_decay_object(probability, topology){
  this.topology = topology ;
  this.probability = probability ;
  this.cumulative_probability = 0 ;
  this.normalised_probability = 0 ;
  this.normalised = false ;
}

// This class contains a list of decay modes for a given particle.
function particle_decay_collection(name){
  // Name of the particle.
  this.name = name ;
  
  // List of decay modes, each containing a probability and a topology.
  this.decay_modes = [] ;
  
  // Complete and unique list of final state topologies after all downstream decays.
  this.final_state_topologies = [] ;
  
  this.add_decay_mode = function(probability, topology){
    // This just pushes back a new decay mode.
    this.decay_modes.push(new particle_decay_object(probability, topology)) ;
    this.normalise_probabilities() ;
  }
  
  this.normalise_probabilities = function(){
    // This adds up all the probabilities of the next level down.
    // First add all probabilities.
    var cumulative_probability = 0 ;
    for(var i=0 ; i<this.decay_modes.length ; i++){
      this.decay_modes[i].normalised = false ;
      cumulative_probability += this.decay_modes[i].probability ;
      this.decay_modes[i].cumulative_probability = cumulative_probability ;
    }
    // Then normalise them.
    for(var i=0 ; i<this.decay_modes.length ; i++){
      this.decay_modes[i].cumulative_probability /= cumulative_probability ;
      this.decay_modes[i].normalised_probability = this.decay_modes[i].probability/cumulative_probability ;
      this.decay_modes[i].normalised = true ;
    }
  }
  this.choose_decay_mode = function(PNG){
    if(isNaN(PNG.seed)) return [] ;
    // This just picks a random decay mode.
    if(this.is_stable()) return [this.name] ;
    var rnd = PNG.random() ;
    for(var i=0 ; i<this.decay_modes.length ; i++){
      if(rnd<this.decay_modes[i].cumulative_probability){
        return this.decay_modes[i].topology ;
      }
    }
  }
  this.is_stable = function(){
    // This is needed to see if we have reached the final level of a decay tree.
    return (this.decay_modes.length==0) ;
  }
  this.recursively_decay = function(PNG){
    // This function recursively decays a particle.  It loops through the daughters and
    // pushes back particles based on the following criteria:
    // 1- if the daughter is stable it gets pushed back.
    // 2- otherwise the daughter is recursively decayed.
    //
    // decay_scheme is a global variable used to look up the relevant decays.
    var final_state_topology = [] ;
    
    // Check to see if we've reached a stable particle (eg trying to decay a muon.)
    if(this.is_stable()){
      final_state_topology.push(this.name) ;
      return final_state_topology ;
    }
    
    // Now get the daughter particles.  Careful, we need to clone this array so that we
    // don't change the original!
    // This breaks when seed is NaN, but fixing that can cause an infinite loop!
    var intermediate_topology = this.choose_decay_mode(PNG).slice(0) ;
    
    for(var i=0 ; i<intermediate_topology.length ; i++){
      // We receive a particle name, so look up the particle archetype by this name.
      var intermediate = decay_scheme[intermediate_topology[i]] ;
      if(intermediate.is_stable()){
        // If it's stable just push it into the final state topology.
        final_state_topology.push(intermediate_topology[i]) ;
      }
      else{
        // Otherwise decay the daughter particle.
        var decay_mode = intermediate.choose_decay_mode(PNG) ;
        for(var j=0 ; j<decay_mode.length ; j++){
          intermediate_topology.push(decay_mode[j]) ;
        }
        
      }
    }
    return final_state_topology ;
  }
  this.get_final_state_topologies = function(){
    // Get all final state topologies and sort them into a unique list.
    // This is useful to see what counts as a "signal" event.
    var topologies   = [] ;
    var probabilites = [] ;
    
    // Escape if we have a stable particle.
    if(this.is_stable()) return [[this.name], [1.0]] ;
    
    for(var i=0 ; i<this.decay_modes.length ; i++){
      // The number of final states can vary depending on what intermediate particles we
      // have.  Start with an empty vector of final states and increment as necessary.
      var intermediate_topologies    = [] ;
      var intermediate_probabilities = [] ;
      for(var j=0 ; j<this.decay_modes[i].topology.length ; j++){
        var archetype = decay_scheme[this.decay_modes[i].topology[j]] ;
        if(archetype.is_stable()){
          // If we get here then we have reached the end of a decay tree.
          var name = archetype.name ;
          var prob = this.decay_modes[i].normalised_probability ;
          if(intermediate_topologies.length==0){
            // If this is the first particle, then add a new intermediate topology.
            intermediate_topologies   .push([name]) ;
            intermediate_probabilities.push([prob]) ;
          }
          else{
            // Otherwise add the particle to the existing intermediate topologies.
            for(var k=0 ; k<intermediate_topologies.length ; k++){
              intermediate_topologies[k]   .push(name) ;
            }
          }
        }
        else{
          // Otherwise we need to split the decay tree further.
          var downstream_decays        = archetype.get_final_state_topologies() ;
          var downstream_topologies    = downstream_decays[0] ;
          var downstream_probabilities = downstream_decays[1] ;
          if(intermediate_topologies.length==0){
            intermediate_topologies    = downstream_topologies   .slice(0) ;
            intermediate_probabilities = downstream_probabilities.slice(0) ;
          }
          else{
            var tmp_topologies   = intermediate_topologies   .slice(0) ;
            var tmp_probabilties = intermediate_probabilities.slice(0) ;
            intermediate_topologies    = [] ;
            intermediate_probabilities = [] ;
            for(var k=0 ; k<downstream_topologies.length ; k++){
              for(var l=0 ; l<tmp_topologies.length ; l++){
                intermediate_topologies   .push(tmp_topologies[l].concat(downstream_topologies[k])) ;
                intermediate_probabilities.push(tmp_probabilties[l]*downstream_probabilities[k]) ;
              }
            }
          }
        }
      }
      topologies   = topologies  .concat(intermediate_topologies   ) ;
      probabilites = probabilites.concat(intermediate_probabilities) ;
    }
    
    // Now we need to trim things down into a unique list.
    var topologies_out   = [] ;
    var probabilites_out = [] ;
    for(var i=0 ; i<topologies.length ; i++){
      var match = false ;
      for(var j=i+1 ; j<topologies.length ; j++){
        if(match_topologies(topologies[i], [topologies[j]])){
          match = true ;
          break ;
        }
      }
      if(match==false){
        topologies_out  .push(  topologies[i]) ;
        probabilites_out.push(probabilites[i]) ;
      }
    }
    
    return [topologies_out,probabilites_out] ;
  }
  this.set_final_state_topologies = function(){
    // Don't do this by default because it can be expensive.
    this.final_state_topologies = this.get_final_state_topologies() ;
  }
}

function match_topologies(topology, target_topologies){
  // This function compares the topology of a collision to the signal topologies.  It
  // compares the topologies one at a time, removing items from the target topology as
  // they are matched.
  for(var i=0 ; i<target_topologies.length ; i++){
    var target = target_topologies[i] ;
    
    // First make an array of matches and fill it with false
    var matches = [] ;
    for(var j=0 ; j<target.length ; j++){
      matches.push(false) ;
    }
    
    // Now compare the topologies.
    for(var j=0 ; j<topology.length ; j++){
      for(var k=0 ; k<target.length ; k++){
        if(matches[k]) continue ;
        if(topology[j]==target[k]){
          matches[k] = true ;
          break ;
        }
      }
    }
    
    // At this point we have an array of matches for the target, so just run over the
    // array of matches.  Assume success until we see a failure to match.
    var success = true ;
    for(var j=0 ; j<matches.length ; j++){
      if(matches[j]==false){
        success = false ;
        break ;
      }
    }
    if(success) return true ;
  }
  // If we get this far then none of the topologies were matched.
  return false ;
}

function generic_particle_decay(name, decays){
  // This is a short hand function that assembles a particle_decay_collection from a
  // single array, so we can have single line particle declarations.
  var particle_decay = new particle_decay_collection(name) ;
  for(var i=0 ; i<decays.length ; i++){
    particle_decay.add_decay_mode(decays[i][0], decays[i][1]) ;
  }
  return particle_decay ;
}

function generic_decay_scheme(name, particle_list){
  // This makes a decay scheme (a string indexed array of particle_decay_collection
  // objects) that can be used for collision decays.
  var scheme = new particle_decay_collection(name) ;
  for(var i=0 ; i<particle_list.length ; i++){
    var particle_name = particle_list[i][0] ;
    var particle = new generic_particle_decay(particle_name, particle_list[i][1]) ;
    scheme[particle_name] = particle ;
  }
  return scheme ;
}

// Define the different schema, starting from the simplest to the most complex.
var cosmics_decay_array = [
  ['signal'     , [ [ 1.0 , ['ZBoson']] ]] ,
  ['background' , [ [ 1.0 , []] ]] ,
  ['ZBoson'     , [ [1.0, ['muon','muon']] ]] ,
  ['muon'       , [] ] 
] ;

var WZToEMu_decay_array = [
  ['signal'     , [ [ 1.0 , ['electron','electron']], [1.0, ['muon','muon']] ]] ,
  ['background' , [ [ 1.0 , ['ZBoson']], [1.0, ['WBoson']] ]] ,
  ['ZBoson'     , [ [1.0, ['muon','muon']] , [1.0, ['electron','electron']] ]] ,
  ['WBoson'     , [ [1.0, ['muon']] , [1.0, ['electron']] ]] ,
  ['muon'    , []] ,
  ['electron', []]
] ;

var WZToEMuTau_decay_array = [
  ['signal'     , [ [ 1.0 , ['tau','electron']], [1.0, ['tau','muon']] ]] ,
  ['background' , [ [ 1.0 , ['ZBoson']], [1.0, ['WBoson']] ]] ,
  ['ZBoson'     , [ [ 1.0 , ['unstableTau', 'unstableTau']], [1.0, ['muon','muon']] , [1.0, ['electron','electron']] ]] ,
  ['WBoson'     , [ [ 1.0 , ['unstableTau']], [1.0, ['muon']] , [1.0, ['electron']] ]] ,
  ['unstableTau', [ [17.84, ['electron']], [17.36, ['muon']] , [67.0, ['tau']] ]] ,
  ['tau'     , []] ,
  ['muon'    , []] ,
  ['electron', []]
] ;

var VV_decay_array = [
  ['signal'     , [ [ 1.0 , ['tau','electron']], [1.0, ['tau','muon']] ]] ,
  ['background' , [ [ 1.0 , ['ZBoson','ZBoson']], [1.0, ['WBoson','WBoson']], [ 1.0 , ['ZBoson']], [1.0, ['WBoson']] ]] ,
  ['ZBoson'     , [ [ 1.0 , ['unstableTau', 'unstableTau']], [1.0, ['muon','muon']] , [1.0, ['electron','electron']] ]] ,
  ['WBoson'     , [ [ 1.0 , ['unstableTau']], [1.0, ['muon']] , [1.0, ['electron']] ]] ,
  ['unstableTau', [ [17.84, ['electron']], [17.36, ['muon']] , [67.0, ['tau']] ]] ,
  ['tau'     , []] ,
  ['muon'    , []] ,
  ['electron', []]
] ;

var VVH_decay_array = [
  ['signal'     , [ [ 1.0 , ['HBoson']] ]] ,
  ['background' , [ [ 1.0 , ['ZBoson','ZBoson']], [1.0, ['WBoson','WBoson']], [ 1.0 , ['ZBoson']], [1.0, ['WBoson']] ,[0.5, ['photon','photon']] , [ 0.5 , ['photon']] ]] ,
  ['HBoson'     , [ [ 2.79e-2, ['ZBoson','ZBoson']], [2.24e-1, ['WBoson','WBoson']], [1.59e-3, ['ZBoson','photon']] , [6.22e-2, ['unstableTau','unstableTau']], [2.16e-4, ['muon'  ,'muon']] , [0.05, ['photon'  ,'photon']] ]] ,
  ['ZBoson'     , [ [ 1.0 , ['unstableTau', 'unstableTau']], [1.0, ['muon','muon']] , [1.0, ['electron','electron']] ]] ,
  ['WBoson'     , [ [ 1.0 , ['unstableTau']], [1.0, ['muon']] , [1.0, ['electron']] ]] ,
  ['unstableTau', [ [17.84, ['electron']], [17.36, ['muon']] , [67.0, ['tau']] ]] ,
  ['tau'     , []] ,
  ['muon'    , []] ,
  ['electron', []] ,
  ['photon'  , []]
] ;
var VVHNoTau_decay_array = [
  ['signal'     , [ [ 1.0 , ['HBoson']] ]] ,
  ['background' , [ [ 1.0 , ['ZBoson','ZBoson']], [1.0, ['WBoson','WBoson']], [ 1.0 , ['ZBoson']], [1.0, ['WBoson']] ]] ,
  ['HBoson'     , [ [ 2.79e-2, ['ZBoson','ZBoson']], [0, ['WBoson','WBoson']], [0, ['ZBoson','photon']] , [0, ['unstableTau','unstableTau']], [0, ['muon'  ,'muon']] ]] ,
  ['ZBoson'     , [ [ 0.0 , ['unstableTau', 'unstableTau']], [1.0, ['muon','muon']] , [1.0, ['electron','electron']] ]] ,
  ['WBoson'     , [ [ 0.0 , ['unstableTau']], [1.0, ['muon']] , [1.0, ['electron']] ]] ,
  ['unstableTau', [ [17.84, ['electron']], [17.36, ['muon']] , [67.0, ['tau']] ]] ,
  ['tau'     , []] ,
  ['muon'    , []] ,
  ['electron', []]
] ;

function topLevel_decay_scheme(name, decay_array, signal_probability, background_probability){
  // In principle this is the object that gets called to decay the event.
  var topLevel = generic_decay_scheme(name, decay_array) ;
  topLevel.add_decay_mode(signal_probability    , ['signal'    ]) ;
  topLevel.add_decay_mode(background_probability, ['background']) ;
  topLevel.normalise_probabilities() ;
  return topLevel ;
}

var all_decay_schema = [] ;
all_decay_schema['WZToEMu'   ] = topLevel_decay_scheme('WZToEMu'   , WZToEMu_decay_array   , 0.0, 1.0) ;
all_decay_schema['WZToEMuTau'] = topLevel_decay_scheme('WZToEMuTau', WZToEMuTau_decay_array, 0.0, 1.0) ;
all_decay_schema['VV'        ] = topLevel_decay_scheme('VV'        , VV_decay_array        , 0.0, 1.0) ;
all_decay_schema['VVH'       ] = topLevel_decay_scheme('VVH'       , VVH_decay_array       , 1.0, 0.0) ;
all_decay_schema['VVHNoTau'  ] = topLevel_decay_scheme('VVHNoTau'  , VVHNoTau_decay_array  , 1.0, 1.0) ;

var decay_scheme = all_decay_schema['VV'] ;
var decay_scheme = all_decay_schema['VVHNoTau'] ;
