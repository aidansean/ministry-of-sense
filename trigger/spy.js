var canvas    = null ;
var game      = null ;
var spy       = null ;
var histogram = null ;
var experiments = [] ;
var device = 'laptop' ;

var pulse_counter = 0 ;
var colorBoth = 'rgb(0,150,0)' ;
var big_ndp = 12 ;

// Detector parts.
var detector = new detector_object() ;

drawRatio = 1.0 ;
var results_mode = 'sigma' ;
results_mode = 'percent' ;

var pointless_step = 0 ;
var total_prob = 0 ;
var segment_n = 20 ;

function spy_object(){
  var self = this ;
  self.frozen = false ;
  self.draw_delay = 2500 ;
  
  self.ws = false ;
  self.use_ws = use_ws ;
  if(use_ws){
    self.ws = new WebSocket('ws://www.ministryofsense.com:8080/') ;
    self.ws.onopen = function(e){
      console.log("Connection established!") ;
      self.ws.send('type:triggerSpy') ;
    } ;
    self.ws.onmessage = function(e){
      if(spy.frozen) return ;
      var message = e.data ;
      var parts = message.split(':') ;
      if(parts[0]!='trigger') return ;
      var team = parts[1] ;
      var seed = parseInt(parts[2]) ;
      
      var ex = experiments[team]
      ex.seeds = [seed] ;
      ex.draw_collision_from_seed() ;
      ex.nSavedCollisions++ ;
      ex.update_nSavedCollisions() ;
    } ;
  }
  
  self.ajax = false ;
  if(use_ajax){
    // Not sure if this should go here or at the end.
    self.ajax = new ajax_object() ;
    self.ajax.send('event_store.php?task=set_all_collisions_as_read') ;
  }
  
  self.freeze = function(){
    spy.frozen = true ;
    Get('button_freeze'             ).style.display = 'none' ;
    Get('button_continue_postFreeze').style.display = ''     ;
  }
  
  self.analyse_show_experiment = function(name){
    spy.current_team_name = name ;
    Get('button_analyse_'  +spy.current_team_name+'_show' ).style.display = 'none' ;
    Get('canvas_collision_'+spy.current_team_name         ).style.display = 'none' ;
    Get('canvas_histogram_'+spy.current_team_name         ).style.display = ''     ;
    experiments[spy.current_team_name].analyse() ;
  }
  self.analyse_bkg_experiment = function(name){
    spy.current_team_name = name ;
    Get('button_analyse_'  +spy.current_team_name+'_bkg'  ).style.display = 'none' ;
    experiments[spy.current_team_name].histogram.animate_fit_measureBackground() ;
  }
  self.analyse_ghost_experiment = function(name){
    spy.current_team_name = name ;
    Get('button_analyse_'  +spy.current_team_name+'_ghost' ).style.display = 'none' ;
    experiments[spy.current_team_name].histogram.animate_fit_ghost() ;
  }
  self.analyse_peak_experiment = function(name){
    spy.current_team_name = name ;
    Get('button_analyse_'  +spy.current_team_name+'_peak'  ).style.display = 'none' ;
    experiments[spy.current_team_name].histogram.animate_fit_peak() ;
  }
  self.analyse_signal_experiment = function(name){
    spy.current_team_name = name ;
    Get('button_analyse_'  +spy.current_team_name+'_signal').style.display = 'none' ;
    experiments[spy.current_team_name].histogram.animate_fit_signal() ;
  }
  
  self.analyse_ghost_both = function(){
    self.analyse_ghost_experiment('ATLAS') ;
    self.analyse_ghost_experiment('CMS'  ) ;
  }
  self.analyse_bkg_both = function(){
    self.analyse_bkg_experiment('ATLAS') ;
    self.analyse_bkg_experiment('CMS'  ) ;
  }
  self.analyse_peak_both = function(){
    self.analyse_peak_experiment('ATLAS') ;
    self.analyse_peak_experiment('CMS'  ) ;
  }
  
  self.analyse_show_ATLAS   = function(){ self.analyse_show_experiment  ('ATLAS') ; }
  self.analyse_show_CMS     = function(){ self.analyse_show_experiment  ('CMS'  ) ; }
  self.analyse_signal_ATLAS = function(){ self.analyse_signal_experiment('ATLAS') ; }
  self.analyse_signal_CMS   = function(){ self.analyse_signal_experiment('CMS'  ) ; }
  
  self.continue_step_postFreeze = function(){
    Get('button_continue_postFreeze' ).style.display = 'none' ;
    Get('button_analyse_ATLAS_show'  ).style.display = '' ;
  }
  self.continue_step_postShow   = function(){
    Get('button_continue_postShow'   ).style.display = 'none' ;
    Get('button_analyse_both_ghost'  ).style.display = '' ;
  }
  self.continue_step_postGhost  = function(){
    Get('button_continue_postGhost'  ).style.display = 'none' ;
    Get('button_analyse_both_bkg'    ).style.display = '' ;
  }
  self.continue_step_postBkg    = function(){
    Get('button_continue_postBkg'    ).style.display = 'none' ;
    Get('button_analyse_both_peak'   ).style.display = '' ;
  }
  self.continue_step_postPeak   = function(){
    Get('button_continue_postPeak'   ).style.display = 'none' ;
    Get('button_analyse_ATLAS_signal').style.display = '' ;
  }
  self.continue_step_postSignal = function(){
    Get('button_continue_postSignal' ).style.display = 'none' ;
    Get('button_combine'             ).style.display = '' ;
  }
  self.animate_histogram = function(){ experiments[spy.current_team_name].histogram.animate_accumulate() ; }
  self.combine_results = function(){
    // This was very much last minute and can be vastly improved.
  
    // First remove the things we don't want to look at anymore.
    experiments['ATLAS'].histogram_canvas.style.display = 'none' ;
    experiments['CMS'  ].histogram_canvas.style.display = 'none' ;
    Get('h2_team_ATLAS' ).style.display = 'none' ;
    Get('h2_team_CMS'   ).style.display = 'none' ;
    Get('button_combine').style.display = 'none' ;
    Get('button_freeze' ).style.display = 'none' ;
  
    // Show the combo table which has been hiding until now.
    Get('table_combo'   ).style.display = 'block' ;
    
    // Show how many sigmas we got.
    if(results_mode=='sigma'){
      Get('span_ATLAS_nSigma').innerHTML = experiments['ATLAS'].nSigma.toPrecision(2) + 'σ' ;
      Get('span_CMS_nSigma'  ).innerHTML = experiments['CMS'  ].nSigma.toPrecision(2) + 'σ' ;
    }
    else{
      var ATLAS_percent = 100*Math.exp(-Math.pow(experiments['ATLAS'].nSigma,2)) ;
      var CMS_percent   = 100*Math.exp(-Math.pow(experiments[  'CMS'].nSigma,2)) ;
      Get('span_ATLAS_nSigma').innerHTML = ATLAS_percent.toFixed(big_ndp) + '%' ;
      Get('span_CMS_nSigma'  ).innerHTML =   CMS_percent.toFixed(big_ndp) + '%' ; 
    }
    
    // Now "animate" the table.
    var interval_ms = 1000 ;
    window.setTimeout(spy.add_combo_row_1, 1*interval_ms) ;
    window.setTimeout(spy.add_combo_row_2, 2*interval_ms) ;
    window.setTimeout(spy.add_combo_row_3, 3*interval_ms) ;
    window.setTimeout(spy.add_combo_row_4, 4*interval_ms) ;
    window.setTimeout(spy.add_combo_row_5, 5*interval_ms) ;
    window.setTimeout(spy.add_combo_row_6, 6*interval_ms) ;
    window.setTimeout(spy.add_combo_row_7, 7*interval_ms) ;
    window.setTimeout(spy.add_combo_row_8, 8*interval_ms) ;
    window.setTimeout(spy.add_combo_row_9, 9*interval_ms) ;
    
    // Add sigmas in quadrature and write the final result.
    spy.nSigma = sqrt(pow(experiments['ATLAS'].nSigma,2)+pow(experiments['CMS'].nSigma,2)) ;
    
    window.setTimeout(spy.show_pointless_button, 11*interval_ms) ;
  }
  self.show_pointless_button = function(){
    Get('button_pointless_noFinishLine').style.display = '' ;
  }
  self.announce_result = function(){
    Get('canvas_histogram_pointless').style.display = 'none' ;
    Get('button_announce'           ).style.display = 'none' ;
    Get('table_combo'               ).style.display = 'block' ;
    self.write_final_result() ;
    self.sound_success() ;
  }
  
  self.add_combo_row = function(number, text){
    var tr = Create('tr') ;
    tr.className = (number%2==0) ? 'odd' : 'even' ;
    var th = Create('th') ;
    th.className = 'combo combo_left' ;
    th.innerHTML = 'Step ' + number + ')' ;
    tr.appendChild(th) ;
    
    th = Create('th') ;
    th.className = 'combo combo_right' ;
    th.innerHTML = text ;
    tr.appendChild(th) ;
    Get('tbody_combo').appendChild(tr) ;
  }
  self.add_combo_row_1 = function(){ self.add_combo_row(1, 'Downloading data'         ) ; }
  self.add_combo_row_2 = function(){ self.add_combo_row(2, 'Calibrating data'         ) ; }
  self.add_combo_row_3 = function(){ self.add_combo_row(3, 'Making coffee'            ) ; }
  self.add_combo_row_4 = function(){ self.add_combo_row(4, 'Analysing correlations'   ) ; }
  self.add_combo_row_5 = function(){ self.add_combo_row(5, 'Resolving conflicts'      ) ; }
  self.add_combo_row_6 = function(){ self.add_combo_row(6, 'Submitting to peer review') ; }
  self.add_combo_row_7 = function(){ self.add_combo_row(7, 'Writing up results'       ) ; }
  self.add_combo_row_8 = function(){ self.add_combo_row(8, 'Cross checking facts'     ) ; }
  self.add_combo_row_9 = function(){ self.add_combo_row(9, 'Avoiding the press'       ) ; }
  
  self.sound_success = function(){  
    Get('audio_tada').play() ;
  }
  self.sound_pointless = function(){  
    Get('audio_pointless').play() ;
  }
  self.write_final_result = function(){
    var tbody = Get('tbody_combo') ;
    tbody.innerHTML = '' ;
    var tr = Create('tr') ;
    var th = Create('th') ;
    th.id = 'th_final_result_img' ;
    th.colSpan = 2 ;
    var img = Create('img') ;
    img.src = 'images/seminar2.jpg' ;
    img.style.border = '1px solid black' ;
    img.style.padding = '2px' ;
    th.appendChild(img) ;
    tr.appendChild(th ) ;
    tbody.appendChild(tr) ;
    
    // Fairly trivial, so we should improve it.  Add some fireworks and happy faces
    // instead of a smiley.
    var prob = Math.exp(-Math.pow(spy.nSigma,2)) ;
    Get('span_combined_nSigma').innerHTML = (100*prob).toFixed(big_ndp) + '%' ;
    Get('tr_combined_nSigma').style.display = '' ;
    var tr = Create('tr') ;
    var th = Create('th') ;
    th.id = 'th_final_result_text' ;
    th.colSpan = 2 ;
    if(results_mode=='sigma'){
      th.innerHTML = spy.nSigma.toPrecision(2) + 'σ discovery!<br />Party time :)' ;
    }
    else{
      var percent = 100*Math.exp(-Math.pow(self.nSigma,2)) ;
      th.innerHTML = 'Higgs discovery!<br />Party time :)' ;
    }
    tr.appendChild(th) ;
    Get('tbody_combo').appendChild(tr) ;
  }
  
  self.pointless_step = 0 ;
  self.start_pointless = function(){
    Get('canvas_histogram_pointless').style.display = 'block' ;
    Get('canvas_collision_ATLAS').style.display = 'none' ;
    Get('canvas_histogram_ATLAS').style.display = 'none' ;
    Get('canvas_collision_CMS'  ).style.display = 'none' ;
    Get('canvas_histogram_CMS'  ).style.display = 'none' ;
    
    Get('button_pointless_noFinishLine').style.display = 'none' ;
    Get('table_combo'     ).style.display = 'none' ;
    
    //experiments['ATLAS'].nSigma = 3.6 + random()*0.5 ;
    //experiments['CMS'  ].nSigma = 3.6 + random()*0.5 ;
    
    self.pointless_noFinishLine() ;
  }
  
  self.pointless_noFinishLine = function(){
    self.draw_pointless_first(false) ;
    Get('button_pointless_noFinishLine').style.display = 'none'   ;
    Get('button_pointless_finishLine'  ).style.display = 'inline' ;
  }
  self.pointless_finishLine = function(){
    self.draw_pointless_first(true) ;
    Get('button_pointless_finishLine').style.display = 'none'   ;
    Get('button_pointless_run'       ).style.display = 'inline' ;
  }
  self.pointless_run = function(){
    self.draw_pointless_first(true) ;
    Get('button_pointless_run'       ).style.display = 'none'   ;
    self.draw_pointless() ;
    self.sound_pointless() ;
  }
  self.draw_pointless_first = function(draw_finish_line){
    var s = self.pointless_step ;
    var s0 =   0 ;
    var s1 = 100 ;    
    
    var canvas = Get('canvas_histogram_pointless') ;
    
    var colorA = experiments['ATLAS'].histogram.color ;
    var colorC = experiments['CMS'  ].histogram.color ;
    
    var pcB = new pointless_counter('black', total_prob, 'Combined', 500) ;
    
    var context = canvas.getContext('2d') ;
    context.fillStyle = 'rgb(255,255,255)' ;
    context.fillRect(0,0,1000,500) ;
    
    pcB.draw_numberplate(context) ;
    pcB.draw_name       (context) ;
    pcB.draw_thermometer(context, segment_n, draw_finish_line) ;
    pcB.draw_percent(context, '100%') ;
    pcB.draw_ATLAS_marker(context, 1.0, colorA) ;
    pcB.draw_CMS_marker  (context, 1.0, colorC) ;
    pcB.draw_combined_marker(context, 1.0, colorBoth) ;
  }
  self.draw_pointless = function(){
    var s = self.pointless_step ;
    var s0 =   0 ;
    var s1 = 100 ;    
    
    var canvas = Get('canvas_histogram_pointless') ;
    
    var colorA = experiments['ATLAS'].histogram.color ;
    var colorC = experiments['CMS'  ].histogram.color ;
    
    var pcB = new pointless_counter('black', total_prob, 'Combined', 500) ;
    var sigmaA = experiments['ATLAS'].nSigma ;
    var sigmaC = experiments['CMS'  ].nSigma ;
    var valueA = Math.exp(-sigmaA*sigmaA) ;
    var valueC = Math.exp(-sigmaC*sigmaC) ;
    valueB = valueA*valueC ;
    var total_prob = pcB.pMin ;
    
    var context = canvas.getContext('2d') ;
    context.fillStyle = 'rgb(255,255,255)' ;
    context.fillRect(0,0,1000,500) ;
    
    var pPerStep = Math.pow(total_prob, 1.0/(s1-s0)) ;
    var pPerSeg  = Math.pow(total_prob, 1.0/segment_n) ;
    
    var probA = 1.0 ;
    var probC = 1.0 ;
    var probB = 1.0 ;
    var nB = 0 ;
    var mB = Math.log(valueB)/Math.log(pPerSeg) ;
    
    probA = Math.pow(pPerStep, s+1) ;
    probC = Math.pow(pPerStep, s+1) ;
    probB = Math.pow(pPerStep, s+1) ;
    
    nB = segment_n*(s-s0)/(1.0*s1) ;
    nB = pcB.nSegments_from_p(probB) ;
    
    if(nB>mB){
      nB = mB ;
      pointless_step = s1 ;
    }
    
    if(probB<valueA) probA = valueA ;
    if(probB<valueC) probC = valueC ;
    if(probB<valueB) probB = valueB ;
    
    // nSegments.
    if(nB>mB) nB = mB ;
    
    pcB.draw_numberplate(context) ;
    pcB.draw_name       (context) ;
    pcB.draw_thermometer(context, segment_n-nB, true) ;
    var ndp = Math.ceil(Math.log(probB)/Math.log(0.1)) ;
    pcB.draw_percent(context, (100*probB).toFixed(ndp)+'%') ;
    pcB.draw_ATLAS_marker(context, probA, colorA) ;
    pcB.draw_CMS_marker  (context, probC, colorC) ;
    var colorB = 'green' ;
    colorB = 'rgb(0,150,0)' ;
    pcB.draw_combined_marker(context, probB, colorB) ;
    
    self.pointless_step++ ;
    
    if(s<s1){
      window.setTimeout(self.draw_pointless, 100) ;
    }
    else{
      Get('button_announce').style.display = 'inline' ;
    }
  }
}

