import { success, type UseCaseResponse } from "../../core/use-case-response.js"
import type {
    ResumeAnalysesRepository,
    FindAnalysesParams,
    FindAnalysesResult,
  } from "../repositories/resume-analyses-repository.js"
  
  type GetResumeAnalysesResponse = UseCaseResponse<null, FindAnalysesResult>
  
  export class GetResumeAnalysesUseCase {
    constructor(private analysesRepo: ResumeAnalysesRepository) {}
  
    async execute(params: FindAnalysesParams): Promise<GetResumeAnalysesResponse> {
      const result = await this.analysesRepo.findMany(params)
      return success(result)
    }
  }
  