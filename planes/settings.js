// Multiply the pixels by this amount so that the images are not grainy.  A factor of 2
// is good for laptop/desktop devices, but four may be necessary for tablets/phones.
var drawRatio = 2 ;

// Physical constants.
var SoL = 3e8     ; // Speed of light.
var CoE = 1.6e-19 ; // Charge of electron.
var pi = Math.PI ;

var shifts_per_game      = -2 ;
var collisions_per_shift = 10 ;

// Control over the speed of the game.
var collision_delay_min =  800 ;
var collision_delay_max = 1000 ;
var collision_delay = collision_delay_max ;
var collision_breath = 250 ;

var nCharsPerName = 32 ;

// Colours.
var text_color = 'black' ;
var eventDisplay_fillColor = '#000000' ;
var collision_matched_color    = 'rgba(0,255,0,0.8)' ; 
var collision_notMatched_color = 'rgba(255,0,0,0.8)' ;

// probabilities for each kind of collision.
var probability_Higgs = 0.1 ;

// Used for the histograms
var mass_min = 100 ;
var mass_max = 150 ;
var histogram_nBins = 25 ;
var histogram_drawStyle = 'rect' ;
histogram_drawStyle = 'pe' ;
var histogram_xAxisLAbelFrequency = 5 ;
var time_animate_histogram = 5000 ;

// Used for the heartbeat (eg for drawing animations).
var delay = 50 ;
var delay_animate_histogram = 50 ;
var delay_enable_click = 500 ;
var delay_drawStep = 50 ;

// Dimensions of the detector and canvas
// "S" refers to the detector.
// Sr is the maximal width of the detector in real life (eg cavern walls).
// SR is the maximal width of the detector on the canvas.
// cw and ch and canvas width and height.
var Sr =  10 ;
var SR = 375*drawRatio ;
var cw = 2*SR ;
var ch = 2*SR ;

// Number of slices in R and phi for the cells.
var NR   =  50 ;
var NPhi = 250 ;

var cellSizeR   =   Sr/NR   ;
var cellSizePhi = 2*pi/NPhi ;

// Functions used to map real coordinates to canvas coordinates.
var xMax = Sr ;
var yMax = Sr ;

// Settings for the jets:
// How much spread the jet is allowed to have per track

var B1_0 = 0.10 ;
var B2_0 = 0.08 ;

// Colours for the particles:
var track_color = 'rgb(200,200,200)' ;

function team_object(title, color, box_x, box_y, box_w, box_h){
  this.title = title  ;
  this.color = color ;
  this.nSigma = 0 ;
  
  this.apply_style = function(){
    // Just change some colours to make everything "branded".
    // This should probably be changed to something cooler later on.
    // Also the border widths should be stored in settings.js.
    document.body.style.background = this.color ;
    Get('div_gameWrapper').style.border = '9px solid ' + this.color ;
    Get('div_teamname'   ).style.backgroundColor = this.color ;
    Get('div_header'     ).style.border = '1px solid ' + this.color ;
    Get('div_footer'     ).color = this.color ;
    if(canvas){
      canvas.style.borderTop    = '9px solid ' + this.color ;
      canvas.style.borderBottom = '9px solid ' + this.color ;
    }
  }
  this.box = new experiment_box(box_x, box_y, box_w, box_h) ;
  this.draw_experiment_box = function(context, image_name){
    this.box.draw(context, this.title, this.color, image_name) ;
  }
}

function experiment_box(x, y, w, h){
  this.x = x ;
  this.y = y ;
  this.w = w ;
  this.h = h ;
  
  this.draw = function(context, name, color, image_name){
    // This just write some text and an image.  At the moment it draws things to the
    // canvas, but let's not completely discount the idea of using the HTML DOM- it could
    // be cheaper.
    context.save() ;
    context.lineWidth = 0.005*cw ;
    context.font = 0.07*ch+'px arial' ;
    context.fillStyle = color ;
    context.fillRect(x, y, w, h) ;
    context.strokeRect(x, y, w, h) ;
    
    // Hard coded values!  These should be changed.
    context.fillStyle = 'white'
    context.fillText('Team', x+0.5*w, y+0.075*ch) ;
    context.fillText(name  , x+0.5*w, y+0.15*ch) ;
    var img = Get(image_name) ;
    context.drawImage(img,  x+0.01*cw, y+h-0.23*ch, drawRatio*img.width, drawRatio*img.height) ;
    
    context.restore() ;
  }
  this.contains = function(x, y){
    x *= drawRatio ;
    y *= drawRatio ;
    return (x>=this.x && x<=this.x+this.w && y>=this.y && y<=this.y+this.h) ;
  }
}

var teams = [] ;
teams['neutral'] = new team_object('CERN' , 'rgb(  0,  0,  0)',      -1,     -1,       0,      0) ;
teams['ATLAS'  ] = new team_object('ATLAS', 'rgb(236,103, 29)', 0.05*cw, 0.5*ch, 0.35*cw, 0.4*ch) ;
teams['CMS'    ] = new team_object('CMS'  , 'rgb( 17,133,193)', 0.60*cw, 0.5*ch, 0.35*cw, 0.4*ch) ;


