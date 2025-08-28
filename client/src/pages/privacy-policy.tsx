import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, UserCheck } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Lock className="w-16 h-16 text-ceylon-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Last updated: August 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 text-ceylon-green mr-3" />
                Our Commitment to Your Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Ceylon Expand is committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                By using Ceylon Expand, you agree to the collection and use of information in accordance with this policy. 
                We will not share your personal information with third parties except as described in this policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-6 h-6 text-ceylon-green mr-3" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Information:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Name and email address (from Replit authentication)</li>
                  <li>• Profile picture (if provided)</li>
                  <li>• Phone number (when you choose to add it)</li>
                  <li>• Bio and profile information you provide</li>
                  <li>• Trip preferences and travel interests</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trip and Activity Data:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Trip posts you create (destinations, dates, descriptions)</li>
                  <li>• Trips you join or express interest in</li>
                  <li>• Comments and messages you post</li>
                  <li>• Ratings and reviews you give and receive</li>
                  <li>• Community questions and answers you post</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Technical Information:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• IP address and location data (for security and service improvement)</li>
                  <li>• Browser type and device information</li>
                  <li>• Usage patterns and feature interactions</li>
                  <li>• Session data and cookies for authentication</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-6 h-6 text-ceylon-green mr-3" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Platform Functionality:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Enable you to create and manage your account</li>
                  <li>• Facilitate trip posting and participation</li>
                  <li>• Enable communication between travelers</li>
                  <li>• Process ratings and reviews</li>
                  <li>• Provide customer support and respond to inquiries</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Safety and Security:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Verify user identities and prevent fraudulent accounts</li>
                  <li>• Investigate reports of misconduct or safety concerns</li>
                  <li>• Protect against spam, abuse, and malicious activities</li>
                  <li>• Maintain the integrity of our platform</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Service Improvement:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Analyze usage patterns to improve our features</li>
                  <li>• Develop new tools and services for travelers</li>
                  <li>• Optimize platform performance and user experience</li>
                  <li>• Conduct research on travel trends in Sri Lanka</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-6 h-6 text-ceylon-green mr-3" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Public Information:</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  The following information is visible to other users on the platform:
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Your name and profile picture</li>
                  <li>• Bio and profile information you choose to share</li>
                  <li>• Trip posts and descriptions you create</li>
                  <li>• Comments in trip discussions and community forums</li>
                  <li>• Ratings and reviews (without personal contact details)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Private Information:</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  We keep the following information private and do not share it publicly:
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Your email address and phone number</li>
                  <li>• Private messages between users</li>
                  <li>• Payment information and financial details</li>
                  <li>• Personal identification documents</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Third-Party Sharing:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We do not sell or rent your personal information to third parties. We may share information only in these circumstances:
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• With your explicit consent</li>
                  <li>• To comply with legal requirements or law enforcement requests</li>
                  <li>• To protect our rights, property, or safety, or that of our users</li>
                  <li>• With service providers who help us operate the platform (under strict confidentiality agreements)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security and Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Security Measures:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Encryption of data in transit and at rest</li>
                  <li>• Secure authentication through Replit's trusted system</li>
                  <li>• Regular security audits and updates</li>
                  <li>• Limited access to personal data by authorized personnel only</li>
                  <li>• Secure database hosting with backup and recovery procedures</li>
                </ul>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                While we implement strong security measures, no system is completely secure. 
                We encourage users to use strong passwords and report any suspicious activity immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Control:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Access and update your profile information at any time</li>
                  <li>• Delete your trip posts and comments</li>
                  <li>• Control your visibility settings and privacy preferences</li>
                  <li>• Request account deactivation or deletion</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Requests:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Request a copy of your personal data</li>
                  <li>• Request correction of inaccurate information</li>
                  <li>• Request deletion of your data (subject to legal requirements)</li>
                  <li>• Object to processing of your data for certain purposes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We retain your personal information for as long as your account is active or as needed to provide services. 
                When you delete your account, we will remove your personal information within 30 days, except where we are 
                required to retain it for legal, regulatory, or safety purposes.
              </p>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Retention Periods:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Account information: Until account deletion + 30 days</li>
                  <li>• Trip posts and comments: Until manually deleted or account closure</li>
                  <li>• Safety reports and investigations: Up to 2 years for security purposes</li>
                  <li>• Analytics data: Aggregated and anonymized after 1 year</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Ceylon Expand is not intended for use by children under 18 years of age. 
                We do not knowingly collect personal information from children under 18. 
                If we become aware that a child under 18 has provided us with personal information, 
                we will delete such information from our systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                If you have any questions about this Privacy Policy, your data rights, or our privacy practices, 
                please contact us through the platform's support system. We are committed to addressing your 
                privacy concerns and will respond within 48 hours.
              </p>
            </CardContent>
          </Card>

          <div className="bg-ceylon-green/10 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-ceylon-green mb-2">
              Your Privacy Matters to Us
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              We are committed to maintaining the highest standards of privacy and data protection. 
              Your trust is essential to our mission of connecting travelers safely in Sri Lanka.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}