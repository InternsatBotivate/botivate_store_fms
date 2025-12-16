


// import { ChevronsRightLeft, FilePlus2, Pencil, Save, Trash } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { Input } from '../ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { z } from 'zod';
// import { Button } from '../ui/button';
// import { SidebarTrigger } from '../ui/sidebar';
// import { useFieldArray, useForm, type Control, type FieldValues } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
// import type { PoMasterSheet, QuotationHistorySheet } from '@/types';
// import { postToSheet, uploadFile, fetchSheet } from '@/lib/fetchers';
// import { useEffect, useMemo, useState } from 'react';
// import { useSheets } from '@/context/SheetsContext';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { cn, formatDate } from '@/lib/utils';
// import { toast } from 'sonner';
// import { ClipLoader as Loader } from 'react-spinners';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Textarea } from '../ui/textarea';
// import { pdf } from '@react-pdf/renderer';
// import POPdf, { type POPdfProps } from '../element/QuotationPdf';
// import { Checkbox } from '../ui/checkbox';


// type Mode = 'create' | 'revise';


// interface SupplierInfo {
//   name: string;
//   address: string;
//   gstin: string;
//   email?: string;
// }


// // MASTER Sheet interface for suppliers
// interface MasterSheetSupplier {
//   supplierName: string;      // Column A
//   vendorGstin: string;       // Column B  
//   vendorAddress: string;     // Column C
//   email?: string;
// }


// function filterUniqueQuotationNumbers(data: PoMasterSheet[]): string[] {
//   const seen = new Set<string>();
//   const result: string[] = [];
//   for (const row of data) {
//     // Convert to string first, then trim
//     const q = row.quotationNumber ? String(row.quotationNumber).trim() : '';
//     if (q && !seen.has(q)) {
//       seen.add(q);
//       result.push(q);
//     }
//   }
//   return result;
// }


// // Generate next quotation number based on existing numbers
// function generateNextQuotationNumber(existingNumbers: string[]): string {
//   const numbers = existingNumbers
//     .map(num => {
//       const match = num.match(/QT-(\d+)/);
//       return match ? parseInt(match[1]) : 0;
//     })
//     .filter(num => num > 0);
  
//   const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
//   return `QT-${String(maxNumber + 1).padStart(3, '0')}`;
// }


// // Updated schema - removed mandatory validations
// const quotationSchema = z.object({
//   quotationNumber: z.string().optional().default(''),
//   quotationDate: z.coerce.date().optional().default(new Date()),
//   suppliers: z.array(z.string()).optional().default([]),
//   description: z.string().optional().default(''),
//   selectedIndents: z.array(z.string()).optional().default([]),
//   terms: z.array(z.string()).optional().default([]),
// });


// type QuotationForm = z.infer<typeof quotationSchema>;


// // Simple Badge component as replacement
// const Badge = ({ children, variant, className, onClick }: { 
//   children: React.ReactNode; 
//   variant?: string; 
//   className?: string;
//   onClick?: () => void;
// }) => (
//   <span 
//     className={cn(
//       "inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border",
//       className
//     )}
//     onClick={onClick}
//   >
//     {children}
//   </span>
// );


// export default function QuotationPage() {
//   const { indentSheet, poMasterSheet, updateIndentSheet, updatePoMasterSheet, masterSheet: details } = useSheets();
//   const [mode, setMode] = useState<Mode>('create');
//   const [selectedItems, setSelectedItems] = useState<string[]>([]);
//   const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
//   const [supplierInfos, setSupplierInfos] = useState<SupplierInfo[]>([]);
//   const [masterSuppliers, setMasterSuppliers] = useState<MasterSheetSupplier[]>([]);
//   const [latestQuotationNumbers, setLatestQuotationNumbers] = useState<string[]>([]);


//   // Editable cards: make Billing and Destination editable (last two cards)
//   const [isEditingBilling, setIsEditingBilling] = useState(false);
//   const [billingAddress, setBillingAddress] = useState('');
//   const [isEditingDestination, setIsEditingDestination] = useState(false);
//   const [destinationAddress, setDestinationAddress] = useState('');


//   useEffect(() => {
//     if (details) {
//       setBillingAddress(details.billingAddress || '');
//       setDestinationAddress(details.destinationAddress || '');
//     }
//   }, [details]);


//   // Fetch latest quotation numbers from Quotation sheet
//   useEffect(() => {
//     const fetchLatestQuotationNumbers = async () => {
//       try {
//         const quotationHistory = await fetchSheet('Quotation');
//         console.log('Fetched Quotation:', quotationHistory);
        
//         if (Array.isArray(quotationHistory)) {
//           const quotationNos = quotationHistory
//             .map((row: any) => row.quatationNo || row.quotationNo || '')
//             .filter((no: string) => no && no.trim() !== '');
          
//           setLatestQuotationNumbers(quotationNos);
//           console.log('Latest quotation numbers:', quotationNos);
//         }
//       } catch (error) {
//         console.error('Error fetching quotation numbers:', error);
//       }
//     };

//     fetchLatestQuotationNumbers();
//   }, []);


//   // Fetch suppliers from MASTER sheet using existing fetchSheet function
//   useEffect(() => {
//     function hasVendors(data: any): data is { vendors: any[] } {
//       return data && typeof data === 'object' && 'vendors' in data;
//     }
    
//     const fetchMasterSuppliers = async () => {
//       try {
//         console.log('Fetching MASTER sheet data...');
        
//         const masterData = await fetchSheet('MASTER');
        
//         console.log('MASTER sheet raw data:', masterData);
        
//         // Use type guard to safely access vendors
//         let vendorsArray: any[] = [];
        
//         if (hasVendors(masterData)) {
//           vendorsArray = masterData.vendors || [];
//         } else if (Array.isArray(masterData)) {
//           vendorsArray = masterData;
//         }
        
