import type { JSX } from "react";
import type { IndentSheet, UserPermissions } from "./sheets";
import { NextRequest, NextResponse } from 'next/server'

export interface RouteAttributes {
    name: string;
    element: JSX.Element;
    path: string;
    icon: JSX.Element;
    gateKey?: keyof UserPermissions;
    notifications: (sheet: IndentSheet[]) => number
}
export async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const quotation = searchParams.get('quotation')
      const supplier = searchParams.get('supplier')
  
      if (!quotation || !supplier) {
        return NextResponse.json({ success: false, error: 'Missing quotation or supplier' })
      }
  
      // Fetch from QUOTATION HISTORY - exact same logic as your GAS
      const data = await fetchSheet('QUOTATION HISTORY')
      const filteredData = data.filter((row: any) => 
        row.quotationNumber === quotation && 
        (row.supplierName === supplier || row.vendorName === supplier)
      )
  
      return NextResponse.json({ 
        success: true, 
        data: filteredData 
      })
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch data' })
    }
  }
  export async function POST(request: NextRequest) {
    try {
      const { formData, vendorName, quotationNumber } = await request.json()
  
      // EXACT SAME LOGIC as your GAS submitFormData()
      const rowsToInsert = []
      for (const key in formData) {
        const rowData = formData[key]
        const timestamp = new Date()
        const finalRow = [timestamp, vendorName, ...rowData, quotationNumber]
        rowsToInsert.push(finalRow)
      }
  
      // Submit to History sheet
      await postToSheet(rowsToInsert, 'insert', 'History')
  
      return NextResponse.json({ message: 'Form submitted successfully.' })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to submit rates' }, { status: 500 })
    }
  }