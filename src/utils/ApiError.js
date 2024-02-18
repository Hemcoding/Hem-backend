function createApiError(statusCode, message = "Something went wrong", errors = [], stack = "") {
        const error = {
            statusCode: statusCode,
            data: null,
            message: message,
            success: false,
            errors: errors
        };
    
        if (stack) {
            error.stack = stack;
        } else {
            Error.captureStackTrace(error, createApiError);
        }
    
        return error;
    }
    
    export { createApiError };