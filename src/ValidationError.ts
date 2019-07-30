export class ValidationError extends Error {

    public errorType?: string;
    public location?: string;

    constructor(msg: string, errorType?: string, location?: string) {
        super(msg);
        if (errorType)
            this.errorType = errorType;
        if (location)
            this.location = location;
    }

}
