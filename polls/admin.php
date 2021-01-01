<?php

// Turn on error reporting.
ini_set('display_startup_errors',1) ;
ini_set('display_errors',1) ;
error_reporting(-1) ;

include_once('mysql.php') ;

$mysqli = mysqli_connect($mysql_host, $mysql_username, $mysql_password, $mysql_database) ;

if(isset($_GET['json'])){
  $q = json_decode($_GET['json'], true) ;
  $q_name    = $mysqli->real_escape_string($q['name'   ]) ;
  $q_text    = $mysqli->real_escape_string($q['text'   ]) ;
  $q_symbols = $mysqli->real_escape_string($q['symbols']) ;
  $q_order   = $mysqli->real_escape_string($q['order'  ]) ;
  
  switch($q_symbols){
    case 'stars':
    case 'check':
    case 'none' :
      break ;
    default:
      $q_symbols = 'none' ;
  }
  
  switch($q_order){
    case 'asc':
    case 'desc':
      break ;
    default:
      $q_symbols = 'desc' ;
  }
  
  if($q_name==''){
    echo 'ERR:The question name is empty.' ;
    exit() ;
  }
  if($q_text==''){
    echo 'ERR:The question text is empty.' ;
    exit() ;
  }
  
  $query = 'SELECT name FROM questions WHERE name="' . $q_name . '" LIMIT 1' ;
  $result = $mysqli->query($query) ;
  $name_exists = false ;
  while($row=$result->fetch_assoc()){ $name_exists = true ; }
  if($name_exists){
    echo 'ERR:A question already exists with that name.' ;
    exit() ;
  }
  
  $duplicate_response_index = false ;
  $duplicate_response_text  = false ;
  $rs = $q['responses'] ;
  for($i=0 ; $i<count($rs) ; $i++){
    for($j=$i+1 ; $j<count($rs) ; $j++){
      if($rs[$i]['index']==$rs[$j]['index']) $duplicate_response_index = true ;
      if($rs[$i]['text' ]==$rs[$j]['text' ]) $duplicate_response_text  = true ;
      if($duplicate_response_index || $duplicate_response_text) break ;
    }
    if($duplicate_response_index || $duplicate_response_text) break ;
  }
  if($duplicate_response_index){
    echo 'ERR:At least one of the response indices is duplicated.' ;
    exit() ;
  }
  if($duplicate_response_text){
    echo 'ERR:At least one of the response texts is duplicated.' ;
    exit() ;
  }
  
  if(count($rs)<2){
    echo 'ERR:There are fewer than two responses.' ;
    exit() ;
  }
  
  // Okay, at this point we have a valid question and some valid responses.
  $query = 'INSERT INTO questions (name,text,symbols,direction) VALUES ("' . $q_name . '","' . $q_text . '","' . $q_symbols . '","' . $q_order . '")' ;
  $mysqli->query($query) ;
  
  for($i=0 ; $i<count($rs) ; $i++){
    $index = $mysqli->real_escape_string($rs[$i]['index']) ;
    $text  = $mysqli->real_escape_string($rs[$i]['text' ]) ;
    $query = 'INSERT INTO responses (index_,text,question,nVotes) VALUES (' . $index . ',"' . $text . '","' . $q_name . '",0)' ;
    $mysqli->query($query) ;
    echo $mysqli->error , ' ' , $query ;
  }
  
  
}


?>

