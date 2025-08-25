import path from "node:path"
import { MulterDiskStorage } from "../storage/multer-disk-storage.js"
import { UploadResumeUseCase } from "../../application/use-cases/upload-resume-use-case.js"
import { UploadResumeController } from "../http/controller/upload-resume.controller.js"
import { PrismaResumesRepository } from "../database/prisma/repositories/prisma-resumes-repository.js"
import { prisma } from "../database/prisma/prisma.js"
import { PrismaResumeAnalysisRepository } from "../database/prisma/repositories/prisma-resume-analysis-repository.js"
import { GeminiResumesIA } from "../ia/gemini-resumes-ia.js"

export function makeUploadResumeController(env = process.env) {
  const dir = env.UPLOAD_DIR ?? path.resolve("uploads")
  const publicBaseUrl = env.PUBLIC_UPLOAD_BASE ?? "/uploads"

  const uploader = new MulterDiskStorage({ dir, publicBaseUrl })
  const resumesRepo = new PrismaResumesRepository(prisma)
  const analysesRepo = new PrismaResumeAnalysisRepository(prisma)

  const geminiApiKey = env.GEMINI_API_KEY!
  const geminiModel  = env.GEMINI_MODEL ?? "gemini-2.5-flash"
  const resumesIA = new GeminiResumesIA(geminiApiKey, { model: geminiModel })

  const useCase = new UploadResumeUseCase(uploader, resumesRepo, resumesIA, analysesRepo)
  return new UploadResumeController(useCase)
}
