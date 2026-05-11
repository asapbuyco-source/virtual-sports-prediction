import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(34,197,94,0.1) 50px, rgba(34,197,94,0.1) 51px)" }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-3 py-1 bg-green-900/40 border border-green-700/40 rounded-full text-xs text-green-400 font-bold mb-4">
              betpawa Official · Virtual Sports AI
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Predict Smarter.<br />
              <span className="text-green-400">Bet With Data.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              AI-powered statistical analysis engine for BetPawa Virtual Football League. Get data-driven betting tips, xG models, and value bet detection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-900/40">
                Start Free — 5 Predictions
              </Link>
              <a href="#how-it-works" className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold">
                See How It Works →
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-4">3,200+ bettors in Cameroon trust Vantage AI</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔵</span>
                  <div>
                    <p className="font-bold">Manchester City</p>
                    <p className="text-xs text-gray-500">EPL · Strong</p>
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-green-400">2-1</span>
                <div className="text-right">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <p className="font-bold">Liverpool</p>
                    <p className="text-xs text-gray-500">Strong</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {["1X2: Home Win (78%)", "Over 2.5 Goals (65%)", "BTTS: Yes (55%)"].map((tip) => (
                  <div key={tip} className="flex justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400">{tip.split(":")[0]}</span>
                    <span className="text-green-400 font-bold">{tip.split("(")[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🏟️", title: "Select Your Teams", desc: "Choose from 6 leagues and 30+ teams. Pick your home and away team." },
              { icon: "📋", title: "Add Form Data", desc: "Enter recent results and optional bookmaker odds for deeper analysis." },
              { icon: "🔮", title: "Get AI Prediction", desc: "Receive comprehensive breakdown with probabilities, tips, and signals." },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🎲", title: "RNG Regression Model", desc: "Detect statistical deviations from expected distributions." },
              { icon: "⚡", title: "League Activator System", desc: "Identify teams that elevate Over/Under markets." },
              { icon: "💰", title: "Value Bet Detection", desc: "Find when bookmakers underprice outcomes." },
              { icon: "📊", title: "H2H Historical Indicators", desc: "Use head-to-head data to refine predictions." },
              { icon: "⚽", title: "xG Expected Goals Model", desc: "Model expected goals using Poisson distribution." },
              { icon: "🌍", title: "6 Supported Leagues", desc: "EPL, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie." },
            ].map((f, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Choose Your Edge</h2>
          <p className="text-gray-400 mb-8">Pay in XAF via Mobile Money — MTN & Orange</p>
          <Link to="/pricing" className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold">
            View Pricing →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-lg">AI</div>
            <span className="font-bold">Vantage AI</span>
          </div>
          <p className="text-xs text-gray-600">Built in Cameroon 🇨🇲 · betpawa Official Partner · For educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}