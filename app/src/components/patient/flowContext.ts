import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChatMessage } from "../../data/chatResponses";
import type { DentalGuidance } from "../../data/patientGuidance";
export interface PatientFlowState {
  conversationId: string | undefined; setConversationId: Dispatch<SetStateAction<string | undefined>>;
  concern: string; setConcern: Dispatch<SetStateAction<string>>;
  symptoms: string[]; setSymptoms: Dispatch<SetStateAction<string[]>>;
  messages: ChatMessage[]; setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  guidance: DentalGuidance | null; setGuidance: Dispatch<SetStateAction<DentalGuidance | null>>;
}
export const PatientFlowContext = createContext<PatientFlowState | null>(null);
