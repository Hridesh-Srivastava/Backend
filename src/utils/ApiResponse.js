class ApiResponse {
    constructor(
        statusCode, //sabse pehle statusCode rahega coz its our 1st priority, warna success="false" milega hame
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