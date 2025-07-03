'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ExternalLinkButtonProps {
  url: string;
  platform: string;
}

export function ExternalLinkButton({ url, platform }: ExternalLinkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Open in a new tab without referrer to bypass blocking
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.opener = null;
      newWindow.location.href = url;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'wg_gesucht':
        return 'WG-Gesucht';
      case 'immoscout24':
        return 'ImmoScout24';
      case 'kleinanzeigen':
        return 'Kleinanzeigen';
      case 'immowelt':
        return 'Immowelt';
      case 'immonet':
        return 'Immonet';
      default:
        return platform;
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleClick}
    >
      View on {getPlatformName()}
      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
    </Button>
  );
}