import Link from 'next/link';
import { Shield, MessageSquare, FileText, Clock, Zap, BarChart3, Mic, ArrowRight, CheckCircle, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-lg font-bold">AfterAction Army</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/20 border border-green-800/30 text-green-400 text-xs font-medium mb-6">
          <Target className="w-3.5 h-3.5" />
          AI-Powered AAR Facilitator — TC 25-20
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Run the AAR.<br />
          <span className="text-green-400">Get the document in 60 seconds.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AfterAction Army is your unit&apos;s AI AAR facilitator. Talk through the mission naturally — squad-level
          AARs roll up to platoon. No forms. No PowerPoint. Just talk, and get a structured AAR document built
          to Army standard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-base">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="px-6 py-3 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 rounded-lg transition-colors text-base">
            See How It Works
          </a>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-800/50 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center gap-12 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">60s</p>
            <p className="text-xs text-gray-500">Average AAR Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">TC 25-20</p>
            <p className="text-xs text-gray-500">Army 4-Question Format</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">Squad &rarr; PLT</p>
            <p className="text-xs text-gray-500">Rollup Structure</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">No Rank</p>
            <p className="text-xs text-gray-500">Everybody Talks</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">Three steps. No paperwork. No PowerPoint. Just a conversation with First Sergeant.</p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-900/30 border border-green-800/40 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Talk Through It</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hit &ldquo;Run AAR&rdquo; and talk naturally — type or use voice. First Sergeant asks the right follow-up
              questions, probes decision points, and keeps the AAR on track.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-900/30 border border-green-800/40 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Watch It Build</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              The AAR document builds live in a split-screen view. All four sections fill in
              automatically — mission/intent, execution, root causes, sustains &amp; improves.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-900/30 border border-green-800/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Review & Export</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Review the AAR, assign action items to duty positions, then export as PDF or Word.
              Squad AARs roll up to platoon-level insights automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-16">Built for the Fight</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Mic, title: 'Voice-First', desc: 'Speak naturally using your browser mic. Works in the field on any device with a browser. No app to download.' },
              { icon: Zap, title: 'Real-Time Document', desc: 'Watch the AAR build as you talk. Split-screen shows conversation and document side by side.' },
              { icon: Shield, title: 'First Sergeant AI', desc: 'Trained on TC 25-20 methodology. Asks probing follow-ups, catches gaps in the timeline, structures output correctly.' },
              { icon: BarChart3, title: 'Platoon Rollup', desc: 'Squad-level AARs feed into platoon insights. See recurring themes across all your squads and training events.' },
              { icon: Clock, title: '60-Second AARs', desc: 'A 10-15 minute conversation replaces hours of PowerPoint. Every time. For every squad iteration.' },
              { icon: FileText, title: 'PDF & Word Export', desc: 'Professional formatting ready for the battalion TOC. Action items table with owners and suspenses.' },
            ].map((f) => (
              <div key={f.title} className="p-6 border border-gray-800 rounded-xl bg-gray-900/50 hover:border-gray-700 transition-colors">
                <f.icon className="w-6 h-6 text-green-400 mb-3" />
                <h3 className="text-sm font-semibold text-gray-200 mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
        <p className="text-gray-500 mb-12">One plan per platoon. Unlimited AARs. Cancel anytime.</p>

        <div className="max-w-sm mx-auto border border-green-800/40 rounded-2xl bg-gradient-to-b from-green-950/20 to-transparent p-8">
          <p className="text-xs text-green-400 font-medium uppercase tracking-wider mb-2">Per Platoon</p>
          <p className="text-5xl font-bold mb-1">$149<span className="text-lg text-gray-500 font-normal">/mo</span></p>
          <p className="text-sm text-gray-500 mb-6">Unlimited squads, personnel &amp; AARs</p>
          <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left">
            {[
              'Unlimited AI-facilitated AARs',
              'Voice + text input',
              'Real-time AAR generation (TC 25-20)',
              'PDF & Word export',
              'Squad → Platoon rollup insights',
              'Personnel management & invites',
              'Institutional memory — First Sergeant learns from past AARs',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="block w-full py-3 bg-green-700 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-center">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-600">AfterAction Army</span>
          </div>
          <p className="text-xs text-gray-700">&copy; {new Date().getFullYear()} AfterAction Army. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
