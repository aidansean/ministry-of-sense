function textbox_object(x, y, width, text){
  this.x = x ;
  this.y = y ;
  this.w = width ;
  this.text = text ;
  this.font_size = 0.025*ch ;
  this.draw = function(context){
    context.save() ;
    context.font = this.font_size + 'px arial , sans-serif' ;
    wrapText(context, this.text,this.x,this.y,this.w,1.5*this.font_size,true) ;
    context.restore() ;
  }
}

function wrapText(context, text,x,y_in,maxWidth,lineHeight,draw){
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

function slide_object(){
  this.text_boxes = [] ;
  this.title = '' ;
  this.add_text_box = function(x, y, width, text){
    this.text_boxes.push(new textbox_object(x, y, width, text)) ;
  }
  this.draw = function(){
    var context = canvas.getContext('2d') ;
    var w = canvas.width  ;
    var h = canvas.height ;
    context.save() ;
    context.fillStyle = '#ffffff' ;
    context.fillRect(0, 0, w, h) ;
    
    context.font = 0.05*ch + 'px arial' ;
    context.fillStyle = '#000000' ;
    context.textAlign = 'center' ;
    context.textBaseline = 'middle' ;
    context.fillText(this.title, 0.5*cw, 0.1*ch) ;
    
    for(var i=0 ; i<this.text_boxes.length ; i++){
      this.text_boxes[i].draw(context) ;
    }
  }
}

var slides = [] ;

var slide_tmp = new slide_object() ;

slide_tmp.title = 'Welcome to the trigger game' ;
slide_tmp.add_text_box(0.5*cw, 0.2*ch, 0.6*cw, 'Welcome to the trigger game!  In this game you\'re going collect data that will enable you to discover the Higgs boson.') ;

slide_tmp.add_text_box(0.5*cw, 0.4*ch, 0.6*cw, 'At the LHC we receive up to 40 million collisions per second.  This is far too much data for us to save every single collision, so we filter interesting events using the trigger system.') ;

slides.push(slide_tmp) ;



