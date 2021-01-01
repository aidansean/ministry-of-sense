<?php

// Turn on error reporting.
ini_set('display_startup_errors',1) ;
ini_set('display_errors',1) ;
error_reporting(-1) ;

include_once('mysql.php') ;

$mysqli = mysqli_connect($mysql_host, $mysql_username, $mysql_password, $mysql_database) ;

if(isset($_GET['q'])){
  $q_name = $mysqli->real_escape_string($_GET['q']) ;
  $query1 = 'SELECT * FROM questions WHERE name="' . $mysqli->real_escape_string($q_name)  . '"' ;
  $result1 = $mysqli->query($query1) ;
  
  if(false){
    while($row = $result1->fetch_assoc()){
      echo '<h1>' , $row['text'] , '</h1>' , PHP_EOL ;
    }
    
    $query_read = 'SELECT * FROM responses WHERE question="' . $mysqli->real_escape_string($q_name)  . '"' ;
    $result_read = $mysqli->query($query_read) ;
    echo '<table>' , PHP_EOL , '  <tbody>' , PHP_EOL ;
    while($row = $result_read->fetch_assoc()){
      echo '    <tr><th>' , $row['index_'] , '</th><td>' , $row['nVotes'] , ' votes</td><td>' , $row['text'] , '</td></tr>' , PHP_EOL ;
    }
    echo '  </tbody>' , PHP_EOL , '</table>' , PHP_EOL ;
  }
  else{
    $query_read = 'SELECT * FROM responses WHERE question="' . $mysqli->real_escape_string($q_name)  . '"' ;
    $result_read = $mysqli->query($query_read) ;
    $results = array() ;
    while($row = $result_read->fetch_assoc()){
      $results[] = $row['nVotes'] ;
    }
    echo implode(',',$results) ;
  }
}


?>

