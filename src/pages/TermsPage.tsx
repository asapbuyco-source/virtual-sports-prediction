export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: June 2026</p>
        
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using Vantage AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Service Description</h2>
            <p>Vantage AI provides AI-powered predictions for virtual sports leagues. Predictions are generated using statistical models and historical data. The Service is intended for entertainment purposes only.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. No Financial Advice</h2>
            <p>The predictions provided by Vantage AI do not constitute financial or betting advice. We are not responsible for any losses incurred from using our predictions. Virtual sports outcomes are determined by Random Number Generation (RNG) and are inherently unpredictable. Past performance does not guarantee future results.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Responsible Gambling</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-300">
              <p className="font-bold mb-2">⚠️ Gamble Responsibly</p>
              <p>Virtual sports are for entertainment only. If you or someone you know has a gambling problem, please seek help:</p>
              <ul className="mt-2 space-y-1">
                <li>• Cameroon: +237 222 000 000 (Gambling Regulatory Board)</li>
                <li>• UK: 0808 8020 133 (GamCare)</li>
                <li>• International: <a href="https://www.begambleaware.org" className="text-green-400 underline">begambleaware.org</a></li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Subscription & Payments</h2>
            <p>Paid subscriptions provide additional prediction capacity. Payments are processed securely via Fapshi (MTN & Orange Money). Subscriptions are non-refundable unless required by applicable law. Subscription duration and pricing are as displayed at the time of purchase.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account. We reserve the right to suspend accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Limitation of Liability</h2>
            <p>Vantage AI shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the Service. Prediction accuracy is not guaranteed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Modifications to Service</h2>
            <p>We reserve the right to modify or discontinue the Service at any time without prior notice. Prices and features may change; changes will be communicated via the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the Republic of Cameroon. Any disputes shall be resolved in the courts of Cameroon.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contact</h2>
            <p>For questions regarding these Terms, contact us at support@vflpredictor.cm</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <a href="/" className="text-green-400 hover:text-green-300 text-sm">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}