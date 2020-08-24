(function (App) {

  App.Page.DataForFinancialMarketsPage = Backbone.View.extend({
  
    el: 'body',
  
    events: {
      'click .js-read-more': '_onClickReadMore',
    },
  
    /**
     * Event handler executed when the user clicks on of the read more buttons
     * @param {Event} e
     */
    _onClickReadMore: function (e) {
      var title = e.target.dataset.title;
      var content = e.target.nextElementSibling.innerHTML;

      new App.Component.ModalAboutReadMore({
        title: title,
        content: content
      });
    },
  });
}).call(this, this.App);
  