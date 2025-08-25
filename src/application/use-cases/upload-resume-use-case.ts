import { error, success, type UseCaseResponse } from "../../core/use-case-response.js";
import { IAExtractFailed } from "../errors/ia-extract-failed.js";
import type { ResumesIA } from "../ia/resumes-ia.js";
import type { ResumeAnalysesRepository } from "../repositories/resume-analyses-repository.js";
import type { ResumesRepository } from "../repositories/resumes-repository.js";
import type { Uploader } from "../storage/uploader.js";

interface UploadResumeUseCaseRequest {
    fileName: string;
    fileType: string;
    body: Buffer;
}

type UploadResumeUseCaseResponse = UseCaseResponse<IAExtractFailed,{
    url: string;
}>

export class UploadResumeUseCase {
    constructor(
        private uploader: Uploader,
        private resumesRepository: ResumesRepository,
        private resumesIA: ResumesIA,
        private analysesRepository: ResumeAnalysesRepository
      ) {}

      async execute({ body, fileName, fileType }: UploadResumeUseCaseRequest): Promise<UploadResumeUseCaseResponse> {
        const { url } = await this.uploader.upload({ body, fileName, fileType })
    
        const { id: resumeId } = await this.resumesRepository.create({
          fileName,
          fileType,
          url,
        })
        try {
          const ai = await this.resumesIA.extractDataFromResume(fileName, fileType, body)
        
          await this.analysesRepository.create({
            resumeId,
            name: ai.name ? ai.name : null,
            email: ai.email ? ai.email : null,
            phone: ai.phone ? ai.phone : null,
            areas: ai.areas,
            cultureScore: ai.culture_score,
            realExperience: ai.real_experience,
            cultureScoreDescription: ai.culture_score_description ?? null,
            summary: ai.summary ?? null,
          })
      
          return success({ url })
        } catch (e) {
          if (resumeId) {
            await this.resumesRepository.deleteById(resumeId).catch(() => {})
          }

          await this.uploader.remove(url).catch(() => {})

          console.log(e)
    
          return error(new IAExtractFailed())
        }
    
        
      }
}