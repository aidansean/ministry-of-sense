// A series of trivial functions to save some typing.  The most common mathematcal
// functions are aliased here to save typing.

function random_color(lower, rnd){
  var r = Math.floor(lower + rnd.random()*(255-lower)) ;
  var g = Math.floor(lower + rnd.random()*(255-lower)) ;
  var b = Math.floor(lower + rnd.random()*(255-lower)) ;
  var color = 'rgb('+r+','+g+','+b+')' ;
  return color ;
}

function psuedorandom_number_generator(){
  this.seed = 1 ;
  this.a = 1255214 ;
  this.b = 247256 ;
  this.set_seed = function(seed){
    this.seed = floor(seed) ;
  }
  this.random = function(){
    this.seed = this.seed*this.a%this.b ;
    return this.seed/this.b ;
  }
}

function getParameterByName(name){
  // Taken from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search) ;
  return match && decodeURIComponent(match[1].replace(/\+/g, ' ')) ;
}

function min(a,b){ return Math.min(a,b) ; }
function max(a,b){ return Math.max(a,b) ; }
function   abs(x){ return Math. abs(x) ; }
function   abs(x){ return Math. abs(x) ; }
function  sqrt(x){ return Math.sqrt(x) ; }
function  acos(x){ return Math.acos(x) ; }
function   cos(x){ return Math. cos(x) ; }
function   sin(x){ return Math. sin(x) ; }
function   log(x){ return Math. log(x) ; }
function floor(x){ return Math.floor(x) ; }
function atan2(y,x){ return Math.atan2(y,x) ; }
function pow(x,n){ return Math.pow(x,n) ; }
function random(){ return Math.random() ; }

// Non standard function that Aidan really needs to check.
function random_gaussian(sigma){ return sqrt(-2*sigma*log(random())) ; }

// Get and Create HTML elements.  These can be removed if they cause confusion.  This is
// merely my own preference.
function Get(id){ return document.getElementById(id) ; }
function Create(type){ return document.createElement(type) ; }

// The normal AJAX stuff.  We can replace this with jQuery if we like.
function GetXmlHttpObject(){
  if(window.XMLHttpRequest){
    // code for IE7+, Firefox, Chrome, Opera, Safari
    return new XMLHttpRequest() ;
  }
  if(window.ActiveXObject){
    // code for IE6, IE5
    return new ActiveXObject("Microsoft.XMLHTTP") ;
  }
  return null ;
}

function wrapText(context,text,x,y_in,maxWidth,lineHeight,draw){
  // Taken from www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
  if(text==undefined) return 0 ;
  var words = text.split(' ') ;
  var line = '' ;
  var w = 0 ;
  var h = 0 ;
  var y = 0 ;

  for(var n=0 ; n<words.length ; n++){
    var testLine = line + words[n] + ' ' ;
    var testWidth = context.measureText(testLine).width ;
    if(testWidth>maxWidth){
      y = y_in+h ;
      if(draw) context.fillText(line, x, y) ;
      line = words[n] + ' ' ;
      h += lineHeight ;
    }
    else{
      line = testLine ;
      if(testWidth>w) w = testWidth ;
    }
  }
  y = y_in+h ;
  if(draw) context.fillText(line, x, y) ;
  h += lineHeight ;
  if(draw==-1) return w ;
  return h ;
}

function rounded_box_path(x1, y1, x2, y2, r, context){
  context.beginPath() ;
  context.moveTo(x1+r,y1) ;
  context.lineTo(x2-r,y1) ;
  context.arcTo (x2,y1,x2,y1+r,r) ;
  context.lineTo(x2,y2-r) ;
  context.arcTo (x2,y2,x2-r,y2,r)
  context.lineTo(x1+r,y2) ;
  context.arcTo (x1,y2,x1,y2-r,r)
  context.lineTo(x1,y1+r) ;
  context.arcTo (x1,y1,x1+r,y1,r)
}
