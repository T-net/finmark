(function (App) {

  App.Component.ModalChartAnalysis = App.Component.Modal.extend({

    contentTemplate: JST['templates/data_portal/modals/modal-chart-analysis'],

    defaults: {
      // Id of indicator being analysed
      id: null,
      // See App.Component.Modal for details about this option
      title: 'Analyse indicator',
      // See App.Component.Modal for details about this option
      showTitle: true,
      // See App.Component.Modal for details about this option
      footer: '<button type="button" class="c-button -medium -white -outline js-cancel">Cancel</button><button type="button" class="c-button -medium -white js-done">Done</button>',
      // List of indicators to display in the modal
      indicators: [],
      // Id of the selected indicator for the analysis
      selectedIndicatorId: null,
      // Callback executed when the user presses the "Done" button
      // The callback gets passed the name of the selected chart
      continueCallback: function () {},
      // Callback executed when the user presses the "Clear analysis" button
      // The callback doesn't receive any parameter
      stopAnalysisCallback: function () {}
    },

    events: function () {
      return _.extend({}, App.Component.Modal.prototype.events, {
        'click .js-cancel': 'onCloseModal',
        'click .js-done': '_onClickDone',
        'click .js-clear-analysis': '_onClickClearAnalysis'
      });
    },

    initialize: function (options) {
      this.constructor.__super__.initialize.call(this, options);

      // You cant analyse the current indicator being analysed
      if (this.options.id) {
        this.options.indicators = _.filter(this.options.indicators, 
          function(o) { return o.id !== this.options.id }, this);
      }

      this.render();
    },

    /**
     * Event handler for when the "Done" button is clicked
     */
    _onClickDone: function () {
      var selectedOption = this.el.querySelector('.js-indicator:checked');
      this.options.continueCallback(selectedOption.value);
      this.onCloseModal();
    },

    /**
     * Event handler for when the "Clear analysis" button is clicked
     */
    _onClickClearAnalysis: function () {
      this.options.stopAnalysisCallback();
      this.onCloseModal();
    },

    render: function () {
      this.options.content = this.contentTemplate({
        indicators: this.options.indicators,
        selectedIndicatorId: this.options.selectedIndicatorId
      });

      this.constructor.__super__.render.apply(this);
    }

  });
}).call(this, this.App);
