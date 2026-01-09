import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import { ClipboardList, TrendingDown, Award } from 'lucide-react';
import Heading from '../element/Heading';

interface VendorComparison {
    productName: string;
    internalCode: string;
    qty: string;
    uom: string;
    specifications: string;
    vendors: {
        name: string;
        rate: number;
        paymentTerm: string;
        remarks: string;
    }[];
}

export default function ComparisonPage() {
    const { quotationHistorySheet, quotationHistoryLoading } = useSheets();
    const [comparisons, setComparisons] = useState<VendorComparison[]>([]);

    useEffect(() => {
        if (quotationHistorySheet && quotationHistorySheet.length > 0) {
            // Group data by product
            const grouped: { [key: string]: VendorComparison } = {};

            quotationHistorySheet.forEach((row: any) => {
                const key = row.internalCode || row.productName;

                if (!grouped[key]) {
                    grouped[key] = {
                        productName: row.productName || '',
                        internalCode: row.internalCode || '',
                        qty: row.qty || '',
                        uom: row.uom || '',
                        specifications: row.specifications || '',
                        vendors: []
                    };
                }

                // Extract vendor data from dynamic columns
                Object.keys(row).forEach(colKey => {
                    const vendorMatch = colKey.match(/vendor(\d+)Name/i);
                    if (vendorMatch) {
                        const vendorNum = vendorMatch[1];
                        const vendorName = row[colKey];
                        const rate = parseFloat(row[`rate${vendorNum}`] || '0');
                        const paymentTerm = row[`paymentTerm${vendorNum}`] || '';
                        const remarks = row[`remarks${vendorNum}`] || '';

                        if (vendorName && rate > 0) {
                            grouped[key].vendors.push({
                                name: vendorName,
                                rate,
                                paymentTerm,
                                remarks
                            });
                        }
                    }
                });
            });

            setComparisons(Object.values(grouped).filter(c => c.vendors.length > 0));
        }
    }, [quotationHistorySheet]);

    const getBestVendor = (vendors: VendorComparison['vendors']) => {
        if (vendors.length === 0) return null;
        return vendors.reduce((best, current) =>
            current.rate < best.rate ? current : best
        );
    };

    const getTotalCost = (vendor: { rate: number }, qty: string) => {
        const quantity = parseFloat(qty) || 0;
        return vendor.rate * quantity;
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <Heading
                heading="Vendor Price Comparison"
                subtext="Compare quotations from multiple vendors to identify the most suitable option"
            >
                <ClipboardList size={50} className="text-[#32a34a] transition-transform hover:scale-110" />
            </Heading>

            <div className="flex-1 overflow-auto p-6">
                {quotationHistoryLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32a34a]"></div>
                        <p className="mt-4 text-gray-600 animate-pulse">Loading comparison data...</p>
                    </div>
                ) : comparisons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <ClipboardList size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 font-semibold text-lg">No quotations available for comparison</p>
                        <p className="text-gray-400 text-sm mt-2">Send quotations to vendors to see comparisons here</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {comparisons.map((comparison, idx) => {
                            const bestVendor = getBestVendor(comparison.vendors);
                            const sortedVendors = [...comparison.vendors].sort((a, b) => a.rate - b.rate);

                            return (
                                <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                    {/* Product Header */}
                                    <div className="bg-gradient-to-r from-[#32a34a] to-[#27863b] text-white p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold mb-2">{comparison.productName}</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm opacity-90">
                                                    <div>
                                                        <span className="font-semibold">Code:</span> {comparison.internalCode}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Quantity:</span> {comparison.qty} {comparison.uom}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="font-semibold">Specifications:</span> {comparison.specifications || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Comparison Table */}
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingDown className="text-[#32a34a]" size={20} />
                                            <h4 className="font-semibold text-gray-700">Price Comparison</h4>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                                                        <th className="text-left p-3 font-semibold text-gray-700">Vendor</th>
                                                        <th className="text-center p-3 font-semibold text-gray-700">Quantity</th>
                                                        <th className="text-right p-3 font-semibold text-gray-700">Price ($)</th>
                                                        <th className="text-right p-3 font-semibold text-gray-700">Total Cost ($)</th>
                                                        <th className="text-center p-3 font-semibold text-gray-700">Payment Term</th>
                                                        <th className="text-left p-3 font-semibold text-gray-700">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedVendors.map((vendor, vIdx) => {
                                                        const isBest = vendor.name === bestVendor?.name;
                                                        const totalCost = getTotalCost(vendor, comparison.qty);

                                                        return (
                                                            <tr
                                                                key={vIdx}
                                                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isBest ? 'bg-green-50' : ''
                                                                    }`}
                                                            >
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-medium ${isBest ? 'text-[#32a34a]' : 'text-gray-700'}`}>
                                                                            {vendor.name}
                                                                        </span>
                                                                        {isBest && (
                                                                            <Award className="text-[#32a34a]" size={16} />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-center text-gray-600">
                                                                    {comparison.qty}
                                                                </td>
                                                                <td className={`p-3 text-right font-semibold ${isBest ? 'text-[#32a34a]' : 'text-gray-700'
                                                                    }`}>
                                                                    ${vendor.rate.toFixed(2)}
                                                                </td>
                                                                <td className={`p-3 text-right font-bold ${isBest ? 'text-[#32a34a]' : 'text-gray-700'
                                                                    }`}>
                                                                    ${totalCost.toFixed(2)}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${vendor.paymentTerm.toLowerCase() === 'advance'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-orange-100 text-orange-700'
                                                                        }`}>
                                                                        {vendor.paymentTerm || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-gray-600 text-sm">
                                                                    {vendor.remarks || '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Best Option Summary */}
                                        {bestVendor && (
                                            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-[#32a34a] rounded-r-lg">
                                                <div className="flex items-center gap-3">
                                                    <Award className="text-[#32a34a]" size={24} />
                                                    <div>
                                                        <p className="text-sm text-gray-600 font-medium">Most Suitable Option</p>
                                                        <p className="text-lg font-bold text-[#32a34a]">
                                                            {bestVendor.name} - ${getTotalCost(bestVendor, comparison.qty).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Based on lowest total cost
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
