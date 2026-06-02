export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: June 2026</p>
        
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Email address and display name (via Firebase Authentication)</li>
              <li>Prediction history and usage data</li>
              <li>Payment information (processed by Fapshi — we do not store card details)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>To provide and maintain the prediction service</li>
              <li>To manage your subscription and account</li>
              <li>To communicate important updates about the Service</li>
              <li>To improve our algorithms and user experience</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Data Storage</h2>
            <p>User data is stored in Firebase Firestore (Google Cloud, European servers). Payment data is handled exclusively by Fapshi. We do not sell or transfer your personal data to third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Data Retention</h2>
            <p>We retain your account data for as long as your account remains active. You may request deletion of your account and associated data at any time by contacting support@vflpredictor.cm. Deleted data is removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Cookies & Tracking</h2>
            <p>We use minimal cookies for authentication (Firebase) and basic analytics. We do not use third-party advertising trackers. Session data is stored locally in your browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, Firebase Security Rules, and HMAC webhook verification. No system is 100% secure; we cannot guarantee absolute data security.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Object to processing of your data</li>
              <li>Data portability (export your data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Children's Privacy</h2>
            <p>The Service is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover that data from a minor has been collected, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. International Transfers</h2>
            <p>Your data may be processed on servers outside of Cameroon. By using the Service, you consent to such transfers in accordance with this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">11. Contact</h2>
            <p>For privacy-related inquiries, contact our Data Protection Officer at: <a href="mailto:privacy@vflpredictor.cm" className="text-green-400">privacy@vflpredictor.cm</a></p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <a href="/" className="text-green-400 hover:text-green-300 text-sm">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}