import { presentDoctors } from './doctor-directory.service.js';
import { randomUUID } from 'node:crypto';
import type { Repositories } from './resource.service.js';
export function guidance(text: string) {
    if (/(?:cannot|can't|difficulty|trouble).{0,20}(?:breath|swallow)|uncontrolled bleed|heavy bleed|bleed.{0,30}(?:will not|won't|cannot|can't) stop/i.test(text))
        return { emergency: true, specializations: [], doctorIds: [], summary: 'Seek emergency medical care now for breathing or swallowing difficulty, or heavy bleeding that will not stop. Do not wait for a routine dental booking.' };
    const orthodontic = /braces|aligner|crooked|orthodont/i.test(text), pain = /toothache|pain|sensitive|sensitivity|root canal|chewing|biting/i.test(text);
    return { emergency: false, specializations: orthodontic ? ['Orthodontics'] : pain ? ['General', 'Endodontics'] : ['General'], doctorIds: [] as string[], summary: 'A dental examination is needed to determine the cause and appropriate care. These rule-based suggestions are general guidance, not a diagnosis.' };
}
export class RecommendationService {
    constructor(private repos: Repositories) { }
    async recommend(ownerKey: string, concern: string, search = '') { const result = guidance(concern); const treatment = /implant|extraction|whitening|aligner|braces|cleaning|filling|root canal|crown/i.exec(concern)?.[0]; const filter = result.emergency ? { id: { $in: [] } } : { status: 'Active',clinicalServicesEnabled:{$ne:false},$or:[{registrationManaged:{$ne:true}},{approvalStatus:'APPROVED',emailVerificationStatus:'VERIFIED'}], $and: [...(treatment ? [{ treatments: { $regex: treatment, $options: 'i' } }] : [{ $or: result.specializations.map(s => ({ specialty: { $regex: s, $options: 'i' } })) }]), ...(search ? [{ $or: [{ name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { specialty: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] }] : [])] }; const doctors = await this.repos.doctors.findMany({ filter, sort: { rating: -1, id: 1 }, skip: 0, limit: 100 }); result.doctorIds = doctors.map(d => d.id); await this.repos.recommendations.create({ id: randomUUID(), ownerKey, concern, doctorIds: result.doctorIds }); return { guidance: result, doctors: await presentDoctors(this.repos, doctors) }; }
}
