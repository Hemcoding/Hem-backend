function ApiResponse(statusCode, data, message = "Success") {
        return {
            statusCode,
            data,
            message,
            success: statusCode < 400
        };
    }
    
    export { ApiResponse };