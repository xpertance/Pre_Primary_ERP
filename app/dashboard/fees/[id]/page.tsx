import StudentFeeDetails from "@/components/admin/StudentFeeDetails";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function StudentFeeDetailsPage({ params }: Props) {
    const resolvedParams = await params;
    return <StudentFeeDetails studentId={resolvedParams.id} />;
}
