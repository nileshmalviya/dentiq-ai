import { presentDoctors } from '../resources/doctor-directory.service.js';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../common/errors/AppError.js';
import type { Repositories } from '../resources/resource.service.js';

export function guidance(text: string) {
    if (/(?:cannot|can't|difficulty|trouble).{0,20}(?:breath|swallow)|uncontrolled bleed|heavy bleed|bleed.{0,30}(?:will not|won't|cannot|can't) stop/i.test(text))
        return { emergency: true, specializations: [], doctorIds: [], summary: 'Seek emergency medical care now for breathing or swallowing difficulty, or heavy bleeding that will not stop. Do not wait for a routine dental booking.' };
    const orthodontic = /braces|aligner|crooked|orthodont/i.test(text), pain = /toothache|pain|sensitive|sensitivity|root canal|chewing|biting/i.test(text);
    return { emergency: false, specializations: orthodontic ? ['Orthodontics'] : pain ? ['General', 'Endodontics'] : ['General'], doctorIds: [] as string[], summary: 'A dental examination is needed to determine the cause and appropriate care. These rule-based suggestions are general guidance, not a diagnosis.' };
}
export class ChatService {
    constructor(private repos: Repositories) { }
    async recommend(ownerKey: string, concern: string, search = '') { const result = guidance(concern); const treatment = /implant|extraction|whitening|aligner|braces|cleaning|filling|root canal|crown/i.exec(concern)?.[0]; const filter = result.emergency ? { id: { $in: [] } } : { status: 'Active', $and: [...(treatment ? [{ treatments: { $regex: treatment, $options: 'i' } }] : [{ $or: result.specializations.map(s => ({ specialty: { $regex: s, $options: 'i' } })) }]), ...(search ? [{ $or: [{ name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { specialty: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] }] : [])] }; const doctors = await this.repos.doctors.findMany({ filter, sort: { rating: -1, id: 1 }, skip: 0, limit: 100 }); result.doctorIds = doctors.map(d => d.id); await this.repos.recommendations.create({ id: randomUUID(), ownerKey, concern, doctorIds: result.doctorIds }); return { guidance: result, doctors: await presentDoctors(this.repos,doctors) }; }
    async message(ownerKey: string, text: string, conversationId?: string) { let conversation = conversationId ? await this.repos.conversations.findOne({ id: conversationId, ownerKey }) : null; if (conversationId && !conversation)
        throw new AppError(404, 'Conversation not found'); if (!conversation)
        conversation = await this.repos.conversations.create({ id: randomUUID(), ownerKey }); const result = await this.recommend(ownerKey, text); await this.repos.messages.create({ id: randomUUID(), conversationId: conversation.id, sender: 'user', text }); const reply = await this.repos.messages.create({ id: randomUUID(), conversationId: conversation.id, sender: 'assistant', text: result.guidance.summary }); return { conversationId: conversation.id, message: reply, guidance: result.guidance }; }
    async conversation(ownerKey: string, id: string) { if (!await this.repos.conversations.findOne({ id, ownerKey }))
        throw new AppError(404, 'Conversation not found'); return this.repos.messages.findMany({ filter: { conversationId: id }, sort: { createdAt: 1 }, skip: 0, limit: 100 }); }
}
