import { useEffect,useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './context';
import type { DemoUser } from './permissions';
import { api,restoreSession,setAccessToken,write } from '../api/client';
export function mapUser(user:Record<string,unknown>):DemoUser {return {...user,role:({SUPER_ADMIN:'super-admin',DOCTOR:'doctor',PATIENT:'patient'} as Record<string,string>)[String(user.role)]||user.role} as DemoUser;}
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<DemoUser|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void restoreSession().then(async restored=>{if(restored){const result=await api<Record<string,unknown>>('/auth/me');if(active)setUser(mapUser(result.data));}}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function login(email:string,password:string,remember:boolean){const result=await write<{user:Record<string,unknown>;accessToken:string}>('/auth/login','POST',{email,password,remember});setAccessToken(result.data.accessToken);const account=mapUser(result.data.user);setUser(account);return account;}
 function logout(){void write('/auth/logout','POST').finally(()=>{setAccessToken(null);setUser(null);window.dispatchEvent(new Event('dentiq:data'));});}
 if(loading)return <div role="status" className="local-notice">Restoring your session…</div>;
 return <AuthContext.Provider value={{user,login,logout}}>{children}</AuthContext.Provider>;
}
