import type {
  IndentSheet,
  MasterSheet,
  ReceivedSheet,
  Sheet,
} from '@/types';
import type {
  InventorySheet,
  PoMasterSheet,
  QuotationHistorySheet,
  UserPermissions,
  Vendor,
} from '@/types/sheets';

/* =====================================================
   UPLOAD FILE (ONLY ONE TIME – DUPLICATE REMOVED)
===================================================== */
export async function uploadFile(
  file: File,
  folderId: string,
  uploadType: 'upload' | 'email' = 'upload',
  email?: string
): Promise<string> {
  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string)?.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const form = new FormData();
  form.append('action', 'upload');
  form.append('fileName', file.name);
  form.append('mimeType', file.type);
  form.append('fileData', base64);
  form.append('folderId', folderId);
  form.append('uploadType', uploadType);

  if (uploadType === 'email' && email) {
    form.append('email', email);
    form.append('emailSubject', 'Purchase Order');
    form.append('emailBody', 'Please find attached PO.');
  }

  const response = await fetch(import.meta.env.VITE_APP_SCRIPT_URL, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) throw new Error('File upload failed');
  const res = await response.json();
  if (!res.success) throw new Error('Upload API failed');

  return res.fileUrl as string;
}

/* =====================================================
   FETCH SHEET (ONLY ONE TIME – DUPLICATE REMOVED)
===================================================== */
export async function fetchSheet(
  sheetName: Sheet
): Promise<
  | MasterSheet
  | IndentSheet[]
  | ReceivedSheet[]
  | UserPermissions[]
  | PoMasterSheet[]
  | InventorySheet[]
  | QuotationHistorySheet[]
> {
  const url = `${import.meta.env.VITE_APP_SCRIPT_URL}?sheetName=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);

  if (!response.ok) throw new Error('Failed to fetch data');
  const raw = await response.json();
  if (!raw.success) throw new Error('Invalid API response');

  if (sheetName === 'MASTER') {
    const data = raw.options;
    const length = Math.max(...Object.values(data).map((arr: any) => arr.length));

    const vendors: Vendor[] = [];
    const groupHeads: Record<string, Set<string>> = {};
    const departments = new Set<string>();
    const paymentTerms = new Set<string>();
    const defaultTerms = new Set<string>();

    for (let i = 0; i < length; i++) {
      if (data.vendorName?.[i] && data.vendorGstin?.[i] && data.vendorAddress?.[i]) {
        vendors.push({
          vendorName: data.vendorName[i],
          gstin: data.vendorGstin[i],
          address: data.vendorAddress[i],
          email: data.vendorEmail?.[i],
        });
      }

      if (data.department?.[i]) departments.add(data.department[i]);
      if (data.paymentTerm?.[i]) paymentTerms.add(data.paymentTerm[i]);
      if (data.defaultTerms?.[i]) defaultTerms.add(data.defaultTerms[i]);

      const group = data.groupHead?.[i];
      const item = data.itemName?.[i];
      if (group && item) {
        if (!groupHeads[group]) groupHeads[group] = new Set();
        groupHeads[group].add(item);
      }
    }

    return {
      vendors,
      departments: [...departments],
      paymentTerms: [...paymentTerms],
      groupHeads: Object.fromEntries(
        Object.entries(groupHeads).map(([k, v]) => [k, [...v]])
      ),
      companyPan: data.companyPan,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyGstin: data.companyGstin,
      billingAddress: data.billingAddress,
      destinationAddress: data.destinationAddress,
      defaultTerms: [...defaultTerms],
    };
  }

  return raw.rows.filter((r: IndentSheet) => r.timestamp !== '');
}

/* =====================================================
   POST TO SHEET (BACKWARD COMPATIBLE FIX)
===================================================== */
/* =====================================================
   POST TO SHEET (IMPROVED WITH BETTER ERROR HANDLING)
===================================================== */
export async function postToSheet(
  data:
    | Partial<IndentSheet>[]
    | Partial<ReceivedSheet>[]
    | Partial<UserPermissions>[]
    | Partial<PoMasterSheet>[]
    | Partial<QuotationHistorySheet>[],
  action:
    | 'insert'
    | 'insertQuotation'
    | 'sendSupplierEmail'
    | 'updateSupplierRates' = 'insert',
  sheet: Sheet = 'INDENT',
  extraParams?: any
) {
  try {
    console.log(`📤 [postToSheet] Starting: ${action} to ${sheet}`);
    console.log('📝 Data:', data);
    console.log('⚙️ Extra params:', extraParams);

    const GAS_URL = import.meta.env.VITE_APP_SCRIPT_URL;
    if (!GAS_URL) {
      throw new Error('VITE_APP_SCRIPT_URL environment variable is not set');
    }

    console.log('🔗 GAS URL:', GAS_URL);

    // FormData create karo
    const form = new FormData();
    form.append('action', action);
    form.append('sheetName', sheet);

    // Data add karo agar hai to
    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
      form.append('rows', JSON.stringify(data));
      console.log(`📦 Adding ${Array.isArray(data) ? data.length : 1} row(s) to FormData`);
    }

    // Extra params add karo
    if (extraParams) {
      form.append('params', JSON.stringify(extraParams));
      console.log('📋 Extra params added');
    }

    console.log('🚀 Sending request to GAS...');

    // Fetch request
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: form,
    });

    console.log('📨 Response status:', response.status, response.statusText);

    // Response parse karo
    const responseText = await response.text();
    console.log('📄 Raw response text:', responseText.substring(0, 500));

    let res;
    try {
      res = JSON.parse(responseText);
      console.log('✅ Parsed JSON response:', res);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}`);
    }

    // Check if response has success property
    if (res.success === undefined) {
      console.warn('⚠️ Response missing "success" property, assuming success');
      return res;
    }

    if (!res.success) {
      console.error('❌ API returned failure:', res);
      throw new Error(res.message || res.error || 'API returned unsuccessful response');
    }

    console.log(`🎉 ${action} successful to ${sheet}`);
    return res;

  } catch (error) {
    console.error('💥 postToSheet Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      action,
      sheet
    });
    throw new Error(`API error in ${action}: ${error.message}`);
  }
}

/* =====================================================
   QUOTATION HISTORY
===================================================== */
export async function postToQuotationHistory(rows: any[]) {
  const formData = new FormData();
  formData.append('action', 'insertQuotation');
  formData.append('rows', JSON.stringify(rows));

  const response = await fetch(import.meta.env.VITE_APP_SCRIPT_URL, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Quotation failed');

  return result;
}

/* =====================================================
   FETCH VENDORS
===================================================== */
export async function fetchVendors() {
  const response = await fetch(
    `${import.meta.env.VITE_APP_SCRIPT_URL}?sheetName=MASTER&fetchType=vendors`
  );
  const data = await response.json();
  return data.vendors || [];
}

/* =====================================================
   SEND HTML EMAIL
===================================================== */
export async function sendHtmlEmail(params: {
  to: string;
  subject: string;
  html: string;
  supplierName: string;
  quotationNumber: string;
}) {
  const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'sendHtmlEmail',
      params: JSON.stringify(params),
    }),
  });

  if (!response.ok) throw new Error('Email sending failed');

  const result = JSON.parse(await response.text());
  if (!result.success) throw new Error(result.error);

  return result.message;
}
