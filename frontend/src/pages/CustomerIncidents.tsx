import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  HelpCircle,
  FileText
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

interface Incident {
  id: string;
  incident_ref: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface Message {
  id: string;
  author_id: string;
  author_email: string;
  message: string;
  created_at: string;
}

export default function CustomerIncidents() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New incident modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load incidents");
      const data = await res.json();
      setIncidents(data.incidents || []);
      if (data.incidents && data.incidents.length > 0 && !selectedIncident) {
        selectIncident(data.incidents[0]);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not fetch incidents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectIncident = async (inc: Incident) => {
    setSelectedIncident(inc);
    try {
      setLoadingMessages(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents/${inc.id}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedIncident || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents/${selectedIncident.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setReplyText("");
      toast({
        title: "Reply sent",
        description: "Your message has been sent to our support engineering team.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Validation error", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      const data = await res.json();
      toast({
        title: "Incident Reported",
        description: `Ticket ${data.incident.incident_ref} submitted successfully.`,
      });
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      await fetchIncidents();
      if (data.incident) {
        selectIncident(data.incident);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not report incident.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchIncidents();
    }
  }, [session?.access_token]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#08090a] text-gray-100 font-sans antialiased overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#0c0d0e]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Support & Incident Management
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 py-0">
                  SLAs Guaranteed
                </Badge>
              </h1>
              <p className="text-xs text-gray-400">Track platform issues, scanner false positives, and service requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIncidents}
              className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs h-9"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium h-9 shadow-sm shadow-primary/20"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Report Incident
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Tickets List */}
          <div className="w-80 md:w-96 border-r border-white/5 flex flex-col bg-[#0a0b0c] shrink-0">
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <Input
                  placeholder="Filter tickets..."
                  className="pl-8 bg-white/5 border-white/10 text-xs h-8 text-gray-200 placeholder:text-gray-500 rounded-lg"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading tickets...</div>
              ) : incidents.length === 0 ? (
                <div className="p-8 text-center">
                  <LifeBuoy className="h-8 w-8 text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-gray-400 font-medium">No open incidents</p>
                  <p className="text-[11px] text-gray-500 mt-1">Report any scan issue or question anytime.</p>
                </div>
              ) : (
                incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <button
                      key={inc.id}
                      onClick={() => selectIncident(inc)}
                      className={`w-full text-left p-4 transition-all hover:bg-white/[0.02] flex flex-col gap-1.5 ${
                        isSelected ? "bg-primary/[0.06] border-l-2 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-primary font-semibold">{inc.incident_ref}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 uppercase ${
                            inc.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : inc.status === "IN_PROGRESS"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {inc.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-gray-200 line-clamp-1">{inc.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                        <span className="capitalize">{inc.category.replace("_", " ")}</span>
                        <span>{formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ticket Conversation & Details */}
          <div className="flex-1 flex flex-col bg-[#08090a] overflow-hidden">
            {selectedIncident ? (
              <>
                {/* Selected Ticket Header */}
                <div className="p-5 border-b border-white/5 bg-[#0c0d0e]/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{selectedIncident.incident_ref}</span>
                      <Badge variant="outline" className="text-xs bg-white/5 text-gray-300 border-white/10">
                        {selectedIncident.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white/5 text-gray-300 border-white/10 capitalize">
                        {selectedIncident.category.replace("_", " ")}
                      </Badge>
                    </div>
                    <h2 className="text-base font-semibold text-white">{selectedIncident.title}</h2>
                    {selectedIncident.sla_deadline && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1">
                        <Clock className="h-3 w-3 text-primary" />
                        Target SLA Resolution:{" "}
                        <span className="text-gray-300">
                          {format(new Date(selectedIncident.sla_deadline), "MMM d, yyyy HH:mm")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Original Problem Description */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-semibold text-gray-300">Initial Problem Report</span>
                      <span>{format(new Date(selectedIncident.created_at), "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedIncident.description || "No additional description provided."}
                    </p>
                  </div>

                  {/* Messages */}
                  {loadingMessages ? (
                    <div className="text-center py-6 text-xs text-gray-500">Loading conversation...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-500">
                      Our support engineers have received this ticket and are reviewing telemetry.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[80%] rounded-xl p-4 text-xs ${
                          m.author_email.includes("codeaurorasentinel") || m.author_email.includes("support")
                            ? "bg-primary/[0.08] border border-primary/20 text-gray-200 ml-auto"
                            : "bg-white/[0.04] border border-white/5 text-gray-300 mr-auto"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400 mb-1.5">
                          <span className="font-semibold text-primary">
                            {m.author_email.includes("codeaurorasentinel") || m.author_email.includes("support")
                              ? "Sentinel Support Engineer"
                              : m.author_email}
                          </span>
                          <span>{format(new Date(m.created_at), "MMM d, HH:mm")}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Footer */}
                <div className="p-4 border-t border-white/5 bg-[#0c0d0e]/60">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response to support..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[70px] bg-white/5 border-white/10 text-xs text-gray-200 placeholder:text-gray-500 resize-none rounded-xl"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-auto px-4 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <LifeBuoy className="h-10 w-10 text-gray-600 mb-3 opacity-40" />
                <h3 className="text-sm font-semibold text-gray-300">No Ticket Selected</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Select an incident from the list to track updates or submit a new inquiry.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Incident */}
        <AnimatePresence>
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#0e1012] border border-white/10 rounded-2xl shadow-2xl p-6 text-gray-100 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    Report a Security or Platform Incident
                  </h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateIncident} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-300 font-medium">Incident Title</Label>
                    <Input
                      placeholder="e.g. False positive detected on SQL rule or scan failure"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white/5 border-white/10 text-xs h-9 text-gray-200"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-300 font-medium">Category</Label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#141618] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200"
                      >
                        <option value="scan_failure">Scan Pipeline Failure</option>
                        <option value="false_positive">False Positive Finding</option>
                        <option value="integration">GitHub / Webhook Integration</option>
                        <option value="billing">Subscription & Billing</option>
                        <option value="performance">Engine Latency / Performance</option>
                        <option value="general">General Support</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-300 font-medium">Business Impact / Priority</Label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-[#141618] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200"
                      >
                        <option value="Critical">Critical (CI/CD Blocked - 2hr SLA)</option>
                        <option value="High">High (Major Feature Affected - 8hr SLA)</option>
                        <option value="Medium">Medium (Standard Triage - 24hr SLA)</option>
                        <option value="Low">Low (Question / Inquiry - 72hr SLA)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-300 font-medium">Description & Context</Label>
                    <Textarea
                      placeholder="Describe what happened, any sanitized error messages, and repository context..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-xs min-h-[100px] text-gray-200 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      className="border-white/10 text-gray-400 hover:text-white text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                    >
                      {submitting ? "Submitting..." : "Submit Incident"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </SidebarProvider>
  );
}
