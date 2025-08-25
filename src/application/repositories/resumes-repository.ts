export interface Resume {
    id?: string
    url: string
    fileName: string
    fileType: string
    createdAt?: Date
  }

export interface ResumesRepository {
    create(resume: Resume): Promise<{ id: string }>;
    deleteById(id: string): Promise<void>;
}