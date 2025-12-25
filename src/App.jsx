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
    <div className="min-h-full bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-950/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-bold">AI</span>
            <a href="/" className="font-semibold tracking-tight text-neutral-900 dark:text-white">MyAiPlug</a>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700 dark:text-neutral-300">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-300">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-300">How It Works</a>
            <a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-300">Pricing</a>
            <a href="https://myaiplug.com" className="hover:text-brand-600 dark:hover:text-brand-300">More Tools</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="hidden sm:inline-block rounded-xl border px-3 h-9 leading-9 text-sm text-neutral-700 dark:text-neutral-200 border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-900">Sign In</a>
            <a href="#pricing" className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm px-3 h-9 leading-9">Get Started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Shape your <span className="text-brand-600">sound</span>
              </h1>
              <p className="mt-4 text-lg text-neutral-700 dark:text-neutral-300">
                Multi-dimensional audio processing. EQ. Filters. Delay. Reverb. Sub. Flanger. Real-time.
              </p>
              <div className="mt-6 flex gap-3">
                <a href="/warper.html" className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 h-11 leading-[44px]">Try It</a>
                <a href="#features" className="rounded-xl border px-4 h-11 leading-[44px] text-sm text-neutral-700 dark:text-neutral-200 border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-900">Details</a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-brand-100 via-white to-brand-200 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 border border-black/5 dark:border-white/10 shadow-soft flex items-center justify-center">
                <div className="text-6xl">🎛️</div>
              </div>
              <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-[radial-gradient(circle_at_70%_20%,rgba(47,125,255,0.35),transparent_40%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">What it does</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🎚️</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Multi-band EQ</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Four independent frequency bands. Solo, mute, shape.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🌊</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Spatial Effects</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Delay and reverb for depth. Flanger for movement.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">🔊</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Sub Enhancement</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Add weight to the low end without muddying the mix.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Real-time</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Hear changes instantly. No render wait.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Visual Feedback</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Live spectrum analyzer. See what you hear.
            </p>
          </div>
          
          <div className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-soft hover:shadow-lg transition-all overflow-hidden p-6">
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Export</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Download processed audio. WAV format.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">How it works</h2>
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Upload audio</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">WAV, MP3, FLAC.</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Adjust controls</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Shape the sound. Real-time preview.</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Export</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Download when done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 p-6 bg-white dark:bg-neutral-900 shadow-soft">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Free</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Try it out.</p>
            <div className="mt-4 text-3xl font-bold">$0</div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>• 10 exports/month</li>
              <li>• All effects</li>
              <li>• Web-based</li>
            </ul>
            <a href="https://buy.stripe.com/test_starter" className="mt-6 inline-flex w-full justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 h-10 leading-10 text-sm">
              Start
            </a>
          </div>

          <div className="rounded-2xl border-2 border-brand-500 p-6 bg-white dark:bg-neutral-900 shadow-soft relative">
            <span className="absolute -top-3 left-6 text-[11px] px-2 py-1 rounded-full bg-brand-500 text-white">Popular</span>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Pro</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">For regular use.</p>
            <div className="mt-4 text-3xl font-bold">$29<span className="text-base font-medium text-neutral-500">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>• Unlimited exports</li>
              <li>• All effects</li>
              <li>• Priority support</li>
            </ul>
            <a href="https://buy.stripe.com/test_pro_29" className="mt-6 inline-flex w-full justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white h-10 leading-10 text-sm">
              Get Pro
            </a>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/10 p-6 bg-white dark:bg-neutral-900 shadow-soft">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Studio</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">For teams.</p>
            <div className="mt-4 text-3xl font-bold">$99<span className="text-base font-medium text-neutral-500">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>• Everything in Pro</li>
              <li>• API access</li>
              <li>• Team accounts</li>
            </ul>
            <a href="https://buy.stripe.com/test_studio_99" className="mt-6 inline-flex w-full justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 h-10 leading-10 text-sm">
              Get Studio
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Try it</h2>
          <p className="text-lg mb-6 text-white/90">
            No signup required. 
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/warper.html" className="rounded-xl bg-white text-brand-600 hover:bg-neutral-100 text-sm px-6 h-11 leading-[44px] font-semibold">
              Open Tool
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 dark:border-white/10 py-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
        © <span>{new Date().getFullYear()}</span> MyAiPlug — All rights reserved. | 
        <a href="https://myaiplug.com" className="hover:text-brand-500 ml-2">More Tools</a> | 
        <a href="/privacy" className="hover:text-brand-500 ml-2">Privacy</a> | 
        <a href="/terms" className="hover:text-brand-500 ml-2">Terms</a>
      </footer>

      <ToggleThemeFab />
    </div>
  )
}

export default App
