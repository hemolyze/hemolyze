"use client"

import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger, DialogDescription } from "@/shared/components/ui/dialog"
import { InfoIcon } from "lucide-react"
import { useState } from "react"
import { getTestActionDetails } from "../api/actions"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define the type for the educational info structure based on the schema
// (Ideally, this would be imported from a shared types file or the model file)
type BloodTestEducationalInfo = {
    testName: string;
    whatItIs: {
        definition: string;
        purpose: string;
        bodySystem?: string;
    };
    understandingResults: {
        normalRangeExplanation: string;
        unitsExplained?: string;
    };
    abnormalResults?: { // Make optional as it depends on result
        low?: {
            title: string;
            potentialCauses: string;
            potentialImplications: string;
        };
        high?: {
            title: string;
            potentialCauses: string;
            potentialImplications: string;
        };
        generalDisclaimer: string;
    };
    symptomsAndActions?: { // Make optional
        associatedSymptoms?: string;
        whenToSeekHelp: string;
    };
    lifestyleTips?: { // Make optional
        title: string;
        generalTips: string;
        preventionFocus?: string;
        disclaimer: string;
    };
    additionalResources?: { // Make optional
        glossary?: Array<{ term: string; definition: string }>;
        faq?: Array<{ question: string; answer: string }>;
        finalDisclaimer: string;
    };
};

// State type for managing fetch status
type EducationalInfoState = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any | null; // Using any because the DB field is Mixed/z.any()
    isLoading: boolean;
    error: string | null;
};

