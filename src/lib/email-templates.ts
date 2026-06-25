const PRIMARY = "#7C3AED";
const PRIMARY_LIGHT = "#EDE9FE";
const BG = "#F9FAFB";
const TEXT = "#1F2937";
const MUTED = "#6B7280";

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${TEXT};direction:rtl;text-align:right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          ${body}
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:24px 16px;text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
              <p style="margin:0 0 8px 0;">فينيكلي — منصة التجارة الإلكترونية الجزائرية</p>
              <p style="margin:0;">
                <a href="https://fennecly.online/unsubscribe" style="color:${MUTED};text-decoration:underline;">إلغاء اشتراك الرسائل</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function header(title: string): string {
  return `
    <tr>
      <td style="background-color:${PRIMARY};padding:32px 24px;text-align:center;">
        <img src="https://fennecly.online/logo.png" alt="Fennecly" width="48" height="48" style="display:inline-block;border-radius:10px;margin-bottom:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${title}</h1>
      </td>
    </tr>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <tr>
      <td style="padding:24px 24px 8px;text-align:center;">
        <a href="${url}" style="display:inline-block;background-color:${PRIMARY};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${text}</a>
      </td>
    </tr>`;
}

export function welcomeMerchantEmail(merchantName: string): string {
  const body = `
    ${header("مرحباً بك في فينيكلي")}
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <p style="font-size:20px;font-weight:700;margin:0 0 8px;">مرحباً ${merchantName}! 🎉</p>
        <p style="font-size:15px;color:${MUTED};margin:0 0 24px;line-height:1.6;">حسابك جاهز — ابدأ الآن بإضافة منتجاتك وتخصيص متجرك</p>
      </td>
    </tr>
    ${ctaButton("ابدأ الآن", "https://fennecly.online/dashboard")}`;
  return wrap(`مرحباً بك في فينيكلي — ${merchantName}`, body);
}

export function newOrderMerchantEmail(data: {
  merchantName: string;
  customerName: string;
  orderTotal: number;
  orderNumber: string;
  ordersUrl: string;
}): string {
  const body = `
    ${header("طلب جديد!")}
    <tr>
      <td style="padding:32px 24px;">
        <p style="font-size:17px;font-weight:700;margin:0 0 4px;">🛍️ طلب جديد من ${data.customerName}!</p>
        <p style="font-size:14px;color:${MUTED};margin:0 0 24px;">مرحباً ${data.merchantName}، وصل طلب جديد إلى متجرك.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
          <tr style="background-color:${PRIMARY_LIGHT};">
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">رقم الطلب</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">المبلغ</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">التاريخ</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">#${data.orderNumber}</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:600;border-bottom:1px solid #E5E7EB;">${data.orderTotal.toFixed(2)} DA</td>
            <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">${new Date().toLocaleDateString("ar-DZ")}</td>
          </tr>
        </table>
      </td>
    </tr>
    ${ctaButton("عرض الطلب", data.ordersUrl)}`;
  return wrap(`طلب جديد من ${data.customerName}`, body);
}

export function orderConfirmationCustomerEmail(data: {
  customerName: string;
  storeName: string;
  orderNumber: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  deliveryWilaya: string;
}): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;">${item.name}</td>
        <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;text-align:center;">×${item.qty}</td>
        <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E5E7EB;text-align:left;">${item.price.toFixed(2)} DA</td>
      </tr>`,
    )
    .join("");

  const body = `
    ${header("تأكيد الطلب")}
    <tr>
      <td style="padding:32px 24px;">
        <p style="font-size:17px;font-weight:700;margin:0 0 4px;">✅ تم تأكيد طلبك من ${data.storeName}</p>
        <p style="font-size:14px;color:${MUTED};margin:0 0 24px;">مرحباً ${data.customerName}، تم استلام طلبك بنجاح.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:16px;">
          <tr style="background-color:${PRIMARY_LIGHT};">
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;">المنتج</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;text-align:center;">الكمية</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #E5E7EB;text-align:left;">السعر</td>
          </tr>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;border-top:2px solid #E5E7EB;">الإجمالي</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:700;text-align:left;border-top:2px solid #E5E7EB;color:${PRIMARY};">${data.total.toFixed(2)} DA</td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:12px 16px;font-size:14px;background-color:${PRIMARY_LIGHT};">رقم الطلب</td>
            <td style="padding:12px 16px;font-size:14px;">#${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:14px;background-color:${PRIMARY_LIGHT};">ولاية التوصيل</td>
            <td style="padding:12px 16px;font-size:14px;">${data.deliveryWilaya}</td>
          </tr>
        </table>
        <p style="font-size:14px;color:${MUTED};margin:20px 0 0;text-align:center;">سيتم التواصل معك قريباً لتأكيد التوصيل</p>
      </td>
    </tr>`;
  return wrap(`تأكيد طلبك من ${data.storeName}`, body);
}

export function weeklySummaryEmail(data: {
  merchantName: string;
  weekOrders: number;
  weekRevenue: number;
  topProduct: string;
  newCustomers: number;
}): string {
  const statBox = (label: string, value: string): string => `
    <td style="width:25%;padding:8px;text-align:center;">
      <div style="background-color:${PRIMARY_LIGHT};border-radius:8px;padding:16px 8px;">
        <div style="font-size:22px;font-weight:700;color:${PRIMARY};margin-bottom:4px;">${value}</div>
        <div style="font-size:12px;color:${MUTED};">${label}</div>
      </div>
    </td>`;

  const body = `
    ${header("ملخص أسبوعك")}
    <tr>
      <td style="padding:32px 24px;">
        <p style="font-size:17px;font-weight:700;margin:0 0 4px;">مرحباً ${data.merchantName} 👋</p>
        <p style="font-size:14px;color:${MUTED};margin:0 0 24px;">إليك ملخص نشاطك هذا الأسبوع على فينيكلي.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${statBox("الطلبات", String(data.weekOrders))}
            ${statBox("الإيرادات", `${(data.weekRevenue / 1000).toFixed(0)}k`)}
            ${statBox("الأكثر مبيعاً", data.topProduct || "—")}
            ${statBox("عملاء جدد", String(data.newCustomers))}
          </tr>
        </table>
      </td>
    </tr>
    ${ctaButton("عرض التقارير الكاملة", "https://fennecly.online/dashboard/analytics")}`;
  return wrap(`ملخص أسبوعك على فينيكلي`, body);
}
