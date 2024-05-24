class appError extends Error {
    constructor(message, statusCode, errorCode, url) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.url = url;
    }
}

module.exports = appError;