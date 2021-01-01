var responseNumber = 0 ;
var ajax = null ;

function start(){
  Get('button_addResponse' ).addEventListener('click', add_response_row) ;
  Get('button_sendQuestion').addEventListener('click', send_question   ) ;
  
  ajax = GetXmlHttpObject() ;
  
  add_response_row() ;
  add_response_row() ;
}

function add_response_row(){
  var tbody = Get('tbody_responses') ;
  
  var tr = Create('tr') ;
  var th = Create('th') ;
  
  var td_1 = Create('td') ;
  var input_text = Create('input') ;
  input_text.id = 'input_response_' + responseNumber + '_text' ;
  input_text.className = 'text_long' ;
  input_text.value = '' ;
  td_1.appendChild(input_text) ;
  
  var td_2 = Create('td') ;
  var input_value = Create('input') ;
  input_value.id = 'input_response_' + responseNumber + '_index' ;
  input_value.className = 'text_short' ;
  input_value.value = responseNumber ;
  td_2.appendChild(input_value) ;
  
  tr.appendChild(th) ;
  tr.appendChild(td_1) ;
  tr.appendChild(td_2) ;
  
  var tr_2 = Get('tr_addResponse') ;
  tbody.insertBefore(tr, tr_2) ;
  responseNumber++ ;
}

function response_object(index, text){
  this.index = index ;
  this.text  = text ;
  this.json = function(){
    return '{"index":"' + this.index + '", "text":"' + this.text + '"}' ;
  }
}
function question_object(name, text){
  this.name = name ;
  this.text = text ;
  this.symbols = 'none' ;
  this.order = 'asc' ;
  this.responses = [] ;
  this.json = function(){
    var json = '{' ;
    
    json += '"name":"'    + this.name    + '", ' ;
    json += '"text":"'    + this.text    + '", ' ;
    json += '"symbols":"' + this.symbols + '", ' ;
    json += '"order":"'   + this.order   + '", ' ;
    json += '"responses":[' ;
    for(var i=0 ; i<this.responses.length ; i++){
      if(i!=0) json += ',' ;
      json += this.responses[i].json() ;
    }
    json += ']}' ;
    return json ;
  }
}

function send_question(){
  var q = new question_object(Get('input_question_name').value, Get('input_question_text').value) ;
  q.symbols = Get('select_symbols').value ;
  q.order   = Get('select_order'  ).value ;
  for(var i=0 ; i<responseNumber ; i++){
    var text  = Get('input_response_' + i + '_text' ).value ;
    var index = Get('input_response_' + i + '_index').value ;
    q.responses.push(new response_object(index,text)) ;
  }
  var json = q.json() ;
  var uri = 'admin.php?json='+json+'&sid=' + Math.random() ;
  ajax.onreadystatechange = send_question_response ;
  ajax.open('GET', uri, true) ;
  alert(uri) ;
  ajax.send(null) ;
}

function send_question_response(){
  if(ajax.readyState!=4) return ;
  if(ajax.responseText.indexOf('ERR')==0){
    alert(ajax.responseText) ;
  }
  else{
    alert('Question added!') ;
  }
}

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



function Get(id){ return document.getElementById(id) ; }
function Create(type){ return document.createElement(type) ; }