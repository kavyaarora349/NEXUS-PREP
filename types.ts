
export interface Question {
  id: number;
  text: string;
  marks: number;
  section: string;
}

export interface QuestionPaper {
  id: string;
  university: string;
  subject: string;
  semester: string;
  studentName: string;
  date: string;
  timeAllowed: string;
  maxMarks: number;
  sections: {
    name: string;
    instructions: string;
    questions: Question[];
  }[];
}

export interface GenerationParams {
  studentName: string;
  semester: string;
  subject: string;
  notesText: string;
}
