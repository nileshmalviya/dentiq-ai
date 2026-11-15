import { useState } from "react";
import type { ReactNode } from "react";
import { PatientFlowContext } from "./flowContext";
import type { ChatMessage } from "../../data/chatResponses";
import type { DentalGuidance } from "../../data/patientGuidance";
export function PatientFlowProvider({ children }: { children: ReactNode }) {
  const [conversationId,setConversationId]=useState<string>();
  const [concern, setConcern] = useState(""); const [symptoms, setSymptoms] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "greeting", sender: "assistant", text: "Hi! I’m Dentiq AI. Tell me what is bothering you, and I can help you explore dental care options. This is general guidance, not a diagnosis." }]);
  const [guidance, setGuidance] = useState<DentalGuidance | null>(null);
  return <PatientFlowContext.Provider value={{ conversationId,setConversationId,concern, setConcern, symptoms, setSymptoms, messages, setMessages, guidance, setGuidance }}>{children}</PatientFlowContext.Provider>;
}
