"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function UpdateRatePage() {
  const [vendorName, setVendorName] = useState("")
  const [quotationNumber, setQuotationNumber] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paymentTerm, setPaymentTerm] = useState("")
  const [vendorIndex, setVendorIndex] = useState(1); // Default to 1

  // URL params se data lo
  useEffect(() => {
    console.log("🔍 Parsing URL parameters...");

    const urlParams = new URLSearchParams(window.location.search);
    const quotation = urlParams.get('quotation') || "";
    const supplier = urlParams.get('supplier') || "";
    const itemsParam = urlParams.get('items') || "";
    const vIndex = parseInt(urlParams.get('vendorIndex') || "1");

    console.log("📋 Raw parameters:", { quotation, supplier, itemsParam, vIndex });

    if (!quotation || !supplier) {
      console.error("❌ Missing quotation or supplier");
      alert("Invalid link: Missing quotation or supplier");
      setLoading(false);
      return;
    }

    setQuotationNumber(quotation);
    setVendorName(supplier);
    setVendorIndex(vIndex);
    setPaymentTerm("");

    // Items parse karo
    if (itemsParam) {
      try {
        console.log("Parsing items from URL...");
        const decodedItems = decodeURIComponent(itemsParam);
        const parsedItems = JSON.parse(decodedItems);

        console.log("✅ Parsed items:", parsedItems);

        // Format items properly
        const formattedProducts = parsedItems.map((item: any, index: number) => ({
          internalCode: item.code || `ITEM-${index + 1}`,
          productName: item.name || `Product ${index + 1}`,
          qty: item.qty || "1",
          uom: item.uom || "PCS",
          specifications: item.spec || "No specifications provided",
          remarks: "",
          rate: "",
          paymentTerm: ""
        }));

        setProducts(formattedProducts);
        console.log(`✅ Loaded ${formattedProducts.length} products`);

      } catch (error) {
        console.error("❌ Error parsing items:", error);
        // Fallback: Sample products
        setProducts(getSampleProducts());
      }
    } else {
      console.log("No items in URL, using sample data");
      setProducts(getSampleProducts());
    }

    setLoading(false);

  }, []);

  // Sample products function
  function getSampleProducts() {
    return [
      {
        internalCode: "IND-001",
        productName: "Sample Product 1",
        qty: "10",
        uom: "PCS",
        specifications: "Sample specifications",
        remarks: "",
        rate: "",
        paymentTerm: ""
      },
      {
        internalCode: "IND-002",
        productName: "Sample Product 2",
        qty: "20",
        uom: "KG",
        specifications: "Sample specifications",
        remarks: "",
        rate: "",
        paymentTerm: ""
      }
    ];
  }

  const handlePaymentTermChange = (index: number, value: string) => {
    const updated = [...products]
    updated[index].paymentTerm = value
    setProducts(updated)
  }

  const handleSubmit = () => {
    const emptyRates = products.filter(p => !p.rate || p.rate.trim() === "");
    if (emptyRates.length > 0) {
      // Instead of alert, we can show a validation message in the UI
      // For now, let's at least make the submission smoother
      return;
    }

    const APPS_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

    const updateData = products.map(product => ({
      internalCode: product.internalCode.trim(),
      rate: product.rate,
      paymentTerm: product.paymentTerm || "",
      remarks: product.remarks || ""
    }));

    console.log("📤 Submitting update data:", updateData);
    console.log("📍 Supplier Name:", vendorName);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = APPS_SCRIPT_URL;
    form.target = 'hidden-iframe';

    const iframe = document.createElement('iframe');
    iframe.name = 'hidden-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const fields: any = {
      action: 'updateExistingRows',
      supplierName: vendorName,
      data: JSON.stringify(updateData)
    };

    Object.keys(fields).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      setIsSubmitted(true);
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 2000);
  };

  const handleRateChange = (index: number, value: string) => {
    const updated = [...products]
    updated[index].rate = value
    setProducts(updated)
  }

  const handleRemarksChange = (index: number, value: string) => {
    const updated = [...products]
    updated[index].remarks = value
    setProducts(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-none shadow-lg px-8 pt-10 pb-12">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white bg-[#32a34a] py-2">
            Botivate Services LLP
          </h1>
          <p className="mt-3 text-sm text-gray-700">
            Raipur (C.G)
          </p>
          <p className="text-sm text-gray-700 mb-6">
            Phone No - 91 9993023243
          </p>

          <h2 className="text-xl font-semibold text-green-700">
            Update Your Rate Below
          </h2>
        </div>

        {/* Vendor name bar */}
        <div className="mb-8">
          <div className="flex justify-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Vendor Name:
            </span>
          </div>
          <div className="max-w-xl mx-auto border border-gray-300 rounded-sm py-2 px-4 text-center text-sm font-medium text-gray-800">
            {vendorName}
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-10">
          {products.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">
                No products found in this quotation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-400 text-sm">
                <thead>
                  <tr className="bg-[#f5f5f5] text-xs">
                    <th className="border border-gray-400 px-3 py-2 text-left">
                      Internal Code
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left">
                      Product Name
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-center">
                      Qty
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-center">
                      UOM
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left">
                      Specifications
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left">
                      Remarks
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-center">
                      Payment Term
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-center">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">
                        {product.internalCode}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {product.productName}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {product.qty}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {product.uom}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        {product.specifications}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          placeholder="Enter Remarks"
                          value={product.remarks}
                          onChange={(e) =>
                            handleRemarksChange(index, e.target.value)
                          }
                          className="w-full text-xs rounded-none border border-gray-300"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <select
                          value={product.paymentTerm}
                          onChange={(e) =>
                            handlePaymentTermChange(index, e.target.value)
                          }
                          className="w-full text-xs border border-gray-300 rounded-none px-2 py-1"
                        >
                          <option value="">Select</option>
                          <option value="Credit">Credit</option>
                          <option value="Advance">Advance</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Enter Rate"
                          value={product.rate}
                          onChange={(e) =>
                            handleRateChange(index, e.target.value)
                          }
                          className="w-full text-xs text-center font-medium rounded-none border border-gray-300"
                          step="0.01"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit Section */}
        {!isSubmitted ? (
          <div className="text-center mt-6">
            <Button
              onClick={handleSubmit}
              className="bg-[#32a34a] hover:bg-[#27863b] text-white px-16 py-2 text-base rounded-none"
              disabled={products.length === 0}
            >
              Submit
            </Button>
            {products.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                Cannot submit - No products available
              </p>
            )}
          </div>
        ) : (
          <div className="text-center p-10 bg-emerald-50/50 border border-emerald-100 mt-6 rounded-xl shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-[#32a34a] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#32a34a] mb-2">
              Submission Successful!
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Thank you for providing your rates. Your quotation has been updated in our records.
            </p>

            <div className="bg-white border border-gray-100 p-6 rounded-lg max-w-md mx-auto text-left shadow-sm mb-8">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Quotation No:</span>
                  <span className="font-semibold text-gray-800">{quotationNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Vendor:</span>
                  <span className="font-semibold text-gray-800">{vendorName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-semibold text-gray-800">{products.length} Items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted at:</span>
                  <span className="text-gray-600 font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.close()}
              className="bg-[#32a34a] hover:bg-[#27863b] text-white px-8 py-2 rounded-lg"
            >
              Close Window
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-10 text-xs text-gray-500">
          Powered By <span className="text-green-600 font-semibold">Botivate</span>
        </div>
      </div>
    </div>

  )
}
