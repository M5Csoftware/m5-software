"use client";

import { useAuth } from "./Context/AuthContext";
import App from "./App";
import LoginPage from "./login/page";
import LoaderAnimation from "./components/Loader";

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 bg-opacity-50">
        {/* <div className="animate-spin rounded-full h-16 w-16 border-b-[3px] border-red border-t-transparent opacity-100">
          {" "}
          &nbsp;
        </div> */}
        <LoaderAnimation show={loading} />
      </div>
    );
  }

  return <div>{user ? <App /> : <LoginPage />}</div>;
}
