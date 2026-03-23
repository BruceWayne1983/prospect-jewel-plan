import { User, MapPin, Bell, Gem, Mail, Upload, Brain, Shield, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Settings() {
  return (
    <div className="page-container max-w-2xl">
      <div>
        <p className="section-header mb-2">Configure</p>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Personalise your territory planner and manage integrations</p>
      </div>

      <div className="divider-gold" />

      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-display font-semibold text-foreground">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
            <Input defaultValue="Emma-Louise Gregory" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
            <Input defaultValue="Nomination Sales Agent — Emma Louise Lux" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input defaultValue="emma@emmalouiselux.co.uk" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
            <Input defaultValue="+44 7700 900000" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
        </div>
      </div>

      {/* Email Integration */}
      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Mail className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Email Integration</h3>
            <p className="text-[10px] text-muted-foreground">Connect your email to send and track outreach</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-gold/30 hover:bg-champagne/10 transition-all text-left">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Mail className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Gmail</p>
              <p className="text-[10px] text-muted-foreground">Connect Google Workspace</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-gold/30 hover:bg-champagne/10 transition-all text-left">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Mail className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Outlook</p>
              <p className="text-[10px] text-muted-foreground">Connect Microsoft 365</p>
            </div>
          </button>
        </div>
        <div className="space-y-3">
          {[
            'Auto-log email conversations to retailer profiles',
            'Track email opens and replies',
            'Create follow-up reminders from email responses',
            'Match emails to retailer contacts automatically',
          ].map(label => (
            <div key={label} className="flex items-center justify-between py-1">
              <Label className="text-sm text-foreground">{label}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      {/* Data Upload */}
      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Upload className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Customer Performance Data</h3>
            <p className="text-[10px] text-muted-foreground">Upload existing account data to train the scoring model</p>
          </div>
        </div>
        <div className="bg-cream/50 rounded-xl border-2 border-dashed border-border/30 p-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Drop CSV, Excel or Google Sheets data here</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">Include: retailer name, location, annual value, reorder frequency, product mix</p>
          <Button variant="outline" size="sm" className="text-xs border-border/40">
            <Upload className="w-3 h-3 mr-1.5" /> Choose File
          </Button>
        </div>
        <div className="bg-cream/30 rounded-lg p-3 border border-gold/10">
          <p className="text-[11px] text-muted-foreground italic font-display">
            <Brain className="w-3.5 h-3.5 inline mr-1 text-gold" />
            Uploaded data trains the AI scoring model. The system identifies patterns in successful accounts and adjusts prospect scoring automatically.
          </p>
        </div>
      </div>

      {/* AI Research Agents */}
      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Brain className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">AI Research Agents</h3>
            <p className="text-[10px] text-muted-foreground">Configure automated research and analysis</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            'Continuous prospect discovery scanning',
            'Automated retailer intelligence analysis',
            'Competitor brand detection',
            'Performance prediction modelling',
            'Weekly opportunity briefing generation',
            'Self-learning score adjustment',
          ].map(label => (
            <div key={label} className="flex items-center justify-between py-1">
              <Label className="text-sm text-foreground">{label}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-display font-semibold text-foreground">Territory</h3>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Region</Label>
          <Input defaultValue="South West England & South Wales" className="mt-1.5 bg-cream border-border/30 h-10" readOnly />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Counties</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Somerset', 'Devon', 'Cornwall', 'Dorset', 'Wiltshire', 'Gloucestershire', 'Avon', 'Cardiff', 'Swansea', 'Newport', 'Vale of Glamorgan', 'Bridgend', 'Neath Port Talbot', 'Carmarthenshire', 'Pembrokeshire', 'Monmouthshire'].map(c => (
              <span key={c} className="badge-category">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-premium p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Bell className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-display font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            'New high-priority prospects discovered',
            'Pipeline stage changes',
            'Weekly territory digest email',
            'Email open/reply tracking alerts',
            'Meeting reminders',
            'Promotional campaign start dates',
          ].map(label => (
            <div key={label} className="flex items-center justify-between py-1">
              <Label className="text-sm text-foreground">{label}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shadow-sm">
            <Gem className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Nomination Brand</h3>
            <p className="text-xs text-muted-foreground">Connected brand profile</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nomination Italy — Premium Italian charm jewellery and accessories. Targeting independent jewellers, boutiques and premium lifestyle retailers across the South West UK & South Wales territory.
        </p>
      </div>
    </div>
  );
}