//         const suppliers: MasterSheetSupplier[] = vendorsArray
//           .map((vendor: any) => ({
//             supplierName: vendor.vendorName || vendor.supplierName || '',
//             vendorGstin: vendor.gstin || vendor.vendorGstin || '',
//             vendorAddress: vendor.address || vendor.vendorAddress || '',
//             email: vendor.email || ''
//           }))
//           .filter(supplier => {
//             const name = supplier.supplierName;
//             return name && typeof name === 'string' && name.trim() !== '';
//           });
        
//         console.log('Processed suppliers:', suppliers);
//         setMasterSuppliers(suppliers);
        
//         if (suppliers.length === 0) {
//           console.warn('No suppliers found in MASTER sheet');
//           toast.warning('No suppliers found in MASTER sheet');
//         } else {
//           console.log(`Successfully loaded ${suppliers.length} suppliers from MASTER sheet`);
//           toast.success(`Loaded ${suppliers.length} suppliers`);
//         }
        
//       } catch (error) {
//         console.error('Error fetching MASTER sheet suppliers:', error);
//         toast.error('Failed to load suppliers from MASTER sheet');
//       }
//     };

//     fetchMasterSuppliers();
//   }, [details]);


//   // Filter eligible items - planned2 NOT NULL and actual2 NULL
//   const eligibleItems = useMemo(() => {
//     console.log('Total indentSheet items:', indentSheet.length);
    
//     const filtered = indentSheet.filter(item => {
//       const planned2NotNull = item.planned2 !== null && item.planned2 !== undefined && item.planned2 !== '';
//       const actual2IsNull = item.actual2 === null || item.actual2 === undefined || item.actual2 === '';
      
//       return planned2NotNull && actual2IsNull;
//     }).reverse();
    
//     console.log('Filtered eligible items:', filtered.length);
//     return filtered;
//   }, [indentSheet]);


//   const form = useForm<QuotationForm>({
//     resolver: zodResolver(quotationSchema),
//     defaultValues: {
//       quotationNumber: '',
//       quotationDate: new Date(),
//       suppliers: [],
//       description: '',
//       selectedIndents: [],
//       terms: details?.defaultTerms || [],
//     },
//   });


//   useEffect(() => {
//     if (details?.defaultTerms) {
//       form.setValue('terms', details.defaultTerms);
//     }
//   }, [details]);


//   // Auto-generate quotation number in create mode - FIXED
//   useEffect(() => {
//     if (mode === 'create') {
//       // Combine both sources of quotation numbers
//       const allNumbers = [...filterUniqueQuotationNumbers(poMasterSheet), ...latestQuotationNumbers];
//       const nextNumber = generateNextQuotationNumber(allNumbers);
//       form.setValue('quotationNumber', nextNumber);
//       console.log('Generated next quotation number:', nextNumber);
//     }
//   }, [mode, poMasterSheet, latestQuotationNumbers, form]);


//   // Handle multiple supplier selection from MASTER sheet
//   const handleSupplierSelect = (supplierName: string) => {
//     setSelectedSuppliers(prev => {
//       const newSuppliers = prev.includes(supplierName) 
//         ? prev.filter(s => s !== supplierName)
//         : [...prev, supplierName];
      
//       form.setValue('suppliers', newSuppliers);
      
//       // Fetch supplier info from MASTER sheet data
//       const infos = newSuppliers.map(name => {
//         const masterSupplier = masterSuppliers.find(s => s.supplierName === name);
//         return {
//           name,
//           address: masterSupplier?.vendorAddress || '',
//           gstin: masterSupplier?.vendorGstin || '',
//           email: masterSupplier?.email || ''
//         };
//       });
//       setSupplierInfos(infos);
      
//       console.log('Selected suppliers info:', infos);
      
//       return newSuppliers;
//     });
//   };


//   // Handle checkbox selection
//   const handleItemSelection = (indentNumber: string, checked: boolean) => {
//     setSelectedItems(prev => {
//       if (checked) {
//         return [...prev, indentNumber];
//       } else {
//         return prev.filter(item => item !== indentNumber);
//       }
//     });
//   };


//   // Handle select all checkbox
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       const allIndentNumbers = eligibleItems.map(item => item.indentNumber);
//       setSelectedItems(allIndentNumbers);
//     } else {
//       setSelectedItems([]);
//     }
//   };


//   // Update form when selectedItems changes
//   useEffect(() => {
//     form.setValue('selectedIndents', selectedItems);
//   }, [selectedItems, form]);


//   // Fixed TypeScript error for useFieldArray
//   const termsArray = useFieldArray({
//     control: form.control as Control<FieldValues>,
//     name: 'terms',
//   });


//   async function onSubmit(values: QuotationForm) {
//     try {
//       if (selectedItems.length === 0) {
//         toast.error('Please select at least one item');
//         return;
//       }

//       if (selectedSuppliers.length === 0) {
//         toast.error('Please select at least one supplier');
//         return;
//       }

//       const selectedItemsData = eligibleItems.filter(item => 
//         selectedItems.includes(item.indentNumber)
//       );

//       const logoResponse = await fetch('/logo.png');
//       const logoBlob = await logoResponse.blob();
//       const logoBase64 = await new Promise<string>((resolve) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result as string);
//         reader.readAsDataURL(logoBlob);
//       });

//       const allQuotationRows: QuotationHistorySheet[] = [];

//       // Get all existing quotation numbers to generate unique ones - FIXED
//       const allNumbers = [...filterUniqueQuotationNumbers(poMasterSheet), ...latestQuotationNumbers];
//       let currentMaxNumber = allNumbers
//         .map(num => {
//           const match = num.match(/QT-(\d+)/);
//           return match ? parseInt(match[1]) : 0;
//         })
//         .filter(num => num > 0)
//         .reduce((max, num) => Math.max(max, num), 0);

//       for (let i = 0; i < supplierInfos.length; i++) {
//         const supplierInfo = supplierInfos[i];
        
