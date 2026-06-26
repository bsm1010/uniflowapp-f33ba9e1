const BREVO_API = "https://api.brevo.com/v3";
const PRIMARY = "#7C3AED";
const PRIMARY_LIGHT = "#EDE9FE";
const BG = "#F9FAFB";
const TEXT = "#1F2937";
const MUTED = "#6B7280";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${TEXT};direction:rtl;text-align:right;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG};"><tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
${body}
</table>
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;"><tr><td style="padding:24px 16px;text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
<p style="margin:0 0 8px;">فينيكلي — منصة التجارة الإلكترونية الجزائرية</p>
<p style="margin:0;"><a href="https://fennecly.online/unsubscribe" style="color:${MUTED};text-decoration:underline;">إلغاء اشتراك الرسائل</a></p>
</td></tr></table>
</td></tr></table></body></html>`;
}

function header(title: string): string {
  return `<tr><td style="background-color:${PRIMARY};padding:32px 24px;text-align:center;">
<img src="https://fennecly.online/logo.png" alt="Fennecly" width="48" height="48" style="display:inline-block;border-radius:10px;margin-bottom:12px;"/>
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${title}</h1></td></tr>`;
}

function ctaButton(text: string, url: string): string {
  return `<tr><td style="padding:24px 24px 8px;text-align:center;">
<a href="${url}" style="display:inline-block;background-color:${PRIMARY};color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${text}</a></td></tr>`;
}

function templateWelcome(name: string): string {
  return wrap(`مرحباً بك في فينيكلي — ${name}`,
    `${header("مرحباً بك في فينيكلي")}
<tr><td style="padding:32px 24px;text-align:center;">
<p style="font-size:20px;font-weight:700;margin:0 0 8px;">مرحباً ${name}! 🎉</p>
<p style="font-size:15px;color:${MUTED};margin:0 0 24px;line-height:1.6;">حسابك جاهز — ابدأ الآن بإضافة منتجاتك وتخصيص متجرك</p></td></tr>
${ctaButton("ابدأ الآن", "https://fennecly.online/dashboard")}`);
}

function templateNewOrder(d: { merchantName: string; customerName: string; orderTotal: number; orderNumber: string; ordersUrl: string }): string {
  return wrap(`طلب جديد من ${d.customerName}`,
    `${header("طلب جديد!")}
<tr><td style="padding:32px 24px;">
<p style="font-size:17px;font-weight:700;margin:0 0 4px;">🛍️ طلب جديد من ${d.customerName}!</p>
<p style="font-size:14px;color:${MUTED};margin:0 0 24px;">مرحباً ${d.merchantName}، وصل طلب جديد إلى متجرك.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
<tr style="background-color:${PRIMARY_LIGHT};">
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">رقم الطلب</td>
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">المبلغ</td>
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">التاريخ</td></tr>
<tr>
<td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">#${d.orderNumber}</td>
<td style="padding:10px 16px;font-size:14px;font-weight:600;border-bottom:1px solid #E5E7EB;">${d.orderTotal.toFixed(2)} DA</td>
<td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">${new Date().toLocaleDateString("ar-DZ")}</td></tr></table></td></tr>
${ctaButton("عرض الطلب", d.ordersUrl)}`);
}

function templateOrderConfirmation(d: { customerName: string; storeName: string; orderNumber: string; items: Array<{ name: string; qty: number; price: number }>; total: number; deliveryWilaya: string }): string {
  const rows = d.items.map(i => `<tr>
<td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">${i.name}</td>
<td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;text-align:center;">×${i.qty}</td>
<td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;text-align:left;">${i.price.toFixed(2)} DA</td></tr>`).join("");
  return wrap(`تأكيد طلبك من ${d.storeName}`,
    `${header("تأكيد الطلب")}
<tr><td style="padding:32px 24px;">
<p style="font-size:17px;font-weight:700;margin:0 0 4px;">✅ تم تأكيد طلبك من ${d.storeName}</p>
<p style="font-size:14px;color:${MUTED};margin:0 0 24px;">مرحباً ${d.customerName}، تم استلام طلبك بنجاح.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:16px;">
<tr style="background-color:${PRIMARY_LIGHT};">
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">المنتج</td>
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;text-align:center;">الكمية</td>
<td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;text-align:left;">السعر</td></tr>
${rows}
<tr><td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;border-top:2px solid #E5E7EB;">الإجمالي</td>
<td style="padding:12px 16px;font-size:15px;font-weight:700;text-align:left;border-top:2px solid #E5E7EB;color:${PRIMARY};">${d.total.toFixed(2)} DA</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
<tr><td style="padding:12px 16px;font-size:14px;background-color:${PRIMARY_LIGHT};">رقم الطلب</td><td style="padding:12px 16px;font-size:14px;">#${d.orderNumber}</td></tr>
<tr><td style="padding:12px 16px;font-size:14px;background-color:${PRIMARY_LIGHT};">ولاية التوصيل</td><td style="padding:12px 16px;font-size:14px;">${d.deliveryWilaya}</td></tr></table>
<p style="font-size:14px;color:${MUTED};margin:20px 0 0;text-align:center;">سيتم التواصل معك قريباً لتأكيد التوصيل</p></td></tr>`);
}

