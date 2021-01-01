// These objects are supposed to handle the particles (their path through the detector
// etc) but some parts are broken.

// These particles have tracks.
function particle_object(type, charge, pt, phi, x0, y0, isCosmic){
  this.type   = type   ;
  this.charge = charge ;
  this.pt     = pt     ;
  this.phi    = phi    ;
  this.settings = particle_settings[this.type] ;
  this.charge = this.settings.charge ; // Set charge to 0 for photons.
  this.mass = this.settings.mass ;
  this.isCosmic = isCosmic ;
  
  var nDirs = 4 ;
  this.phi = 2*pi*((nDirs*(this.phi/(2*pi)))%nDirs) ;
  this.track = new trackObject(this.charge, this.mass, this.pt, this.phi, x0, y0, this.settings.color, this.type, this.isCosmic) ;
  this.track.lineWidth = this.settings.lineWidth ;
  this.draw = function(context, step){
    this.track.draw(context, step) ;
    
    var last_point_index = (step<0) ? this.track.trajectory.length : floor(this.track.trajectory.length*step/100) ;
    last_point_index = max(0,min(last_point_index, this.track.trajectory.length-1)) ;
    var xy = this.track.trajectory[last_point_index] ;
    var X = X_from_x(xy[0]) ;
    var Y = Y_from_y(xy[1]) ;
    draw_particle_head(context, X, Y, this.settings.headSize, this.settings.color, this.settings.symbol, this.settings.headShape) ;
  }
}

// This class has tracks as members.
function jet_object(pt, phi, x0, y0, color, PNG){
  this.pt  = pt  ;
  this.phi = phi ;
  this.color = color ;
  this.tracks = [] ;
  this.x0 = x0 ;
  this.y0 = y0 ;
  var remaining_pt = pt ;
  var charge = (PNG.random()<0.5) ? 1 : -1 ;
  do{
    charge *= -1 ;
    var sign = -charge ;
    var pt_tmp  = 0.75*remaining_pt*PNG.random() ;
    var phi_tmp = this.phi + sign*PNG.random()*collision_parameters.jet_track_dphi ;
    remaining_pt -= pt_tmp ;
    this.tracks.push(new trackObject(charge, mPi, pt_tmp, phi_tmp, 0, 0, this.color, 'pion', false)) ;
  } while(remaining_pt>collision_parameters.jet_track_pt_threshold) ;
  for(var i=0 ; i<this.tracks.length ; i++){
    this.tracks[i].make_trajectory(detector) ;
  }
  this.draw = function(context, step){
    for(var i=0 ; i<this.tracks.length ; i++){
      this.tracks[i].draw(context, step) ;
    }
  }
}

