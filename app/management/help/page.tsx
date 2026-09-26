import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpFaq, MANAGEMENT_FAQS } from "@/components/supervise/help-faq";
import { LifeBuoy, Mail } from "lucide-react";

export default function ManagementHelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get help with managing Supervise OS and administrative activities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="size-4" /> Help Center
          </CardTitle>
          <CardDescription>Find answers to common questions about Supervise OS.</CardDescription>
        </CardHeader>
        <CardContent>
          <HelpFaq items={MANAGEMENT_FAQS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" /> Contact Support
          </CardTitle>
          <CardDescription>Get assistance with technical or administrative issues.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" asChild>
            <a href="mailto:support@superviseos.edu">Contact Support</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
