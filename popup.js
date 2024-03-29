let bkg = chrome.extension.getBackgroundPage()

chrome.runtime.onMessage.addListener(function(request){
  if (typeof request.type != 'string') return
  switch(request.type){
  case 'copy':
    var nombre = (request.copied_url > 1) ? 's' : ''
    jQuery('#message').removeClass('error').html('<b>'+request.copied_url+'</b> url'+nombre+' successfully copied !')
    setTimeout(function(){window.close()}, 3000)
    break
  case 'paste':
    if (request.errorMsg) {
      jQuery('#message').addClass('error').html(request.errorMsg)
      return
    }
    window.close()
    break
  }
})

jQuery(function($){
  $('#actionCopy').on('click', function(){
    chrome.windows.getCurrent(function(win){
      bkg.Action.copy({window: win})
    })
  })
  $('#actionPaste').on('click', function(){
    bkg.Action.paste()
  })
  $('#actionOption').click(function(){
    chrome.tabs.create({url: 'options.html'})
  })

  var default_action = localStorage['default_action'] ? localStorage['default_action'] : 'menu'
  if( default_action != 'menu' ){
    $('body>ul').hide()
    $('#message').css({'padding':'3px 0 5px'})

    switch(default_action){
    case 'copy':
      $('#actionCopy').trigger('click', [true])
      break
    case 'paste':
      $('#actionPaste').trigger('click', [true])
      break
    }
  }
})