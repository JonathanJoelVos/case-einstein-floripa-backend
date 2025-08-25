export class IAExtractFailed extends Error {
    constructor(message?: string) {
        super(message || "Failed to extract information using AI.")
        this.name = "IAExtractFailed"
    }
}