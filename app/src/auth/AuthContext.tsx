import { useEffect,useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './context';
import type { DemoUser } from './permissions';
import {authService} from '../services/auth.service';
export function mapUser(user:Record<string,unknown>):DemoUser {return {...user,role:({SUPER_ADMIN:'super-admin',DOCTOR:'doctor',PATIENT:'patient'} as Record<string,string>)[String(user.role)]||user.role} as DemoUser;}
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<DemoUser|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void authService.restoreSession().then(async restored=>{if(restored){const result=await authService.getCurrentUser();if(active)setUser(mapUser(result.data));}}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function login(email:string,password:string,remember:boolean){const result=await authService.login(email,password,remember);const account=mapUser(result.data.user);setUser(account);return account;}
 async function reloadUser(){const result=await authService.getCurrentUser();const account=mapUser(result.data);setUser(account);return account;}
 function logout(){void authService.logout().finally(()=>{setUser(null);window.dispatchEvent(new Event('dentiq:data'));});}
 if(loading)return <div role="status" className="local-notice">Restoring your session�</div>;
 return <AuthContext.Provider value={{user,login,logout,reloadUser}}>{children}</AuthContext.Provider>;
}
