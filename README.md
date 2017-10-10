# Fiverr Uploader Package
Uploader package for client side usage, handles interaction with the server, and manipulating the files uploaded through it (pretty file size calculation, extension extraction, max files counting...).

Usage:
```
import UploadController from '@fiverr/uploader';

const uploader = new UploadController({
    url: `${location.protocol}//${location.host}/message_attachments`, // your attachments route
    maxFiles: 10,
    updateCb: this.updateAttachment, // callback for updating the state in your application
    onLoad: this.onAttachmentLoad, // callback for marking a file as uploaded
    headers: {
        'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
    },
    maxFilesText: 'Max. Files Reached' // text for marking max-files-exceeded
});


uploader.onAttach(files: FileList) // Add new files to the uploader.
uploader.onDetach(fileId: string) // Remove a file from the state.
```

And then, to get all attachments:
```
    const attachments = uploader.attachmnts; // an object representing all the files uploaded
```