function trackObject(charge, mass, pt, phi, x0, y0, color, particle_type, isCosmic){
  this.charge = charge ;
  this.mass = mass ;
  this.pt  =  pt ;
  this.phi = phi ;
  this.color = color ;
  this.particle_type = particle_type ;
  this.lineWidth = particleLineWidth ;
  this.trajectory = [] ;
  this.x0 = x0 ;
  this.y0 = y0 ;
  this.isCosmic = isCosmic ;
  if(this.isCosmic){
    this.y0 = -0.95*Sr ;
  }
  
  this.specialParticle = false ;
  for(var j=0 ; j<special_particle_names.length ; j++){
    if(special_particle_names[j]==this.particle_type) this.specialParticle = true ;
  }
  
  this.make_trajectory = function(theDetector){
    // This should propagate a particle using the Lorentz force law for the magnetic
    // fields in the detector.  It's a bit broken because the units are not handled
    // properly.
    
    // Parameters based on the magnetic field, and particle mass.
    var k1 =  pow(SoL,2)*theDetector.B1/(this.mass*1e9) ;
    var k2 = -pow(SoL,2)*theDetector.B2/(this.mass*1e9) ;
    
    // Express v in ms^-1.
    var gv = this.pt/this.mass ;
    var vt = SoL*sqrt(gv*gv/(gv*gv+1)) ;
    var vx = vt*cos(this.phi) ;
    var vy = vt*sin(this.phi) ;
    
    // Express t in s.
    var dt = 1e-9 ;
    var x  = this.x0 ;
    var y  = this.y0 ;
    var sign = this.charge ;
    var k = k1 ;
    this.trajectory.push([x,y]) ;
    for(var i=0 ; i<500 ; i++){
      var b2 = (vx*vx+vy*vy)/(SoL*SoL) ;
      var g  = 1/sqrt(1-b2) ;
      
      // Careful!  We need to normalise vx and vy to make sure we don't violate the speed
      // of light
      var dvx =  k*this.charge*vy*dt ;
      var dvy = -k*this.charge*vx*dt ;
      var vxTmp = vx + dvx ;
      var vyTmp = vy + dvy ;
      
      vx = vt*vxTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      vy = vt*vyTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      var dx = vx*dt ;
      var dy = vy*dt ;
      x += dx ;
      y += dy ;
      var r = sqrt(x*x+y*y) ;
      if(r<0.2*Sr){
        sign = this.charge ;
        k = k1 ;
      }
      if(this.specialParticle){
        if(this.isCosmic && r>Sr*1.2){
          break ;
        }
        else if(r>particle_settings[this.particle_type].rCutoff){
          break ;
        }
      }
      if(r<detector.magnetFlipR){
        sign = this.charge ;
        k = k1 ;
      }
      else if(r<detector.magnetStepR){
        sign = -this.charge ;
        k = k2 ;
      }
      else if(r<detector.magnetEdgeR){
        sign = -this.charge ;
        k = 0 ;
      }
      else{
        break ;
      }
      this.trajectory.push([x,y]) ;
    }
  }
  this.make_trajectory_old = function(theDetector){
    // This should propagate a particle using the Lorentz force law for the magnetic
    // fields in the detector.  It's a bit broken because the units are not handled
    // properly.
    
    // Parameters based on the magnetic field, and particle mass.
    var k1 =  pow(SoL,2)*theDetector.B1/(this.mass*1e9) ;
    var k2 = -pow(SoL,2)*theDetector.B2/(this.mass*1e9) ;
    
    // Express v in ms^-1.
    var gv = this.pt/this.mass ;
    var vt = SoL*sqrt(gv*gv/(gv*gv+1)) ;
    var vx = vt*cos(this.phi) ;
    var vy = vt*sin(this.phi) ;
    
    // Express t in s.
    var dt = 1e-9 ;
    var x  = this.x0 ;
    var y  = this.y0 ;
    var sign = this.charge ;
    var k = k1 ;
    this.trajectory.push([x,y]) ;
    for(var i=0 ; i<500 ; i++){
      var b2 = (vx*vx+vy*vy)/(SoL*SoL) ;
      var g  = 1/sqrt(1-b2) ;
      
      // Careful!  We need to normalise vx and vy to make sure we don't violate the speed
      // of light
      var dvx =  k*this.charge*vy*dt ;
      var dvy = -k*this.charge*vx*dt ;
      var vxTmp = vx + dvx ;
      var vyTmp = vy + dvy ;
      
      vx = vt*vxTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      vy = vt*vyTmp/sqrt(vxTmp*vxTmp+vyTmp*vyTmp) ;
      var dx = vx*dt ;
      var dy = vy*dt ;
      x += dx ;
      y += dy ;
      var r = sqrt(x*x+y*y) ;
      if(r<0.2*Sr){
        sign = this.charge ;
        k = k1 ;
      }
      if(this.specialParticle){
        if(this.isCosmic && r>Sr*1.2){
          break ;
        }
        else if(r>particle_settings[this.particle_type].rCutoff){
          break ;
        }
      }
      if(r<detector.magnetFlipR){
        sign = this.charge ;
        k = k1 ;
      }
      else if(r<detector.magnetStepR){
        sign = -this.charge ;
        k = k2 ;
      }
      else if(r<detector.magnetEdgeR){
        sign = -this.charge ;
        k = 0 ;
      }
      else{
        break ;
      }
      this.trajectory.push([x,y]) ;
    }
  }
  
  this.touch_cells = function(the_detector){
    // Run away if we're in mobile mode.
    if(device=='mobile') return ;
  
    // Touch all the cells so that the segments can get turned on.
    for(var i=0 ; i<this.trajectory.length ; i++){
      var xy = this.trajectory[i] ;
      var x = xy[0] ;
      var y = xy[1] ;
      var r  = sqrt(x*x+y*y) ;
      var phi = atan2(y,x) ;
      if(phi<0   ) phi += 2*pi ;
      if(phi>2*pi) phi -= 2*pi ;
      var u = floor(  r/cellSizeR  ) ;
      var v = floor(phi/cellSizePhi) ;
      if(u<the_detector.cells.length){
        if(v<the_detector.cells[u].length){
          the_detector.cells[u][v].touch(this.particle_type) ;
        }
      }
    }
    return ;
  }
  this.make_trajectory(detector) ;
  this.touch_cells(detector) ;
  
  this.draw = function(context, step){
    // Normal stuff for the canvas.
    context.save() ;
    context.beginPath() ;
    context.lineCap = 'round' ;
    
    // We stop after a certain number of steps.  In this case step is a percentage of the
    // number of points available.
    var last_point_index = (step<0) ? this.trajectory.length : floor(this.trajectory.length*step/100) ;
    last_point_index = Math.min(last_point_index, this.trajectory.length-1) ;
    
    // Walk through the trajectory.
    context.moveTo(X_from_x(this.trajectory[1][0]),Y_from_y(this.trajectory[1][1])) ;
    
    // rTmp makes sure we stop if we find r becoming smaller again.
    var rTmp = 0 ;
    for(var i=0 ; i<last_point_index ; i++){
      var xy = this.trajectory[i] ;
      var r = sqrt( pow(xy[0],2) + pow(xy[1],2) ) ;
      if(r<rTmp && this.isCosmic==false) break ;
      rTmp = r ;
      if(this.specialParticle){
        if(this.isCosmic){
        }
        else if(r>particle_settings[this.particle_type].rCutoff){
          break ;
        }
      }
      else if(r>0.3*Sr){
        break ;
      }
      context.lineTo(X_from_x(xy[0]),Y_from_y(xy[1])) ;
    }
    
    if(doLogo) this.lineWidth *= 2 ;
    // Set line styles here.  Draw the first line.
    context.lineWidth = 2*this.lineWidth ;
    context.strokeStyle = 'rgb(255,255,255)' ;
    context.stroke() ;
    
    // Now draw the second line, following the same path.
    context.lineWidth = this.lineWidth ;
    context.strokeStyle = this.color ;
    context.shadowBlur = 5 ;
    context.shadowColor = this.color ;
    context.stroke() ;
    
    context.restore() ;
  }
}
