import UploaderService from './service';

const KILOBYTE = 1000,
    MEGABYTE = 1024;

class Uploader {

    constructor({url, uploads = {}, maxFiles = 10, maxFileSize = 0, headers = {}, optionsObject = {}, updateCb, onLoad, onError, maxFilesText = '', maxFileSizeText = ''}) {

        Object.assign(this, {
            uploads,
            maxFiles,
            maxFileSize,
            url,
            optionsObject,
            headers,
            fileCounter: Object.keys(uploads).length,
            updateCb,
            onLoad,
            onError,
            maxFilesText,
            maxFileSizeText
        });

        this.onAttach = this.onAttach.bind(this);
        this.onAbort = this.onAbort.bind(this);
        this.getFiles = this.getFiles.bind(this)
    }

    static itemId(name) {
        return `file_${name.match(/[a-zA-Z0-9_]/gi).join('')}`;
    }

    static maxFilesReached(fileCount, maxFiles) {
        return fileCount >= maxFiles;
    }

    static bytesToMegabytes(bytes) {
        if (!bytes) { return 0;}
        return bytes / 1000000;
    }

    static stripNameFromExtension(name) {

        const lastDot = name.lastIndexOf('.'),
            nameLength = name.length,
            hasExtension = lastDot > 0 && (nameLength - lastDot) <= 5;

        let extension = '';

        if (hasExtension) {
            extension = name.slice(lastDot);
            name = name.split(extension)[0];
        }

        return {
            name,
            extension
        };
    }

    static prettyFileSize(size) {
        if (!size) { return '0KB'; }

        const sizeInKB = Math.round(size / KILOBYTE);

        if (sizeInKB < MEGABYTE) {
            return sizeInKB + 'KB';
        } else {
            const sizeInMB = (sizeInKB / MEGABYTE).toFixed(2);

            return sizeInMB + 'MB';
        }
    }

    static getFileReady(file) {

        const fileMeta = { name: file.name, size: file.size },
            fullName = Uploader.stripNameFromExtension(fileMeta.name),
            fileSize = Uploader.prettyFileSize(fileMeta.size);

        fileMeta.fileName = fullName.name;
        fileMeta.extension = fullName.extension;
        fileMeta.fileSize = fileSize;
        fileMeta.progress = 0;
        fileMeta.loaded = false;
        fileMeta.uploadStartTime = Date.now();

        return fileMeta;
    }

    update() {
        if (!this.updateCb) {
            return;
        }

        this.updateCb(this.getFiles());
    }

    getFiles() {
        const files = {};
        for (const upload in this.uploads) {
            if (this.uploads[upload].hasOwnProperty('file')) {
                files[upload] = this.uploads[upload].meta;
            }
        }
        return files;
    }

    newFile(file) {
        return new UploaderService(this.url, file, this.headers);
    }

    onAttach(files) {
        const fileIds = this.prepareFilesForUpload(files);
        this.registerProgress(fileIds);
        this.update();
    }

    onAbort(id) {
        this.uploads[id].cancel();
        delete this.uploads[id];
        this.update();
    }

    registerProgress(ids) {

        ids.forEach((id) => {
            this.uploads[id].onProgress((progress) => {
                this.updateFileMeta(id, 'progress', progress);
                this.update();
            });

            this.uploads[id].upload(this.optionsObject)
                .then((response) => {
                    const result = {};

                    result[id] = {
                        id
                    };

                    try {
                        result[id] = JSON.parse(response);
                    } catch (e) {
                        result[id].raw = response;
                    }

                    this.updateFileMeta(id, 'loaded', true);
                    this.updateFileMeta(id, 'onLoadResponse', result[id]);

                    this.onLoad && this.onLoad(result, this.getFiles());
                })
                .catch((error) => {
                    this.onError && this.onError({attachmentName: id, error});
                });
        });
    }

    updateFileMeta(id, field, value) {
        if (this.uploads[id] && this.uploads[id].hasOwnProperty('meta')) {
            this.uploads[id].meta[field] = value;
        }
    }

    getOpenSlots() {
        const fileCount = Object.keys(this.uploads).length;
        const maxFilesReached = Uploader.maxFilesReached(fileCount, this.maxFiles);

        if (maxFilesReached) { return 0 };

        return this.maxFiles - fileCount;
    }

    maxSizeExceeded(size) {
        if (!this.maxFileSize) { return false; }
        return this.maxFileSize < Uploader.bytesToMegabytes(size)
    }

    prepareFilesForUpload(fileList) {
        const fileIds = [];
        let openSlots = this.getOpenSlots();

        for (let i = 0; i < fileList.length; i++) {

            const file = fileList[i],
                currentFile = this.newFile(file),
                fileMeta = Uploader.getFileReady(currentFile.file);

            let fileId = Uploader.itemId(fileMeta.name);

            if (this.uploads[fileId]) {
                fileId = `${fileId}${this.fileCounter}`;
            }

            fileMeta.sortId = this.fileCounter;
            fileMeta.id = fileId;
            this.fileCounter++;

            if (this.maxSizeExceeded(fileMeta.size)) {
                fileMeta.error = this.maxFileSizeText;
            } else if (openSlots <= 0) {
                fileMeta.error = this.maxFilesText;
            } else {
                openSlots--;
                fileIds.push(fileId);
            }

            this.uploads[fileId] = currentFile;
            this.uploads[fileId].meta = fileMeta;
        }

        return fileIds;
    }
}

export default Uploader;
