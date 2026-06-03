import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ExportRequest = {
  id: string;
  store_id: string;
  email: string;
  request_type: string;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  delivery_method: string;
  file_url: string | null;
  completed_at: string | null;
  created_at: string;
};

export const requestDataExport = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      storeId: string;
      userId: string;
      email: string;
      deliveryMethod: "download" | "email";
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("data_export_requests").insert({
      store_id: data.storeId,
      user_id: data.userId,
      email: data.email,
      request_type: "merchant",
      delivery_method: data.deliveryMethod,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const requestDataExportAsCustomer = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      storeId: string;
      name: string;
      email: string;
      deliveryMethod: "download" | "email";
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("data_export_requests").insert({
      store_id: data.storeId,
      email: data.email,
      request_type: "customer",
      customer_name: data.name,
      customer_email: data.email,
      delivery_method: data.deliveryMethod,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    await supabase.from("consent_audit_log").insert({
      store_id: data.storeId,
      action: "export_requested",
      details: { customer_name: data.name, customer_email: data.email },
    });

    return { ok: true };
  });

export const processDataExport = createServerFn({ method: "POST" })
  .inputValidator((input: { requestId: string; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase config missing");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: request } = await admin
      .from("data_export_requests")
      .select("*")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!request) throw new Error("Export request not found");

    await admin
      .from("data_export_requests")
      .update({ status: "processing" })
      .eq("id", data.requestId);

    try {
      const storeId = request.store_id;

      const [storeRes, productsRes, ordersRes, settingsRes] = await Promise.all([
        admin.from("stores").select("*").eq("id", storeId).maybeSingle(),
        admin.from("products").select("*").eq("store_id", storeId),
        admin.from("orders").select("*").eq("store_id", storeId),
        admin.from("store_settings").select("*").eq("store_id", storeId).maybeSingle(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        store: storeRes.data,
        products: productsRes.data ?? [],
        orders: ordersRes.data ?? [],
        store_settings: settingsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const fileName = `export-${storeId.slice(0, 8)}-${Date.now()}.json`;

      const { data: uploadData, error: uploadErr } = await admin.storage
        .from("exports")
        .upload(fileName, blob, { contentType: "application/json" });

      if (uploadErr) {
        await admin
          .from("data_export_requests")
          .update({ status: "failed" })
          .eq("id", data.requestId);
        throw new Error(uploadErr.message);
      }

      const { data: urlData } = admin.storage
        .from("exports")
        .getPublicUrl(uploadData.path);

      await admin
        .from("data_export_requests")
        .update({
          status: "completed",
          file_url: urlData.publicUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("id", data.requestId);

      return { ok: true, fileUrl: urlData.publicUrl };
    } catch (err) {
      await admin
        .from("data_export_requests")
        .update({ status: "failed" })
        .eq("id", data.requestId);
      throw err;
    }
  });

export const getExportRequests = createServerFn({ method: "GET" })
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: requests } = await supabase
      .from("data_export_requests")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    return (requests ?? []) as ExportRequest[];
  });

export const getExportDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((input: { requestId: string }) => input)
  .handler(async ({ data }) => {
    const { data: request } = await supabase
      .from("data_export_requests")
      .select("file_url, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!request || request.status !== "completed" || !request.file_url) {
      throw new Error("Export not ready");
    }
    return { url: request.file_url };
  });
