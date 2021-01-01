var canvas = null ;
var xmlhttp = GetXmlHttpObject() ;

function start(){
  // Add eventListeners.
  Get('button_clear').addEventListener('click', clear_form  ) ;
  Get('button_send' ).addEventListener('click', send_message) ;
  
  // Apply the style to be neutral.  This is done so that we only need to set a single
  // colour in settings.js and make the style function as complex as we like.
  teams['neutral'].apply_style() ;
  set_header_and_footer_images() ;
}

function clear_form(){
  Get('input_message_name' ).value = '' ;
  Get('input_message_email').value = '' ;
  Get('textarea_message'   ).value = '' ;
}

function send_message(){
  var name = Get('input_message_name').value + ' (Trigger game feedback)' ;
  var email = 'aidan.randleconde@gmail.com' ;
  var message = Get('textarea_message').value + '  (From ' + Get('input_message_email').value +')' ;
  var request = 'name=' + name + '&email=' + email + '&message=' + message ;
  var uri = '/contact.php' ;
  
  xmlhttp.onReadyStateChange = message_response ;
  xmlhttp.open('POST', uri, true) ;
  xmlhttp.setRequestHeader('Content-type','application/x-www-form-urlencoded') ;
  xmlhttp.send(request) ;
}

function message_response(){
  if(xmlhttp.readyState==4){
    if(xmlhttp.responseText.indexOf('Please fix the following errors')!=-1){
      Get('span_message_response').innerHTML = 'Oops, your message may not have been received!  Please try again (or contact Aidan directly at aidan@cern.ch).' ;
    }
    else{
      Get('span_message_response').innerHTML = 'Message received, thanks for the feedback!' ;
    }
  }
}
