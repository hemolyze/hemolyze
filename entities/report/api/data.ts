import { connect } from "@/lib/db";
import Report, { IReport } from "@/lib/models/Report";
import { processReport } from "@/lib/report-processor";
import { notFound } from 'next/navigation';
import mongoose from "mongoose";

/**
 * Fetches report data by ID. If the report is pending,
 * it triggers the processing and returns the updated report.
 * Throws an error handled by notFound() if the report doesn't exist.
 */
export async function getReportData(id: string): Promise<IReport> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log(`Invalid report ID format: ${id}`);
        notFound();
    }

    await connect();

    let report = await Report.findById(id).lean<IReport>();

    if (!report) {
        console.log(`Report not found for ID: ${id}`);
        notFound();
    }

    console.log(`Report ${id} found. Status: ${report.processingStatus}`);

    if (report.processingStatus === 'pending') {
        console.log(`Report ${id} is pending. Triggering processing...`);
        try {
            await processReport(id);
            console.log(`Processing finished for report ${id}. Re-fetching data...`);
            report = await Report.findById(id).lean<IReport>();

            if (!report) {
                 console.error(`Report ${id} disappeared after processing attempt.`);
                 // Throw an error here instead of calling notFound again,
                 // as something unexpected happened post-processing.
                 throw new Error(`Failed to re-fetch report ${id} after processing.`);
            }
             console.log(`Report ${id} re-fetched. New status: ${report.processingStatus}`);
        } catch (error) {
             console.error(`Error occurred during processReport call for ${id}:`, error);
             // Decide how to handle: re-throw, return original pending, or call notFound?
             // For now, let's throw to indicate a processing failure during page load.
             throw new Error(`Processing failed for report ${id}: ${error instanceof Error ? error.message : error}`);
        }
    }

    // Final check to satisfy TypeScript before returning
    if (!report) {
        console.error(`Report became null unexpectedly before returning for ID: ${id}`);
        // This case should ideally be unreachable due to earlier checks/throws
        throw new Error(`Unexpected error fetching report ${id}.`);
    }

    return report;
} 