const TestInfoDialog = ({ reportId, testDetails, patientDetails, cardStyle }: {
    reportId: string; // Assuming reportId is passed as a prop
    testDetails: {
        _id?: string; // Expecting the unique ID of the test result
        testName: string;
        testId: string; // Keep original testId if needed elsewhere
        result: string;
        unit: string;
        referenceRange: {
            min: number | string; // Allow string based on schema
            max: number | string; // Allow string based on schema
        };
    };
    patientDetails?: { // Make optional as it might not always be available/needed for context
        name: string;
        age: number;
        gender: string;
    };
    cardStyle?: boolean;
}) => {
    console.log('testDetails', {
        reportId,
        testDetails,
        patientDetails,
    });
    const [infoState, setInfoState] = useState<EducationalInfoState>({
        data: null,
        isLoading: false,
        error: null,
    });

    const fetchEducationalInfo = async () => {
        if (!testDetails.testId) {
            setInfoState({ data: null, isLoading: false, error: "Test unique ID is missing." });
            return;
        }
        setInfoState({ data: null, isLoading: true, error: null });
        try {
            // Pass reportId, testDetails._id, and optional patientDetails
            // @ts-expect-error - improve type inference
            const result = await getTestActionDetails(reportId, testDetails.testId, patientDetails, testDetails);
            if (result.error) {
                setInfoState({ data: null, isLoading: false, error: result.error });
            } else {
                setInfoState({ data: result.data, isLoading: false, error: null });
            }
        } catch (err) {
            console.error("Failed to fetch educational info:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setInfoState({ data: null, isLoading: false, error: `Client-side error: ${errorMessage}` });
        }
    };

    const handleOpenChange = (open: boolean) => {
        // Fetch data only when opening and if data isn't already loaded/loading
        if (open && !infoState.data && !infoState.isLoading) {
            fetchEducationalInfo();
        }
        // Optional: Reset state when closing to refetch next time?
        // if (!open) {
        //   setInfoState({ data: null, isLoading: false, error: null });
        // }
    };

    const renderContent = () => {
        if (infoState.isLoading) {
            return (
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-1/2 mt-6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            );
        }

        if (infoState.error) {
            return (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{infoState.error}</AlertDescription>
                </Alert>
            );
        }

        // Assuming data structure matches BloodTestEducationalInfo (or is a string if fallback)
        const educationalInfo = infoState.data as BloodTestEducationalInfo | string | null;

        if (!educationalInfo) {
            return <p className="mt-4 text-muted-foreground">No information available.</p>;
        }

        // Handle simple string case if AI failed to generate structure previously
        if (typeof educationalInfo === 'string') {
            return <div className="mt-4 space-y-2 whitespace-pre-wrap">{educationalInfo}</div>;
        }

        // Render structured data
        return (
            <div className="mt-4 space-y-6 text-sm max-h-[70vh] overflow-y-auto pr-2">
                {/* What it is */}
                <section>
                    <h3 className="font-semibold text-base mb-2">
                        Understanding {educationalInfo.testName}
                    </h3>
                    <p>
                        <strong>What it is:</strong> {educationalInfo.whatItIs.definition}
                    </p>
                    <p>
                        <strong>Why it&apos;s tested:</strong> {educationalInfo.whatItIs.purpose}
                    </p>
                    {educationalInfo.whatItIs.bodySystem && (
                        <p>
                            <strong>Related Body System:</strong>{" "}
                            {educationalInfo.whatItIs.bodySystem}
                        </p>
                    )}
                </section>

                {/* Understanding Results */}
                <section>
                    <h3 className="font-semibold text-base mb-2">
                        Understanding Your Results
                    </h3>
                    <p>{educationalInfo.understandingResults.normalRangeExplanation}</p>
                    {educationalInfo.understandingResults.unitsExplained && (
                        <p className="text-xs text-muted-foreground mt-1">
                            ({educationalInfo.understandingResults.unitsExplained})
                        </p>
                    )}
                    {/* Display the actual result and range */}
                    <p className="mt-2 p-2 bg-secondary rounded">
                        Your Result: <strong>{testDetails.result} {testDetails.unit}</strong> <br />
                        Reference Range: {testDetails.referenceRange.min} - {testDetails.referenceRange.max} {testDetails.unit}
                    </p>
                </section>

                {/* Abnormal Results */}
                {educationalInfo.abnormalResults && (
                    <section>
                        <h3 className="font-semibold text-base mb-2">
                            About Your Result Level
                        </h3>
                        {educationalInfo.abnormalResults.low && (
                            <div className="mb-3 p-3 border rounded">
                                <h4 className="font-medium mb-1">{educationalInfo.abnormalResults.low.title}</h4>
                                <p><strong>Potential Causes:</strong> {educationalInfo.abnormalResults.low.potentialCauses}</p>
                                <p><strong>Potential Implications:</strong> {educationalInfo.abnormalResults.low.potentialImplications}</p>
                            </div>
                        )}
                        {educationalInfo.abnormalResults.high && (
                            <div className="mb-3 p-3 border rounded">
                                <h4 className="font-medium mb-1">{educationalInfo.abnormalResults.high.title}</h4>
                                <p><strong>Potential Causes:</strong> {educationalInfo.abnormalResults.high.potentialCauses}</p>
                                <p><strong>Potential Implications:</strong> {educationalInfo.abnormalResults.high.potentialImplications}</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground italic">{educationalInfo.abnormalResults.generalDisclaimer}</p>
                    </section>
                )}

                {/* Symptoms and Actions */}
                {educationalInfo.symptomsAndActions && (
                    <section>
                        <h3 className="font-semibold text-base mb-2">
                            Symptoms & When to Seek Help
                        </h3>
                        {educationalInfo.symptomsAndActions.associatedSymptoms && (
                            <p className="mb-2"><strong>Potential Associated Symptoms:</strong> {educationalInfo.symptomsAndActions.associatedSymptoms}</p>
                        )}
                        <p className="font-medium">{educationalInfo.symptomsAndActions.whenToSeekHelp}</p>
                    </section>
                )}

                {/* Lifestyle Tips */}
                {educationalInfo.lifestyleTips && (
                    <section>
                        <h3 className="font-semibold text-base mb-2">{educationalInfo.lifestyleTips.title}</h3>
                        <p>{educationalInfo.lifestyleTips.generalTips}</p>
                        {educationalInfo.lifestyleTips.preventionFocus && (
                            <p className="mt-2">{educationalInfo.lifestyleTips.preventionFocus}</p>
                        )}
                        <p className="text-xs text-muted-foreground italic mt-2">{educationalInfo.lifestyleTips.disclaimer}</p>
                    </section>
                )}

                {/* Additional Resources */}
                {educationalInfo.additionalResources && (
                    <section className="pt-4 border-t">
                        {educationalInfo.additionalResources.glossary && educationalInfo.additionalResources.glossary.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-1">Glossary</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {educationalInfo.additionalResources.glossary.map(item => (
                                        <li key={item.term}><strong>{item.term}:</strong> {item.definition}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {educationalInfo.additionalResources.faq && educationalInfo.additionalResources.faq.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-1">FAQs</h4>
                                <ul className="space-y-2">
                                    {educationalInfo.additionalResources.faq.map((item, index) => (
                                        <li key={index}>
                                            <p className="font-medium">{item.question}</p>
                                            <p>{item.answer}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="text-xs font-semibold text-destructive mt-4">{educationalInfo.additionalResources.finalDisclaimer}</p>
                    </section>
                )}

            </div>
        );
    };

    return (
        // Use onOpenChange to trigger fetch
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant={`${cardStyle ? 'outline' : 'ghost'}`} className={`${cardStyle ? 'w-full bg-blue-100 border-blue-400 hover:bg-blue-200' : ''}`} aria-label="Test Information">
                    {cardStyle ? <p className="text-xs">Learn More</p> : <InfoIcon className="w-4 h-4" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg"> {/* Increased max width */}
                <DialogHeader>
                    {/* Use test name from testDetails for consistency */}
                    <DialogTitle>{testDetails.testName} - Educational Information</DialogTitle>
                    <DialogDescription>
                        Understanding your &quot;{testDetails.testName}&quot; result.
                    </DialogDescription>
                </DialogHeader>
                {/* Render dynamic content */}
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default TestInfoDialog