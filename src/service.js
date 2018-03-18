class UploaderService {
    constructor(url, file, headers) {
        this.url = url;
        this.file = file;
        this.meta = {};
        this.xhr = new XMLHttpRequest();
        this.headers = headers;
    }

    upload({formData = new FormData(), field, additionalFields, customHeaders}) {
        return new Promise((resolve, reject) => {

            if (additionalFields) {
                for (const fieldName in additionalFields) {
                    formData.append(fieldName, additionalFields[fieldName]);
                }
            }

            formData.append('content-type', this.file.type);
            formData.append(field, this.file);

            this.xhr.open('POST', this.url);

            if (customHeaders) {
                for (const header in customHeaders) {
                    this.xhr.setRequestHeader(header, customHeaders);
                }
            }

            if (this.headers) {
                for (const header in this.headers) {
                    this.xhr.setRequestHeader(header, this.headers[header]);
                }
            }

            this.xhr.onload = () => {
                if (this.xhr.status >= 200 && this.xhr.status < 300) {
                    resolve(this.xhr.response);
                } else {
                    reject({
                        status: this.xhr.status,
                        statusText: this.xhr.statusText
                    });
                }
            };

            this.xhr.onerror = () => {
                reject({
                    status: this.xhr.status,
                    statusText: this.xhr.statusText
                });
            };

            this.xhr.send(formData);
        });
    }

    onProgress(callback) {
        this.xhr.upload.addEventListener('progress', (e) => {
            const progress = e.loaded / e.total * 100;
            callback(progress, e);
        });
        return this.xhr;
    }

    cancel() {
        this.xhr.abort();
    }
}

export default UploaderService;