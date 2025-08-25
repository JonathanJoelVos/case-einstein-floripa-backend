import { GetAnalysesTimeseriesUseCase } from "../../application/use-cases/get-analyses-timeseries-use-case.js"
import { PrismaResumeAnalysisRepository } from "../database/prisma/repositories/prisma-resume-analysis-repository.js"
import { prisma } from "../database/prisma/prisma.js"
import { GetAnalysesTimeseriesController } from "../http/controller/get-analyses-timeseries.controller.js"

export function makeGetAnalysesTimeseriesController() {
  const analysesRepo = new PrismaResumeAnalysisRepository(prisma)
  const useCase = new GetAnalysesTimeseriesUseCase(analysesRepo)
  return new GetAnalysesTimeseriesController(useCase)
}
