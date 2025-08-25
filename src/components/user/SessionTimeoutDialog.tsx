
"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface SessionTimeoutDialogProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export function SessionTimeoutDialog({ isOpen, onStayLoggedIn, onLogout }: SessionTimeoutDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
          </div>
          <AlertDialogTitle className="text-center">Are you still there?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            For your security, your session will log out in 1 minute due to inactivity. Unsaved cashback actions may be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogAction onClick={onStayLoggedIn} className="w-full">
            Stay Logged In
          </AlertDialogAction>
          <AlertDialogCancel onClick={onLogout} className="w-full mt-0">
            Log Out Now
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
