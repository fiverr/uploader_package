const Uploader = require('./service.js');
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
})
