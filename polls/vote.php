<?php

// Turn on error reporting.
ini_set('display_startup_errors',1) ;
ini_set('display_errors',1) ;
error_reporting(-1) ;

include_once('mysql.php') ;

$mysqli = mysqli_connect($mysql_host, $mysql_username, $mysql_password, $mysql_database) ;

if(isset($_GET['q']) && isset($_GET['index'])){
  $q_name = $mysqli->real_escape_string($_GET['q'    ]) ;
  $index  = $mysqli->real_escape_string($_GET['index']) ;
  
  $query_read = 'SELECT * FROM responses WHERE question="' . $q_name  . '" AND index_=' . $index . ' LIMIT 1' ;
  $result_read = $mysqli->query($query_read) ;
  while($row = $result_read->fetch_assoc()){
    $nVotes = $row['nVotes'] ;
    $query_write = 'UPDATE responses SET nVotes=' . ($nVotes+1) . ' WHERE question="' . $q_name  . '" AND index_=' . $index ;
    $result_write = $mysqli->query($query_write) or die($mysqli-error . ' ' . $query_write) ;
  }
}


?>