function experiment_object(name){
  var self = this ;
  self.name = name ;
  
  // Wait up to ten seconds for a response.
  self.wait = 10 ;
  
  self.nSigma = -1 ;
  self.n4L = 150 ;
  self.n2L =   0 ;
  
  self.nSavedCollisions = 0 ;
  
  // Get the canvas etc.
  self.collision_canvas  = Get('canvas_collision_'+self.name) ;
  self.collision_context = self.collision_canvas.getContext('2d') ;
  self.histogram_canvas  = Get('canvas_histogram_'+self.name) ;
  self.histogram_context = self.collision_canvas.getContext('2d') ;
  
  // Information about the collisions from the server.
  self.seeds = [] ;
  self.topos = [] ;
  self.playerNames = [] ;
  self.collision_id = -1 ;
  
  self.is_running_minimumBias = true ;
  
  self.histogram = new four_lepton_mass_histogram(self.histogram_canvas) ;
  self.histogram.color = teams[self.name].color ;
  self.histogram.name  = self.name ;
  
  // xmlhttp request functions.
  self.xmlhttp = GetXmlHttpObject() ;
  self.xmlhttp_muted = false ;
  
  self.run_minimumBias = function(){
    return ;
    if(self.is_running_minimumBias==false) return ;
    var callback = self.run_minimumBias ;
    self.draw_minimumbias_collision() ;
    window.setTimeout(callback, spy.draw_delay) ;
  }
  self.request_collision_id_from_server = function(){
    var request = '?task=get_latest_collision_id' ;
    var uri = 'event_store.php'+request+'&sid=' + Math.random() ;
    self.xmlhttp.open('GET', uri, true) ;
    var callback = self.receive_collision_id_from_server ;
    self.xmlhttp.onreadystatechange = callback ;
    self.xmlhttp.send(null) ;
  }
  self.receive_collision_id_from_server = function(){
    if(self.xmlhttp.readyState!=4) return ;
    self.collision_id = parseInt(self.xmlhttp.responseText) ;
  }
  self.request_collisions_from_server = function(){
    return ;
    var request = '?task=get_collisions&team=' + self.name + '&id=' + self.collision_id + '&wait=' + self.wait ;
    var uri = 'event_store.php'+request+'&sid=' + Math.random() ;
    self.xmlhttp.open('GET', uri, true) ;
    var callback = self.receive_collisions_from_server ;
    self.xmlhttp.onreadystatechange = callback ;
    self.xmlhttp.send(null) ;
    self.is_running_minimumBias = true ;
    self.draw_minimumbias_collision() ;
  }
  self.receive_collisions_from_server = function(){
    if(self.xmlhttp.readyState!=4) return ;
    var responseText = self.xmlhttp.responseText ;
    var seeds   = responseText.split(';')[0].split(',') ;
    var trigger = responseText.split(';')[1] ;
    self.collision_id = parseInt(responseText.split(';')[2]) ;
    if(seeds.length==1){
      if(parseInt(seeds[0])==-1){
        self.request_collisions_from_server() ;
        return ;
      }
    }
    self.seeds = seeds ;
    if(seeds.length>0) self.is_running_minimumBias = false ;
    self.draw_collision_from_seed() ;
  }
  self.receive_single_collision_from_server = function(){
    var xmlhttp = self.xmlhttp ;
    if(xmlhttp.readyState!=4) return ;
    self.xmlhttp_muted = false ;
    var responseText = xmlhttp.responseText ;
    var parts = responseText.split(';') ;
    if(parts.length<4) return ;
    var trigger_name = parts[0] ;
    var topology = parts[1].split(',') ;
    var seed = parseInt(parts[2]) ;
    var playerName = parts[3] ;
    if(seed!=-1){
      self.seeds.push(seed) ;
      self.topos.push(topology) ;
      self.playerNames.push(playerName) ;
    }
    if(seed==-1){
      self.draw_minimumbias_collision() ;
    }
    else{
      self.draw_collision_from_seed_and_topo() ;
    }
  }
  self.draw_collision_from_seed_and_topo = function(){
    self.is_running_minimumBias = false ;
    if(spy.frozen==true){
      draw_eventDisplay_base(self.collision_context) ;
      return ;
    }
    
    var seed = parseInt(self.seeds.splice(0,1)) ;
    
    var playerName = self.playerNames.splice(0,1) ;
    for(var i=0 ; i<player_names.length ; i++){
      if(playerName==player_names[i]){
        playerName = '' ;
        break ;
      }
    }
    
    var topo = [] ;
    if(self.topos.length==1){
      topo = self.topos[0] ;
      self.topos = [] ;
    }
    else if(self.topos.length>1){
      topo = self.topos.splice(0,1) ;
    }
    
    detector.start_collision() ;
    var collision = new collision_object() ;
    if(game.mode=='cosmics') collision.isCosmic = true ;
    collision.remake_generator(seed) ;
    collision.topology = decay_scheme.recursively_decay(collision.PNG) ;
    collision.topology = topo ;
    collision.make_particles() ;
    
    detector.process_collision(collision) ;
    if(match_topologies(collision.topology, decay_scheme['HBoson'].final_state_topologies)){
      self.n4L++ ;
    }
    
    draw_eventDisplay(collision, self.collision_context) ;
    
    self.collision_context.save() ;
    
    if(playerName!=''){
      self.collision_context.fillStyle = 'rgba(255,255,255,0.75)' ;
      self.collision_context.fillRect(0,0.8*ch,cw,0.2*ch) ;
      
      self.collision_context.strokeStyle = 'rgb(255,255,255)' ;
      self.collision_context.fillStyle = 'rgb(0,0,0)' ;
      self.collision_context.textAlign = 'center' ;
      self.collision_context.textBaselie = 'middle' ;
      self.collision_context.font = 0.15*ch + 'px arial' ;
      self.collision_context.fillText  (playerName, 0.5*cw, 0.95*ch) ;
      self.collision_context.strokeText(playerName, 0.5*cw, 0.95*ch) ;
      self.collision_context.restore() ;
    }
  }
  self.draw_collision_from_seed = function(){
    self.is_running_minimumBias = false ;
    if(spy.frozen==true){
      draw_eventDisplay_base(self.collision_context) ;
      return ;
    }
    var seed = parseInt(self.seeds.splice(0,1)) ;
    detector.start_collision() ;
    var collision = new collision_object() ;
    if(game.mode=='cosmics') collision.isCosmic = true ;
    collision.remake_generator(seed) ;
    collision.topology = decay_scheme.recursively_decay(collision.PNG) ;
    collision.make_particles() ;
    
    detector.process_collision(collision) ;
    if(match_topologies(collision.topology, decay_scheme['HBoson'].final_state_topologies)){
      self.n4L++ ;
    }
    
    draw_eventDisplay(collision, self.collision_context) ;
    var callback = self.draw_collision_from_seed ;
    //window.setTimeout(callback, spy.draw_delay) ;
  }
  self.draw_minimumbias_collision = function(){
    // "Minimum bias" just means no leptons etc.
    detector.start_collision() ;
    var collision = new collision_object() ;
    if(game.mode=='cosmics') collision.isCosmic = true ;
    collision.topology = [] ;
    collision.make_particles() ;
    detector.process_collision(collision) ;
    draw_eventDisplay_base(self.collision_context) ;
    draw_eventDisplay(collision, self.collision_context) ;
  }
  self.set_style = function(){
    Get('h2_team_'       +self.name          ).style.background = teams[self.name].color ;
    Get('button_analyse_'+self.name+'_show'  ).style.background = teams[self.name].color ;
    Get('button_analyse_'+self.name+'_ghost' ).style.background = teams[self.name].color ;
    Get('button_analyse_'+self.name+'_bkg'   ).style.background = teams[self.name].color ;
    Get('button_analyse_'+self.name+'_peak'  ).style.background = teams[self.name].color ;
    Get('button_analyse_'+self.name+'_signal').style.background = teams[self.name].color ;
    Get('th_'+self.name+'_nSigma'            ).style.background = teams[self.name].color ;
    Get('th_'+self.name+'_nSigma_value'      ).style.background = teams[self.name].color ;
  }
  
  self.analyse = function(){
    // This is a bit messy.
    // First we divide the amount of time we want to spending drawing by the number of
    // events so that we're no waiting around too short/too long.
    self.n4L = max(self.n4L, 10) ;
    delay_animate_histogram = Math.max(1,Math.floor(time_animate_histogram/self.n4L)) ;
    
    // Then assign the masses for the Higgs-like events.
    // I should check the random sampling from a Gaussian to make sure it works.  I took it
    // from a previous project (aDetector) but still...
    for(var i=0 ; i<self.n4L ; i++){
      var mass = (random()<0.3) ? -1 : mass_min + random()*(mass_max-mass_min) ;
      if(mass<0){
        mass = 122.5 + random_gaussian(10) ;
      }
      self.histogram.add_mass(mass) ;
    }
    
    // Animate the histogram.  This is why there is no getting around the global variable
    // problem.
    spy.animate_histogram() ;
  }
  
  self.update_nSavedCollisions = function(){
    Get('span_'+self.name+'_nSavedCollisions').innerHTML = self.nSavedCollisions ;
  }
}

