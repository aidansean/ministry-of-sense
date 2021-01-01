// The detector is arranged in a hierarchy of components.
// In real life the detector is split into subdetectors that interact with different
// particles in different ways.  These are usually arranged in different radial ranges.
// Subdetectors are arranged in layers in r.
// Circular subdetectors are hard to make, so they are split into regular polygons.
// (We work in circular coordinates, so use polygons with lots of sides!)
// Each side of the polygon is a wedge.
// Finally each subdetector is split into segments.
//
// The hierarchy looks something like this:
// Detector
//  +Subdetector
//  +-+-Layer
//  | +-+-Wedge
//  | | +---Segment
//  | | +---Segment
//
// We only really care about the segments, and everything else is arranged so that we can
// recursively reach all segments from the top level.
// There's probably a better way of arranging the detector, but this'll do for now.
//
// Subdetectors have characteristic responses to each particle type.  There's some real
// physics involved in understanding these responses!

function detector_object(){
  // Strengths of the magnetic fields.
  this.B1 = 0.10 ;
  this.B2 = 0.08 ;

  this.subdetectors = [] ;
  this.segments     = [] ;
  
  // We populate two arrays of cells.
  // A two dimensional array is used for looping over r and phi.
  // A one dimensional array is used for single line loops (eg to reset all cells easily.)
  this.cells        = [] ;
  this.cells_linear = [] ;
  this.make_cells = function(){
    for(var u=0 ; u<NR ; u++){
      this.cells.push([]) ;
      var r = u*cellSizeR ;
      for(var v=0 ; v<NPhi ; v++){
        var phi = v*cellSizePhi ;
        var cell = new cell_object(r, phi) ;
        this.cells[u].push(cell) ;
        this.cells_linear.push(cell) ;
      }
    }
  }
  
  // This should only be used for debugging purposes, as it is very expensive!
  this.draw_cells = function(context){
    for(var u=1 ; u<this.cells.length ; u++){
      for(var v=0 ; v<this.cells[u].length ; v++){
        this.cells[u][v].draw(context) ;
      }
    }
  }
  
  this.start_collision = function(){
    for(var i=0 ; i<this.cells_linear.length ; i++){
      this.cells_linear[i].start_collision() ;
    }
    for(var i=0 ; i<this.segments.length ; i++){
      this.segments[i].start_collision() ;
    }
  }
  
  // Basic geometry of the magnetic fields.  The field flips once (edge of the solenoid)
  // then there's a step down (edge of the yoke) then it disappears.
  this.magnetFlipR = 0.20*Sr ;
  this.magnetStepR = 0.45*Sr ;
  this.magnetEdgeR = 0.95*Sr ;
  
  this.process_collision = function(collision){
    if(true==collision.is_processed) return ;
    collision.is_processed = true ;
    // Reset all the cells and segments so we can analyse the event.
    //this.start_collision() ;
    
    for(var i=0 ; i<this.cells_linear.length ; i++){
      this.cells_linear[i].update_segments() ;
    }
  }
  this.process_particle = function(particle){
    // This should propagate a particle using the Lorentz force law for the magnetic
    // fields in the detector.  It's a bit broken because the units are not handled
    // properly.
    
    // Parameters based on the magnetic field, and particle mass.
    var k1 =  pow(SoL,2)*this.B1/(particle.mass*1e9) ;
    var k2 = -pow(SoL,2)*this.B2/(particle.mass*1e9) ;
    
    // Express v in ms^-1.
    var gv = particle.pt/particle.mass ;
    var vt = SoL*sqrt(gv*gv/(gv*gv+1)) ;
    var vx = vt*cos(particle.phi) ;
    var vy = vt*sin(particle.phi) ;
    
    // Express t in s.
    var dt = 1e-9 ;
    var x  = particle.track.x0 ;
    var y  = particle.track.y0 ;
    var sign = particle.charge ;
    var k = k1 ;
    var trajectory = [] ;
    trajectory.push([x,y]) ;
    for(var i=0 ; i<100 ; i++){
      var b2 = (vx*vx+vy*vy)/(SoL*SoL) ;
      var g  = 1/sqrt(1-b2) ;
      
      // Careful!  We need to normalise vx and vy to make sure we don't violate the speed
      // of light
      var dvx =  k*particle.charge*vy*dt ;
      var dvy = -k*particle.charge*vx*dt ;
      var vxTmp = vx + dvx ;
      var vyTmp = vy + dvy ;
      
      vx = vt*vxTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      vy = vt*vyTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      var dx = vx*dt ;
      var dy = vy*dt ;
      x += dx ;
      y += dy ;
      var r = sqrt(x*x+y*y) ;
      if(this.specialParticle){
        if(r>particle_settings[particle.particle_type].rCutoff) break ;
      }
      if(r<this.magnetFlipR){
        sign = particle.charge ;
        k = k1 ;
      }
      else if(r<this.magnetStepR){
        sign = -particle.charge ;
        k = k2 ;
      }
      else if(r<this.magnetEdgeR){
        sign = -particle.charge ;
        k = 0 ;
      }
      else{
        break ;
      }
      trajectory.push([x,y]) ;
    }
    return trajectory ;
  }
  this.draw = function(context){
    for(var i=0 ; i<this.subdetectors.length ; i++){
      this.subdetectors[i].draw(context) ;
    }
  }
  this.draw_active_segments = function(context){
    for(var i=0 ; i<this.segments.length ; i++){
      if(this.segments[i].is_touched) this.segments[i].draw(context) ;
    }
  }
}

