var clipboardBuffer

var Clipboard = {
  write: function(str, extended_mime){
    if(str == '' || str == undefined){
      str = '<empty>'
    }

    clipboardBuffer.val(str)
    clipboardBuffer.select()

    var oncopyBackup = document.oncopy
    document.oncopy = function(e){
      if( typeof extended_mime == 'undefined' || extended_mime != true ){
        return
      }
      e.preventDefault()
      e.clipboardData.setData('text/html', str)
      e.clipboardData.setData('text/plain', str)
    }
    document.execCommand('copy')
    document.oncopy = oncopyBackup
  },

  read: function(){
    clipboardBuffer.val('')
    clipboardBuffer.select()
    document.execCommand('paste')
    return clipboardBuffer.val()
  }
}

var Action = {
  copy: function(opt){
    var tabQuery = {windowId: opt.window.id}

    try {
      if (localStorage['walk_all_windows'] == 'true') {
        tabQuery.windowId = null
      }
    } catch(ex) { /* left blank intended */ }

    chrome.tabs.query(tabQuery, function(tabs){
      var format = localStorage['format'] ? localStorage['format'] : 'text'
      var highlighted_tab_only = localStorage['highlighted_tab_only'] == 'true' ? true : false
      var extended_mime = typeof localStorage['mime'] != 'undefined' && localStorage['mime'] == 'html' ? true : false
      var outputText = ''

      var tabs_filtered = []
      for (var i=0; i < tabs.length; i++) {
        if( highlighted_tab_only && !tabs[i].highlighted ) continue
        tabs_filtered.push(tabs[i])
      }
      tabs = tabs_filtered

      if( format == 'html' ){
        outputText = CopyTo.html(tabs)
      } else if( format == 'custom' ) {
        outputText = CopyTo.custom(tabs)
      } else if( format == 'json' ) {
        outputText = CopyTo.json(tabs)
        extended_mime = false
      } else {
        outputText = CopyTo.text(tabs)
        extended_mime = false
      }

      Clipboard.write(outputText, extended_mime)

      chrome.runtime.sendMessage({type: 'copy', copied_url: tabs.length})
    })
  },

  paste: function(){
    var clipboardString = Clipboard.read()
    var urlList

    if( localStorage['intelligent_paste'] == 'true' ){
      urlList = clipboardString.match(/(https?|ftp|ssh|mailto):\/\/[a-z0-9/:%_+.,#?!@&=-]+/gi)
    } else {
      urlList = clipboardString.split('\n')
    }

    if (urlList == null) {
      chrome.runtime.sendMessage({type: 'paste', errorMsg: 'No URL found in the clipboard'})
      return
    }

    $.each(urlList, function(key, val){
      var matches = val.match(new RegExp('<a[^>]+href="([^"]+)"', 'i'))
      try{
        urlList[key] = matches[1]
      } catch(e){ /* left blank intended */ }

      urlList[key] = jQuery.trim(urlList[key])
    })

    urlList = urlList.filter(function(url){
      if( url == '' || url == undefined ){
        return false
      }
      return true
    })

    $.each(urlList, function(key, val){
      chrome.tabs.create({url: val})
    })

    chrome.runtime.sendMessage({type: 'paste'})
  }
}

/**
* Fonctions de copie des URL dans une chaîne de caractères
*/
var CopyTo = {
  html: function(tabs){
    var anchor = localStorage['anchor'] ? localStorage['anchor'] : 'url'
    var row_anchor = ''
    var s = ''
    for (var i=0; i < tabs.length; i++) {
      row_anchor = tabs[i].url
      if( anchor == 'title' ){
        try{
          Encoder.EncodeType = 'entity'
          row_anchor = Encoder.htmlEncode(tabs[i].title)
        } catch(ex){
          row_anchor = tabs[i].title
        }
      }
      s += '<a href="'+tabs[i].url+'">'+row_anchor+'</a><br/>'
      s = s + '\n'
    }
    return s
  },

  custom: function(tabs){
    var template = (localStorage['format_custom_advanced'] && localStorage['format_custom_advanced'] != '') ? localStorage['format_custom_advanced'] : null
    if( template == null ){
      return 'ERROR : Row template is empty ! (see options page)'
    }
    var s = ''
    for (var i=0; i < tabs.length; i++) {
      var current_row   = template
      var current_url   = tabs[i].url
      var current_title = tabs[i].title


      current_row = current_row.replace(/\$url/gi, current_url)
      current_row = current_row.replace(/\$title/gi, current_title)

      s += current_row
    }
    return s
  },

  text: function(tabs){
    var s = ''
    for (var i=0; i < tabs.length; i++) {
      s += tabs[i].url
      s = s + '\n'
    }
    return s
  },

  json: function(tabs){
    var data = []
    for (var i=0; i < tabs.length; i++) {
      data.push({url: tabs[i].url, title: tabs[i].title})
    }
    return JSON.stringify(data)
  }
}

/**
* Raccourci clavier
*/
chrome.commands.onCommand.addListener(function(command){
  switch(command){
  case 'copy':
    chrome.windows.getCurrent(function(win){
      Action.copy({window: win})
    })
    break
  case 'paste':
    Action.paste()
    break
  }
})

/**
* Update notification
*/
var UpdateManager = {
  runtimeOnInstalledStatus: null,

  recentUpdate: function(){
    try {
      var timeDiff = new Date().getTime() - new Date(parseInt(localStorage['update_last_time'])).getTime()
      if (timeDiff < 1000*3600*24) {
        return true
      }
    } catch (ex) { /* left blank */ }
    return false
  },

  setBadge: function(){
    if (!UpdateManager.recentUpdate()) {
      chrome.browserAction.setBadgeText({text: ''})
      return
    }
    chrome.browserAction.setBadgeText({text: 'NEW'})
  }
}
UpdateManager.setBadge()
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason != 'update') {
    UpdateManager.runtimeOnInstalledStatus = 'Not an update ('+details.reason+')'
    return
  }

  if (details.previousVersion == chrome.runtime.getManifest().version) {
    UpdateManager.runtimeOnInstalledStatus = 'Same version ('+details.previousVersion+')'
    return
  }

  localStorage['update_last_time'] = new Date().getTime()
  localStorage['update_previous_version'] = details.previousVersion
  UpdateManager.runtimeOnInstalledStatus = 'Updated'

  UpdateManager.setBadge()

  chrome.notifications.create('cpau_update_notification', {
    type: 'basic',
    title: 'Copy All Urls updated',
    message: 'New version installed : ' + chrome.runtime.getManifest().version + '. Click to see new features.',
    iconUrl: 'img/umbrella_128.png'
  }, function(){})
})

jQuery(function($){
  clipboardBuffer = $('<textarea id="clipboardBuffer"></textarea>')
  clipboardBuffer.appendTo('body')
})