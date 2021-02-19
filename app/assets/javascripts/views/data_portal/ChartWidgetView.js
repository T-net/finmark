(function (App) {
  'use strict';

  App.View.ChartWidgetView = Backbone.View.extend({

    template: JST['templates/data_portal/chart-widget'],

    defaults: {
      // Ratio between the height and the width (i.e. height = chartRatio * width)
      // This ratio can be updated according to the chart config App.Helper.ChartConfig
      chartRatio: 0.5,
      // Name of the default chart type
      chart: null,
      // Inner width of the chart, used internally
      _width: null,
      // Inner height of the chart, used internally
      _height: null,
      // Indicator id
      id: null,
      // ISO of the country
      iso: null,
      // Category 
      category: null,
      // Selected year
      year: null,
      // Filters on the data
      // See _filters in App.Page.DataPortalCountryPage to see their format
      filters: [],
      // Id of the indicator used for the analysis
      analysisIndicator: null,
      // List of the indicators used for the comparison
      // The format of each of them is:
      // { id: string, year: number, iso: string, filters: { id: string, name: string, options: string[] }[] }
      // NOTE: the filters attribute do not contain the filters set for the whole portal but instead, only
      // the filters used for the comparation
      compareIndicators: null,
      // Displays widget toolbar
      showToolbar: true,
      // Display the country, the year and the filters in the widget
      showDetails: false,
      // Whether the widget is rendered in a report
      report: false,
      // Callback executed when the delete button is clicked
      onDelete: function () {},
      // Automatically re-render the chart when the size of the window changes
      // If false, the widget is scaled with the preserveAspectRatio attribute
      // If true, it depends on the responsive mode of the widget:
      //   * if adaptative, the widget is rendered with a different template according to its size
      //   * if scroll, the widget is rendered as on desktop but with a horizontal scroll
      //   * if no mode is provided, the desktop template is always chosen
      autoResize: true,
      // Default mode for widget view
      // The mode is used to determine how the toolbar should be shown
      mode: 'graphics',
      // Vega version, defaults to V2
      vegaVersion: 'V2'
    },

    events: {
      'click .js-save': '_onSave',
      'click .js-change': '_onChange',
      'click .js-compare': '_onCompare',
      'click .js-analyze': '_onAnalyze',
      'click .js-delete': '_onDelete'
    },

    initialize: function (settings) {
      this.options = _.extend({}, this.defaults, settings);
      if (this.options.isMSME) {
        this.indicatorsCollection = new App.Collection.MSMEIndicatorsCollection();
      } else if (this.options.isMobileSurvey) { 
        this.indicatorsCollection = new App.Collection.ExploratorySurveyIndicatorsCollection();
      } else {
        this.indicatorsCollection = new App.Collection.IndicatorsCollection();
      }
      this._fetchData();
    },

    /**
     * Set the listeners that doesn't depend on a DOM node
     */
    _setListeners: function () {
      if (this.options.autoResize) {
        window.addEventListener('resize', _.debounce(this._onResize.bind(this), 150));
      }
    },

    /**
     * Event handler executed when the data is fetched
     */
    _onFetch: function () {
      var data = this.model.get('data') || this.model.get('rows') || [];

      if (data.length) this.widgetToolbox = new App.Helper.WidgetToolbox(data);

      // If the indicator doesn't have any data, we also want to send an event
      // to notify the parent view about it
      this.trigger('data:sync', {
        id: this.options.id,
        name: this.model.get('title'),
        category: this.options.category || null,
        data: data
      });

      var indicator = this._getIndicator() || {};
      var indicatorCategory = indicator.category;

      // We pre-render the component with its template
      this.el.innerHTML = this.template({
        name: this.model.get('title'),
        mode: this.options.mode,
        country: App.Helper.Indicators.COUNTRIES[this.options.iso],
        year: this.options.year,
        filters: this.options.filters.filter(function (filter) {
          return filter.id !== 'jurisdiction';
        }),
        jurisdiction: this._getJurisdiction(),
        noData: !data.length,
        showDetails: this.options.showDetails,
        showToolbar: this.options.showToolbar,
        report: this.options.report,
        canAnalyze: indicatorCategory === App.Helper.Indicators.CATEGORIES.ACCESS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.STRANDS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.MSME_STRANDS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.ASSET
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.SDGS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.POVERTY
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.DEMOGRAPHICS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.GENDER_NORMS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.WORK
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.OWNERSHIP_AND_CONTROL
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.AGENCY_AND_DECISION_MAKING
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.FINANCIAL_INC
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.INCOME,
        canCompare: indicatorCategory === App.Helper.Indicators.CATEGORIES.ACCESS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.STRANDS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.MSME_STRANDS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.ASSET
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.SDGS
          || indicatorCategory === App.Helper.Indicators.CATEGORIES.POVERTY,
        isAnalyzing: !!this.options.analysisIndicator,
        isComparing: !!this.options.compareIndicators
      });
      this.chartContainer = this.el.querySelector('.js-chart');

      this.render();
      this._setListeners();
    },

    /**
     * Event handler for when the window is resized
     */
    _onResize: function () {
      if (!this.options.chart || this.options.chart === 'table') return;

      /* eslint-disable no-underscore-dangle */
      var previousWidth = this.options._width;
      var previousHeight = this.options._height;
      /* eslint-enable no-underscore-dangle */

      var newDimensions = this._computeChartDimensions();
      if (newDimensions.width !== previousWidth || newDimensions.height !== previousHeight) {
        this._renderChart();
      }
    },

    /**
     * Event handler for when the user clicks the save button
     */
    _onSave: function () {
      new App.Component.ModalSaveWidget({
        widgetConfig: this.options,
      });
    },

    /**
     * Event handler for when the user clicks the change button
     */
    _onChange: function () {
      var deferred = $.Deferred();

      // If the analysis or comparison is active, we display ask the user to confirm
      // their choice
      if (this.options.compareIndicators || this.options.analysisIndicator) {
        new App.View.WidgetWarningTooltipView({
          refElem: this.el.querySelector('.js-change'),
          direction: 'top',
          description: 'The chart selection isn\'t compatible with the '
            + (this.options.compareIndicators ? 'compare' : 'analysis')
            + ' mode. You will loose the current configuration.',
          continueCallback: function () {
            this.remove();
            deferred.resolve();
          },
          cancelCallback: function () { this.remove(); }
        });
      } else {
        deferred.resolve();
      }


      deferred.done(this._openModalChartSelector.bind(this));
    },

    /**
     * Event handler for when the user clicks the analyze button
     */
    _onAnalyze: function () {
      var deferred = $.Deferred();

      // If the comparison is active, we display ask the user to confirm
      // their choice
      if (this.options.compareIndicators) {
        new App.View.WidgetWarningTooltipView({
          refElem: this.el.querySelector('.js-analyze'),
          direction: 'top',
          description: 'The analysis mode isn\'t compatible with the compare one. You will loose the current configuration.',
          continueCallback: function () {
            this.remove();
            deferred.resolve();
          },
          cancelCallback: function () { this.remove(); }
        });
      } else {
        deferred.resolve();
      }

      deferred.done(this._openModalChartAnalysis.bind(this));
    },

    /**
     * Event handler for when the user clicks the "clear analysis" button
     */
    _onStopAnalyze: function () {
      this.options.chart = null;
      this.options.analysisIndicator = null;
      this._fetchData();
    },

    /**
     * Event handler for when the user clicks the compare button
     */
    _onCompare: function () {
      var deferred = $.Deferred();

      // If the analysis is active, we display ask the user to confirm
      // their choice
      if (this.options.analysisIndicator) {
        new App.View.WidgetWarningTooltipView({
          refElem: this.el.querySelector('.js-compare'),
          direction: 'top',
          description: 'The compare mode isn\'t compatible with the analysis one. You will loose the current configuration.',
          continueCallback: function () {
            this.remove();
            deferred.resolve();
          },
          cancelCallback: function () { this.remove(); }
        });
      } else {
        deferred.resolve();
      }

      deferred.done(this._openModalChartCompare.bind(this));
    },

    /**
     * Event handler for when the user clicks the "clear comparison" button
     */
    _onStopCompare: function () {
      this.options.chart = null;
      this.options.compareIndicators = null;
      this._fetchData();
    },

    /**
     * Event handler fow when the chart is changed
     * @param {string} chart - chosen chart
     */
    _onChangeChart: function (chart) {
      if (this.options.chart === chart) return;

      this.options.chart = chart;

      // We stop the analysis
      if (this.options.analysisIndicator) {
        this.options.analysisIndicator = null;
        this._fetchData();
      }
      // We stop the comparison
      else if (this.options.compareIndicators) {
        this.options.compareIndicators = null;
        this._fetchData();
      } else {
        this._fetchData();
      }
    },

    /**
     * Event handler for when an element with tooltip is hovered
     * in a chart
     * @param {object} e vega event
     * @param {object} item vega item
     */
    _onMouseoverChart: function (e, item) {
      if (!item || !item.mark || item.mark.name !== 'hasTooltip') return;

      this.tooltip = new App.View.ChartTooltipView({
        title: item.datum.tooltipTitle,
        subtitle: item.datum.tooltipSubtitle || null,
        value: item.datum.tooltipValue,
        reference: this.el
      });
    },

    /**
     * Event handler for when an element with tooltip looses its hover
     * state in a chart
     */
    _onMouseoutChart: function () {
      if (!this.tooltip) return;
      this.tooltip.remove();
      this.tooltip = null;
    },

    /**
     * Event handler for when a chart receives a touchmove event
     */
    _onTouchmoveChart: function () {
      this._onMouseoutChart();
    },

    /**
     * Event handler executed when the delete button is clicked
     */
    _onDelete: function () {
      this.options.onDelete();
    },

    /**
     * Reload the widget its current configuration
     */
    reload: function () {
      this._fetchData();
    },

    /**
     * Return the name of the jurisdiction if there's one, null otherwise
     * @return {string|null}
     */
    _getJurisdiction: function () {
      var jurisdictionFilter = this.options.filters.find(function (filter) {
        return filter.id === 'jurisdiction';
      });

      return jurisdictionFilter ? jurisdictionFilter.options[0] : null;
    },

    /**
     * Open the modal for the chart comparison
     */
    _openModalChartCompare: function () {
      var jurisdictionFilter = _.findWhere(this.options.filters, { id: 'jurisdiction' });

      new App.Component.ModalChartCompare({
        indicator: this._getIndicator(),
        iso: this.options.iso,
        year: this.options.year,
        filters: this.options.filters,
        compareIndicators: this.options.compareIndicators,
        canCompareCountries: !jurisdictionFilter,
        continueCallback: function (compareIndicators) {
          // If the analysis is active, we stop it
          if (this.options.analysisIndicator) {
            this.options.chart = null;
            this.options.analysisIndicator = null;
          }

          this.options.chart = 'compare';
          this.options.compareIndicators = compareIndicators;
          this._fetchData();
        }.bind(this),
        stopCompareCallback: this._onStopCompare.bind(this),
        isRegion: this.options.isRegion,
        isMSME: this.options.isMSME,
        isMobileSurvey: this.options.isMobileSurvey
      });
    },

    /**
     * Open the modal for the chart analysis
     */
    _openModalChartAnalysis: function () {
      var nonComplexIndicators = this.indicatorsCollection.toJSON().filter(function (indicator) {
        return indicator.category !== App.Helper.Indicators.CATEGORIES.ACCESS
          && indicator.category !== App.Helper.Indicators.CATEGORIES.STRANDS
          && indicator.category !== App.Helper.Indicators.CATEGORIES.ASSET;
      });

      new App.Component.ModalChartAnalysis({
        id: this.options.id,
        indicators: nonComplexIndicators,
        selectedIndicatorId: this.options.analysisIndicator,
        continueCallback: function (indicatorId) {
          // If the comparison is active, we stop it
          if (this.options.compareIndicators) {
            this.options.chart = null;
            this.options.compareIndicators = null;
          }
          
          if (this.options.isMobileSurvey) {
            this.options.chart = 'heatmap';
          } else {
            this.options.chart = 'analysis';
          }

          this.options.analysisIndicator = indicatorId;
          this._fetchData();
        }.bind(this),
        stopAnalysisCallback: this._onStopAnalyze.bind(this)
      });
    },

    /**
     * Opent the modal for the chart selection
     */
    _openModalChartSelector: function () {
      // We retrieve the list of all the charts that can be built with vega
      var charts = App.Helper.ChartConfig
        .filter(function (chart) {
          return chart.visible !== false;
        })
        .map(function(chart) {
          return {
            name: chart.name,
            available: false,
            selected: this.options.chart === chart.name
          };
        }, this);

      // We update the object to tell which ones are available with the current
      // dataset      
      this._getAvailableCharts().forEach(function (availableChart) {
        var chart = _.findWhere(charts, { name: availableChart });
        if (chart) chart.available = true;
      });

      // For mobile surveys, we will control what chats are available
      if (this.options.isMobileSurvey) {
        charts = charts.filter(function (c) {
          return ['grouped bar', 'table', 'radial'].indexOf(c.name) > -1;
        })
      }

      // We instantiate the modal
      new App.Component.ModalChartSelector({
        charts: charts,
        continueCallback: this._onChangeChart.bind(this)
      });
    },

    /**
     * Fetch the data for the widget
     */
    _fetchData: function () {
      // We show the spinning loader
      this._showLoader();

      // We fetch the indicators only once
      var deferred = $.Deferred();
      if (!this.indicatorsCollection.length) {
        this.indicatorsCollection.fetch()
          .done(deferred.resolve)
          .fail(deferred.reject);
      } else {
        deferred.resolve();
      }

      deferred
        .then(function () {
          // We create a new model each time we request the data because the
          // model options eventually changed
          this.model = new App.Model.ChartWidgetModel(
            _.extend({}, this.options, {
              id: this.options.id,
              iso: this.options.iso,
              year: this.options.year,
              indicator: this._getIndicator(),
              body: this.options.body,
              filters: this.options.filters,
              analysisIndicatorId: this.options.analysisIndicator,
              compareIndicators: this.options.compareIndicators,
              expanded: this.options.chart === 'table',
              isRegion: this.options.isRegion,
              isMSME: this.options.isMSME,
              isMobileSurvey: this.options.isMobileSurvey
            })
          );

          this.model.fetch()
            .done(this._onFetch.bind(this))
            .fail(this.renderError.bind(this))
            .always(this._hideLoader.bind(this));
        }.bind(this))
        .fail(function () {
          this.renderError();
          this._hideLoader();
        }.bind(this));
    },

    /**
     * Return the detailed information about the indicator
     * @return {{ id: string, name: string, category: string, visible: boolean }}
     */
    _getIndicator: function () {
      var indicator = this.indicatorsCollection.findWhere({ id: this.options.id });
      if (indicator) return indicator.toJSON()
      return null;
    },

    /**
     * Get the list of available charts for the current widget
     * @returns {string[]}
     */
    _getAvailableCharts: function () {
      return this.widgetToolbox.getAvailableCharts().filter(function (chartName) {
        var chart = this._getChartConfig(chartName);
        var indicator = this._getIndicator() || {};
        return !chart.categories || chart.categories.indexOf(indicator.category) !== -1;
      }, this);
    },

    /**
     * Show the spinning loader
     * NOTE: also empties the container
     */
    _showLoader: function () {
      this.el.innerHTML = '';
      this.el.classList.add('c-spinning-loader');
    },

    /**
     * Hide the spinning loader
     */
    _hideLoader: function () {
      this.el.classList.remove('c-spinning-loader');
    },

    /**
     * Compute the chart dimensions
     * @returns {{ width: number, height: number}}
     */
    _computeChartDimensions: function () {
      // We render the template with fake data in order to parse it as a JS object and retrieve the padding
      var chartTemplate = JSON.parse(this._getChartTemplate()({
        data: JSON.stringify([]),
        label: JSON.stringify(''),
        legendTitle: this.model.get('legendTitle'),
        preferedOrder: this.model.get('preferedOrder'),
        width: JSON.stringify(0),
        height: JSON.stringify(0)
      }));

      var containerDimensions = this.chartContainer.getBoundingClientRect();
      var chartConfig = this._getChartConfig();
      var fixedWidth = false
        || (chartConfig && chartConfig.responsive
        && chartConfig.responsive.mode === 'scroll'
        && containerDimensions.width < chartConfig.responsive.breakpoint);

      this.chartContainer.classList[fixedWidth ? 'add' : 'remove']('-scroll');

      var padding = _.extend({}, chartTemplate.padding, {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });

      var indicator = this._getIndicator();
      var width = Math.round((fixedWidth ? 1024 : containerDimensions.width) - padding.left - padding.right);
      var height = Math.round(width * this._getChartRatio());

      // Min height: 300 for pie charts
      if (chartConfig.name === 'pie') height = height < 260 ? 300 : height;
      if (chartConfig.name === 'radial') {
        width = containerDimensions.width - padding.left - padding.right;
      }

      // We save the current dimensions of the chart to diff them whenever the window is resized in order to minimize
      // the number of re-renders
      /* eslint-disable no-underscore-dangle */
      this.options._width = width;
      this.options._height = height;
      /* eslint-enable no-underscore-dangle */

      return {
        width: width,
        height: height
      };
    },

    /**
     * Return whether the mobile template of the chart should be loaded
     * @return {boolean}
     */
    _shouldLoadMobileTemplate: function () {
      if (!this.options.autoResize) return false;

      var chartContainer = this.chartContainer.getBoundingClientRect();
      var chartConfig = this._getChartConfig();

      if (!!chartConfig.responsive || chartConfig.responsive.mode !== 'adaptative') return false;

      return chartContainer.width < chartConfig.responsive.breakpoint;
    },

    /**
     * Get the chart Handlebars template
     * @returns {function}
     */
    _getChartTemplate: function () {
      var chartName = this.options.chart.replace(/ /g, '-');
      var responsive = this._shouldLoadMobileTemplate();
      
      if (chartName === 'table') return JST['templates/data_portal/table'];

      if (this.options.vegaVersion === 'V2') {
        return JST['templates/data_portal/widgets/' + chartName + (responsive ? '-mobile' : '')];
      }

      if (this.options.vegaVersion === 'V3') {
        return JST['templates/data_portal/widgets/v3/' + chartName + (responsive ? '-mobile' : '')];
      }
    },

    /**
     * Return the configuration a the chart
     * If a chart name is provided, return the config of this chart, otherwise the
     * config of the widget's chart
     * @param {string} chartName name of the chart
     * @return {object}
     */
    _getChartConfig: function (chartName) {
      return _.findWhere(App.Helper.ChartConfig, { name: chartName || this.options.chart });
    },

    /**
     * Get the chart ratio
     * @returns {number}
     */
    _getChartRatio: function () {
      var chartConfig = this._getChartConfig();
      var indicator = this._getIndicator();
      if (indicator.isFullWidth) return 0.3;
      return (chartConfig && chartConfig.ratio) || this.options.chartRatio;
    },

    /**
     * Generate the vega spec
     * @returns {object}
     */
    _generateVegaSpec: function () {
      if (!this.options.chart) {
        // If no data, we render the dedicated chart
        if (!this.model.get('data').length) {
          this.options.chart = 'empty';
        } else {
          var indicator = this._getIndicator();
          var availableCharts = this._getAvailableCharts();
          if (availableCharts.length) {
            this.options.chart = indicator.defaultChart || availableCharts[0];
          } else {
            // eslint-disable-next-line no-console
            console.warn('Unable to generate a chart out of the current dataset');
            return {};
          }
        }
      }

      var chartDimensions = this._computeChartDimensions();

      return this._getChartTemplate()({
        data: JSON.stringify(this.model.get('data')),
        legendTitle: this.model.get('legendTitle'),
        preferedOrder: this.model.get('preferedOrder'),
        width: chartDimensions.width,
        height: chartDimensions.height + 30
      });
    },

    /**
     * Render the tooltip for the filters in the detail header
     */
    _renderFiltersTooltip: function () {
      var filtersDetailNode = this.el.querySelector('.js-filters-detail');
      if (!filtersDetailNode) return;

      new App.View.FiltersTooltipView({
        refElem: filtersDetailNode,
        filters: this.options.filters.filter(function (filter) {
          return filter.id !== 'jurisdiction';
        })
      });
    },

    /**
     * Create the chart and append it to the DOM
     */
    _renderChart: function () {
      if (this.options.chart === 'table') {
        var isComplex = this._getIndicator().category === App.Helper.Indicators.CATEGORIES.ACCESS
          || this._getIndicator().category === App.Helper.Indicators.CATEGORIES.STRANDS;

        new App.View.TableView({
          el: this.chartContainer,
          collection: this.model.get('data'),
          tableName: this.model.get('title') + ' data',
          resultsPerPage: isComplex ? 10 : 3,
          resultsPerPageOptions: null
        });
      } else {
        if (this.options.vegaVersion === 'V2') {
          vg.parse
            .spec(JSON.parse(this._generateVegaSpec()), function (error, chart) {
              var chartConfig = this._getChartConfig();
              this.chart = chart({ el: this.chartContainer, renderer: 'svg' }).update();

              if (chartConfig.name === 'radial') {
                var radialWidth = 320;
                var radialDataLength = this.chart.data('final').values().length;
                if (radialDataLength > 1) {
                  this.chart.width(320 * radialDataLength).update();
                }
                window.vegaview = this.chart;
              }

              // If the chart is not auto resized, then we make it "responsive"
              if (!this.options.autoResize) {
                var svg = this.chartContainer.querySelector('svg');
                svg.setAttribute('viewBox', '0,0,' + svg.getAttribute('width') + ',' + svg.getAttribute('height'));
                svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
              }

              // We trigger an event to let the parent view know the graph has been rendered
              this.trigger('chart:render');

              this.chart.on('mouseover', this._onMouseoverChart.bind(this));
              this.chart.on('mouseout', this._onMouseoutChart.bind(this));
              this.chart.on('touchmove', this._onTouchmoveChart.bind(this));
            }.bind(this));
        }

        if (this.options.vegaVersion === 'V3') {
          var tooltipOptions = {
            theme: 'vega-v5-tooltip'
          };
          var handler = new vegaTooltip.Handler(tooltipOptions);
          this.chart = new vega.View(
            vega.parse(JSON.parse(this._generateVegaSpec()))
          ).renderer('svg').tooltip(handler.call).initialize(this.chartContainer).hover().run()
        }
      }
    },

    render: function () {
      this._renderFiltersTooltip();
      this._renderChart();
      this.setElement(this.el);
      return this.el;
    },

    renderError: function () {
      new App.View.RetryMessageView({
        el: this.el,
        label: 'Unable to load the indicator',
        callback: this._fetchData.bind(this)
      });
    }

  });

}).call(this, this.App);
