class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "successful API response!",
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; //status code joki 400 se kam ho wo return ho (+ve res).
    }
}
export { ApiResponse }