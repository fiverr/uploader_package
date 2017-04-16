'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UploaderService = function () {
    function UploaderService(url, file, headers) {
        _classCallCheck(this, UploaderService);

        this.url = url;
        this.file = file;
        this.xhr = new XMLHttpRequest();
        this.headers = headers;
    }

    _createClass(UploaderService, [{
        key: 'upload',
        value: function upload(options) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var formData = options.formData || new FormData();

                formData.append(options.field, _this.file);

                if (options.additionalFields) {
                    for (var field in options.additionalFields) {
                        formData.append(field, options.additionalFields[field]);
                    }
                }

                _this.xhr.open('POST', _this.url);

                if (options.customHeaders) {
                    for (var header in options.customHeaders) {
                        _this.xhr.setRequestHeader(header, options.customHeaders);
                    }
                }

                if (_this.headers) {
                    for (var _header in _this.headers) {
                        _this.xhr.setRequestHeader(_header, _this.headers.header);
                    }
                }

                _this.xhr.onload = function () {
                    if (_this.xhr.status >= 200 && _this.xhr.status < 300) {
                        resolve(_this.xhr.response);
                    } else {
                        reject({
                            status: _this.xhr.status,
                            statusText: _this.xhr.statusText
                        });
                    }
                };

                _this.xhr.onerror = function () {
                    reject({
                        status: _this.xhr.status,
                        statusText: _this.xhr.statusText
                    });
                };

                _this.xhr.send(formData);
            });
        }
    }, {
        key: 'onProgress',
        value: function onProgress(callback) {
            this.xhr.upload.addEventListener('progress', function (e) {
                var progress = e.loaded / e.total * 100;
                callback(progress, e);
            });
            return this.xhr;
        }
    }, {
        key: 'cancel',
        value: function cancel() {
            this.xhr.abort();
        }
    }]);

    return UploaderService;
}();

exports.default = UploaderService;
module.exports = exports['default'];