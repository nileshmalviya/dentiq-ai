import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const aiChatService = { ...createResourceService(['/ai-chat']), sendMessage<T>(data: unknown) { return write<T>('/ai-chat/message', 'POST', data); } };
