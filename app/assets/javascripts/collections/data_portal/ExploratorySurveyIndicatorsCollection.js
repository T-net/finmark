(function (App) {
  'use strict';

  var categories = App.Helper.Indicators.CATEGORIES;

  var MOBILE_SURVEYS_INDICATORS = [
    { id: 'geographic_area', name: 'Geographic Area', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Rural', 'Urban'] },
    { id: 'region', name: 'Province / Region', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false},
    { id: 'division', name: 'Division', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false},
    { id: 'age', name: 'Age', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['18-24', '25-34', '35-44', '45-54', '55+'] },
    { id: 'gender', name: 'Gender', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false},
    { id: 'i2i_Marital_Status', name: 'Marital Status', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true },
    { id: 'household_size', name: 'Mean household size', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Above mean size', 'Mean', 'Below mean size'] },
    { id: 'i2i_Education', name: 'Level of education', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, isFullWidth: true, preferedOrder: ['No formal education', 'Primary education', 'Secondary education', 'Higher education', 'Other'] },
    { id: 'main_lan', name: 'Main language', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, isFullWidth: true },
    { id: 'english_literacy', name: 'English literacy', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false, preferedOrder: ['Excellent', 'Good', 'Fair', 'Poorly', 'Not at all'] },
    { id: 'swahili_literacy', name: 'Swahili literacy', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false},
    { id: 'language_literacy', name: 'Read & write in any language', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: false}, 
    { id: 'interview_lan', name: 'Language of interview', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true },
    { id: 'poverty_line', name: 'Poverty line', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Above poverty line', 'Below poverty line'] },
    { id: 'migrant_work', name: 'Migrant worker identity', category: categories.DEMOGRAPHICS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Me', 'Spouse', 'Other family', 'No-one, all live together'] },
  
    { id: 'land_decission', name: 'Land decision maker', category: categories.OWNERSHIP_AND_CONTROL, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Decide alone', 'Decide with others', 'Others decide without me', 'Don’t own land'] },
    { id: 'land_owner', name: 'Land ownership', category: categories.OWNERSHIP_AND_CONTROL, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Own by self', 'Own with others', 'Don’t own'] },
    { id: 'own_phone', name: 'Own a phone', category: categories.OWNERSHIP_AND_CONTROL, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Own phone', 'Own phone/Business/Employer', 'Don’t own phone'] },
    { id: 'who_phone', name: 'Phone ownership', category: categories.OWNERSHIP_AND_CONTROL, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Own phone/Business/Employer', 'Own phone', 'Husband/Wives', 'Parent', 'Sibling', 'Children', 'Other man/Women', 'Don’t use mobile phone'] },
    { id: 'phone_use', name: 'Independent phone use', category: categories.OWNERSHIP_AND_CONTROL, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Yes', 'Somewhat', 'No'] },

    { id: 'saving_goal_deccision', name: 'Savings goal decision maker', category: categories.AGENCY_AND_DECISION_MAKING, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Self alone', 'Decide together', 'Others on behalf', 'No savings goal'] },
    { id: 'saving_goal_influence', name: 'Savings goal influence', category: categories.AGENCY_AND_DECISION_MAKING, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Always accepted', 'Sometimes accepted/Rejected', 'Always rejected', 'Don’t consult', 'No savings goal'] },
    { id: 'spending_decission', name: 'Spending decision maker', category: categories.AGENCY_AND_DECISION_MAKING, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Fully on own', 'Help from someone else', 'Someone else decides'] },

    { id: 'raise_gni', name: 'Possibility to raise 1/20 GNI (Gross National Income)', category: categories.INCOME, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Not at all possible', 'Not very possible', 'Somewhat possible', 'Very possible'] },
    { id: 'freq_inconme_spouse', name: 'Income frequency of spouse', category: categories.INCOME, defaultChart: 'grouped bar', visible: true, isFullWidth: true, preferedOrder: ['Daily', 'Weekly/Biweekly', 'Monthly', 'When they get work', 'Work unpaid', 'Don’t work', 'Don’t know', 'No spouse'] }, 
    { id: 'main_income_earned', name: 'Main income earner', category: categories.INCOME, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Respondent', 'Spouse', 'Earn equally', 'Other fam', 'Other', 'Don’t know'] },
    { id: 'earning_freq', name: 'Earning frequency', category: categories.INCOME, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Daily', 'Weekly/Biweekly', 'Monthly', 'Infrequently', 'When I get work', 'Work unpaid', 'I don’t work']},

    { id: 'allow_spouse_work', name: 'Allow spouse to work', category: categories.GENDER_NORMS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Yes', 'No', 'Not married', ] },
    { id: 'permission_work', name: 'Permission to work', category: categories.GENDER_NORMS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Already working', 'Yes', 'No'] },
    { id: 'children_decission', name: 'Children decision maker', category: categories.GENDER_NORMS, defaultChart: 'grouped bar', visible: true, isFullWidth: true, preferedOrder: ['Decide alone', 'Decide together', 'Spouse decides', 'We do not talk about it', 'Others decide', 'Not married', 'Not in relationship'] },
    { id: 'bank_permission', name: 'Permission to open bank', category: categories.GENDER_NORMS, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Yes', 'No'] },

    { id: 'phone_use_financial', name: 'Informal financial usage', category: categories.FINANCIAL_INC, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Yes', 'No'] },
    { id: 'mobile_money', name: 'Mobile Money', category: categories.FINANCIAL_INC, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Yes', 'No'] },
    { id: 'bank', name: 'Bank', category: categories.FINANCIAL_INC, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Own', 'Spouse', 'Other fam', 'Other', 'Unbanked'] },
    { id: 'account_money_taken', name: 'Money taken from account', category: categories.FINANCIAL_INC, defaultChart: 'grouped bar', visible: true, preferedOrder: ['Money not taken', 'Money taken', 'Don’t have account'] }
  ];
  
  App.Collection.ExploratorySurveyIndicatorsCollection = Backbone.Collection.extend({

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
      var indicators = MOBILE_SURVEYS_INDICATORS.map(function (indicator) {
        return Object.assign(indicator, { isMobileSurvey: true });
      });
      this.set(indicators);
      deferred.resolve(indicators);
      return deferred;
    },

    getVisibleIndicators: function () {
      return this.toJSON().filter(function (indicator) {
        return indicator.visible;
      });
    }
  });
}).call(this, this.App);