//         // Generate unique quotation number for each supplier
//         currentMaxNumber += 1;
//         const uniqueQuotationNumber = `QT-${String(currentMaxNumber).padStart(3, '0')}`;

//         const pdfProps: POPdfProps = {
//           companyName: details?.companyName || '',
//           companyPhone: details?.companyPhone || '',
//           companyGstin: details?.companyGstin || '',
//           companyPan: details?.companyPan || '',
//           companyAddress: details?.companyAddress || '',
//           billingAddress: billingAddress,
//           destinationAddress: destinationAddress,
//           supplierName: supplierInfo.name,
//           supplierAddress: supplierInfo.address,
//           supplierGstin: supplierInfo.gstin,
//           orderNumber: uniqueQuotationNumber,
//           orderDate: formatDate(values.quotationDate || new Date()),
//           quotationNumber: uniqueQuotationNumber,
//           quotationDate: formatDate(values.quotationDate || new Date()),
//           enqNo: '',
//           enqDate: '',
//           description: values.description || '',
//           items: selectedItemsData.map(item => ({
//             internalCode: item.indentNumber,
//             product: item.productName,
//             description: item.specifications,
//             quantity: item.quantity,
//             unit: item.uom,
//             rate: 0,
//             gst: 0,
//             discount: 0,
//             amount: 0,
//           })),
//           total: 0,
//           gstAmount: 0,
//           grandTotal: 0,
//           terms: values.terms || [],
//           preparedBy: '',
//           approvedBy: '',
//         };

//         const blob = await pdf(<POPdf {...pdfProps} />).toBlob();
//         const file = new File([blob], `QUOTATION-${uniqueQuotationNumber}-${supplierInfo.name}.pdf`, { type: 'application/pdf' });

//         if (!supplierInfo.email) {
//           toast.error(`Email not found for ${supplierInfo.name}!`);
//           continue;
//         }
        
//         const pdfUrl = await uploadFile(
//           file,
//           import.meta.env.VITE_PURCHASE_ORDERS_FOLDER,
//           'email',
//           supplierInfo.email
//         );

//         // Type-safe mapping to QuotationHistorySheet
//         const quotationHistoryRows: QuotationHistorySheet[] = selectedItemsData.map(item => ({
//           timestamp: (values.quotationDate || new Date()).toISOString(),
//           quatationNo: uniqueQuotationNumber,
//           supplierName: supplierInfo.name,
//           adreess: supplierInfo.address,
//           gst: supplierInfo.gstin,
//           indentNo: item.indentNumber,
//           product: item.productName,
//           description: item.specifications || '',
//           qty: String(item.quantity || ''),
//           unit: item.uom || '',
//           pdfLink: pdfUrl,
//         }));

//         allQuotationRows.push(...quotationHistoryRows);
//       }

//       console.log('Submitting to Quotation:', allQuotationRows);
//       console.log('Total rows:', allQuotationRows.length);
//       console.log('First row:', allQuotationRows[0]);
      
//       await postToSheet(allQuotationRows, 'insert', 'Quotation');
      
//       toast.success(`Successfully created ${selectedSuppliers.length} unique quotation(s) for ${selectedSuppliers.length} supplier(s)`);
//       form.reset();
//       setSelectedItems([]);
//       setSelectedSuppliers([]);
//       setSupplierInfos([]);
      
//       setTimeout(() => {
//         updatePoMasterSheet();
//         updateIndentSheet();
//       }, 1000);
//     } catch (e) {
//       console.error('Submit error:', e);
//       toast.error('Failed to create quotation: ' + (e as Error).message);
//     }
//   }

//   function onError(e: any) {
//     console.log('Form errors:', e);
//     toast.error('Please check the form');
//   }

//   // Simple inline edit controls
//   const EditIconButton = ({ editing, onClick }: { editing: boolean; onClick: () => void }) => (
//     <Button type="button" variant="ghost" size="sm" onClick={onClick} className="h-6 w-6 p-0 hover:bg-gray-200">
//       {editing ? <Save size={14} className="text-green-600" /> : <Pencil size={14} className="text-gray-600" />}
//     </Button>
//   );

//   const quotationNumbers = useMemo(() => filterUniqueQuotationNumbers(poMasterSheet), [poMasterSheet]);

//   return (
//     <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-blue-50 rounded-md flex flex-col">
//       <div className="flex justify-between p-5 w-full flex-shrink-0">
//         <div className="flex gap-2 items-center">
//           <FilePlus2 size={50} className="text-primary" />
//           <div>
//             <h1 className="text-2xl font-bold text-primary">Create or Revise Quotation</h1>
//             <p className="text-muted-foreground text-sm">Create a quotation from eligible indents or revise an existing one</p>
//           </div>
//         </div>
//         <SidebarTrigger />
//       </div>

//       <div className="flex-1 overflow-y-auto px-4 pb-4">
//         <div className="max-w-6xl w-full mx-auto">
//           <div className="w-full">
//             <Tabs defaultValue="create" onValueChange={(v) => setMode(v === 'create' ? 'create' as Mode : 'revise' as Mode)}>
//               <TabsList className="h-10 w-full rounded-none">
//                 <TabsTrigger value="create">Create</TabsTrigger>
//                 <TabsTrigger value="revise">Revise</TabsTrigger>
//               </TabsList>
//             </Tabs>
//           </div>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex flex-col items-center">
//               <div className="space-y-4 p-4 w-full bg-white shadow-md rounded-sm mt-4">
//                 <div className="flex items-center justify-center gap-4 bg-blue-50 p-4 rounded">
//                   <img src="/logo.png" alt="Company Logo" className="w-20 h-20 object-contain" />
//                   <div className="text-center">
//                     <h1 className="text-2xl font-bold">{details?.companyName}</h1>
//                     <div>
//                       <p className="text-sm">{details?.companyAddress}</p>
//                       <p className="text-sm">Phone No: +{details?.companyPhone}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <hr />
//                 <h2 className="text-center font-bold text-lg">Quotation</h2>
//                 <hr />

