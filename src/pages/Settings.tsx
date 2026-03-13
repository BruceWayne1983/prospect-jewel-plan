import { User, MapPin, Bell, Gem } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="page-container max-w-2xl">
      <div>
        <p className="section-header mb-2">Configure</p>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Personalise your territory planner</p>
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
            <Input defaultValue="Sales Agent — South West UK" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input defaultValue="emma@nomination.co.uk" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
            <Input defaultValue="+44 7700 900000" className="mt-1.5 bg-background border-border/40 h-10" />
          </div>
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
          <Input defaultValue="South West England" className="mt-1.5 bg-cream border-border/30 h-10" readOnly />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Counties</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Somerset', 'Devon', 'Cornwall', 'Dorset', 'Wiltshire', 'Gloucestershire', 'Avon'].map(c => (
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
          Nomination Italy — Premium Italian charm jewellery and accessories. Targeting independent jewellers, boutiques and premium lifestyle retailers across the South West UK territory.
        </p>
      </div>
    </div>
  );
}