function templateWeeklySummary(d: { merchantName: string; weekOrders: number; weekRevenue: number; topProduct: string; newCustomers: number }): string {
  const box = (label: string, value: string) => `<td style="width:25%;padding:8px;text-align:center;">
<div style="background-color:${PRIMARY_LIGHT};border-radius:8px;padding:16px 8px;">
<div style="font-size:22px;font-weight:700;color:${PRIMARY};margin-bottom:4px;">${value}</div>
<div style="font-size:12px;color:${MUTED};">${label}</div></div></td>`;
  return wrap(`ملخص أسبوعك على فينيكلي`,
    `${header("ملخص أسبوعك")}
<tr><td style="padding:32px 24px;">
<p style="font-size:17px;font-weight:700;margin:0 0 4px;">مرحباً ${d.merchantName} 👋</p>
<p style="font-size:14px;color:${MUTED};margin:0 0 24px;">إليك ملخص نشاطك هذا الأسبوع على فينيكلي.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
${box("الطلبات", String(d.weekOrders))}
${box("الإيرادات", `${(d.weekRevenue / 1000).toFixed(0)}k`)}
${box("الأكثر مبيعاً", d.topProduct || "—")}
${box("عملاء جدد", String(d.newCustomers))}
</tr></table></td></tr>
${ctaButton("عرض التقارير الكاملة", "https://fennecly.online/dashboard/analytics")}`);
}

async function sendBrevoEmail(apiKey: string, to: { email: string; name: string }, subject: string, html: string): Promise<boolean> {
  const res = await fetch(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Fennecly", email: "no-reply@fennecly.online" },
      to: [to],
      subject,
      htmlContent: html,
    }),
  });
  return res.ok;
}

async function addBrevoContact(apiKey: string, email: string, firstName: string): Promise<boolean> {
  const res = await fetch(`${BREVO_API}/contacts`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: firstName },
      listIds: [2],
    }),
  });
  return res.ok || res.status === 409;
}

async function unsubscribeBrevoContact(apiKey: string, email: string): Promise<boolean> {
  const res = await fetch(`${BREVO_API}/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ emailBlacklisted: true }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, data } = await req.json();

    let subject = "";
    let html = "";
    let toEmail = "";
    let toName = "";

    switch (type) {
      case "welcome_merchant": {
        subject = `مرحباً ${data.merchantName}! أهلاً بك في فينيكلي 🎉`;
        html = templateWelcome(data.merchantName);
        toEmail = data.email;
        toName = data.merchantName;
        await addBrevoContact(apiKey, data.email, data.merchantName);
        break;
      }
      case "new_order_merchant": {
        subject = `🛍️ طلب جديد من ${data.customerName}`;
        html = templateNewOrder(data);
        toEmail = data.merchantEmail;
        toName = data.merchantName;
        break;
      }
      case "order_confirmation": {
        subject = `✅ تأكيد طلبك من ${data.storeName}`;
        html = templateOrderConfirmation(data);
        toEmail = data.customerEmail;
        toName = data.customerName;
        break;
      }
      case "weekly_summary": {
        subject = `📊 ملخص أسبوعك على فينيكلي`;
        html = templateWeeklySummary(data);
        toEmail = data.merchantEmail;
        toName = data.merchantName;
        break;
      }
      case "unsubscribe": {
        const ok = await unsubscribeBrevoContact(apiKey, data.email);
        return new Response(JSON.stringify({ ok }), {
          status: ok ? 200 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "No recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sent = await sendBrevoEmail(apiKey, { email: toEmail, name: toName }, subject, html);

    return new Response(JSON.stringify({ ok: sent }), {
      status: sent ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