function hide_button(){
  Get('button_analyse_both_ghost'    ).style.display = 'none' ;
  Get('button_analyse_both_bkg'      ).style.display = 'none' ;
  Get('button_analyse_both_peak'     ).style.display = 'none' ;
  
  Get('button_analyse_ATLAS_show'    ).style.display = 'none' ;
  Get('button_analyse_ATLAS_ghost'   ).style.display = 'none' ;
  Get('button_analyse_ATLAS_bkg'     ).style.display = 'none' ;
  Get('button_analyse_ATLAS_peak'    ).style.display = 'none' ;
  Get('button_analyse_ATLAS_signal'  ).style.display = 'none' ;
  Get('button_analyse_CMS_show'      ).style.display = 'none' ;
  Get('button_analyse_CMS_ghost'     ).style.display = 'none' ;
  Get('button_analyse_CMS_bkg'       ).style.display = 'none' ;
  Get('button_analyse_CMS_peak'      ).style.display = 'none' ;
  Get('button_analyse_CMS_signal'    ).style.display = 'none' ;
  
  Get('button_continue_postFreeze'   ).style.display = 'none' ;
  Get('button_continue_postShow'     ).style.display = 'none' ;
  Get('button_continue_postGhost'    ).style.display = 'none' ;
  Get('button_continue_postBkg'      ).style.display = 'none' ;
  Get('button_continue_postPeak'     ).style.display = 'none' ;
  Get('button_continue_postSignal'   ).style.display = 'none' ;
  Get('button_announce'              ).style.display = 'none' ;
  
  Get('button_pointless_noFinishLine').style.display = 'none' ;
  Get('button_pointless_finishLine'  ).style.display = 'none' ;
  Get('button_pointless_run'         ).style.display = 'none' ;
  
  Get('button_combine'               ).style.display = 'none' ;
  Get('canvas_histogram_ATLAS'       ).style.display = 'none' ;
  Get('canvas_histogram_CMS'         ).style.display = 'none' ;
}
function activate_buttons(){
  Get('button_freeze'                ).addEventListener('click', spy.freeze                  ) ;
  Get('button_analyse_both_ghost'    ).addEventListener('click', spy.analyse_ghost_both      ) ;
  Get('button_analyse_both_bkg'      ).addEventListener('click', spy.analyse_bkg_both        ) ;
  Get('button_analyse_both_peak'     ).addEventListener('click', spy.analyse_peak_both       ) ;
  
  Get('button_analyse_ATLAS_show'    ).addEventListener('click', spy.analyse_show_ATLAS      ) ;
  Get('button_analyse_ATLAS_ghost'   ).addEventListener('click', spy.analyse_ghost_ATLAS     ) ;
  Get('button_analyse_ATLAS_bkg'     ).addEventListener('click', spy.analyse_bkg_ATLAS       ) ;
  Get('button_analyse_ATLAS_peak'    ).addEventListener('click', spy.analyse_peak_ATLAS      ) ;
  Get('button_analyse_ATLAS_signal'  ).addEventListener('click', spy.analyse_signal_ATLAS    ) ;
  Get('button_analyse_CMS_show'      ).addEventListener('click', spy.analyse_show_CMS        ) ;
  Get('button_analyse_CMS_ghost'     ).addEventListener('click', spy.analyse_ghost_CMS       ) ;
  Get('button_analyse_CMS_bkg'       ).addEventListener('click', spy.analyse_bkg_CMS         ) ;
  Get('button_analyse_CMS_peak'      ).addEventListener('click', spy.analyse_peak_CMS        ) ;
  Get('button_analyse_CMS_signal'    ).addEventListener('click', spy.analyse_signal_CMS      ) ;
  
  Get('button_continue_postFreeze'   ).addEventListener('click', spy.continue_step_postFreeze) ;
  Get('button_continue_postShow'     ).addEventListener('click', spy.continue_step_postShow  ) ;
  Get('button_continue_postGhost'    ).addEventListener('click', spy.continue_step_postGhost ) ;
  Get('button_continue_postBkg'      ).addEventListener('click', spy.continue_step_postBkg   ) ;
  Get('button_continue_postPeak'     ).addEventListener('click', spy.continue_step_postPeak  ) ;
  Get('button_continue_postSignal'   ).addEventListener('click', spy.continue_step_postSignal) ;
  
  Get('button_pointless_noFinishLine').addEventListener('click', spy.start_pointless         ) ;
  Get('button_pointless_finishLine'  ).addEventListener('click', spy.pointless_finishLine    ) ;
  Get('button_pointless_run'         ).addEventListener('click', spy.pointless_run           ) ;
  
  Get('button_combine'               ).addEventListener('click', spy.combine_results         ) ;
  Get('button_announce'              ).addEventListener('click', spy.announce_result         ) ;
}

