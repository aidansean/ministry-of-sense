// This is a class for handling a histogram of masses (or any variable of interest) and
// then animating it to show the results.  Its psychologically important to see it animate
// before the player's/audiences eyes!

function four_lepton_mass_histogram(canvas){
  // Keep the object available in this scope.
  var self = this ;
  self.nBins = histogram_nBins ;
  self.bins = [] ;
  self.binsInOrder_array = [] ;
  self.nHiggs = 0 ;
  for(var i=0 ; i<self.nBins ; i++){
    self.bins.push(0) ;
    self.binsInOrder_array.push(0) ;
  }
  self.drawStyle = histogram_drawStyle ;
  self.mass_min = mass_min ;
  self.mass_max = mass_max ;
  
  self.canvas = canvas ;
  self.context = self.canvas.getContext('2d') ;
  
  // Used for the animation.
  self.binsInOrder = [] ;
  self.binsInOrder_index = 0 ;
  
  // The colour of the histogram should match the experiment.
  self.color = teams['neutral'].color ;
  
  self.margin = 0.15 ;
  
  self.ghost_mass = 115 ;
  
  self.fit_animation_step = 0 ;
  self.nSigma = 0 ;
  self.average_bin_content = 0 ;
  self.max_index =-1 ;
  
  self.add_mass = function(mass){
    // This adds a mass to the histograms.  The lookup function is quite cheap.
    if(mass<self.mass_min) return ;
    if(mass>self.mass_max) return ;
    var index = Math.floor((self.nBins+0)*(mass-self.mass_min)/(self.mass_max-self.mass_min)) ;
    self.bins[index]++ ;
    self.binsInOrder.push(index) ;
  }
  self.add_Higgs = function(){
    self.nHiggs++ ;
  }
  self.max_height = function(){
    // Find the heigh of the highest bin so we can dynamically change the y-axis etc.
    var result = 0 ;
    for(var i=0 ; i<self.bins.length ; i++){
      if(self.bins[i]>result) result = 1*self.bins[i] ;
    }
    return result ;
  }
  self.nEvents = function(){
    // Sum up all the events stored.  It might be cheaper to increment a counter as we
    // fill the histogram.
    var total = 0 ;
    for(var i=0 ; i<self.bins.length ; i++){
      total += self.bins[i] ;
    }
    return total ;
  }
  self.draw = function(theBins){
    // Save a few characters.
    var c = self.context ;
    
    c.save() ;
  
    // Okay, now things get messy.
    
    // Margin around the histogram, in relative units (ie 15%.)
    var m = self.margin ;
    var w = canvas.width  ;
    var h = canvas.height ;
    
    // Plot width and height.
    var pw = w*(1-2*m) ;
    var ph = h*(1-2*m) ;
    
    // Maximum height, which must take the error bars into account.
    var mh = self.max_height()+2*sqrt(self.max_height()) ;
    
    // Clear the plotting area.
    c.fillStyle = 'rgb(255,255,255)' ;
    c.fillRect(0,0,w,h) ;
    
    // Set colours etc.
    c.fillStyle = self.color ;
    c.strokeStyle = self.color ;
    c.textAlign = 'center' ;
    c.font = '20px arial' ;
    
    // Draw a nice border around the plot area.
    c.strokeRect(w*m,h*m,pw,ph) ;
    
    // Draw the axis titles.  A bit messy, but works.
    var x_xAxisTitle = w*0.6 ;
    var y_xAxisTitle = h - 0.1*m*h ;
    c.fillText('mass (four leptons) [GeV]', x_xAxisTitle, y_xAxisTitle) ;
    
    var x_yAxisTitle = w*m*0.8 ;
    var y_yAxisTitle = h*0.1 ;
    c.fillText('collisions', x_yAxisTitle, y_yAxisTitle) ;
    
    // Now draw the bins one by one, including tick marks.  Tick marks are a pain.
    var bin_width = pw/(theBins.length) ;
    for(var i=0 ; i<=theBins.length ; i++){
      // First get the value of the mass for the labels.
      var mass = Math.floor(self.mass_min + i*(self.mass_max-self.mass_min)/(theBins.length)) ;
      
      // Dimensions hardcoded?  What was I thinking?
      var x = w*m + (i+0.0)*bin_width ;
      var y = h - 0.5*m*h ;
      var tickLength = 0.1*m*h ;
      if(i%histogram_xAxisLAbelFrequency==0){
        // Now add a tick with a label.
        c.fillText(mass, x, y) ;
        tickLength *=2 ;
      }
      
      // Draw the tick mark.
      c.beginPath() ;
      c.moveTo(x, h-1*m*h-tickLength) ;
      c.lineTo(x, h-1*m*h+tickLength) ;
      c.stroke() ;
      c.closePath() ;
      
      // Check for an empty bin.  (Things can get tricky if you try to draw error bars on
      // a zero bin.)
      if(theBins[i]==0) continue ;
      
      // Draw the bin, depending on the style.
      if(self.drawStyle=='rect'){
        // Barchart.
        var x1 = w*m + i*bin_width ;
        var y1 = h - h*m ;
        c.fillRect(x1, y1, bin_width, -ph*theBins[i]/(1+mh)) ;
      }
      else{
        // Data points with error bars.
        var x2 = w*m + (i+0.5)*bin_width ;
        var y2 = h -h*m - ph*theBins[i]/(1+mh) ;
        c.beginPath() ;
        c.arc(x2,y2,5,0,2*pi,true) ;
        c.closePath() ;
        c.fill() ;
        var err = 0.5*ph*sqrt(theBins[i])/(1+mh) ;
        c.beginPath();
        c.moveTo(x2,y2-err) ;
        c.lineTo(x2,y2+err) ;
        c.stroke() ;
        c.closePath() ;
      }
    }
    
    // Now the y-axis.  The tick intervals should be handled more gracefully than self.
    self.context.beginPath() ;
    var di = 1 ;
    if(mh>=10  ) di =   2 ;
    if(mh>=20  ) di =  10 ;
    if(mh>=100 ) di =  10 ;
    if(mh>=200 ) di =  25 ;
    if(mh>=1000) di = 100 ;
    if(mh>=2000) di = 250 ;
    for(var i=0 ; i<=mh ; i+=di){
      var x = m*w ;
      var y = h-h*m-ph*i/(1+mh) ;
      c.moveTo(x-5,y) ;
      c.lineTo(x+5,y) ;
      c.fillText(i,0.5*m*w,y) ;
    }
    c.stroke() ;
    
    c.restore() ;
  }
  self.animate_accumulate = function(){
    // Yuck, this needs to be tidied up.
    // Basically add events one by one.
    
    // Save a few characters.
    var c = self.context ;
    if(self.binsInOrder_index>=self.binsInOrder.length){
      // If we're on the final event, update the sigmas.  This should be done elsewhere.
      // But I was under a lot of time pressure.
      var w = self.canvas.width  ;
      var h = self.canvas.height ;
      c.font = 0.1*w + 'px arial' ;
      c.fillStyle = self.color ;
      
      if(self.binsInOrder_index==self.binsInOrder.length && self.nSigma<1){
        self.nSigma = 3.6 + random()*0.6 ;
      }
      
      if(results_mode=='sigma'){
        //c.fillText(self.nSigma.toPrecision(2)+' \u03C3!', 0.7*w, 0.12*h) ;
      }
      else{
        var percent = 100*Math.exp(-self.nSigma*self.nSigma) ;
        //c.fillText(percent.toPrecision(2)+'%!', 0.4*w, 0.12*h) ;
      }
      if(experiments['ATLAS'].nSigma<1){
        Get('button_analyse_CMS_show').style.display = '' ;
        experiments['ATLAS'].nSigma = self.nSigma ;
      }
      else if(experiments['CMS'  ].nSigma<1){
        Get('button_continue_postShow').style.display = '' ;
        
        //Get('button_combine').style.display = '' ;
        experiments['CMS'  ].nSigma = self.nSigma ;
      }
      window.setTimeout(spy.animate_fit, delay_animate_histogram) ;
      
      return ;
    }
    // Update the binsInOrder and redraw the histogram.
    self.binsInOrder_array[self.binsInOrder[self.binsInOrder_index]]++ ;
    self.draw(self.binsInOrder_array) ;
    self.binsInOrder_index++ ;
    
    // Send the signal for the next draw call.
    window.setTimeout(spy.animate_histogram, delay_animate_histogram) ;
    //self.draw_pistons(self.binsInOrder_index) ;
    self.draw_gears(self.binsInOrder_index) ;
  }
  
  self.animate_fit_ghost = function(){
    // Pretend to perform a fit.
    
    // Save a few characters.
    var s = self.fit_animation_step ;
    var c = self.context ;
    var s0 =   0 ;
    var s1 = 100 ;
    
    if(s>s1) return ;
    
    var id = 'canvas_histogram_' + self.name + '_hidden' ;
    var canvas_tmp  = Get(id) ;
    var context_tmp = canvas_tmp.getContext('2d') ;
    
    // A handful of useful variables.
    var w = self.canvas.width  ;
    var h = self.canvas.height ;
    var m = self.margin ;
    var pw = w*(1-2*m) ;
    var ph = h*(1-2*m) ;
    var mh = self.max_height()+2*sqrt(self.max_height()) ;
    
    var envelope = exp(-(s%100)*0.05)*sin(2*pi*s/50.0) ;
    
    var bkg = 0 ;
    c.drawImage(canvas_tmp, 0 ,0) ;
    
    if(s==s0){
      context_tmp.drawImage(self.canvas, 0 ,0) ;
      
      // Find the average bin height for the background.
      var total = 0 ;
      var n = 0 ;
      var max_height = 0 ;
      var ghost_height = 0 ;
      for(var i=0 ; i<self.bins.length ; ++i){
        if(self.bins[i]>max_height){
          max_height = self.bins[i] ;
          self.max_index = i ;
        }
        
        // Exclude the peak region (cheating, I know).
        if(self.name=='ATLAS' && i>=10) continue ;
        if(self.name=='CMS'   && i<=15) continue ;
        if(self.bins[i]>ghost_height){
          ghost_height = self.bins[i] ;
          self.ghost_mass = i ;
        }
        total += self.bins[i] ;
        n++ ;
      }
      self.average_bin_content = total/n ;
    }
    
    if(s>=s0 && s<=s1){
      var x1 = w*m ;
      var x2 = w*(1-m) ;
      bkg = 0*self.average_bin_content ;
      var y0 = h - h*m - ph*bkg/(1+mh) ;
      
      var m0 = self.mass_min + (self.mass_max-self.mass_min)*(self.ghost_mass+0.5)/self.bins.length ;
      var x0 = m*w + pw*(m0-self.mass_min)/(self.mass_max-self.mass_min) + pw*0.25*envelope ;
      c.beginPath() ;
      for(var i=0 ; i<1000 ; ++i){
        var x = m*w + pw*i/1000.0 ;
        var gauss = exp(-(x-x0)*(x-x0)/250.0)*(0.75*self.max_height()) ;
        var y = h - h*m - ph*(0.5*gauss+bkg)/(1.0+mh) ;
        if(i%10==0){
          c.moveTo(x,y) ;
        }
        else if(i%10<5){
          c.lineTo(x,y) ;
        }
      }
      c.closePath() ;
      c.stroke() ;
    }
    if(s==s1){
      var m0 = self.mass_min + (self.mass_max-self.mass_min)*(self.ghost_mass+0.5)/self.bins.length ;
      var x0 = m*w + pw*(1+envelope)*(m0-self.mass_min)/(self.mass_max-self.mass_min) ;
      var gauss = (0.75*self.max_height()-bkg) ;
      var y = h - 1.5*h*m - ph*(0.5*gauss+bkg)/(1.0+mh) ;
      
      self.draw_marks(c, x0, y) ;
      
    }
    self.draw_gears(s) ;
    
    self.fit_animation_step++ ;
    
    // Send the signal for the next draw call.
    if(s>=s0 && s<s1){
      window.setTimeout(self.animate_fit_ghost, delay_animate_histogram) ;
    }
    else{
      Get('button_analyse_both_ghost').style.display = 'none' ;
      Get('button_continue_postGhost').style.display = '' ;
    }
  }
  
  self.animate_fit_measureBackground = function(){
    // Pretend to perform a fit.
    
    // Save a few characters.
    var s = self.fit_animation_step ;
    var c = self.context ;
    var s0 = 100 ;
    var s1 = 200 ;
    
    if(s>s1) return ;
    
    var id = 'canvas_histogram_' + self.name + '_hidden' ;
    var canvas_tmp  = Get(id) ;
    var context_tmp = canvas_tmp.getContext('2d') ;
    
    if(s==s0){
      context_tmp.drawImage(self.canvas, 0 ,0) ;
    }
    else{
      // A handful of useful variables.
      var w = self.canvas.width  ;
      var h = self.canvas.height ;
      var m = self.margin ;
      var pw = w*(1-2*m) ;
      var ph = h*(1-2*m) ;
      var mh = self.max_height()+2*sqrt(self.max_height()) ;
      
      var envelope = exp(-(s%100)*0.05)*sin(2*pi*s/50.0) ;
      
      c.drawImage(canvas_tmp, 0 ,0) ;
      if(s<=s1){
        c.lineWidth = 1 ;
        var x1 = w*m ;
        var x2 = w*(1-m) ;
        
        // Find the final resting point of the line.
        var y0 = h - h*m - ph*self.average_bin_content/(1+mh) ;
        
        // But "wobble" a bit on the way there to make it look like we're thinking.
        var y  = y0 + h*m*envelope ;
        
        // Draw the line.
        c.beginPath() ;
        c.moveTo(x1, y) ;
        c.lineTo(x2, y) ;
        c.closePath() ;
        c.stroke() ;
      }
    }
    self.draw_gears(s) ;
    
    self.fit_animation_step++ ;
    
    // Send the signal for the next draw call.
    if(s<s1){
      window.setTimeout(self.animate_fit_measureBackground, delay_animate_histogram) ;
    }
    else{
      Get('button_analyse_both_bkg').style.display = 'none' ;
      Get('button_continue_postBkg').style.display = '' ;
    }
  }
  
  self.animate_fit_peak = function(){
    // Pretend to perform a fit.
    
    // Save a few characters.
    var s = self.fit_animation_step ;
    var c = self.context ;
    
    if(s>300) return ;
    
    var id = 'canvas_histogram_' + self.name + '_hidden' ;
    var canvas_tmp  = Get(id) ;
    var context_tmp = canvas_tmp.getContext('2d') ;
    
    // A handful of useful variables.
    var w = self.canvas.width  ;
    var h = self.canvas.height ;
    var m = self.margin ;
    var pw = w*(1-2*m) ;
    var ph = h*(1-2*m) ;
    var mh = self.max_height()+2*sqrt(self.max_height()) ;
    
    var envelope = exp(-(s%100)*0.05)*sin(2*pi*s/50.0) ;
    
    c.drawImage(canvas_tmp, 0 ,0) ;
    if(s>=200 && s<=300){
      var x1 = w*m ;
      var x2 = w*(1-m) ;
      var bkg = self.average_bin_content ;
      var y0 = h - h*m - ph*bkg/(1+mh) ;
      
      // Just draw the freaking line this time.
      c.beginPath() ;
      c.moveTo(x1, y0) ;
      c.lineTo(x2, y0) ;
      c.closePath() ;
      c.stroke() ;
      
      var m0 = self.mass_min + (self.mass_max-self.mass_min)*(self.max_index+0.5)/self.bins.length ;
      var x0 = m*w + pw*(1+envelope)*(m0-self.mass_min)/(self.mass_max-self.mass_min) ;
      c.beginPath() ;
      for(var i=0 ; i<1000 ; ++i){
        var x = m*w + pw*i/1000.0 ;
        var gauss = exp(-(x-x0)*(x-x0)/250.0)*(0.75*self.max_height()-bkg) ;
        var y = h - h*m - ph*(gauss+bkg)/(1.0+mh) ;
        if(i==0){
          c.moveTo(x,y) ;
        }
        else{
          c.lineTo(x,y) ;
        }
      }
      c.closePath() ;
      c.stroke() ;
    }
    self.draw_gears(s) ;
    
    self.fit_animation_step++ ;
    
    // Send the signal for the next draw call.
    if(s>=200 && s<300){
      window.setTimeout(self.animate_fit_peak, delay_animate_histogram) ;
    }
    else{
      Get('button_analyse_both_peak').style.display = 'none' ;
      Get('button_continue_postPeak').style.display = '' ;
    }
  }
  
  self.animate_fit_signal = function(){
    // Pretend to perform a fit.
    
    // Save a few characters.
    var s = self.fit_animation_step ;
    var c = self.context ;
    
    var id = 'canvas_histogram_' + self.name + '_hidden' ;
    var canvas_tmp  = Get(id) ;
    var context_tmp = canvas_tmp.getContext('2d') ;
    
    // A handful of useful variables.
    var w = self.canvas.width  ;
    var h = self.canvas.height ;
    var m = self.margin ;
    var pw = w*(1-2*m) ;
    var ph = h*(1-2*m) ;
    var mh = self.max_height()+2*sqrt(self.max_height()) ;
    
    var envelope = exp(-(s%100)*0.05)*sin(2*pi*s/50.0) ;
    
    c.drawImage(canvas_tmp, 0 ,0) ;
    if(s>=300 && s<=400){
      var x1 = w*m ;
      var x2 = w*(1-m) ;
      var bkg = self.average_bin_content ;
      var y0 = h - h*m - ph*bkg/(1+mh) ;
      
      // Just draw the freaking line this time.
      c.beginPath() ;
      c.moveTo(x1, y0) ;
      c.lineTo(x2, y0) ;
      c.closePath() ;
      c.stroke() ;
      
      var m0 = self.mass_min + (self.mass_max-self.mass_min)*(self.max_index+0.5)/self.bins.length ;
      var x0 = m*w + pw*(m0-self.mass_min)/(self.mass_max-self.mass_min) ;
      c.beginPath() ;
      for(var i=0 ; i<1000 ; ++i){
        var x = m*w + pw*i/1000.0 ;
        var gauss = exp(-(x-x0)*(x-x0)/250.0)*(self.max_height()-bkg)*(1+envelope) ;
        var y = h - h*m - ph*(gauss+bkg)/(1.0+mh) ;
        if(i==0){
          c.moveTo(x,y) ;
        }
        else{
          c.lineTo(x,y) ;
        }
      }
      c.closePath() ;
      c.stroke() ;
    }
    self.draw_gears(s) ;
    
    self.fit_animation_step++ ;
    
    // Send the signal for the next draw call.
    if(s>=300 && s<400){
      window.setTimeout(self.animate_fit_signal, delay_animate_histogram) ;
    }
    else{
      if(results_mode=='sigma'){
        c.fillText(self.nSigma.toPrecision(2)+' \u03C3!', 0.7*w, 0.12*h) ;
      }
      else{
        var percent = 100*Math.exp(-self.nSigma*self.nSigma) ;
        c.fillText(percent.toPrecision(2)+'%!', 0.4*w, 0.12*h) ;
      }
    
      if(spy.current_team_name=='ATLAS'){
        Get('button_analyse_CMS_signal').style.display = '' ;
      }
      else{
        Get('button_continue_postSignal').style.display = '' ;
      }
    }
  }
  
  self.draw_gears = function(s){
    var c = self.context ;
    c.save() ;
    c.fillStyle   = self.color ;
    c.strokeStyle = self.color ;
    
    var gears = [] ;
    var w = self.canvas.width  ;
    var h = self.canvas.height ;
    gears.push(new gear_object(0.24*w,0.30*h,0.040*w,0.010*w,9,-1)) ;
    gears.push(new gear_object(0.31*w,0.26*h,0.024*w,0.005*w,8, 1)) ;
    
    for(var i=0 ; i<gears.length ; i++){
      var g = gears[i] ;
      
      c.fillStyle   = 'rgb(255,255,255)' ;
      c.beginPath() ;
      c.arc(g.cx,g.cy,1.5*g.r,0,2*pi,true) ;
      c.fill() ;
    }
    
    for(var i=0 ; i<gears.length ; i++){
      var g = gears[i] ;
      
      c.fillStyle   = self.color ;
      c.strokeStyle = self.color ;
      
      c.lineWidth = g.lw ;
      c.beginPath() ;
      c.arc(g.cx,g.cy,g.r,0,2*pi,true) ;
      c.stroke() ;
      
      c.lineWidth = 3 ;
      c.beginPath() ;
      c.arc(g.cx,g.cy,0.75*g.r,0,2*pi,true) ;
      c.stroke() ;
      
      c.save() ;
      c.translate(g.cx,g.cy) ;
      for(var j=0 ; j<g.n ; j++){
        c.save() ;
        c.rotate(2*pi*s*g.dir/(5*g.r) + 2*pi*j/g.n) ;
        c.translate(0,g.r+0.5*g.lw) ;
        c.beginPath() ;
        var gsx = 0.5*g.r*2*pi/(2*g.n) ;
        var gsy = 0.6*g.lw ;
        c.moveTo(  -gsx, gsy) ;
        c.lineTo(   gsx, gsy) ;
        c.lineTo( 2*gsx,-gsy) ;
        c.lineTo(-2*gsx,-gsy) ;
        c.lineTo(  -gsx, gsy) ;
        c.fill() ;
        c.restore() ;
      }
      c.restore() ;
    }
    c.restore() ;
  }
  
  self.draw_pistons = function(s){
    var c = self.context ;
    c.save() ;
    c.fillStyle   = self.color ;
    c.strokeStyle = self.color ;
    
    var pistons = [] ;
    var w = self.canvas.width  ;
    var h = self.canvas.height ;
    pistons.push(new piston_object(0.24*w,0.30*h,0.25*h,0.2*h,0.015*h,0)) ;
    pistons.push(new piston_object(0.30*w,0.30*h,0.25*h,0.2*h,0.015*h,0)) ;
    
    for(var i=0 ; i<pistons.length ; i++){
      var p = pistons[i] ;
      
      c.fillStyle   = 'rgb(255,255,255)' ;
      c.fillRect(p.x-p.r,p.y3,2*p.r,p.y1-p.y3) ;
    }
    
    for(var i=0 ; i<pistons.length ; i++){
      var p = pistons[i] ;
      
      c.fillStyle   = self.color ;
      c.strokeStyle = self.color ;
      
      c.beginPath() ;
      c.arc(p.x,p.y2,p.r,0,-pi,true) ;
      c.lineTo(p.x+p.r,p.y1) ;
      c.lineTo(p.x-p.r,p.y1) ;
      c.lineTo(p.x-p.r,p.y2) ;
      c.lineTo(p.x+p.r,p.y2) ;
      c.closePath() ;
      c.fill() ;
    }
    c.restore() ;
  }
  
  self.draw_marks = function(context, x0, y){
    var c = context ;
    c.save() ;
    c.fillStyle = 'rgb(100,100,100)' ;
    c.textAlign = 'center' ;
    
    var marks = [
      [ 0.10*ch,  0.00*cw,  0.000*ch] ,
      [ 0.05*ch,  0.03*cw,  0.010*ch] ,
      [ 0.07*ch, -0.04*cw,  0.020*ch] ,
      [ 0.04*ch, -0.04*cw, -0.050*ch] ,
      [ 0.03*ch, -0.02*cw,  0.040*ch] ,
      [ 0.03*ch,  0.01*cw,  0.035*ch]
    ] ;
    var nMarks = marks.length ;
    for(var i=0 ; i<nMarks ; i++){
      c.font = marks[i][0]+'px arial' ;
      c.fillText('?', x0+marks[i][1], y+marks[i][2]) ;
    }
    c.restore() ;
  }
}

// Gear object used to "think".
function gear_object(cx,cy,r,lw,n,dir){
  this.cx  =  cx ;
  this.cy  =  cy ;
  this.r   =   r ;
  this.lw  =  lw ;
  this.n   =   n ;
  this.dir = dir ;
}

// Piston object used to "think".
function piston_object(x,y1,y2,y3,r,phase){
  this.x     =     x ;
  this.y1    =    y1 ;
  this.y2    =    y2 ;
  this.y3    =    y3 ;
  this.r     =     r ;
  this.phase = phase ;
}

