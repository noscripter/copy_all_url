jQuery(document).ready(function($){
  $('#cpau_version_label').html(chrome.runtime.getManifest().version)

  OptionFormManager.init()

  $('#formats input[type=radio]').change(function(){
    localStorage['format'] = $(this).val()
    OptionFormManager.init()
  })

  $('#format_html_advanced input[type=radio]').change(function(){
    localStorage['anchor'] = $(this).val()
    OptionFormManager.init()
  })

  $('#format_custom_advanced>textarea').change(function(){
    localStorage['format_custom_advanced'] = $(this).val()
    OptionFormManager.init()
  })

  $('#intelligent_paste').change(function(){
    localStorage['intelligent_paste'] = $(this).prop('checked')
    OptionFormManager.init()
  })

  $('#walk_all_windows').change(function(){
    localStorage['walk_all_windows'] = $(this).prop('checked')
    OptionFormManager.init()
  })

  $('#highlighted_tab_only').change(function(){
    localStorage['highlighted_tab_only'] = $(this).prop('checked')
    OptionFormManager.init()
  })

  $('#default_action').change(function(){
    localStorage['default_action'] = $(this).val()
    OptionFormManager.init()
  })

  $('#mime').change(function(){
    localStorage['mime'] = $(this).val()
    OptionFormManager.init()
  })

  $('#reset_settings').click(function(){
    OptionFormManager.optionsReset()
  })

  var currentYear = new Date().getFullYear()
  if( $('#copyright-year-footer').text() < currentYear ){
    $('#copyright-year-footer').text(currentYear)
  }

  $('.open-link-via-chrome-api').click(function(e){
    e.preventDefault()
    e.stopImmediatePropagation()
    var href = $(this).attr('href')
    if (href == undefined) {
      return
    }
    if ($(this).hasClass('on-new-tab')) {
      chrome.tabs.create({url: href})
    } else {
      chrome.tabs.update({url: href})
    }
  })

  $('a').click(function(e){
    var href = $(this).attr('href')
    try {
      if (!href.match(/^\s*http/i)) {
        return
      }
    } catch(ex) {
      return
    }
    e.stopImmediatePropagation()
  })
})

/**
* Objet de gestion du formulaire d'options
*/
var OptionFormManager = {
  /**
  * Init form from localStorage (saved settings)
  */
  init: function(){
    var format = localStorage['format'] ? localStorage['format'] : 'text'
    var anchor = localStorage['anchor'] ? localStorage['anchor'] : 'url'
    var format_custom_advanced = localStorage['format_custom_advanced'] ? localStorage['format_custom_advanced'] : ''
    var intelligent_paste = localStorage['intelligent_paste'] == 'true' ? true : false
    var walk_all_windows = localStorage['walk_all_windows'] == 'true' ? true : false
    var highlighted_tab_only = localStorage['highlighted_tab_only'] == 'true' ? true : false
    var default_action = localStorage['default_action'] ? localStorage['default_action'] : 'menu'
    var mime = localStorage['mime'] ? localStorage['mime'] : 'plaintext'

    this.cocherFormat(format)

    jQuery('#format_html_advanced input[type=radio]').attr('checked', false)
    jQuery('#format_html_anchor_' + anchor).attr('checked', true)

    jQuery('#format_custom_advanced>textarea').val(format_custom_advanced)

    $('#format_html_advanced').hide()
    $('#format_custom_advanced').hide()
    if( format == 'html' ){
      $('#format_html_advanced').show()
    }
    if( format == 'custom' ){
      $('#format_custom_advanced').show()
    }

    jQuery('#intelligent_paste').prop('checked', intelligent_paste)

    jQuery('#walk_all_windows').prop('checked', walk_all_windows)

    jQuery('#highlighted_tab_only').prop('checked', highlighted_tab_only)

    jQuery('#default_action').val(default_action)

    jQuery('#mime').val(mime)
  },

  /**
  * Checks the Text or HTML checkbox
  */
  cocherFormat: function(option){
    jQuery('#formats input[type=radio]').attr('checked', false)
    jQuery('#format_' + option).attr('checked', true)
  },

  /**
  * Delete options
  */
  optionsReset: function(){
    delete(localStorage['format'])
    delete(localStorage['anchor'])
    delete(localStorage['format_custom_advanced'])
    delete(localStorage['intelligent_paste'])
    delete(localStorage['walk_all_windows'])
    delete(localStorage['highlighted_tab_only'])
    delete(localStorage['default_action'])
    delete(localStorage['mime'])
    this.init()
  }
}