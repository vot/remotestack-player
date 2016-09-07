const settings = require('electron-settings');
const Utils = require('../lib/utils');
const Nav = require('../renderer/nav');
// settings.defaults({
//   'ui': {
//     'sidebar': {
//       'show': true
//     }
//   }
// });
// settings.applyDefaultsSync();
// settings.clearSync();
Utils.log('settingsPath: ', settings.getSettingsFilePath());
Utils.log('settings:     ', JSON.stringify(settings.getSync()));

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

    _self.preventDragRedirections();
    _self.isInitialised = true;
  },
  toggleSidebar: function () {
    var _self = this;
    var showSetting = settings.getSync('ui.sidebar.show');
    _self.applySidebarSetting(!showSetting);
  },
  showSidebar: function (immediate) {
    // Utils.log('immediate', immediate);
    settings.setSync('ui.sidebar.show', true);
    var newval = settings.getSync('ui.sidebar.show');

    var time = immediate ? 200 : 350;
    // Utils.log('time', time);
    $('.sidebar').animate({'left': 0, opacity: 1}, time);
    $('.mainContent').animate({'left': 140}, time)
      .promise().always(function () {
        $(window).trigger('resize');
      });

    $(window).trigger('resize');
  },
  hideSidebar: function (immediate) {
    // Utils.log('immediate', immediate);
    settings.setSync('ui.sidebar.show', false);
    var newval = settings.getSync('ui.sidebar.show');

    var time = immediate ? 200 : 350;
    // Utils.log('time', time);
    $('.sidebar').animate({'left': -140, opacity: 0}, time);
    $('.mainContent').animate({'left': 0}, time)
      .promise().always(function () {
        $(window).trigger('resize');
      });


  },
  bindShortcuts: function bindShortcuts () {
    var _self = this;
    Utils.log('bindShortcuts called');
    $(document).on('keydown', function(e) {
      var tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        return;
      }

      // Ctrl/Cmd + Alt + S
      if (e.altKey && (e.ctrlKey || e.metaKey) && (e.which === 83)) {
        Utils.log('Cmd+Alt+S hit');
        _self.toggleSidebar();
        return e.preventDefault();
      }
      // Ctrl/Cmd + ,
      if ((e.ctrlKey || e.metaKey) && e.which === 188) {
        Utils.log('Cmd+, hit');
        Nav.goto('preferences');
        return e.preventDefault();
      }
      // Ctrl/Cmd + .
      if ((e.ctrlKey || e.metaKey) && e.which === 190) {
        Utils.log('Cmd+. hit');
        Nav.goto('nowplaying');
        return e.preventDefault();
      }
      // F1 [112]
      if (e.which === 112) {
        Utils.log('F1 hit');
        Nav.goto('help');
        return e.preventDefault();
      }
    });
  },

  preventDragRedirections: function preventDragRedirections() {
    document.addEventListener('dragover',function(event){
      event.preventDefault();
      return false;
    },false);

    document.addEventListener('drop',function(event){
      event.preventDefault();
      return false;
    },false);
  }
};

module.exports = UI;