//                 {/* Quotation meta */}
//                 <div className="grid gap-5 px-4 py-2 text-foreground/80">
//                   {/* Multi-Supplier Selection from MASTER sheet */}
//                   <div className="space-y-3">
//                     <FormField
//                       control={form.control}
//                       name="suppliers"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Suppliers (From MASTER Sheet)</FormLabel>
//                           <FormControl>
//                             <div className="space-y-2">
//                               <Select onValueChange={handleSupplierSelect}>
//                                 <SelectTrigger size="sm" className="w-full">
//                                   <SelectValue placeholder="Select suppliers from MASTER sheet" />
//                                 </SelectTrigger>
//                                 <SelectContent className="z-[100] max-h-[300px]">
//                                   {masterSuppliers.length === 0 ? (
//                                     <SelectItem value="no-suppliers" disabled>
//                                       No suppliers found in MASTER sheet
//                                     </SelectItem>
//                                   ) : (
//                                     masterSuppliers.map((supplier, k) => (
//                                       <SelectItem key={k} value={supplier.supplierName}>
//                                         {supplier.supplierName}
//                                       </SelectItem>
//                                     ))
//                                   )}
//                                 </SelectContent>
//                               </Select>
                              
//                               {/* Selected suppliers badges */}
//                               {selectedSuppliers.length > 0 && (
//                                 <div className="flex flex-wrap gap-2 mt-2">
//                                   {selectedSuppliers.map((supplier, index) => (
//                                     <Badge key={index} variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200">
//                                       {supplier}
//                                       <button
//                                         type="button"
//                                         onClick={() => handleSupplierSelect(supplier)}
//                                         className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
//                                       >
//                                         ×
//                                       </button>
//                                     </Badge>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>
//                           </FormControl>
//                         </FormItem>
//                       )}
//                     />

//                     {/* Display supplier details from MASTER sheet */}
//                     {supplierInfos.length > 0 && (
//                       <div className="space-y-2">
//                         <h4 className="font-medium">Selected Supplier Details (From MASTER Sheet):</h4>
//                         {supplierInfos.map((supplier, index) => (
//                           <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
//                             <div className="grid grid-cols-3 gap-x-4">
//                               <div>
//                                 <span className="font-medium">Name:</span> {supplier.name}
//                               </div>
//                               <div>
//                                 <span className="font-medium">Address:</span> {supplier.address}
//                               </div>
//                               <div>
//                                 <span className="font-medium">GSTIN:</span> {supplier.gstin}
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Cards */}
//                 <div className="grid md:grid-cols-3 gap-3">
//                   <Card className="p-0 gap-0 shadow-xs rounded-[3px]">
//                     <CardHeader className="bg-muted px-5 py-2">
//                       <CardTitle className="text-center">Our Commercial Details</CardTitle>
//                     </CardHeader>
//                     <CardContent className="p-5 text-sm">
//                       <p>
//                         <span className="font-medium">GSTIN</span> {details?.companyGstin}
//                       </p>
//                       <p>
//                         <span className="font-medium">Pan No.</span> {details?.companyPan}
//                       </p>
//                     </CardContent>
//                   </Card>

//                   <Card className="p-0 gap-0 shadow-xs rounded-[3px]">
//                     <CardHeader className="bg-muted px-5 py-2">
//                       <CardTitle className="text-center flex items-center justify-between">
//                         Billing Address
//                         <EditIconButton
//                           editing={isEditingBilling}
//                           onClick={() => {
//                             if (isEditingBilling) toast.success('Billing address updated');
//                             setIsEditingBilling(!isEditingBilling);
//                           }}
//                         />
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="p-5 text-sm">
//                       <p>M/S {details?.companyName}</p>
//                       {isEditingBilling ? (
//                         <div className="flex items-center gap-2 mt-1">
//                           <Input
//                             value={billingAddress}
//                             onChange={(e) => setBillingAddress(e.target.value)}
//                             className="h-7 text-sm"
//                             placeholder="Enter billing address"
//                             onKeyDown={(e) => {
//                               if (e.key === 'Enter') {
//                                 setIsEditingBilling(false);
//                                 toast.success('Billing address updated');
//                               }
//                             }}
//                             autoFocus
//                           />
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => setIsEditingBilling(false)}
//                             className="h-6 w-6 p-0 hover:bg-red-100"
//                           >
//                             <Trash size={12} className="text-red-500" />
//                           </Button>
//                         </div>
//                       ) : (
//                         <p>{billingAddress}</p>
//                       )}
//                     </CardContent>
//                   </Card>

//                   <Card className="p-0 gap-0 shadow-xs rounded-[3px]">
//                     <CardHeader className="bg-muted px-5 py-2">
//                       <CardTitle className="text-center flex items-center justify-between">
//                         Destination Address
//                         <EditIconButton
//                           editing={isEditingDestination}
//                           onClick={() => {
//                             if (isEditingDestination) toast.success('Destination address updated');
//                             setIsEditingDestination(!isEditingDestination);
//                           }}
//                         />
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="p-5 text-sm">
//                       <p>M/S {details?.companyName}</p>
//                       {isEditingDestination ? (
//                         <div className="flex items-center gap-2 mt-1">
//                           <Input
//                             value={destinationAddress}
//                             onChange={(e) => setDestinationAddress(e.target.value)}
//                             className="h-7 text-sm"
//                             placeholder="Enter destination address"
//                             onKeyDown={(e) => {
//                               if (e.key === 'Enter') {
//                                 setIsEditingDestination(false);
//                                 toast.success('Destination address updated');
//                               }
//                             }}
//                             autoFocus
//                           />
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => setIsEditingDestination(false)}
//                             className="h-6 w-6 p-0 hover:bg-red-100"
//                           >
//                             <Trash size={12} className="text-red-500" />
//                           </Button>
//                         </div>
//                       ) : (
//                         <p>{destinationAddress}</p>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 <hr />

