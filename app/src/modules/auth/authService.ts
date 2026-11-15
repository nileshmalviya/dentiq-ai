import { write } from '../../api/client';
export const authService={
 register:async(data:FormData)=>write('/auth/register','POST',{name:String(data.get('fullName')),email:String(data.get('email')),password:String(data.get('password')),phone:String(data.get('mobile'))}),
 forgotPassword:async(...values:unknown[])=>write('/auth/forgot-password','POST',{email:String(values[0])}),
 socialLogin:(...values:unknown[])=>{void values;throw new Error('Social sign-in requires a configured identity provider.');}
};
export function policyUrl(policy:'terms'|'privacy'):string|undefined{void policy;return undefined;}
