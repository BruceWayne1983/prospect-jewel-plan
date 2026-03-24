import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Link2, X, Loader2, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Retailer } from "@/hooks/useRetailers";

interface GroupAccountsProps {
  retailer: Retailer;
  onUpdate: () => void;
}

export function GroupAccounts({ retailer: r, onUpdate }: GroupAccountsProps) {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Retailer[]>([]);
  const [parent, setParent] = useState<Retailer | null>(null);
  const [siblings, setSiblings] = useState<Retailer[]>([]);
  const [linking, setLinking] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Retailer[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch children (retailers that reference this one as parent)
    supabase.from("retailers").select("*").eq("parent_account_id" as any, r.id).then((res: any) => setChildren((res.data as Retailer[]) ?? []));

    // Fetch parent if set
    if ((r as any).parent_account_id) {
      supabase.from("retailers").select("*").eq("id", (r as any).parent_account_id).single().then((res: any) => {
        if (res.data) {
          setParent(res.data as Retailer);
          supabase.from("retailers").select("*").eq("parent_account_id" as any, (r as any).parent_account_id).neq("id", r.id).then((sibRes: any) => setSiblings((sibRes.data as Retailer[]) ?? []));
        }
      });
    }
  }, [r.id, (r as any).parent_account_id]);

  const doSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from("retailers").select("*").ilike("name", `%${q}%`).neq("id", r.id).limit(8);
    setSearchResults((data as Retailer[]) ?? []);
  };

  const linkParent = async (parentId: string) => {
    setSaving(true);
    const { error } = await supabase.from("retailers").update({ parent_account_id: parentId } as any).eq("id", r.id);
    if (error) toast.error("Failed to link"); else { toast.success("Group linked"); setLinking(false); onUpdate(); }
    setSaving(false);
  };

  const unlinkParent = async () => {
    setSaving(true);
    const { error } = await supabase.from("retailers").update({ parent_account_id: null } as any).eq("id", r.id);
    if (error) toast.error("Failed to unlink"); else { toast.success("Unlinked from group"); setParent(null); onUpdate(); }
    setSaving(false);
  };

  const isParent = children.length > 0;
  const isChild = !!(r as any).parent_account_id;
  const allGroupMembers = isParent ? [r, ...children] : isChild && parent ? [parent, r, ...siblings] : [];

  const formatCurrency = (v: number) => v > 0 ? `£${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—";

  const totalGroupBilling = allGroupMembers.reduce((sum, m: any) => sum + (parseFloat(m.billing_2025_full_year) || 0), 0);
  const totalGroup2026 = allGroupMembers.reduce((sum, m: any) => sum + (parseFloat(m.billing_2026_ytd) || 0), 0);

  if (!isParent && !isChild && !linking) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-base font-display font-semibold text-foreground">Group Accounts</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLinking(true)} className="text-[10px] h-7 px-3 border-gold/30 text-gold-dark">
            <Link2 className="w-3 h-3 mr-1.5" /> Link to Group
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">This account is not linked to a group. Link it to a parent account to see consolidated billing.</p>
      </div>
    );
  }

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-base font-display font-semibold text-foreground">Group Accounts</h3>
        </div>
        {isChild && (
          <Button variant="ghost" size="sm" onClick={unlinkParent} disabled={saving} className="text-[10px] h-7 px-2 text-destructive">
            <X className="w-3 h-3 mr-1" /> Unlink
          </Button>
        )}
        {!isChild && !isParent && (
          <Button variant="outline" size="sm" onClick={() => setLinking(true)} className="text-[10px] h-7 px-3 border-gold/30 text-gold-dark">
            <Link2 className="w-3 h-3 mr-1.5" /> Link to Group
          </Button>
        )}
      </div>

      {linking && (
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => doSearch(e.target.value)} placeholder="Search for parent account..." className="pl-9 h-8 text-xs" />
          </div>
          {searchResults.map(sr => (
            <div key={sr.id} onClick={() => linkParent(sr.id)} className="flex items-center justify-between p-2 rounded-lg hover:bg-champagne/15 cursor-pointer border border-border/10 text-xs">
              <div>
                <p className="font-medium text-foreground">{sr.name}</p>
                <p className="text-[10px] text-muted-foreground">{sr.town}, {sr.county}</p>
              </div>
              <Link2 className="w-3 h-3 text-gold" />
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setLinking(false)} className="text-[10px] h-7">Cancel</Button>
        </div>
      )}

      {/* Parent info */}
      {isChild && parent && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Parent Account</p>
          <div onClick={() => navigate(`/retailer/${parent.id}`)} className="flex items-center justify-between p-2.5 rounded-lg bg-champagne/15 border border-gold/15 cursor-pointer hover:bg-champagne/25 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{parent.name}</p>
              <p className="text-[10px] text-muted-foreground">{parent.town}, {parent.county}</p>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
          </div>
        </div>
      )}

      {/* All group members */}
      {allGroupMembers.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isParent ? "Child Accounts" : "Group Members"}</p>
          {allGroupMembers.filter(m => m.id !== r.id).map(m => (
            <div key={m.id} onClick={() => navigate(`/retailer/${m.id}`)} className="flex items-center justify-between p-2 rounded-lg hover:bg-champagne/10 cursor-pointer border border-border/10">
              <div>
                <p className="text-xs font-medium text-foreground">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.town}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-display font-bold text-foreground">{formatCurrency(parseFloat((m as any).billing_2025_full_year) || 0)}</p>
                <p className="text-[9px] text-muted-foreground">2025</p>
              </div>
            </div>
          ))}
          {/* Group total */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-champagne/20 border border-gold/20 mt-2">
            <p className="text-xs font-display font-semibold text-foreground">Group Total</p>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-sm font-display font-bold text-foreground">{formatCurrency(totalGroupBilling)}</p>
                <p className="text-[9px] text-muted-foreground">2025</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-display font-bold shimmer-gold">{formatCurrency(totalGroup2026)}</p>
                <p className="text-[9px] text-muted-foreground">2026 YTD</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
