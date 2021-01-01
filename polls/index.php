<?php

// Turn on error reporting.
ini_set('display_startup_errors',1) ;
ini_set('display_errors',1) ;
error_reporting(-1) ;

include_once('mysql.php') ;

$mysqli = mysqli_connect($mysql_host, $mysql_username, $mysql_password, $mysql_database) ;

$success = false ;
$q_text = '???' ;
$q_symbols = 'none' ;

$q_text = '' ;
$responses = array() ;
if(isset($_GET['q'])){
  $q_name = $mysqli->real_escape_string($_GET['q']) ;
  $query = 'SELECT * FROM questions WHERE name="' . $q_name . '" LIMIT 1' ;
  $result = $mysqli->query($query) ;
  while($row=$result->fetch_assoc()){
    $success = true ;
    $q_text    = $row['text'     ] ;
    $q_dir     = $row['direction'] ;
    $q_symbols = $row['symbols'  ] ;
    $query_responses = 'SELECT * FROM responses WHERE question="' . $q_name . '" ORDER BY index_ ' . $q_dir ;
    $result_responses = $mysqli->query($query_responses) ;
    while($row_responses=$result_responses->fetch_assoc()){
      $responses[] = array("index"=>$row_responses['index_'],"text"=>$row_responses['text']) ;
    }
  }
}

?>
<html>
<head>
<title>Poller</title>
<link rel="stylesheet" type="text/css" href="style_index.css" media="screen" />
<script type="text/ecmascript">
var ajax = null ;
var responses = [] ;
<?php
echo 'var question_name    = "' , $q_name    , '" ;' , PHP_EOL ;
echo 'var question_text    = "' , $q_text    , '" ;' , PHP_EOL ;
echo 'var question_symbols = "' , $q_symbols , '" ;' , PHP_EOL ;
if($success){
  for($i=0 ; $i<count($responses) ; $i++){
    echo 'responses.push([' , $responses[$i]['index'] , ',"' , $responses[$i]['text'] , '"]) ;' , PHP_EOL ;
  }
}
?>
var voted = false ;

function start(){
  ajax = GetXmlHttpObject() ;
  Get('p_question').innerHTML = question_text ;

  var tbody = Get('tbody_responses') ;
  for(var i=0 ; i<responses.length ; i++){
    var tr = Create('tr') ;
    var td = Create('td') ;
    td.className = 'response' ;
    var button = Create('button') ;
    button.addEventListener('click', vote_proxy) ;
    button.id = 'button_'+responses[i][0] ;
    button.className = 'response' ;
    
    var span1 = Create('span') ;
    span1.innerHTML = responses[i][1] ;
    button.appendChild(span1) ;
    
    span1.className = 'response_text' ;
    if(responses[i][0]==0 && question_symbols=='stars') span1.className = '' ;
    
    if(question_symbols=='stars'){
      var span2 = Create('span') ;
      span2.className = 'response_stars' ;
      var string = '' ;
      for(var j=0 ; j<responses[i][0] ; j++){
        string += '&#9733;' ;
        //string += '&star;' ;
      }
      span2.innerHTML = string ;
      button.appendChild(span2) ;
    }
    else if(question_symbols=='check'){
      var span2 = Create('span') ;
      span2.className = (responses[i][0]==0) ? 'response_checkmark_no' : 'response_checkmark_yes' ;
      span2.innerHTML = (responses[i][0]==0) ? '&#x2717;' : '&#x2713;' ;
      button.appendChild(span2) ;
    }
    
    td.appendChild(button) ;
    tr.appendChild(td) ;
    tbody.appendChild(tr) ;
  }
}
function vote_proxy(evt){
  var id = evt.target.id ;
  var index = parseInt(id.split('_')[1]) ;
  vote(index, evt) ;
}
function vote(index, evt){
  if(voted){
    evt.preventDefault() ;
    return ;
  }
  voted = true ;
  Get('p_question').innerHTML = 'Thank you for voting!' ;
  for(var i=0 ; i<responses.length ; i++){
    var extraClassName = (parseInt(responses[i][0])==parseInt(index)) ? 'chosen' : 'inactive' ;
    Get('button_'+responses[i][0]).className += ' ' + extraClassName ;
  }
  
  var uri = 'vote.php?q='+question_name+'&index='+index+'&sid=' + Math.random() ;
  ajax.open('GET', uri, true) ;
  ajax.send(null) ;
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

</script>
</head>
<body onload="start()">

<p id="p_question"></p>
<table>
  <tbody id="tbody_responses"></body>
</table>
</html>




