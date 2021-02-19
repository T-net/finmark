(function (App) {
  'use strict';

  var INDICATORS = [    
    { id: 'geographic_area', name: 'Geographic area', category: 'Common indicators', visible: false },
    { id: 'gender', name: 'Gender', category: 'Common indicators', visible: false },
    { id: 'age',name: 'Age', category: 'Common indicators', visible: false },
    { id: 'i2i_Marital_Status', name: 'Marital status', category: 'Common indicators', visible: false },
    { id: 'i2i_Education', name: 'Level of education', category: 'Common indicators', visible: true },
    { id: 'i2i_Income_Sources', name: 'Sources of income', category: 'Common indicators', visible: true },
    { id: 'water_source_type', name: 'Water source', category: 'Common indicators', visible: false },
    { id: 'toilet_type', name: 'Toilet type', category: 'Common indicators', visible: false },
    { id: 'cooking_energy_type', name: 'Cooking energy', category: 'Common indicators', visible: false },
    { id: 'electricity_access_type', name: 'Electricity access', category: 'Common indicators', visible: false },

    { id: 'fas_strand', name: 'Financial services uptake', category: 'Financial access', visible: true },
    { id: 'savings_strand', name: 'Savings', category: 'Financial access', visible: true },
    { id: 'credit_strand', name: 'Credit', category: 'Financial access', visible: true },
    { id: 'remittances_strand', name: 'Send and receive money', category: 'Financial access', visible: false },
    { id: 'insurance_strand', name: 'Insurance', category: 'Financial access', visible: false },

    { id: 'total_fas_strand', name: 'Financial access strands', category: 'Strands', visible: false },
    { id: 'total_saving_strand', name: 'Savings strands', category: 'Strands', visible: false },
    { id: 'total_remittances_strand', name: 'Remittances strands', category: 'Strands', visible: false },
    { id: 'total_insurance_strand', name: 'Insurance strands', category: 'Strands', visible: false },
    { id: 'total_credit_strand', name: 'Credit strands', category: 'Strands', visible: false },

    { id: 'asset_strand', name: 'Comfortable assets', category: 'Asset', visible: false },
    { id: 'asset_strand', name: 'Basic assets', category: 'Asset', visible: false },
    { id: 'asset_strand', name: 'Average assets', category: 'Asset', visible: false },
    { id: 'total_asset_strand', name: 'Asset ladder', category: 'Asset', visible: false },

    { id: 'sdgs_strand', name: 'Health symptom', category: 'SDGs', visible: false },
    { id: 'sdgs_strand', name: 'Hunger symptom', category: 'SDGs', visible: false },
    { id: 'sdgs_strand', name: 'Education symptom', category: 'SDGs', visible: false },
    { id: 'sdgs_strand', name: 'Formally employed', category: 'SDGs', visible: false },

    { id: 'poverty_line', name: 'Poverty line', category: 'Poverty', visible: false },
    { id: 'usd_per_day', name: 'USD per day', category: 'Poverty', visible: false }
  ];

  App.Collection.IndicatorsCollection = Backbone.Collection.extend({

    comparator: function (a, b) {
      var aIsAComplex = a.get('category') === App.Helper.Indicators.CATEGORIES.ACCESS
        || a.get('category') === App.Helper.Indicators.CATEGORIES.STRANDS;
      var bIsComplex = b.get('category') === App.Helper.Indicators.CATEGORIES.ACCESS
        || b.get('category') === App.Helper.Indicators.CATEGORIES.STRANDS;
      if (aIsAComplex && !bIsComplex) return -1;
      if (!aIsAComplex && bIsComplex) return 1;
      return 0;
    },

    fetch: function () {
      var deferred = $.Deferred();
      this.set(INDICATORS);
      deferred.resolve(INDICATORS);
      return deferred;
    },

    getVisibleIndicators: function () {
      return this.toJSON().filter(function (indicator) {
        return indicator.visible;
      });
    }
  });
}).call(this, this.App);
