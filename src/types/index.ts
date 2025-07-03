export type Industry = "Insurance" | "Healthcare" | "Aviation" | "E-commerce" | "Miscellaneous" | "Custom" | "Transport";

export interface Transcript {
  text: string;
  timestamp: string;
  isUser: boolean;
}

export interface CallState {
  isActive: boolean;
  agentName: string;
  transcripts: Transcript[];
  audioUrl?: string;
} 