function subdetector_object(name, r1, r2, spacing_r, spacing_phi, nLayers, nWedges, nSegments, strokeColor, fillRgb0, fillRgb1, particle_responses){
  this.name = name ;
  this.r1 = r1 ;
  this.r2 = r2 ;
  this.fillRgb0 = fillRgb0 ;
  this.fillRgb1 = fillRgb1 ;
  this.strokeColor = strokeColor ;
  this.nLayers = nLayers ;
  this.layerDR = (this.r2-this.r1)/this.nLayers ;
  
  this.layers = [] ;
  for(var i=0 ; i<nLayers ; i++){
    var r1Tmp = this.r1 + (i+0)*this.layerDR ;
    var r2Tmp = this.r1 + (i+1)*this.layerDR - spacing_r ;
    this.layers.push(new subdetector_layer_object(r1Tmp, r2Tmp, spacing_phi, nWedges, nSegments, fillRgb0, fillRgb1, this.strokeColor, particle_responses)) ;
  }
  this.draw = function(context){
    for(var i=0 ; i<this.layers.length ; i++){
      this.layers[i].draw(context) ;
    }
  }
}
function subdetector_layer_object(r1, r2, spacing_phi, nWedges, nSegments, fillRgb0, fillRgb1, strokeColor, particle_responses){
  this.r1 = r1 ;
  this.r2 = r2 ;
  this.spacing = spacing_phi ;
  this.nWedges = nWedges ;
  this.fillRgb0 = fillRgb0 ;
  this.fillRgb1 = fillRgb1 ;
  this.strokeColor = strokeColor ;
  
  this.wedges = [] ;
  this.wedgeDPhi = 2*pi/this.nWedges ;
  for(var i=0 ; i<this.nWedges ; i++){
    var phi1Tmp = (i+0)*this.wedgeDPhi ;
    var phi2Tmp = (i+1)*this.wedgeDPhi - spacing_phi ;
    this.wedges.push(new subdetector_wedge_object(this.r1, this.r2, phi1Tmp, phi2Tmp, nSegments, fillRgb0, fillRgb1, this.strokeColor, particle_responses)) ;
  }
  this.draw = function(context){
    for(var i=0 ; i<this.wedges.length ; i++){
      this.wedges[i].draw(context) ;
    }
  }
}
function subdetector_wedge_object(r1, r2, phi1, phi2, nSegments, fillRgb0, fillRgb1, strokeColor, particle_responses){
  this.r1 = r1 ;
  this.r2 = r2 ;
  this.phi1 = phi1 ;
  this.phi2 = phi2 ;
  this.nSegments = nSegments ;
  this.fillRgb0 = fillRgb0 ;
  this.fillRgb1 = fillRgb1 ;
  this.strokeColor = strokeColor ;
  
  this.segments = [] ;
  this.segmentDPhi = (this.phi2-this.phi1)/nSegments ;
  var xA = this.r1*cos(this.phi1) ;
  var yA = this.r1*sin(this.phi1) ;
  var xB = this.r1*cos(this.phi2) ;
  var yB = this.r1*sin(this.phi2) ;
  var xC = this.r2*cos(this.phi1) ;
  var yC = this.r2*sin(this.phi1) ;
  var xD = this.r2*cos(this.phi2) ;
  var yD = this.r2*sin(this.phi2) ;
  
  for(var i=0 ; i<this.nSegments ; i++){
    var phi1Tmp = this.phi1 + (i-0.0)*this.segmentDPhi ;
    var phi2Tmp = this.phi1 + (i+1.0)*this.segmentDPhi ;
    var x1 = xA + (xB-xA)*(i+0)/this.nSegments ;
    var y1 = yA + (yB-yA)*(i+0)/this.nSegments ;
    var x2 = xA + (xB-xA)*(i+1)/this.nSegments ;
    var y2 = yA + (yB-yA)*(i+1)/this.nSegments ;
    var x3 = xC + (xD-xC)*(i+1)/this.nSegments ;
    var y3 = yC + (yD-yC)*(i+1)/this.nSegments ;
    var x4 = xC + (xD-xC)*(i+0)/this.nSegments ;
    var y4 = yC + (yD-yC)*(i+0)/this.nSegments ;
    this.segments.push(new subdetector_segment_object(this.r1, this.r2, phi1Tmp, phi2Tmp, x1, y1, x2, y2, x3, y3, x4, y4, fillRgb0, fillRgb1, this.strokeColor, particle_responses)) ;
  }
  this.draw = function(context){
    for(var i=0 ; i<this.segments.length ; i++){
      this.segments[i].draw(context) ;
    }
  }
}
function subdetector_segment_object(r1, r2, phi1, phi2, x1, y1, x2, y2, x3, y3, x4, y4, fillRgb0, fillRgb1, strokeColor, particle_responses){
  // Segments have trapezium shapes.  This doesn't match onto polar coordinates exactly
  // so we must make the number of segments large enough to make the mismatch small.

  // Add this to the list of segments so that we can loop over all segments easily.
  detector.segments.push(this) ;
  
  // Set the range in (r,phi).
  this.r1 = r1 ;
  this.r2 = r2 ;
  this.phi1 = phi1 ;
  this.phi2 = phi2 ;
  
  // Styles.
  this.fillRgb0 = fillRgb0 ;
  this.fillRgb1 = fillRgb1 ;
  this.strokeColor = strokeColor ;
  
  // Actual physics content!
  this.particle_responses = particle_responses ;
  
  // The vertices in physical (x,y) space.
  this.x1 = x1 ;
  this.y1 = y1 ;
  this.x2 = x2 ;
  this.y2 = y2 ;
  this.x3 = x3 ;
  this.y3 = y3 ;
  this.x4 = x4 ;
  this.y4 = y4 ;
  
  // Vertices in (X,Y) space on the canvas for drawing.
  this.X1 = X_from_x(this.x1) ;
  this.Y1 = Y_from_y(this.y1) ;
  this.X2 = X_from_x(this.x2) ;
  this.Y2 = Y_from_y(this.y2) ;
  this.X3 = X_from_x(this.x3) ;
  this.Y3 = Y_from_y(this.y3) ;
  this.X4 = X_from_x(this.x4) ;
  this.Y4 = Y_from_y(this.y4) ;
  
  // Make this untouched
  this.is_touched = false ;
  
  // The response will change on an event by event basis, and is the sum of the
  // individual particle responses for that particular event.
  this.response = 0 ;
  
  this.activate_cells = function(){
    // This is an expensive function that should only be called when the detector
    // geometry is updated.  It adds the segment to the cells so that cells can turn the
    // segments on quickly.  This is where we look in (r,phi) space instead of (x,y)
    // space.
    var i0 = floor(this.  r1/cellSizeR  ) ;
    var i1 = floor(this.  r2/cellSizeR  ) ;
    var j0 = floor(this.phi1/cellSizePhi) ;
    var j1 = floor(this.phi2/cellSizePhi) ;
    for(var i=i0 ; i<i1 ; i++){
      for(var j=j0 ; j<j1 ; j++){
        detector.cells[i][j].add_segment(this) ;
      }
    }
    return ;
  }
  
  this.start_collision = function(){
    // It's very important that we reset these values for a new event!
    this.is_touched = false ;
    this.response = 0 ;
  }
  
  this.draw = function(context){
    // Save the canvas, start a path, set the style and assemble the path.
    context.save() ;
    context.beginPath() ;
    context.fillStyle   = this.fillColor ;
    context.strokeStyle = this.strokeColor ;
    context.moveTo(this.X1,this.Y1) ;
    context.lineTo(this.X2,this.Y2) ;
    context.lineTo(this.X3,this.Y3) ;
    context.lineTo(this.X4,this.Y4) ;
    context.lineTo(this.X1,this.Y1) ;
    context.closePath() ;
    context.stroke() ;
    
    // Use the response to determine the colour of the segment.
    // First put it in the range [0,1]
    if(this.response<0) this.response = 0 ;
    if(this.response>1) this.response = 1 ;
    
    // The colours are arranged in a simple linear gradient.
    // This may be changed if it turns out a different gradient looks more "natural".
    var fr = Math.floor(this.fillRgb0[0]+this.response*(this.fillRgb1[0])) ;
    var fg = Math.floor(this.fillRgb0[1]+this.response*(this.fillRgb1[1])) ;
    var fb = Math.floor(this.fillRgb0[2]+this.response*(this.fillRgb1[2])) ;
    
    // Okay, enough rambling, let's just draw this thing.
    //context.fillStyle = 'rgb(' + fr + ',' + fg + ',' + fb + ')' ;
    
    var xA = 0.5*(this.X1+this.X2) ;
    var yA = 0.5*(this.Y1+this.Y2) ;
    var xB = 0.5*(this.X3+this.X4) ;
    var yB = 0.5*(this.Y3+this.Y4) ;
    
    var dX = xA-xB ;
    var dY = yA-yB ;
    var cX = 0.5*(xA+xB) ;
    var cY = 0.5*(yA+yB) ;
    
    var xC = cX - dX ;
    var yC = cY - dY ;
    var xD = cX + dX ;
    var yD = cY + dY ;
    
    var gradient = context.createLinearGradient(xC,yC,xD,yD) ;
    gradient.addColorStop(0,'white') ;
    gradient.addColorStop(0.5,'rgb(' + fr + ',' + fg + ',' + fb + ')') ;
    gradient.addColorStop(1,'white') ;
    context.fillStyle = gradient ;
    
    context.fill() ;
    context.restore() ;
  }
  
  this.touch = function(particle_types){
    this.is_touched = true ;
    
    for(var i=0 ; i<particle_names.length ; i++){
      if(particle_types[particle_names[i]]) this.response += this.particle_responses[particle_names[i]] ;
    }
    
    // Add some noise.
    this.response += -0.1+0.2*random() ;
  }
}
// To save CPU time a map of cells is made in (r,phi) space.  The detector components are
// mapped onto these cells.  As the particles pass through the detector they pass through
// the cells and these light up the detector components.
function cell_object(r, phi){
  this.rMid   = r   + 0.5*cellSizeR   ;
  this.phiMid = phi + 0.0*cellSizePhi ;
  this.r1     = r   - 0.0*cellSizeR   ;
  this.r2     = r   + 1.0*cellSizeR   ;
  this.phi1   = phi - 0.5*cellSizePhi ;
  this.phi2   = phi + 0.5*cellSizePhi ;
  
  // General settings.
  // Set is_touched to false at the start of each event, and true when a particle hits it.
  this.is_touched = false ;
  // Some cells don't match up to detector components, so don't bother with them.
  this.is_in_acceptance = false ;
  
  // Each cell can belong to at least one subdetector segment.
  this.segments = [] ;
  this.particle_types = [] ;
  for(var i=0 ; i<particle_names.length ; i++){
    this.particle_types[particle_names[i]] = false ;
  }
  
  this.touch = function(particle_type){
    this.is_touched = true ;
    this.particle_types[particle_type] = true ;
  }
  this.start_collision = function(){
    this.is_touched = false ;
    for(var i=0 ; i<particle_names.length ; i++){
      this.particle_types[particle_names[i]] = false ;
    }
  }
  this.add_segment = function(segment){
    this.is_in_acceptance = true ;
    this.segments.push(segment) ;
  }
  this.draw = function(context){
    //if(this.is_in_acceptance==false) return ;
    
    context.save() ;
    
    var CX = X_from_x(0) ;
    var CY = Y_from_y(0) ;
    var R1 = X_from_x(this.r1) - X_from_x(0) ;
    var R2 = X_from_x(this.r2) - Y_from_y(0) ;
    
    var X1 = X_from_x(this.r1*cos(this.phi1)) ;
    var Y1 = Y_from_y(this.r1*sin(this.phi1)) ;
    var X2 = X_from_x(this.r2*cos(this.phi1)) ;
    var Y2 = Y_from_y(this.r2*sin(this.phi1)) ;
    var X3 = X_from_x(this.r1*cos(this.phi2)) ;
    var Y3 = Y_from_y(this.r1*sin(this.phi2)) ;
    var X4 = X_from_x(this.r2*cos(this.phi2)) ;
    var Y4 = Y_from_y(this.r2*sin(this.phi2)) ;
    
    context.lineWidth = 1 ;
    context.strokeStyle = '#00aaff' ;
    context.fillStyle   = '#ff00ff' ;
    var direction = (this.phi1>this.phi2) ;
    context.beginPath() ;
    context.moveTo(X1, Y1) ;
    context.arc(CX, CY, R1, this.phi1, this.phi2,  direction) ;
    context.lineTo(X4, Y4) ;
    context.arc(CX, CY, R2, this.phi2, this.phi1, !direction) ;
    context.lineTo(X1, Y1) ;
    if(this.is_touched) context.fill() ;
    context.stroke() ;
    
    context.restore() ;
  }
  this.update_segments = function(){
    if(this.is_touched){
      for(var i=0 ; i<this.segments.length ; i++){
        this.segments[i].touch(this.particle_types) ;
      }
    }
  }
}

