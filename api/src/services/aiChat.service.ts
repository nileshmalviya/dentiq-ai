import type { PatientLanguage } from './patient-language.js';
import type { RecommendationService } from './recommendation.service.js';
import { randomUUID } from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import type { Repositories } from './resource.service.js';
export class ChatService {
    constructor(private repos: Repositories, private recommendations: RecommendationService) { }
    async message(ownerKey: string, text: string, conversationId?: string, language: PatientLanguage = 'en', concern?: string) {
        let conversation = conversationId ? await this.repos.conversations.findOne({ id: conversationId, ownerKey }) : null;
        if (conversationId && !conversation)
            throw new AppError(404, 'Conversation not found');
        if (!conversation)
            conversation = await this.repos.conversations.create({ id: randomUUID(), ownerKey });
        const result = await this.recommendations.recommend(ownerKey, concern || text, "", language);
        await this.repos.messages.create({ id: randomUUID(), conversationId: conversation.id, sender: 'user', text });
        const reply = await this.repos.messages.create({ id: randomUUID(), conversationId: conversation.id, sender: 'assistant', text: result.guidance.summary });
        return { conversationId: conversation.id, message: reply, guidance: result.guidance };
    }
    async conversation(ownerKey: string, id: string) {
        if (!await this.repos.conversations.findOne({ id, ownerKey }))
            throw new AppError(404, 'Conversation not found');
        return this.repos.messages.findMany({ filter: { conversationId: id }, sort: { createdAt: 1 }, skip: 0, limit: 100 });
    }
}
