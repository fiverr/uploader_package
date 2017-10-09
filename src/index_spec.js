const Uploader = require('./index.js');
const {expect} = require('chai');
const {describe} = require('mocha');

describe('Uploader', () => {
    let uploader;
    beforeEach(() => {
        uploader = new Uploader('https://someurl.com', {});        
    })

    describe('File names', () => {
        it('should strip name from extention', () => {
            expect(Uploader.stripNameFromExtension('test.jpg')).to.deep.equal({ name: 'test', extension: '.jpg' });
        });
        
        it('should return the last extention', () => {
            expect(Uploader.stripNameFromExtension('test.jpg.img')).to.deep.equal({ name: 'test.jpg', extension: '.img' });
        });

        it('should return empty space when there is not extention', () => {
            expect(Uploader.stripNameFromExtension('test')).to.deep.equal({ name: 'test', extension: '' });
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
})
