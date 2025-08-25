import express from "express"
import multer from "multer"
import { makeUploadResumeController } from "../../factories/make-upload-resume.js"
import { makeGetResumeAnalysesController } from "../../factories/make-get-resume-analyses.js"
import { makeGetAnalysesTimeseriesController } from "../../factories/make-get-analyses-timeseries.js"
import { makeGetAnalysesSummaryController } from "../../factories/make-get-analyses-summary.js"

export const resumesRouter = express.Router()

const parser = multer({ storage: multer.memoryStorage() })

const uploadController = makeUploadResumeController()
const timeseriesController = makeGetAnalysesTimeseriesController()
const listController = makeGetResumeAnalysesController()
const summaryController = makeGetAnalysesSummaryController()

resumesRouter.post("/resumes/upload", parser.single("cv"), (req, res) =>
  uploadController.handle(req, res)
)

resumesRouter.get("/resumes/analyses", (req, res) =>
  listController.handle(req, res)
)

resumesRouter.get("/resumes/analyses/timeseries", (req, res) =>
  timeseriesController.handle(req, res)
)

resumesRouter.get("/resumes/analyses/summary", (req, res) =>
  summaryController.handle(req, res)
)
