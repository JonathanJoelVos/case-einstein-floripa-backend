import type { Request, Response } from "express"
import z from "zod"
import { GetAnalysesTimeseriesUseCase } from "../../../application/use-cases/get-analyses-timeseries-use-case.js"

const qSchema = z.object({
  days: z.coerce.number().min(1).max(365).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
}).refine((q) => q.days || (q.start && q.end), {
  message: "Informe ?days=… ou ?start=…&end=…",
})

export class GetAnalysesTimeseriesController {
  constructor(private useCase: GetAnalysesTimeseriesUseCase) {}

  async handle(req: Request, res: Response) {
    const q = qSchema.parse(req.query)

    let start: Date
    let end: Date

    if (q.days) {
      end = new Date()
      start = new Date()
      start.setDate(end.getDate() - q.days)
    } else {
      start = q.start!
      end = q.end!
    }

    const result = await this.useCase.execute({ start, end })
    return res.json(result.value)
  }
}
