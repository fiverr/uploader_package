import UploaderService from './service';

const KILOBYTE = 1000,
    MEGABYTE = 1024;

class Uploader {

    constructor({url, attachments = {}, maxFiles = 10, headers = {}, optionsObject = {}, updateCb, onLoad, maxFilesText = ''}) {

        Object.assign(this, {
            attachments,
            maxFiles,
            url,
            optionsObject,
            headers,
            fileCounter: Object.keys(attachments).length,
            updateCb,
            onLoad,
            maxFilesText
        });

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

        if (sizeInKB < MEGABYTE) {
            return sizeInKB + 'KB';
        } else {
            const sizeInMB = (sizeInKB / MEGABYTE).toFixed(2);

            return sizeInMB + 'MB';
        }
    }

    static getFileReady(file) {

        const fileMeta = file,
            fullName = Uploader.stripNameFromExtension(fileMeta.name),
            fileSize = Uploader.prettyFileSize(fileMeta.size);

        fileMeta.fileName = fullName.name;
        fileMeta.extension = fullName.extension;
        fileMeta.fileSize = fileSize;
        fileMeta.progress = 0;
        fileMeta.loaded = false;

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
                .then((response) => {
                    const result = {};

                    result[id] = {};

                    try {
                        result[id] = JSON.parse(response);
                    } catch (e) {
                        result[id].raw = response;
                    }

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
            maxFilesReached = Uploader.maxFilesReached(fileCount, this.maxFiles);

        let openSlots = !maxFilesReached && this.maxFiles - fileCount;

        for (let i = 0; i < fileList.length; i++) {

            const file = fileList[i],
                currentFile = this.newFile(file),
                fileMeta = Uploader.getFileReady(currentFile.file),
                addEmpty = openSlots <= 0;

            let fileId = Uploader.itemId(fileMeta.name);

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

export default Uploader;