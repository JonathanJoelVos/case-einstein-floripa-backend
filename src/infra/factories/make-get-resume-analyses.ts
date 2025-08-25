import { GetResumeAnalysesUseCase } from "../../application/use-cases/get-resume-analyses-use-case.js"
import { prisma } from "../database/prisma/prisma.js"
import { PrismaResumeAnalysisRepository } from "../database/prisma/repositories/prisma-resume-analysis-repository.js"
import { GetResumeAnalysesController } from "../http/controller/get-resume-analyses.controller.js"

export function makeGetResumeAnalysesController() {
  const repo     = new PrismaResumeAnalysisRepository(prisma)
  const useCase  = new GetResumeAnalysesUseCase(repo)
  return new GetResumeAnalysesController(useCase)
}
