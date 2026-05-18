export type Seniority = "student" | "junior" | "mid" | "senior" | "principal";
export type CompanyTier = "tier1_product" | "tier2_product" | "service" | "none";
export type IntentVerb = "switch" | "explore" | "need_job" | "return_to_work";

export interface LeadProfile {
  name: string;
  role?: string;
  company?: string;
  yoe?: number;
  intent?: string;
  linkedinSummary?: string;
}

export interface PersonaSignals {
  seniority: Seniority;
  companyTier: CompanyTier;
  intentVerb: IntentVerb;
  archetype: string;
  tonePrompt: string;
  emotionalCues: string[];
  primaryConcerns: string[];
}

export interface OpenQuestion {
  question: string;
  category: "curriculum" | "outcomes" | "cost" | "fit" | "logistics" | "trust" | "other";
  bdaHandledWell: boolean;
}

export interface RagChunk {
  id: string;
  source: string;
  heading: string;
  text: string;
  embedding: number[];
}

export interface RetrievedChunk {
  source: string;
  heading: string;
  text: string;
  score: number;
}

export interface PdfSection {
  title: string;
  body: string;
  citation?: string;
}

export interface PdfContent {
  greeting: string;
  hook: string;
  sections: PdfSection[];
  closingNote: string;
  cta: string;
  accentColor: string;
  programReference: string;
}

export interface Nudge {
  oneLiner: string;
  whoTheyAre: string;
  persona: string;
  angles: { angle: string; why: string }[];
  objections: { objection: string; handle: string }[];
  openingHook: string;
  inferredVsFact: string;
}

export type LeadStatus =
  | "created"
  | "nudge_sent"
  | "pdf_drafted"
  | "approved_sent"
  | "skipped";

export interface Lead {
  id: string;
  createdAt: number;
  profile: LeadProfile;
  transcript: string;
  audioFilename?: string;
  leadPhoneE164?: string;
  bdaPhoneE164: string;
  status: LeadStatus;
  persona?: PersonaSignals;
  questions?: OpenQuestion[];
  nudge?: Nudge;
  pdfContent?: PdfContent;
  coverMessage?: string;
  pdfUrl?: string;
  pdfFilename?: string;
  sentMessages?: { kind: "nudge" | "pdf"; sid: string; at: number }[];
  error?: string;
}
