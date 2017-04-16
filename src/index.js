import UploaderService from './service';

const KILOBYTE = 1000,
    MEGABYTE = 1024;

class UploadController {

    constructor({url, attachments = {}, maxFiles = 10, headers = {}, optionsObject = {}, updateCb, onLoad, maxFilesText = ''}) {
        this.attachments = attachments;
        this.maxFiles = maxFiles;
        this.url = url;
        this.optionsObject = optionsObject;
        this.headers = headers;
        this.fileCounter = Object.keys(this.attachments).length;
        this.updateCb = updateCb;
        this.onLoad = onLoad;
        this.maxFilesText = maxFilesText;

        this.onAttach = this.onAttach.bind(this);
        this.onAbort = this.onAbort.bind(this);
    }

    static itemId(name) {
        return `file_${name.match(/[a-zA-Z0-9_]/gi).join('')}`;
    }

    static maxFilesReached(fileCount, maxFiles) {
        return fileCount >= maxFiles;
    }

    static stripNameFromExtension(name) {

        const lastDot = name.lastIndexOf('.'),
            nameLength = name.length,
            hasExtension = (nameLength - lastDot) <= 5;

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
        const sizeInKB = Math.round(size / KILOBYTE);
        let unit = 'KB';

        if (sizeInKB < MEGABYTE) {
            return sizeInKB + unit;
        } else {
            unit = 'MB';
            const sizeInMB = (sizeInKB / MEGABYTE).toFixed(2);

            return sizeInMB + unit;
        }
    }

    static getFileReady(file) {

        const fileMeta = file,
            fullName = UploadController.stripNameFromExtension(fileMeta.name),
            fileSize = UploadController.prettyFileSize(fileMeta.size);

        fileMeta.fileName = fullName.name;
        fileMeta.extension = fullName.extension;
        fileMeta.fileSize = fileSize;
        fileMeta.progress = 0;

        return fileMeta;
    }

    update() {
        if (!this.updateCb) {
            return;
        }

        const files = {};

        for (const attachment in this.attachments) {
            if (this.attachments[attachment].hasOwnProperty('file')) {
                files[attachment] = this.attachments[attachment].file;
            }
        }

        this.updateCb(files);
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
        this.attachments[id].cancel();
        delete this.attachments[id];
        this.update();
    }

    registerProgress(ids) {

        ids.forEach((id) => {
            this.attachments[id].onProgress((progress) => {
                this.updateFileObject(id, 'progress', progress);
                this.update();
            });

            this.attachments[id].upload(this.optionsObject)
                .then((uploadData) => {
                    const result = {};
                    result[id] = JSON.parse(uploadData);
                    this.updateFileObject(id, 'loaded', true);
                    this.onLoad && this.onLoad(result);
                });
        });
    }

    updateFileObject(id, field, value) {
        if (this.attachments[id] && this.attachments[id].hasOwnProperty('file')) {
            this.attachments[id].file[field] = value;
        }
    }

    prepareFilesForUpload(fileList) {
        const fileIds = [],
            fileCount = Object.keys(this.attachments).length,
            maxFilesReached = UploadController.maxFilesReached(fileCount, this.maxFiles);

        let openSlots = !maxFilesReached && this.maxFiles - fileCount;

        for (let i = 0; i < fileList.length; i++) {

            const file = fileList[i],
                currentFile = this.newFile(file),
                fileMeta = UploadController.getFileReady(currentFile.file),
                addEmpty = openSlots <= 0;

            let fileId = UploadController.itemId(fileMeta.name);

            if (this.attachments[fileId]) {
                fileId = `${fileId}${this.fileCounter}`;
            }

            fileMeta.sortId = this.fileCounter;
            fileMeta.id = fileId;
            this.fileCounter++;

            if (!addEmpty) {
                openSlots--;
                fileIds.push(fileId);
            } else {
                fileMeta.error = this.maxFilesText;
            }

            this.attachments[fileId] = currentFile;
        }

        return fileIds;
    }
}

export default UploadController;