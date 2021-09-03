class VxUpload
{
    // This object encapsulates the REST calls required to upload a "document" to Voxxlr for processsing. 
    // An upload begins with a call to app.voxxlr.com/upload/initiate followed by one or more 
    // calls to app.voxxlr.com/upload/file which returns a resumable url to a Google Cloud bucket. A file
    // are then directly uploaded to Google Cloud storage. At the end, a call to app.voxxlr.com/upload/finalize  
    // starts the processing of the dataset. Soon after it will be accessible via the viewer. 
    
    constructor(key)
    {
        // this is the API key found in account screeen at after logging in at app.voxxlr.com
        this.key = key;
    }
    
    //
    // 1) Initiate an upload. This will create a unique id for the document
    //
    async initiate()
    {
        this.files = [];
        return new Promise((resolve, reject)=>
        {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", "https://app.voxxlr.com/upload/initiate", true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.key);
            xhr.onload = (e) =>
            {
                this.id = parseInt(e.currentTarget.responseText);
                resolve(this.id);
            }
            xhr.send();
        });
    }

    //
    // 2a) Upload individual files. For most datatypes this is called only once
    //  
    // file - required: Javascript file object
    // path - required: Relative path from root
    // progressCb - optional: Called repeatedly with % uploaded
    async file(file, path, progressCb)
    {
        this.progressCb = progressCb;
        return new Promise((resolve, reject)=>
        {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", "https://app.voxxlr.com/upload/file", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Content-Encoding", "gzip");
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.key);
            xhr.onload = (e) =>
            {
                //
                // 2b) perform a resumable upload to Google Cloud Storage. This is explained in more detail by Google Cloud docs
                //
                
                // Send the initial POST to Google Cloud Storage. This will rertun a url to be used in a subsequent PUT call
                this.xhr = new XMLHttpRequest();
                this.xhr.onload = (e) =>
                {
                    // url for the PUT
                    this.url = e.target.getResponseHeader("Location");
                    
                    console.log("Requesting upload (PUT) " + (this.current.size - 1) + "/" + this.current.size);
                    this.xhr = new XMLHttpRequest();
                    this.xhr.onload = this._onLoad.bind(this, resolve, reject);
                    // listen to errors to schedule a resume if possible
                    this.xhr.onerror = this._onError.bind(this, resolve, reject); 
                    if (this.progressCb)
                    {
                        this.xhr.upload.onprogress = (event) =>
                        {
                            this.progressCb((event.loaded+this.uploadOffset)/this.current.size);
                        };
                    }
                    this.xhr.open("PUT", this.url, true);
                    this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    this.xhr.setRequestHeader('Content-Range', "bytes " + 0 + "-" + (this.current.size - 1) + "/" + this.current.size);
                    this.xhr.send(this.current);
                };
                
                console.log("Initiating upload (POST)");
                // e.currentTarget.responseText contains the upload url return by https://app.voxxlr.com/upload/file
                this.xhr.open("POST", e.currentTarget.responseText, true);
                this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
                this.xhr.setRequestHeader("x-goog-resumable", "start");
                this.xhr.send();
            };
        
            this.files.push({ name: path, size: file.size });
            this.current = file;
            this.uploadOffset = 0;
            this.interval = 1000;
            xhr.send(JSON.stringify({ id: this.id, file: path }));
        });		
    }
    
    //
    // 3) Finalize the upload.
    //   
    // type - required: data type to process - either "cloud", "map", "model" or "panorama"
    // config - optional: may contain processing directives such as scalars, resolution etc. 
    // tags - optional: array of search tags
    // meta - optional: application specific data. These can later be retrieved via REST calls to doc.voxxlr.com/meta
    async finalize(type, config, tags, meta)
    {
        let request = Object.assign(
        {
            id: this.id,
            type,
            meta: Object.assign(
            { 
                source: 
                { 
                    files: this.files 
                }
            }, meta || {}),
            tags: tags || []
        }, config || {});
        
        return new Promise((resolve, reject)=>
        {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", "https://app.voxxlr.com/upload/finalize", true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.key);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Content-Encoding", "gzip");
            xhr.onload = (e) =>
            {
                resolve(JSON.parse(e.currentTarget.responseText));
            }
            xhr.send(JSON.stringify(request));
        });		
    }
    
    
    
    
    _onLoad(resolve, reject, e)
    {
        resolve();
    }
    
    _onError(resolve, reject, e)
    {
        console.log("Upload Error - " + this.xhr.readyState + "        " + this.xhr.status);
        switch (this.xhr.status)
        {
            default:
            case 500:
            case 502:
            case 503:
            case 504:
                setTimeout(() =>
                {
                    this._resumeFile(resolve, reject);
                }, this.interval);
                console.log("Rescheduling upload in " + this.interval + " ms");
                this.interval = Math.min(this.interval + 1000, 120000); 
            break;
            case 404:
                reject(this.xhr.status);
            break;
        }
    }
    
    //
    // 4) resume the file upload
    //
    // Resuming an upload requires two PUT calls to the upload url. The first determines how much of the file has 
    // arrived in the storage bucket and the seconds resumes the upload. This is fully described in the Google Cloud storage docs.
    // The key thing to note is that the request headers are slightly different in the first and second calls. 
    
    _resumeFile(resolve, reject)
    {
        console.log("Requesting upload resume bytes */" + this.current.size);
        
        //
        //get # of bytes already uploaded
        this.xhr = new XMLHttpRequest();
        this.xhr.onload = (e) =>
        {
            var range = this.xhr.getResponseHeader("Range");
            console.log("Range header = " + range);
            if (range) 
            {
                this.uploadOffset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
            }
            else
            {
                this.uploadOffset = 0;
            }
            console.log("Resuming upload from " + this.uploadOffset);
    
            this.xhr = new XMLHttpRequest();
            this.xhr.onload = this._onLoad.bind(this, resolve, reject);
            this.xhr.onerror = this._onError.bind(this, resolve, reject);
            if (this.progressCb)
            {
                this.xhr.upload.onprogress = (event) =>
                {
                    this.progressCb((event.loaded+this.uploadOffset)/this.current.size);
                };
            }
            this.xhr.open("PUT", this.url, true);
            this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
            this.xhr.setRequestHeader('Content-Range', "bytes " + this.uploadOffset + "-" + (this.current.size - 1) + "/" + this.current.size);
            
            var method;
            if ('mozSlice' in this.current) 
            {
                method = 'mozSlice';
            }
            else if ('webkitSlice' in this.current) 
            {
                method = 'webkitSlice';
            }
            else 
            {
                method = 'slice';
            }
            
            this.xhr.send(this.current[method](this.uploadOffset, this.current.size));
            
        };
        
        this.xhr.open("PUT", this.url, true);
        this.xhr.setRequestHeader('Content-Range', "bytes */" + this.current.size);
        this.xhr.onerror = this._onError.bind(this);
        this.xhr.send();
    }	
}
