<?php

include_once('mysql.php') ;
$mysqli = mysqli_connect($mysql_host, $mysql_username, $mysql_password, $mysql_database) ;

?>
<html>
<head>
<title>Create poll</title>
<script type="text/javascript" src="functions.js"></script>
<link rel="stylesheet" type="text/css" href="style.css" media="screen" />
</head>
<body onload="start()">

<h1>Create a new poll</h1>

<table>
  <tbody id="tbody_question">
    <tr>
      <th>Question:</th>
      <td><input type="text" id="input_question_text" class="text_long" value=""/></td>
      <td></td>
    </tr>
    <tr>
      <th>Short name:</th>
      <td><input type="text" id="input_question_name" class="text_long" value=""/></td>
      <td>(Only A-Z,a-z,0-9)</td>
    </tr>
  </tbody>
  <tbody id="tbody_responses">
    <tr>
      <th></th>
      <th>Response text</th>
      <th>Value</th>
    </tr>
    <tr id="tr_addResponse">
      <td></td>
      <th><button id="button_addResponse" class="button_big">Add new response</button></th>
      <td></td>
    </tr>
    <tr>
      <th>Symbols</th>
      <td>
        <select class="question" id="select_symbols">
          <option value="none">None</option>
          <option value="stars">Stars</option>
          <option value="check">Check marks</option>
        </select>
      </td>
      <td></td>
    </tr>
    <tr>
      <th>Display order:</th>
      <td>
        <select class="question" id="select_order">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </td>
      <td></td>
    </tr>
    <tr>
      <td></td>
      <th><button id="button_sendQuestion" class="button_big">Create poll!</button></th>
      <td></td>
    </tr>
  </tbody>
</table>

</body>
</html>
