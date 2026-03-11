import { useState } from "react";
import { auth, googleProvider, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = () => setError("");

  async function handleEmailAuth() {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !username) { setError("Please enter a username."); return; }
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        // Save profile to Firestore so others can find them
        await setDoc(doc(db, "users", cred.user.uid), {
          username: username,
          email: email,
          logged: {},
          ratings: {},
          listData: {},
          diaryPosts: [],
          friends: [],
          createdAt: new Date().toISOString(),
        });
        onAuth(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onAuth(cred.user);
      }
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "That email is already registered.",
        "auth/invalid-email": "Please enter a valid email.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(msgs[e.code] || "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // Only create Firestore profile if it doesn't exist yet
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          username: cred.user.displayName || "Gamer",
          email: cred.user.email || "",
          logged: {},
          ratings: {},
          listData: {},
          diaryPosts: [],
          friends: [],
          createdAt: new Date().toISOString(),
        });
      }
      onAuth(cred.user);
    } catch (e) {
      setError("Google sign-in failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#080812", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Exo 2', sans-serif" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎮</div>
          <h1 style={{ fontWeight: 900, fontSize: 36, margin: "0 0 8px", background: "linear-gradient(90deg,#00F5FF,#FF00FF,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PluggedIn</h1>
          <p style={{ color: "#555", fontSize: 14, margin: 0 }}>Your gaming universe, tracked.</p>
        </div>

        {/* Card */}
        <div style={{ width: "100%", maxWidth: 400, background: "linear-gradient(145deg,#0f0f1a,#1a1a2e)", border: "1.5px solid #2a2a3e", borderRadius: 24, padding: "32px 28px" }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#080812", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); clearError(); }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: mode === m ? "linear-gradient(90deg,#00F5FF22,#FF00FF22)" : "none", border: mode === m ? "1px solid #00F5FF44" : "none", color: mode === m ? "#00F5FF" : "#555", fontWeight: mode === m ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "'Exo 2',sans-serif" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#fff", border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Exo 2',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, opacity: loading ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#2a2a3e" }} />
            <span style={{ color: "#444", fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#2a2a3e" }} />
          </div>

          {/* Username field (signup only) */}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#666", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="GamerTag123"
                style={{ width: "100%", padding: "12px 14px", background: "#080812", border: "1.5px solid #2a2a3e", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "'Exo 2',sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
              style={{ width: "100%", padding: "12px 14px", background: "#080812", border: "1.5px solid #2a2a3e", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "'Exo 2',sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#666", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"} type="password"
              style={{ width: "100%", padding: "12px 14px", background: "#080812", border: "1.5px solid #2a2a3e", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "'Exo 2',sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#FF000022", border: "1px solid #FF000044", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#FF6B6B", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleEmailAuth} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "linear-gradient(90deg,#00F5FF,#FF00FF)", border: "none", color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Exo 2',sans-serif", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>

        <p style={{ color: "#333", fontSize: 12, marginTop: 24, textAlign: "center" }}>
          By signing up you agree to our Terms of Service
        </p>
      </div>
    </>
  );
}
