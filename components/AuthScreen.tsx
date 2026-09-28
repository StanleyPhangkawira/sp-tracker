"use client";
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [msg, setMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Processing...");
    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) setMsg(error.message);
    else setMsg(isLogin ? "Success! Loading..." : "Account created! You can now log in.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-black text-center text-blue-600 mb-6">SP Tracker Cloud Sync</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50" />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 transition-colors">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        {msg && <p className="text-sm text-center mt-4 text-red-500 font-semibold">{msg}</p>}
        <button onClick={() => { setIsLogin(!isLogin); setMsg(""); }} className="w-full text-center text-sm text-gray-500 mt-6 hover:text-blue-600">
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}