var xmlhttp = GetXmlHttpObject() ;
var mode = '' ;
var canvas = null ;

function start(){
  Get('button_suddenDeath').addEventListener('click', scoreboard_suddenDeath) ;
  Get('button_pro'        ).addEventListener('click', scoreboard_pro        ) ;

  // Apply the style to be neutral.  This is done so that we only need to set a single
  // colour in settings.js and make the style function as complex as we like.
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
  
  scoreboard_suddenDeath() ;
}

function scoreboard_suddenDeath(){
  mode = 'suddenDeath' ;
  get_highscores() ;
}
function scoreboard_pro(){
  mode = 'pro' ;
  get_highscores() ;
}

function get_highscores(){
  var request = '?task=read_scores&mode=' + mode + '&nDays=-1' ;
  var uri = 'event_store.php'+request+'&sid=' + Math.random() ;
  xmlhttp.open('GET', uri, true) ;
  xmlhttp.onreadystatechange = update_highscores_board ;
  xmlhttp.send(null) ;
}

function highscore_td(innerHTML){
  var td = Create('td') ;
  td.className = 'highscores' ;
  td.innerHTML = innerHTML ;
  return td ;
}

function update_highscores_board(){
  if(mode=='') return ;
  if(xmlhttp.readyState==4){
    var high_scores = xmlhttp.responseText ;
    var scores = high_scores.split(',') ;
    Get('tbody_scores_'+mode).innerHTML = '' ;
    for(var i=0 ; i<scores.length ; i++){
      if(scores[i].length<2) continue ;
      var tr = Create('tr') ;
      tr.className = (i%2==0) ? 'even' : 'odd' ;
      var td_place = highscore_td(i+1) ;
      var td_score = highscore_td(scores[i].split(':')[1]) ;
      var td_name  = highscore_td(scores[i].split(':')[0]) ;
      tr.appendChild(td_place) ;
      tr.appendChild(td_score) ;
      tr.appendChild(td_name ) ;
      Get('tbody_scores_'+mode).appendChild(tr) ;
    }
    while(Get('div_scoreboard').childNodes.length>0){ Get('div_hidden').appendChild(Get('div_scoreboard').childNodes[0]) ; }
    
    Get('div_scoreboard').appendChild(Get('h2_'+mode)) ;
    Get('div_scoreboard').appendChild(Get('table_scores_'+mode)) ;
  }
}

