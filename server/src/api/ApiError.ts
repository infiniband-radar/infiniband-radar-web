export class ApiError {

    public readonly message: string;
    public readonly status: number;
    public readonly name: string;

    constructor(message: string, status: number) {
        this.message = message;
        this.status = status;
        this.name = new.target.name;
    }
}
