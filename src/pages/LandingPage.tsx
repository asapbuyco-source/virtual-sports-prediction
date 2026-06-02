import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/I18nContext";

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const features = [
  { icon: "🎲", title: "RNG Regression Model", desc: "Detect statistical deviations from expected distributions in VFL outcomes." },
  { icon: "⚡", title: "League Activator System", desc: "Identify teams that elevate Over/Under markets with statistical significance." },
  { icon: "💰", title: "Value Bet Detection", desc: "Find when bookmakers underprice outcomes relative to our model." },
  { icon: "📊", title: "H2H Historical Indicators", desc: "Use head-to-head data to refine prediction accuracy." },
  { icon: "⚽", title: "xG Expected Goals Model", desc: "Model expected goals using Poisson distribution calibrated for VFL." },
  { icon: "🌍", title: "6 Supported Leagues", desc: "EPL, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie." },
];

export default function LandingPage() {
  const { t } = useTranslation();

  const steps = [
    { step: "01", title: t.landing.selectTeamsStep, desc: t.landing.selectTeamsDesc },
    { step: "02", title: t.landing.addFormDataStep, desc: t.landing.addFormDataDesc },
    { step: "03", title: t.landing.getPredictionStep, desc: t.landing.getPredictionDesc },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <section className="min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-green-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-[128px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t.landing.aiPoweredPredictions} · 6 Leagues
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] mb-6 tracking-tight">
              {t.landing.predictSmarter}<br />
              <span className="text-gradient">{t.landing.betWithData}</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
              {t.landing.statisticalAnalysis}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="group px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-900/30 hover:shadow-green-500/30 transition-all duration-300">
                {t.landing.startFree}
              </Link>
              <a href="#how-it-works" className="px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white font-bold transition-all duration-300">
                {t.landing.seeHowItWorks}
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">🔵</div>
                  <div>
                    <p className="font-semibold text-white">Manchester City</p>
                    <p className="text-[11px] text-gray-500">EPL · Strong</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-lg font-black text-green-400">2-1</span>
                </div>
                <div className="text-right">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-lg">🔴</div>
                  <div>
                    <p className="font-semibold text-white">Liverpool</p>
                    <p className="text-[11px] text-gray-500">Strong</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { market: "1X2", pick: "Home Win", prob: "78%" },
                  { market: "Over/Under", pick: "Over 2.5 Goals", prob: "65%" },
                  { market: "BTTS", pick: "Yes", prob: "55%" },
                ].map((tip) => (
                  <div key={tip.market} className="flex justify-between items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-medium">{tip.market}</span>
                      <span className="text-sm text-white font-semibold">{tip.pick}</span>
                    </div>
                    <span className="text-green-400 font-bold text-sm">{tip.prob}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Vantage AI · Statistical Analysis
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">{t.landing.howItWorks}</p>
            <h2 className="text-3xl sm:text-4xl font-black">Three Steps to Smarter Predictions</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative group">
                <div className="absolute inset-0 bg-green-500/5 rounded-2xl blur-xl group-hover:bg-green-500/10 transition-all duration-500" />
                <div className="relative bg-[#111118] border border-white/[0.06] rounded-2xl p-6 text-center">
                  <span className="text-green-400/30 text-4xl font-black">{step.step}</span>
                  <h3 className="text-lg font-bold mt-2 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">{t.landing.features}</p>
            <h2 className="text-3xl sm:text-4xl font-black">Built for Virtual Football</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-[#111118] border border-white/[0.06] rounded-xl p-5 hover:border-green-500/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-lg mb-3 group-hover:bg-green-500/15 transition-colors">{f.icon}</div>
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">{t.landing.pricing}</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Choose Your Edge</h2>
            <p className="text-gray-400 mb-8">Pay in XAF via Mobile Money — MTN & Orange</p>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-900/30 hover:shadow-green-500/30 transition-all duration-300">
              {t.landing.viewPricing}
              <span>→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-[9px] font-black text-white">VA</div>
            <span className="font-bold text-white">Vantage AI</span>
          </div>
          <p className="text-xs text-gray-600">{t.landing.builtInCameroon} 🇨🇲 · {t.landing.aiPoweredPredictions}</p>
          <p className="text-[10px] text-gray-700">{t.landing.virtualFootballOutcomes}</p>
        </div>
      </footer>
    </div>
  );
}