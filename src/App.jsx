import React, { useEffect, useState } from 'react'

function ToggleThemeFab() {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'))
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      try {
        localStorage.setItem('theme', 'dark')
      } catch {
        // Ignore localStorage errors
      }
    } else {
      document.documentElement.classList.remove('dark')
      try {
        localStorage.setItem('theme', 'light')
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [dark])

  return (
    <button
      onClick={() => setDark(v => !v)}
      className="fixed bottom-5 right-5 z-50 rounded-full shadow-soft border border-black/5 backdrop-blur px-4 py-2 text-sm font-medium bg-white/70 hover:bg-white dark:bg-neutral-900/70 dark:hover:bg-neutral-900 dark:text-white"
      aria-label="Toggle theme"
    >
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}

function App() {
  return (
    <div className="min-h-full bg-gradient-to-b from-neutral-950 to-black dark:from-neutral-950 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 text-white font-bold">AI</span>
            <a href="/" className="font-semibold tracking-tight text-white">MyAiPlug</a>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <a href="#features" className="hover:text-cyan-400">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400">How It Works</a>
            <a href="#pricing" className="hover:text-cyan-400">Pricing</a>
            <a href="https://myaiplug.com" className="hover:text-cyan-400">More Tools</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="hidden sm:inline-block rounded-xl border px-3 h-9 leading-9 text-sm text-neutral-200 border-white/20 hover:bg-neutral-900">Sign In</a>
            <a href="#pricing" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-sm px-3 h-9 leading-9">Get Started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Shape your <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">sound</span>
              </h1>
              <p className="mt-4 text-lg text-neutral-300">
                Multi-dimensional audio processing. EQ. Filters. Delay. Reverb. Sub. Flanger. Real-time.
              </p>
              <div className="mt-6 flex gap-3">
                <a href="/warper.html" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-sm px-4 h-11 leading-[44px]">Try It</a>
                <a href="#features" className="rounded-xl border px-4 h-11 leading-[44px] text-sm text-neutral-200 border-white/20 hover:bg-neutral-900">Details</a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 shadow-2xl flex items-center justify-center">
                <div className="text-6xl">🎛️</div>
              </div>
              <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.35),transparent_40%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-white mb-6">What it does</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-cyan-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🎚️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-band EQ</h3>
            <p className="text-sm text-neutral-400">
              Four independent frequency bands. Solo, mute, shape.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-purple-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🌊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Spatial Effects</h3>
            <p className="text-sm text-neutral-400">
              Delay and reverb for depth. Flanger for movement.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-cyan-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🔊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Sub Enhancement</h3>
            <p className="text-sm text-neutral-400">
              Add weight to the low end without muddying the mix.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-purple-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
            <p className="text-sm text-neutral-400">
              Hear changes instantly. No render wait.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-cyan-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Visual Feedback</h3>
            <p className="text-sm text-neutral-400">
              Live spectrum analyzer. See what you hear.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-purple-500/20 transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-lg font-semibold text-white mb-2">Export</h3>
            <p className="text-sm text-neutral-400">
              Download processed audio. WAV format.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="font-semibold text-white mb-1">Upload audio</h3>
              <p className="text-sm text-neutral-400">WAV, MP3, FLAC.</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="font-semibold text-white mb-1">Adjust controls</h3>
              <p className="text-sm text-neutral-400">Shape the sound. Real-time preview.</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="font-semibold text-white mb-1">Export</h3>
              <p className="text-sm text-neutral-400">Download when done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-white mb-6">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 p-6 bg-neutral-900 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mt-1 text-sm text-neutral-400">Try it out.</p>
            <div className="mt-4 text-3xl font-bold text-white">$0</div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• 3 uses/month</li>
              <li>• All effects</li>
              <li>• Web-based</li>
            </ul>
            <a href="https://54a318a8-9f2b-45df-a4ca-4db6ee9f1e3e.paylinks.godaddy.com/f03454ad-5ca1-4625-a17d-31d" className="mt-6 inline-flex w-full justify-center rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 h-10 leading-10 text-sm">
              Start
            </a>
          </div>

          <div className="rounded-2xl border-2 border-cyan-500 p-6 bg-neutral-900 shadow-2xl shadow-cyan-500/20 relative">
            <span className="absolute -top-3 left-6 text-[11px] px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white">Popular</span>
            <h3 className="text-lg font-semibold text-white">Regular</h3>
            <p className="mt-1 text-sm text-neutral-400">On sale.</p>
            <div className="mt-4 text-3xl font-bold text-white">$2<span className="text-base font-medium text-neutral-500 line-through ml-2">$5</span></div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• Unlimited uses</li>
              <li>• All effects</li>
              <li>• Web-based</li>
            </ul>
            <a href="https://54a318a8-9f2b-45df-a4ca-4db6ee9f1e3e.paylinks.godaddy.com/f03454ad-5ca1-4625-a17d-31d" className="mt-6 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white h-10 leading-10 text-sm">
              Get Regular
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 p-6 bg-neutral-900 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">VST Plugin</h3>
            <p className="mt-1 text-sm text-neutral-400">Coming soon.</p>
            <div className="mt-4 text-3xl font-bold text-white">$20<span className="text-base font-medium text-neutral-500 ml-1 text-sm">early</span></div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• Desktop VST</li>
              <li>• All effects</li>
              <li>• Early supporter price</li>
            </ul>
            <a href="https://54a318a8-9f2b-45df-a4ca-4db6ee9f1e3e.paylinks.godaddy.com/2f56eed6-1ef1-4b3d-a22d-58e" className="mt-6 inline-flex w-full justify-center rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 h-10 leading-10 text-sm">
              Pre-order
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Try it</h2>
          <p className="text-lg mb-6 text-white/90">
            No signup required. 
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/warper.html" className="rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-sm px-6 h-11 leading-[44px] font-semibold">
              Open Tool
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-neutral-400">
        © <span>{new Date().getFullYear()}</span> MyAiPlug — All rights reserved. | 
        <a href="https://myaiplug.com" className="hover:text-cyan-400 ml-2">More Tools</a> | 
        <a href="/privacy" className="hover:text-cyan-400 ml-2">Privacy</a> | 
        <a href="/terms" className="hover:text-cyan-400 ml-2">Terms</a>
      </footer>

      <ToggleThemeFab />
    </div>
  )
}

export default App
