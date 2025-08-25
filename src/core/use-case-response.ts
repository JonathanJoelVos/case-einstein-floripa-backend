//Success
export class UseCaseSuccess<L, R> {
    readonly value: R;
  
    constructor(value: R) {
      this.value = value;
    }
  
    isError(): this is UseCaseError<L, R> {
      return false;
    }
  
    isSuccess(): this is UseCaseSuccess<L, R> {
      return true;
    }
  }
  
  export class UseCaseError<L, R> {
    readonly value: L;
  
    constructor(value: L) {
      this.value = value;
    }
  
    isError(): this is UseCaseError<L, R> {
      return true;
    }
  
    isSuccess(): this is UseCaseSuccess<L, R> {
      return false;
    }
  }
  
  export type UseCaseResponse<L, R> = UseCaseError<L, R> | UseCaseSuccess<L, R>;
  
  export const error = <L, R>(value: L): UseCaseResponse<L, R> => {
    return new UseCaseError(value);
  };
  
  export const success = <L, R>(value: R): UseCaseResponse<L, R> => {
    return new UseCaseSuccess(value);
  };
  