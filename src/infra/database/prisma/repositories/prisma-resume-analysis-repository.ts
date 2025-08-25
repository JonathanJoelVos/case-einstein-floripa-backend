import type { PrismaClient } from "@prisma/client"
import type { Area, DailyAnalysisStat, FindAnalysesOrder, FindAnalysesParams, FindAnalysesResult, ResumeAnalysesRepository, ResumeAnalysisDTO, SummaryStats } from "../../../../application/repositories/resume-analyses-repository"


const AREAS: Area[] = [
  "Ministerio",
  "Embaixada do Amor",
  "Vale do Silicio",
  "Time Square",
  "Hogwarts",
  "Docencia",
]

const orderMap: Record<FindAnalysesOrder, any> = {
  newest:     { createdAt: "desc" },
  oldest:     { createdAt: "asc"  },
  score_desc: { cultureScore: "desc" },
  score_asc:  { cultureScore: "asc"  },
}

export class PrismaResumeAnalysisRepository implements ResumeAnalysesRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ResumeAnalysisDTO, "id" | "createdAt" | "resume">): Promise<void> {
    await this.prisma.resumeAnalysis.create({
      data: {
        resumeId: data.resumeId,
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        areas: data.areas,
        cultureScore: data.cultureScore,
        cultureScoreDescription: data.cultureScoreDescription,
        realExperience: data.realExperience,
        summary: data.summary,
      },
    })
  }

  async findMany(params: FindAnalysesParams): Promise<FindAnalysesResult> {
    const page    = Math.max(1, Number(params.page ?? 1))
    const perPage = Math.min(100, Math.max(1, Number(params.perPage ?? 20)))
    const skip    = (page - 1) * perPage
    const orderBy = orderMap[params.order ?? "newest"]

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.resumeAnalysis.count(),
      this.prisma.resumeAnalysis.findMany({
        orderBy,
        skip,
        take: perPage,
        include: {
          resume: { select: { id: true, fileName: true, fileType: true, url: true } },
        },
      }),
    ])

    const items: ResumeAnalysisDTO[] = rows.map(r => ({
      id: r.id,
      resumeId: r.resumeId,
      name: r.name || null,
      email: r.email || null,
      phone: r.phone || null,
      areas: r.areas,
      cultureScore: r.cultureScore,
      cultureScoreDescription: r.cultureScoreDescription,
      realExperience: r.realExperience,
      summary: r.summary,
      createdAt: r.createdAt,
      resume: {
        id: r.resume.id,
        fileName: r.resume.fileName,
        fileType: r.resume.fileType,
        url: r.resume.url,
      },
    }))

    return {
      items,
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    }
  }

  async dailyStats({ start, end }: { start: Date; end: Date }): Promise<DailyAnalysisStat[]> {
    const rows: Array<{
      date: string
      total: number
      avgScore: number
      withExperience: number
      educationAligned: number
    }> = await this.prisma.$queryRaw`
      SELECT
        to_char(DATE("createdAt"), 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "total",
        AVG("cultureScore")::float AS "avgScore",
        SUM(CASE WHEN "realExperience" THEN 1 ELSE 0 END)::int AS "withExperience",
        SUM(
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest("areas") a
            WHERE a IN ('Docencia','Hogwarts')
          ) THEN 1 ELSE 0 END
        )::int AS "educationAligned"
      FROM "ResumeAnalysis"
      WHERE "createdAt" BETWEEN ${start} AND ${end}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt");
    `

    return rows
  }

  async summaryStats({ windowDays }: { windowDays: number }): Promise<SummaryStats> {
    const prevDays = windowDays * 2

    const [overall] = await this.prisma.$queryRaw<Array<{
      total: number
      avgScore: number
      withExperience: number
      educationAligned: number
    }>>`
      SELECT
        COUNT(*)::int AS "total",
        COALESCE(AVG("cultureScore"), 0)::float AS "avgScore",
        SUM(CASE WHEN "realExperience" THEN 1 ELSE 0 END)::int AS "withExperience",
        SUM(
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest("areas") a
            WHERE a IN ('Docencia','Hogwarts')
          ) THEN 1 ELSE 0 END
        )::int AS "educationAligned"
      FROM "ResumeAnalysis";
    `

    const areaRows = await this.prisma.$queryRaw<Array<{ area: Area; count: number }>>`
      SELECT a AS "area", COUNT(*)::int AS "count"
      FROM "ResumeAnalysis", unnest("areas") AS a
      GROUP BY a;
    `
    const byArea: Record<Area, number> = Object.fromEntries(
      AREAS.map((a) => [a, 0] as const)
    ) as Record<Area, number>
    for (const r of areaRows) {
      if (AREAS.includes(r.area)) byArea[r.area] = r.count
    }

    const [windowCounts] = await this.prisma.$queryRaw<Array<{
      lastWindow: number
      prevWindow: number
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - (INTERVAL '1 day' * ${windowDays}))::int AS "lastWindow",
        COUNT(*) FILTER (
          WHERE "createdAt" >= NOW() - (INTERVAL '1 day' * ${prevDays})
            AND "createdAt" < NOW() - (INTERVAL '1 day' * ${windowDays})
        )::int AS "prevWindow"
      FROM "ResumeAnalysis";
    `

    return {
      totalAnalyses: overall?.total ?? 0,
      avgCultureScore: overall?.avgScore ?? 0,
      withExperience: overall?.withExperience ?? 0,
      educationAligned: overall?.educationAligned ?? 0,
      byArea,
      newAnalysesLastWindow: windowCounts?.lastWindow ?? 0,
      newAnalysesPrevWindow: windowCounts?.prevWindow ?? 0,
    }
  }
}
