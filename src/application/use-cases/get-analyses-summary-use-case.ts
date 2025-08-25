import { success, type UseCaseResponse } from "../../core/use-case-response.js"
import type { ResumeAnalysesRepository, SummaryStats } from "../repositories/resume-analyses-repository.js"

type ResponseShape = SummaryStats & { lastWindowChangePct: number }

export class GetAnalysesSummaryUseCase {
  constructor(private repo: ResumeAnalysesRepository) {}

  async execute({ windowDays = 7 }: { windowDays?: number }): Promise<UseCaseResponse<null, ResponseShape>> {
    const s = await this.repo.summaryStats({ windowDays })

    const prev = s.newAnalysesPrevWindow
    const last = s.newAnalysesLastWindow
    const lastWindowChangePct =
      prev === 0 ? (last > 0 ? 100 : 0) : ((last - prev) / prev) * 100

    return success({
      ...s,
      lastWindowChangePct,
    })
  }
}
