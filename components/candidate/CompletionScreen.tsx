import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  candidateName: string;
  jobTitle: string;
  isExpired?: boolean;
}

export default function CompletionScreen({ candidateName, jobTitle, isExpired }: Props) {
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-rose-900/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-9 w-9 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Expired</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            This interview link has expired. Please contact the recruiter for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Interview Complete
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-8">
          Thank you, <span className="text-white">{candidateName}</span>. Your interview for{" "}
          <span className="text-white">{jobTitle}</span> has been recorded and sent to the recruiting team.
        </p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 text-left space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">What happens next</p>
          {[
            "Your responses are being analyzed by our AI",
            "The recruiting team will review your evaluation",
            "You'll hear back within the timeline they specified",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
              <div className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-8">
          Powered by Charlie · AI Recruitment Screening
        </p>
      </div>
    </div>
  );
}
