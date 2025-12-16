import type { IndentSheet, MasterSheet, ReceivedSheet, Sheet } from '@/types';
import type { InventorySheet, PoMasterSheet, QuotationHistorySheet, UserPermissions, Vendor } from '@/types/sheets';

export async function uploadFile(file: File, folderId: string, uploadType: 'upload' | 'email' = 'upload', email?: string): Promise<string> {
    const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string)?.split(',')[1]; // Remove data:type;base64, prefix
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
    if (uploadType === "email") {
        form.append('email', email!);
        form.append('emailSubject', "Purchase Order");
        form.append('emailBody', "Please find attached PO.");
    }

    const response = await fetch(import.meta.env.VITE_APP_SCRIPT_URL, {
        method: 'POST',
        body: form,
        redirect: 'follow',
    });

    console.log(response)
    if (!response.ok) throw new Error('Failed to upload file');
    const res = await response.json();
    console.log(res)
    if (!res.success) throw new Error('Failed to upload data');

    return res.fileUrl as string;
}

export async function fetchSheet(
    sheetName: Sheet
): Promise<MasterSheet | IndentSheet[] | ReceivedSheet[] | UserPermissions[] | PoMasterSheet[] | InventorySheet[]> {
    const url = `${import.meta.env.VITE_APP_SCRIPT_URL}?sheetName=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch data');
    const raw = await response.json();
    if (!raw.success) throw new Error('Something went wrong when parsing data');

    if (sheetName === 'MASTER') {
        const data = raw.options;

        // @ts-expect-error Assuming data is structured correctly
        const length = Math.max(...Object.values(data).map((arr) => arr.length));

        const vendors: Vendor[] = [];
        const groupHeads: Record<string, Set<string>> = {};
        const departments = new Set<string>();
        const paymentTerms = new Set<string>();
        const defaultTerms = new Set<string>();

        for (let i = 0; i < length; i++) {
            const vendorName = data.vendorName?.[i];
            const gstin = data.vendorGstin?.[i];
            const address = data.vendorAddress?.[i];
            const email = data.vendorEmail?.[i];
            if (vendorName && gstin && address) {
                vendors.push({ vendorName, gstin, address, email });
            }

            if (data.department?.[i]) departments.add(data.department[i]);
            if (data.paymentTerm?.[i]) paymentTerms.add(data.paymentTerm[i]);
            if (data.defaultTerms?.[i]) defaultTerms.add(data.defaultTerms[i])

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
            groupHeads: Object.fromEntries(Object.entries(groupHeads).map(([k, v]) => [k, [...v]])),
            companyPan: data.companyPan,
            companyName: data.companyName,
            companyAddress: data.companyAddress,
            companyPhone: data.companyPhone,
            companyGstin: data.companyGstin,
            billingAddress: data.billingAddress,
            destinationAddress: data.destinationAddress,
            defaultTerms: [...defaultTerms]
        };
    }
    return raw.rows.filter((r: IndentSheet) => r.timestamp !== '');
}


// lib/fetchers.ts में या जहां postToSheet function है

export async function postToQuotationHistory(rows: any[]) {
  try {
    const formData = new FormData();
    formData.append('action', 'insertQuotation');
    formData.append('rows', JSON.stringify(rows));

    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit quotation');
    }

    return result;
  } catch (error) {
    console.error('Error posting quotation:', error);
    throw error;
  }
}


export async function fetchVendors() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_SCRIPT_URL}?sheetName=MASTER&fetchType=vendors`
    );
    const data = await response.json();
    return data.vendors || [];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
}

// src/lib/fetchers.ts

const SHEET_URL = import.meta.env.VITE_SHEET_URL;

export type PostSheetAction = 
  | "insert" 
  | "update" 
  | "delete" 
  | "insertQuotation" 
  | "sendSupplierEmail"
  | "updateSupplierRates";

export async function postToSheet(
  rows: any[],
  action: PostSheetAction,
  sheetName: string,
  params?: any
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("rows", JSON.stringify(rows));
    formData.append("action", action);
    formData.append("sheetName", sheetName);
    
    if (params) {
      formData.append("params", JSON.stringify(params));
    }

    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("postToSheet error:", error);
    throw error;
  }
}

export async function fetchSheet(sheetName: string): Promise<any> {
  try {
    const response = await fetch(
      `${SHEET_URL}?sheetName=${encodeURIComponent(sheetName)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.rows || data.options || data;
  } catch (error) {
    console.error("fetchSheet error:", error);
    throw error;
  }
}

// Optional: Upload file function
export async function uploadFile(
  file: File,
  folderId: string,
  uploadType?: string,
  email?: string
): Promise<string> {
  try {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const formData = new FormData();
        formData.append("action", "upload");
        formData.append("fileName", file.name);
        formData.append("fileData", base64Data);
        formData.append("mimeType", file.type);
        formData.append("folderId", folderId);
        
        if (uploadType) {
          formData.append("uploadType", uploadType);
        }
        if (email) {
          formData.append("email", email);
        }

        const response = await fetch(SHEET_URL, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        
        if (result.success) {
          resolve(result.fileUrl || result.downloadUrl);
        } else {
          reject(new Error(result.error || "Upload failed"));
        }
      };
      
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("uploadFile error:", error);
    throw error;
  }
}
// Add this new function in fetchers.ts
export async function postToMasterSheet(data: any[]) {
    try {
        const response = await fetch('/api/master-sheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Failed to post to master sheet');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error posting to master sheet:', error);
        throw new Error('Something went wrong in the API');
    }
}



// fetchers.ts mein ye function add kariye (baaki sab same rahega)
export async function sendHtmlEmail(params: {
    to: string;
    subject: string;
    html: string;
    supplierName: string;
    quotationNumber: string;
  }) {
    try {
      // Aapke existing pattern ko follow kar raha hai
      const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL!, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'sendHtmlEmail',
          params: JSON.stringify(params)
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.text();
      const parsedResult = JSON.parse(result);
      
      if (!parsedResult.success) {
        throw new Error(parsedResult.error || 'Email sending failed');
      }
      
      return parsedResult.message;
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send HTML quotation: ${error}`);
    }
  }
  