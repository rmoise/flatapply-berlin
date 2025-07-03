'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { saveListing, unsaveListing } from '@/features/listings/actions';
import { toast } from "sonner";

interface ListingDetailActionsProps {
  userId: string;
  listingId: string;
  initialSaved: boolean;
}

export function ListingDetailActions({ 
  userId, 
  listingId, 
  initialSaved 
}: ListingDetailActionsProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        const result = await unsaveListing(userId, listingId);
        if (result.success) {
          setIsSaved(false);
          toast.success("Listing removed from saved");
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await saveListing(userId, listingId);
        if (result.success) {
          setIsSaved(true);
          toast.success("Listing saved");
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this apartment',
        url: window.location.href,
      }).catch(() => {
        // User cancelled or error
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSave}
        disabled={isLoading}
      >
        <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current text-red-500' : ''}`} />
        {isSaved ? 'Saved' : 'Save'}
      </Button>
    </div>
  );
}