function start(){
  hide_button() ;

  // Set the global variables.
  experiments['ATLAS'] = new experiment_object('ATLAS') ;
  experiments['CMS'  ] = new experiment_object('CMS'  ) ;
    
  game = new game_object() ;
  spy  = new  spy_object() ;
    
  // Resize the canvas objects.
  SR = 175 ;
  SR = 250 ;
  cw = 2*SR ;
  ch = 2*SR ;
  update_particle_settings(particleLineWidthFactor*cw, 2*particleHeadSizeFactor*cw) ;
  
  // Apply the style to be neutral.  This is done so that we only need to set a single
  // colour in settings.js and make the style function as complex as we like.
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
  
  make_detector() ;
  activate_buttons() ;
  
  // This is CPU intensive, so do it last
  detector.make_cells() ;
  for(var i=0 ; i<detector.segments.length ; i++){
    detector.segments[i].activate_cells() ;
  }
  
  make_eventDisplay_base() ;
  var team_names = ['ATLAS','CMS'] ;
  for(var i=0 ; i<team_names.length ; i++){
    experiments[team_names[i]].set_style() ;
    experiments[team_names[i]].draw_minimumbias_collision() ;
  }
  
  var ATLAS_delay = (random()<0.5) ? 0.25*spy.draw_delay : 0.75*spy.draw_delay ;
  var CMS_delay = 1.0*spy.draw_delay - ATLAS_delay ;
  
  Get('tr_combined_nSigma').style.display = 'none' ;
  Get('span_prob_5Sigma'    ).innerHTML = (Math.exp(-25.0)*100).toFixed(big_ndp) + '%' ; ;
  Get('span_combined_nSigma').innerHTML = (Math.exp(-25.0)*100).toFixed(big_ndp) + '%' ; ;
  
  heartbeat() ;
  heartbeat_fast() ;
}

