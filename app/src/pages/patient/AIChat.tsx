import { usePatientTranslation } from '../../i18n/PatientLanguage';
import { usePatientAssistant } from '../../hooks/usePatientAssistant';
import {reportError} from '../../utils/apiEvents';
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Paperclip, Send, Sparkles } from "lucide-react";
import { PatientHeader } from "../../components/platform/PlatformUI";
import { EmergencyGuidance } from "../../components/patient/EmergencyGuidance";
import { usePatientFlow } from "../../components/patient/usePatientFlow";
import { useAuth } from "../../auth/useAuth";
import { followUpSymptoms } from "../../data/patientGuidance";

export function AIChat() {
  const { tr } = usePatientTranslation();

  const { user } = useAuth(); const assistant = usePatientAssistant();
  const { conversationId,setConversationId,concern, setConcern, symptoms, setSymptoms, messages, setMessages, guidance, setGuidance } = usePatientFlow();
  const [input, setInput] = useState(""); const [attachment, setAttachment] = useState("");
  const scroll = useRef<HTMLDivElement>(null); const fileInput = useRef<HTMLInputElement>(null);
  const liveGuidance = guidance;
  const hasAnswer = symptoms.length > 0 || messages.filter(message => message.sender === "user").length > 1;
  function moveToLatest() { requestAnimationFrame(() => scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "auto" })); }
  const [pending,setPending]=useState(false);
  async function addMessage(text:string){if(!text.trim()||pending)return;setPending(true);const nextConcern=concern?`${concern}. ${text.trim()}`:text.trim();try{const response=await assistant.sendMessage({message:text.trim(),concern:nextConcern,...(conversationId?{conversationId}:{})});setConversationId(response.data.conversationId);setConcern(nextConcern);setGuidance(response.data.guidance);setMessages(previous=>[...previous,{id:crypto.randomUUID(),sender:'user',text:text.trim()},{id:response.data.message.id,sender:'assistant',text:response.data.message.text,translationKey:response.data.guidance.summaryKey}]);setInput('');moveToLatest();}catch(error){reportError(error);}finally{setPending(false);}}
  function send(event:FormEvent){event.preventDefault();void addMessage(input);}
  function suggest(){void assistant.recommend({concern:[concern,...symptoms].join(' ')}).then(result=>{setGuidance(result.data.guidance);moveToLatest();}).catch(reportError);}
  return <div className="chat-page"><PatientHeader title={tr("Dentiq AI")} action={<Link className="p-text-link" to={user?.role === "patient" ? "/patient/profile" : "/login"}>{tr(user?.role === "patient" ? "My profile" : "Sign in")}</Link>} back="/patient/home" subtitle={tr("Dental care guidance - rule-based assistant")} /><div className="chat-scroll" ref={scroll}><p className="chat-guidance-label">{tr("General guidance only · not a diagnosis")}</p><EmergencyGuidance /><div className="chat-messages" aria-live="polite" aria-relevant="additions">{messages.map(message => <div className={`chat-row ${message.sender}`} key={message.id}>{message.sender === "assistant" && <span className="ai-avatar">{tr("AI")}</span>}<p>{message.sender === "user" ? message.text : tr(message.translationKey || message.text)}</p></div>)}</div>
    {!concern && <div className="chat-quick-options">{["I have a toothache", "My teeth are sensitive", "I have questions about braces"].map(text => <button type="button" key={text} onClick={() => addMessage(tr(text))}>{tr(text)}</button>)}</div>}
    {concern && <div className="symptom-card"><p>{tr("Which of these apply? Select any that fit, or describe your symptoms in a reply.")}</p><div>{followUpSymptoms.map(symptom => <label key={symptom}><input type="checkbox" checked={symptoms.includes(symptom)} onChange={() => { setSymptoms(previous => previous.includes(symptom) ? previous.filter(item => item !== symptom) : [...previous, symptom]); setGuidance(null); }} />{tr(symptom)}</label>)}</div></div>}
    {liveGuidance?.emergency ? <EmergencyGuidance urgent /> : concern && <><button className="p-button chat-recommendations" type="button" disabled={!hasAnswer} onClick={suggest}><Sparkles size={16} />{tr("Suggest a dental specialization")}</button>{guidance && !guidance.emergency && <section className="specialization-card"><h2>{tr("Suggested starting points")}</h2><div>{guidance.specializations.map(item => <span key={item}>{tr(item)}</span>)}</div><p>{tr(guidance.summaryKey || guidance.summary)}</p><small>{tr("Rule-based symptom matching. A dentist must examine you to determine the right care.")}</small><Link className="p-button" to="/patient/recommendations">{tr("View recommended doctors")}<ArrowRight size={15} /></Link><Link className="p-text-link" to="/patient/recommendations?nearby=1">{tr("Find Doctors Near Me")}</Link></section>}</>}
    </div><div className="chat-composer-wrap">{attachment && <p className="attachment-notice">{tr("Selected:")} {attachment} {tr("· stays on your device")}</p>}<form className="chat-composer" onSubmit={send}><div><input aria-label={tr("Describe your dental concern")} placeholder={tr("Describe your symptoms…")} value={input} onChange={event => setInput(event.target.value)} maxLength={1000} /><button className="p-icon-button" type="button" aria-label={tr("Select a local attachment")} onClick={() => fileInput.current?.click()}><Paperclip size={19} /></button><input ref={fileInput} className="sr-only" type="file" tabIndex={-1} onChange={event => setAttachment(event.target.files?.[0]?.name || "")} /></div><button className="chat-send" type="submit" aria-label={tr("Send message")} disabled={pending || !input.trim()}><Send size={19} /></button></form></div></div>;
}
