import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const RAWG_KEY = "27b32127739446b28acc66da28c0eaf8";
const RAWG = "https://api.rawg.io/api";
const AI_MODEL = "claude-sonnet-4-20250514";

const GENRE_MAP = [
  { label: "All", slug: "" }, { label: "Action", slug: "action" },
  { label: "RPG", slug: "role-playing-games-rpg" }, { label: "Shooter", slug: "shooter" },
  { label: "Adventure", slug: "adventure" }, { label: "Puzzle", slug: "puzzle" },
  { label: "Platformer", slug: "platformer" }, { label: "Strategy", slug: "strategy" },
  { label: "Simulation", slug: "simulation" }, { label: "Sports", slug: "sports" },
  { label: "Indie", slug: "indie" },
];
const PLATFORM_MAP = [
  { label: "All", id: "" }, { label: "PC", id: "4" }, { label: "PS5", id: "187" },
  { label: "PS4", id: "18" }, { label: "Xbox", id: "1" }, { label: "Switch", id: "7" }, { label: "Mobile", id: "3" },
];
const SORT_OPTIONS = [
  { label: "Top Rated", value: "-rating" }, { label: "Most Popular", value: "-added" },
  { label: "Newest", value: "-released" }, { label: "Oldest", value: "released" },
  { label: "Metacritic", value: "-metacritic" }, { label: "Name A–Z", value: "name" },
];
const YEAR_RANGES = [
  { label: "Any Year", value: "" }, { label: "2024", value: "2024-01-01,2024-12-31" },
  { label: "2023", value: "2023-01-01,2023-12-31" }, { label: "2022", value: "2022-01-01,2022-12-31" },
  { label: "2021", value: "2021-01-01,2021-12-31" }, { label: "2020", value: "2020-01-01,2020-12-31" },
  { label: "2010s", value: "2010-01-01,2019-12-31" }, { label: "2000s", value: "2000-01-01,2009-12-31" },
  { label: "Classics", value: "1980-01-01,1999-12-31" },
];
const COMPLETION_STATUSES = ["All", "Completed", "Playing", "Backlog", "Wishlist"];
const LISTS = [
  { name: "My Backlog", icon: "📋", color: "#7C3AED" },
  { name: "Completed", icon: "✅", color: "#059669" },
  { name: "Currently Playing", icon: "🎮", color: "#DC2626" },
  { name: "Wishlist", icon: "💫", color: "#D97706" },
];
const FEED = [
  { user: "neonbyte", avatar: "🎮", game: "Elden Ring", action: "logged", rating: 5, time: "2m ago", comment: "Absolute masterpiece. The open world design is revolutionary." },
  { user: "pixelqueen", avatar: "👾", game: "Celeste", action: "reviewed", rating: 5, time: "14m ago", comment: "This game helped me through a rough patch. 10/10 would cry again." },
  { user: "joypad_jess", avatar: "🕹️", game: "Hades", action: "added to list", rating: null, time: "1h ago", comment: "Added to 'To Play Before I Die'" },
  { user: "retro_rick", avatar: "🏆", game: "Portal 2", action: "logged", rating: 4, time: "3h ago", comment: "Replaying for the 5th time. Still perfect." },
  { user: "starplayer99", avatar: "⭐", game: "Stardew Valley", action: "logged", rating: 5, time: "5h ago", comment: "200 hours in. I have no plans to stop." },
];
const DEMO_LOGGED = [
  { id: 41494, name: "Hades", genres: [{name:"Roguelike"}], platforms:[{platform:{name:"PC"}}], released: "2020-09-17", rating: 4.6, background_image: "https://media.rawg.io/media/games/1f4/1f47a270b8f241f3bf85d97c006b25d7.jpg" },
  { id: 58175, name: "Elden Ring", genres: [{name:"RPG"}], platforms:[{platform:{name:"PS5"}}], released: "2022-02-25", rating: 4.5, background_image: "https://media.rawg.io/media/games/5ec/5ecac5cb026ec26a56efcc546364bf6e.jpg" },
  { id: 3498, name: "GTA V", genres: [{name:"Action"}], platforms:[{platform:{name:"PC"}}], released: "2013-09-17", rating: 4.5, background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg" },
  { id: 13536, name: "Portal 2", genres: [{name:"Puzzle"}], platforms:[{platform:{name:"PC"}}], released: "2011-04-18", rating: 4.6, background_image: "https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188742.jpg" },
  { id: 22509, name: "Stardew Valley", genres: [{name:"Simulation"}], platforms:[{platform:{name:"Switch"}}], released: "2016-02-26", rating: 4.5, background_image: "https://media.rawg.io/media/games/713/713269608dc8f2f40f5a670a14b2de94.jpg" },
  { id: 4200, name: "Portal", genres: [{name:"Puzzle"}], platforms:[{platform:{name:"PC"}}], released: "2007-10-10", rating: 4.5, background_image: "https://media.rawg.io/media/games/7fa/7fa0b586293c5861ee32490e953a4996.jpg" },
  { id: 802, name: "Borderlands 2", genres: [{name:"Shooter"}], platforms:[{platform:{name:"PC"}}], released: "2012-09-18", rating: 3.9, background_image: "https://media.rawg.io/media/games/b67/b67d9bd775a9e4b3c8bab5b37a5c6e41.jpg" },
  { id: 12020, name: "Left 4 Dead 2", genres: [{name:"Shooter"}], platforms:[{platform:{name:"PC"}}], released: "2009-11-17", rating: 4.2, background_image: "https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg" },
];
const DEMO_RATINGS = { 41494:5, 58175:5, 3498:4, 13536:5, 22509:4, 4200:5, 802:3, 12020:4 };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DEMO_MONTHLY = [2,1,3,2,4,1,2,3,5,3,4,2];

function accentColor(id) {
  const c = ["#FF6B9D","#00F5FF","#FFD700","#FF4500","#7B68EE","#66BB6A","#FF9800","#E53935","#00BCD4","#FFC107"];
  return c[Math.abs(id) % c.length];
}

function Pill({ label, active, onClick, gold }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 13px", borderRadius: 20, whiteSpace: "nowrap",
      background: active ? (gold ? "#FFD700" : "linear-gradient(90deg,#00F5FF,#FF00FF)") : "#1a1a2e",
      border: "none", color: active ? (gold ? "#000" : "#000") : "#666",
      fontWeight: active ? 700 : 400, fontSize: 11,
      cursor: "pointer", fontFamily: "'Exo 2',sans-serif", transition: "all 0.15s",
      flexShrink: 0,
    }}>{label}</button>
  );
}

function StarRating({ rating, onRate, size = 18 }) {
  const [hover, setHover] = useState(0);
  const display = hover || rating || 0;
  return (
    <div style={{ display:"flex", gap:2, alignItems:"center" }}>
      {[1,2,3,4,5].map(s => {
        const full = display >= s;
        const half = !full && display >= s - 0.5;
        const starColor = full || half ? "#FFD700" : "#333";
        return (
          <div key={s} style={{ position:"relative", width:size, height:size, cursor:onRate?"pointer":"default", flexShrink:0 }}
            onMouseLeave={() => onRate && setHover(0)}>
            {/* Background star */}
            <span style={{ fontSize:size, color:"#333", position:"absolute", left:0, top:0, lineHeight:1 }}>★</span>
            {/* Filled portion */}
            <span style={{ fontSize:size, color:"#FFD700", position:"absolute", left:0, top:0, lineHeight:1,
              clipPath: half ? "inset(0 50% 0 0)" : full ? "none" : "inset(0 100% 0 0)",
              textShadow: full || half ? "0 0 8px #FFD70088" : "none", transition:"clip-path 0.1s" }}>★</span>
            {/* Click zones: left half = n-0.5, right half = n */}
            {onRate && <>
              <div style={{ position:"absolute", left:0, top:0, width:"50%", height:"100%", zIndex:2 }}
                onClick={() => onRate(s - 0.5)}
                onMouseEnter={() => setHover(s - 0.5)} />
              <div style={{ position:"absolute", right:0, top:0, width:"50%", height:"100%", zIndex:2 }}
                onClick={() => onRate(s)}
                onMouseEnter={() => setHover(s)} />
            </>}
          </div>
        );
      })}
      {rating > 0 && <span style={{ fontSize:size*0.65, color:"#FFD700", fontWeight:700, marginLeft:3, fontFamily:"'Exo 2',sans-serif" }}>{rating}</span>}
    </div>
  );
}

