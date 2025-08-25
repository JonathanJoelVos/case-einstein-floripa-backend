import type { PrismaClient } from "@prisma/client"
import type { ResumesRepository, Resume as DomainResume } from "../../../../application/repositories/resumes-repository"

export class PrismaResumesRepository implements ResumesRepository {
  constructor(private prisma: PrismaClient) {}

  async create(resume: DomainResume): Promise<{ id: string }> {
    const created = await this.prisma.resume.create({
      data: {
        url: resume.url,
        fileName: resume.fileName,
        fileType: resume.fileType,
      },
      select: { id: true }
    })
    return created
  }
  
  async deleteById(id: string): Promise<void> {
    await this.prisma.resume.delete({ where: { id } })
  }
}
