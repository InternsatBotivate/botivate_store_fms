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

  // URL params se data lo
  useEffect(() => {
    console.log("🔍 Parsing URL parameters...");
    
    const urlParams = new URLSearchParams(window.location.search);
    const quotation = urlParams.get('quotation') || "";
    const supplier = urlParams.get('supplier') || "";
    const itemsParam = urlParams.get('items') || "";
    
    console.log("📋 Raw parameters:", { quotation, supplier, itemsParam });
    
    if (!quotation || !supplier) {
      console.error("❌ Missing quotation or supplier");
      alert("Invalid link: Missing quotation or supplier");
      setLoading(false);
      return;
    }
    
    setQuotationNumber(quotation);
    setVendorName(supplier);
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



 // Change handlePaymentTermChange to accept event directly:
const handlePaymentTermChange = (index: number, value: string) => {
  const updated = [...products]
  updated[index].paymentTerm = value
  setProducts(updated)
}

  const handleSubmit = () => {

   
    const emptyRates = products.filter(p => !p.rate || p.rate.trim() === "");
    if (emptyRates.length > 0) {
      alert(`Please fill rates for ${emptyRates.length} items`);
      return;
    }
    
    const APPS_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;
    
    const updateData = products.map(product => ({
      internalCode: product.internalCode.trim(),
      rate: product.rate,
      remarks: product.remarks || "",
      paymentTerm: product.paymentTerm || ""
    }));
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = APPS_SCRIPT_URL;
    form.target = 'hidden-iframe';
    
    const iframe = document.createElement('iframe');
    iframe.name = 'hidden-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const fields = {
      action: 'updateExistingRows',
      supplierName: vendorName,
      paymentTerm: paymentTerm,
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
        <div className="text-center p-8 bg-green-50 border border-green-200 mt-6">
          <h2 className="text-xl font-bold text-green-700 mb-3">
            Thank You!
          </h2>
          <p className="text-sm mb-4">
            Your rates have been submitted successfully.
          </p>
  
          <div className="bg-white border border-gray-200 p-4 max-w-md mx-auto text-left text-sm">
            <p>
              <span className="font-semibold">Quotation:</span>{" "}
              {quotationNumber}
            </p>
            <p>
              <span className="font-semibold">Vendor:</span> {vendorName}
            </p>
            <p>
              <span className="font-semibold">Items Submitted:</span>{" "}
              {products.length}
            </p>
            <p>
              <span className="font-semibold">Time:</span>{" "}
              {new Date().toLocaleString()}
            </p>
          </div>
  
          <Button
            onClick={() => window.close()}
            variant="outline"
            className="mt-4 rounded-none"
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