import type { Request, Response } from "express"
import z from "zod"
import { GetAnalysesSummaryUseCase } from "../../../application/use-cases/get-analyses-summary-use-case.js"

const qSchema = z.object({
  windowDays: z.coerce.number().min(1).max(90).default(7),
})

export class GetAnalysesSummaryController {
  constructor(private useCase: GetAnalysesSummaryUseCase) {}
  async handle(req: Request, res: Response) {
    const { windowDays } = qSchema.parse(req.query)

    const result = await this.useCase.execute({ windowDays })
    
    return res.json(result.value)
  }
}
