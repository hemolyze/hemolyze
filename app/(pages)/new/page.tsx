import FileUploadCard from "@/features/report-upload/components/FileUploadCard";

export default function NewReportPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 items-center justify-center p-8 md:p-12 lg:p-16">
        <FileUploadCard />
      </main>
    </div>
  );
} 