import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, CheckCircle, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type ExtractedData = {
  outcome: string;
  summaryNote: string;
  brandsDiscussed: string[];
  objectionsRaised: string[];
  productsOfInterest: string[];
  nextAction: string;
  followUpDate: string;
  contactName?: string;
  contactRole?: string;
  meetingScheduled: boolean;
  pipelineStageRecommendation: string;
};

export function VoiceToCRM({ retailer, onUpdate }: { retailer: Retailer; onUpdate: () => void }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + " ";
        else interim = t;
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") toast.error(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setExtracted(null);
    toast.success("Listening... speak your visit notes");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const processTranscript = async () => {
    if (!transcript.trim()) { toast.error("No transcript to process"); return; }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-to-crm", {
        body: { retailerId: retailer.id, transcript: transcript.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        setExtracted(data.extracted);
        toast.success("CRM updated from voice notes!");
        onUpdate();
      } else {
        toast.error(data?.error || "Failed to process voice notes");
      }
    } catch (err: any) {
      toast.error(err.message || "Voice processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const outcomeColors: Record<string, string> = {
    positive: "text-success bg-success-light",
    neutral: "text-warning bg-warning-light",
    negative: "text-destructive bg-destructive/10",
    follow_up_needed: "text-warning bg-warning-light",
    order_placed: "text-success bg-success-light",
  };

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
          <Mic className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Voice-to-CRM</h3>
          <p className="text-[10px] text-muted-foreground">Speak your visit notes → AI extracts & updates the pipeline</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          {!recording ? (
            <Button onClick={startRecording} className="gold-gradient text-sidebar-background text-xs" disabled={processing}>
              <Mic className="w-3.5 h-3.5 mr-1.5" /> Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="text-xs animate-pulse">
              <MicOff className="w-3.5 h-3.5 mr-1.5" /> Stop Recording
            </Button>
          )}
        </div>

        {(transcript || recording) && (
          <div>
            <label className="section-header text-[9px] mb-1 block">Transcript {recording && <span className="text-destructive">● Recording</span>}</label>
            <Textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              className="text-sm min-h-[80px] bg-cream/30 border-border/30"
              placeholder="Your spoken notes will appear here..."
            />
          </div>
        )}

        {transcript && !recording && !extracted && (
          <Button onClick={processTranscript} disabled={processing} className="gold-gradient text-sidebar-background text-xs">
            {processing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            {processing ? "Processing..." : "Process & Update CRM"}
          </Button>
        )}

        {extracted && (
          <div className="space-y-3 border-t border-border/20 pt-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <p className="text-sm font-semibold text-foreground">CRM Updated Successfully</p>
            </div>

            <div className="bg-cream/60 rounded-lg p-4 border border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium uppercase ${outcomeColors[extracted.outcome] || "bg-muted text-muted-foreground"}`}>
                  {extracted.outcome.replace("_", " ")}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium uppercase bg-muted text-muted-foreground">
                  → {extracted.pipelineStageRecommendation.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-foreground">{extracted.summaryNote}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {extracted.objectionsRaised.length > 0 && (
                <div className="bg-cream/50 rounded-lg p-3 border border-border/15">
                  <p className="section-header text-[9px] mb-1">Objections</p>
                  {extracted.objectionsRaised.map((o, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5">
                      <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground">{o}</p>
                    </div>
                  ))}
                </div>
              )}
              {extracted.productsOfInterest.length > 0 && (
                <div className="bg-cream/50 rounded-lg p-3 border border-border/15">
                  <p className="section-header text-[9px] mb-1">Products of Interest</p>
                  {extracted.productsOfInterest.map((p, i) => (
                    <p key={i} className="text-[10px] text-foreground py-0.5">• {p}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
                <p className="section-header text-[9px] mb-1">Next Action</p>
                <p className="text-[11px] text-foreground">{extracted.nextAction}</p>
              </div>
              <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
                <p className="section-header text-[9px] mb-1">Follow-Up</p>
                <p className="text-[11px] text-foreground">{extracted.followUpDate}</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setExtracted(null); setTranscript(""); }} className="text-xs text-muted-foreground">
              ← Record another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
