import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import TransactionReview from "./TransactionReview";

export default function UploadTransactionsModal({ open, onOpenChange }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [step, setStep] = useState("upload"); // upload, processing, review

  async function handleFileUpload(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setStep("processing");

    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const fileUrl = uploadResult.file_url;

      // Extract data using OCR/AI
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this receipt or bank statement image and extract ALL transactions. 
For each transaction, provide:
- date (YYYY-MM-DD format)
- merchant (store/service name)
- amount (numeric value only, no currency symbol)
- type (income or expense)
- category (one of: food, transport, utilities, shopping, subscription, salary, other)
- description (brief note about the transaction)

Return as a JSON array of transaction objects.
If there are multiple transactions, include all of them.
Return ONLY the JSON array, no other text.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  merchant: { type: "string" },
                  amount: { type: "number" },
                  type: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
      });

      // Fetch existing transactions for matching
      const existingTransactions = await base44.entities.Transaction.list("-updated_date", 1000);

      // Process and match extracted data
      const processed = (extractionResult.transactions || []).map((tx) => {
        // Check for duplicates
        const isDuplicate = existingTransactions?.some(
          (existing) =>
            existing.amount === tx.amount &&
            existing.date === tx.date &&
            existing.note?.toLowerCase() === tx.merchant?.toLowerCase()
        );

        return {
          ...tx,
          id: `new_${Date.now()}_${Math.random()}`,
          status: isDuplicate ? "duplicate" : "new",
          confirmed: false,
        };
      });

      setExtractedTransactions(processed);
      setStep("review");
    } catch (error) {
      console.error("Error processing file:", error);
      setStep("upload");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTransactions(toSave) {
    setLoading(true);
    try {
      // Create confirmed transactions
      await base44.entities.Transaction.bulkCreate(
        toSave.map((tx) => ({
          date: tx.date,
          type: tx.type,
          category: tx.category,
          note: tx.merchant,
          amount: tx.amount,
        }))
      );

      // Reset and close
      setExtractedTransactions([]);
      setFile(null);
      setStep("upload");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a receipt or bank statement. We'll extract and verify transaction details for you.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center hover:border-[#FF6A00] transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-8 h-8 text-[#8FA4C8] mx-auto mb-3" />
              <p className="font-semibold text-[#1A1A1A] mb-1">Upload Receipt or Statement</p>
              <p className="text-sm text-[#8FA4C8]">PNG, JPG, or PDF files supported</p>
              <input
                id="file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0]">
                <FileText className="w-5 h-5 text-[#FF6A00]" />
                <span className="text-sm text-[#1A1A1A] flex-1">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-[#8FA4C8] hover:text-[#1A1A1A]"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
            <p className="text-[#1A1A1A] font-medium">Analyzing your document...</p>
            <p className="text-sm text-[#8FA4C8]">Extracting transaction details with AI</p>
          </div>
        )}

        {step === "review" && (
          <TransactionReview
            transactions={extractedTransactions}
            onConfirm={handleConfirmTransactions}
            onCancel={() => {
              setStep("upload");
              setExtractedTransactions([]);
              setFile(null);
            }}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}