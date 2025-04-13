"use client"

import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger, DialogDescription } from "@/shared/components/ui/dialog"

const TestInfoDialog = ({ testDetails }: {
    // testId: string, // Removed - available in testDetails
    // testName: string, // Removed - available in testDetails
    patientDetails?: {
        name: string,
        age: number,
        gender: string,
    },
    testDetails: {
        testName: string,
        testId: string,
        result: string,
        unit: string,
        referenceRange: {
            min: number,
            max: number,
        },
    }
}) => {
    const patientDetails = {
        name: "John Doe",
        age: 30,
        gender: "Male",
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="p-2 text-xs"
                    onClick={() => console.log("Learn more clicked for:", testDetails.testName)} // Placeholder action
                >
                    Learn more
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{testDetails.testName} Information</DialogTitle>
                    <DialogDescription>
                        Detailed information about the {testDetails.testName} test for {patientDetails.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <h3 className="font-semibold">Test Details {testDetails.testId}</h3>
                    <p><strong>Test ID:</strong> {testDetails.testId}</p>
                    <p><strong>Result:</strong> {testDetails.result} {testDetails.unit}</p>
                    <p><strong>Reference Range:</strong> {testDetails.referenceRange.min} - {testDetails.referenceRange.max} {testDetails.unit}</p>

                    <h3 className="font-semibold mt-4">Patient Information</h3>
                    <p><strong>Name:</strong> {patientDetails?.name || "N/A"}</p>
                    <p><strong>Age:</strong> {patientDetails?.age || "N/A"}</p>
                    <p><strong>Gender:</strong> {patientDetails?.gender || "N/A"}</p>

                    {/* Add more educational content here based on testId/testName if needed */}
                </div>
                {/* Optionally add DialogFooter with actions */}
            </DialogContent>
        </Dialog>
    )
}

export default TestInfoDialog