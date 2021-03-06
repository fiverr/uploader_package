const sinon = require('sinon');
const Uploader = require('./index.js');
const FileAPI = require('file-api');
const {
    expect
} = require('chai');
const {
    describe
} = require('mocha');

global.FormData = require('form-data');
global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
let file, fileList, uploader;
const MAX_FILES = 20;

const generateFile = () => {
    return new FileAPI.File({
        name: "abc-song.txt",
        type: "text/plain",
        buffer: new Buffer("abcdefg,hijklmnop, qrs, tuv, double-u, x, y and z")
    });
}

const initTest = (options = {}) => {
    file = generateFile();
    fileList = new FileAPI.FileList([file]);
    uploader = new Uploader(Object.assign({
        url: 'https://fiverr.com',
        maxFiles: MAX_FILES
    }, options));
};

describe('Uploader', () => {
    describe('File names', () => {
        it('should strip name from extention', () => {
            expect(Uploader.stripNameFromExtension('test.jpg')).to.deep.equal({
                name: 'test',
                extension: '.jpg'
            });
        });

        it('should return the last extention', () => {
            expect(Uploader.stripNameFromExtension('test.jpg.img')).to.deep.equal({
                name: 'test.jpg',
                extension: '.img'
            });
        });

        it('should return empty space when there is not extention', () => {
            expect(Uploader.stripNameFromExtension('test')).to.deep.equal({
                name: 'test',
                extension: ''
            });
        });
    });

    describe('File Id', () => {
        it('should start with \'file_\'', () => {
            expect(Uploader.itemId('test.jpg').startsWith('file_')).to.equal(true);
        });

        it('should allow _', () => {
            expect(Uploader.itemId('test_.jpg').startsWith('file_test_jpg')).to.equal(true);
        });

        it('should allow numbers', () => {
            expect(Uploader.itemId('1.jpg').startsWith('file_1jpg')).to.equal(true);
        });

        it('should ignore special characters', () => {
            expect(Uploader.itemId('!!1@#$@#!$.jpg').startsWith('file_1jpg')).to.equal(true);
        });
    });

    describe('Pretty File Size', () => {
        it('Default value should be 0KB', () => {
            expect(Uploader.prettyFileSize()).to.equal('0KB');
        });

        it('Should return the file size in KB when the file size is smaller than 1MB', () => {
            expect(Uploader.prettyFileSize(1023)).to.equal('1KB');
        });

        it('Should return the file size in MB when the file size is bigger or equals to 1MB', () => {
            expect(Uploader.prettyFileSize(1024 * 1000)).to.equal('1.00MB');
        });
    });

    describe('File API', () => {

        beforeEach(initTest);

        describe('getFiles', () => {
            it('Should have initial value of `0`', () => {
                const obj = uploader.getFiles();
                expect(Object.keys(obj).length).to.equals(0)
            });

            it('Should return the same keys and the uploads, (in case the file property exists)', () => {
                uploader.onAttach(fileList);
                const obj = uploader.getFiles();
                expect(Object.keys(obj).length).to.equals(1)
            });
        });

        describe('Upload/Remove a file', () => {
            it('Should append the file to the uploads property', () => {
                uploader.onAttach(fileList);
                expect(Object.keys(uploader.uploads).length).to.equal(1);
            });

            it('Should remove the file from the uploads property', () => {
                uploader.onAttach(fileList);

                const id = Uploader.itemId(file.name);
                uploader.onAbort(id);
                expect(Object.keys(uploader.uploads).length).to.equal(0);
            });
        });

        describe('File formatting', () => {
            it('Should set default values to progress and loaded', () => {
                expect(Uploader.getFileReady(file)).to.have.property('progress', 0);
                expect(Uploader.getFileReady(file)).to.have.property('loaded', false);
            });

            it('Should set the fileSize, extension and name', () => {
                const fullName = Uploader.stripNameFromExtension(file.name);
                const fileSize = Uploader.prettyFileSize(file.size);

                expect(Uploader.getFileReady(file)).to.have.property('fileName', fullName.name);
                expect(Uploader.getFileReady(file)).to.have.property('extension', fullName.extension);
                expect(Uploader.getFileReady(file)).to.have.property('fileSize', fileSize);
            });
        });

        describe('Should send the files to the on progress event', () => {
            describe('Files Limit', () => {
                it('An error message should be displayed incase limit is reached', () => {
                    uploader = new Uploader({
                        url: 'www.fiverr.com',
                        maxFilesText: 'MAX',
                        uploads: {},
                        maxFiles: 2,
                        headers: {},
                        optionsObject: {},
                        updateCb: () => {}
                    });
                    fileList = new FileAPI.FileList([file, file, file, file, file]);
                    uploader.onAttach(fileList);
                    expect(uploader.uploads['file_abcsongtxt4'].meta.hasOwnProperty('error')).to.equal(true);
                });

                it('Should return false when the number of files is greater than the max value', () => {
                    expect(Uploader.maxFilesReached(10, 4)).to.be.true;
                });
            });
        });

        describe('Check when the module updates the subscribers', () => {
            it('It should update on when a file is being added', () => {
                const spy = sinon.spy();
                uploader.update = spy;
                uploader.onAttach(fileList);
                expect(spy.called).to.equal(true);
            });

            it('It should update on file removal', () => {
                const spy = sinon.spy();
                uploader.update = spy;
                uploader.onAttach(fileList);
                uploader.onAbort(Uploader.itemId(file.name));
                expect(spy.called).to.equal(true);
            });

        });
    })
})

describe('#bytesToMegabytes', () => {
    it('Should return `0` when nothing passed', () => {
        expect(Uploader.bytesToMegabytes()).to.equal(0);
    });

    it('Should return number divided by `1000000`', () => {
        expect(Uploader.bytesToMegabytes(56972009037)).to.equal(56972.009037);
    });
});

describe('#getOpenSlots', () => {
    beforeEach(initTest);

    it('Should return initial count of open slots', () => {
        expect(uploader.getOpenSlots()).to.equal(MAX_FILES);
    });

    it('Should return current count of open slots', () => {
        uploader.onAttach(fileList);
        expect(uploader.getOpenSlots()).to.equal(MAX_FILES - 1);
    });

    it('Should return `0` if max files exceeded', () => {
        fileList = new FileAPI.FileList(new Array(MAX_FILES + 5).fill(generateFile()));
        uploader.onAttach(fileList);
        expect(uploader.getOpenSlots()).to.equal(0);
    });
});

describe('#maxSizeExceeded', () => {
    it('Should return `false` if no max file size specified', () => {
        initTest();
        expect(uploader.maxSizeExceeded(5000)).to.equal(false);
    });

    describe('Max size is defined', () => {

        beforeEach(() => initTest({
            maxFileSize: 45
        }));

        it('Should return `false` if max size is not exceeded', () => {
            expect(uploader.maxSizeExceeded(1.2e+7)).to.equal(false);
        });

        it('Should return `true` if max size is exceeded', () => {
            expect(uploader.maxSizeExceeded(4.6e+7)).to.equal(true);
        });
    });
});