//                 {/* Description */}
//                 <div>
//                   <FormField
//                     control={form.control}
//                     name="description"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Description</FormLabel>
//                         <FormControl>
//                           <Textarea placeholder="Enter message" className="resize-y" {...field} />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <hr />

//                 {/* Table with checkboxes and Unit column */}
//                 <div className="mx-4 grid">
//                   <div className="rounded-[3px] w-full min-w-full overflow-x-auto">
//                     <Table>
//                       <TableHeader className="bg-muted">
//                         <TableRow>
//                           <TableHead className="w-12">
//                             <Checkbox
//                               checked={selectedItems.length === eligibleItems.length && eligibleItems.length > 0}
//                               onCheckedChange={handleSelectAll}
//                             />
//                           </TableHead>
//                           <TableHead>S/N</TableHead>
//                           <TableHead>Internal Code</TableHead>
//                           <TableHead>Product</TableHead>
//                           <TableHead>Description</TableHead>
//                           <TableHead>Qty</TableHead>
//                           <TableHead>Unit</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {eligibleItems.length === 0 ? (
//                           <TableRow>
//                             <TableCell colSpan={7} className="text-center text-muted-foreground">
//                               No eligible items found (need planned2 NOT NULL and actual2 NULL)
//                             </TableCell>
//                           </TableRow>
//                         ) : (
//                           eligibleItems.map((item, index) => (
//                             <TableRow key={item.indentNumber}>
//                               <TableCell>
//                                 <Checkbox
//                                   checked={selectedItems.includes(item.indentNumber)}
//                                   onCheckedChange={(checked) => 
//                                     handleItemSelection(item.indentNumber, checked as boolean)
//                                   }
//                                 />
//                               </TableCell>
//                               <TableCell>{index + 1}</TableCell>
//                               <TableCell>{item.indentNumber}</TableCell>
//                               <TableCell>{item.productName}</TableCell>
//                               <TableCell>{item.specifications || <span className="text-muted-foreground">No Description</span>}</TableCell>
//                               <TableCell>{item.quantity}</TableCell>
//                               <TableCell>{item.uom}</TableCell>
//                             </TableRow>
//                           ))
//                         )}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3 p-3 w-full max-w-6xl bg-background my-5 shadow-md rounded-md">
//                 <Button type="reset" variant="outline" onClick={() => {
//                   form.reset();
//                   setSelectedItems([]);
//                   setSelectedSuppliers([]);
//                   setSupplierInfos([]);
//                 }}>
//                   Reset
//                 </Button>

//                 <Button type="submit" disabled={form.formState.isSubmitting}>
//                   {form.formState.isSubmitting && <Loader size={20} color="white" aria-label="Loading Spinner" />}
//                   Save And Send Quotation
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </div>
//       </div>
//     </div>
//   );
// }

// src/pages/QuotationPage.tsx

