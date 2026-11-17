export type PatientLanguage = 'en' | 'hi';
// Canonical tokens feed the existing rules and doctor filters; records stay unchanged.
const aliases: [RegExp, string][] = [
  [/सा[ँं]स\s*लेने\s*में\s*(?:कठिनाई|दिक्कत|परेशानी)|सा[ँं]स\s*नहीं\s*(?:आ|ले)|sa+a+ns?\s*(?:lene\s*me(?:in)?\s*(?:dikkat|taklif|takleef)|nahi\s*(?:aa|le))|निगलने\s*में\s*(?:कठिनाई|दिक्कत)|nigalne\s*me(?:in)?\s*(?:dikkat|taklif|takleef)/gi, ' difficulty breathing '],
  [/(?:खून|रक्त|khoon|khun).{0,20}(?:नहीं\s*रुक|रुक\s*नहीं|nahi\s*ruk|ruk\s*nahi)|बहुत\s*(?:खून|रक्त)/gi, ' uncontrolled bleeding '],
  [/ब्रेसे[ज़जस]़?|ब्रेसिज|दाँत\s*सीधे|टेढ़े\s*द[ाँां]त|tedhe\s*da+a+nt|da+a+nt\s*seedhe/gi, ' braces '],
  [/अलाइनर/gi, ' aligner '], [/रूट\s*कैनाल/gi, ' root canal '],
  [/संवेदनशील|झनझनाहट|ठंडा|गर्म|thanda|garam|jhanjhanahat/gi, ' sensitive '],
  [/दर्द|दुख|dard|darad|dukh/gi, ' pain '], [/चबाने|काटने|chabane/gi, ' chewing '],
  [/सूजन|sujan|soojan/gi, ' swelling '], [/मसूड़[ेों]|masood[ae]/gi, ' gum '],
  [/सफाई|safai/gi, ' cleaning '], [/इम्प्लांट|इंप्लांट/gi, ' implant '],
  [/दाँत\s*निकाल|दांत\s*निकाल/gi, ' extraction '], [/फिलिंग/gi, ' filling '],
  [/सफेदी/gi, ' whitening '], [/क्राउन|कैप/gi, ' crown '],
];
export function normalizePatientConcern(text: string) {
  return aliases.reduce((value, [pattern, token]) => value.replace(pattern, token), text.normalize('NFC'));
}
export const guidanceMessages = {
  en: { general: 'A dental examination is needed to determine the cause and appropriate care. These rule-based suggestions are general guidance, not a diagnosis.', emergency: 'Seek emergency medical care now for breathing or swallowing difficulty, or heavy bleeding that will not stop. Do not wait for a routine dental booking.' },
  hi: { general: 'समस्या का कारण और सही देखभाल तय करने के लिए दंत चिकित्सक से जाँच करवाना ज़रूरी है। नियमों पर आधारित ये सुझाव केवल सामान्य जानकारी हैं, निदान नहीं।', emergency: 'साँस लेने या निगलने में कठिनाई हो, या बहुत खून बह रहा हो और रुक न रहा हो, तो तुरंत आपातकालीन चिकित्सा लें। सामान्य दंत अपॉइंटमेंट का इंतज़ार न करें।' },
};
