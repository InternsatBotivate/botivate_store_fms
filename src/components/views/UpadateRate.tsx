"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductRow {
  internalCode: string
  productName: string
  qty: number
  uom: string
  specifications: string
  remarks: string
  rate: string
}

interface FormData {
  headings: string[]
  data: (string | number)[][]
}

export default function RateFormPage() {
  const [vendorName, setVendorName] = useState("Botivate Services LLP")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  // Mock data - replace with actual API call
  useEffect(() => {
    // Simulating the getPrefilledData function
    const mockData: FormData = {
      headings: ["Internal Code", "Product Name", "Qty", "UOM", "Specifications", "Remarks"],
      data: [
        ["SI-243", "PIPE PUMP 3, 11 KW", 1, "NOS", "3136116412", ""],
        ["SI-244", "COUPLING", 3, "NOS", "3136702913", ""],
        ["SI-245", "PACKING", 1, "NOS", "3136116845", ""],
        ["SI-246", "CONNECTOR", 1, "NOS", "3136700728", ""],
      ],
    }

    const formattedProducts: ProductRow[] = mockData.data.map((row) => ({
      internalCode: row[0] as string,
      productName: row[1] as string,
      qty: row[2] as number,
      uom: row[3] as string,
      specifications: row[4] as string,
      remarks: row[5] as string,
      rate: "",
    }))

    setProducts(formattedProducts)
  }, [])

  const handleRateChange = (index: number, value: string) => {
    const updatedProducts = [...products]
    updatedProducts[index].rate = value
    setProducts(updatedProducts)
  }

  const handleSubmit = async () => {
    // Prepare form data
    const formData = products.map((product) => ({
      internalCode: product.internalCode,
      productName: product.productName,
      qty: product.qty,
      uom: product.uom,
      specifications: product.specifications,
      remarks: product.remarks,
      rate: product.rate,
    }))

    console.log("[v0] Submitting form data:", { vendorName, formData })

    // Simulate API call - replace with actual API endpoint
    try {
      // const response = await fetch('/api/submit-rates', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ vendorName, products: formData })
      // })
      // const result = await response.json()

      // Mock success response
      setTimeout(() => {
        setConfirmationMessage("Your rates have been successfully submitted! Thank you.")
        setIsSubmitted(true)
      }, 500)
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      setConfirmationMessage("An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-green-600 text-white text-center py-4 px-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold">Jay Jagannath Steel & Power Limited</h1>
        </div>

        {/* Company Details */}
        <div className="text-center mb-6">
          <p className="text-gray-700">N-2, Civil Township, Rourkela -769004</p>
          <p className="text-gray-700">Phone No - 919437961872</p>
        </div>

        {/* Update Rate Section */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-green-600">Update Your Rate Below</h2>
        </div>

        {!isSubmitted ? (
          <>
            {/* Vendor Name */}
            <div className="mb-8">
              <label className="block text-center font-bold mb-3 text-gray-700">Vendor Name:</label>
              <Input
                type="text"
                value={vendorName}
                readOnly
                className="max-w-md mx-auto text-center font-bold border-2 border-gray-300"
              />
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-center">Internal Code</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Product Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Qty</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">UOM</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Specifications</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Remarks</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.internalCode}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.productName}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.qty}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.uom}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.specifications}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{product.remarks}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <Input
                            type="number"
                            placeholder="Enter Rate"
                            value={product.rate}
                            onChange={(e) => handleRateChange(index, e.target.value)}
                            className="w-full text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center mb-8">
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-32 py-6 text-lg rounded-lg transition-all hover:scale-105"
              >
                Submit
              </Button>
            </div>
          </>
        ) : (
          /* Confirmation Message */
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
            <p className="text-xl text-gray-700">{confirmationMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-600">
          Powered By{" "}
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-bold hover:text-green-700"
          >
            Botivate
          </a>
        </div>
      </div>
    </div>
  )
}
