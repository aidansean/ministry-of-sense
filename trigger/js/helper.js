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
    //if(isNaN(seed)) seed = floor(1e9*random()) ;
    this.seed = floor(seed) ;
  }
  this.random = function(){
    this.seed = this.seed*this.a%this.b ;
    return this.seed/this.b ;
  }
}

function min(a,b){ return Math.min(a,b) ; }
function max(a,b){ return Math.max(a,b) ; }
function   abs(x){ return Math. abs(x)  ; }
function   abs(x){ return Math. abs(x)  ; }
function  sqrt(x){ return Math.sqrt(x)  ; }
function  acos(x){ return Math.acos(x)  ; }
function   cos(x){ return Math. cos(x)  ; }
function   sin(x){ return Math. sin(x)  ; }
function   log(x){ return Math. log(x)  ; }
function   exp(x){ return Math. exp(x)  ; }
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

function ajax_object(){
  this.xmlhttp = GetXmlHttpObject() ;
  this.send = function(message){
    if(message.indexOf('sid=')==-1) message = message + '&sid=' + random() ;
    this.xmlhttp.open('GET', message, true) ;
    this.xmlhttp.send(null) ;
  }
}

function getParameterByName(name){
  // Taken from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search) ;
  return match && decodeURIComponent(match[1].replace(/\+/g, ' ')) ;
}


// Converting real coordinates to canvas coordinates.
function X_from_x(x){ return SR + SR*x/xMax ; }
function Y_from_y(y){ return SR + SR*y/yMax ; }

