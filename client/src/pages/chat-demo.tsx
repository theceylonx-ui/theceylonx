import { ChatDemo } from "@/components/chat/ChatDemo";
import Navigation from "@/components/navigation";

export default function ChatDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <ChatDemo />
      </div>
    </div>
  );
}