function make_detector(){
  // Run away if we're in mobile mode.
  //if(device=='mobile') return ;

  // These are somewhat arbitrary arrangements of subdetectors that are vaguely inspired
  // by general purpose detectors.  They are arranged in radii to look good on the
  // canvas rather than to be realistic.  They're roughly on a logarithmic scale.
  
  // Let's make a few subdetectors:
  // Line colours first.
  var strkColor = 'rgb(255,255,255)' ; // Pixel tracker.
  var ptrkColor = 'rgb(  0,150,150)' ; // Silicon tracker (should really be first.)
  var ecalColor = 'rgb(  0,200,  0)' ; // Electromagnetic calorimeter.
  var hcalColor = 'rgb(150,170,255)' ; // Hadronic calorimeter.
  var mcalColor = 'rgb(250,  0,  0)' ; // Muon chambers.  (In reality this a collection of many subdetectors.)
  
  // Now fill colours.  Each subdetector has a linear gradient between the pairs of stops.
  var strkRgb0 = [100,100,100] ; var strkRgb1 = [255,255,255] ;
  var ptrkRgb0 = [  0,150,150] ; var ptrkRgb1 = [  0,255,255] ;
  var ecalRgb0 = [ 0,100,   0] ; var ecalRgb1 = [255,255,255] ;
  var hcalRgb0 = [ 50, 50,100] ; var hcalRgb1 = [255,255,255] ;
  var mcalRgb0 = [255,100,100] ; var mcalRgb1 = [255,255,255] ;
  
  // Make the particle responses.  These are roughly inspired by physics knowledge.
  var strkResponses = [] ;
  strkResponses['pion'    ] = 1.0 ;
  strkResponses['muon'    ] = 1.0 ;
  strkResponses['electron'] = 1.0 ;
  strkResponses['photon'  ] = 0.0 ;
  strkResponses['tau'     ] = 1.0 ;
  
  var ptrkResponses = [] ;
  ptrkResponses['pion'    ] = 1.0 ;
  ptrkResponses['muon'    ] = 1.0 ;
  ptrkResponses['electron'] = 1.0 ;
  ptrkResponses['photon'  ] = 0.0 ;
  ptrkResponses['tau'     ] = 1.0 ;
  
  var ecalResponses = [] ;
  ecalResponses['pion'    ] = 0.1 ;
  ecalResponses['muon'    ] = 0.1 ;
  ecalResponses['electron'] = 1.0 ;
  ecalResponses['photon'  ] = 1.0 ;
  ecalResponses['tau'     ] = 0.3 ;
  
  var hcalResponses = [] ;
  hcalResponses['pion'    ] = 0.1 ;
  hcalResponses['muon'    ] = 0.1 ;
  hcalResponses['electron'] = 0.3 ;
  hcalResponses['photon'  ] = 0.3 ;
  hcalResponses['tau'     ] = 1.0 ;
  
  var mcalResponses = [] ;
  mcalResponses['pion'    ] = 0.1 ;
  mcalResponses['muon'    ] = 0.8 ;
  mcalResponses['electron'] = 0.1 ;
  mcalResponses['photon'  ] = 0.1 ;
  mcalResponses['tau'     ] = 0.1 ;
  
  // Assemble the subdetectors.
  // function subdetector_object(name, r1, r2, spacing_r, spacing_phi, nLayers, nWedges, nSegments, fillColor, strokeColor)
  var strk = new subdetector_object('strk', 0.03*Sr, 0.12*Sr, 0.01*Sr, 0.001*2*pi, 6, 12,  3, strkColor, strkRgb0, strkRgb1, strkResponses) ;
  var ptrk = new subdetector_object('ptrk', 0.13*Sr, 0.27*Sr, 0.01*Sr, 0.002*2*pi, 5, 60,  1, ptrkColor, ptrkRgb0, ptrkRgb1, ptrkResponses) ;
  var ecal = new subdetector_object('ecal', 0.30*Sr, 0.49*Sr, 0.01*Sr, 0.005*2*pi, 4, 12, 12, ecalColor, ecalRgb0, ecalRgb1, ecalResponses) ;
  var hcal = new subdetector_object('hcal', 0.52*Sr, 0.70*Sr, 0.01*Sr, 0.005*2*pi, 3, 16,  8, hcalColor, hcalRgb0, hcalRgb1, hcalResponses) ;
  var mcal = new subdetector_object('mcal', 0.72*Sr, 0.99*Sr, 0.03*Sr, 0.003*2*pi, 3, 18, 10, mcalColor, mcalRgb0, mcalRgb1, mcalResponses) ;
  
  // Put the subdetectors into the detector.
  detector.subdetectors.push(ptrk) ;
  detector.subdetectors.push(strk) ;
  detector.subdetectors.push(ecal) ;
  detector.subdetectors.push(hcal) ;
  detector.subdetectors.push(mcal) ;
}

