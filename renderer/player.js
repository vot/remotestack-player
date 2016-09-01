const ytdl = require('../lib/parsers/ytdl');
const cache = require('../lib/cache');
const playlist = require('../lib/playlist');
var settings = require('electron-settings');
var Utils = require('../lib/utils');

// function _generatePlayerMarkup(finalPath) {
//   if (!finalPath || typeof finalPath !== 'string') {
//     console.log('Invalid finalPath provided');
//     return false;
//   }
//   var rtn = '<audio preload="true" ontimeupdate="Player.updateTrackTime(this)">';
//   rtn += '<source src="' + finalPath + '" type="audio/mpeg">';
//   rtn += '</audio>';
//
//   return rtn
// }

function ensureWavesurfer() {
  if (Player.wavesurferObject) {
    return Player.wavesurferObject;
  }
  // create yourself a new WaveSurfer object
  // var WaveSurfer = require('../views/assets/js/wavesurfer/wavesurfer.js');
  var wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#88a8c6',
      progressColor: '#4a7194',
      barWidth: 1,
      height: 80,
      // width: 600,
      normalize: true,
      scrollParent: false,
      skipLength: 5

  });
  // wavesurfer.load('http://siliconfen.co/v/mp3/Infused-1.41.mp3')

  $('#WSPlay').click(function () {
    wavesurfer.playPause();
  })
  wavesurfer.on('ready', function () {
    Utils.log('Track ready');
    // wavesurfer.empty();
    wavesurfer.drawBuffer();
    // adjust volume

    // if (Player.playing) {
      wavesurfer.play();
    // }
  });

  $(window).resize(function() {
    Utils.log('Window resize');
    //Resize waveform
    // wavesurfer.empty();
    wavesurfer.drawBuffer();
  });

  wavesurfer.on('finish', function () {
    Utils.log('Track finished');
    // Player.wavesurferObject.destroy();
    // Player.wavesurferObject = null;
    Player.next();
    Player.play();
  });

  Player.wavesurferObject = wavesurfer;
}

function _interpretPlaylistItem (item, cb) {
  var cached = cache.persistent.getJSON('meta-resolved', item.url);
  if (cached) {
    return cb(cached);
  }
  item.playbackUrl = item.url;

  if (item.source === 'youtube') {
    return ytdl(item.url, function (err, info) {
      Utils.log(info);
      if (err || !info) {
        item.playbackUrl = false;
      } else {
        item.playbackUrl = info.preferredFormat.url;
      }

      cache.persistent.setJSON('meta-resolved', item.url, item);
      return cb(item);
    });
  }

  cache.persistent.setJSON('meta-resolved', item.url, item);
  return cb(item);
}

function _getPlaylistItem (item, cb) {
  var key = item.playbackUrl;
  var cached = cache.persistent.getFile('item', key);
  if (cached) {
    return cb(cached);
  }
  cache.persistent.fetchFile(key, function (filepath) {
    return filepath;
  })
}