function Spinner({ small }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: small ? 6 : 32 }}>
      <div style={{ width: small?18:36, height: small?18:36, borderRadius: "50%", border: `${small?2:3}px solid #1a1a2e`, borderTop: `${small?2:3}px solid #00F5FF`, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

async function callClaude(prompt) {
  const url = process.env.NODE_ENV === "production"
    ? "/api/claude"
    : "http://localhost:3001/api/claude";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ─── SPOILER REVIEW ──────────────────────────────────────────────────────────
function SpoilerReview({ review, gameName, showMeta=true }) {
  const [revealed, setRevealed] = useState(!review.spoiler);
  return (
    <div style={{ background:"#ffffff06", borderRadius:12, padding:14, border:"1px solid #2a2a3e" }}>
      {showMeta && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:11, color:"#555" }}>📝 {review.date || "Review"}</span>
          {review.hours && <span style={{ fontSize:11, color:"#00F5FF" }}>⏱ {review.hours}h played</span>}
        </div>
      )}
      {review.spoiler && !revealed ? (
        <div onClick={()=>setRevealed(true)} style={{ textAlign:"center", padding:"12px 0", cursor:"pointer" }}>
          <div style={{ color:"#FF9900", fontWeight:700, fontSize:13, marginBottom:4 }}>⚠️ Spoiler Warning</div>
          <div style={{ color:"#555", fontSize:12 }}>Tap to reveal review</div>
        </div>
      ) : (
        <p style={{ color:"#ccc", fontSize:13, lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{review.text}</p>
      )}
    </div>
  );
}

// ─── REVIEW MODAL ────────────────────────────────────────────────────────────
function ReviewModal({ game, existing, onClose, onSave }) {
  const [text, setText] = useState(existing?.text || "");
  const [spoiler, setSpoiler] = useState(existing?.spoiler || false);
  const [hours, setHours] = useState(existing?.hours || "");
  if (!game) return null;
  const color = accentColor(game.id);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"#000d", display:"flex", alignItems:"flex-end", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0f0f1a,#080812)", border:`1.5px solid ${color}55`, borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", boxShadow:`0 -8px 48px ${color}33`, padding:"20px 20px 40px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
          <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", background:"#1a1a2e", flexShrink:0 }}>
            {game.background_image ? <img src={game.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎮</div>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:900, fontSize:16, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.name}</div>
            <div style={{ color:"#555", fontSize:11 }}>{game.genres?.[0]?.name} · {game.released?.slice(0,4)}</div>
          </div>
          <button onClick={onClose} style={{ background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#aaa", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>
        </div>

        {/* Hours played */}
        <div style={{ marginBottom:14 }}>
          <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>⏱ Hours Played</p>
          <input type="number" value={hours} onChange={e=>setHours(e.target.value)} placeholder="e.g. 42" min="0" style={{ width:"100%", padding:"10px 14px", background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
        </div>

        {/* Review text */}
        <div style={{ marginBottom:12 }}>
          <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>✍️ Your Review</p>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={`What did you think of ${game.name}? Share your honest take...`} rows={6} style={{ width:"100%", padding:"12px 14px", background:"#1a1a2e", border:`1px solid ${text?"#2a2a4e":"#2a2a3e"}`, borderRadius:10, color:"#fff", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none", resize:"none", lineHeight:1.6, boxSizing:"border-box", transition:"border 0.2s" }} />
          <div style={{ textAlign:"right", color:"#333", fontSize:11, marginTop:4 }}>{text.length} chars</div>
        </div>

        {/* Spoiler toggle */}
        <div onClick={()=>setSpoiler(s=>!s)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:spoiler?"#FF990022":"#1a1a2e", border:`1px solid ${spoiler?"#FF9900":"#2a2a3e"}`, borderRadius:10, cursor:"pointer", marginBottom:20, userSelect:"none" }}>
          <div style={{ width:20, height:20, borderRadius:6, background:spoiler?"#FF9900":"#0f0f1a", border:`2px solid ${spoiler?"#FF9900":"#333"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, transition:"all 0.2s" }}>{spoiler?"✓":""}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:spoiler?"#FF9900":"#666" }}>⚠️ Contains Spoilers</div>
            <div style={{ fontSize:11, color:"#444" }}>Readers will need to tap to reveal</div>
          </div>
        </div>

        {/* Save button */}
        <button onClick={()=>{ if(!text.trim()&&!hours) return; onSave({ text, spoiler, hours, date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) }); onClose(); }} style={{ width:"100%", padding:14, borderRadius:12, background:text.trim()||hours?`linear-gradient(90deg,${color},${color}bb)`:"#1a1a2e", border:`1.5px solid ${text.trim()||hours?color:"#2a2a3e"}`, color:text.trim()||hours?"#fff":"#444", fontWeight:700, fontSize:15, cursor:text.trim()||hours?"pointer":"default", fontFamily:"'Exo 2',sans-serif", transition:"all 0.2s" }}>
          {existing ? "💾 Update Review" : "✍️ Publish Review"}
        </button>
      </div>
    </div>
  );
}

// ─── USER CARD ───────────────────────────────────────────────────────────────
function UserCard({ u, isFollowing, onFollow }) {
  const color = accentColor((u.username||"x").charCodeAt(0));
  return (
    <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${isFollowing?"#00F5FF44":"#2a2a3e"}`, borderRadius:14, padding:14, marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#000", flexShrink:0 }}>{(u.username||"?")[0].toUpperCase()}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>@{u.username}</div>
        <div style={{ color:"#555", fontSize:12 }}>{u.loggedCount} games · {u.followersCount} followers</div>
        {u.bio && <div style={{ color:"#444", fontSize:11, fontStyle:"italic", marginTop:2 }}>"{u.bio.slice(0,40)}{u.bio.length>40?"...":""}"</div>}
        {u.favGenres?.length > 0 && (
          <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
            {u.favGenres.slice(0,3).map(g=><span key={g} style={{ padding:"2px 7px", borderRadius:20, background:"#FF00FF11", border:"1px solid #FF00FF33", color:"#FF6B9D", fontSize:9 }}>{g}</span>)}
          </div>
        )}
      </div>
      <button onClick={onFollow} style={{ padding:"8px 14px", borderRadius:10, background:isFollowing?"#1a1a2e":"linear-gradient(90deg,#00F5FF,#FF00FF)", border:isFollowing?"1px solid #2a2a3e":"none", color:isFollowing?"#aaa":"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", transition:"all 0.2s", flexShrink:0 }}>{isFollowing?"Following ✓":"Follow"}</button>
    </div>
  );
}

// ─── DISCOVER PEOPLE ─────────────────────────────────────────────────────────
function DiscoverPeople({ following, currentUid, onFollow }) {
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "users"));
        const all = snap.docs
          .filter(d => d.id !== currentUid)
          .map(d => ({
            uid: d.id,
            username: d.data().username || "Gamer",
            loggedCount: Object.values(d.data().logged||{}).filter(Boolean).length,
            followersCount: (d.data().followers||[]).length,
            bio: d.data().profileData?.bio || "",
            favGenres: d.data().profileData?.favGenres || [],
          }))
          .sort((a,b) => b.loggedCount - a.loggedCount);
        setSuggested(all.slice(0, 20));
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUid]);

  if (loading) return <Spinner />;

  const notFollowing = suggested.filter(u => !following.includes(u.uid));
  const alreadyFollowing = suggested.filter(u => following.includes(u.uid));

  return (
    <div>
      {notFollowing.length > 0 && (
        <>
          <p style={{ color:"#555", fontSize:10, letterSpacing:2, textTransform:"uppercase", margin:"0 0 12px" }}>🌟 Suggested Gamers</p>
          {notFollowing.slice(0,8).map((u,i) => (
            <UserCard key={i} u={u} isFollowing={false} onFollow={()=>onFollow(u)} />
          ))}
        </>
      )}
      {alreadyFollowing.length > 0 && (
        <>
          <p style={{ color:"#555", fontSize:10, letterSpacing:2, textTransform:"uppercase", margin:"16px 0 12px" }}>✓ Already Following</p>
          {alreadyFollowing.map((u,i) => (
            <UserCard key={i} u={u} isFollowing={true} onFollow={()=>onFollow(u)} />
          ))}
        </>
      )}
      {suggested.length === 0 && (
        <div style={{ textAlign:"center", color:"#333", padding:32 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🌐</div>
          <p style={{ color:"#555" }}>No other users yet</p>
          <p style={{ color:"#444", fontSize:12 }}>Invite friends to join PluggedIn!</p>
        </div>
      )}
    </div>
  );
}

// ─── FILTER PANEL ────────────────────────────────────────────────────────────
function FilterPanel({ show, onClose, filters, setFilters }) {
  const [local, setLocal] = useState(filters);
  useEffect(() => { if (show) setLocal(filters); }, [show]);
  if (!show) return null;
  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"#000b", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#0f0f1a", border:"1.5px solid #2a2a3e", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, padding:"20px 20px 36px", maxHeight:"82vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontWeight:900, fontSize:18, margin:0 }}>🎛️ Filter & Sort</h3>
          <button onClick={onClose} style={{ background:"#ffffff15", border:"none", color:"#fff", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        {[
          { title: "Sort By", key: "sort", options: SORT_OPTIONS.map(o => ({ label: o.label, value: o.value })) },
          { title: "Release Year", key: "year", options: YEAR_RANGES.map(o => ({ label: o.label, value: o.value })) },
          { title: "Completion Status", key: "completion", options: COMPLETION_STATUSES.map(v => ({ label: v, value: v })) },
        ].map(section => (
          <div key={section.key} style={{ marginBottom: 18 }}>
            <p style={{ color:"#555", fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"0 0 8px" }}>{section.title}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {section.options.map(o => <Pill key={o.value} label={o.label} active={local[section.key]===o.value} onClick={()=>set(section.key, o.value)} />)}
            </div>
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color:"#555", fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"0 0 8px" }}>Minimum Rating</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[0,1,2,3,4,5].map(r => <Pill key={r} label={r===0?"Any":"★".repeat(r)+" +"} active={local.minRating===r} onClick={()=>set("minRating",r)} gold={r>0} />)}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setLocal({ sort:"-rating", year:"", minRating:0, completion:"All" })} style={{ flex:1, padding:12, borderRadius:12, background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#666", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Reset</button>
          <button onClick={() => { setFilters(local); onClose(); }} style={{ flex:2, padding:12, borderRadius:12, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

// ─── GAME CARD ───────────────────────────────────────────────────────────────
function GameCard({ game, onOpen, logged }) {
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const color = accentColor(game.id);
  return (
    <div onClick={() => onOpen(game)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered?`linear-gradient(145deg,#1a1a2e,${color}22)`:"linear-gradient(145deg,#0f0f1a,#1a1a2e)", border:`1.5px solid ${hovered?color:"#2a2a3e"}`, borderRadius:16, cursor:"pointer", transition:"all 0.25s cubic-bezier(.4,0,.2,1)", transform:hovered?"translateY(-4px) scale(1.02)":"none", boxShadow:hovered?`0 12px 32px ${color}44`:"0 2px 8px #0008", position:"relative", overflow:"hidden" }}>
      {logged && <div style={{ position:"absolute", top:8, right:8, zIndex:2, background:"#059669", borderRadius:20, padding:"2px 7px", fontSize:9, fontWeight:700, color:"#fff" }}>✓ LOGGED</div>}
      <div style={{ width:"100%", aspectRatio:"16/9", overflow:"hidden", borderRadius:"14px 14px 0 0", background:"#1a1a2e" }}>
        {game.background_image && !imgErr
          ? <img src={game.background_image} alt={game.name} onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s", transform:hovered?"scale(1.08)":"scale(1)" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, background:`${color}22` }}>🎮</div>}
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:13, color:"#fff", marginBottom:3, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.name}</div>
        <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>{game.genres?.[0]?.name||"Game"} • {game.released?.slice(0,4)||"?"}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ color:"#FFD700", fontSize:11 }}>★</span><span style={{ fontSize:11, color:"#aaa", fontWeight:700 }}>{game.rating?game.rating.toFixed(1):"N/A"}</span></div>
          <span style={{ fontSize:10, color:"#555" }}>{game.ratings_count>1000?(game.ratings_count/1000).toFixed(1)+"k":game.ratings_count||0}</span>
        </div>
      </div>
    </div>
  );
}

// ─── GAME DETAIL PAGE ────────────────────────────────────────────────────────
function GameModal({ game, onClose, onLog, logged, userRating, onRate, listData, onAddToList, allLists, onWriteReview, userReview }) {
  const [imgErr, setImgErr] = useState(false);
  const [details, setDetails] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [detailTab, setDetailTab] = useState("about");
  const color = accentColor(game ? game.id : 0);

  useEffect(() => {
    if (!game) return;
    setDetails(null); setScreenshots([]); setDetailTab("about");
    fetch(`${RAWG}/games/${game.id}?key=${RAWG_KEY}`).then(r=>r.json()).then(setDetails).catch(()=>{});
    fetch(`${RAWG}/games/${game.id}/screenshots?key=${RAWG_KEY}&page_size=6`).then(r=>r.json()).then(d=>setScreenshots(d.results||[])).catch(()=>{});
  }, [game]);

  if (!game) return null;

  const platforms = game.platforms?.map(p=>p.platform.name).slice(0,5) || [];
  const devs = details?.developers?.map(d=>d.name).join(", ") || "—";
  const pubs = details?.publishers?.map(p=>p.name).join(", ") || "—";
  const tags = details?.tags?.slice(0,8).map(t=>t.name) || [];
  const website = details?.website;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#080812", overflowY:"auto", fontFamily:"'Exo 2',sans-serif" }}>
      {/* Hero banner */}
      <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#1a1a2e", maxHeight:260, overflow:"hidden" }}>
        {game.background_image && !imgErr
          ? <img src={game.background_image} alt={game.name} onError={()=>setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:72, background:`${color}22` }}>🎮</div>}
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(to bottom, #00000044 0%, #080812 100%)` }} />
        {/* Back button */}
        <button onClick={onClose} style={{ position:"absolute", top:14, left:14, background:"#00000099", border:"none", color:"#fff", padding:"8px 14px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, backdropFilter:"blur(4px)" }}>← Back</button>
        {/* Logged badge */}
        {logged && <div style={{ position:"absolute", top:14, right:14, background:"#059669", borderRadius:20, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#fff" }}>✓ LOGGED</div>}
      </div>

      <div style={{ padding:"0 18px 100px", maxWidth:430, margin:"0 auto" }}>
        {/* Title & meta */}
        <div style={{ marginTop:-20, marginBottom:16 }}>
          <h1 style={{ fontWeight:900, fontSize:26, color:"#fff", margin:"0 0 6px", lineHeight:1.2 }}>{game.name}</h1>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
            {game.genres?.map(g=>(
              <span key={g.name} style={{ padding:"3px 10px", borderRadius:20, background:`${color}22`, border:`1px solid ${color}44`, color:color, fontSize:10, fontWeight:600 }}>{g.name}</span>
            ))}
          </div>
          <p style={{ color:"#555", fontSize:12, margin:0 }}>Released {game.released||"—"} · {platforms.slice(0,3).join(" · ")||"Multi-platform"}</p>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
          {[
            { icon:"⭐", label:"RAWG Score", val: game.rating ? game.rating.toFixed(1) : "—" },
            { icon:"💬", label:"Ratings", val: game.ratings_count > 1000 ? (game.ratings_count/1000).toFixed(1)+"k" : (game.ratings_count||0) },
            { icon:"🏆", label:"Metacritic", val: details?.metacritic || "—" },
          ].map(s=>(
            <div key={s.label} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${color}33`, borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontWeight:900, fontSize:20, color }}>{s.val}</div>
              <div style={{ fontSize:9, color:"#444", letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Your Rating & Log */}
        <div style={{ background:`linear-gradient(135deg,${color}18,#1a1a2e)`, border:`1.5px solid ${color}44`, borderRadius:16, padding:16, marginBottom:14 }}>
          <p style={{ color:"#888", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 10px", textAlign:"center" }}>Your Rating</p>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <StarRating rating={userRating||0} onRate={onRate} size={36} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>onLog(game)} style={{ flex:2, padding:13, borderRadius:12, background:logged?"#05966933":`linear-gradient(90deg,${color},${color}aa)`, border:`1.5px solid ${logged?"#059669":color}`, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{logged?"✓ Logged":"+ Log Game"}</button>
            {onWriteReview && <button onClick={()=>onWriteReview(game)} style={{ flex:1, padding:13, borderRadius:12, background:"#1a1a2e", border:`1.5px solid ${color}44`, color:color, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>✍️ {userReview?"Review":"Review"}</button>}
          </div>
        </div>

        {/* Your review preview */}
        {userReview?.text && (
          <div style={{ marginBottom:14 }}>
            <p style={{ color:"#555", fontSize:10, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Your Review {userReview.hours&&`· ⏱ ${userReview.hours}h`}</p>
            <SpoilerReview review={userReview} />
          </div>
        )}

        {/* Add to list */}
        <div style={{ marginBottom:16 }}>
          <p style={{ color:"#555", fontSize:10, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Add to List</p>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {(allLists||LISTS).map(list => {
              const entry=listData[game.id]; const curLists=entry?.lists||(Array.isArray(entry)?entry:[]);
              const active=curLists.includes(list.name);
              return <button key={list.name} onClick={()=>onAddToList(game,list.name)} style={{ padding:"7px 12px", borderRadius:20, fontSize:11, background:active?`${list.color}33`:"#1a1a2e", border:`1px solid ${active?list.color:"#2a2a3e"}`, color:active?list.color:"#666", cursor:"pointer", fontFamily:"'Exo 2',sans-serif", fontWeight:600 }}>{list.icon} {list.name}</button>;
            })}
          </div>
        </div>

        {/* Detail sub-tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:16, background:"#1a1a2e", borderRadius:12, padding:4 }}>
          {[{id:"about",label:"📖 About"},{id:"media",label:"🖼 Media"},{id:"info",label:"ℹ️ Info"}].map(t=>(
            <button key={t.id} onClick={()=>setDetailTab(t.id)} style={{ flex:1, padding:"8px 4px", borderRadius:8, background:detailTab===t.id?"linear-gradient(90deg,#00F5FF22,#FF00FF22)":"none", border:detailTab===t.id?"1px solid #00F5FF44":"none", color:detailTab===t.id?"#00F5FF":"#555", fontWeight:detailTab===t.id?700:400, fontSize:11, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{t.label}</button>
          ))}
        </div>

        {/* ABOUT tab */}
        {detailTab==="about" && (
          <div>
            {details?.description_raw
              ? <p style={{ color:"#aaa", fontSize:13, lineHeight:1.8, margin:0 }}>{details.description_raw.slice(0,800)}{details.description_raw.length>800?"...":""}</p>
              : <div style={{ textAlign:"center", color:"#333", padding:24 }}><Spinner small /></div>}
            {tags.length>0 && (
              <div style={{ marginTop:16 }}>
                <p style={{ color:"#555", fontSize:10, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Tags</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {tags.map(t=><span key={t} style={{ padding:"4px 10px", borderRadius:20, background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#555", fontSize:11 }}>{t}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDIA tab */}
        {detailTab==="media" && (
          <div>
            {screenshots.length===0
              ? <div style={{ textAlign:"center", color:"#333", padding:32 }}><Spinner small /></div>
              : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {screenshots.map((s,i)=>(
                    <div key={i} style={{ borderRadius:10, overflow:"hidden", aspectRatio:"16/9", background:"#1a1a2e" }}>
                      <img src={s.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* INFO tab */}
        {detailTab==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Developer", val: devs },
              { label:"Publisher", val: pubs },
              { label:"Released", val: game.released || "—" },
              { label:"Platforms", val: platforms.join(", ") || "—" },
              { label:"Genres", val: game.genres?.map(g=>g.name).join(", ") || "—" },
              { label:"ESRB Rating", val: details?.esrb_rating?.name || "Not Rated" },
              { label:"Playtime (avg)", val: details?.playtime ? `~${details.playtime}h` : "—" },
            ].map(row=>(
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 14px", background:"#1a1a2e", borderRadius:10 }}>
                <span style={{ color:"#555", fontSize:12 }}>{row.label}</span>
                <span style={{ color:"#ccc", fontSize:12, fontWeight:600, textAlign:"right", maxWidth:"60%" }}>{row.val}</span>
              </div>
            ))}
            {website && (
              <a href={website} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", padding:12, borderRadius:12, background:"#1a1a2e", border:`1px solid ${color}44`, color:color, fontWeight:700, fontSize:13, textDecoration:"none" }}>🌐 Official Website</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI STATS ────────────────────────────────────────────────────────────────
function AIStats({ loggedGames, ratings }) {
  const [insights, setInsights] = useState(null);
  const [recs, setRecs] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictInput, setPredictInput] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);

  const games = loggedGames.length ? loggedGames : DEMO_LOGGED;
  const myRatings = Object.keys(ratings).length ? ratings : DEMO_RATINGS;
  const gameList = games.map(g => `${g.name} (${g.genres?.[0]?.name||"?"}, rated ${myRatings[g.id]||"?"}/5)`).join(", ");

  const genres = {};
  games.forEach(g => { const n=g.genres?.[0]?.name||"?"; genres[n]=(genres[n]||0)+1; });
  const topGenre = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0];
  const avgRating = Object.values(myRatings).length ? (Object.values(myRatings).reduce((a,b)=>a+b,0)/Object.values(myRatings).length).toFixed(1) : "—";
  const topGame = games.find(g => myRatings[g.id] === Math.max(...Object.values(myRatings)));

  async function getInsights() {
    setLoadingInsights(true); setInsights(null);
    const text = await callClaude(`You are a gaming analyst AI for PluggedIn app. A user logged: ${gameList}. Give 4 short fun personalized insights about their gaming taste: gamer archetype, genre patterns, rating habits, one surprising observation. JSON array of {emoji,title,body}. Only JSON, no markdown.`);
    try { setInsights(JSON.parse(text.replace(/```json|```/g,"").trim())); } catch { setInsights([{emoji:"🎮",title:"Your Gaming Personality",body:text}]); }
    setLoadingInsights(false);
  }

  async function getRecs() {
    setLoadingRecs(true); setRecs(null);
    const text = await callClaude(`Game recommendation AI. User's library: ${gameList}. Suggest 4 unplayed games matching their taste. JSON array of {name,genre,reason,predictedRating(1-5)}. Only JSON, no markdown.`);
    try { setRecs(JSON.parse(text.replace(/```json|```/g,"").trim())); } catch { setRecs(null); }
    setLoadingRecs(false);
  }

  async function getPrediction() {
    if (!predictInput.trim()) return;
    setLoadingPred(true); setPrediction(null);
    const text = await callClaude(`Rating predictor. User's games: ${gameList}. Predict their rating for "${predictInput}" (1-5 stars). JSON: {rating:number, explanation:string, confidence:"High"|"Medium"|"Low"}. Only JSON, no markdown.`);
    try { setPrediction(JSON.parse(text.replace(/```json|```/g,"").trim())); } catch { setPrediction({rating:4,explanation:text,confidence:"Medium"}); }
    setLoadingPred(false);
  }

  return (
    <div>
      {/* Quick stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[{icon:"🎮",label:"Logged",val:games.length,color:"#00F5FF"},{icon:"⭐",label:"Avg Rating",val:avgRating+"★",color:"#FFD700"},{icon:"🏅",label:"Top Genre",val:topGenre?.[0]||"—",color:"#FF6B9D"},{icon:"💎",label:"Fav Game",val:topGame?.name||"—",color:"#7B68EE"}].map(s=>(
          <div key={s.label} style={{ background:"#1a1a2e", border:`1.5px solid ${s.color}33`, borderRadius:14, padding:14 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontWeight:900, fontSize:15, color:s.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.val}</div>
            <div style={{ fontSize:10, color:"#555" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Genre bars */}
      <div style={{ background:"#1a1a2e", borderRadius:14, padding:14, marginBottom:14 }}>
        <p style={{ color:"#666", fontSize:10, letterSpacing:2, textTransform:"uppercase", margin:"0 0 12px" }}>Genre Breakdown</p>
        {Object.entries(genres).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([g,c],i)=>(
          <div key={g} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:12, color:"#ccc" }}>{g}</span>
              <span style={{ fontSize:10, color:"#555" }}>{c}</span>
            </div>
            <div style={{ height:6, background:"#0f0f1a", borderRadius:3 }}>
              <div style={{ height:"100%", width:`${(c/games.length)*100}%`, background:`linear-gradient(90deg,${accentColor(i*3)},${accentColor(i*5)})`, borderRadius:3, transition:"width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #7B68EE44", borderRadius:14, padding:14, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div><p style={{ fontWeight:700, fontSize:14, margin:"0 0 2px" }}>🤖 AI Gaming Insights</p><p style={{ fontSize:11, color:"#555", margin:0 }}>Personalized analysis</p></div>
          <button onClick={getInsights} disabled={loadingInsights} style={{ padding:"8px 14px", borderRadius:10, background:"linear-gradient(90deg,#7B68EE,#FF6B9D)", border:"none", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", opacity:loadingInsights?0.6:1 }}>{loadingInsights?"...":"Analyze Me"}</button>
        </div>
        {loadingInsights && <Spinner small />}
        {insights && insights.map((ins,i)=>(
          <div key={i} style={{ background:"#ffffff06", borderRadius:10, padding:"10px 12px", marginBottom:8, borderLeft:`3px solid ${accentColor(i*2)}` }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{ins.emoji} {ins.title}</div>
            <div style={{ color:"#888", fontSize:12, lineHeight:1.5 }}>{ins.body}</div>
          </div>
        ))}
      </div>

      {/* AI Recs */}
      <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #00F5FF44", borderRadius:14, padding:14, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div><p style={{ fontWeight:700, fontSize:14, margin:"0 0 2px" }}>🎯 Recommended For You</p><p style={{ fontSize:11, color:"#555", margin:0 }}>AI picks from your taste</p></div>
          <button onClick={getRecs} disabled={loadingRecs} style={{ padding:"8px 14px", borderRadius:10, background:"linear-gradient(90deg,#00F5FF,#7B68EE)", border:"none", color:"#000", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", opacity:loadingRecs?0.6:1 }}>{loadingRecs?"...":"Get Recs"}</button>
        </div>
        {loadingRecs && <Spinner small />}
        {recs && recs.map((r,i)=>(
          <div key={i} style={{ background:"#ffffff06", borderRadius:10, padding:"10px 12px", marginBottom:8, display:"flex", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:`${accentColor(i*4)}22`, border:`1px solid ${accentColor(i*4)}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🎮</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{r.name} <span style={{ color:"#555", fontWeight:400 }}>· {r.genre}</span></div>
              <div style={{ color:"#888", fontSize:11, marginTop:2 }}>{r.reason}</div>
              <div style={{ color:"#FFD700", fontSize:11, marginTop:3 }}>Predicted: {"★".repeat(Math.round(r.predictedRating||4))}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rating predictor */}
      <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #FFD70044", borderRadius:14, padding:14 }}>
        <p style={{ fontWeight:700, fontSize:14, margin:"0 0 4px" }}>🔮 Predict Your Rating</p>
        <p style={{ fontSize:11, color:"#555", margin:"0 0 12px" }}>Type any game — AI predicts your score</p>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <input value={predictInput} onChange={e=>setPredictInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&getPrediction()} placeholder="e.g. Hollow Knight..." style={{ flex:1, background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", padding:"10px 12px", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none" }} />
          <button onClick={getPrediction} disabled={loadingPred||!predictInput.trim()} style={{ padding:"10px 16px", borderRadius:10, background:"linear-gradient(90deg,#FFD700,#FF9800)", border:"none", color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", opacity:(loadingPred||!predictInput.trim())?0.5:1 }}>{loadingPred?"...":"Predict"}</button>
        </div>
        {loadingPred && <Spinner small />}
        {prediction && (
          <div style={{ background:"#FFD70011", border:"1px solid #FFD70033", borderRadius:12, padding:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <StarRating rating={prediction.rating} size={20} />
              <span style={{ fontWeight:900, fontSize:18, color:"#FFD700" }}>{prediction.rating}/5</span>
              <span style={{ fontSize:10, color:"#666", background:"#ffffff10", borderRadius:20, padding:"2px 8px" }}>{prediction.confidence}</span>
            </div>
            <p style={{ color:"#aaa", fontSize:12, lineHeight:1.6, margin:0 }}>{prediction.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WRAPPED ─────────────────────────────────────────────────────────────────
function Wrapped({ loggedGames, ratings }) {
  const [slide, setSlide] = useState(0);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const games = loggedGames.length ? loggedGames : DEMO_LOGGED;
  const myRatings = Object.keys(ratings).length ? ratings : DEMO_RATINGS;
  const monthly = DEMO_MONTHLY;
  const year = new Date().getFullYear();

  const genres = {};
  games.forEach(g => { const n=g.genres?.[0]?.name||"?"; genres[n]=(genres[n]||0)+1; });
  const topGenre = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0];
  const platforms = {};
  games.forEach(g => { const p=g.platforms?.[0]?.platform?.name||"?"; platforms[p]=(platforms[p]||0)+1; });
  const topPlatform = Object.entries(platforms).sort((a,b)=>b[1]-a[1])[0];
  const topRated = [...games].filter(g=>myRatings[g.id]).sort((a,b)=>(myRatings[b.id]||0)-(myRatings[a.id]||0)).slice(0,3);
  const bestMonth = monthly.indexOf(Math.max(...monthly));
  const totalHours = games.length * 18;
  const avgRating = Object.values(myRatings).length ? (Object.values(myRatings).reduce((a,b)=>a+b,0)/Object.values(myRatings).length).toFixed(1) : "4.2";
  const maxBar = Math.max(...monthly);

  async function generateSummary() {
    setLoadingSummary(true);
    const gameList = games.map(g=>`${g.name}(${myRatings[g.id]||"?"}★)`).join(", ");
    const text = await callClaude(`Write a fun hype Spotify Wrapped-style gaming year-in-review for someone who played: ${gameList}. Top genre: ${topGenre?.[0]}, best month: ${MONTHS[bestMonth]}, ~${totalHours}h total. Personal, exciting, 3 sentences. No bullets.`);
    setAiSummary(text);
    setLoadingSummary(false);
  }

  const slides = [
    // 0 – overview
    <div style={{ textAlign:"center", padding:"10px 0" }}>
      <div style={{ fontSize:56, marginBottom:10 }}>🎮</div>
      <h2 style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:900, fontSize:26, margin:"0 0 6px", background:"linear-gradient(90deg,#00F5FF,#FF00FF,#FFD700)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Your {year} Wrapped</h2>
      <p style={{ color:"#555", fontSize:13, marginBottom:20 }}>It's been quite a year, gamer.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[{icon:"🕹️",label:"Games Logged",val:games.length,c:"#00F5FF"},{icon:"⏱️",label:"Est. Hours",val:totalHours+"h",c:"#FF6B9D"},{icon:"⭐",label:"Avg Rating",val:avgRating+"★",c:"#FFD700"},{icon:"🏆",label:"Top Genre",val:topGenre?.[0]||"—",c:"#7B68EE"}].map(s=>(
          <div key={s.label} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${s.c}33`, borderRadius:14, padding:14, textAlign:"center" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontWeight:900, fontSize:20, color:s.c }}>{s.val}</div>
            <div style={{ fontSize:10, color:"#555" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>,
    // 1 – top games
    <div>
      <p style={{ color:"#666", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Hall of Fame</p>
      <h3 style={{ fontWeight:900, fontSize:22, margin:"0 0 16px" }}>🏆 Your Top Games</h3>
      {topRated.length ? topRated.map((g,i)=>(
        <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", borderRadius:14, padding:12, border:`1.5px solid ${accentColor(i*3)}44` }}>
          <div style={{ fontSize:26, fontWeight:900, color:accentColor(i*3), minWidth:26, textAlign:"center" }}>#{i+1}</div>
          <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#0f0f1a" }}>
            {g.background_image?<img src={g.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{g.name}</div>
            <StarRating rating={myRatings[g.id]||0} size={13} />
          </div>
          {i===0&&<span style={{ fontSize:18 }}>👑</span>}
        </div>
      )) : <p style={{ color:"#444", textAlign:"center" }}>Log & rate games to see your top picks!</p>}
    </div>,
    // 2 – monthly chart
    <div>
      <p style={{ color:"#666", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Activity</p>
      <h3 style={{ fontWeight:900, fontSize:22, margin:"0 0 4px" }}>📅 Monthly Chart</h3>
      <p style={{ color:"#00F5FF", fontWeight:700, fontSize:17, margin:"0 0 18px" }}>{MONTHS[bestMonth]} was your peak 🔥</p>
      <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:110 }}>
        {monthly.map((v,i)=>(
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <div style={{ width:"100%", height:`${(v/maxBar)*90}px`, borderRadius:"4px 4px 0 0", background:i===bestMonth?"linear-gradient(180deg,#FFD700,#FF9800)":`linear-gradient(180deg,${accentColor(i)},${accentColor(i)}55)`, minHeight:4 }} />
            <div style={{ fontSize:8, color:"#444" }}>{MONTHS[i][0]}</div>
          </div>
        ))}
      </div>
    </div>,
    // 3 – DNA + AI
    <div>
      <p style={{ color:"#666", fontSize:10, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Profile</p>
      <h3 style={{ fontWeight:900, fontSize:22, margin:"0 0 14px" }}>🧬 Gaming DNA</h3>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[{icon:"🏅",label:"Fav Genre",val:topGenre?.[0]||"—",c:"#FF6B9D"},{icon:"🖥️",label:"Top Platform",val:topPlatform?.[0]||"—",c:"#00F5FF"},{icon:"⭐",label:"Avg Score",val:avgRating+"★",c:"#FFD700"}].map(s=>(
          <div key={s.label} style={{ flex:1, background:"#1a1a2e", borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontWeight:700, color:s.c, fontSize:13 }}>{s.val}</div>
            <div style={{ fontSize:9, color:"#555" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={generateSummary} disabled={loadingSummary} style={{ width:"100%", padding:12, borderRadius:12, background:"linear-gradient(90deg,#FF00FF,#FFD700)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", marginBottom:12, opacity:loadingSummary?0.6:1 }}>{loadingSummary?"✨ Writing your story...":"✨ Generate AI Year Summary"}</button>
      {loadingSummary && <Spinner small />}
      {aiSummary && (
        <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #FF00FF44", borderRadius:14, padding:14 }}>
          <p style={{ color:"#ddd", fontSize:13, lineHeight:1.7, margin:"0 0 8px", fontStyle:"italic" }}>"{aiSummary}"</p>
          <p style={{ color:"#444", fontSize:10, margin:0, textAlign:"right" }}>— PluggedIn AI</p>
        </div>
      )}
    </div>,
  ];

  return (
    <div>
      {/* Dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>
        {slides.map((_,i)=><div key={i} onClick={()=>setSlide(i)} style={{ width:i===slide?24:8, height:8, borderRadius:4, background:i===slide?"linear-gradient(90deg,#00F5FF,#FF00FF)":"#2a2a3e", transition:"all 0.3s", cursor:"pointer" }} />)}
      </div>
      {/* Slide */}
      <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #2a2a3e", borderRadius:20, padding:20, marginBottom:12, minHeight:260 }}>
        {slides[slide]}
      </div>
      {/* Nav */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>setSlide(s=>Math.max(0,s-1))} disabled={slide===0} style={{ flex:1, padding:11, borderRadius:12, background:"#1a1a2e", border:"1px solid #2a2a3e", color:slide===0?"#333":"#fff", fontWeight:700, fontSize:13, cursor:slide===0?"default":"pointer", fontFamily:"'Exo 2',sans-serif" }}>← Prev</button>
        <button onClick={()=>setSlide(s=>Math.min(slides.length-1,s+1))} disabled={slide===slides.length-1} style={{ flex:1, padding:11, borderRadius:12, background:slide===slides.length-1?"#1a1a2e":"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:slide===slides.length-1?"#333":"#000", fontWeight:700, fontSize:13, cursor:slide===slides.length-1?"default":"pointer", fontFamily:"'Exo 2',sans-serif" }}>Next →</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PluggedIn({ user, onSignOut }) {
  const [tab, setTab] = useState("discover");
  const [subTab, setSubTab] = useState("stats");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState(GENRE_MAP[0]);
  const [platform, setPlatform] = useState(PLATFORM_MAP[0]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [logged, setLogged] = useState({});
  const [ratings, setRatings] = useState({});
  const [listData, setListData] = useState({});
  const [diaryEntry, setDiaryEntry] = useState("");
  const [diaryPosts, setDiaryPosts] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [openList, setOpenList] = useState(null); // name of list being viewed
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("🎮");
  const [customLists, setCustomLists] = useState([]);
  const [rankMode, setRankMode] = useState(false);
  // Profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ username:"", bio:"", location:"", favPlatforms:[], favGenres:[], avatar:null, avatarType:"emoji", avatarEmoji:"🎮" });
  const [favoriteGames, setFavoriteGames] = useState([null,null,null,null]);
  const [pickingFavSlot, setPickingFavSlot] = useState(null);
  const [favGameSearch, setFavGameSearch] = useState("");
  const [favGameResults, setFavGameResults] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Profile activity
  const [profileActivity, setProfileActivity] = useState([]);
  // Reviews state
  const [reviews, setReviews] = useState({}); // { gameId: { text, spoiler, hours, date } }
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewGame, setReviewGame] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ text:"", spoiler:false, hours:"" });
  const [filters, setFilters] = useState({ sort:"-rating", year:"", minRating:0, completion:"All" });
  // Social state
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followFeed, setFollowFeed] = useState([]);
  const [socialSubTab, setSocialSubTab] = useState("feed");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [feedComments, setFeedComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [feedLikes, setFeedLikes] = useState({});
  const debounceRef = useRef(null);
  const loaderRef = useRef(null);
  const saveTimeout = useRef(null);

  // ── Load user data from Firebase on login ──
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.logged) setLogged(data.logged);
          if (data.ratings) setRatings(data.ratings);
          if (data.listData) setListData(data.listData);
          if (data.diaryPosts) setDiaryPosts(data.diaryPosts);
          if (data.customLists) setCustomLists(data.customLists);
          if (data.reviews) setReviews(data.reviews);
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.filter(n=>!n.read).length);
          }
          if (data.profileData) setProfileData(pd => ({ ...pd, ...data.profileData }));
          if (data.favoriteGames) setFavoriteGames(data.favoriteGames);
        }
      } catch(e) { console.error("Load error:", e); }
    };
    load();
  }, [user]);

  // ── Save user data to Firebase (debounced) ──
  const saveToCloud = useCallback((newLogged, newRatings, newListData, newDiaryPosts, newCustomLists) => {
    if (!user) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const ref = doc(db, "users", user.uid);
        await setDoc(ref, {
          logged: newLogged,
          ratings: newRatings,
          listData: newListData,
          diaryPosts: newDiaryPosts,
          reviews: reviews,
          ...(newCustomLists !== undefined && { customLists: newCustomLists }),
          username: user.displayName || "Gamer",
          email: user.email,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch(e) { console.error("Save error:", e); }
    }, 1000);
  }, [user]);

  async function saveProfile(newProfileData, newFavGames) {
    setSavingProfile(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        profileData: newProfileData,
        favoriteGames: newFavGames,
        username: newProfileData.username || user.displayName || "Gamer",
      }, { merge: true });
    } catch(e) { console.error(e); }
    setSavingProfile(false);
  }

  // Save customLists whenever they change
  const saveCustomListsRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    clearTimeout(saveCustomListsRef.current);
    saveCustomListsRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", user.uid), { customLists }, { merge: true });
      } catch(e) { console.error(e); }
    }, 1000);
  }, [customLists, user]);

  async function searchFavGames(q) {
    if (!q.trim()) { setFavGameResults([]); return; }
    try {
      const params = new URLSearchParams({ key: RAWG_KEY, search: q, page_size: 8, search_precise: "true" });
      const res = await fetch(RAWG + "/games?" + params);
      const data = await res.json();
      setFavGameResults(data.results || []);
    } catch(e) { console.error(e); }
  }

  async function searchUsers(q) {
    if (!q.trim()) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "users"));
      const results = snap.docs
        .filter(d => d.id !== user.uid && (d.data().username||"").toLowerCase().includes(q.toLowerCase()))
        .map(d => ({ uid: d.id, username: d.data().username||"Gamer", loggedCount: Object.values(d.data().logged||{}).filter(Boolean).length, followersCount: (d.data().followers||[]).length }))
        .slice(0, 15);
      setUserResults(results);
    } catch(e) { console.error(e); }
    setSearchingUsers(false);
  }

  async function toggleFollow(targetUser) {
    const isFollowing = following.includes(targetUser.uid);
    try {
      const { updateDoc, arrayUnion, arrayRemove } = await import("firebase/firestore");
      if (isFollowing) {
        await updateDoc(doc(db, "users", user.uid), { following: arrayRemove(targetUser.uid) });
        await updateDoc(doc(db, "users", targetUser.uid), { followers: arrayRemove(user.uid) });
        setFollowing(f => f.filter(id => id !== targetUser.uid));
      } else {
        await updateDoc(doc(db, "users", user.uid), { following: arrayUnion(targetUser.uid) });
        await updateDoc(doc(db, "users", targetUser.uid), { followers: arrayUnion(user.uid) });
        setFollowing(f => [...f, targetUser.uid]);
      }
    } catch(e) { console.error(e); }
  }

  function toggleLike(feedIdx) {
    setFeedLikes(prev => {
      const cur = prev[feedIdx] || [];
      const liked = cur.includes(user.uid);
      return { ...prev, [feedIdx]: liked ? cur.filter(id=>id!==user.uid) : [...cur, user.uid] };
    });
  }

  function postComment(feedIdx) {
    const text = commentInput[feedIdx];
    if (!text?.trim()) return;
    setFeedComments(prev => ({ ...prev, [feedIdx]: [...(prev[feedIdx]||[]), { user: user.displayName||"Gamer", text, time: "Just now" }] }));
    setCommentInput(prev => ({ ...prev, [feedIdx]: "" }));
  }

  // Build profile activity feed from user actions
  useEffect(() => {
    const acts = [];
    Object.entries(logged).forEach(([id, isLogged]) => {
      if (!isLogged) return;
      const entry = listData[id];
      const game = entry?.game;
      if (!game) return;
      acts.push({ type:"logged", game, rating: ratings[id]||null, date: entry?.loggedAt||"Recently", id:`log-${id}` });
    });
    Object.entries(reviews).forEach(([id, rev]) => {
      acts.push({ type:"review", game:{ id, name:rev.gameName, background_image:rev.gameCover, genres:[{name:rev.gameGenre}] }, review:rev, date:rev.date||"Recently", id:`rev-${id}` });
    });
    customLists.forEach(list => {
      acts.push({ type:"list", list, date:"Recently", id:`list-${list.name}` });
    });
    Object.entries(ratings).forEach(([id, r]) => {
      const entry = listData[id]; const game = entry?.game;
      if (!game) return;
      acts.push({ type:"rated", game, rating:r, date:"Recently", id:`rate-${id}` });
    });
    setProfileActivity(acts.slice(0, 30));
  }, [logged, ratings, reviews, customLists, listData]);

  // Write a notification to another user's Firestore doc
  async function pushNotification(toUid, notif) {
    try {
      const { updateDoc, arrayUnion } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", toUid), {
        notifications: arrayUnion({ ...notif, read: false, id: Date.now()+Math.random(), createdAt: new Date().toISOString() })
      });
    } catch(e) { console.error(e); }
  }

  async function markAllRead() {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    try {
      await setDoc(doc(db, "users", user.uid), { notifications: updated }, { merge: true });
    } catch(e) { console.error(e); }
  }

  const fetchGames = useCallback(async (pg, reset, searchOverride) => {
    setLoading(true);
    const q = searchOverride !== undefined ? searchOverride : search;
    try {
      const paramObj = { key: RAWG_KEY, page_size: 20, page: pg };
      if (q) {
        paramObj.search = q;
        paramObj.search_precise = "true";
      } else {
        paramObj.ordering = filters.sort;
      }
      if (genre.slug) paramObj.genres = genre.slug;
      if (platform.id) paramObj.platforms = platform.id;
      if (filters.year) paramObj.dates = filters.year;
      if (filters.minRating > 0) paramObj.rating = filters.minRating + ",5";
      const params = new URLSearchParams(paramObj);
      const res = await fetch(RAWG + "/games?" + params);
      const data = await res.json();
      if (data.results) {
        setGames(prev => reset ? data.results : [...prev, ...data.results]);
        setHasMore(!!data.next);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [search, genre, platform, filters]);

  useEffect(() => {
    setPage(1);
    setGames([]);
    fetchGames(1, true);
  }, [search, genre, platform, filters]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => { const n = p + 1; fetchGames(n, false); return n; });
      }
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, fetchGames]);

  const handleSearch = val => { setSearchInput(val); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(()=>setSearch(val),500); };
  const loggedGames = Object.keys(logged).filter(id=>logged[id]).map(id=>games.find(g=>String(g.id)===id)).filter(Boolean);
  const activeFilters = [filters.sort!=="-rating",!!filters.year,filters.minRating>0,filters.completion!=="All"].filter(Boolean).length;

  const tabs = [
    {id:"discover",icon:"🔍",label:"Discover"},{id:"diary",icon:"📖",label:"Diary"},
    {id:"lists",icon:"📋",label:"Lists"},{id:"social",icon:"👥",label:"Social"},{id:"profile",icon:"👤",label:"Profile"},
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div style={{ minHeight:"100vh", background:"#080812", fontFamily:"'Exo 2','Segoe UI',sans-serif", color:"#fff", maxWidth:430, margin:"0 auto", paddingBottom:80 }}>

        <div style={{ padding:"18px 16px 0", position:"sticky", top:0, zIndex:100, background:"linear-gradient(180deg,#0d0d20 80%,transparent)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:900, fontSize:26, background:"linear-gradient(90deg,#00F5FF,#FF00FF,#FFD700)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PluggedIn</div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {/* Bell icon */}
              <button onClick={()=>{ setShowNotifs(n=>!n); if(unreadCount>0) markAllRead(); }} style={{ position:"relative", background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>
                🔔
                {unreadCount > 0 && <div style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#FF00FF", boxShadow:"0 0 6px #FF00FF" }} />}
              </button>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, overflow:"hidden" }}>
                {profileData.avatarType==="photo"&&profileData.avatar ? <img src={profileData.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : profileData.avatarEmoji||"🎮"}
              </div>
            </div>
          </div>
          {/* Notification dropdown */}
          {showNotifs && (
            <div style={{ position:"absolute", top:60, right:16, width:300, background:"#0f0f1a", border:"1.5px solid #2a2a3e", borderRadius:16, boxShadow:"0 8px 32px #000a", zIndex:500, maxHeight:360, overflowY:"auto" }}>
              <div style={{ padding:"12px 16px 8px", borderBottom:"1px solid #1a1a2e", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:13 }}>🔔 Notifications</span>
                {notifications.length>0 && <button onClick={()=>setNotifications([])} style={{ background:"none", border:"none", color:"#444", fontSize:11, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Clear all</button>}
              </div>
              {notifications.length===0 ? (
                <div style={{ padding:24, textAlign:"center", color:"#444", fontSize:13 }}>No notifications yet</div>
              ) : [...notifications].reverse().map((n,i)=>(
                <div key={i} style={{ padding:"10px 16px", borderBottom:"1px solid #1a1a2e88", background:n.read?"transparent":"#FF00FF08", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{n.type==="like"?"❤️":"💬"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:"#ccc" }}><span style={{ color:"#00F5FF", fontWeight:700 }}>@{n.fromName}</span> {n.text}</div>
                    <div style={{ fontSize:10, color:"#444", marginTop:2 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"0 14px" }}>

          {/* DISCOVER */}
          {tab==="discover" && (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ position:"relative", flex:1 }}>
                  <input value={searchInput} onChange={e=>handleSearch(e.target.value)} placeholder="Search 500,000+ games..." style={{ width:"100%", padding:"11px 36px 11px 40px", background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:12, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔍</span>
                  {searchInput && <button onClick={()=>{setSearchInput("");setSearch("");}} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16 }}>✕</button>}
                </div>
                <button onClick={()=>setShowFilter(true)} style={{ position:"relative", padding:"0 14px", borderRadius:12, background:activeFilters?"linear-gradient(90deg,#00F5FF22,#FF00FF22)":"#1a1a2e", border:`1.5px solid ${activeFilters?"#00F5FF":"#2a2a3e"}`, color:activeFilters?"#00F5FF":"#666", cursor:"pointer", fontSize:18, flexShrink:0 }}>
                  🎛️{activeFilters>0&&<div style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:"#FF00FF" }}/>}
                </button>
              </div>
              <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:6, marginBottom:6, scrollbarWidth:"none" }}>
                {GENRE_MAP.map(g=><Pill key={g.label} label={g.label} active={genre.label===g.label} onClick={()=>setGenre(g)} />)}
              </div>
              <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:10, marginBottom:14, scrollbarWidth:"none" }}>
                {PLATFORM_MAP.map(p=><Pill key={p.label} label={p.label} active={platform.label===p.label} onClick={()=>setPlatform(p)} gold />)}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:10, color:"#555", letterSpacing:2, textTransform:"uppercase" }}>{search?`"${search}"`:`${genre.slug?`Top ${genre.label}`:"🔥 Top Rated"}`}</span>
                {activeFilters>0&&<span style={{ fontSize:10, color:"#00F5FF", background:"#00F5FF11", borderRadius:20, padding:"2px 8px" }}>{activeFilters} filter{activeFilters!==1?"s":""} active</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {games.map(game=><GameCard key={game.id} game={game} onOpen={setSelectedGame} logged={!!logged[game.id]} />)}
              </div>
              {loading&&<div style={{ display:"flex", justifyContent:"center", padding:32 }}><div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #1a1a2e", borderTop:"3px solid #00F5FF", animation:"spin 0.8s linear infinite" }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
              {!loading&&games.length===0&&<div style={{ textAlign:"center", color:"#444", padding:48 }}><div style={{ fontSize:40 }}>🎮</div><p>No games found</p></div>}
              <div ref={loaderRef} style={{ height:20 }} />
            </div>
          )}

          {/* DIARY */}
          {tab==="diary" && (
            <div>
              <h2 style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>🎮 Game Diary</h2>
              <p style={{ color:"#666", fontSize:13, marginBottom:18 }}>Track your gaming journey</p>
              <div style={{ background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:16, padding:16, marginBottom:18 }}>
                <p style={{ color:"#888", fontSize:13, marginBottom:8 }}>📝 What are you playing today?</p>
                <textarea value={diaryEntry} onChange={e=>setDiaryEntry(e.target.value)} placeholder="Share your gaming thoughts..." rows={3} style={{ width:"100%", background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:8, color:"#fff", fontSize:13, padding:10, fontFamily:"'Exo 2',sans-serif", resize:"none", outline:"none", boxSizing:"border-box" }} />
                <button onClick={()=>{
                  if(!diaryEntry.trim())return;
                  const updated=[{text:diaryEntry,time:"Just now"},...diaryPosts];
                  setDiaryPosts(updated);
                  setDiaryEntry("");
                  saveToCloud(logged,ratings,listData,updated);
                }} style={{ marginTop:8, padding:"8px 18px", borderRadius:8, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Post Entry</button>
              </div>
              {diaryPosts.map((p,i)=><div key={i} style={{ background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:12, padding:14, marginBottom:10 }}><p style={{ color:"#ddd", fontSize:13, margin:"0 0 6px" }}>{p.text}</p><span style={{ color:"#444", fontSize:11 }}>{p.time}</span></div>)}
              <div style={{ fontSize:10, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Recently Logged</div>
              {loggedGames.length===0?<div style={{ textAlign:"center", color:"#333", padding:40 }}><div style={{ fontSize:40 }}>📖</div><p>Discover games and start logging!</p></div>:loggedGames.map(game=>(
                <div key={game.id} onClick={()=>setSelectedGame(game)} style={{ background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:14, padding:12, marginBottom:10, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                  <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", background:"#0f0f1a", flexShrink:0 }}>{game.background_image?<img src={game.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎮</div>}</div>
                  <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.name}</div><div style={{ color:"#555", fontSize:11 }}>{game.released?.slice(0,4)}</div><StarRating rating={ratings[game.id]||0} size={13} /></div>
                  <div style={{ background:"#059669", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700 }}>✓</div>
                </div>
              ))}
            </div>
          )}

          {/* LISTS */}
          {tab==="lists" && (
            <div>
              {/* LIST DETAIL VIEW */}
              {openList ? (() => {
                const allLists = [...LISTS, ...customLists];
                const list = allLists.find(l => l.name === openList);
                const gamesInList = Object.keys(listData).filter(id => {
                  const entry = listData[id];
                  const ls = entry?.lists || (Array.isArray(entry) ? entry : []);
                  return ls.includes(openList);
                });
                const listGames = gamesInList.map(id => {
                  const entry = listData[id];
                  return entry?.game || games.find(g => String(g.id) === id);
                }).filter(Boolean);
                // For custom lists, also check rankOrder
                const rankOrder = list?.rankOrder || [];
                const sortedGames = rankMode && rankOrder.length
                  ? [...listGames].sort((a,b) => rankOrder.indexOf(String(a.id)) - rankOrder.indexOf(String(b.id)))
                  : listGames;
                return (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                      <button onClick={()=>{ setOpenList(null); setRankMode(false); }} style={{ background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#aaa", padding:"8px 12px", cursor:"pointer", fontSize:14, fontFamily:"'Exo 2',sans-serif" }}>← Back</button>
                      <div style={{ flex:1 }}>
                        <h2 style={{ fontWeight:900, fontSize:20, margin:0 }}>{list?.icon} {openList}</h2>
                        <p style={{ color:"#555", fontSize:12, margin:0 }}>{listGames.length} game{listGames.length!==1?"s":""}</p>
                      </div>
                      <button onClick={()=>setRankMode(r=>!r)} style={{ padding:"8px 12px", borderRadius:10, background:rankMode?"linear-gradient(90deg,#FFD700,#FF9800)":"#1a1a2e", border:`1px solid ${rankMode?"#FFD700":"#2a2a3e"}`, color:rankMode?"#000":"#666", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>🏆 Rank</button>
                    </div>
                    {listGames.length === 0 ? (
                      <div style={{ textAlign:"center", color:"#444", padding:48 }}>
                        <div style={{ fontSize:40 }}>🎮</div>
                        <p>No games in this list yet.</p>
                        <p style={{ fontSize:12, color:"#333" }}>Go to Discover and add games!</p>
                      </div>
                    ) : sortedGames.map((game, i) => (
                      <div key={game.id} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${accentColor(game.id)}33`, borderRadius:14, padding:12, marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                        {rankMode && (
                          <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
                            <button onClick={()=>{
                              const ids = sortedGames.map(g=>String(g.id));
                              if(i===0) return;
                              [ids[i], ids[i-1]] = [ids[i-1], ids[i]];
                              setCustomLists(prev => prev.map(l => l.name===openList ? {...l, rankOrder:ids} : l));
                            }} style={{ background:"#2a2a3e", border:"none", color:"#aaa", borderRadius:6, padding:"2px 6px", cursor:"pointer", fontSize:12 }}>▲</button>
                            <button onClick={()=>{
                              const ids = sortedGames.map(g=>String(g.id));
                              if(i===sortedGames.length-1) return;
                              [ids[i], ids[i+1]] = [ids[i+1], ids[i]];
                              setCustomLists(prev => prev.map(l => l.name===openList ? {...l, rankOrder:ids} : l));
                            }} style={{ background:"#2a2a3e", border:"none", color:"#aaa", borderRadius:6, padding:"2px 6px", cursor:"pointer", fontSize:12 }}>▼</button>
                          </div>
                        )}
                        <div style={{ width:36, height:36, borderRadius:8, fontWeight:900, fontSize:16, color:rankMode?"#FFD700":"#555", minWidth:36, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>#{i+1}</div>
                        <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", background:"#0f0f1a", flexShrink:0 }}>
                          {game.background_image ? <img src={game.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.name}</div>
                          <div style={{ color:"#555", fontSize:11 }}>{game.genres?.[0]?.name} • {game.released?.slice(0,4)}</div>
                          {ratings[game.id] && <StarRating rating={ratings[game.id]} size={12} />}
                        </div>
                        <button onClick={()=>{
                          const entry = listData[game.id];
                          const curLists = entry?.lists||(Array.isArray(entry)?entry:[]);
                          const newLists = curLists.filter(l=>l!==openList);
                          const updated = {...listData, [game.id]:{...entry, lists:newLists}};
                          setListData(updated);
                          saveToCloud(logged, ratings, updated, diaryPosts, customLists);
                        }} style={{ background:"none", border:"none", color:"#FF6B6B", fontSize:18, cursor:"pointer", flexShrink:0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div>
                  <h2 style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>📋 My Lists</h2>
                  <p style={{ color:"#666", fontSize:13, marginBottom:18 }}>Organize your gaming life</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
                    {[{label:"Logged",value:Object.values(logged).filter(Boolean).length,icon:"✅",color:"#059669"},{label:"This Year",value:12,icon:"📅",color:"#3B82F6"},{label:"Avg Rating",value:Object.values(ratings).length?(Object.values(ratings).reduce((a,b)=>a+b,0)/Object.values(ratings).length).toFixed(1)+"★":"—",icon:"⭐",color:"#FFD700"}].map(s=>(
                      <div key={s.label} style={{ background:"#1a1a2e", border:`1.5px solid ${s.color}44`, borderRadius:12, padding:"13px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:18 }}>{s.icon}</div>
                        <div style={{ fontWeight:900, fontSize:20, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:10, color:"#555" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Default lists */}
                  {[...LISTS, ...customLists].map(list => {
                    const count = Object.values(listData).filter(entry=>{ const ls=entry?.lists||(Array.isArray(entry)?entry:[]); return ls.includes(list.name); }).length;
                    return (
                      <div key={list.name} onClick={()=>setOpenList(list.name)} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${list.color}44`, borderRadius:14, padding:14, marginBottom:10, display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"all 0.2s" }}>
                        <div style={{ width:46, height:46, borderRadius:12, background:`${list.color}22`, border:`1.5px solid ${list.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{list.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15 }}>{list.name}</div>
                          <div style={{ color:"#555", fontSize:12 }}>{count} game{count!==1?"s":""}</div>
                        </div>
                        <div style={{ color:list.color, fontSize:20 }}>›</div>
                      </div>
                    );
                  })}

                  {/* Create new list button */}
                  <button onClick={()=>setShowNewList(true)} style={{ width:"100%", padding:13, borderRadius:14, marginTop:4, background:"#1a1a2e", border:"1.5px dashed #2a2a3e", color:"#00F5FF", fontSize:14, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", fontWeight:600 }}>+ Create New List</button>

                  {/* New list form */}
                  {showNewList && (
                    <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #00F5FF44", borderRadius:16, padding:18, marginTop:14 }}>
                      <p style={{ fontWeight:700, fontSize:15, margin:"0 0 14px" }}>✨ New List</p>
                      <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>List Name</p>
                      <input value={newListName} onChange={e=>setNewListName(e.target.value)} placeholder='e.g. "Favorite Sports Games"' style={{ width:"100%", padding:"10px 12px", background:"#080812", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box", marginBottom:12 }} />
                      <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Pick an Icon</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                        {["🎮","⭐","🏆","❤️","🔥","💎","👾","🕹️","🌟","⚡","🎯","🧩"].map(icon=>(
                          <button key={icon} onClick={()=>setNewListIcon(icon)} style={{ width:38, height:38, borderRadius:10, background:newListIcon===icon?"linear-gradient(135deg,#00F5FF33,#FF00FF33)":"#0f0f1a", border:`1.5px solid ${newListIcon===icon?"#00F5FF":"#2a2a3e"}`, fontSize:18, cursor:"pointer" }}>{icon}</button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>{ setShowNewList(false); setNewListName(""); setNewListIcon("🎮"); }} style={{ flex:1, padding:11, borderRadius:10, background:"#0f0f1a", border:"1px solid #2a2a3e", color:"#666", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Cancel</button>
                        <button onClick={()=>{
                          if(!newListName.trim()) return;
                          const color = ["#FF6B9D","#00F5FF","#FFD700","#7B68EE","#66BB6A","#FF9800"][customLists.length % 6];
                          setCustomLists(prev=>[...prev, { name:newListName.trim(), icon:newListIcon, color, rankOrder:[] }]);
                          setShowNewList(false); setNewListName(""); setNewListIcon("🎮");
                        }} style={{ flex:2, padding:11, borderRadius:10, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Create List</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SOCIAL */}
          {tab==="social" && (
            <div>
              <h2 style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>👥 Social</h2>

              {/* Sub-tabs */}
              <div style={{ display:"flex", gap:6, marginBottom:18, background:"#1a1a2e", borderRadius:12, padding:4 }}>
                {[{id:"feed",label:"🏠 Feed"},{id:"following",label:`Following ${following.length}`},{id:"followers",label:`Followers ${followers.length}`},{id:"find",label:"🔍 Find"}].map(t=>(
                  <button key={t.id} onClick={()=>setSocialSubTab(t.id)} style={{ flex:1, padding:"7px 2px", borderRadius:8, background:socialSubTab===t.id?"linear-gradient(90deg,#00F5FF22,#FF00FF22)":"none", border:socialSubTab===t.id?"1px solid #00F5FF44":"none", color:socialSubTab===t.id?"#00F5FF":"#555", fontWeight:socialSubTab===t.id?700:400, fontSize:10, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{t.label}</button>
                ))}
              </div>

              {/* FEED */}
              {socialSubTab==="feed" && (
                <div>
                  {followFeed.length===0 ? (
                    <div style={{ textAlign:"center", padding:40 }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🎮</div>
                      <p style={{ color:"#555", marginBottom:6 }}>Your feed is empty</p>
                      <p style={{ color:"#444", fontSize:12, marginBottom:20 }}>Follow other gamers to see their activity here!</p>
                      <button onClick={()=>setSocialSubTab("find")} style={{ padding:"10px 24px", borderRadius:12, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Find Gamers to Follow</button>
                    </div>
                  ) : followFeed.map((item,i)=>(
                    <div key={i} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #2a2a3e", borderRadius:14, padding:14, marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#000", flexShrink:0 }}>{item.username[0].toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:13 }}><span style={{ color:"#00F5FF" }}>@{item.username}</span><span style={{ color:"#555", fontWeight:400 }}> logged a game</span></div>
                          <div style={{ color:"#444", fontSize:11 }}>{item.time}</div>
                        </div>
                        {item.rating && <div style={{ color:"#FFD700", fontSize:13 }}>{"★".repeat(item.rating)}</div>}
                      </div>
                      {/* Actions */}
                      <div style={{ display:"flex", gap:12, marginBottom:8 }}>
                        <button onClick={()=>toggleLike(i)} style={{ background:"none", border:"none", color:(feedLikes[i]||[]).includes(user.uid)?"#FF6B9D":"#555", fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", display:"flex", alignItems:"center", gap:4, transition:"color 0.15s" }}>
                          {(feedLikes[i]||[]).includes(user.uid)?"❤️":"🤍"} {(feedLikes[i]||[]).length||0}
                        </button>
                        <button onClick={()=>setCommentInput(p=>({...p,[i]:p[i]===undefined?"":undefined}))} style={{ background:"none", border:"none", color:"#555", fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>
                          💬 {(feedComments[i]||[]).length}
                        </button>
                      </div>
                      {/* Comments */}
                      {(feedComments[i]||[]).map((c,j)=>(
                        <div key={j} style={{ background:"#ffffff06", borderRadius:8, padding:"6px 10px", marginBottom:6, fontSize:12 }}>
                          <span style={{ color:"#00F5FF", fontWeight:700 }}>@{c.user} </span>
                          <span style={{ color:"#888" }}>{c.text}</span>
                          <span style={{ color:"#333", fontSize:10, marginLeft:8 }}>{c.time}</span>
                        </div>
                      ))}
                      {commentInput[i] !== undefined && (
                        <div style={{ display:"flex", gap:8, marginTop:8 }}>
                          <input value={commentInput[i]||""} onChange={e=>setCommentInput(p=>({...p,[i]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&postComment(i)} placeholder="Add a comment..." style={{ flex:1, background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:8, color:"#fff", padding:"8px 10px", fontSize:12, fontFamily:"'Exo 2',sans-serif", outline:"none" }} />
                          <button onClick={()=>postComment(i)} style={{ padding:"8px 12px", borderRadius:8, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Post</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* FOLLOWING */}
              {socialSubTab==="following" && (
                <div>
                  {following.length===0 ? (
                    <div style={{ textAlign:"center", padding:40 }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🔭</div>
                      <p style={{ color:"#555", marginBottom:16 }}>You're not following anyone yet</p>
                      <button onClick={()=>setSocialSubTab("find")} style={{ padding:"10px 24px", borderRadius:12, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Find Gamers</button>
                    </div>
                  ) : userResults.filter(u=>following.includes(u.uid)).map((u,i)=>(
                    <div key={i} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #2a2a3e", borderRadius:14, padding:14, marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#000" }}>{u.username[0].toUpperCase()}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:700 }}>@{u.username}</div><div style={{ color:"#555", fontSize:12 }}>{u.loggedCount} games logged</div></div>
                      <button onClick={()=>toggleFollow(u)} style={{ padding:"8px 14px", borderRadius:10, background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#aaa", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Unfollow</button>
                    </div>
                  ))}
                  {following.length > 0 && userResults.filter(u=>following.includes(u.uid)).length===0 && (
                    <div style={{ textAlign:"center", color:"#444", padding:24 }}>
                      <p>You follow {following.length} gamer{following.length!==1?"s":""}.</p>
                      <button onClick={()=>setSocialSubTab("find")} style={{ marginTop:8, padding:"8px 18px", borderRadius:10, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>Search to manage</button>
                    </div>
                  )}
                </div>
              )}

              {/* FOLLOWERS */}
              {socialSubTab==="followers" && (
                <div>
                  {followers.length===0 ? (
                    <div style={{ textAlign:"center", padding:40 }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>
                      <p style={{ color:"#555" }}>No followers yet</p>
                      <p style={{ color:"#444", fontSize:12 }}>Keep logging games — people will find you!</p>
                    </div>
                  ) : (
                    <div style={{ textAlign:"center", color:"#555", padding:24 }}>
                      <p style={{ color:"#00F5FF", fontWeight:700, fontSize:20 }}>{followers.length}</p>
                      <p>people follow you 🎮</p>
                    </div>
                  )}
                </div>
              )}

              {/* FIND & DISCOVER USERS */}
              {socialSubTab==="find" && (
                <div>
                  {/* Search bar */}
                  <div style={{ position:"relative", marginBottom:16 }}>
                    <input value={userSearch} onChange={e=>{ setUserSearch(e.target.value); searchUsers(e.target.value); }} placeholder="Search by username..." style={{ width:"100%", padding:"11px 14px 11px 40px", background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:12, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
                    <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔍</span>
                    {userSearch && <button onClick={()=>{ setUserSearch(""); setUserResults([]); }} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16 }}>✕</button>}
                  </div>
                  {searchingUsers && <Spinner small />}

                  {/* Search results */}
                  {userSearch ? (
                    <>
                      {userResults.length===0 && !searchingUsers && (
                        <div style={{ textAlign:"center", color:"#444", padding:24 }}>No users found for "{userSearch}"</div>
                      )}
                      {userResults.map((u,i) => {
                        const isFollowing = following.includes(u.uid);
                        return <UserCard key={i} u={u} isFollowing={isFollowing} onFollow={()=>toggleFollow(u)} />;
                      })}
                    </>
                  ) : (
                    /* Discover People — shown when no search */
                    <DiscoverPeople following={following} currentUid={user.uid} onFollow={toggleFollow} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {tab==="profile" && (
            <div>
              {/* EDIT PROFILE PANEL */}
              {showEditProfile ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                    <button onClick={()=>setShowEditProfile(false)} style={{ background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#aaa", padding:"8px 12px", cursor:"pointer", fontSize:14, fontFamily:"'Exo 2',sans-serif" }}>← Back</button>
                    <h2 style={{ fontWeight:900, fontSize:20, margin:0, flex:1 }}>✏️ Edit Profile</h2>
                  </div>

                  {/* Avatar section */}
                  <div style={{ background:"#1a1a2e", borderRadius:16, padding:16, marginBottom:14 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"0 0 12px" }}>Profile Picture</p>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                      <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, overflow:"hidden", flexShrink:0, boxShadow:"0 0 20px #FF00FF66" }}>
                        {profileData.avatarType==="photo" && profileData.avatar ? <img src={profileData.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : profileData.avatarEmoji||"🎮"}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:"#888", fontSize:12, margin:"0 0 8px" }}>Choose how to set your avatar</p>
                        <div style={{ display:"flex", gap:8 }}>
                          <label style={{ flex:1, padding:"8px", borderRadius:10, background:"linear-gradient(90deg,#00F5FF22,#7B68EE22)", border:"1px solid #00F5FF44", color:"#00F5FF", fontWeight:700, fontSize:11, cursor:"pointer", textAlign:"center", fontFamily:"'Exo 2',sans-serif" }}>
                            📷 Upload Photo
                            <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => setProfileData(pd=>({...pd, avatar:ev.target.result, avatarType:"photo"}));
                              reader.readAsDataURL(file);
                            }} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Or pick a gaming avatar</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {["🎮","👾","🕹️","⚔️","🏆","💎","🔥","⭐","🦊","🐉","🤖","🎯","🌟","👑","🦄","💀"].map(em=>(
                        <button key={em} onClick={()=>setProfileData(pd=>({...pd,avatarEmoji:em,avatarType:"emoji"}))} style={{ width:40, height:40, borderRadius:10, background:profileData.avatarEmoji===em&&profileData.avatarType==="emoji"?"linear-gradient(135deg,#FF00FF33,#00F5FF33)":"#0f0f1a", border:`1.5px solid ${profileData.avatarEmoji===em&&profileData.avatarType==="emoji"?"#00F5FF":"#2a2a3e"}`, fontSize:20, cursor:"pointer" }}>{em}</button>
                      ))}
                    </div>
                  </div>

                  {/* Username */}
                  <div style={{ marginBottom:12 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>Username</p>
                    <input value={profileData.username} onChange={e=>setProfileData(pd=>({...pd,username:e.target.value}))} placeholder={user?.displayName||"GamerTag"} style={{ width:"100%", padding:"11px 14px", background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
                  </div>

                  {/* Bio */}
                  <div style={{ marginBottom:12 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>Bio / Tagline</p>
                    <textarea value={profileData.bio} onChange={e=>setProfileData(pd=>({...pd,bio:e.target.value}))} placeholder="e.g. RPG addict. Souls veteran. Here to vibe." rows={2} style={{ width:"100%", padding:"11px 14px", background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", fontSize:13, fontFamily:"'Exo 2',sans-serif", outline:"none", resize:"none", boxSizing:"border-box" }} />
                  </div>

                  {/* Location */}
                  <div style={{ marginBottom:14 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 6px" }}>Location</p>
                    <input value={profileData.location} onChange={e=>setProfileData(pd=>({...pd,location:e.target.value}))} placeholder="e.g. New York, USA" style={{ width:"100%", padding:"11px 14px", background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
                  </div>

                  {/* Fav Platforms */}
                  <div style={{ marginBottom:14 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Favorite Platforms</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {["PC","PS5","PS4","Xbox","Switch","Mobile","Steam Deck"].map(p=>{
                        const active=profileData.favPlatforms?.includes(p);
                        return <button key={p} onClick={()=>setProfileData(pd=>({...pd,favPlatforms:active?pd.favPlatforms.filter(x=>x!==p):[...(pd.favPlatforms||[]),p]}))} style={{ padding:"6px 13px", borderRadius:20, background:active?"linear-gradient(90deg,#00F5FF,#FF00FF)":"#1a1a2e", border:"none", color:active?"#000":"#666", fontWeight:active?700:400, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{p}</button>;
                      })}
                    </div>
                  </div>

                  {/* Fav Genres */}
                  <div style={{ marginBottom:20 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Favorite Genres</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {["RPG","Action","Shooter","Adventure","Puzzle","Strategy","Simulation","Indie","Horror","Sports","Fighting","Platformer"].map(g=>{
                        const active=profileData.favGenres?.includes(g);
                        return <button key={g} onClick={()=>setProfileData(pd=>({...pd,favGenres:active?pd.favGenres.filter(x=>x!==g):[...(pd.favGenres||[]),g]}))} style={{ padding:"6px 13px", borderRadius:20, background:active?"linear-gradient(90deg,#FF00FF,#7B68EE)":"#1a1a2e", border:"none", color:active?"#fff":"#666", fontWeight:active?700:400, fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{g}</button>;
                      })}
                    </div>
                  </div>

                  <button onClick={async()=>{ await saveProfile(profileData, favoriteGames); setShowEditProfile(false); }} disabled={savingProfile} style={{ width:"100%", padding:13, borderRadius:12, background:"linear-gradient(90deg,#00F5FF,#FF00FF)", border:"none", color:"#000", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", opacity:savingProfile?0.6:1 }}>{savingProfile?"Saving...":"💾 Save Profile"}</button>
                </div>
              ) : pickingFavSlot!==null ? (
                /* PICK FAVORITE GAME */
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <button onClick={()=>{ setPickingFavSlot(null); setFavGameSearch(""); setFavGameResults([]); }} style={{ background:"#1a1a2e", border:"1px solid #2a2a3e", borderRadius:10, color:"#aaa", padding:"8px 12px", cursor:"pointer", fontSize:14, fontFamily:"'Exo 2',sans-serif" }}>← Back</button>
                    <h2 style={{ fontWeight:900, fontSize:18, margin:0 }}>Pick Favorite #{pickingFavSlot+1}</h2>
                  </div>
                  <div style={{ position:"relative", marginBottom:14 }}>
                    <input value={favGameSearch} onChange={e=>{ setFavGameSearch(e.target.value); searchFavGames(e.target.value); }} placeholder="Search any game..." style={{ width:"100%", padding:"11px 14px 11px 40px", background:"#1a1a2e", border:"1.5px solid #2a2a3e", borderRadius:12, color:"#fff", fontSize:14, fontFamily:"'Exo 2',sans-serif", outline:"none", boxSizing:"border-box" }} />
                    <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔍</span>
                  </div>
                  {favGameResults.map(g=>(
                    <div key={g.id} onClick={()=>{ const updated=[...favoriteGames]; updated[pickingFavSlot]={id:g.id,name:g.name,background_image:g.background_image,genres:g.genres,released:g.released}; setFavoriteGames(updated); saveProfile(profileData,updated); setPickingFavSlot(null); setFavGameSearch(""); setFavGameResults([]); }} style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a2e", borderRadius:12, padding:10, marginBottom:8, cursor:"pointer" }}>
                      <div style={{ width:48, height:48, borderRadius:8, overflow:"hidden", background:"#0f0f1a", flexShrink:0 }}>{g.background_image?<img src={g.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}</div>
                      <div><div style={{ fontWeight:700, fontSize:13 }}>{g.name}</div><div style={{ color:"#555", fontSize:11 }}>{g.genres?.[0]?.name} · {g.released?.slice(0,4)}</div></div>
                    </div>
                  ))}
                  {!favGameSearch && <div style={{ textAlign:"center", color:"#444", padding:32 }}><p>Search for a game to add to your favorites</p></div>}
                </div>
              ) : (
                /* MAIN PROFILE VIEW */
                <div>
                  {/* Profile card */}
                  <div style={{ background:"linear-gradient(145deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #2a2a3e", borderRadius:20, padding:20, marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                      <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#FF00FF,#00F5FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, overflow:"hidden", flexShrink:0, boxShadow:"0 0 24px #FF00FF88" }}>
                        {profileData.avatarType==="photo" && profileData.avatar ? <img src={profileData.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : profileData.avatarEmoji||"🎮"}
                      </div>
                      <div style={{ flex:1 }}>
                        <h2 style={{ fontWeight:900, fontSize:20, margin:"0 0 2px" }}>{profileData.username||user?.displayName||"Gamer"}</h2>
                        {profileData.bio && <p style={{ color:"#888", fontSize:12, margin:"0 0 4px", fontStyle:"italic" }}>"{profileData.bio}"</p>}
                        {profileData.location && <p style={{ color:"#555", fontSize:11, margin:0 }}>📍 {profileData.location}</p>}
                      </div>
                      <button onClick={()=>setShowEditProfile(true)} style={{ padding:"8px 12px", borderRadius:10, background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#aaa", fontSize:12, cursor:"pointer", fontFamily:"'Exo 2',sans-serif", fontWeight:600, flexShrink:0 }}>✏️ Edit</button>
                    </div>
                    {/* Fav platforms/genres tags */}
                    {(profileData.favPlatforms?.length>0||profileData.favGenres?.length>0) && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                        {profileData.favPlatforms?.map(p=><span key={p} style={{ padding:"3px 10px", borderRadius:20, background:"#00F5FF22", border:"1px solid #00F5FF44", color:"#00F5FF", fontSize:10, fontWeight:600 }}>{p}</span>)}
                        {profileData.favGenres?.map(g=><span key={g} style={{ padding:"3px 10px", borderRadius:20, background:"#FF00FF22", border:"1px solid #FF00FF44", color:"#FF6B9D", fontSize:10, fontWeight:600 }}>{g}</span>)}
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-around" }}>
                      {[{label:"Logged",val:Object.values(logged).filter(Boolean).length},{label:"Ratings",val:Object.values(ratings).length},{label:"Following",val:following.length},{label:"Followers",val:followers.length}].map(s=>(
                        <div key={s.label} style={{ textAlign:"center" }}><div style={{ fontWeight:900, fontSize:18, color:"#00F5FF" }}>{s.val}</div><div style={{ fontSize:10, color:"#555" }}>{s.label}</div></div>
                      ))}
                    </div>
                  </div>

                  {/* 4 Favorite Games — Letterboxd style */}
                  <div style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:"1.5px solid #2a2a3e", borderRadius:16, padding:14, marginBottom:16 }}>
                    <p style={{ color:"#666", fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"0 0 12px" }}>⭐ Favorite Games</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                      {favoriteGames.map((g,i)=>(
                        <div key={i} onClick={()=>setPickingFavSlot(i)} style={{ aspectRatio:"3/4", borderRadius:10, overflow:"hidden", background:"#0f0f1a", border:`1.5px solid ${g?"#2a2a3e":"#1a1a2e"}`, cursor:"pointer", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {g ? <>
                            <img src={g.background_image} alt={g.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#000a,transparent 50%)" }} />
                            <div style={{ position:"absolute", bottom:4, left:4, right:4, fontSize:9, color:"#fff", fontWeight:700, lineHeight:1.2, textShadow:"0 1px 3px #000" }}>{g.name}</div>
                          </> : <div style={{ textAlign:"center" }}><div style={{ fontSize:20, marginBottom:4 }}>+</div><div style={{ fontSize:9, color:"#444" }}>Add</div></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div style={{ display:"flex", gap:6, marginBottom:18, background:"#1a1a2e", borderRadius:12, padding:4 }}>
                    {[{id:"stats",label:"📊 Stats"},{id:"activity",label:"📡 Activity"},{id:"ai",label:"🤖 AI"},{id:"wrapped",label:"🎁 Wrapped"}].map(t=>(
                      <button key={t.id} onClick={()=>setSubTab(t.id)} style={{ flex:1, padding:"8px 2px", borderRadius:8, background:subTab===t.id?"linear-gradient(90deg,#00F5FF22,#FF00FF22)":"none", border:subTab===t.id?"1px solid #00F5FF44":"none", color:subTab===t.id?"#00F5FF":"#555", fontWeight:subTab===t.id?700:400, fontSize:10, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>{t.label}</button>
                    ))}
                  </div>

                  {subTab==="stats" && (
                    <div>
                      {/* Reviews section */}
                      {Object.keys(reviews).length > 0 && (
                        <div style={{ marginBottom:20 }}>
                          <div style={{ fontSize:10, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>✍️ Your Reviews</div>
                          {Object.entries(reviews).map(([id, review]) => {
                            const entry = listData[id];
                            const game = entry?.game || games.find(g=>String(g.id)===id);
                            const color = accentColor(Number(id));
                            return (
                              <div key={id} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${color}33`, borderRadius:14, padding:14, marginBottom:12 }}>
                                {/* Game header */}
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, cursor:"pointer" }} onClick={()=>game&&setSelectedGame(game)}>
                                  <div style={{ width:44, height:44, borderRadius:8, overflow:"hidden", background:"#0f0f1a", flexShrink:0 }}>
                                    {review.gameCover ? <img src={review.gameCover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{review.gameName || game?.name || "Game"}</div>
                                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                      {ratings[id] && <StarRating rating={ratings[id]} size={12} />}
                                      {review.hours && <span style={{ fontSize:11, color:"#00F5FF" }}>⏱ {review.hours}h</span>}
                                    </div>
                                  </div>
                                  <button onClick={e=>{ e.stopPropagation(); if(game){ setReviewGame(game); setReviewDraft({text:review.text,spoiler:review.spoiler,hours:review.hours}); setShowReviewModal(true); } }} style={{ background:"#1a1a2e", border:"1px solid #2a2a3e", color:"#555", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:"'Exo 2',sans-serif" }}>✏️ Edit</button>
                                </div>
                                <SpoilerReview review={review} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Ratings section */}
                      <div style={{ fontSize:10, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>🏆 Your Ratings</div>
                      {Object.entries(ratings).length===0 ? (
                        <div style={{ textAlign:"center", color:"#333", padding:24 }}>
                          <div style={{ fontSize:36, marginBottom:8 }}>🎮</div>
                          <p>Log and rate games to see them here!</p>
                        </div>
                      ) : Object.entries(ratings).map(([id,r])=>{
                        const entry=listData[id]; const game=entry?.game||games.find(g=>String(g.id)===id); if(!game)return null;
                        return (
                          <div key={id} onClick={()=>setSelectedGame(game)} style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a2e", borderRadius:12, padding:"10px 14px", marginBottom:8, cursor:"pointer" }}>
                            <div style={{ width:44, height:44, borderRadius:8, overflow:"hidden", background:"#0f0f1a", flexShrink:0 }}>{game.background_image?<img src={game.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.name}</div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <StarRating rating={r} size={13} />
                                {reviews[id] && <span style={{ fontSize:10, color:"#555" }}>✍️ Reviewed</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {subTab==="activity" && (
                    <div>
                      <p style={{ color:"#555", fontSize:10, letterSpacing:2, textTransform:"uppercase", margin:"0 0 14px" }}>📡 Recent Activity</p>
                      {profileActivity.length === 0 ? (
                        <div style={{ textAlign:"center", color:"#333", padding:40 }}>
                          <div style={{ fontSize:40 }}>📡</div>
                          <p style={{ color:"#555" }}>No activity yet</p>
                          <p style={{ fontSize:12, color:"#444" }}>Start logging games to build your feed!</p>
                        </div>
                      ) : profileActivity.map((act, i) => {
                        const color = act.game ? accentColor(act.game.id) : "#00F5FF";
                        return (
                          <div key={act.id||i} style={{ background:"linear-gradient(135deg,#1a1a2e,#0f0f1a)", border:`1.5px solid ${color}22`, borderRadius:14, padding:12, marginBottom:10, display:"flex", gap:12, alignItems:"flex-start" }}>
                            {/* Cover or icon */}
                            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", background:"#0f0f1a", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                              {act.type==="list" ? act.list.icon :
                               act.game?.background_image ? <img src={act.game.background_image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : "🎮"}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              {/* Action label */}
                              <div style={{ fontSize:11, color:"#555", marginBottom:3 }}>
                                {act.type==="logged" && <span>✅ <span style={{ color:"#059669" }}>Logged</span></span>}
                                {act.type==="rated" && <span>⭐ <span style={{ color:"#FFD700" }}>Rated</span></span>}
                                {act.type==="review" && <span>✍️ <span style={{ color:"#00F5FF" }}>Reviewed</span></span>}
                                {act.type==="list" && <span>📋 <span style={{ color:"#FF6B9D" }}>Created list</span></span>}
                              </div>
                              {/* Title */}
                              <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                {act.type==="list" ? act.list.name : act.game?.name}
                              </div>
                              {/* Rating or review snippet */}
                              {act.rating && <StarRating rating={act.rating} size={11} />}
                              {act.review?.text && (
                                <p style={{ color:"#666", fontSize:11, margin:"4px 0 0", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                                  {act.review.spoiler ? "⚠️ Contains spoilers" : `"${act.review.text}"`}
                                </p>
                              )}
                              <div style={{ color:"#333", fontSize:10, marginTop:4 }}>{act.date}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {subTab==="ai" && <AIStats loggedGames={loggedGames} ratings={ratings} />}
                  {subTab==="wrapped" && <Wrapped loggedGames={loggedGames} ratings={ratings} />}
                  <button onClick={onSignOut} style={{ width:"100%", padding:13, borderRadius:14, marginTop:16, background:"#1a1a2e", border:"1.5px solid #FF000044", color:"#FF6B6B", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <nav style={{ display:"flex", position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#0f0f1e", borderTop:"1px solid #ffffff10", zIndex:200, padding:"8px 0 12px" }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"4px 0" }}>
              <span style={{ fontSize:20, filter:tab===t.id?"drop-shadow(0 0 6px #00F5FF)":"none" }}>{t.icon}</span>
              <span style={{ fontSize:9, fontFamily:"'Exo 2',sans-serif", fontWeight:700, color:tab===t.id?"#00F5FF":"#444", letterSpacing:0.5 }}>{t.label.toUpperCase()}</span>
            </button>
          ))}
        </nav>

        <FilterPanel show={showFilter} onClose={()=>setShowFilter(false)} filters={filters} setFilters={setFilters} />
        <GameModal game={selectedGame} onClose={()=>setSelectedGame(null)} allLists={[...LISTS,...customLists]}
          onLog={game=>{
            const updated = {...logged, [game.id]: !logged[game.id]};
            setLogged(updated);
            saveToCloud(updated, ratings, listData, diaryPosts);
          }}
          logged={selectedGame&&logged[selectedGame.id]}
          userRating={selectedGame&&ratings[selectedGame.id]}
          onRate={r=>{
            if (!selectedGame) return;
            const updated = {...ratings, [selectedGame.id]: r};
            setRatings(updated);
            saveToCloud(logged, updated, listData, diaryPosts);
          }}
          listData={listData}
          onAddToList={(game,listName)=>{
            const entry = listData[game.id] || { lists: [], game: null };
            const curLists = entry.lists || (Array.isArray(entry) ? entry : []);
            const newLists = curLists.includes(listName)
              ? curLists.filter(l => l !== listName)
              : [...curLists, listName];
            const updated = {
              ...listData,
              [game.id]: { lists: newLists, game: { id: game.id, name: game.name, background_image: game.background_image, genres: game.genres, released: game.released, rating: game.rating, platforms: game.platforms } }
            };
            setListData(updated);
            saveToCloud(logged, ratings, updated, diaryPosts);
          }}
          onWriteReview={game=>{ setReviewGame(game); setReviewDraft({ text: reviews[game.id]?.text||"", spoiler: reviews[game.id]?.spoiler||false, hours: reviews[game.id]?.hours||"" }); setShowReviewModal(true); }}
          userReview={selectedGame&&reviews[selectedGame.id]}
        />
        {showReviewModal && (
          <ReviewModal
            game={reviewGame}
            existing={reviewGame&&reviews[reviewGame.id]}
            onClose={()=>setShowReviewModal(false)}
            onSave={review=>{
              const updated = { ...reviews, [reviewGame.id]: { ...review, gameName: reviewGame.name, gameCover: reviewGame.background_image, gameGenre: reviewGame.genres?.[0]?.name } };
              setReviews(updated);
              saveToCloud(logged, ratings, listData, diaryPosts);
            }}
          />
        )}
      </div>
    </>
  );
}
