const settings = require('electron-settings');
// settings.defaults({
//   'ui': {
//     'sidebar': {
//       'show': true
//     }
//   }
// });
// settings.applyDefaultsSync();
// settings.clearSync();
console.log('settings:', JSON.stringify(settings.getSync()));

var UI = {
  isInitialised: false,
  applySidebarSetting: function (shouldShowNow) {
    var _self = UI;

    if (typeof shouldShowNow !== 'boolean') {
      var showSetting = settings.getSync('ui.sidebar.show');
      shouldShowNow = showSetting;
    }

    var immediate = !_self.isInitialised;

    if (shouldShowNow) {
      _self.showSidebar(immediate);
    } else {
      _self.hideSidebar(immediate);
    }
    _self.isInitialised = true;
  },
  toggleSidebar: function () {
    var _self = this;
    var showSetting = settings.getSync('ui.sidebar.show');
    _self.applySidebarSetting(!showSetting);
  },
  showSidebar: function (immediate) {
    // console.log('immediate', immediate);
    settings.setSync('ui.sidebar.show', true);
    var newval = settings.getSync('ui.sidebar.show');

    var time = immediate ? 200 : 350;
    // console.log('time', time);
    $('.sidebar').animate({'left': 0, opacity: 1}, time);
    $('.mainContent').animate({'left': 140}, time);
  },
  hideSidebar: function (immediate) {
    // console.log('immediate', immediate);
    settings.setSync('ui.sidebar.show', false);
    var newval = settings.getSync('ui.sidebar.show');

    var time = immediate ? 200 : 350;
    // console.log('time', time);
    $('.sidebar').animate({'left': -140, opacity: 0}, time);
    $('.mainContent').animate({'left': 0}, time);
  }
};

module.exports = UI;
