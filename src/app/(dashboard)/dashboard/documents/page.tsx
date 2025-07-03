import { DocumentManagerFinal } from "@/features/documents/components/document-manager-final"

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Manage your rental documents for apartment applications
        </p>
      </div>

      {/* Main Content */}
      <DocumentManagerFinal />
    </div>
  )
}