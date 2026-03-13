import { User, MapPin, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your territory planner</p>
      </div>

      <div className="card-premium rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input defaultValue="Emma-Louise Gregory" className="mt-1 bg-background border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Input defaultValue="Sales Agent — South West UK" className="mt-1 bg-background border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input defaultValue="emma@nomination.co.uk" className="mt-1 bg-background border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input defaultValue="+44 7700 900000" className="mt-1 bg-background border-border/50" />
          </div>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">Territory</h3>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Assigned Region</Label>
          <Input defaultValue="South West England" className="mt-1 bg-background border-border/50" readOnly />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Counties</Label>
          <p className="text-sm text-muted-foreground mt-1">Somerset, Devon, Cornwall, Dorset, Wiltshire, Gloucestershire, Avon</p>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground">New high-priority prospects</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground">Pipeline stage changes</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground">Weekly territory digest</Label>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}
