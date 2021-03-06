'use strict';

const _ = require('lodash');
const os = require('os');
const PreferencesModel = require('../../models/preferences');
const Utils = require('../../lib/utils');
const FileUtils = require('../../lib/utils/fileutils');
const electron = require('electron');
const MarkupRenderer = require('../../renderer/markup');
const shell = electron.shell;

const webFrame = electron.webFrame;
webFrame.setZoomLevelLimits(1, 1);

// Utils.log('settingsPath: ', PreferencesModel.getLocation());
// Utils.log('settings:     ', JSON.stringify(_.omit(PreferencesModel.get(), 'streams'), null, 2));
const platform = os.type().toLowerCase();

const UI = {
  mousewheelMultiplier: platform === 'darwin' ? 0.5 : 1.5,
  /**
   * Resolves theme and user preferences
   */
  resolveUIPreferences: function resolveUIPreferences() {
    $('body').removeClass();
    $('#windowCtl').removeClass();

    let theme = PreferencesModel.get('ui.theme');
    if (!theme) {
      theme = 'light';
    }
    RS.Utils.log('adding style class:', theme);
    $('body').addClass(theme);



    let wCtlPos = PreferencesModel.get('ui.windowCtlPosition');
    if (!wCtlPos) {
      wCtlPos = 'left';
    }
    RS.Utils.log('adding wCtl class:', wCtlPos);
    $('#windowCtl').addClass(wCtlPos);


    let wCtlStyle = PreferencesModel.get('ui.windowCtlStyle');
    if (!wCtlStyle) {
      wCtlStyle = 'generic';
    }
    RS.Utils.log('adding wCtl class:', wCtlStyle);
    $('#windowCtl').addClass(wCtlStyle);



    let showFullPath = PreferencesModel.get('ui.showFullPath');
    console.log('showFullPath', showFullPath);
    if (typeof showFullPath === 'undefined') {
      showFullPath = false;
      PreferencesModel.set('ui.showFullPath', false);
    }

    if (showFullPath) {
      $('body').addClass('showFullPath');
    }
  },


  /**
   * Renders templates and partials and loads them into DOM
   */
  renderPartialTags: function renderPartialTags(data) {
    const self = this;
    data = data || {};

    const partialTags = $('partial');
    _.forEach(partialTags, function (tag) {
      const view = $(tag).data('view');

      console.log('processing partial:', view);
      const markup = self.render('partials/' + view, data);
      $(tag).after(markup);
      $(tag).remove();
    });
  },


  render: MarkupRenderer.render,

  /**
   * Binds all data binds and shortcuts
   */
  bindWCtl: function bindWCtl() {
    Utils.log('bindWCtlShortcuts called');

    $('*[data-toggle=window-close]').click(function () {
      RS.WindowCtl.close();
    });

    $('*[data-toggle=window-minimise]').click(function () {
      RS.WindowCtl.minimise();
    });

    $('*[data-toggle=window-maximise]').click(function () {
      RS.WindowCtl.maximise();
    });

    $('*[data-toggle=window-app-quit]').click(function () {
      RS.WindowCtl.appQuit();
    });
  },


  preventDragRedirections: function preventDragRedirections() {
    document.addEventListener('dragover', function (event) {
      event.preventDefault();
      return false;
    }, false);

    document.addEventListener('drop', function (event) {
      event.preventDefault();
      return false;
    }, false);
  },

  /**
   * Functions below migrated from NowPlaying
   */
  bindFiledrag: function bindFiledrag(id) {
    let holder;
    if (!id) {
      holder = document;
    } else {
      holder = document.getElementById(id || 'filedrag');
    }

    function onDragHandler() {
      return false;
    }
    holder.ondragover = onDragHandler;
    holder.ondragleave = onDragHandler;
    holder.ondragend = onDragHandler;

    holder.ondrop = function (e) {
      console.log(e);
      e.preventDefault();
      let allFiles = [];
      const filesArray = e.dataTransfer.files;

      for (let i = 0; i < filesArray.length; i++) {
        const f = filesArray[i];
        const filesBatch = FileUtils.unfoldFiles(f.path);
        allFiles = allFiles.concat(filesBatch);

        _.each(filesBatch, function (file) {
          RS.Playlist.add({ url: file, source: 'file', type: 'audio' });
        });

        RS.PlayerWindow.populatePlaylist();
      }

      const message = allFiles.length > 1 ? 'Tracks added' : 'Track added';
      RS.displayNotification(message);
      return false;
    };
  },


  handleExternalLinks: function handleExternalLinks(link) {
    const links = link || document.querySelectorAll('a[href]');

    Array.prototype.forEach.call(links, function (l) {
      let url = l.getAttribute('href');
      Utils.log('Detected a link to "' + url + '"');

      if (url.indexOf('http') === 0) {
        l.addEventListener('click', function (e) {
          e.preventDefault();
          shell.openExternal(url);
        });
      }

      if (url.indexOf('file') === 0) {
        l.addEventListener('click', function (e) {
          e.preventDefault();
          url = url.replace('file://', '');


          const app = electron.app || electron.remote.app;
          const userData = app.getPath('userData');
          // const tmpdir = os.tmpdir();
          // url = url.replace('$$TMPDIR', tmpdir);
          url = url.replace('$$USERDATA', userData);


          // shell.showItemInFolder(url);
          shell.openItem(url);
        });
      }
    });
  },

  showContextMenu: function showContextMenu(ev) {
    console.log('showContextMenu', $(ev).attr('id'));
  },
};

module.exports = UI;
