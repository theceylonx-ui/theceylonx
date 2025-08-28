import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Phone, MapPin, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent Successfully!",
        description: "We'll get back to you within 48 hours.",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Mail className="w-16 h-16 text-ceylon-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            We're here to help! Get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        placeholder="Your full name"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        placeholder="your.email@example.com"
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                      required
                    >
                      <SelectTrigger data-testid="select-contact-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="safety">Safety Concern</SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="trip">Trip Related</SelectItem>
                        <SelectItem value="community">Community Guidelines</SelectItem>
                        <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        <SelectItem value="business">Business Inquiries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      required
                      placeholder="Brief summary of your inquiry"
                      data-testid="input-contact-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      required
                      placeholder="Please provide details about your inquiry..."
                      className="min-h-[120px]"
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                    data-testid="button-contact-submit"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-ceylon-green mr-2" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-ceylon-green mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Response Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We aim to respond to all inquiries within 48 hours.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-ceylon-green mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Service Area</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Sri Lanka & International Travelers.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-ceylon-green mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Available through platform messaging.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                    For Immediate Safety Concerns:
                  </p>
                  <div className="space-y-2 text-amber-700 dark:text-amber-300 text-sm">
                    <p><strong>Sri Lanka Police:</strong> 110</p>
                    <p><strong>Medical Emergency:</strong> 111</p>
                    <p><strong>Tourist Hotline:</strong> 1912</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  For non-emergency safety concerns, please use our report feature 
                  within the app or contact us through this form.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">How do I report a user?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use the report button on trip posts or user profiles to flag concerning behavior.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Can I change my trip details?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Yes, you can edit your trip details from your dashboard until the trip starts.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">How do payments work?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Payments are arranged directly between trip organizers and participants.
                  </p>
                </div>
                
                <div className="pt-2">
                  <a 
                    href="/faq" 
                    className="text-ceylon-green hover:text-ceylon-green/80 text-sm font-medium"
                  >
                    View all FAQs →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Before reaching out, please make sure your inquiry follows our community guidelines:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                  <li>• Be respectful and constructive</li>
                  <li>• Provide relevant details about your issue</li>
                  <li>• Use appropriate language</li>
                  <li>• Avoid spam or repetitive requests</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 bg-ceylon-green/10 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-ceylon-green mb-2">
            We're Here to Help!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Whether you have questions about using the platform, need technical support, 
            or want to share feedback, our team is ready to assist you.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Thank you for being part of the Ceylon Expand community!
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}