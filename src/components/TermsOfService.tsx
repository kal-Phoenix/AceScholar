import { FileText, ArrowLeft } from 'lucide-react';
import { PageType } from '../types';
import ScrollReveal from './ScrollReveal';

interface TermsOfServiceProps {
  setCurrentPage: (page: PageType) => void;
}

export default function TermsOfService({ setCurrentPage }: TermsOfServiceProps) {
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">Terms of Service</h1>
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
              <FileText className="h-5 w-5 text-amber-500" />
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using AceScholar ("the Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services. We reserve the right to modify these terms at any time, and continued use of the Platform constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Services</h2>
            <p className="text-slate-300 leading-relaxed">
              AceScholar is an academic and technical support platform that connects students with qualified experts for assistance with:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li>Academic writing (research papers, literature reviews, thesis chapters, essays)</li>
              <li>Coding projects (Python, Java, C++, React, Node.js, MATLAB)</li>
              <li>Engineering drawings (SolidWorks, AutoCAD, FEA reports)</li>
              <li>Data analysis (SPSS, R, Python statistics, Excel modeling)</li>
              <li>STEM problem sets (math, physics, chemistry, biology)</li>
              <li>Presentations (PowerPoint, Google Slides, pitch decks)</li>
              <li>Simple assignments and 2D drafting</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              Our services are designed as <strong className="text-white">academic assistance and consulting</strong>. The deliverables provided serve as reference materials, templates, or learning aids to help you understand and complete your own work.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Eligibility</h2>
            <p className="text-slate-300 leading-relaxed">
              You must be at least 18 years old to use AceScholar. By using our services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Account Registration</h2>
            <p className="text-slate-300 leading-relaxed">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Orders and Payment</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p><strong className="text-white">Order Process:</strong> When you place an order, you provide specifications, requirements, and deadline. Our team reviews the request and matches you with a qualified expert.</p>
              <p><strong className="text-white">Pricing:</strong> Prices are displayed in multiple currencies and depend on service type, complexity, academic level, and deadline. Prices may vary based on project scope.</p>
              <p><strong className="text-white">Payment Methods:</strong> We accept bank transfers (CBE, BOA), mobile payments (Telebirr), cryptocurrency (USDT, BTC), and card payments (Visa/Mastercard). Crypto payments receive a 10% discount.</p>
              <p><strong className="text-white">Down Payment:</strong> Orders of $100 USD or more require a down payment before work begins. Orders below $100 are payable upon delivery.</p>
              <p><strong className="text-white">Payment Verification:</strong> Manual payment methods require screenshot proof of transaction for verification by our admin team.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Delivery and Revisions</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p><strong className="text-white">Delivery:</strong> We commit to delivering completed work by the agreed deadline. Typical turnaround is 12–72 hours depending on service type.</p>
              <p><strong className="text-white">Free Revisions:</strong> We offer 14 days of free revisions after delivery. Revision requests must be consistent with the original order specifications.</p>
              <p><strong className="text-white">Review Period:</strong> You have 72 hours after delivery to review the work and request revisions. After this period, the delivery is considered accepted.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Refund Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              Refunds are handled on a case-by-case basis. Please refer to our <button onClick={() => setCurrentPage('refund-policy')} className="text-amber-500 hover:text-amber-400 underline cursor-pointer">Refund Policy</button> for detailed information on eligibility, process, and timelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p><strong className="text-white">Ownership:</strong> Upon full payment, you receive a non-exclusive license to use the delivered work for personal, educational purposes.</p>
              <p><strong className="text-white">Academic Integrity:</strong> The delivered work is intended as a reference, template, or learning aid. You are responsible for ensuring your use complies with your institution's academic integrity policies.</p>
              <p><strong className="text-white">Our Rights:</strong> We retain the right to use anonymized, generalized samples of work for portfolio and marketing purposes unless you opt out in writing.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Prohibited Conduct</h2>
            <p className="text-slate-300 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-3 ml-4">
              <li>Use our services for any unlawful purpose or in violation of academic integrity policies</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to circumvent security measures or access controls</li>
              <li>Resell, redistribute, or commercially exploit delivered work without authorization</li>
              <li>Harass, threaten, or abuse our experts, staff, or other users</li>
              <li>Use automated tools to interact with the Platform without our written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Confidentiality</h2>
            <p className="text-slate-300 leading-relaxed">
              We take your privacy seriously. All personal information, order details, files, and communications are treated as strictly confidential. We do not share, sell, or disclose your information to third parties except as necessary to provide our services or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              To the maximum extent permitted by law, AceScholar shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount you paid for the specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Dispute Resolution</h2>
            <p className="text-slate-300 leading-relaxed">
              Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration. These Terms are governed by the laws of Ethiopia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Modifications</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Platform after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">14. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about these Terms, please contact us at{' '}
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
