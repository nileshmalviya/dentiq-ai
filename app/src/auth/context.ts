import { createContext } from "react";
import type { DemoUser } from "./permissions";
export interface AuthState { user: DemoUser | null; login: (email: string, password: string, remember: boolean) => Promise<DemoUser>; logout: () => void; reloadUser:()=>Promise<DemoUser>; }
export const AuthContext = createContext<AuthState | null>(null);
