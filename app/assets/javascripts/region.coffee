$(document).on 'turbolinks:load', ->
  if $('.l-regions-page').length
    $('.l-regions-page').on 'click', '.more-downloads-button', (e) ->
      e.preventDefault()
      new App.Component.DownloadMoreAttachments({ attachments: $(e.target).data('downloads'), iso: $(e.target).data('iso') })

    $('.l-regions-page').on 'click', '.more-publications-button', (e) ->
      e.preventDefault()
      new App.Component.DownloadMorePublications({ attachments: $(e.target).data('downloads'), iso: $(e.target).data('iso') })

