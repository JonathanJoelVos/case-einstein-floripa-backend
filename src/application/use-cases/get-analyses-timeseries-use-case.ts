import { success, type UseCaseResponse } from "../../core/use-case-response.js"
import type { ResumeAnalysesRepository, DailyAnalysisStat } from "../repositories/resume-analyses-repository.js"

interface GetAnalysesTimeseriesRequest {
  start: Date
  end: Date
}

type GetAnalysesTimeseriesResponse = UseCaseResponse<null, { items: DailyAnalysisStat[] }>

export class GetAnalysesTimeseriesUseCase {
  constructor(private analysesRepo: ResumeAnalysesRepository) {}

  async execute({ start, end }: GetAnalysesTimeseriesRequest): Promise<GetAnalysesTimeseriesResponse> {
    const items = await this.analysesRepo.dailyStats({ start, end })
    return success({ items })
  }
}
