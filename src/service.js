class UploaderService {
    constructor(url, file, headers) {
        this.url = url;
        this.file = file;
        this.xhr = new XMLHttpRequest();
        this.headers = headers;
    }

    upload(options) {
        return new Promise((resolve, reject) => {
            const formData = options.formData || new FormData();

            formData.append(options.field, this.file);

            if (options.additionalFields) {
                for (const field in options.additionalFields) {
                    formData.append(field, options.additionalFields[field]);
                }
            }

            this.xhr.open('POST', this.url);

            if (options.customHeaders) {
                for (const header in options.customHeaders) {
                    this.xhr.setRequestHeader(header, options.customHeaders);
                }
            }

            if (this.headers) {
                for (const header in this.headers) {
                    this.xhr.setRequestHeader(header, this.headers.header);
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