function make_logo_detector(){
  // Lightweight version for the logo.
  // Line colours first.
  var hcalColor = 'rgb(150,170,255)' ; // Hadronic calorimeter.
  var mcalColor = 'rgb(250,  0,  0)' ; // Muon chambers.  (In reality this a collection of many subdetectors.)
  var mcalColor = 'rgb(  0,  0,  0)' ; // Muon chambers.  (In reality this a collection of many subdetectors.)
  
  // Now fill colours.  Each subdetector has a linear gradient between the pairs of stops.
  var hcalRgb0 = [ 50, 50,100] ; var hcalRgb1 = [255,255,255] ;
  var mcalRgb0 = [100,100,100] ; var mcalRgb1 = [255,255,255] ;
  
  // Make the particle responses.  These are roughly inspired by physics knowledge.
  var hcalResponses = [] ;
  hcalResponses['pion'    ] = 0.1 ;
  hcalResponses['muon'    ] = 0.1 ;
  hcalResponses['electron'] = 0.3 ;
  hcalResponses['photon'  ] = 0.3 ;
  hcalResponses['tau'     ] = 1.0 ;
  
  var mcalResponses = [] ;
  mcalResponses['pion'    ] = 0.1 ;
  mcalResponses['muon'    ] = 0.8 ;
  mcalResponses['electron'] = 0.1 ;
  mcalResponses['photon'  ] = 0.1 ;
  mcalResponses['tau'     ] = 0.1 ;
  
  // Assemble the subdetectors.
  // function subdetector_object(name, r1, r2, spacing_r, spacing_phi, nLayers, nWedges, nSegments, fillColor, strokeColor)
  var hcal = new subdetector_object('hcal', 0.52*Sr, 0.70*Sr, 0.01*Sr, 0.005*2*pi, 2, 16,  1, hcalColor, hcalRgb0, hcalRgb1, hcalResponses) ;
  var mcal = new subdetector_object('mcal', 0.72*Sr, 0.99*Sr, 0.03*Sr, 0.003*2*pi, 2, 18,  1, mcalColor, mcalRgb0, mcalRgb1, mcalResponses) ;
  
  // Put the subdetectors into the detector.
  //detector.subdetectors.push(hcal) ;
  detector.subdetectors.push(mcal) ;
}