import { FilePlus2, Pencil, Save, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, type Control, type FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

import { useSheets } from '@/context/SheetsContext';
import { postToSheet, fetchSheet } from '@/lib/fetchers';
import { cn } from '@/lib/utils';
import { ClipLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';

  import type { PoMasterSheet } from '@/types';
  import UpdateRate from './UpadateRate';


  type Mode = 'create' | 'revise';

  interface SupplierInfo {
    name: string;
    address: string;
    gstin: string;
    email?: string;
  }

  interface MasterSheetSupplier {
    supplierName: string;
    vendorGstin: string;
    vendorAddress: string;
    email?: string;
  }

  // Quotation Vendor sheet row (A–F)
  interface QuotationVendorSheetRow {
    internalCode: string;      // A
    productName: string;       // B
    quantity: string;          // C
    uom: string;               // D
    specifications: string;    // E
    vendorName: string;        // F
  }

  const quotationSchema = z.object({
    quotationNumber: z.string().optional().default(''),
    quotationDate: z.coerce.date().optional().default(new Date()),
    suppliers: z.array(z.string()).optional().default([]),
    description: z.string().optional().default(''),
    selectedIndents: z.array(z.string()).optional().default([]),
    terms: z.array(z.string()).optional().default([]),
  });

  type QuotationForm = z.infer<typeof quotationSchema>;

  // Small Badge component
  const Badge = ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border cursor-pointer hover:bg-gray-200',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );

  function filterUniqueQuotationNumbers(data: PoMasterSheet[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const row of data) {
      const q = row.quotationNumber ? String(row.quotationNumber).trim() : '';
      if (q && !seen.has(q)) {
        seen.add(q);
        result.push(q);
      }
    }
    return result;
  }

  function generateNextQuotationNumber(existingNumbers: string[]): string {
    const numbers = existingNumbers
      .map((num) => {
        const match = num.match(/QT-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `QT-${String(maxNumber + 1).padStart(3, '0')}`;
  }

  const EditIconButton = ({ editing, onClick }: { editing: boolean; onClick: () => void }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-6 w-6 p-0 hover:bg-gray-200"
    >
      {editing ? <Save size={14} className="text-green-600" /> : <Pencil size={14} className="text-gray-600" />}
    </Button>
  );

  export default function QuotationPage() {
    // Check if this is supplier rate update view
    const urlParams = new URLSearchParams(window.location.search);
    const quotationParam = urlParams.get('quotation');
    const supplierParam = urlParams.get('supplier');
    const isSupplierView = !!(quotationParam && supplierParam);

    const {
      indentSheet,
      poMasterSheet,
      updateIndentSheet,
      updatePoMasterSheet,
      masterSheet: details,
    } = useSheets();

    const [mode, setMode] = useState<Mode>('create');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [supplierInfos, setSupplierInfos] = useState<SupplierInfo[]>([]);
    const [masterSuppliers, setMasterSuppliers] = useState<MasterSheetSupplier[]>([]);
    const [latestQuotationNumbers, setLatestQuotationNumbers] = useState<string[]>([]);
    
    // NEW: Supplier view states
    const [supplierItems, setSupplierItems] = useState<any[]>([]);
    const [loadingSupplierData, setLoadingSupplierData] = useState(false);

    const [isEditingBilling, setIsEditingBilling] = useState(false);
    const [billingAddress, setBillingAddress] = useState('');
    const [isEditingDestination, setIsEditingDestination] = useState(false);
    const [destinationAddress, setDestinationAddress] = useState('');





    
    // Billing / destination default
    useEffect(() => {
      if (details) {
        setBillingAddress(details.billingAddress || '');
        setDestinationAddress(details.destinationAddress || '');
      }
    }, [details]);



    useEffect(() => {
      if (isSupplierView && quotationParam) {
        setLoadingSupplierData(true);
        fetchSheet('QUOTATION HISTORY')
          .then((data: any) => {
            if (Array.isArray(data)) {
              const items = data.filter((row: any) => 
                row.vendorName === supplierParam
              );
              setSupplierItems(items.map((item: any) => ({
                internalCode: item.internalCode || '',
                productName: item.productName || '',
                qty: item.quantity || '',
                uom: item.uom || '',
                specifications: item.specifications || '',
                remarks: '',
                rate: ''
              })));
            }
          })
          .catch((err) => {
            console.error('Error loading supplier items:', err);
            toast.error('Failed to load items');
          })
          .finally(() => setLoadingSupplierData(false));
      }
    }, [isSupplierView, quotationParam, supplierParam]);



    // Latest quotation nos from Quotation sheet (if needed later)
    useEffect(() => {
      const fetchLatestQuotationNumbers = async () => {
        try {
          const quotationHistory = await fetchSheet('QUOTATION HISTORY');
          if (Array.isArray(quotationHistory)) {
            const quotationNos = quotationHistory
              .map((row: any) => row.quatationNo || row.quotationNo || '')
              .filter((no: string) => no && no.trim() !== '');
            setLatestQuotationNumbers(quotationNos);
          }
        } catch (error) {
          console.error('Error fetching quotation numbers:', error);
        }
      };
      fetchLatestQuotationNumbers();
    }, []);

    useEffect(() => {
      const fetchMasterSuppliers = async () => {
        try {
          const masterData = await fetchSheet('MASTER');
    
          let vendorsArray: any[] = [];
          if (masterData && typeof masterData === 'object' && 'vendors' in masterData) {
            vendorsArray = masterData.vendors || [];
          } else if (Array.isArray(masterData)) {
            vendorsArray = masterData;
          }
    
          const suppliers: MasterSheetSupplier[] = vendorsArray
            .map((vendor: any) => ({
              supplierName: vendor.vendorName || vendor.supplierName || '',
              vendorGstin: vendor.gstin || vendor.vendorGstin || '',
              vendorAddress: vendor.address || vendor.vendorAddress || '',
              email: vendor.email || vendor.vendorEmail || '', // Email भी include करें
            }))
            .filter((s) => s.supplierName && typeof s.supplierName === 'string' && s.supplierName.trim() !== '');
    
          setMasterSuppliers(suppliers);
    
          if (suppliers.length === 0) {
            toast.warning('No suppliers found in MASTER sheet');
          } else {
            toast.success(`Loaded ${suppliers.length} suppliers`);
          }
        } catch (error) {
          console.error('Error fetching MASTER suppliers:', error);
          toast.error('Failed to load suppliers from MASTER sheet');
        }
      };
    
      fetchMasterSuppliers();
    }, [details]);

    // Eligible items (planned2 not null & actual2 null)
    const eligibleItems = useMemo(
      () =>
        indentSheet
          .filter((item) => {
            const planned2NotNull =
              item.planned2 !== null && item.planned2 !== undefined && item.planned2 !== '';
            const actual2IsNull =
              item.actual2 === null || item.actual2 === undefined || item.actual2 === '';
            return planned2NotNull && actual2IsNull;
          })
          .reverse(),
      [indentSheet],
    );

    const form = useForm<QuotationForm>({
      resolver: zodResolver(quotationSchema),
      defaultValues: {
        quotationNumber: '',
        quotationDate: new Date(),
        suppliers: [],
        description: '',
        selectedIndents: [],
        terms: details?.defaultTerms || [],
      },
    });

    useEffect(() => {
    if (details?.defaultTerms) {
      form.setValue('terms', details.defaultTerms);
    }
  }, [details]);

  // Auto-generate quotation no in create mode
  useEffect(() => {
    if (mode === 'create') {
      const allNumbers = [
        ...filterUniqueQuotationNumbers(poMasterSheet),
        ...latestQuotationNumbers,
      ];
      const nextNumber = generateNextQuotationNumber(allNumbers);
      form.setValue('quotationNumber', nextNumber);
    }
  }, [mode, poMasterSheet, latestQuotationNumbers, form]);

  // Supplier multi-select

  const handleSupplierSelect = (supplierName: string) => {
  setSelectedSuppliers((prev) => {
    const newSuppliers = prev.includes(supplierName)
      ? prev.filter((s) => s !== supplierName)
      : [...prev, supplierName];

    form.setValue('suppliers', newSuppliers);

    const infos = newSuppliers.map((name) => {
      const masterSupplier = masterSuppliers.find((s) => s.supplierName === name);
      return {
        name,
        address: masterSupplier?.vendorAddress || '',
        gstin: masterSupplier?.vendorGstin || '',
        email: masterSupplier?.email || '', // Email भी fetch करें
      };
    });
    setSupplierInfos(infos);

    return newSuppliers;
  });
};

  // Item checkboxes
  const handleItemSelection = (indentNumber: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, indentNumber] : prev.filter((id) => id !== indentNumber),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(eligibleItems.map((i) => i.indentNumber));
    } else {
      setSelectedItems([]);
    }
  };

  useEffect(() => {
    form.setValue('selectedIndents', selectedItems);
  }, [selectedItems, form]);

  useFieldArray({
    control: form.control as Control<FieldValues>,
    name: 'terms',
  });


  function generateEmailHTML(
    quotationNumber: string,
    items: any[],
    workerName: string,
    companyDetails: any,
    supplier: SupplierInfo
  ): string {
    const baseUrl = '/updaterate';
  
  const url = `${baseUrl}?updaterate=${quotationNumber}&supplier=${encodeURIComponent(
    supplier.name,
  )}`;
  
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border: 1px solid #ddd;
          }
          .email-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
            line-height: 1.8;
          }
          .email-header p {
            margin: 5px 0;
          }
          .email-body {
            padding: 30px 20px;
            font-size: 14px;
          }
          .email-body p {
            margin: 15px 0;
          }
          .party-name {
            background: #0066cc;
            color: white;
            padding: 8px 16px;
            display: inline-block;
            font-weight: 600;
            margin-top: 10px;
          }
          .link {
            color: #0066cc;
            text-decoration: underline;
          }
          .signature {
            margin-top: 30px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <p><strong>From:</strong> &lt;developer2@botivate.in&gt;</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
            <p><strong>Subject:</strong> Request For Pricing on Quotation ${quotationNumber}</p>
            <p><strong>To:</strong> &lt;${supplier.email}&gt;</p>
          </div>
          
          <div class="email-body">
            <p>Dear ${supplier.name},</p>
            
            <p>Please update your rates by clicking the following link: 
              <a href="${url}" class="link">Click here</a>
            </p>
            
            <div class="signature">
              <p>Best regards,</p>
              <div class="party-name">${companyDetails?.companyName || 'Botivate Services LLP'}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  


  async function onSubmit(values: QuotationForm) {
    try {
      if (selectedItems.length === 0) {
        toast.error('Please select at least one item');
        return;
      }
      if (selectedSuppliers.length === 0) {
        toast.error('Please select at least one supplier');
        return;
      }
  
      const selectedItemsData = eligibleItems.filter((item) =>
        selectedItems.includes(item.indentNumber),
      );
  
      const allRows: QuotationVendorSheetRow[] = [];
  
      // For each selected supplier, push A–F rows
      for (const supplier of supplierInfos) {
        if (!supplier.name) continue;
  
        const supplierRows: QuotationVendorSheetRow[] = selectedItemsData.map((item) => ({
          internalCode: item.indentNumber,
          productName: item.productName,
          quantity: String(item.quantity || ''),
          uom: item.uom || '',
          specifications: item.specifications || '',
          vendorName: supplier.name,
        }));
  
        allRows.push(...supplierRows);
      }
  
      if (allRows.length === 0) {
        toast.error('No rows to insert');
        return;
      }
  
      // Insert into Quotation Vendor sheet (A–F)
      await postToSheet(allRows, 'insertQuotation', 'QUOTATION HISTORY');
  
      const emailPromises = supplierInfos.map(async (supplier) => {
        console.log('Supplier Info:', supplier);
        
        if (!supplier.email) {
          console.error(`NO EMAIL for supplier: ${supplier.name}`);
          toast.error(`No email for ${supplier.name}`);
          return null;
        }
      
        console.log(`Sending email to: ${supplier.email}`);
      
        const emailHtml = generateEmailHTML(
          values.quotationNumber || '',
          selectedItemsData,
          "Science Services LLC",
          details,
          supplier
        );
      
        console.log('Email HTML length:', emailHtml.length);
      
        try {
          const result = await postToSheet(
            [],
            'sendSupplierEmail',
            'QUOTATION HISTORY',
            {
              quotationNumber: values.quotationNumber || '',
              htmlContent: emailHtml,
              subject: `Request For Pricing on Quotation ${values.quotationNumber || ''}`,
              supplierName: supplier.name,
              supplierEmail: supplier.email,
              items: selectedItems,
              sendAsHtml: true,      // ← YE NAYA ADD KIYA
              attachPdf: false,
            }
          );
          
          console.log('Email API Result:', result);
          
          if (result.success) {
            toast.success(`Email sent to ${supplier.name}`);
          } else {
            toast.error(`Failed to send email to ${supplier.name}: ${result.error}`);
          }
          
          return result;
        } catch (error) {
          console.error('Email sending API error:', error);
          toast.error(`API error for ${supplier.name}: ${error.message}`);
          return null;
        }
      });
  
      // Wait for all emails to be sent
      const emailResults = await Promise.all(emailPromises);
      const successfulEmails = emailResults.filter(r => r && r.success).length;
      
      if (successfulEmails > 0) {
        toast.success(`Emails sent to ${successfulEmails} supplier(s)`);
      } else {
        toast.warning('Quotation saved but no emails were sent');
      }
  
      toast.success(
        `Saved ${allRows.length} row(s) for ${selectedSuppliers.length} supplier(s)`,
      );
  
      form.reset();
      setSelectedItems([]);
      setSelectedSuppliers([]);
      setSupplierInfos([]);
  
      setTimeout(() => {
        updatePoMasterSheet();
        updateIndentSheet();
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save quotation: ' + (err as Error).message);
    }
  }

  function onError(e: any) {
    console.log('Form errors:', e);
    toast.error('Please check the form');
  }

  // NEW: Supplier rate update handlers
  const handleSupplierRateUpdate = (index: number, field: 'remarks' | 'rate', value: string) => {
    setSupplierItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSupplierSubmit = async () => {
    try {
      const result = await postToSheet(
        supplierItems,
        'updateSupplierRates',
        'QUOTATION HISTORY',
        {
          quotationNumber: quotationParam,
          supplierName: supplierParam,
        }
      );

      if (result.success) {
        toast.success('Rates updated successfully!');
      } else {
        toast.error('Failed to update rates');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating rates');
    }
  };


  

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-blue-50 rounded-md flex flex-col">
      <div className="flex justify-between p-5 w-full flex-shrink-0">
        <div className="flex gap-2 items-center">
          <FilePlus2 size={50} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Create Quotation</h1>
            <p className="text-muted-foreground text-sm">
              Select eligible indents and vendors, data will be saved A–F columns
            </p>
          </div>
        </div>
        <SidebarTrigger />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-6xl w-full mx-auto">
          <Tabs
            defaultValue="create"
            onValueChange={(v) => setMode(v === 'create' ? 'create' : 'revise')}
          >
            <TabsList className="h-10 w-full rounded-none">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="revise">Revise</TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="flex flex-col items-center"
            >
              <div className="space-y-4 p-4 w-full bg-white shadow-md rounded-sm mt-4">
                {/* Company header */}
                <div className="flex items-center justify-center gap-4 bg-blue-50 p-4 rounded">
                  <img
                    src="/logo.png"
                    alt="Company Logo"
                    className="w-20 h-20 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-2xl font-bold">{details?.companyName}</h1>
                    <div>
                      <p className="text-sm">{details?.companyAddress}</p>
                      <p className="text-sm">Phone No: +{details?.companyPhone}</p>
                    </div>
                  </div>
                </div>

                <hr />
                <h2 className="text-center font-bold text-lg">Quotation</h2>
                <hr />

                {/* Suppliers */}
                <div className="grid gap-5 px-4 py-2 text-foreground/80">
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="suppliers"
                      render={() => (
                        <FormItem>
                          <FormLabel>Suppliers (from MASTER)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Select onValueChange={handleSupplierSelect}>
                                <SelectTrigger size="sm" className="w-full">
                                  <SelectValue placeholder="Select suppliers" />
                                </SelectTrigger>
                                <SelectContent className="z-[100] max-h-[300px]">
                                  {masterSuppliers.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      No suppliers found
                                    </SelectItem>
                                  ) : (
                                    masterSuppliers.map((s, i) => (
                                      <SelectItem key={i} value={s.supplierName}>
                                        {s.supplierName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>

                              {selectedSuppliers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {selectedSuppliers.map((supplier, index) => (
                                    <Badge
                                      key={index}
                                      onClick={() => handleSupplierSelect(supplier)}
                                      className="flex items-center gap-1"
                                    >
                                      {supplier}
                                      <span className="ml-1 text-xs">×</span>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {supplierInfos.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          Selected Supplier Details (FROM MASTER):
                        </h4>
                        {supplierInfos.map((s, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 p-3 rounded border text-sm"
                          >
                            <div className="grid grid-cols-3 gap-x-4">
                              <div>
                                <span className="font-medium">Name:</span> {s.name}
                              </div>
                              <div>
                                <span className="font-medium">Address:</span> {s.address}
                              </div>
                              <div>
                                <span className="font-medium">GSTIN:</span> {s.gstin}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-3">
                  <Card className="p-0 shadow-xs rounded-[3px]">
                    <CardHeader className="bg-muted px-5 py-2">
                      <CardTitle className="text-center">Our Commercial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-sm">
                      <p>
                        <span className="font-medium">GSTIN</span> {details?.companyGstin}
                      </p>
                      <p>
                        <span className="font-medium">Pan No.</span> {details?.companyPan}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="p-0 shadow-xs rounded-[3px]">
                    <CardHeader className="bg-muted px-5 py-2">
                      <CardTitle className="text-center flex items-center justify-between">
                        Billing Address
                        <EditIconButton
                          editing={isEditingBilling}
                          onClick={() => {
                            if (isEditingBilling) toast.success('Billing address updated');
                            setIsEditingBilling(!isEditingBilling);
                          }}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-sm">
                      <p>M/S {details?.companyName}</p>
                      {isEditingBilling ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={billingAddress}
                            onChange={(e) => setBillingAddress(e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Enter billing address"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingBilling(false);
                                toast.success('Billing address updated');
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingBilling(false)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash size={12} className="text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <p>{billingAddress}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="p-0 shadow-xs rounded-[3px]">
                    <CardHeader className="bg-muted px-5 py-2">
                      <CardTitle className="text-center flex items-center justify-between">
                        Destination Address
                        <EditIconButton
                          editing={isEditingDestination}
                          onClick={() => {
                            if (isEditingDestination)
                              toast.success('Destination address updated');
                            setIsEditingDestination(!isEditingDestination);
                          }}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-sm">
                      <p>M/S {details?.companyName}</p>
                      {isEditingDestination ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={destinationAddress}
                            onChange={(e) => setDestinationAddress(e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Enter destination address"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingDestination(false);
                                toast.success('Destination address updated');
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDestination(false)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash size={12} className="text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <p>{destinationAddress}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <hr />

                {/* Description if needed */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter message (optional)"
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <hr />

                {/* Items table */}
                <div className="mx-4 grid">
                  <div className="rounded-[3px] w-full min-w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                selectedItems.length === eligibleItems.length &&
                                eligibleItems.length > 0
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>S/N</TableHead>
                          <TableHead>Internal Code</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eligibleItems.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-muted-foreground"
                            >
                              No eligible items found (planned2 NOT NULL & actual2 NULL)
                            </TableCell>
                          </TableRow>
                        ) : (
                          eligibleItems.map((item, index) => (
                            <TableRow key={item.indentNumber}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.includes(item.indentNumber)}
                                  onCheckedChange={(checked) =>
                                    handleItemSelection(
                                      item.indentNumber,
                                      checked as boolean,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{item.indentNumber}</TableCell>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>
                                {item.specifications || (
                                  <span className="text-muted-foreground">
                                    No Description
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.uom}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="grid grid-cols-2 gap-3 p-3 w-full max-w-6xl bg-background my-5 shadow-md rounded-md">
                <Button
                  type="reset"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedItems([]);
                    setSelectedSuppliers([]);
                    setSupplierInfos([]);
                  }}
                >
                  Reset
                </Button>

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader size={20} color="white" aria-label="Loading Spinner" />
                  )}
                  Save Quotation Items (A–F)
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
