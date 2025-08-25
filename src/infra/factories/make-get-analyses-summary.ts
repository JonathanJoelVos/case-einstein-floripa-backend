import { prisma } from "../database/prisma/prisma.js"
import { PrismaResumeAnalysisRepository } from "../database/prisma/repositories/prisma-resume-analysis-repository.js"
import { GetAnalysesSummaryUseCase } from "../../application/use-cases/get-analyses-summary-use-case.js"
import { GetAnalysesSummaryController } from "../http/controller/get-analyses-summary.controller.js"

export function makeGetAnalysesSummaryController() {
  const repo = new PrismaResumeAnalysisRepository(prisma)
  const useCase = new GetAnalysesSummaryUseCase(repo)
  return new GetAnalysesSummaryController(useCase)
}
