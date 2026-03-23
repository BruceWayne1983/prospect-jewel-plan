import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Copy, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FollowUp = {
  subject: string;
  message: string;
  whatsappVersion: string;
  suggestedNextAction: string;
  suggestedFollowUpDate: string;
};

export function FollowUpDrafter({ retailer }: { retailer: Retailer }) {
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");
  const [outcome, setOutcome] = useState("");

  const generate = async () => {
    if (!visitNotes.trim()) { toast.error("Please enter visit notes first"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-followup", {
        body: { retailerId: retailer.id, visitNotes, outcome: outcome || "General visit" },
      });
      if (error) throw error;
      if (data?.success) {
        setFollowUp(data.followup);
        toast.success("Follow-up drafted!");
      } else {
        toast.error(data?.error || "Failed to generate follow-up");
      }
    } catch (err: any) {
      toast.error(err.message || "Follow-up generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
          <Send className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
        </div>
        <h3 className="text-lg font-display font-semibold text-foreground">AI Follow-Up Drafter</h3>
      </div>

      {!followUp ? (
        <div className="space-y-3">
          <div>
            <label className="section-header text-[9px] mb-1 block">Visit / Call Notes</label>
            <Textarea
              value={visitNotes}
              onChange={e => setVisitNotes(e.target.value)}
              placeholder="Spoke with Sarah the owner, she loved the Composable Classic range. Concerned about MOQ..."
              className="text-sm min-h-[80px] bg-cream/30 border-border/30"
            />
          </div>
          <div>
            <label className="section-header text-[9px] mb-1 block">Outcome</label>
            <Textarea
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              placeholder="Positive interest, wants to see samples"
              className="text-sm min-h-[40px] bg-cream/30 border-border/30"
            />
          </div>
          <Button onClick={generate} disabled={loading} className="gold-gradient text-sidebar-background text-xs">
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            {loading ? "Drafting..." : "Draft Follow-Up"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Tabs defaultValue="email">
            <TabsList className="bg-cream/50 border border-border/30 p-1 h-auto">
              <TabsTrigger value="email" className="text-xs data-[state=active]:bg-card px-3 py-1.5"><Mail className="w-3 h-3 mr-1" /> Email</TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs data-[state=active]:bg-card px-3 py-1.5"><MessageSquare className="w-3 h-3 mr-1" /> WhatsApp</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-3">
              <div className="bg-cream/60 rounded-lg p-4 border border-border/20">
                <p className="text-xs text-muted-foreground mb-1">Subject: <span className="text-foreground font-medium">{followUp.subject}</span></p>
                <div className="border-t border-border/10 mt-2 pt-2">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{followUp.message}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyText(`Subject: ${followUp.subject}\n\n${followUp.message}`, "Email")} className="text-xs mt-2 border-border/40">
                <Copy className="w-3 h-3 mr-1.5" /> Copy Email
              </Button>
            </TabsContent>
            <TabsContent value="whatsapp" className="mt-3">
              <div className="bg-cream/60 rounded-lg p-4 border border-border/20">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{followUp.whatsappVersion}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyText(followUp.whatsappVersion, "WhatsApp message")} className="text-xs mt-2 border-border/40">
                <Copy className="w-3 h-3 mr-1.5" /> Copy WhatsApp
              </Button>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
              <p className="section-header text-[9px] mb-1">Next Action</p>
              <p className="text-[11px] text-foreground">{followUp.suggestedNextAction}</p>
            </div>
            <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
              <p className="section-header text-[9px] mb-1">Follow-Up In</p>
              <p className="text-[11px] text-foreground">{followUp.suggestedFollowUpDate}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setFollowUp(null)} className="text-xs text-muted-foreground">
            ← Draft another
          </Button>
        </div>
      )}
    </div>
  );
}
