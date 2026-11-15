import { write, reportError } from "../../api/client";
import type { DentalGuidance } from "../../data/patientGuidance";
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
  const { user } = useAuth();
  const { conversationId,setConversationId,concern, setConcern, symptoms, setSymptoms, messages, setMessages, guidance, setGuidance } = usePatientFlow();
  const [input, setInput] = useState(""); const [attachment, setAttachment] = useState("");
  const scroll = useRef<HTMLDivElement>(null); const fileInput = useRef<HTMLInputElement>(null);
  const liveGuidance = guidance;
  const hasAnswer = symptoms.length > 0 || messages.filter(message => message.sender === "user").length > 1;
  function moveToLatest() { requestAnimationFrame(() => scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "auto" })); }
  const [pending,setPending]=useState(false);
  async function addMessage(text:string){if(!text.trim()||pending)return;setPending(true);const nextConcern=concern?`${concern}. ${text.trim()}`:text.trim();try{const response=await write<{conversationId:string;message:{id:string;text:string};guidance:DentalGuidance}>("/ai-chat/message","POST",{message:nextConcern,...(conversationId?{conversationId}:{})});setConversationId(response.data.conversationId);setConcern(nextConcern);setGuidance(response.data.guidance);setMessages(previous=>[...previous,{id:crypto.randomUUID(),sender:'user',text:text.trim()},{id:response.data.message.id,sender:'assistant',text:response.data.message.text}]);setInput('');moveToLatest();}catch(error){reportError(error);}finally{setPending(false);}}
  function send(event:FormEvent){event.preventDefault();void addMessage(input);}
  function suggest(){void write<{guidance:DentalGuidance}>("/recommendations/doctors","POST",{concern:[concern,...symptoms].join(' ')}).then(result=>{setGuidance(result.data.guidance);moveToLatest();}).catch(reportError);}
  return <div className="chat-page"><PatientHeader title="Dentiq AI" action={<Link className="p-text-link" to={user?.role === "patient" ? "/patient/profile" : "/login"}>{user?.role === "patient" ? "My profile" : "Sign in"}</Link>} back="/patient/home" subtitle="Dental care guidance - rule-based assistant" /><div className="chat-scroll" ref={scroll}><p className="chat-guidance-label">General guidance only · not a diagnosis</p><EmergencyGuidance /><div className="chat-messages" aria-live="polite" aria-relevant="additions">{messages.map(message => <div className={`chat-row ${message.sender}`} key={message.id}>{message.sender === "assistant" && <span className="ai-avatar">AI</span>}<p>{message.text}</p></div>)}</div>
    {!concern && <div className="chat-quick-options">{["I have a toothache", "My teeth are sensitive", "I have questions about braces"].map(text => <button type="button" key={text} onClick={() => addMessage(text)}>{text}</button>)}</div>}
    {concern && <div className="symptom-card"><p>Which of these apply? Select any that fit, or describe your symptoms in a reply.</p><div>{followUpSymptoms.map(symptom => <label key={symptom}><input type="checkbox" checked={symptoms.includes(symptom)} onChange={() => { setSymptoms(previous => previous.includes(symptom) ? previous.filter(item => item !== symptom) : [...previous, symptom]); setGuidance(null); }} />{symptom}</label>)}</div></div>}
    {liveGuidance?.emergency ? <EmergencyGuidance urgent /> : concern && <><button className="p-button chat-recommendations" type="button" disabled={!hasAnswer} onClick={suggest}><Sparkles size={16} />Suggest a dental specialization</button>{guidance && !guidance.emergency && <section className="specialization-card"><h2>Suggested starting points</h2><div>{guidance.specializations.map(item => <span key={item}>{item}</span>)}</div><p>{guidance.summary}</p><small>Rule-based symptom matching. A dentist must examine you to determine the right care.</small><Link className="p-button" to="/patient/recommendations">View recommended doctors <ArrowRight size={15} /></Link></section>}</>}
    </div><div className="chat-composer-wrap">{attachment && <p className="attachment-notice">Selected: {attachment} · stays on your device</p>}<form className="chat-composer" onSubmit={send}><div><input aria-label="Describe your dental concern" placeholder="Describe your symptoms…" value={input} onChange={event => setInput(event.target.value)} maxLength={1000} /><button className="p-icon-button" type="button" aria-label="Select a local attachment" onClick={() => fileInput.current?.click()}><Paperclip size={19} /></button><input ref={fileInput} className="sr-only" type="file" tabIndex={-1} onChange={event => setAttachment(event.target.files?.[0]?.name || "")} /></div><button className="chat-send" type="submit" aria-label="Send message" disabled={pending || !input.trim()}><Send size={19} /></button></form></div></div>;
}