function heartbeat(){
  if(spy.frozen) return ;
  var team_names = ['ATLAS','CMS'] ;
  for(var i=0 ; i<team_names.length ; i++){
    var ex = experiments[team_names[i]] ;
    if(ex.xmlhttp_muted) continue ;
    ex.xmlhttp.open('GET','event_store.php?task=get_single_collision&team='+team_names[i],true) ;
    var callback = (team_names[i]=='ATLAS') ? experiments['ATLAS'].receive_single_collision_from_server : experiments['CMS'].receive_single_collision_from_server ;
    ex.xmlhttp.onreadystatechange = callback ;
    ex.xmlhttp.send(null) ;
    ex.xmlhttp_muted = true ;
  }
  //window.setTimeout(heartbeat, 500) ;
}

function heartbeat_fast(){
  pulse_counter++ ;
  var pulse = 5*pulse_counter%512 ;
  pulse = (pulse<255) ? pulse : 256-(pulse-256) ;
  var c = Math.floor(pulse) ;
  var color = 'rgb(' + c + ',' + c + ',' + c + ')'  ;
  Get('button_pointless_noFinishLine').style.color = color ;
  window.setTimeout(heartbeat_fast, 2) ;
}

function draw_pointless_counters(){
  return ;
  var s = pointless_step ;
  if(s==300) return ;
  
  var canvas = Get('canvas_histogram_pointless') ;
  if(s==0){
    canvas.style.display = 'block' ;
    Get('canvas_collision_ATLAS').style.display = 'none' ;
    Get('canvas_histogram_ATLAS').style.display = 'none' ;
    Get('canvas_collision_CMS'  ).style.display = 'none' ;
    Get('canvas_histogram_CMS'  ).style.display = 'none' ;
  }
  
  var colorA = experiments['ATLAS'].histogram.color ;
  var colorC = experiments['CMS'  ].histogram.color ;
  
  var sigmaA = experiments['ATLAS'].nSigma ;
  var sigmaC = experiments['CMS'  ].nSigma ;
  var valueA = 100.0*Math.exp(-sigmaA*sigmaA) ;
  var valueC = 100.0*Math.exp(-sigmaC*sigmaC) ;
  total_prob = valueA*valueC ;
  valueB = total_prob ;
  total_prob *= 1e-2 ;
  
  var pcA = new pointless_counter(colorA , valueA    , 'ATLAS'   , 200) ;
  var pcC = new pointless_counter(colorC , valueC    , 'CMS'     , 800) ;
  var pcB = new pointless_counter('black', total_prob, 'Combined', 500) ;
  
  var context = canvas.getContext('2d') ;
  context.fillStyle = 'rgb(255,255,255)' ;
  context.fillRect(0,0,1000,500) ;
  
  var pPerStep = Math.pow(total_prob, 1.0/100) ;
  var pPerSeg  = Math.pow(total_prob, 1.0/segment_n) ;
  
  var probA = 1.0 ;
  var probC = 1.0 ;
  var probB = 1.0 ;
  var nA = 0 ;
  var nC = 0 ;
  var nB = 0 ;
  
  var mA = Math.log(valueA)/Math.log(pPerSeg) ;
  var mC = Math.log(valueC)/Math.log(pPerSeg) ;
  var mB = Math.log(valueB)/Math.log(pPerSeg) ;
  if(s<100){
    nA = segment_n*(s-  0)/100.0 ;
    probA = Math.pow(pPerStep, s-  0+1) ;
    if(nA>mA){
      nA = mA ;
      pointless_step = 100 ;
      pcA.draw_failure(context) ;
    }
  }
  else if(s<200){
    nA = mA ;
    nC = segment_n*(s-100)/100.0 ;
    probA = valueA ;
    probC = Math.pow(pPerStep, s-100+1) ;
    if(nC>mC){
      nC = mC ;
      pointless_step = 200 ;
      pcA.draw_failure(context) ;
      pcC.draw_failure(context) ;
    }
  }
  else if(s<=300){
    nA = mA ;
    nC = mC ;
    nB = segment_n*(s-200)/100.0 ;
    probA = valueA ;
    probC = valueC ;
    probB = Math.pow(pPerStep, s-200+1) ;
    if(nB>mB){
      nB = mB ;
      pointless_step = 300 ;
      pcA.draw_failure(context) ;
      pcC.draw_failure(context) ;
      pcB.draw_success(context) ;
    }
  }
  else{
    nA = mA ;
    nC = mC ;
    nB = mB ;
    probA = valueA ;
    probC = valueC ;
    probB = valueB ;
  }
  
  if(probA<valueA) probA = valueA ;
  if(probC<valueC) probC = valueC ;
  if(probB<valueB) probB = valueB ;
  
  // nSegments.
  if(nA>mA) nA = mA ;
  if(nC>mC) nC = mC ;
  if(nB>mB) nB = mB ;
  
  var ps = [pcA, pcC, pcB] ;
  for(var i=0 ; i<ps.length ; i++){
    ps[i].draw_numberplate(context) ;
    ps[i].draw_name       (context) ;
  }
  
  pcA.draw_thermometer(context, segment_n-nA) ;
  pcC.draw_thermometer(context, segment_n-nC) ;
  pcB.draw_thermometer(context, segment_n-nB) ;
  pcA.draw_percent(context, (100*probA).toFixed(9)+'%') ;
  pcC.draw_percent(context, (100*probC).toFixed(9)+'%') ;
  pcB.draw_percent(context, (100*probB).toFixed(9)+'%') ;
  
  if(s<100){
  }
  else if(s<200){
    pcA.draw_failure(context) ;
  }
  else if(s<=300){
    pcA.draw_failure(context) ;
    pcC.draw_failure(context) ;
  }
  
  if(s<300){
    window.setTimeout(draw_pointless_counters, 100) ;
  }
  else{
    pcA.draw_failure(context) ;
    pcC.draw_failure(context) ;
    pcB.draw_success(context) ;
  }
  pointless_step++ ;
}

