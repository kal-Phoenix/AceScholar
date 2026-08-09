import { RotateCcw, ArrowLeft } from 'lucide-react';
import { PageType } from '../types';
import ScrollReveal from './ScrollReveal';

interface RefundPolicyProps {
  setCurrentPage: (page: PageType) => void;
}

export default function RefundPolicy({ setCurrentPage }: RefundPolicyProps) {
  const lastUpdated = 'August 8, 2026';

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-20 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Legal</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">Refund Policy</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </ScrollReveal>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 transition-colors mb-10 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="prose prose-invert prose-slate max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              1. Overview
            </h2>
            <p className="text-slate-300 leading-relaxed">
              At AceScholar, we strive to deliver high-quality work that meets your specifications. We understand that circumstances may change, and we offer refunds under specific conditions outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility for Refund</h2>
            <p className="text-slate-300 leading-relaxed mb-3">You may be eligible for a full or partial refund if:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong className="text-white">Work Not Started:</strong> Payment was made but no expert has been assigned and no work has begun</li>
              <li><strong className="text-white">Missed Deadline:</strong> We failed to deliver by the agreed deadline and you no longer need the work</li>
              <li><strong className="text-white">Cancellation Before Assignment:</strong> You cancel the order before an expert is matched</li>
              <li><strong className="text-white">Quality Dispute:</strong> The delivered work significantly deviates from your original specifications and cannot be resolved through revisions</li>
              <li><strong className="text-white">Duplicate Payment:</strong> You were accidentally charged twice for the same order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Refund Amounts</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <div className="glass rounded-xl p-5 border border-slate-700/50">
                <p><strong className="text-white">Full Refund (100%):</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Order cancelled before expert assignment</li>
                  <li>Work not started within 48 hours of order placement (without your delay)</li>
                  <li>Duplicate payment confirmed</li>
                </ul>
              </div>
              <div className="glass rounded-xl p-5 border border-slate-700/50">
                <p><strong className="text-white">Partial Refund (50–75%):</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Work in progress but cancelled by you (50% refund of amount paid)</li>
                  <li>Delivered work requires significant revisions beyond what was agreed (up to 75% depending on scope)</li>
                </ul>
              </div>
              <div className="glass rounded-xl p-5 border border-slate-700/50">
                <p><strong className="text-white">No Refund:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Work has been delivered and accepted (review period of 72 hours elapsed)</li>
                  <li>Order specifications changed after work began (scope changes may incur additional fees)</li>
                  <li>Free revision requests within the 14-day revision window</li>
                  <li>Orders completed and marked as "delivered" by mutual agreement</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. How to Request a Refund</h2>
            <ol className="list-decimal list-inside text-slate-300 space-y-3 ml-4">
              <li><strong className="text-white">Contact Support:</strong> Email us at{' '}
                <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}`} className="text-amber-500 hover:text-amber-400">
                  {import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}
                </a>{' '}
                with your order ID and reason for the refund request
              </li>
              <li><strong className="text-white">Provide Details:</strong> Include screenshots, correspondence, or any evidence supporting your claim</li>
              <li><strong className="text-white">Review Period:</strong> Our team will review your request within 3–5 business days</li>
              <li><strong className="text-white">Decision:</strong> You will receive a written decision via email with the approved refund amount and timeline</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Refund Processing</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p><strong className="text-white">Processing Time:</strong> Approved refunds are processed within 7–14 business days from the approval date.</p>
              <p><strong className="text-white">Method:</strong> Refunds are issued via the original payment method when possible. For crypto payments, refunds are processed in the same cryptocurrency to the same wallet address. For bank transfers and mobile payments, refunds are sent to the account used for the original payment.</p>
              <p><strong className="text-white">Currency:</strong> Refunds are issued in the same currency as the original payment. Exchange rate fluctuations between the payment date and refund date may result in slight differences in the refunded amount.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Dispute Resolution</h2>
            <p className="text-slate-300 leading-relaxed">
              If you disagree with our refund decision, you may request a second review by emailing us with additional information. Disputes that cannot be resolved through our internal process may be escalated in accordance with our Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Chargebacks</h2>
            <p className="text-slate-300 leading-relaxed">
              We encourage you to contact us directly before initiating a chargeback with your bank or payment provider. Chargebacks filed without first contacting us may result in account suspension. We are committed to resolving issues fairly and promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. The refund policy in effect at the time of your order placement will apply to that order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              For refund requests or questions about this policy, contact us at{' '}
              <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}`} className="text-amber-500 hover:text-amber-400">
                {import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com'}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
