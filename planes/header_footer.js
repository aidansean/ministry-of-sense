// A series of functions to update the header and footer so we can set images or text,
// depending on the game state.  Mostly self explanatory, it's just moving images from a
// hidden div to the header/footer and back again.

function clear_header(){
  var hiddenDiv = Get('div_hidden') ;
  var headerDiv = Get('div_header') ;
  while(headerDiv.childNodes.length>0){ hiddenDiv.appendChild(headerDiv.childNodes[0]) ; }
}
function clear_footer(){
  var hiddenDiv = Get('div_hidden') ;
  var footerDiv = Get('div_footer') ;
  while(footerDiv.childNodes.length>0){ hiddenDiv.appendChild(footerDiv.childNodes[0]) ; }
}
function set_header_image(){
  clear_header() ;
  //Get('div_header').appendChild(Get('img_header')) ;
  Get('div_header').style.backgroundImage = 'url('+Get('img_header').src+')' ;
}
function set_footer_image(){
  clear_footer() ;
  Get('div_footer').appendChild(Get('img_footer')) ;
}
function set_header_and_footer_images(){
  set_header_image() ;
  set_footer_image() ;
}
function set_header_events_summary_table(){
  clear_header() ;
  Get('div_header').appendChild(Get('table_events_summary')) ;
}
function set_footer_toplogy(){
  clear_footer() ;
  Get('div_footer').appendChild(Get('div_topology')) ;
}
