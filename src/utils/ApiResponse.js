class ApiResponse {
    constructor(
        message = "successful API response!",
        data,
        statusCode,
    ){
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400; //status code joki 400 se kam ho wo return ho (+ve res).
    }
}
export { ApiResponse }