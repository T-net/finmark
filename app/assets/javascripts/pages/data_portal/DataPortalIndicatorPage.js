(function (App) {
  'use strict';

  App.Page.DataPortalIndicatorPage = Backbone.View.extend({

    el: 'body',

    defaults: {
      // Encoded state of the widget
      encodedState: null,
      // Whether to print the indicator when entering the page
      print: false,
      // Decoded state of the widget
      _state: null
    },

    initialize: function (options) {
      this.options = _.extend({}, this.defaults, options);
      if (this.options.isMSME) {
        this.indicatorsCollection = new App.Collection.MSMEIndicatorsCollection();
      } else if (this.options.isMobileSurvey) {
        this.indicatorsCollection = new App.Collection.ExploratorySurveyIndicatorsCollection();
      } else {
        this.indicatorsCollection = new App.Collection.IndicatorsCollection();
      }
      this.widgetContainer = this.el.querySelector('.js-widget');
      this.gridContainer = this.el.querySelector('.js-grid');
      this.layoutContainer = this.el.querySelector('.js-layout');

      this._retrieveState();
      this._fetchData();
    },

    /**
     * Event listener executed when a widget has successfully fetched its data
     * @param {{ id: string, name: string, data: object[] }} event
     */
    _onWidgetSync: function (event) {
      this._updateWidgetContainer();
    },

    /**
     * Event listener executed when the widget has rendered its graph
     */
    _onChartRender: function () {
      // If we want to print the indicator, we change the width of the page
      if (this.options.print) {
        this.gridContainer.classList.remove('grid-m-6');
        this.layoutContainer.classList.add('-print');
      }

      if (this.options.print) this._print();
    },

    /**
     * Update this.options._state according to this.options.encodedState
     */
    _retrieveState: function () {
      var serializedState = App.Helper.URL.decode(this.options.encodedState);
      this.options._state = App.Helper.Indicators.deserialize(serializedState);
    },

    /**
     * Fetch the list of indicators
     */
    _fetchData: function () {
      this.indicatorsCollection.fetch()
        .done(function () {
          this._loadingError = false;
        }.bind(this))
        .fail(function () {
          this._loadingError = true;
        }.bind(this))
        .always(this.render.bind(this));
    },

    /**
     * Render the widget
     */
    _renderWidget: function () {
      var options = _.extend({}, {
        el: this.widgetContainer,
        showToolbar: false,
        autoResize: !this.options.print,
        showDetails: !(this.options.isRegion),
        isRegion: (this.options.isRegion),
        isMSME: this.options.isMSME,
        isMobileSurvey: this.options.isMobileSurvey,
        vegaVersion: this.options.isMobileSurvey ? 'V3' : 'V2'
      }, this.options._state);
      var widget = new App.View.ChartWidgetView(options);
      this.listenTo(widget, 'data:sync', this._onWidgetSync);
      this.listenTo(widget, 'chart:render', this._onChartRender);
    },

    /**
     * Update the size of the widget container depending on
     * if the category of the indicator
     */
    _updateWidgetContainer: function () {
      var index = _.findIndex(this.indicatorsCollection.toJSON(), { id: this.options._state.id });
      var indicator = this.indicatorsCollection.toJSON()[index];
      var isComplex = indicator.category === App.Helper.Indicators.CATEGORIES.ACCESS
        || indicator.category === App.Helper.Indicators.CATEGORIES.STRANDS
        || indicator.category === App.Helper.Indicators.CATEGORIES.COMMON
        || indicator.category === App.Helper.Indicators.CATEGORIES.MSME_STRANDS;

      if (isComplex) {
        this.gridContainer.classList.remove('grid-m-6');
      }
    },

    /**
     * Print the indicator
     */
    _print: function () {
      window.print();
    },

    render: function () {
      this._renderWidget();
    }

  });

}).call(this, this.App);
