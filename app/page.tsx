'use client'

import React, { useState } from 'react'
import { Trophy, Shield, Music, Bot, Settings, LogIn, Users, Flame } from 'lucide-react'

export default function Home() {
  const [clickCount, setClickCount] = useState(0)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  const [adminNotification, setAdminNotification] = useState('')

  // Fonction secrète : 5 clics sur le logo pour débloquer le mode Admin VIP
  const handleLogoClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    if (newCount === 5) {
      setIsAdminUnlocked(true)
      setAdminNotification('🔓 PASS VIP ADMIN ACTIVÉ ! Bienvenue dans l’espace administrateur.')
      setTimeout(() => setAdminNotification(''), 5000)
      setClickCount(0)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Notification Admin VIP */}
      {adminNotification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-bounce">
          <span>{adminNotification}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="Cliquez 5 fois ici..."
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              PRONOFOOT
            </h1>
            <p className="text-xs text-slate-400 font-medium">AI Arena & Pronostics Elite</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors">Accueil</a>
          <a href="/scores" className="hover:text-white transition-colors">Scores & Matchs</a>
          <a href="/news" className="hover:text-white transition-colors">Actualités</a>
          <a href="/music" className="hover:text-white transition-colors">Musique</a>
          {isAdminUnlocked && (
            <a href="#admin" className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 animate-pulse">
              <Settings className="w-4 h-4" /> ⚙️ Admin Tools (11)
            </a>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-slate-700">
            <LogIn className="w-4 h-4" /> Connexion
          </button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">
          <Flame className="w-4 h-4" /> Saison 2026/2027 — Les 19 Clubs d'Élite & C1
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mb-6 leading-tight">
          Pronostiquez, vibrez et dominez le classement <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pronofoot</span>
        </h2>

        <p className="text-slate-400 text-lg max-w-xl mb-10">
          Le site officiel de pronostics inspiré de Kicktipp : règles officielles, scores en direct automatisés, lecteur musical intégré et assistant IA intelligent.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left mt-8">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <Shield className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Règles Kicktipp</h3>
            <p className="text-slate-400 text-sm">3 pts pour le bon résultat, 5 pts pour le score exact, et des bonus massifs en fin de saison !</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <Bot className="w-8 h-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Assistant IA Coach</h3>
            <p className="text-slate-400 text-sm">Posez vos questions sur les matchs, les classements ou l'actualité à notre assistant propulsé par Llama & Gemini.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <Music className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Lecteur Persistant</h3>
            <p className="text-slate-400 text-sm">Écoutez vos morceaux favoris en continu pendant que vous faites vos pronostics sur le site.</p>
          </div>
        </div>

        {/* PANNEAU ADMINISTRATEUR DÉBLOQUÉ */}
        {isAdminUnlocked && (
          <div id="admin" className="mt-16 w-full bg-slate-900 border-2 border-amber-500/50 p-8 rounded-3xl shadow-2xl text-left">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Settings className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-400">Console Administrateur VIP</h3>
                  <p className="text-slate-400 text-xs">11 Outils de gestion globale débloqués avec succès</p>
                </div>
              </div>
              <span className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs">ACTIF</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['⚡ Synchro API', '🔴 Mode Live Test', '⚽ Saisie Manuelle', '🖼️ Fonds d’écran', '🏟️ Bannières', '🎵 Playlist MP3', '🎨 Thème Couleurs', '📢 Annonce Publique', '📊 Stats Cloud', '👥 Gestion Users', '⚙️ Paramètres'].map((tool, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between">
                  <span className="text-sm font-semibold">{tool}</span>
                  <span className="text-xs text-slate-500">Gérer</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      {/* FOOTER */}
<footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
  <p>© 2026 Pronofoot créé par Mathias Le Prince Tamko Simo pour MalihaProdBerlin. Tous droits réservés. Propulsé par Next.js, Supabase & Vercel.</p>
</footer>
    </main>
  )
}