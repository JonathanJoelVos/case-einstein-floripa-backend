export type Area =
  | "Ministerio"
  | "Embaixada do Amor"
  | "Vale do Silicio"
  | "Time Square"
  | "Hogwarts"
  | "Docencia"

export type SummaryStats = {
  totalAnalyses: number
  avgCultureScore: number
  withExperience: number
  educationAligned: number
  byArea: Record<Area, number>
  newAnalysesLastWindow: number
  newAnalysesPrevWindow: number
}


export type DailyAnalysisStat = {
  date: string;              
  total: number;
  avgScore: number;
  withExperience: number;
  educationAligned: number;  
}

export interface ResumeAnalysisDTO {
  id: string
  resumeId: string
  name: string | null
  email: string | null
  phone: string | null
  areas: string[]
  cultureScore: number
  cultureScoreDescription: string | null
  realExperience: boolean
  summary: string | null
  createdAt: Date
  resume: {
    id: string
    fileName: string
    fileType: string
    url: string | null
  }
}

export type FindAnalysesOrder =
  | "newest"
  | "oldest"
  | "score_desc"
  | "score_asc"

export interface FindAnalysesParams {
  page?: number
  perPage?: number
  search?: string
  order?: FindAnalysesOrder
}

export interface FindAnalysesResult {
  items: ResumeAnalysisDTO[]
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface ResumeAnalysesRepository {
  create(data: Omit<ResumeAnalysisDTO, "id" | "createdAt" | "resume">): Promise<void>
  findMany(params: FindAnalysesParams): Promise<FindAnalysesResult>
  dailyStats(params: { start: Date; end: Date }): Promise<DailyAnalysisStat[]>;
  summaryStats(params: { windowDays: number }): Promise<SummaryStats>
}
