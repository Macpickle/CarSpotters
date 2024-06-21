const appError = require('../appError');

const errorHandler = (error, req, res, next) => {
    console.error(error);   
    if (error instanceof appError) {
        return res.redirect(`${error.url}?alert=${encodeURIComponent(error.message)}`);
    }
}

module.exports = errorHandler;