import { ApiNotice } from "./components/common/ApiNotice";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./auth/AuthContext";
export default function App() { return <AuthProvider><ApiNotice /><RouterProvider router={router} /></AuthProvider>; }
