import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WhatsAppThankYouProps {
  open: boolean;
  onClose: () => void;
  customerPhone: string;
  customerName: string;
}

export default function WhatsAppThankYou({ open, onClose, customerPhone, customerName }: WhatsAppThankYouProps) {
  const sendThankYou = () => {
    const cleaned = customerPhone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Thank you for shopping with us, ${customerName}! Hope you love your new saree. 🙏✨`
    );
    window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle className="font-display">Sale Recorded! 🎉</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Send a Thank You message to <span className="font-semibold text-foreground">{customerName}</span>?
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={sendThankYou}
            className="w-full gap-2 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white border-0"
          >
            <MessageCircle className="h-4 w-4" />
            Send on WhatsApp
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
