import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthScreen from "./AuthScreen";
import PluggedIn from "./PluggedIn";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Make sure every logged-in user has a Firestore profile
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            username: u.displayName || u.email?.split("@")[0] || "Gamer",
            email: u.email || "",
            logged: {},
            ratings: {},
            listData: {},
            diaryPosts: [],
            friends: [],
            createdAt: new Date().toISOString(),
          });
        }
      }
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#080812", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1a1a2e", borderTop: "3px solid #00F5FF", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;
  return <PluggedIn user={user} onSignOut={() => signOut(auth)} />;
}
