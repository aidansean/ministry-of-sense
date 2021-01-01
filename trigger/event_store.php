<?php

// Turn on error reporting
ini_set('display_startup_errors',1) ;
ini_set('display_errors',1) ;
error_reporting(-1) ;

include_once('mysql.php') ;

// Connect to database
$mysqli = new mysqli('localhost', $mysql_username, $mysql_password, $mysql_database) ;

if($mysqli->connect_errno){
  printf("Connection failed: %s\n", $mysqli->connect_error) ;
  exit() ;
}

$task = 'NOT_SET' ;
if(isset($_GET['task'])) $task = $_GET['task'] ;

if($task=='add_single_collision'){
  // format: ?task=add_single_collision&team=CMS&trigger=ee&topology=electron,electron&seed=832692128
  // Escape strings to prevent SQL injection.
  $team       = $mysqli->real_escape_string($_GET['team'      ]) ;
  $trigger    = $mysqli->real_escape_string($_GET['trigger'   ]) ;
  $topology   = $mysqli->real_escape_string($_GET['topology'  ]) ;
  $seed       = $mysqli->real_escape_string($_GET['seed'      ]) ;
  $playerName = $mysqli->real_escape_string($_GET['playerName']) ;
  
  // Create query to add row.
  $query = 'INSERT INTO trig_collisions(team, trig, topology, seed, created, playerName) VALUES ("' . $team . '","' . $trigger . '", "' . $topology . '", "' . $seed . '",NOW(), "' . $playerName . '")' ;
  $mysqli->query($query) or die($mysqli->error . ' - ' . $query) ;
}
else if($task=='set_all_collisions_as_read'){
  $query_update = 'UPDATE trig_collisions SET seen=1 WHERE TRUE' ;
  $result_update = $mysqli->query($query_update) or die($mysqli->error . '  (' . $query_update . ')') ;
  echo 'success' ;
}
else if($task=='get_single_collision'){
  // Escape strings to prevent SQL injection.
  $team = $mysqli->real_escape_string($_GET['team']) ;
  
  // Create query to read rows.
  $query_read = 'SELECT * FROM trig_collisions WHERE team="' . $team . '" AND seen=0 ORDER BY id ASC LIMIT 1' ;
  if($result = $mysqli->query($query_read)){
    $trig       =  '' ;
    $topology   =  '' ;
    $seed       = -1 ;
    $playerName = '' ;
    while($row = $result->fetch_assoc()){
      $query_update = 'UPDATE trig_collisions SET seen=1 WHERE id=' . $row['id'] ;
      $mysqli->query($query_update) or die($query_update . ' ' . $mysqli->error) ;
      $trig       = htmlentities($row['trig'      ]) ;
      $topology   = htmlentities($row['topology'  ]) ;
      $seed       = htmlentities($row['seed'      ]) ;
      $playerName = htmlentities($row['playerName']) ;
      $success = true ;
    }
    echo $trig , ';' , $topology , ';' , $seed , ';' , $playerName ;
  }
  else{
    die($mysqli->error . '  (' . $query_read . ')') ;
  }
}
else if($task=='add_score'){
  // Escape strings to prevent SQL injection.
  $username = $mysqli->real_escape_string($_GET['username']) ;
  $score    = $mysqli->real_escape_string($_GET['score'   ]) ;
  $mode     = $mysqli->real_escape_string($_GET['mode'    ]) ;
  
  // Create query to add row.
  $query = 'INSERT INTO trig_scores (username, score, mode) VALUES ("' . $username . '",' . $score . ', "' . $mode . '")' ;
  $mysqli->query($query) or die(mysql_error() . ' - ' . $query) ;
}
else if($task=='read_scores'){
  // Escape strings to prevent SQL injection.
  $mode  = $mysqli->real_escape_string($_GET['mode' ]) ;
  $nDays = $mysqli->real_escape_string($_GET['nDays']) ;
  
  // Create query to read rows.
  $query_read = 'SELECT * FROM trig_scores WHERE mode="' . $mode . '" ORDER BY score DESC LIMIT 10' ;
  $result_read = $mysqli->query($query_read) or die($mysqli->error) ;
  $string = array() ;
  while($row = $result_read->fetch_assoc()){
  $string [] = $row['username'] . ':' . $row['score'] ;
  }
  echo implode(',',$string) ;
}

?>

