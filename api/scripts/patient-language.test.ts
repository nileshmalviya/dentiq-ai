import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidance, RecommendationService } from '../src/services/recommendation.service.js';
import { ChatService } from '../src/services/aiChat.service.js';
import { httpSchemas } from '../src/validations/http.validation.js';
import type { Repositories } from '../src/services/resource.service.js';
import { readFileSync } from 'node:fs';
import { guidanceMessages } from '../src/services/patient-language.js';

test('Patient catalogs have matching keys and agree with backend guidance', () => {
  const en=JSON.parse(readFileSync(new URL('../../app/src/i18n/locales/en.json',import.meta.url),'utf8'));
  const hi=JSON.parse(readFileSync(new URL('../../app/src/i18n/locales/hi.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(en).sort(),Object.keys(hi).sort());
  for(const [language,catalog] of [['en',en],['hi',hi]] as const) {
    for(const value of Object.values(catalog))assert.equal(typeof value==='string' && value.length>0,true);
    assert.equal(catalog['guidance.general'],guidanceMessages[language].general);
    assert.equal(catalog['guidance.emergency'],guidanceMessages[language].emergency);
  }
});

test('English, Hindi and Hinglish feed the same dental rules', () => {
  for (const concern of ['I have a toothache', 'मेरे दाँत में दर्द है', 'mere daant mein dard hai', 'thanda lagta hai']) {
    assert.deepEqual(guidance(concern, 'hi').specializations, ['General', 'Endodontics']);
    assert.equal(guidance(concern, 'hi').summaryKey, 'guidance.general');
  }
  for (const concern of ['questions about braces', 'मुझे ब्रेसेज़ के बारे में पूछना है', 'mere tedhe daant hain']) assert.deepEqual(guidance(concern).specializations, ['Orthodontics']);
});
test('Emergency routing and localized disclaimers remain available', () => {
  for (const text of ['difficulty breathing', 'साँस लेने में कठिनाई है', 'saans lene mein dikkat', 'खून नहीं रुक रहा', 'khoon ruk nahi raha', 'heavy bleeding']) {
    assert.equal(guidance(text, 'en').emergency, true, text);
    assert.equal(guidance(text, 'hi').emergency, true, text);
  }
  assert.match(guidance('pain','hi').summary, /निदान नहीं/);
  assert.match(guidance('pain').summary, /not a diagnosis/);
});
test('Language defaults to English and unsupported languages are rejected', () => {
  assert.equal(httpSchemas.chatMessage.parse({message:'pain'}).language,'en');
  assert.equal(httpSchemas.recommendation.parse({concern:'दर्द',language:'hi'}).language,'hi');
  assert.equal(httpSchemas.chatMessage.safeParse({message:'pain',language:'fr'}).success,false);
  assert.equal(httpSchemas.recommendation.safeParse({concern:'pain',language:'fr'}).success,false);
});
test('Recommendations preserve canonical doctor filters across languages', async () => {
  const filters: unknown[]=[];
  const repos={doctors:{findMany:async(query:unknown)=>{filters.push(query);return [];}},recommendations:{create:async()=>({})}} as unknown as Repositories;
  const service=new RecommendationService(repos);
  await service.recommend('guest','I have a toothache','','en');
  await service.recommend('guest','मेरे दाँत में दर्द है','','hi');
  assert.deepEqual(filters[0],filters[1]);
  filters.length=0;
  await service.recommend('guest','braces','','en');
  await service.recommend('guest','ब्रेसेज़','','hi');
  assert.deepEqual(filters[0],filters[1]);
});
test('Chat stores original user input and forwards selected language separately', async () => {
  const messages: Record<string,unknown>[]=[];
  const repos={conversations:{create:async(data:unknown)=>data},messages:{create:async(data:Record<string,unknown>)=>{messages.push(data);return data;}}} as unknown as Repositories;
  let args: unknown[]=[];
  const recommendations={recommend:async(...values:unknown[])=>{args=values;return {guidance:guidance('pain','hi')};}} as unknown as RecommendationService;
  const service=new ChatService(repos,recommendations);
  const input='मेरे दाँत में दर्द है';
  await service.message('guest',input,undefined,'hi','previous concern. '+input);
  assert.equal(messages[0].text,input);
  assert.equal(args[3],'hi');
  assert.equal(args[1],'previous concern. '+input);
});
