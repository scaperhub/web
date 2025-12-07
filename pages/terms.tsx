import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User } from '@/lib/types';

interface TermsProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Terms({ user, onLogout, onOpenSellSheet }: TermsProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using ScaperHub. ("the Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              ScaperHub. is an online marketplace that connects aquarium hobbyists and shop owners to buy and sell aquarium equipment and related items. We provide a platform for users to list items, browse listings, and communicate with other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.1 Registration</h3>
                <p className="text-gray-700 leading-relaxed">
                  To use certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.2 Account Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.3 Account Approval</h3>
                <p className="text-gray-700 leading-relaxed">
                  New user accounts require admin approval before you can access the Platform. We reserve the right to approve or reject any account registration at our sole discretion.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the intellectual property rights of others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the Platform or servers</li>
              <li>Attempt to gain unauthorized access to any portion of the Platform</li>
              <li>Collect or store personal data about other users without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Listings and Items</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1 Listing Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  All listings must be accurate, complete, and comply with our content guidelines. Items must be legal to sell in your jurisdiction. You are solely responsible for the accuracy of your listings.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2 Item Approval</h3>
                <p className="text-gray-700 leading-relaxed">
                  All listings are subject to admin approval before being visible to other users. We reserve the right to reject, remove, or modify any listing at our discretion.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.3 Prohibited Items</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may not list items that are illegal, stolen, counterfeit, or violate any applicable laws or regulations.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Transactions</h2>
            <p className="text-gray-700 leading-relaxed">
              ScaperHub. facilitates connections between buyers and sellers but is not a party to any transaction. All transactions are between users, and we are not responsible for the quality, safety, or legality of items sold. Buyers and sellers are responsible for arranging payment and delivery terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Fees and Payments</h2>
            <p className="text-gray-700 leading-relaxed">
              Currently, ScaperHub. does not charge fees for listing items or using the Platform. We reserve the right to introduce fees in the future with appropriate notice to users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Platform and its original content, features, and functionality are owned by ScaperHub. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of content you post but grant us a license to use, display, and distribute such content on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE PLATFORM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless ScaperHub., its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Platform, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the Platform at any time, with or without cause or notice, for any reason including violation of these Terms. You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Platform after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ScaperHub. operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@scaperhub.com" className="text-gray-900 hover:underline">legal@scaperhub.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}



