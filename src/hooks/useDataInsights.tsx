import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type ParsedData = {
  stockists?: { name: string; town?: string; county?: string; sales_value?: number; notes?: string }[];
  sales_patterns?: { period: string; revenue?: number; units?: number; top_products?: string[]; notes?: string }[];
  key_metrics?: { total_revenue?: number; total_accounts?: number; average_order_value?: number; top_county?: string; top_category?: string; growth_rate?: string };
  seasonal_trends?: { season: string; impact?: string; revenue_share?: string; notes?: string }[];
  insights?: string[];
};

type FileWithData = {
  id: string;
  file_name: string;
  category: string;
  parsed_data: ParsedData | null;
  ai_summary: string | null;
  created_at: string;
};

export type AggregatedInsights = {
  totalFiles: number;
  analysedFiles: number;
  allStockists: { name: string; town?: string; county?: string; sales_value?: number; source: string }[];
  allSalesPatterns: { period: string; revenue?: number; units?: number; top_products?: string[]; source: string }[];
  aggregatedMetrics: { total_revenue: number; total_accounts: number; average_order_value: number; top_county: string; growth_rate: string };
  seasonalTrends: { season: string; impact?: string; revenue_share?: string; notes?: string }[];
  allInsights: string[];
  loading: boolean;
};

export function useDataInsights(): AggregatedInsights {
  const [files, setFiles] = useState<FileWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("uploaded_files")
      .select("id, file_name, category, parsed_data, ai_summary, created_at")
      .not("parsed_data", "eq", "{}")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFiles((data as FileWithData[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const analysedFiles = files.filter(f => f.parsed_data && Object.keys(f.parsed_data).length > 0);

  const allStockists: AggregatedInsights["allStockists"] = [];
  const allSalesPatterns: AggregatedInsights["allSalesPatterns"] = [];
  const seasonalTrends: AggregatedInsights["seasonalTrends"] = [];
  const allInsights: string[] = [];
  let totalRevenue = 0;
  let totalAccounts = 0;
  let aovSum = 0;
  let aovCount = 0;
  let topCounty = "";
  let growthRate = "";

  for (const f of analysedFiles) {
    const pd = f.parsed_data!;
    if (pd.stockists) {
      for (const s of pd.stockists) {
        allStockists.push({ ...s, source: f.file_name });
      }
    }
    if (pd.sales_patterns) {
      for (const sp of pd.sales_patterns) {
        allSalesPatterns.push({ ...sp, source: f.file_name });
      }
    }
    if (pd.key_metrics) {
      if (pd.key_metrics.total_revenue) totalRevenue += pd.key_metrics.total_revenue;
      if (pd.key_metrics.total_accounts) totalAccounts += pd.key_metrics.total_accounts;
      if (pd.key_metrics.average_order_value) { aovSum += pd.key_metrics.average_order_value; aovCount++; }
      if (pd.key_metrics.top_county) topCounty = pd.key_metrics.top_county;
      if (pd.key_metrics.growth_rate) growthRate = pd.key_metrics.growth_rate;
    }
    if (pd.seasonal_trends) {
      for (const st of pd.seasonal_trends) {
        if (!seasonalTrends.find(e => e.season === st.season)) seasonalTrends.push(st);
      }
    }
    if (pd.insights) allInsights.push(...pd.insights);
  }

  return {
    totalFiles: files.length,
    analysedFiles: analysedFiles.length,
    allStockists,
    allSalesPatterns,
    aggregatedMetrics: {
      total_revenue: totalRevenue,
      total_accounts: totalAccounts,
      average_order_value: aovCount > 0 ? Math.round(aovSum / aovCount) : 0,
      top_county: topCounty,
      growth_rate: growthRate,
    },
    seasonalTrends,
    allInsights,
    loading,
  };
}
