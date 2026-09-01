import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpFaq } from "@/components/supervise/help-faq";
import { LifeBuoy, Mail } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find answers or get help with your project.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="size-4" /> Help Center
          </CardTitle>
          <CardDescription>Find answers to common questions about your project and Supervise OS.</CardDescription>
        </CardHeader>
        <CardContent>
          <HelpFaq />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" /> Contact Support
          </CardTitle>
          <CardDescription>Can&apos;t find what you&apos;re looking for? Reach out to the project support team.</CardDescription>
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
