"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _parser = require("./parser");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var iReal2MusicXML = /*#__PURE__*/function () {
  function iReal2MusicXML() {
    _classCallCheck(this, iReal2MusicXML);
  }

  _createClass(iReal2MusicXML, null, [{
    key: "convert",
    value: function convert(ireal) {
      var playlist = new _parser.Playlist(ireal); // TODO

      return [];
    }
  }]);

  return iReal2MusicXML;
}();

exports["default"] = iReal2MusicXML;