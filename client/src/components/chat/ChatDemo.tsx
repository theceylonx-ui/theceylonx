import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MoreVertical, 
  MapPin, 
  Calendar, 
  Send, 
  Upload,
  Image as ImageIcon,
  Eye,
  Clock,
  Shield
} from "lucide-react";
import { format } from "date-fns";

export function ChatDemo() {
  const [demoStep, setDemoStep] = useState<"overview" | "contact" | "image">("overview");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Demo Navigation */}
      <div className="flex space-x-2 mb-6">
        <Button 
          variant={demoStep === "overview" ? "default" : "outline"}
          onClick={() => setDemoStep("overview")}
        >
          Overview
        </Button>
        <Button 
          variant={demoStep === "contact" ? "default" : "outline"}
          onClick={() => setDemoStep("contact")}
        >
          Contact Sharing
        </Button>
        <Button 
          variant={demoStep === "image" ? "default" : "outline"}
          onClick={() => setDemoStep("image")}
        >
          Image Sharing
        </Button>
      </div>

      {/* Overview Demo */}
      {demoStep === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat System Overview
              </CardTitle>
              <CardDescription>
                How the enhanced chat system works with organizer approval workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">For Trip Organizers:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                      Start chats with interested travelers
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                      Share contact details (phone/email)
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-purple-500"></Badge>
                      Send ephemeral images (one-time view)
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                      Close chats when trip is full
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">For Travelers:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                      Request to join trips
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-orange-500"></Badge>
                      Wait for organizer approval
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-teal-500"></Badge>
                      Chat once approved
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-gray-500"></Badge>
                      Report inappropriate messages
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Chat Window */}
          <Card className="h-[400px] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold">Sigiriya Rock Fortress Adventure</h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Kandy → Sigiriya
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Feb 25, 2025
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant="default">open</Badge>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-start">
                <div className="max-w-[70%]">
                  <div className="flex items-center space-x-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">SP</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500">Saman Perera</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                    <p className="text-sm">Welcome! I'm organizing this trip to Sigiriya. Are you interested in joining?</p>
                    <span className="text-xs text-gray-500">14:30</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[70%]">
                  <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                    <p className="text-sm">Yes! I'd love to join. What time are we meeting?</p>
                    <span className="text-xs text-primary-foreground/70">14:32</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            <div className="p-4">
              <div className="flex space-x-2">
                <Input placeholder="Type your message..." />
                <Button size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Contact Sharing Demo */}
      {demoStep === "contact" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Sharing Workflow
              </CardTitle>
              <CardDescription>
                How organizers share contact details with approved travelers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Organizer Menu */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Step 1: Organizer Options</h4>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium">Chat Header</h5>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Phone className="w-4 h-4 mr-2" />
                            Share Phone
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Share Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="w-4 h-4 mr-2" />
                            Share Both
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-gray-600">
                      Organizers can select which contact details to share from the dropdown menu.
                    </p>
                  </Card>
                </div>

                {/* Step 2: Contact Message */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Step 2: Shared Contact Message</h4>
                  <div className="flex justify-center">
                    <Card className="p-3 bg-blue-50 border-blue-200 max-w-xs">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Contact details shared</span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3" />
                          <span>+94 77 123 4567</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3" />
                          <span>saman@example.com</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <p className="text-sm text-gray-600">
                    Contact details appear as a special message that both participants can see.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">Security Features:</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Rate limited to 3 contact shares per hour per thread</li>
                  <li>• Only organizers can initiate contact sharing</li>
                  <li>• Notifications sent to both participants</li>
                  <li>• Audit trail maintained for safety</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Sharing Demo */}
      {demoStep === "image" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Ephemeral Image Sharing
              </CardTitle>
              <CardDescription>
                Secure, self-destructing image sharing for privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload */}
                <div className="space-y-4">
                  <h4 className="font-semibold">1. Upload Image</h4>
                  <Card className="p-4 border-dashed border-2">
                    <div className="text-center space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload image</p>
                      <p className="text-xs text-gray-500">Images are automatically encrypted</p>
                    </div>
                  </Card>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>End-to-end encrypted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Auto-expires after 24h</span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <h4 className="font-semibold">2. Image Message</h4>
                  <div className="flex justify-center">
                    <div className="max-w-[200px]">
                      <Card className="p-3 bg-gray-100">
                        <div className="bg-gray-200 rounded h-32 flex items-center justify-center mb-2">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">15:42</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>View once</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Images appear with view count indicator
                  </p>
                </div>

                {/* After Viewing */}
                <div className="space-y-4">
                  <h4 className="font-semibold">3. After Viewing</h4>
                  <div className="flex justify-center">
                    <Card className="p-4 bg-gray-50 border-gray-200 max-w-[200px]">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-gray-200 rounded flex items-center justify-center">
                          <Eye className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">Image consumed</p>
                        <p className="text-xs text-gray-400">No longer available</p>
                      </div>
                    </Card>
                  </div>
                  <p className="text-sm text-gray-600">
                    Images automatically delete after viewing
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h5 className="font-semibold">Image Sharing Features:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h6 className="font-medium text-blue-800 mb-2">Privacy Controls</h6>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• One-time viewing by default</li>
                      <li>• Automatic expiration (24 hours)</li>
                      <li>• No download or screenshot prevention</li>
                      <li>• View tracking and audit logs</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h6 className="font-medium text-green-800 mb-2">Security Measures</h6>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Images stored in secure cloud storage</li>
                      <li>• MIME type validation (images only)</li>
                      <li>• File size limits (max 10MB)</li>
                      <li>• Encrypted storage keys</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}