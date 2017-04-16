'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KILOBYTE = 1000,
    MEGABYTE = 1024;

var UploadController = function () {
    function UploadController(_ref) {
        var url = _ref.url,
            attachments = _ref.attachments,
            maxFiles = _ref.maxFiles,
            headers = _ref.headers,
            optionsObject = _ref.optionsObject,
            updateCb = _ref.updateCb,
            onLoad = _ref.onLoad;

        _classCallCheck(this, UploadController);

        this.attachments = attachments || {};
        this.maxFiles = maxFiles || 10;
        this.url = url;
        this.optionsObject = optionsObject || {};
        this.headers = headers || {};
        this.fileCounter = Object.keys(this.attachments).length || 1;
        this.updateCb = updateCb;
        this.onLoad = onLoad;

        this.onAttach = this.onAttach.bind(this);
        this.onAbort = this.onAbort.bind(this);
    }

    _createClass(UploadController, [{
        key: 'update',
        value: function update() {
            if (!this.updateCb) {
                return;
            }

            var files = {};

            for (var attachment in this.attachments) {
                if (this.attachments[attachment].hasOwnProperty('file')) {
                    files[attachment] = this.attachments[attachment].file;
                }
            }

            this.updateCb(files);
        }
    }, {
        key: 'newFile',
        value: function newFile(file) {
            return new _service2.default(this.url, file, this.headers);
        }
    }, {
        key: 'onAttach',
        value: function onAttach(files) {
            var fileIds = this.prepareFilesForUpload(files);
            this.registerProgress(fileIds);
            this.update();
        }
    }, {
        key: 'onAbort',
        value: function onAbort(id) {
            this.attachments[id].cancel();
            delete this.attachments[id];
            this.update();
        }
    }, {
        key: 'registerProgress',
        value: function registerProgress(ids) {
            var _this = this;

            ids.forEach(function (id) {
                _this.attachments[id].onProgress(function (progress) {
                    _this.updateFileObject(id, 'progress', progress);
                    _this.update();
                });

                _this.attachments[id].upload(_this.optionsObject).then(function (uploadData) {
                    var result = {};
                    result[id] = JSON.parse(uploadData);
                    _this.updateFileObject(id, 'loaded', true);
                    _this.onLoad && _this.onLoad(result);
                });
            });
        }
    }, {
        key: 'updateFileObject',
        value: function updateFileObject(id, field, value) {
            if (this.attachments[id] && this.attachments[id].hasOwnProperty('file')) {
                this.attachments[id].file[field] = value;
            }
        }
    }, {
        key: 'prepareFilesForUpload',
        value: function prepareFilesForUpload(fileList) {
            var fileIds = [],
                fileCount = Object.keys(this.attachments).length,
                maxFilesReached = UploadController.maxFilesReached(fileCount, this.maxFiles);

            var openSlots = !maxFilesReached && this.maxFiles - fileCount;

            for (var i = 0; i < fileList.length; i++) {

                var file = fileList[i],
                    currentFile = this.newFile(file),
                    fileMeta = UploadController.getFileReady(currentFile.file),
                    addEmpty = openSlots <= 0;

                var fileId = UploadController.itemId(fileMeta.name);

                if (this.attachments[fileId]) {
                    fileId = '' + fileId + this.fileCounter;
                }

                fileMeta.sortId = this.fileCounter;
                fileMeta.id = fileId;
                this.fileCounter++;

                if (!addEmpty) {
                    openSlots--;
                    fileIds.push(fileId);
                } else {
                    fileMeta.error = 'over-max';
                }

                this.attachments[fileId] = currentFile;
            }

            return fileIds;
        }
    }], [{
        key: 'itemId',
        value: function itemId(name) {
            return 'file_' + name.match(/[a-zA-Z0-9_]/gi).join('');
        }
    }, {
        key: 'maxFilesReached',
        value: function maxFilesReached(fileCount, maxFiles) {
            return fileCount >= maxFiles;
        }
    }, {
        key: 'stripNameFromExtension',
        value: function stripNameFromExtension(name) {

            var lastDot = name.lastIndexOf('.'),
                nameLength = name.length,
                hasExtension = nameLength - lastDot <= 5;

            var extension = '';

            if (hasExtension) {
                extension = name.slice(lastDot);
                name = name.split(extension)[0];
            }

            return {
                name: name,
                extension: extension
            };
        }
    }, {
        key: 'prettyFileSize',
        value: function prettyFileSize(size) {
            var sizeInKB = Math.round(size / KILOBYTE);
            var unit = 'KB';

            if (sizeInKB < MEGABYTE) {
                return sizeInKB + unit;
            } else {
                unit = 'MB';
                var sizeInMB = (sizeInKB / MEGABYTE).toFixed(2);

                return sizeInMB + unit;
            }
        }
    }, {
        key: 'getFileReady',
        value: function getFileReady(file) {

            var fileMeta = file,
                fullName = UploadController.stripNameFromExtension(fileMeta.name),
                fileSize = UploadController.prettyFileSize(fileMeta.size);

            fileMeta.fileName = fullName.name;
            fileMeta.extension = fullName.extension;
            fileMeta.fileSize = fileSize;
            fileMeta.progress = 0;

            return fileMeta;
        }
    }]);

    return UploadController;
}();

exports.default = UploadController;
module.exports = exports['default'];