function pointless_counter(color, prob, name, x){
  var self = this ;
  self.color = color ;
  self.prob  = prob  ;
  self.name  = name  ;
  self.x = x ;
  self.cw = 1000 ;
  self.ch  = 500 ;
  self.pMax = 1.0  ;
  self.pMin = 1e-16 ;
  
  self.tw = 0.3*self.cw ;
  self.th = 0.55*self.ch ;
  self.tx = self.x - 0.5*self.tw ;
  self.ty = 0.25*self.ch ;
  
  self.draw_thermometer = function(context, nSegments, draw5SigmaBar){
    var c = context ;
    c.save() ;
    c.strokeStyle = self.color ;
    var lw = 0.02*self.cw ;
    c.lineWidth = lw ;
    
    c.strokeRect(self.tx, self.ty, self.tw, self.th) ;
    
    var segment_spacing = 0.01*self.ch ;
    var segment_height = (self.th - (1+segment_n)*segment_spacing - 1*lw)/20.0 ;
    var segment_width = self.tw - 2*segment_spacing - 1*lw ;
    c.fillStyle = self.color ;
    for(var i=0 ; i<nSegments ; i++){
      var xs = self.tx + segment_spacing + 0.5*lw ;
      var ys = self.ty + self.th - i*(segment_spacing+segment_height) - lw ;
      c.fillRect(xs, ys, segment_width, segment_height) ;
    }
    
    if(draw5SigmaBar){
      c.strokeStyle = 'red' ;
      c.fillStyle   = 'red' ;
      c.lineWidth = 0.25*lw ;
      c.beginPath() ;
      var dx = 0.03*self.cw ;
      var x1 = self.tx  -dx ;
      var x2 = self.tx+self.tw+dx ;
      var y1 = self.y_from_p(Math.exp(-25.0)) ;
      c.moveTo(x1, y1) ;
      c.lineTo(x2, y1) ;
      c.stroke() ;
      c.beginPath() ;
      c.arc(x1, y1, 0.5*lw, 0, 2*pi, true) ;
      c.fill() ;
      c.beginPath() ;
      c.arc(x2, y1, 0.5*lw, 0, 2*pi, true) ;
      c.fill() ;
    }
    
    c.fillStyle = 'black' ;
    c.font = 0.03*self.ch + 'px arial' ;
    c.textBaseline = 'middle' ;
    for(var i=1 ; i<20 ; i++){
      var p = Math.pow(0.1,i) ;
      if(p<self.pMin) break ;
      var y2 = self.y_from_p(p) ;
      var x2 = self.tx +self.tw + 0.08*self.cw ;
      c.fillText(p.toFixed(i), x2, y2) ;
    }
    c.font = 0.05*self.ch + 'px arial' ;
    for(var i=1 ; i<20 ; i++){
      var p = Math.exp(-i*i) ;
      if(p<self.pMin) break ;
      var y2 = self.y_from_p(p) ;
      var x2 = self.tx - 0.08*self.cw ;
      c.fillText(i+'\u03C3', x2, y2) ;
    }
    
    c.restore() ;
  }
  self.draw_combined_marker = function(context, prob, color){
    var x1 = self.tx+0.2*self.tw ;
    var x2 = x1+0.6*self.tw ;
    var y1 = self.y_from_p(prob) + 0.03*self.cw ;
    var y2 = self.y_from_p(prob) + 0.08*self.cw ;
    
    var c = context ;
    c.save() ;
    c.fillStyle = color ;
    c.fillRect(x1, y1, x2-x1, y2-y1) ;
    c.beginPath() ;
    c.moveTo(0.4*x1+0.6*x2, y1+0.02*self.ch) ;
    c.lineTo(0.5*x1+0.5*x2, y1-0.02*self.ch) ;
    c.lineTo(0.6*x1+0.4*x2, y1+0.02*self.ch) ;
    c.closePath() ;
    c.fill() ;
    c.fillStyle = 'white' ;
    c.textAlign = 'center' ;
    c.textBaseline = 'middle' ;
    c.font = 0.05*self.ch+'px arial' ;
    c.fillText('Combined', 0.5*(x1+x2), 0.5*(y1+y2)) ;
    c.restore() ;
  }
  self.draw_ATLAS_marker = function(context, prob, color){
    var x1 = self.tx ;
    var x2 = x1-0.1*self.cw ;
    self.draw_marker(context, prob, color, x1, x2, 'ATLAS') ;
  }
  self.draw_CMS_marker = function(context, prob, color){
    var x1 = self.tx+self.tw ;
    var x2 = x1+0.1*self.cw ;
    self.draw_marker(context, prob, color, x1, x2, 'CMS') ;
  }
  self.draw_marker = function(context, prob, color, x1, x2, name){
    var c = context ;
    c.save() ;
    c.lineWidth = 0.02*self.cw ;
    c.strokeStyle = color ;
    var y = self.y_from_p(prob) ;
    var dy = 0.05*self.ch ;
    c.fillStyle = color ;
    c.fillRect(x1, y-dy, x2-x1, 2*dy) ;
    
    var xa = 0 ;
    var xb = 0 ;
    var xc = 0 ;
    var ya = y-0.5*dy ;
    var yb = y ;
    var yc = y+0.5*dy ;
    
    if(name=='ATLAS'){
      xa = x1 ;
      xb = x1+1*dy ;
      xc = x1 ;
    }
    else if(name=='CMS'){
      xa = x1 ;
      xb = x1-1*dy ;
      xc = x1 ;
    }
    c.beginPath() ;
    c.moveTo(xa,ya) ;
    c.lineTo(xb,yb) ;
    c.lineTo(xc,yc) ;
    c.closePath() ;
    c.fill() ;
    
    
    c.fillStyle = 'white' ;
    c.textAlign = 'center' ;
    c.textBaseline = 'middle' ;
    c.font = 0.05*self.ch + 'px arial' ;
    c.fillText(name, 0.5*(x1+x2), y) ;
    c.restore() ;
  }
  self.y_from_p = function(p){
    return self.ty + self.th*(1-Math.log(p/self.pMin)/Math.log(self.pMax/self.pMin)) ;
  }
  self.nSegments_from_p = function(p){
    return Math.floor(segment_n*(1-Math.log(p/self.pMin)/Math.log(self.pMax/self.pMin))) ;
  }
  self.draw_numberplate = function(context){
    var c = context ;
    c.save() ;
    c.translate(self.x, 0.12*self.ch) ;
    c.scale(3,1) ;
    c.beginPath() ;
    c.lineWidth = 0.006*self.cw ;
    c.strokeStyle = self.color ;
    c.arc(0, 0, 0.08*cw, 0, 2*pi, true) ;
    c.stroke() ;
    c.restore() ;
  }
  self.draw_name = function(context){
    var c = context ;
    c.save() ;
    c.fillStyle = self.color ;
    c.fillRect(self.x-0.4*self.tw, 0.8*self.ch, 0.8*self.tw, 0.15*self.ch) ;
    c.fillStyle = 'white' ;
    c.textAlign = 'center' ;
    c.font = 0.06*self.ch + 'px arial' ;
    //c.fillText(self.name, self.x, 0.9*self.ch) ;
    c.restore() ;
  }
  self.draw_percent = function(context, value){
    var c = context ;
    c.save() ;
    c.textAlign = 'center' ;
    c.textBaseline = 'middle' ;
    c.translate(self.x, 0.12*self.ch) ;
    c.fillStyle = self.color ;
    
    var size = self.ch ;
    c.font = size + 'px arial' ;
    var width = c.measureText(value).width ;
    size *= 0.16*self.cw/width ;
    if(size>0.1*self.ch) size = 0.1*self.ch ;
    c.font = size + 'px arial' ;
    c.fillText(value, 0, 0) ;
    c.restore() ;
  }
  
  self.draw_success = function(context){
    // Standard stuff for a new path.
    var c = context ;
    c.save() ;
    c.translate(self.x, 0.5*self.ch) ;
    
    c.lineCap = 'round' ;
    c.beginPath() ;
    
    // Define some variables to draw the circles etc.  We should probably put these
    // in settings.js.
    c.lineWidth = 0.02*self.cw ;
    // Set the stroke colour.  We need better variable names for this!
    c.strokeStyle = collision_matched_color ;
    c.arc(0.0*self.cw, 0.0*self.ch, 0.1*self.cw, 0, 2*pi, true) ;
    
    // Tick mark.
    c.moveTo(-0.1*self.ch, 0.05*self.ch) ;
    c.lineTo( 0.0*self.ch, 0.10*self.ch) ;
    c.lineTo( 0.1*self.ch,-0.10*self.ch) ;
    
    // Finish things off.
    c.stroke() ;
    c.restore() ;
  }
  self.draw_failure = function(context){
    // Standard stuff for a new path.
    var c = context ;
    c.save() ;
    c.translate(self.x, 0.5*self.ch) ;
    
    c.lineCap = 'round' ;
    c.beginPath() ;
    
    // Define some variables to draw the circles etc.  We should probably put these
    // in settings.js.
    c.lineWidth = 0.02*self.cw ;
    // Set the stroke colour.  We need better variable names for this!
    c.strokeStyle = collision_notMatched_color ;
    c.arc(0.0*self.ch, 0.0*self.ch, 0.1*self.cw, 0, 2*pi, true) ;
    
    // Cross mark.
    c.moveTo(-0.1*self.ch,-0.1*self.ch) ;
    c.lineTo( 0.1*self.ch, 0.1*self.ch) ;
    c.moveTo(-0.1*self.ch, 0.1*self.ch) ;
    c.lineTo( 0.1*self.ch,-0.1*self.ch) ;
    
    // Finish things off.
    c.stroke() ;
    c.restore() ;
  }
}



