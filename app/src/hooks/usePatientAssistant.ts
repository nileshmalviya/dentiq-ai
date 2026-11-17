import { aiChatService } from '../services/aiChat.service';
import { recommendationService } from '../services/recommendation.service';
import { usePatientTranslation } from '../i18n/PatientLanguage';
import type { DentalGuidance } from '../data/patientGuidance';
import type { Doctor } from '../data/doctors';

export function usePatientAssistant() {
  const { language } = usePatientTranslation();
  return {
    sendMessage: (data: { message: string; concern: string; conversationId?: string }) => aiChatService.sendMessage<{ conversationId: string; message: { id: string; text: string }; guidance: DentalGuidance }>({ ...data, language }),
    recommend: (data: { concern: string; search?: string }) => recommendationService.getDoctors<{ doctors: Doctor[]; guidance: DentalGuidance }>({ ...data, language }),
  };
}