var Player = {
  // state
  // queue: settings.getSync('streams.0.playlist'),
  queue: playlist.initialPlaylist,

  volume: 100,
  loopOne: false,
  loopAll: false,
  playing: false,
  waveformObject: null,

  ensureWavesurfer: ensureWavesurfer,
  // methods
  getElement: function getElement () {
    return $('#rsPlayerAudioContainer audio')[0];
  },

  play: function play (state) {
    Utils.log('play(' + state + ')');
    var _self = this;
    var audioTag = _self.getElement();
    if (!audioTag) {
      Utils.log('Player.play: No audio element present');
      return;
    }

    // state = state || audioTag.paused || true;
    Utils.log('state:', state)

    if (typeof state !== 'boolean') {
      Utils.log('audioTag.paused:', audioTag.paused)
      state = audioTag.paused || false;
    }

    if (state) {
      Utils.log('Playing');
      audioTag.play();
      _self.setPlayButton(false);
    } else {
      Utils.log('Pausing');
      audioTag.pause();
      _self.setPlayButton(true);
    }

    _self.updatePositionMax(_self.getElement());
  },

  prev: function prev () {
    var prevTrack = this.queue.pop();
    this.queue.unshift(prevTrack); // add track to the end of queue

    // var audioTag = this.getElement();
    // var playState = audioTag ? !audioTag.paused : false;

    this.load(prevTrack);
    // this.play(playState);
  },

  next: function next () {
    var nextTrack = this.queue.shift();
    this.queue.push(nextTrack); // add track to the end of queue

    var audioTag = this.getElement();
    var playState = audioTag ? !audioTag.paused : false;

    this.load(nextTrack);
    this.play(playState);
  },

  setPlayButton: function setPlayButton (state) {
    $('.fa.fa-play, .fa.fa-pause').removeClass('fa-play fa-pause').addClass('fa-' + (state ? 'play' : 'pause'));
  },

  setVolume: function setVolume (vol) {
    if (typeof vol !== 'number') {
      if (typeof vol === 'object') {
        var obj = $(vol);
        var objVal = obj.val();
        if (obj && objVal) {
          vol = objVal;
        } else {
          return;
        }
      } else {
        return;
      }
    }

    this.volume = vol;
    this.applyVolumeSetting();
  },

  applyVolumeSetting: function () {
    var audioTag = this.getElement();
    // Utils.log('setting volume to', this.volume)

    audioTag.volume = this.volume / 100;
  },

  // setPosition: function (sec) {
  //   var audioTag = this.getElement();
  //
  //   if (typeof sec !== 'number') {
  //     if (typeof sec === 'object') {
  //       var obj = $(sec);
  //       var objVal = obj.val();
  //       if (obj && objVal) {
  //         sec = objVal;
  //       } else {
  //         return;
  //       }
  //     } else {
  //       return;
  //     }
  //   }
  //   // Utils.log('jumping to', sec)
  //   audioTag.currentTime = sec;
  // },
  //
  // updatePositionMax: function () {
  //   var audioTag = this.getElement();
  //
  //   var positionInput = $('#rsPlayerPosition');
  //   positionInput.attr('max', Math.floor(audioTag.duration));
  // },

  // updateTrackTime: function (track) {
  //   var currTimeDiv = $('.timeElapsed');
  //   var durationDiv = $('.timeTotal');
  //
  //   var currTime = Math.floor(track.currentTime).toString();
  //   var duration = Math.floor(track.duration).toString();
  //
  //   currTimeDiv.text(Utils.formatSecondsAsTime(currTime));
  //   durationDiv.text(Utils.formatSecondsAsTime(duration));
  //
  //   // update current position on the range element
  //   var positionInput = $('#rsPlayerPosition');
  //   positionInput.val(Math.floor(currTime));
  // },

  load: function load (source) {
    var _self = this;
    var wavesurferObject = _self.ensureWavesurfer();

    // $('#currentArtist').text('asdf');
    $('#currentTitle').text(source.url);

    _interpretPlaylistItem(source, function (track) {
      Utils.log('>> _interpretPlaylistItem returned', track);
      // cache.persistent.getFile(track.playbackUrl, function (filepath) {
        // var finalPath = filepath || track.url;
        var finalPath = track.url;
        //_.get(track, 'resolved.audio', false)

        Utils.log('>> finalPath', finalPath);

        // var markup = _generatePlayerMarkup(finalPath);
        // $('#rsPlayerAudioContainer').append(markup);
        wavesurferObject.load(finalPath);
        // _self.waveformObject.load(finalPath);


        console.log('a1');
        $('#currentArtist').text(track.artist);
        $('#currentTitle').text(track.title);
        console.log('Updated');

        // _self.setVolume(_self.volume);
        // _self.updateTrackTime(_self.getElement());
        console.log('a3');

      // })
    });

  },

  bindShortcuts: function bindShortcuts () {
    const Player = require('./player');
    Utils.log('bindShortcuts called');
    $(document).on('keydown', function(e) {
      var tag = e.target.tagName.toLowerCase();

      if (tag === 'input' || tag === 'textarea') {
        return;
      }

      // 32 === space
      if (e.which === 32) {
        Utils.log('space hit');
        Player.ensureWavesurfer().playPause();
        return e.preventDefault();
      }

      if (e.which === 37) {
        // Utils.log('arrow left hit');
        Player.ensureWavesurfer().skipBackward();
        return e.preventDefault();
      }

      if (e.which === 39) {
        // Utils.log('arrow right hit');
        Player.ensureWavesurfer().skipForward();
        return e.preventDefault();
      }


      // Utils.log(e.which);
    });
  }
};

module.exports = Player;
