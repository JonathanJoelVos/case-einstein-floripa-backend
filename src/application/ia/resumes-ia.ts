
export interface ResumesIA {
    extractDataFromResume(
      fileName: string,
      fileType: string,
      body: Buffer
    ): Promise<{
      name: string | null;
      email: string | null;
      phone: string | null;
      areas: string[];
      culture_score: number;
      real_experience: boolean;
      culture_score_description?: string | null;
      summary?: string | null;
    }>;
  }