var BaseModelJSON = require('./BaseModelJSON');
var Playlists;

var dataRoot = process.env.userData;
var filename = dataRoot + '/Playlists.json';

console.log('Playlists storing at ' + filename);

if (!Playlists) {
  Playlists = new BaseModelJSON(filename);
}

// Playlists.set('testentry', 'testval');
// console.log('Playlists get: ', Playlists.get());

module.exports = Playlists;
