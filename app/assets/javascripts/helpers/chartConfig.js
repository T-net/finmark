((function (App) {
  'use strict';

  // This is the configuration of all the charts used in the App
  // The format of each of them must be like:
  // {
  //   name: string,
  //   acceptedStatTypes: string[][],
  //   categories?: string[],
  //   ratio?: number,
  //   visible?: boolean
  // }
  //
  // Here is the description of each of the attributes:
  // - name: name of the chart
  // - acceptedStatTypes: refer to Jiminy's documentation
  // - categories: categories of widgets for which the chart can be used, check the
  // list in App.Helper.Indicators.CATEGORIES; if omitted, the chart is available for
  // all the categories
  // - ratio: ratio between the width and the height, if not set, use the
  // default one in App.View.ChartWidgetView
  // the ratio might not be respected if the template has an hard-coded height
  // - visible: hide the chart from the chart selector; default to true
  // - responsive:
  //     * mode: "adaptative" or "scroll"
  //         > adaptative: a different template is loaded
  //         > scroll: the widget is rendered as on desktop and the user has to scroll
  //           horizontally
  //     * breakpoint: below which size the responsive mode is activated
  //   If the value is not set, the desktop widget is rendered, without scroll
  App.Helper.ChartConfig = [
    {
      name: 'pie',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [App.Helper.Indicators.CATEGORIES.COMMON],
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'bar',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [App.Helper.Indicators.CATEGORIES.COMMON, App.Helper.Indicators.CATEGORIES.MSME_STRANDS],
      ratio: 0.5,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'stacked bar',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [App.Helper.Indicators.CATEGORIES.COMMON, App.Helper.Indicators.CATEGORIES.STRANDS],
      ratio: 0.2,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'grouped bar',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [
        App.Helper.Indicators.CATEGORIES.DEMOGRAPHICS,
        App.Helper.Indicators.CATEGORIES.DECISION_MKG,
        App.Helper.Indicators.CATEGORIES.WORK,
        App.Helper.Indicators.CATEGORIES.EARNINGS,
        App.Helper.Indicators.CATEGORIES.PHONE,
        App.Helper.Indicators.CATEGORIES.FINANCIAL_INC
      ],
      ratio: 0.5,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'heatmap',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [
        App.Helper.Indicators.CATEGORIES.DEMOGRAPHICS,
        App.Helper.Indicators.CATEGORIES.DECISION_MKG,
        App.Helper.Indicators.CATEGORIES.WORK,
        App.Helper.Indicators.CATEGORIES.EARNINGS,
        App.Helper.Indicators.CATEGORIES.PHONE,
        App.Helper.Indicators.CATEGORIES.FINANCIAL_INC
      ],
      ratio: 0.5,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'empty',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [
        App.Helper.Indicators.CATEGORIES.DEMOGRAPHICS,
        App.Helper.Indicators.CATEGORIES.DECISION_MKG,
        App.Helper.Indicators.CATEGORIES.WORK,
        App.Helper.Indicators.CATEGORIES.EARNINGS,
        App.Helper.Indicators.CATEGORIES.PHONE,
        App.Helper.Indicators.CATEGORIES.FINANCIAL_INC
      ],
      ratio: 0.5,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'stacked bar value',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [App.Helper.Indicators.CATEGORIES.STRANDS],
      ratio: 0.2,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'radial',
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ],
      categories: [
        App.Helper.Indicators.CATEGORIES.ACCESS,
        App.Helper.Indicators.CATEGORIES.STRANDS,
        App.Helper.Indicators.CATEGORIES.MSME_STRANDS,
        App.Helper.Indicators.CATEGORIES.ASSET,
        App.Helper.Indicators.CATEGORIES.SDGS,
        App.Helper.Indicators.CATEGORIES.POVERTY
      ],
      ratio: 0.3,
      responsive: {
        mode: 'scroll',
        breakpoint: 950
      }
    },
    {
      name: 'analysis',
      categories: [
        App.Helper.Indicators.CATEGORIES.ACCESS,
        App.Helper.Indicators.CATEGORIES.STRANDS,
        App.Helper.Indicators.CATEGORIES.MSME_STRANDS,
        App.Helper.Indicators.CATEGORIES.ASSET,
        App.Helper.Indicators.CATEGORIES.SDGS,
        App.Helper.Indicators.CATEGORIES.POVERTY
      ],
      visible: false,
      responsive: {
        mode: 'adaptative',
        breakpoint: 430
      }
    },
    {
      name: 'compare',
      categories: [
        App.Helper.Indicators.CATEGORIES.ACCESS,
        App.Helper.Indicators.CATEGORIES.STRANDS,
        App.Helper.Indicators.CATEGORIES.MSME_STRANDS,
        App.Helper.Indicators.CATEGORIES.ASSET,
        App.Helper.Indicators.CATEGORIES.POVERTY
      ],
      visible: false,
      ratio: 0.3,
      responsive: {
        mode: 'scroll',
        breakpoint: 950
      }
    },
    {
      name: 'table',
      // We don't really care about the types here
      acceptedStatTypes: [
        ['nominal'],
        ['ordinal'],
        ['quantitative']
      ]
    }
  ];
})(this.App));
