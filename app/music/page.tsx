'use client'

import React from 'react'
import { Music, Disc, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MusicPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil Pronofoot
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Music className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Playlist & Lecteur Musical</h1>
            <p className="text-slate-400 text-sm">Écoutez vos morceaux favoris en continu pendant vos pronostics.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Disc className="w-16 h-16 text-emerald-400 animate-spin mb-4 opacity-80" style={{ animationDuration: '6s' }} />
          <h2 className="text-xl font-bold mb-2">Chargement de la playlist Supabase...</h2>
          <p className="text-slate-400 text-sm max-w-md">
            Aucun morceau n'a encore été ajouté dans la base de données. Tu pourras bientôt les ajouter via l'espace Administrateur !
          </p>
        </div>
      </div>
    </main>
  )
}